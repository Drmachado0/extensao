import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type ScheduledStatus = "draft" | "scheduled" | "published" | "failed";

export type ScheduledPost = {
  id: string;
  user_id: string;
  brand_id: string | null;
  post_id: string | null;
  title: string;
  caption: string;
  scheduled_at: string;
  status: ScheduledStatus;
  format: string | null;
  cover_url: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type ScheduledPostInput = Partial<Omit<ScheduledPost, "id" | "user_id" | "created_at" | "updated_at">> & {
  scheduled_at: string;
  title?: string;
};

export function useScheduledPosts(brandId?: string | null) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const listQ = useQuery({
    queryKey: ["scheduled_posts", user?.id, brandId ?? "all"],
    enabled: !!user,
    queryFn: async () => {
      let q = supabase
        .from("scheduled_posts" as any)
        .select("*")
        .order("scheduled_at", { ascending: true });
      if (brandId) q = q.eq("brand_id", brandId);
      const { data, error } = await q;
      if (error) throw error;
      return (data as unknown as ScheduledPost[]) ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async (input: ScheduledPostInput) => {
      if (!user) throw new Error("not authenticated");
      const payload = {
        brand_id: input.brand_id ?? brandId ?? null,
        post_id: input.post_id ?? null,
        title: input.title ?? "",
        caption: input.caption ?? "",
        scheduled_at: input.scheduled_at,
        status: (input.status ?? "draft") as ScheduledStatus,
        format: input.format ?? null,
        cover_url: input.cover_url ?? null,
        notes: input.notes ?? "",
      };
      const { data, error } = await supabase
        .from("scheduled_posts" as any)
        .insert(payload as any)
        .select("*")
        .single();
      if (error) throw error;
      return data as unknown as ScheduledPost;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scheduled_posts"] }),
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<ScheduledPost> }) => {
      const { data, error } = await supabase
        .from("scheduled_posts" as any)
        .update(patch as any)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return data as unknown as ScheduledPost;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scheduled_posts"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("scheduled_posts" as any).delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scheduled_posts"] }),
  });

  return {
    posts: listQ.data ?? [],
    isLoading: listQ.isLoading,
    refetch: listQ.refetch,
    create,
    update,
    remove,
  };
}

/** Lista de posts da biblioteca (sg_posts) para o select do dialog */
export function useBrandLibrary(brandId?: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["sg_posts_library", user?.id, brandId ?? "all"],
    enabled: !!user,
    queryFn: async () => {
      let q = supabase
        .from("sg_posts" as any)
        .select("id, title, format, cover_url, marca_id")
        .order("created_at", { ascending: false })
        .limit(100);
      if (brandId) q = q.eq("marca_id", brandId);
      const { data, error } = await q;
      if (error) {
        console.warn("[useBrandLibrary]", error);
        return [];
      }
      return (data as any[]) ?? [];
    },
  });
}
