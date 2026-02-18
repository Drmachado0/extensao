-- comment_templates: templates de comentários usados pela extensão Bridge
CREATE TABLE IF NOT EXISTS public.comment_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ig_account_id uuid REFERENCES public.ig_accounts(id) ON DELETE CASCADE,
  body text NOT NULL,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.comment_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own comment_templates"
  ON public.comment_templates
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_comment_templates_user_id ON public.comment_templates(user_id);
CREATE INDEX idx_comment_templates_ig_account_id ON public.comment_templates(ig_account_id);
CREATE INDEX idx_comment_templates_sort ON public.comment_templates(user_id, sort_order);

COMMENT ON TABLE public.comment_templates IS 'Templates de comentários para ações do bot (Bridge).';
