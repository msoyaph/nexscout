/*
  # Adaptive Selling Brain v6.0 - Real-Time AI Co-Pilot

  1. New Tables
    - `predictive_suggestions` - Stores AI-predicted replies before user types
    - `coaching_events` - Real-time coaching recommendations and outcomes
    - `buyer_timeline_forecasts_v2` - Buyer decision timeline predictions
    - `collaborative_message_sessions` - Multi-agent message variant brainstorming
    - `offer_personality_links_v2` - Offer-to-personality matching mappings
    - `message_experiments` - Micro A/B testing for message effectiveness
    - `org_playbooks` - Team/enterprise-level best practice playbooks

  2. Features
    - Predictive reply suggestions (3 variants: safe/bold/story)
    - Real-time coaching overlay
    - Buyer decision timeline forecasting
    - Collaborative AI message lab (5 agents)
    - Offer-personality matching v2
    - Ethical micro A/B testing
    - Org-level pattern learning

  3. Security
    - Full RLS on all tables
    - Multi-tenant support
    - Performance indexes
*/

-- Predictive Suggestions Table
CREATE TABLE IF NOT EXISTS predictive_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prospect_id uuid,
  conversation_id uuid,
  suggestion_text text NOT NULL,
  suggestion_type text NOT NULL,
  strategy_tag text,
  confidence_score float DEFAULT 0.5,
  accepted boolean DEFAULT false,
  edited boolean DEFAULT false,
  sent_at timestamptz,
  context_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE predictive_suggestions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_predictive_suggestions_user ON predictive_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictive_suggestions_prospect ON predictive_suggestions(prospect_id);
CREATE INDEX IF NOT EXISTS idx_predictive_suggestions_conversation ON predictive_suggestions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_predictive_suggestions_accepted ON predictive_suggestions(accepted);
CREATE INDEX IF NOT EXISTS idx_predictive_suggestions_created ON predictive_suggestions(created_at DESC);

CREATE POLICY "Users can view own predictive suggestions"
  ON predictive_suggestions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own predictive suggestions"
  ON predictive_suggestions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own predictive suggestions"
  ON predictive_suggestions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Coaching Events Table
CREATE TABLE IF NOT EXISTS coaching_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prospect_id uuid,
  conversation_id uuid,
  recommendation_type text NOT NULL,
  recommendation_summary text,
  best_move text,
  avoid_this text,
  next_24h_suggestion text,
  taken_action boolean DEFAULT false,
  action_type text,
  outcome text,
  outcome_rating integer,
  context_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE coaching_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_coaching_events_user ON coaching_events(user_id);
CREATE INDEX IF NOT EXISTS idx_coaching_events_prospect ON coaching_events(prospect_id);
CREATE INDEX IF NOT EXISTS idx_coaching_events_created ON coaching_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coaching_events_taken_action ON coaching_events(taken_action);

CREATE POLICY "Users can view own coaching events"
  ON coaching_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own coaching events"
  ON coaching_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own coaching events"
  ON coaching_events FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Buyer Timeline Forecasts v2 Table
CREATE TABLE IF NOT EXISTS buyer_timeline_forecasts_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  predicted_window_start timestamptz,
  predicted_window_end timestamptz,
  confidence_score float DEFAULT 0.5,
  risk_level text DEFAULT 'medium',
  rationale text,
  recommended_actions jsonb DEFAULT '[]',
  best_followup_time timestamptz,
  high_responsiveness_hours jsonb DEFAULT '[]',
  actual_decision_date timestamptz,
  forecast_accuracy float,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE buyer_timeline_forecasts_v2 ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_timeline_forecasts_v2_prospect ON buyer_timeline_forecasts_v2(prospect_id);
CREATE INDEX IF NOT EXISTS idx_timeline_forecasts_v2_user ON buyer_timeline_forecasts_v2(user_id);
CREATE INDEX IF NOT EXISTS idx_timeline_forecasts_v2_window_start ON buyer_timeline_forecasts_v2(predicted_window_start);
CREATE INDEX IF NOT EXISTS idx_timeline_forecasts_v2_created ON buyer_timeline_forecasts_v2(created_at DESC);

CREATE POLICY "Users can view own timeline forecasts"
  ON buyer_timeline_forecasts_v2 FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own timeline forecasts"
  ON buyer_timeline_forecasts_v2 FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own timeline forecasts"
  ON buyer_timeline_forecasts_v2 FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Collaborative Message Sessions Table
CREATE TABLE IF NOT EXISTS collaborative_message_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prospect_id uuid,
  conversation_id uuid,
  agent_variant text NOT NULL,
  variant_label text,
  variant_text text NOT NULL,
  strategy_description text,
  performance_tags jsonb DEFAULT '[]',
  selected boolean DEFAULT false,
  edited boolean DEFAULT false,
  sent_at timestamptz,
  response_received boolean DEFAULT false,
  response_positive boolean,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE collaborative_message_sessions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_collab_sessions_user ON collaborative_message_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_collab_sessions_prospect ON collaborative_message_sessions(prospect_id);
