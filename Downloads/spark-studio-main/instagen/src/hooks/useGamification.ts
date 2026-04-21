import { useEffect, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

/**
 * Curva progressiva: cumulative XP necessário pra atingir level L
 *   L=2 -> 100, L=3 -> 250, L=4 -> 450, L=5 -> 700 ...
 *   diff(L) = 50 * L  ;  cumulativo(L) = 25*L*(L+1) - 50
 */
export function xpForLevel(level: number) {
  if (level <= 1) return 0;
  return 25 * level * (level + 1) - 50;
}

export type UserStats = {
  user_id: string;
  total_xp: number;
  level: number;
  tier: string;
  posts_created: number;
  regenerations: number;
  exports: number;
  login_streak: number;
  brand_completed: boolean;
  last_login_date: string | null;
};

export type Badge = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  rarity: string;
  condition_key: string;
  condition_value: number;
};

export type UserBadge = {
  id: string;
  badge_id: string;
  unlocked_at: string;
};

export type XpEvent = {
  id: string;
  amount: number;
  reason: string;
  metadata: any;
  created_at: string;
};

export type AwardReason =
  | "post_created"
  | "carousel_finalized"
  | "slide_regenerated"
  | "post_exported"
  | "brand_completed"
  | "daily_login";

const REASON_LABEL: Record<string, string> = {
  post_created: "Post criado",
  carousel_finalized: "Carrossel finalizado",
  slide_regenerated: "Slide regenerado",
  post_exported: "Post exportado",
  brand_completed: "Marca completa",
  daily_login: "Login diário",
};

export function useGamification() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const statsQ = useQuery({
    queryKey: ["user_stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_stats" as any)
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as UserStats) ?? null;
    },
  });

  const badgesQ = useQuery({
    queryKey: ["badges_catalog"],
    queryFn: async () => {
      const { data, error } = await supabase.from("badges" as any).select("*").order("condition_value");
      if (error) throw error;
      return (data as unknown as Badge[]) ?? [];
    },
  });

  const userBadgesQ = useQuery({
    queryKey: ["user_badges", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_badges" as any)
        .select("*")
        .order("unlocked_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as UserBadge[]) ?? [];
    },
  });

  // Realtime: stats + badges
  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel(`gamification:${user.id}`);
    ch.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "user_stats", filter: `user_id=eq.${user.id}` },
      () => qc.invalidateQueries({ queryKey: ["user_stats", user.id] })
    );
    ch.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "user_badges", filter: `user_id=eq.${user.id}` },
      () => qc.invalidateQueries({ queryKey: ["user_badges", user.id] })
    );
    ch.subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, qc]);

  const stats = statsQ.data;
  const level = stats?.level ?? 1;
  const totalXp = stats?.total_xp ?? 0;
  const tier = stats?.tier ?? "Iniciante";

  const xpFloor = xpForLevel(level);
  const xpCeil = xpForLevel(level + 1);
  const xpInLevel = Math.max(0, totalXp - xpFloor);
  const xpToNext = Math.max(1, xpCeil - xpFloor);
  const progress = Math.min(100, Math.round((xpInLevel / xpToNext) * 100));

  return {
    stats,
    level,
    tier,
    totalXp,
    xpInLevel,
    xpToNext,
    xpForNextLevel: xpCeil,
    progress,
    badges: badgesQ.data ?? [],
    userBadges: userBadgesQ.data ?? [],
    isLoading: statsQ.isLoading || badgesQ.isLoading,
  };
}

/**
 * Hook para conceder XP. Faz dedupe por (reason+key) para evitar double-fire em StrictMode.
 */
export function useAwardXp() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const recentRef = useRef<Map<string, number>>(new Map());
  const timersRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  return async function awardXp(
    amount: number,
    reason: AwardReason,
    metadata: Record<string, any> = {},
    opts: { silent?: boolean; dedupeKey?: string } = {},
  ) {
    if (!user) return null;
    const key = `${reason}:${opts.dedupeKey ?? JSON.stringify(metadata)}`;
    const last = recentRef.current.get(key) ?? 0;
    const now = Date.now();
    if (now - last < 3000) return null; // dedupe 3s
    recentRef.current.set(key, now);

    const scheduleToast = (fn: () => void, ms: number) => {
      const t = window.setTimeout(() => {
        timersRef.current.delete(t);
        fn();
      }, ms);
      timersRef.current.add(t);
    };

    try {
      const { data, error } = await supabase.rpc("award_xp" as any, {
        _amount: amount,
        _reason: reason,
        _metadata: metadata,
      });
      if (error) {
        console.warn("[awardXp] error", error);
        return null;
      }

      const result = data as any;

      // Server-side dedup (ex: daily_login já concedido hoje) — não toasta
      if (result?.no_op) {
        return result;
      }

      if (!opts.silent) {
        toast.success(`+${amount} XP · ${REASON_LABEL[reason] ?? reason}`, {
          icon: "✨",
        });
        if (result?.leveled_up) {
          scheduleToast(() => {
            toast(`🎉 Subiu pro level ${result.level}!`, {
              description: `Tier: ${result.tier}`,
              duration: 5000,
            });
          }, 400);
        }
        if (result?.badges_unlocked > 0) {
          scheduleToast(() => {
            toast(`🏆 ${result.badges_unlocked} novo${result.badges_unlocked > 1 ? "s" : ""} badge desbloqueado!`, {
              description: "Veja em /perfil",
              duration: 5000,
            });
          }, 800);
        }
      }

      qc.invalidateQueries({ queryKey: ["user_stats", user.id] });
      qc.invalidateQueries({ queryKey: ["user_badges", user.id] });
      qc.invalidateQueries({ queryKey: ["xp_events", user.id] });

      return result;
    } catch (e) {
      console.warn("[awardXp] failed", e);
      return null;
    }
  };
}

/** Histórico de XP do usuário */
export function useXpHistory(limit = 50) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["xp_events", user?.id, limit],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("xp_events" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data as unknown as XpEvent[]) ?? [];
    },
  });
}

export const REASON_LABELS = REASON_LABEL;
