-- Remove duplicate targets, keeping the oldest entry for each username
CREATE OR REPLACE FUNCTION public.remove_duplicate_targets(p_ig_account_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  WITH duplicates AS (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY ig_account_id, LOWER(username)
             ORDER BY created_at ASC
           ) AS rn
    FROM target_queue
    WHERE ig_account_id = p_ig_account_id
  )
  DELETE FROM target_queue
  WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
  );

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
