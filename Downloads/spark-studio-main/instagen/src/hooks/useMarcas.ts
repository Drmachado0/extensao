import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";

export function useMarcas() {
  const { user } = useAuth();
  const { activeMarcaId, setActiveMarcaId } = useAppStore();

  const q = useQuery({
    queryKey: ["marcas", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("sg_marcas").select("*").order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!q.data) return;
    if (q.data.length === 0) {
      if (activeMarcaId !== null) setActiveMarcaId(null);
      return;
    }
    const stillExists = q.data.some((m: any) => m.id === activeMarcaId);
    if (!activeMarcaId || !stillExists) {
      const def = q.data.find((m: any) => m.is_default) ?? q.data[0];
      setActiveMarcaId(def.id);
    }
  }, [q.data, activeMarcaId, setActiveMarcaId]);

  const active = q.data?.find((m: any) => m.id === activeMarcaId) ?? null;
  return { ...q, marcas: q.data ?? [], active };
}

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("sg_profiles").select("*").eq("id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
