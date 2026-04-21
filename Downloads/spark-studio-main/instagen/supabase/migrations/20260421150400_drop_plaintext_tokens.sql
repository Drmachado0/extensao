-- CR-01: Drop plaintext Meta tokens and lock encrypted columns from direct client reads.
--
-- Rationale: migration 20260421022614 added *_encrypted bytea columns but never removed
-- the legacy plaintext `access_token` / `refresh_token` TEXT columns. RLS lets the row
-- owner `SELECT access_token` and read the long-lived Instagram token in the clear —
-- any XSS or malicious browser extension silently exfiltrates publishing credentials.
--
-- Steps:
--  1. Back-fill any plaintext token that still has no encrypted counterpart (best effort).
--  2. Drop the plaintext columns.
--  3. Revoke SELECT on the encrypted columns from client roles — edge functions read
--     them via service_role, never the browser.

DO $$
BEGIN
  -- Only back-fill if the plaintext columns still exist (fresh installs skip this).
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'social_accounts'
      AND column_name = 'access_token'
  ) THEN
    UPDATE public.social_accounts
    SET access_token_encrypted = public.encrypt_token(access_token)
    WHERE access_token IS NOT NULL AND access_token_encrypted IS NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'social_accounts'
      AND column_name = 'refresh_token'
  ) THEN
    UPDATE public.social_accounts
    SET refresh_token_encrypted = public.encrypt_token(refresh_token)
    WHERE refresh_token IS NOT NULL AND refresh_token_encrypted IS NULL;
  END IF;
END;
$$;

ALTER TABLE public.social_accounts
  DROP COLUMN IF EXISTS access_token,
  DROP COLUMN IF EXISTS refresh_token;

-- Keep the encrypted columns out of client SELECTs. PostgREST honors column-level
-- grants: the client's explicit `select('id,user_id,...')` still works because it
-- never requests the encrypted columns.
REVOKE SELECT (access_token_encrypted, refresh_token_encrypted)
  ON public.social_accounts FROM anon, authenticated;
