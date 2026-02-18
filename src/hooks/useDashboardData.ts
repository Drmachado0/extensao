import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAccounts } from "@/hooks/useAccounts";

export interface DashboardData {
  todayFollows: number;
  todayUnfollows: number;
  todayLikes: number;
  dailyFollowLimit: number;
  dailyUnfollowLimit: number;
  dailyLikeLimit: number;
  queuePending: { follow: number; unfollow: number; like: number; total: number };
  successRate: number;
  totalActions7d: number;
  successActions7d: number;
  accountStatus: "running" | "paused" | "rate_limited" | "offline" | "none";
  accountUsername: string;
  isRunning: boolean;
  chartData: { date: string; follow: number; unfollow: number; like: number }[];
  recentLogs: any[];
  loading: boolean;
}

const todayStart = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

export function useDashboardData() {
  const { user } = useAuth();
  const { accounts, selectedAccountId, setSelectedAccountId, loading: accountsLoading } = useAccounts();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [data, setData] = useState<DashboardData>({
    todayFollows: 0, todayUnfollows: 0, todayLikes: 0,
    dailyFollowLimit: 100, dailyUnfollowLimit: 100, dailyLikeLimit: 200,
    queuePending: { follow: 0, unfollow: 0, like: 0, total: 0 },
    successRate: 0, totalActions7d: 0, successActions7d: 0,
    accountStatus: "none", accountUsername: "",
    isRunning: false,
    chartData: [], recentLogs: [], loading: true,
  });

  const fetchAll = useCallback(async () => {
    if (!user || !selectedAccountId) return;
    const today = todayStart();
    const sevenAgo = daysAgo(7);
    const thirtyAgo = daysAgo(30);

    const [
      followsRes, unfollowsRes, likesRes,
      queueRes,
      success7dRes, total7dRes,
      accountRes, logsRes, chart30dRes,
    ] = await Promise.all([
      // action_log is the actual table name in DB
      supabase.from("action_log").select("id", { count: "exact", head: true }).eq("ig_account_id", selectedAccountId).eq("action_type", "follow").eq("status", "success").gte("executed_at", today),
      supabase.from("action_log").select("id", { count: "exact", head: true }).eq("ig_account_id", selectedAccountId).eq("action_type", "unfollow").eq("status", "success").gte("executed_at", today),
      supabase.from("action_log").select("id", { count: "exact", head: true }).eq("ig_account_id", selectedAccountId).eq("action_type", "like").eq("status", "success").gte("executed_at", today),
      // target_queue uses ig_account_id
      supabase.from("target_queue").select("status").eq("ig_account_id", selectedAccountId).eq("status", "pending"),
      supabase.from("action_log").select("id", { count: "exact", head: true }).eq("ig_account_id", selectedAccountId).eq("status", "success").gte("executed_at", sevenAgo),
      supabase.from("action_log").select("id", { count: "exact", head: true }).eq("ig_account_id", selectedAccountId).gte("executed_at", sevenAgo),
      // ig_accounts is the real table name
      supabase.from("ig_accounts").select("ig_username,bot_status,bot_online,is_active").eq("id", selectedAccountId).maybeSingle(),
      supabase.from("action_log").select("*").eq("ig_account_id", selectedAccountId).order("executed_at", { ascending: false }).limit(20),
      supabase.from("action_log").select("action_type,executed_at,status").eq("ig_account_id", selectedAccountId).gte("executed_at", thirtyAgo).in("action_type", ["follow", "unfollow", "like"]).eq("status", "success"),
    ]);

    // Queue breakdown — target_queue has no action_type column in real schema
    const queueItems = queueRes.data || [];
    const queuePending = {
      follow: 0,
      unfollow: 0,
      like: 0,
      total: queueItems.length,
    };

    // Chart data: group by day (30 days)
    const chartMap: Record<string, { follow: number; unfollow: number; like: number }> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      chartMap[key] = { follow: 0, unfollow: 0, like: 0 };
    }
    (chart30dRes.data || []).forEach((log: any) => {
      const day = (log.executed_at as string)?.slice(0, 10);
      if (day && chartMap[day] && (log.action_type === "follow" || log.action_type === "unfollow" || log.action_type === "like")) {
        chartMap[day][log.action_type as "follow" | "unfollow" | "like"]++;
      }
    });
    const chartData = Object.entries(chartMap).map(([date, vals]) => ({ date, ...vals }));

    const total7d = total7dRes.count ?? 0;
    const success7d = success7dRes.count ?? 0;
    const successRate = total7d > 0 ? Math.round((success7d / total7d) * 100) : 0;

    const account = accountRes.data as any;

    // Determine running state from bot_online / bot_status
    const isRunning = account?.bot_online === true && account?.bot_status === "running";

    // Read limits from ig_accounts settings_json or defaults
    const settings = account?.settings_json as any;

    setData({
      todayFollows: followsRes.count ?? 0,
      todayUnfollows: unfollowsRes.count ?? 0,
      todayLikes: likesRes.count ?? 0,
      dailyFollowLimit: settings?.daily_follow_limit ?? 100,
      dailyUnfollowLimit: settings?.daily_unfollow_limit ?? 100,
      dailyLikeLimit: settings?.daily_like_limit ?? 200,
      queuePending,
      successRate,
      totalActions7d: total7d,
      successActions7d: success7d,
      accountStatus: (account?.bot_status as any) ?? "none",
      accountUsername: account?.ig_username ?? "",
      isRunning,
      chartData,
      recentLogs: logsRes.data || [],
      loading: false,
    });
  }, [user, selectedAccountId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Realtime subscription with debounce
  useEffect(() => {
    if (!user || !selectedAccountId) return;
    const channel = supabase
      .channel("dashboard-realtime")
      .on("postgres_changes" as any, { event: "INSERT", schema: "public", table: "action_log", filter: `ig_account_id=eq.${selectedAccountId}` }, () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => { fetchAll(); }, 2000);
      })
      .subscribe();
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
  }, [user, selectedAccountId, fetchAll]);

  const toggleBot = useCallback(async () => {
    if (!selectedAccountId) return;
    const newRunning = !data.isRunning;
    await supabase
      .from("ig_accounts")
      .update({ bot_online: newRunning, bot_status: newRunning ? "running" : "paused" })
      .eq("id", selectedAccountId);
    setData(prev => ({ ...prev, isRunning: newRunning }));
  }, [selectedAccountId, data.isRunning]);

  return { ...data, accounts, selectedAccountId, setSelectedAccountId, accountsLoading, refetch: fetchAll, toggleBot };
}
