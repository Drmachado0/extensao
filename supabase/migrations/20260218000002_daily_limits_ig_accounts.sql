-- Limites diários por tipo de ação (por conta)
ALTER TABLE public.ig_accounts
  ADD COLUMN IF NOT EXISTS max_follows_per_day integer,
  ADD COLUMN IF NOT EXISTS max_likes_per_day integer,
  ADD COLUMN IF NOT EXISTS max_comments_per_day integer,
  ADD COLUMN IF NOT EXISTS max_unfollows_per_day integer;

COMMENT ON COLUMN public.ig_accounts.max_follows_per_day IS 'Máximo de follows por dia (null = sem limite).';
COMMENT ON COLUMN public.ig_accounts.max_likes_per_day IS 'Máximo de likes por dia (null = sem limite).';
COMMENT ON COLUMN public.ig_accounts.max_comments_per_day IS 'Máximo de comentários por dia (null = sem limite).';
COMMENT ON COLUMN public.ig_accounts.max_unfollows_per_day IS 'Máximo de unfollows por dia (null = sem limite).';
