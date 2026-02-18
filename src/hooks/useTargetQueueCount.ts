import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useTargetQueueCount(igAccountId?: string | null) {
  const [pendingCount, setPendingCount] = useState(0);

  const fetch = useCallback(async () => {
    if (!igAccountId) return;
    const { count } = await supabase
      .from("target_queue")
      .select("id", { count: "exact", head: true })
      .eq("ig_account_id", igAccountId)
      .eq("status", "pending");
    setPendingCount(count ?? 0);
  }, [igAccountId]);

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    if (!igAccountId) return;
    const channel = supabase
      .channel(`rt-tq-count-${igAccountId}`)
      .on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table: "target_queue", filter: `ig_account_id=eq.${igAccountId}` },
        () => { fetch(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [igAccountId, fetch]);

  return { pendingCount };
}
