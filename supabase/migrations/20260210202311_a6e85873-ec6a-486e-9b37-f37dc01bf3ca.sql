
-- Fix security definer views by setting them as security invoker
DROP VIEW IF EXISTS public.daily_action_summary;
DROP VIEW IF EXISTS public.growth_last_30_days;

CREATE VIEW public.daily_action_summary WITH (security_invoker = true) AS
SELECT
  user_id,
  ig_account_id,
  DATE(executed_at) as day,
  action_type,
  COUNT(*) FILTER (WHERE status = 'success') as success_count,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
  COUNT(*) as total_count
FROM public.action_log
GROUP BY user_id, ig_account_id, DATE(executed_at), action_type
ORDER BY day DESC;

CREATE VIEW public.growth_last_30_days WITH (security_invoker = true) AS
SELECT DISTINCT ON (ig_account_id, DATE(recorded_at))
  user_id,
  ig_account_id,
  DATE(recorded_at) as day,
  followers_count,
  following_count,
  posts_count,
  recorded_at
FROM public.growth_stats
WHERE recorded_at > now() - INTERVAL '30 days'
ORDER BY ig_account_id, DATE(recorded_at), recorded_at DESC;
