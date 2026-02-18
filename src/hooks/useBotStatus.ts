import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { differenceInMinutes } from "date-fns";
import { toast } from "sonner";

export type BotStatusValue = "online" | "running" | "paused" | "rate_limited" | "challenge_required" | "offline";

interface UseBotStatusReturn {
  isOnline: boolean;
  status: BotStatusValue;
  lastSeen: string | null;
  refreshKey: number;
  currentMode: string | null;
  likesPerFollow: number;
  isProcessing: boolean;
  queueTotal: number;
  queueProcessed: number;
  delayMin: number;
  delayMax: number;
  botSchedule: any | null;
}

export function useBotStatus(igAccountId?: string | null): UseBotStatusReturn {
  const { user } = useAuth();
  const [botOnline, setBotOnline] = useState(false);
  const [botStatus, setBotStatus] = useState<string | null>(null);
  const [lastHeartbeat, setLastHeartbeat] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentMode, setCurrentMode] = useState<string | null>(null);
  const [likesPerFollow, setLikesPerFollow] = useState(2);
  const [queueTotal, setQueueTotal] = useState(0);
  const [queueProcessed, setQueueProcessed] = useState(0);
  const [delayMin, setDelayMin] = useState(25);
  const [delayMax, setDelayMax] = useState(45);
  const [botSchedule, setBotSchedule] = useState<any | null>(null);

  const botOnlineRef = useRef(botOnline);
  const botStatusRef = useRef(botStatus);
  botOnlineRef.current = botOnline;
  botStatusRef.current = botStatus;

  const fetchAccount = useCallback(async () => {
    if (!user) return;
    let query = supabase
      .from("ig_accounts")
      .select("bot_online, bot_status, last_heartbeat, bot_mode, likes_per_follow, queue_total, queue_processed, delay_min, delay_max, bot_schedule");

    if (igAccountId) {
      query = query.eq("id", igAccountId);
    } else {
      query = query.eq("user_id", user.id).eq("is_active", true);
    }

    const { data } = await query.maybeSingle();
    if (data) {
      setBotOnline(data.bot_online ?? false);
      setBotStatus(data.bot_status ?? null);
      setLastHeartbeat(data.last_heartbeat ?? null);
      setCurrentMode((data as any).bot_mode ?? null);
      setLikesPerFollow((data as any).likes_per_follow ?? 2);
      setQueueTotal((data as any).queue_total ?? 0);
      setQueueProcessed((data as any).queue_processed ?? 0);
      setDelayMin((data as any).delay_min ?? 25);
      setDelayMax((data as any).delay_max ?? 45);
      setBotSchedule((data as any).bot_schedule ?? null);
    }
  }, [user, igAccountId]);

  useEffect(() => { fetchAccount(); }, [fetchAccount]);

  useEffect(() => {
    if (!user) return;
    const filter = igAccountId ? `id=eq.${igAccountId}` : `user_id=eq.${user.id}`;
    const channel = supabase
      .channel(`rt-bot-status-${igAccountId || "active"}`)
      .on(
        "postgres_changes" as any,
        { event: "UPDATE", schema: "public", table: "ig_accounts", filter },
        (payload: any) => {
          const row = payload.new;
          const prevOnline = botOnlineRef.current;
          const prevStatus = botStatusRef.current;

          setBotOnline(row.bot_online ?? false);
          setBotStatus(row.bot_status ?? null);
          setLastHeartbeat(row.last_heartbeat ?? null);
          if (row.bot_mode !== undefined) setCurrentMode(row.bot_mode);
          if (row.likes_per_follow !== undefined) setLikesPerFollow(row.likes_per_follow ?? 2);
          if (row.queue_total !== undefined) setQueueTotal(row.queue_total ?? 0);
          if (row.queue_processed !== undefined) setQueueProcessed(row.queue_processed ?? 0);
          if (row.delay_min !== undefined) setDelayMin(row.delay_min ?? 25);
          if (row.delay_max !== undefined) setDelayMax(row.delay_max ?? 45);
          if (row.bot_schedule !== undefined) setBotSchedule(row.bot_schedule);
          setRefreshKey((k) => k + 1);

          if (prevOnline && !row.bot_online) {
            toast.warning("Bot ficou offline", { description: "Verifique a extensão Bridge e o Instagram." });
          }
          if (row.bot_status === "rate_limited" && prevStatus !== "rate_limited") {
            toast.warning("Rate limit detectado", { description: "O bot pausou para proteger sua conta." });
          }
          if (row.bot_status === "challenge_required" && prevStatus !== "challenge_required") {
            toast.error("⚠️ Challenge detectado!", { description: "O Instagram pediu verificação." });
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, igAccountId]);

  useEffect(() => {
    const interval = setInterval(() => setRefreshKey((k) => k + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const isHeartbeatRecent = lastHeartbeat
    ? differenceInMinutes(new Date(), new Date(lastHeartbeat)) <= 5
    : false;

  const isOnline = botOnline && isHeartbeatRecent;

  let derivedStatus: BotStatusValue = "offline";
  if (isOnline) {
    if (botStatus === "running" || botStatus === "processing") derivedStatus = "running";
    else if (botStatus === "paused" || botStatus === "rate_limited" || botStatus === "challenge_required") derivedStatus = botStatus as BotStatusValue;
    else derivedStatus = "online";
  }

  return {
    isOnline, status: derivedStatus, lastSeen: lastHeartbeat, refreshKey,
    currentMode, likesPerFollow, isProcessing: derivedStatus === "running",
    queueTotal, queueProcessed, delayMin, delayMax, botSchedule
  };
}