CREATE INDEX IF NOT EXISTS idx_collab_sessions_variant ON collaborative_message_sessions(agent_variant);
CREATE INDEX IF NOT EXISTS idx_collab_sessions_selected ON collaborative_message_sessions(selected);
CREATE INDEX IF NOT EXISTS idx_collab_sessions_created ON collaborative_message_sessions(created_at DESC);

CREATE POLICY "Users can view own collaborative sessions"
  ON collaborative_message_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own collaborative sessions"
  ON collaborative_message_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collaborative sessions"
  ON collaborative_message_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Offer Personality Links v2 Table
CREATE TABLE IF NOT EXISTS offer_personality_links_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  personality_segment text NOT NULL,
  offer_id uuid,
  script_id uuid,
  primary_angle text NOT NULL,
  tone text NOT NULL,
  emotional_hooks jsonb DEFAULT '[]',
  recommended_scripts jsonb DEFAULT '[]',
  conversion_rate float DEFAULT 0.0,
  usage_count integer DEFAULT 0,
  owner_type feeder_owner_type NOT NULL DEFAULT 'system',
  owner_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE offer_personality_links_v2 ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_offer_personality_segment ON offer_personality_links_v2(personality_segment);
CREATE INDEX IF NOT EXISTS idx_offer_personality_offer ON offer_personality_links_v2(offer_id);
CREATE INDEX IF NOT EXISTS idx_offer_personality_owner ON offer_personality_links_v2(owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_offer_personality_conversion ON offer_personality_links_v2(conversion_rate DESC);

CREATE POLICY "Users can view offer personality links"
  ON offer_personality_links_v2 FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage offer personality links"
  ON offer_personality_links_v2 FOR ALL
  TO authenticated
  USING (owner_type = 'system');

-- Message Experiments Table (using team instead of user for feeder_owner_type)
CREATE TABLE IF NOT EXISTS message_experiments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  experiment_type text NOT NULL,
  variant_a_id uuid,
  variant_a_text text,
  variant_b_id uuid,
  variant_b_text text,
  metric_type text NOT NULL,
  variant_a_count integer DEFAULT 0,
  variant_a_success integer DEFAULT 0,
  variant_b_count integer DEFAULT 0,
  variant_b_success integer DEFAULT 0,
  winner_variant text,
  confidence_level float,
  status text DEFAULT 'running',
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  owner_type feeder_owner_type DEFAULT 'team',
  owner_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE message_experiments ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_experiments_user ON message_experiments(user_id);
CREATE INDEX IF NOT EXISTS idx_experiments_id ON message_experiments(experiment_id);
CREATE INDEX IF NOT EXISTS idx_experiments_status ON message_experiments(status);
CREATE INDEX IF NOT EXISTS idx_experiments_owner ON message_experiments(owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_experiments_created ON message_experiments(created_at DESC);

CREATE POLICY "Users can view own experiments"
  ON message_experiments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR owner_type = 'system');

CREATE POLICY "Users can insert own experiments"
  ON message_experiments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own experiments"
  ON message_experiments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Org Playbooks Table
CREATE TABLE IF NOT EXISTS org_playbooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid,
  title text NOT NULL,
  description text,
  content_json jsonb NOT NULL DEFAULT '{}',
  playbook_type text NOT NULL,
  source text DEFAULT 'auto',
  top_scripts jsonb DEFAULT '[]',
  top_angles jsonb DEFAULT '[]',
  success_metrics jsonb DEFAULT '{}',
  usage_count integer DEFAULT 0,
  avg_rating float,
  week_start_date timestamptz,
  week_end_date timestamptz,
  status text DEFAULT 'active',
  owner_type feeder_owner_type NOT NULL DEFAULT 'team',
  owner_id uuid,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE org_playbooks ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_org_playbooks_org ON org_playbooks(org_id);
CREATE INDEX IF NOT EXISTS idx_org_playbooks_type ON org_playbooks(playbook_type);
CREATE INDEX IF NOT EXISTS idx_org_playbooks_status ON org_playbooks(status);
CREATE INDEX IF NOT EXISTS idx_org_playbooks_owner ON org_playbooks(owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_org_playbooks_week ON org_playbooks(week_start_date DESC);
CREATE INDEX IF NOT EXISTS idx_org_playbooks_created ON org_playbooks(created_at DESC);

CREATE POLICY "Users can view org playbooks for their org"
  ON org_playbooks FOR SELECT
  TO authenticated
  USING (
    owner_type = 'system' OR
    org_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage org playbooks"
  ON org_playbooks FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_super_admin = true
    ) OR
    EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid() AND team_id = org_playbooks.org_id AND role IN ('admin', 'owner')
    )
  );