import { useEffect } from "react";
import { useAuth } from "./useAuth";
import { useAwardXp } from "./useGamification";

/**
 * Concede +10 XP uma vez por dia. A dedup real vive no servidor
 * (award_xp checa user_stats.last_login_date). Este hook apenas dispara
 * a tentativa no mount — se já foi concedido hoje, o servidor retorna
 * no_op e nada acontece.
 */
export function useDailyLoginXp() {
  const { user } = useAuth();
  const award = useAwardXp();

  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().slice(0, 10);
    // Pequena espera pra não competir com outras queries no mount
    const t = setTimeout(() => {
      award(10, "daily_login", { date: today }, { dedupeKey: today });
    }, 1500);
    return () => clearTimeout(t);
  }, [user, award]);
}
