-- WR-04 / WR-05: Harden credits RPCs against abuse.
--
-- debit_credits_atomic: was SECURITY DEFINER with no caller check on p_user_id
-- and no lower bound on p_amount. A signed-in user could:
--   * drain another user's credits (grief):
--       rpc('debit_credits_atomic', { p_user_id: <victim>, p_amount: 999999 })
--   * grant themselves credits via negative amount:
--       rpc('debit_credits_atomic', { p_user_id: self, p_amount: -100000 })
--     (credits - (-100000) = +100000)
--
-- refund_credits: SECURITY DEFINER with no caller check at all. Any authenticated
-- user could gift themselves arbitrary credits:
--   rpc('refund_credits', { p_user_id: self, p_amount: 1000000 })
--
-- Fixes:
--  1. Tighten debit_credits_atomic to require p_user_id = auth.uid() (or service_role),
--     and reject non-positive amounts.
--  2. Revoke refund_credits from authenticated/anon so only service_role can call it.

CREATE OR REPLACE FUNCTION public.debit_credits_atomic(p_user_id uuid, p_amount integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_available integer;
  v_new integer;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role'
     AND (auth.uid() IS NULL OR auth.uid() <> p_user_id) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'invalid amount' USING ERRCODE = '22023';
  END IF;

  SELECT credits INTO v_available
  FROM public.user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_available IS NULL THEN
    INSERT INTO public.user_credits (user_id, credits, plan_key)
    VALUES (p_user_id, 0, 'freemium')
    ON CONFLICT (user_id) DO NOTHING;
    v_available := 0;
  END IF;

  IF v_available < p_amount THEN
    RETURN jsonb_build_object('ok', false, 'available', v_available, 'required', p_amount);
  END IF;

  UPDATE public.user_credits
  SET credits = credits - p_amount,
      updated_at = now()
  WHERE user_id = p_user_id
  RETURNING credits INTO v_new;

  RETURN jsonb_build_object('ok', true, 'remaining', v_new, 'debited', p_amount);
END;
$$;

CREATE OR REPLACE FUNCTION public.refund_credits(p_user_id uuid, p_amount integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new integer;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'invalid amount' USING ERRCODE = '22023';
  END IF;

  UPDATE public.user_credits
  SET credits = credits + p_amount,
      updated_at = now()
  WHERE user_id = p_user_id
  RETURNING credits INTO v_new;
  RETURN COALESCE(v_new, 0);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.refund_credits(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refund_credits(uuid, integer) TO service_role;
