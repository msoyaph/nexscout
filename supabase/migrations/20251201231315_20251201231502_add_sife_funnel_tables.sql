/*
  # SIFE 1.0 Funnel-Specific Tables
  
  Adding funnel tracking tables to existing SIFE system
*/

-- =====================================================
-- SIFE FUNNELS
-- =====================================================

CREATE TABLE IF NOT EXISTS sife_funnels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  funnel_name text NOT NULL,
  funnel_type text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sife_funnels_user ON sife_funnels(user_id);

-- =====================================================
-- SIFE FUNNEL STEPS
-- =====================================================

CREATE TABLE IF NOT EXISTS sife_funnel_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id uuid REFERENCES sife_funnels(id) ON DELETE CASCADE NOT NULL,
  
  step_order integer NOT NULL DEFAULT 0,
  step_type text NOT NULL,
  step_identifier text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  is_winner boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sife_steps_funnel ON sife_funnel_steps(funnel_id);

-- =====================================================
-- SIFE STEP METRICS
-- =====================================================

CREATE TABLE IF NOT EXISTS sife_step_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id uuid REFERENCES sife_funnel_steps(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  replies integer DEFAULT 0,
  meetings integer DEFAULT 0,
  purchases integer DEFAULT 0,
  revenue numeric(12,2) DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sife_step_metrics_step ON sife_step_metrics(step_id);
CREATE INDEX IF NOT EXISTS idx_sife_step_metrics_user ON sife_step_metrics(user_id);

-- =====================================================
-- SIFE RECOMMENDATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS sife_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  step_id uuid REFERENCES sife_funnel_steps(id) ON DELETE CASCADE,
  
  recommendation_type text NOT NULL,
  current_content jsonb,
  recommended_content jsonb NOT NULL,
  reason text NOT NULL,
  confidence_score decimal(5,2) DEFAULT 0,
  status text DEFAULT 'pending',
  
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sife_recommendations_user ON sife_recommendations(user_id);

-- =====================================================
-- SIFE LEARNING PATTERNS
-- =====================================================

CREATE TABLE IF NOT EXISTS sife_learning_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  pattern_type text NOT NULL,
  pattern_name text NOT NULL,
  pattern_data jsonb NOT NULL,
  success_rate decimal(5,2) DEFAULT 0,
  
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sife_learning_patterns_user ON sife_learning_patterns(user_id);

-- =====================================================
-- SIFE WEAK POINTS
-- =====================================================

CREATE TABLE IF NOT EXISTS sife_weak_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  step_id uuid REFERENCES sife_funnel_steps(id) ON DELETE CASCADE,
  
  weak_point_type text NOT NULL,
  severity text NOT NULL,
  description text NOT NULL,
  status text DEFAULT 'identified',
  
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sife_weak_points_user ON sife_weak_points(user_id);

-- =====================================================
-- SIFE CORRELATION INSIGHTS
-- =====================================================

CREATE TABLE IF NOT EXISTS sife_correlation_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  insight_summary text NOT NULL,
  factor_a text NOT NULL,
  factor_b text NOT NULL,
  correlation_strength decimal(5,2) DEFAULT 0,
  
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sife_correlation_insights_user ON sife_correlation_insights(user_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE sife_funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE sife_funnel_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE sife_step_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE sife_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sife_learning_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE sife_weak_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE sife_correlation_insights ENABLE ROW LEVEL SECURITY;

-- Simple policies for all tables
CREATE POLICY "Users can view own funnels" ON sife_funnels FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own funnels" ON sife_funnels FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own funnels" ON sife_funnels FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can view funnel steps" ON sife_funnel_steps FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM sife_funnels WHERE sife_funnels.id = sife_funnel_steps.funnel_id AND sife_funnels.user_id = auth.uid()));
CREATE POLICY "Users can insert funnel steps" ON sife_funnel_steps FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM sife_funnels WHERE sife_funnels.id = sife_funnel_steps.funnel_id AND sife_funnels.user_id = auth.uid()));
CREATE POLICY "Users can update funnel steps" ON sife_funnel_steps FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM sife_funnels WHERE sife_funnels.id = sife_funnel_steps.funnel_id AND sife_funnels.user_id = auth.uid()));

CREATE POLICY "Users can view own metrics" ON sife_step_metrics FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own metrics" ON sife_step_metrics FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own metrics" ON sife_step_metrics FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can view own recommendations" ON sife_recommendations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own recommendations" ON sife_recommendations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own patterns" ON sife_learning_patterns FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own patterns" ON sife_learning_patterns FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own weak points" ON sife_weak_points FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own weak points" ON sife_weak_points FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own insights" ON sife_correlation_insights FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own insights" ON sife_correlation_insights FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);