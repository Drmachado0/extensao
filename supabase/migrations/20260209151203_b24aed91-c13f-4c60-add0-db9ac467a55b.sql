
-- 1. ALTER instagram_accounts: add missing columns
ALTER TABLE public.instagram_accounts
  ADD COLUMN IF NOT EXISTS instagram_user_id text,
  ADD COLUMN IF NOT EXISTS session_data jsonb,
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz,
  ADD COLUMN IF NOT EXISTS daily_actions_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_actions_reset_at timestamptz,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- 2. CREATE target_queue
CREATE TABLE public.target_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid REFERENCES public.instagram_accounts(id) ON DELETE CASCADE,
  target_username text NOT NULL,
  target_instagram_id text,
  target_followers integer,
  target_following integer,
  target_posts_count integer,
  target_is_private boolean,
  target_is_verified boolean,
  target_is_business boolean,
  target_bio text,
  target_external_url text,
  target_profile_pic_url text,
  target_last_post_date timestamptz,
  target_follow_ratio numeric,
  source_type text,
  source_name text,
  action_type text,
  status text DEFAULT 'pending',
  processed_at timestamptz,
  error_message text,
  priority integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.target_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own target_queue" ON public.target_queue FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_target_queue_user_id ON public.target_queue(user_id);
CREATE INDEX idx_target_queue_account_id ON public.target_queue(account_id);
CREATE INDEX idx_target_queue_status ON public.target_queue(status);

-- 3. CREATE action_filters
CREATE TABLE public.action_filters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid REFERENCES public.instagram_accounts(id) ON DELETE CASCADE,
  filter_name text NOT NULL,
  is_active boolean DEFAULT true,
  min_followers integer,
  max_followers integer,
  min_following integer,
  max_following integer,
  min_posts integer,
  max_posts integer,
  min_follow_ratio numeric,
  max_follow_ratio numeric,
  has_profile_pic boolean,
  is_private boolean,
  is_verified boolean,
  is_business boolean,
  bio_contains text[],
  bio_not_contains text[],
  bio_url_contains text,
  bio_url_not_contains text,
  max_days_since_last_post integer,
  skip_already_following boolean DEFAULT true,
  skip_already_attempted boolean DEFAULT false,
  business_category_contains text,
  business_category_not_contains text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.action_filters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own action_filters" ON public.action_filters FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_action_filters_user_id ON public.action_filters(user_id);
CREATE INDEX idx_action_filters_account_id ON public.action_filters(account_id);
CREATE TRIGGER update_action_filters_updated_at BEFORE UPDATE ON public.action_filters FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4. CREATE action_settings
CREATE TABLE public.action_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid REFERENCES public.instagram_accounts(id) ON DELETE CASCADE,
  action_delay_min integer DEFAULT 25,
  action_delay_max integer DEFAULT 55,
  skip_delay_seconds integer DEFAULT 5,
  daily_follow_limit integer DEFAULT 100,
  daily_unfollow_limit integer DEFAULT 100,
  daily_like_limit integer DEFAULT 200,
  hourly_action_limit integer DEFAULT 30,
  rate_limit_429_wait integer DEFAULT 15,
  rate_limit_soft_wait integer DEFAULT 10,
  rate_limit_hard_wait integer DEFAULT 4,
  auto_apply_filters boolean DEFAULT true,
  auto_remove_from_queue boolean DEFAULT true,
  like_latest_posts_count integer DEFAULT 0,
  dont_unfollow_followers boolean DEFAULT true,
  dont_unfollow_within_days integer DEFAULT 3,
  unfollow_after_days integer DEFAULT 7,
  comment_templates text[],
  is_running boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.action_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own action_settings" ON public.action_settings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_action_settings_user_id ON public.action_settings(user_id);
CREATE INDEX idx_action_settings_account_id ON public.action_settings(account_id);
CREATE TRIGGER update_action_settings_updated_at BEFORE UPDATE ON public.action_settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. CREATE action_logs
CREATE TABLE public.action_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid REFERENCES public.instagram_accounts(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  target_username text,
  target_instagram_id text,
  status text,
  details jsonb,
  error_message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.action_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own action_logs" ON public.action_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own action_logs" ON public.action_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_action_logs_user_id ON public.action_logs(user_id);
CREATE INDEX idx_action_logs_account_id ON public.action_logs(account_id);
CREATE INDEX idx_action_logs_created_at ON public.action_logs(created_at);

-- 6. ALTER whitelist: add reason column
ALTER TABLE public.whitelist ADD COLUMN IF NOT EXISTS reason text;

-- 7. CREATE subscriptions
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text DEFAULT 'free',
  status text DEFAULT 'active',
  max_accounts integer DEFAULT 1,
  max_daily_actions integer DEFAULT 50,
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_ends_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own subscriptions" ON public.subscriptions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
