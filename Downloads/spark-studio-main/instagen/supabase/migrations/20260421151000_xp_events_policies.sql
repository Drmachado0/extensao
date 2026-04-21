-- IN-09: Tighten xp_events RLS.
--
-- The original policy was `FOR SELECT USING (user_id = auth.uid())` with no
-- `TO authenticated`, which means anon would attempt the predicate check
-- against a NULL auth.uid() and always be denied — functionally fine, but
-- worth pinning to authenticated for consistency with the rest of the schema.
--
-- Direct INSERT policy is intentionally absent: xp_events is only written via
-- the SECURITY DEFINER `award_xp` function, which bypasses RLS. Document that
-- so a future reader doesn't assume it's an oversight and add a wide-open
-- insert policy "to fix" it.

DROP POLICY IF EXISTS "users read own xp" ON public.xp_events;
CREATE POLICY "users read own xp"
  ON public.xp_events FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

COMMENT ON TABLE public.xp_events IS
  'XP audit log. Write path is exclusively via public.award_xp (SECURITY DEFINER). No INSERT policy is needed or desired for client-side access.';
