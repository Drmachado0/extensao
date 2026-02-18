import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { startOfDay } from "date-fns";
import { toast } from "sonner";

interface ActionLog {
  id: string;
  action_type: string;
  target_username: string | null;
  status: string;
  executed_at: string;
  details?: any;
}

interface UseRealtimeActionsReturn {
  newActions: ActionLog[];
  todayCount: number;
  lastAction: ActionLog | null;
  refreshKey: number;
}

export function useRealtimeActions(): UseRealtimeActionsReturn {
  const { user } = useAuth();
  const [newActions, setNewActions] = useState<ActionLog[]>([]);
  const [todayCount, setTodayCount] = useState(0);
  const [lastAction, setLastAction] = useState<ActionLog | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const bufferRef = useRef<ActionLog[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial today count
  const fetchTodayCount = useCallback(async () => {
    if (!user) return;
    const todayStart = startOfDay(new Date()).toISOString();
    const { count } = await supabase
      .from("action_log")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "success")
      .gte("executed_at", todayStart);
    setTodayCount(count ?? 0);
  }, [user]);

  useEffect(() => { fetchTodayCount(); }, [fetchTodayCount]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("rt-actions-global")
      .on(
        "postgres_changes" as any,
        { event: "INSERT", schema: "public", table: "action_log", filter: `user_id=eq.${user.id}` },
        (payload: any) => {
          const row = payload.new as ActionLog;
          bufferRef.current.push(row);
          setLastAction(row);

          // Toast for new actions
          const label = row.action_type.replace("_", " ");
          if (row.status === "failed") {
            toast.error(`Ação falhou: ${label}`, { description: row.target_username ? `@${row.target_username}` : undefined });
          } else {
            toast(`Nova ação: ${label}`, { description: row.target_username ? `@${row.target_username}` : undefined, duration: 3000 });
          }

          // Debounce flush at 1 second
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => {
            const batch = [...bufferRef.current];
            bufferRef.current = [];
            setNewActions((prev) => [...batch, ...prev].slice(0, 50));
            setTodayCount((c) => c + batch.filter((a) => a.status === "success").length);
            setRefreshKey((k) => k + 1);
          }, 1000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [user]);

  return { newActions, todayCount, lastAction, refreshKey };
}
