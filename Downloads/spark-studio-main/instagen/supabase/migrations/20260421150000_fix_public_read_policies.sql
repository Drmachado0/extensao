-- CR-06: Restrict badges and templates public-read policies to authenticated users.
-- Rationale: `USING (true)` without `TO authenticated` grants SELECT to the `anon` role,
-- exposing internal gamification business logic and template prompts to unauthenticated scrapers.

DROP POLICY IF EXISTS "badges public read" ON public.badges;
CREATE POLICY "badges authenticated read"
  ON public.badges FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "templates public read" ON public.templates;
CREATE POLICY "templates authenticated read"
  ON public.templates FOR SELECT
  TO authenticated
  USING (true);
