-- WR-01: INSERT/UPDATE policies on social_accounts and scheduled_posts only
-- verify user_id = auth.uid() but do not verify that the referenced brand_id
-- belongs to the same user. A user can attach a row referencing another user's
-- brand (FK allows it). Add an EXISTS check on sg_marcas ownership.

-- social_accounts: INSERT + UPDATE
DROP POLICY IF EXISTS "Users insert own social accounts" ON public.social_accounts;
CREATE POLICY "Users insert own social accounts"
  ON public.social_accounts FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.sg_marcas m
      WHERE m.id = brand_id AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users update own social accounts" ON public.social_accounts;
CREATE POLICY "Users update own social accounts"
  ON public.social_accounts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.sg_marcas m
      WHERE m.id = brand_id AND m.user_id = auth.uid()
    )
  );

-- scheduled_posts: INSERT + UPDATE
-- brand_id is nullable on scheduled_posts; treat NULL as allowed (no ownership to check).
DROP POLICY IF EXISTS "scheduled_posts_insert_own" ON public.scheduled_posts;
CREATE POLICY "scheduled_posts_insert_own"
  ON public.scheduled_posts FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      brand_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.sg_marcas m
        WHERE m.id = brand_id AND m.user_id = auth.uid()
      )
    )
    AND (
      post_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.sg_posts p
        WHERE p.id = post_id AND p.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "scheduled_posts_update_own" ON public.scheduled_posts;
CREATE POLICY "scheduled_posts_update_own"
  ON public.scheduled_posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND (
      brand_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.sg_marcas m
        WHERE m.id = brand_id AND m.user_id = auth.uid()
      )
    )
    AND (
      post_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.sg_posts p
        WHERE p.id = post_id AND p.user_id = auth.uid()
      )
    )
  );
