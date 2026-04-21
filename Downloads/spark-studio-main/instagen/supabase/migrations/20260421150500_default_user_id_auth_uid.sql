-- WR-03: Let the database populate user_id from auth.uid() by default so the
-- client doesn't have to ship a user_id in the payload. RLS still enforces the
-- constraint, but this removes one attack surface and makes the payload cleaner.

ALTER TABLE public.scheduled_posts
  ALTER COLUMN user_id SET DEFAULT auth.uid();

ALTER TABLE public.sg_marcas
  ALTER COLUMN user_id SET DEFAULT auth.uid();

ALTER TABLE public.sg_posts
  ALTER COLUMN user_id SET DEFAULT auth.uid();
