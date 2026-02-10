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
  accountStatus: "active" | "paused" | "rate_limited" | "blocked" | "none";
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
      settingsRes, queueRes,
      success7dRes, total7dRes,
      accountRes, logsRes, chart30dRes,
    ] = await Promise.all([
      supabase.from("action_logs").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("account_id", selectedAccountId).eq("action_type", "follow").eq("status", "success").gte("created_at", today),
      supabase.from("action_logs").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("account_id", selectedAccountId).eq("action_type", "unfollow").eq("status", "success").gte("created_at", today),
      supabase.from("action_logs").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("account_id", selectedAccountId).eq("action_type", "like").eq("status", "success").gte("created_at", today),
      supabase.from("action_settings").select("daily_follow_limit,daily_unfollow_limit,daily_like_limit,is_running").eq("user_id", user.id).eq("account_id", selectedAccountId).maybeSingle(),
      supabase.from("target_queue").select("action_type,status").eq("user_id", user.id).eq("account_id", selectedAccountId).eq("status", "pending"),
      supabase.from("action_logs").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("account_id", selectedAccountId).eq("status", "success").gte("created_at", sevenAgo),
      supabase.from("action_logs").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("account_id", selectedAccountId).gte("created_at", sevenAgo),
      supabase.from("instagram_accounts").select("ig_username,status,is_active").eq("id", selectedAccountId).maybeSingle(),
      supabase.from("action_logs").select("*").eq("user_id", user.id).eq("account_id", selectedAccountId).order("created_at", { ascending: false }).limit(20),
      supabase.from("action_logs").select("action_type,created_at,status").eq("user_id", user.id).eq("account_id", selectedAccountId).gte("created_at", thirtyAgo).in("action_type", ["follow", "unfollow", "like"]).eq("status", "success"),
    ]);

    // Queue breakdown
    const queueItems = queueRes.data || [];
    const queuePending = {
      follow: queueItems.filter(q => q.action_type === "follow").length,
      unfollow: queueItems.filter(q => q.action_type === "unfollow").length,
      like: queueItems.filter(q => q.action_type === "like").length,
      total: queueItems.length,
    };

    // Chart data: group by day
    const chartMap: Record<string, { follow: number; unfollow: number; like: number }> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      chartMap[key] = { follow: 0, unfollow: 0, like: 0 };
    }
    (chart30dRes.data || []).forEach((log: any) => {
      const day = log.created_at?.slice(0, 10);
      if (day && chartMap[day] && (log.action_type === "follow" || log.action_type === "unfollow" || log.action_type === "like")) {
        chartMap[day][log.action_type as "follow" | "unfollow" | "like"]++;
      }
    });
    const chartData = Object.entries(chartMap).map(([date, vals]) => ({ date, ...vals }));

    const total7d = total7dRes.count ?? 0;
    const success7d = success7dRes.count ?? 0;
    const successRate = total7d > 0 ? Math.round((success7d / total7d) * 100) : 0;

    const settings = settingsRes.data;
    const account = accountRes.data;

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
      accountStatus: (account?.status as any) ?? "none",
      accountUsername: account?.ig_username ?? "",
      isRunning: settings?.is_running ?? false,
      chartData,
      recentLogs: logsRes.data || [],
      loading: false,
    });
  }, [user, selectedAccountId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Realtime subscription with debounce
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("dashboard-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "action_logs", filter: `user_id=eq.${user.id}` }, () => {
        // Debounce: wait 2s before refetching to avoid rapid re-queries
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => { fetchAll(); }, 2000);
      })
      .subscribe();
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
  }, [user, fetchAll]);

  const toggleBot = useCallback(async () => {
    if (!user || !selectedAccountId) return;
    const newVal = !data.isRunning;
    const { data: existing } = await supabase.from("action_settings").select("id").eq("user_id", user.id).eq("account_id", selectedAccountId).maybeSingle();
    if (existing) {
      await supabase.from("action_settings").update({ is_running: newVal }).eq("id", existing.id);
    } else {
      await supabase.from("action_settings").insert({ user_id: user.id, account_id: selectedAccountId, is_running: newVal });
    }
    setData(prev => ({ ...prev, isRunning: newVal }));
  }, [user, selectedAccountId, data.isRunning]);

  return { ...data, accounts, selectedAccountId, setSelectedAccountId, accountsLoading, refetch: fetchAll, toggleBot };
}
