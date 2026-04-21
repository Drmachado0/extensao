import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useEffect } from "react";

export function useCredits() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["user_credits", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [creditsRes, profileRes] = await Promise.all([
        supabase.from("user_credits").select("credits").eq("user_id", user!.id).maybeSingle(),
        supabase.from("sg_profiles").select("is_admin").eq("id", user!.id).maybeSingle(),
      ]);
      if (creditsRes.error) throw creditsRes.error;
      const isAdmin = !!(profileRes.data as any)?.is_admin;
      return { credits: creditsRes.data?.credits ?? 0, isAdmin };
    },
  });

  // Realtime subscription on user_credits row
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel(`user_credits:${user.id}`);
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "user_credits", filter: `user_id=eq.${user.id}` },
      () => qc.invalidateQueries({ queryKey: ["user_credits", user.id] })
    );
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, qc]);

  const isAdmin = q.data?.isAdmin ?? false;
  return {
    credits: q.data?.credits ?? 0,
    isAdmin,
    unlimited: isAdmin,
    isLoading: q.isLoading,
    refetch: q.refetch,
  };
}

export function useInvalidateCredits() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return () => qc.invalidateQueries({ queryKey: ["user_credits", user?.id] });
}
