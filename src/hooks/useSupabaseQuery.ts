import { useQuery, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import { PostgrestError } from "@supabase/supabase-js";
import { handleSupabaseError, AppError } from "@/lib/errorHandler";
import { QUERY_CONFIG } from "@/lib/constants";

/**
 * Hook genérico para queries do Supabase com tratamento de erro automático
 */
export function useSupabaseQuery<TData = unknown, TError = AppError>(
  queryKey: (string | number | undefined)[],
  queryFn: () => Promise<{ data: TData | null; error: PostgrestError | null }>,
  options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">
): UseQueryResult<TData, TError> {
  return useQuery<TData, TError>({
    queryKey,
    queryFn: async () => {
      const { data, error } = await queryFn();
      if (error) {
        throw handleSupabaseError(error);
      }
      if (data === null) {
        throw new AppError("Dados não encontrados", "NOT_FOUND", 404);
      }
      return data;
    },
    staleTime: QUERY_CONFIG.STALE_TIME,
    gcTime: QUERY_CONFIG.GC_TIME,
    retry: QUERY_CONFIG.RETRY,
    retryDelay: QUERY_CONFIG.RETRY_DELAY,
    refetchOnWindowFocus: QUERY_CONFIG.REFETCH_ON_WINDOW_FOCUS,
    ...options,
  });
}

/**
 * Hook para queries que podem retornar null
 */
export function useSupabaseQueryNullable<TData = unknown, TError = AppError>(
  queryKey: (string | number | undefined)[],
  queryFn: () => Promise<{ data: TData | null; error: PostgrestError | null }>,
  options?: Omit<UseQueryOptions<TData | null, TError>, "queryKey" | "queryFn">
): UseQueryResult<TData | null, TError> {
  return useQuery<TData | null, TError>({
    queryKey,
    queryFn: async () => {
      const { data, error } = await queryFn();
      if (error) {
        throw handleSupabaseError(error);
      }
      return data;
    },
    staleTime: QUERY_CONFIG.STALE_TIME,
    gcTime: QUERY_CONFIG.GC_TIME,
    retry: QUERY_CONFIG.RETRY,
    retryDelay: QUERY_CONFIG.RETRY_DELAY,
    refetchOnWindowFocus: QUERY_CONFIG.REFETCH_ON_WINDOW_FOCUS,
    ...options,
  });
}
