
-- Drop existing growth_stats since schema differs
DROP TABLE IF EXISTS public.growth_stats CASCADE;

-- 1. Contas Instagram conectadas
CREATE TABLE IF NOT EXISTS public.ig_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ig_username TEXT NOT NULL,
  ig_user_id TEXT,
  profile_pic_url TEXT,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  bot_online BOOLEAN DEFAULT false,
  bot_status TEXT DEFAULT 'offline',
  last_heartbeat TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Log de ações
CREATE TABLE IF NOT EXISTS public.action_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ig_account_id UUID REFERENCES public.ig_accounts(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('follow','unfollow','like','comment','block','skip','rate_limit','error','watch_reel')),
  target_username TEXT,
  target_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('success','failed','skipped')),
  details JSONB DEFAULT '{}',
  executed_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Estatísticas de crescimento
CREATE TABLE public.growth_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ig_account_id UUID REFERENCES public.ig_accounts(id) ON DELETE CASCADE,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Estatísticas de sessão
CREATE TABLE IF NOT EXISTS public.session_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ig_account_id UUID REFERENCES public.ig_accounts(id) ON DELETE CASCADE,
  follows_count INTEGER DEFAULT 0,
  unfollows_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  blocks_count INTEGER DEFAULT 0,
  skips_count INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  session_start TIMESTAMPTZ,
  session_end TIMESTAMPTZ DEFAULT now()
);

-- 5. Tokens de conexão bridge
CREATE TABLE IF NOT EXISTS public.bridge_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ig_account_id UUID REFERENCES public.ig_accounts(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ
);

-- INDEXES
CREATE INDEX idx_action_log_user ON public.action_log(user_id, executed_at DESC);
CREATE INDEX idx_action_log_account ON public.action_log(ig_account_id, executed_at DESC);
CREATE INDEX idx_action_log_type ON public.action_log(action_type, executed_at DESC);
CREATE INDEX idx_growth_stats_account ON public.growth_stats(ig_account_id, recorded_at DESC);
CREATE INDEX idx_session_stats_account ON public.session_stats(ig_account_id, session_end DESC);

-- RLS
ALTER TABLE public.ig_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bridge_tokens ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users manage own ig_accounts" ON public.ig_accounts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own action_log" ON public.action_log
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own growth_stats" ON public.growth_stats
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own session_stats" ON public.session_stats
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own bridge_tokens" ON public.bridge_tokens
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- VIEWS
CREATE OR REPLACE VIEW public.daily_action_summary AS
SELECT
  user_id,
  ig_account_id,
  DATE(executed_at) as day,
  action_type,
  COUNT(*) FILTER (WHERE status = 'success') as success_count,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
  COUNT(*) as total_count
FROM public.action_log
GROUP BY user_id, ig_account_id, DATE(executed_at), action_type
ORDER BY day DESC;

CREATE OR REPLACE VIEW public.growth_last_30_days AS
SELECT DISTINCT ON (ig_account_id, DATE(recorded_at))
  user_id,
  ig_account_id,
  DATE(recorded_at) as day,
  followers_count,
  following_count,
  posts_count,
  recorded_at
FROM public.growth_stats
WHERE recorded_at > now() - INTERVAL '30 days'
ORDER BY ig_account_id, DATE(recorded_at), recorded_at DESC;

-- FUNCTIONS
CREATE OR REPLACE FUNCTION public.get_today_actions(p_ig_account_id UUID)
RETURNS TABLE(action_type TEXT, count BIGINT)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT action_type, COUNT(*)
  FROM action_log
  WHERE ig_account_id = p_ig_account_id
    AND executed_at >= CURRENT_DATE
    AND status = 'success'
  GROUP BY action_type;
$$;

CREATE OR REPLACE FUNCTION public.generate_bridge_token(p_ig_account_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token TEXT;
BEGIN
  v_token := encode(gen_random_bytes(32), 'hex');
  INSERT INTO bridge_tokens (user_id, ig_account_id, token_hash)
  VALUES (auth.uid(), p_ig_account_id, v_token);
  RETURN auth.uid()::TEXT || ':' || p_ig_account_id::TEXT || ':' || v_token;
END;
$$;

-- REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE action_log;
ALTER PUBLICATION supabase_realtime ADD TABLE ig_accounts;
ALTER PUBLICATION supabase_realtime ADD TABLE growth_stats;
