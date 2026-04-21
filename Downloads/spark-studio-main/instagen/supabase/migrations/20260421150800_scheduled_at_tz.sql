-- WR-12: Persist the scheduler's original IANA timezone alongside scheduled_at.
--
-- Previously the datetime-local input was reinterpreted as local time on save
-- (`new Date(when).toISOString()`), then again on render. Users travelling
-- between timezones would see the same post at a different wall-clock time
-- than they intended, and DST boundaries caused off-by-1-hour bugs.
--
-- Store the IANA tz (e.g. "America/Sao_Paulo") captured at save time so the
-- edit dialog can re-hydrate the input deterministically.

ALTER TABLE public.scheduled_posts
  ADD COLUMN IF NOT EXISTS scheduled_at_tz text;
