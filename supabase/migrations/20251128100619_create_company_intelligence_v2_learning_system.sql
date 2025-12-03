/*
  # Company Intelligence Engine v2.0 - Learning & Experimentation

  1. New Tables
    - `company_personas` - AI personas with tone settings per company
    - `company_ai_events` - Track all AI content performance events
    - `company_experiments` - A/B testing experiments
    - `company_experiment_variants` - Experiment variant tracking
    - `company_persona_learning_logs` - Learning signals from performance
    - `company_style_overrides` - User-defined style rules
    - `company_ai_safety_flags` - Content safety and compliance tracking

  2. Features
    - Real-time learning from user interactions
    - A/B testing with automatic winner selection
    - Persona evolution based on performance
    - Safety and compliance guardrails
    - Performance tracking and optimization

  3. Security
    - Enable RLS on all tables
    - Users can only access their own company data
    - Optimized indexes for performance queries
*/

-- Company personas table
CREATE TABLE IF NOT EXISTS public.company_personas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  tone_settings jsonb DEFAULT '{}'::jsonb,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Company AI events table
CREATE TABLE IF NOT EXISTS public.company_ai_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  content_type text NOT NULL,
  content_id uuid,
  prospect_id uuid REFERENCES public.prospects(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  source text DEFAULT 'app',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Company experiments table
CREATE TABLE IF NOT EXISTS public.company_experiments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  experiment_type text NOT NULL,
  goal text NOT NULL,
  status text DEFAULT 'draft',
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Company experiment variants table
CREATE TABLE IF NOT EXISTS public.company_experiment_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id uuid NOT NULL REFERENCES public.company_experiments(id) ON DELETE CASCADE,
  label text NOT NULL,
  content_type text NOT NULL,
  content_id uuid,
  traffic_split numeric DEFAULT 50.0,
  impressions integer DEFAULT 0,
  primary_metric_value numeric DEFAULT 0,
  secondary_metrics jsonb DEFAULT '{}'::jsonb,
  is_winner boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Company persona learning logs table
CREATE TABLE IF NOT EXISTS public.company_persona_learning_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  persona_id uuid REFERENCES public.company_personas(id) ON DELETE SET NULL,
  signal_type text NOT NULL,
  signal_strength numeric DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Company style overrides table
CREATE TABLE IF NOT EXISTS public.company_style_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  rule_type text NOT NULL,
  rule jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Company AI safety flags table
CREATE TABLE IF NOT EXISTS public.company_ai_safety_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  content_type text NOT NULL,
  content_id uuid,
  flag_type text NOT NULL,
  severity text DEFAULT 'medium',
  notes text,
  is_resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_company_personas_user_id ON public.company_personas(user_id);
CREATE INDEX IF NOT EXISTS idx_company_personas_company_id ON public.company_personas(company_id);
CREATE INDEX IF NOT EXISTS idx_company_personas_default ON public.company_personas(user_id, is_default) WHERE is_default = true;

CREATE INDEX IF NOT EXISTS idx_company_ai_events_user_id ON public.company_ai_events(user_id);
CREATE INDEX IF NOT EXISTS idx_company_ai_events_company_id ON public.company_ai_events(company_id);
CREATE INDEX IF NOT EXISTS idx_company_ai_events_content ON public.company_ai_events(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_company_ai_events_prospect ON public.company_ai_events(prospect_id);
CREATE INDEX IF NOT EXISTS idx_company_ai_events_type ON public.company_ai_events(event_type);
CREATE INDEX IF NOT EXISTS idx_company_ai_events_created ON public.company_ai_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_company_experiments_user_id ON public.company_experiments(user_id);
CREATE INDEX IF NOT EXISTS idx_company_experiments_company_id ON public.company_experiments(company_id);
CREATE INDEX IF NOT EXISTS idx_company_experiments_status ON public.company_experiments(status);

CREATE INDEX IF NOT EXISTS idx_company_experiment_variants_experiment ON public.company_experiment_variants(experiment_id);
CREATE INDEX IF NOT EXISTS idx_company_experiment_variants_winner ON public.company_experiment_variants(experiment_id, is_winner) WHERE is_winner = true;

CREATE INDEX IF NOT EXISTS idx_company_persona_learning_logs_user_id ON public.company_persona_learning_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_company_persona_learning_logs_company_id ON public.company_persona_learning_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_company_persona_learning_logs_persona ON public.company_persona_learning_logs(persona_id);

CREATE INDEX IF NOT EXISTS idx_company_style_overrides_user_id ON public.company_style_overrides(user_id);
CREATE INDEX IF NOT EXISTS idx_company_style_overrides_company_id ON public.company_style_overrides(company_id);
CREATE INDEX IF NOT EXISTS idx_company_style_overrides_active ON public.company_style_overrides(user_id, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_company_ai_safety_flags_user_id ON public.company_ai_safety_flags(user_id);
CREATE INDEX IF NOT EXISTS idx_company_ai_safety_flags_company_id ON public.company_ai_safety_flags(company_id);
CREATE INDEX IF NOT EXISTS idx_company_ai_safety_flags_severity ON public.company_ai_safety_flags(severity);
CREATE INDEX IF NOT EXISTS idx_company_ai_safety_flags_unresolved ON public.company_ai_safety_flags(user_id, is_resolved) WHERE is_resolved = false;

-- Enable RLS
ALTER TABLE public.company_personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_ai_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_experiment_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_persona_learning_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_style_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_ai_safety_flags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for company_personas
CREATE POLICY "Users can view own personas"
  ON public.company_personas FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own personas"
  ON public.company_personas FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own personas"
  ON public.company_personas FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own personas"
  ON public.company_personas FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- RLS Policies for company_ai_events
CREATE POLICY "Users can view own events"
  ON public.company_ai_events FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own events"
  ON public.company_ai_events FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- RLS Policies for company_experiments
CREATE POLICY "Users can view own experiments"
  ON public.company_experiments FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own experiments"
  ON public.company_experiments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own experiments"
  ON public.company_experiments FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own experiments"
  ON public.company_experiments FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- RLS Policies for company_experiment_variants
CREATE POLICY "Users can view own experiment variants"
  ON public.company_experiment_variants FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.company_experiments
    WHERE company_experiments.id = company_experiment_variants.experiment_id
    AND company_experiments.user_id = (select auth.uid())
  ));

CREATE POLICY "Users can insert own experiment variants"
  ON public.company_experiment_variants FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.company_experiments
    WHERE company_experiments.id = company_experiment_variants.experiment_id
    AND company_experiments.user_id = (select auth.uid())
  ));

