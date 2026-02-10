
-- =====================================================
-- FASE 1: Remover TODAS as politicas permissivas (allow_all / extension_all_access)
-- e manter apenas as politicas seguras com auth.uid() = user_id
-- =====================================================

-- action_filters: remover allow_all e extension_all_access
DROP POLICY IF EXISTS "allow_all" ON public.action_filters;
DROP POLICY IF EXISTS "extension_all_access" ON public.action_filters;

-- action_logs: remover allow_all e extension_all_access
DROP POLICY IF EXISTS "allow_all" ON public.action_logs;
DROP POLICY IF EXISTS "extension_all_access" ON public.action_logs;

-- action_settings: remover allow_all e extension_all_access
DROP POLICY IF EXISTS "allow_all" ON public.action_settings;
DROP POLICY IF EXISTS "extension_all_access" ON public.action_settings;

-- instagram_accounts: remover allow_all e extension_all_access
DROP POLICY IF EXISTS "allow_all" ON public.instagram_accounts;
DROP POLICY IF EXISTS "extension_all_access" ON public.instagram_accounts;

-- target_queue: remover allow_all e extension_all_access
DROP POLICY IF EXISTS "allow_all" ON public.target_queue;
DROP POLICY IF EXISTS "extension_all_access" ON public.target_queue;

-- media_queue: remover allow_all e extension_all_access
DROP POLICY IF EXISTS "allow_all" ON public.media_queue;
DROP POLICY IF EXISTS "extension_all_access" ON public.media_queue;

-- whitelist: remover allow_all e extension_all_access
DROP POLICY IF EXISTS "allow_all" ON public.whitelist;
DROP POLICY IF EXISTS "extension_all_access" ON public.whitelist;

-- notification_preferences: remover allow_all e extension_all_access
DROP POLICY IF EXISTS "allow_all" ON public.notification_preferences;
DROP POLICY IF EXISTS "extension_all_access" ON public.notification_preferences;

-- notification_logs: remover allow_all e extension_all_access
DROP POLICY IF EXISTS "allow_all" ON public.notification_logs;
DROP POLICY IF EXISTS "extension_all_access" ON public.notification_logs;

-- subscriptions: remover allow_all e extension_all_access
DROP POLICY IF EXISTS "allow_all" ON public.subscriptions;
DROP POLICY IF EXISTS "extension_all_access" ON public.subscriptions;

-- profiles: remover allow_all e extension_all_access
DROP POLICY IF EXISTS "allow_all" ON public.profiles;
DROP POLICY IF EXISTS "extension_all_access" ON public.profiles;

-- scheduled_actions: remover allow_all e extension_all_access
DROP POLICY IF EXISTS "allow_all" ON public.scheduled_actions;
DROP POLICY IF EXISTS "extension_all_access" ON public.scheduled_actions;

-- user_settings: remover allow_all e extension_all_access
DROP POLICY IF EXISTS "allow_all" ON public.user_settings;
DROP POLICY IF EXISTS "extension_all_access" ON public.user_settings;

-- targeting_campaigns: remover allow_all e extension_all_access
DROP POLICY IF EXISTS "allow_all" ON public.targeting_campaigns;
DROP POLICY IF EXISTS "extension_all_access" ON public.targeting_campaigns;

-- =====================================================
-- Garantir que todas as tabelas com user_id tenham politicas seguras
-- (apenas adicionar onde ainda nao existem)
-- =====================================================

-- action_logs: ja tem select e insert com auth.uid(), adicionar update e delete
CREATE POLICY "Users can update own action_logs" ON public.action_logs
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own action_logs" ON public.action_logs
  FOR DELETE USING (auth.uid() = user_id);

-- action_settings: ja tem ALL policy, ok

-- action_filters: ja tem ALL policy com authenticated, ok

-- target_queue: garantir politica segura
DROP POLICY IF EXISTS "Users can manage own target_queue" ON public.target_queue;
CREATE POLICY "Users can manage own target_queue" ON public.target_queue
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- media_queue: garantir politica segura
DROP POLICY IF EXISTS "Users can manage own media_queue" ON public.media_queue;
CREATE POLICY "Users can manage own media_queue" ON public.media_queue
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- whitelist: garantir politica segura
DROP POLICY IF EXISTS "Users can manage own whitelist" ON public.whitelist;
CREATE POLICY "Users can manage own whitelist" ON public.whitelist
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- notification_preferences: garantir politica segura
DROP POLICY IF EXISTS "Users can manage own notification_preferences" ON public.notification_preferences;
CREATE POLICY "Users can manage own notification_preferences" ON public.notification_preferences
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- notification_logs: garantir politica segura
DROP POLICY IF EXISTS "Users can manage own notification_logs" ON public.notification_logs;
CREATE POLICY "Users can manage own notification_logs" ON public.notification_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- subscriptions: garantir politica segura
DROP POLICY IF EXISTS "Users can manage own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can manage own subscriptions" ON public.subscriptions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- profiles: users can manage own profile (id = auth.uid())
DROP POLICY IF EXISTS "Users can manage own profile" ON public.profiles;
CREATE POLICY "Users can manage own profile" ON public.profiles
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- scheduled_actions: garantir politica segura
DROP POLICY IF EXISTS "Users can manage own scheduled_actions" ON public.scheduled_actions;
CREATE POLICY "Users can manage own scheduled_actions" ON public.scheduled_actions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- user_settings: garantir politica segura
DROP POLICY IF EXISTS "Users can manage own user_settings" ON public.user_settings;
CREATE POLICY "Users can manage own user_settings" ON public.user_settings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- targeting_campaigns: garantir politica segura
DROP POLICY IF EXISTS "Users can manage own targeting_campaigns" ON public.targeting_campaigns;
CREATE POLICY "Users can manage own targeting_campaigns" ON public.targeting_campaigns
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
