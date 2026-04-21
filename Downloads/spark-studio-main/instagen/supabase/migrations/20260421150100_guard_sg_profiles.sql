-- CR-02: Prevent users from self-promoting via RLS-governed UPDATE.
-- Rationale: `own profile update` RLS grants UPDATE on all columns to the row owner.
-- `sg_profiles` carries trust flags (is_admin, plan, credits, rank) that are read
-- server-side for admin bypass and pricing. A single devtools UPDATE can flip them.
-- Defense: trigger that reverts any attempted change to protected columns unless
-- the caller is service_role (edge functions).

-- Ensure is_admin column exists (may have been added out-of-band via dashboard).
ALTER TABLE public.sg_profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.sg_profiles_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    NEW.is_admin := OLD.is_admin;
    NEW.plan     := OLD.plan;
    NEW.credits  := OLD.credits;
    NEW.rank     := OLD.rank;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sg_profiles_guard_trg ON public.sg_profiles;
CREATE TRIGGER sg_profiles_guard_trg
  BEFORE UPDATE ON public.sg_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sg_profiles_guard();
