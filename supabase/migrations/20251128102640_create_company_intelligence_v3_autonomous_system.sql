/*
  # Company Intelligence Engine v3.0 - Autonomous Evolution

  1. New Tables
    - `company_brain_state` - Central AI brain state per company
    - `company_ai_style_rules` - Phrase banks and rewriting patterns
    - `company_conversion_predictions` - Predictive scoring logs
    - `company_playbooks` - Generated sales playbooks
    - `company_audience_clusters` - Customer segment clustering
    - `company_image_intelligence` - Visual brand extraction

  2. Features
    - Autonomous AI evolution
    - Predictive conversion scoring
    - Micro-model adapter simulation
    - Automated playbook generation
    - Audience clustering
    - Image-based intelligence

  3. Security
    - RLS enabled on all tables
    - Optimized indexes for performance
*/

-- Company brain state table
CREATE TABLE IF NOT EXISTS public.company_brain_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  brain_state jsonb NOT NULL DEFAULT '{}'::jsonb,
  version integer DEFAULT 1,
  last_evolution timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, company_id)
);

-- Company AI style rules table
CREATE TABLE IF NOT EXISTS public.company_ai_style_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  rule_category text NOT NULL,
  rule jsonb NOT NULL DEFAULT '{}'::jsonb,
  priority integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Company conversion predictions table
CREATE TABLE IF NOT EXISTS public.company_conversion_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  content_type text NOT NULL,
  content_id uuid,
  content_preview text,
  predicted_score numeric NOT NULL DEFAULT 0,
  predicted_reply_rate numeric DEFAULT 0,
  predicted_meeting_rate numeric DEFAULT 0,
  red_flags jsonb DEFAULT '[]'::jsonb,
  suggestions jsonb DEFAULT '[]'::jsonb,
  actual_outcome text,
  actual_score numeric,
  prediction_accuracy numeric,
  created_at timestamptz DEFAULT now()
);

-- Company playbooks table
CREATE TABLE IF NOT EXISTS public.company_playbooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  version text DEFAULT '1.0',
  content_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  content_markdown text,
  pdf_url text,
  sections_count integer DEFAULT 0,
  generated_by text DEFAULT 'ai',
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Company audience clusters table
CREATE TABLE IF NOT EXISTS public.company_audience_clusters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  cluster_name text NOT NULL,
  cluster_profile jsonb NOT NULL DEFAULT '{}'::jsonb,
  member_count integer DEFAULT 0,
  avg_conversion_rate numeric DEFAULT 0,
  winning_patterns jsonb DEFAULT '[]'::jsonb,
  recommended_approach text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Company image intelligence table
CREATE TABLE IF NOT EXISTS public.company_image_intelligence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  asset_id uuid REFERENCES public.company_assets(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  extracted_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  brand_colors jsonb DEFAULT '[]'::jsonb,
  detected_elements jsonb DEFAULT '[]'::jsonb,
  visual_style text,
  confidence numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_company_brain_state_user ON public.company_brain_state(user_id);
CREATE INDEX IF NOT EXISTS idx_company_brain_state_company ON public.company_brain_state(company_id);
CREATE INDEX IF NOT EXISTS idx_company_brain_state_updated ON public.company_brain_state(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_company_ai_style_rules_user ON public.company_ai_style_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_company_ai_style_rules_company ON public.company_ai_style_rules(company_id);
CREATE INDEX IF NOT EXISTS idx_company_ai_style_rules_category ON public.company_ai_style_rules(rule_category);
CREATE INDEX IF NOT EXISTS idx_company_ai_style_rules_active ON public.company_ai_style_rules(user_id, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_company_conversion_predictions_user ON public.company_conversion_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_company_conversion_predictions_company ON public.company_conversion_predictions(company_id);
CREATE INDEX IF NOT EXISTS idx_company_conversion_predictions_content ON public.company_conversion_predictions(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_company_conversion_predictions_score ON public.company_conversion_predictions(predicted_score DESC);

CREATE INDEX IF NOT EXISTS idx_company_playbooks_user ON public.company_playbooks(user_id);
CREATE INDEX IF NOT EXISTS idx_company_playbooks_company ON public.company_playbooks(company_id);
CREATE INDEX IF NOT EXISTS idx_company_playbooks_published ON public.company_playbooks(user_id, is_published) WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_company_audience_clusters_user ON public.company_audience_clusters(user_id);
CREATE INDEX IF NOT EXISTS idx_company_audience_clusters_company ON public.company_audience_clusters(company_id);

CREATE INDEX IF NOT EXISTS idx_company_image_intelligence_user ON public.company_image_intelligence(user_id);
CREATE INDEX IF NOT EXISTS idx_company_image_intelligence_asset ON public.company_image_intelligence(asset_id);

-- Enable RLS
ALTER TABLE public.company_brain_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_ai_style_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_conversion_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_audience_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_image_intelligence ENABLE ROW LEVEL SECURITY;

-- RLS Policies for company_brain_state
CREATE POLICY "Users can view own brain state"
  ON public.company_brain_state FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own brain state"
  ON public.company_brain_state FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own brain state"
  ON public.company_brain_state FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- RLS Policies for company_ai_style_rules
CREATE POLICY "Users can view own style rules"
  ON public.company_ai_style_rules FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own style rules"
  ON public.company_ai_style_rules FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own style rules"
  ON public.company_ai_style_rules FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own style rules"
  ON public.company_ai_style_rules FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- RLS Policies for company_conversion_predictions
CREATE POLICY "Users can view own predictions"
  ON public.company_conversion_predictions FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own predictions"
  ON public.company_conversion_predictions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- RLS Policies for company_playbooks
CREATE POLICY "Users can view own playbooks"
  ON public.company_playbooks FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own playbooks"
  ON public.company_playbooks FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own playbooks"
  ON public.company_playbooks FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own playbooks"
  ON public.company_playbooks FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- RLS Policies for company_audience_clusters
CREATE POLICY "Users can view own audience clusters"
  ON public.company_audience_clusters FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own audience clusters"
  ON public.company_audience_clusters FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own audience clusters"
  ON public.company_audience_clusters FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- RLS Policies for company_image_intelligence
CREATE POLICY "Users can view own image intelligence"
  ON public.company_image_intelligence FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own image intelligence"
  ON public.company_image_intelligence FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_company_brain_state_updated_at
  BEFORE UPDATE ON public.company_brain_state
  FOR EACH ROW
  EXECUTE FUNCTION public.update_company_updated_at();

CREATE TRIGGER update_company_playbooks_updated_at
  BEFORE UPDATE ON public.company_playbooks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_company_updated_at();

CREATE TRIGGER update_company_audience_clusters_updated_at
  BEFORE UPDATE ON public.company_audience_clusters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_company_updated_at();
