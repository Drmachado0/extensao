-- WR-09: Constrain sg_posts.status to the actual value set the code writes.
--
-- Real values appearing across callers:
--   'rascunho'   (sg_posts default)
--   'queued'     (start-image-generation)
--   'generating' (process-image-job running)
--   'ready'      (process-image-job success)
--   'error'      (process-image-job failure)
--   'draft'      (Editor.tsx save)
--   'published'  (future publishing pipeline)
--
-- 'rascunho' and 'draft' mean the same thing ("not finalized"). Normalize
-- the legacy Portuguese value to 'draft', shift the column default, and
-- pin the allowed set with a CHECK constraint so future callers fail fast
-- instead of silently adding a new divergent value.

UPDATE public.sg_posts SET status = 'draft' WHERE status = 'rascunho';

ALTER TABLE public.sg_posts
  ALTER COLUMN status SET DEFAULT 'draft';

ALTER TABLE public.sg_posts
  DROP CONSTRAINT IF EXISTS sg_posts_status_check;

ALTER TABLE public.sg_posts
  ADD CONSTRAINT sg_posts_status_check
  CHECK (status IN ('draft','queued','generating','ready','error','published'));
