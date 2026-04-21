-- WR-08: Server-side dedup for daily_login XP so the grant can't be farmed
-- across devices, incognito windows, or by clearing localStorage.
--
-- The client used localStorage to gate the once-per-day check. Anyone could
-- log in on phone + browser + incognito to get +10 XP 3x, or clear storage
-- to farm indefinitely.
--
-- Replace award_xp so that when _reason = 'daily_login' and user_stats.
-- last_login_date is today, the call is a no-op that reports no-op in the
-- result JSON. Also update last_login_date when a daily_login is accepted.

CREATE OR REPLACE FUNCTION public.award_xp(
  _amount INTEGER,
  _reason TEXT,
  _metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  new_total INTEGER;
  new_level INTEGER;
  old_level INTEGER;
  new_tier TEXT;
  unlocked INTEGER;
  last_daily DATE;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;
  IF _amount IS NULL OR _amount <= 0 THEN
    RAISE EXCEPTION 'invalid amount';
  END IF;

  -- Garante linha em user_stats
  INSERT INTO public.user_stats (user_id) VALUES (uid)
  ON CONFLICT (user_id) DO NOTHING;

  -- Dedup daily_login: bail out if already awarded today
  IF _reason = 'daily_login' THEN
    SELECT last_login_date INTO last_daily FROM public.user_stats WHERE user_id = uid;
    IF last_daily = CURRENT_DATE THEN
      RETURN jsonb_build_object(
        'ok', true,
        'no_op', true,
        'reason', 'already_awarded_today'
      );
    END IF;
  END IF;

  -- Captura level atual
  SELECT level INTO old_level FROM public.user_stats WHERE user_id = uid;

  -- Insere evento
  INSERT INTO public.xp_events (user_id, amount, reason, metadata)
  VALUES (uid, _amount, _reason, COALESCE(_metadata, '{}'::jsonb));

  -- Atualiza contadores conforme reason
  UPDATE public.user_stats SET
    total_xp = total_xp + _amount,
    posts_created = posts_created + CASE WHEN _reason = 'post_created' THEN 1 ELSE 0 END,
    regenerations = regenerations + CASE WHEN _reason = 'slide_regenerated' THEN 1 ELSE 0 END,
    exports = exports + CASE WHEN _reason = 'post_exported' THEN 1 ELSE 0 END,
    brand_completed = brand_completed OR (_reason = 'brand_completed'),
    last_login_date = CASE WHEN _reason = 'daily_login' THEN CURRENT_DATE ELSE last_login_date END,
    updated_at = now()
  WHERE user_id = uid
  RETURNING total_xp INTO new_total;

  -- Recalcula level/tier
  new_level := public.compute_level(new_total);
  new_tier := public.compute_tier(new_level);

  UPDATE public.user_stats SET
    level = new_level,
    tier = new_tier
  WHERE user_id = uid;

  -- Desbloqueia badges
  unlocked := public.unlock_eligible_badges(uid);

  RETURN jsonb_build_object(
    'total_xp', new_total,
    'level', new_level,
    'tier', new_tier,
    'leveled_up', new_level > COALESCE(old_level, 1),
    'old_level', COALESCE(old_level, 1),
    'badges_unlocked', unlocked
  );
END;
$$;