CREATE POLICY "Users can update own experiment variants"
  ON public.company_experiment_variants FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.company_experiments
    WHERE company_experiments.id = company_experiment_variants.experiment_id
    AND company_experiments.user_id = (select auth.uid())
  ));

-- RLS Policies for company_persona_learning_logs
CREATE POLICY "Users can view own learning logs"
  ON public.company_persona_learning_logs FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own learning logs"
  ON public.company_persona_learning_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- RLS Policies for company_style_overrides
CREATE POLICY "Users can view own style overrides"
  ON public.company_style_overrides FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own style overrides"
  ON public.company_style_overrides FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own style overrides"
  ON public.company_style_overrides FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own style overrides"
  ON public.company_style_overrides FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- RLS Policies for company_ai_safety_flags
CREATE POLICY "Users can view own safety flags"
  ON public.company_ai_safety_flags FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own safety flags"
  ON public.company_ai_safety_flags FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own safety flags"
  ON public.company_ai_safety_flags FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_company_personas_updated_at
  BEFORE UPDATE ON public.company_personas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_company_updated_at();

CREATE TRIGGER update_company_experiments_updated_at
  BEFORE UPDATE ON public.company_experiments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_company_updated_at();

CREATE TRIGGER update_company_experiment_variants_updated_at
  BEFORE UPDATE ON public.company_experiment_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_company_updated_at();
