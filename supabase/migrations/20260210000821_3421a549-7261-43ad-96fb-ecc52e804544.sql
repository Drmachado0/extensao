
-- =====================================================
-- FASE 4: Limpeza de tabelas duplicadas/redundantes
-- Estas tabelas foram substituídas por equivalentes mais completas:
--   action_history -> action_logs
--   activity_log -> action_logs
--   filters -> action_filters
--   filter_presets -> action_filters
--   accounts_queue -> target_queue
-- =====================================================

-- Remover foreign keys primeiro
ALTER TABLE public.action_history DROP CONSTRAINT IF EXISTS action_history_ig_account_id_fkey;
ALTER TABLE public.action_history DROP CONSTRAINT IF EXISTS action_history_user_id_fkey;
ALTER TABLE public.activity_log DROP CONSTRAINT IF EXISTS activity_log_ig_account_id_fkey;
ALTER TABLE public.activity_log DROP CONSTRAINT IF EXISTS activity_log_user_id_fkey;
ALTER TABLE public.filter_presets DROP CONSTRAINT IF EXISTS filter_presets_user_id_fkey;
ALTER TABLE public.accounts_queue DROP CONSTRAINT IF EXISTS accounts_queue_ig_account_id_fkey;
ALTER TABLE public.accounts_queue DROP CONSTRAINT IF EXISTS accounts_queue_user_id_fkey;

-- Dropar as tabelas redundantes
DROP TABLE IF EXISTS public.action_history;
DROP TABLE IF EXISTS public.activity_log;
DROP TABLE IF EXISTS public.filters;
DROP TABLE IF EXISTS public.filter_presets;
DROP TABLE IF EXISTS public.accounts_queue;

-- Limpar políticas duplicadas em growth_stats (tem pares duplicados)
DROP POLICY IF EXISTS "Users can delete their own growth_stats" ON public.growth_stats;
DROP POLICY IF EXISTS "Users can insert their own growth_stats" ON public.growth_stats;
DROP POLICY IF EXISTS "Users can update their own growth_stats" ON public.growth_stats;
DROP POLICY IF EXISTS "Users can view their own growth_stats" ON public.growth_stats;
