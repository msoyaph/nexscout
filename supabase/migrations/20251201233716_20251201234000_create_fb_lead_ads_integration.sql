/*
  # Facebook Lead Ads Integration v1.0

  1. Auto-Capture System
    - Connect FB Ad Accounts & Lead Forms
    - Receive webhooks from FB Lead Ads
    - Map FB form fields → NexScout prospect fields
    - Auto-create prospects + trigger deep scan
    - Track conversion from ad → lead → deal

  2. Tables
    - `lead_sources` - Connected FB accounts/forms
    - `fb_leads_raw` - Raw webhook payloads
    - `lead_field_mappings` - Field mapping configuration
    - `lead_prospect_links` - Link FB leads to prospects

  3. Complete Journey
    - User fills FB Lead Form
    - Webhook hits NexScout
    - Auto-creates prospect
    - Triggers Deep Scan Lite
    - Adds to pipeline
    - AI follows up
    - Closes deal
*/

-- =====================================================
-- LEAD SOURCES (Connected FB Accounts/Forms)
-- =====================================================

CREATE TABLE IF NOT EXISTS lead_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Provider
  provider text NOT NULL DEFAULT 'facebook', -- 'facebook', 'google', 'linkedin'
  
  -- Facebook Details
  account_id text, -- FB Ad Account ID
  page_id text, -- FB Page ID
  form_id text, -- FB Lead Form ID
  form_name text,
  
  -- Access
  access_token text,
  
  -- Configuration
  auto_capture_enabled boolean DEFAULT true,
  auto_deep_scan_enabled boolean DEFAULT true,
  auto_followup_enabled boolean DEFAULT true,
  
  -- Default Values
  default_pipeline_stage text DEFAULT 'inquiry',
  default_tags text[] DEFAULT ARRAY['fb_lead_form'],
  
  -- Stats
  total_leads_captured integer DEFAULT 0,
  last_lead_captured_at timestamptz,
  
  -- Status
  is_active boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id, provider, form_id)
);

CREATE INDEX IF NOT EXISTS idx_lead_sources_user ON lead_sources(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_sources_form ON lead_sources(form_id);
CREATE INDEX IF NOT EXISTS idx_lead_sources_active ON lead_sources(is_active) WHERE is_active = true;

-- =====================================================
-- FB LEADS RAW (Raw Webhook Payloads)
-- =====================================================

CREATE TABLE IF NOT EXISTS fb_leads_raw (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_source_id uuid REFERENCES lead_sources(id) ON DELETE CASCADE NOT NULL,
  
  -- Facebook IDs
  fb_lead_id text NOT NULL,
  page_id text,
  ad_id text,
  adset_id text,
  campaign_id text,
  form_id text,
  
  -- Raw Data
  raw_payload jsonb NOT NULL,
  field_data jsonb, -- Extracted field data
  
  -- Processing Status
  processed boolean DEFAULT false,
  processed_at timestamptz,
  error_message text,
  
  -- Created Prospect
  prospect_id uuid REFERENCES prospects(id) ON DELETE SET NULL,
  
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(fb_lead_id)
);

CREATE INDEX IF NOT EXISTS idx_fb_leads_source ON fb_leads_raw(lead_source_id);
CREATE INDEX IF NOT EXISTS idx_fb_leads_fb_id ON fb_leads_raw(fb_lead_id);
CREATE INDEX IF NOT EXISTS idx_fb_leads_processed ON fb_leads_raw(processed);
CREATE INDEX IF NOT EXISTS idx_fb_leads_prospect ON fb_leads_raw(prospect_id);
CREATE INDEX IF NOT EXISTS idx_fb_leads_created ON fb_leads_raw(created_at DESC);

-- =====================================================
-- LEAD FIELD MAPPINGS (FB Field → Prospect Field)
-- =====================================================

CREATE TABLE IF NOT EXISTS lead_field_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_source_id uuid REFERENCES lead_sources(id) ON DELETE CASCADE NOT NULL,
  
  -- Mapping
  fb_field_name text NOT NULL,
  prospect_field_name text NOT NULL,
  -- Options: 'full_name', 'first_name', 'last_name', 'email', 'phone', 
  --          'city', 'company', 'job_title', 'notes', 'tags', 'custom_*'
  
  -- Validation
  is_required boolean DEFAULT false,
  validation_rule text, -- 'email', 'phone', 'text'
  
  -- Transform
  transform_function text, -- 'uppercase', 'lowercase', 'trim', 'split_name'
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(lead_source_id, fb_field_name)
);

CREATE INDEX IF NOT EXISTS idx_mappings_source ON lead_field_mappings(lead_source_id);

-- =====================================================
-- LEAD PROSPECT LINKS (FB Lead → Prospect)
-- =====================================================

CREATE TABLE IF NOT EXISTS lead_prospect_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link
  fb_lead_id text NOT NULL,
  prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE NOT NULL,
  
  -- Source Info
  source_channel text NOT NULL DEFAULT 'facebook_lead_ad',
  campaign_id text,
  ad_id text,
  adset_id text,
  
  -- Conversion Tracking
  converted_to_meeting boolean DEFAULT false,
  converted_to_deal boolean DEFAULT false,
  conversion_value numeric(12,2),
  
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(fb_lead_id, prospect_id)
);

CREATE INDEX IF NOT EXISTS idx_links_fb_lead ON lead_prospect_links(fb_lead_id);
CREATE INDEX IF NOT EXISTS idx_links_prospect ON lead_prospect_links(prospect_id);
CREATE INDEX IF NOT EXISTS idx_links_campaign ON lead_prospect_links(campaign_id);

-- =====================================================
-- LEAD SOURCE ANALYTICS (Daily Rollup)
-- =====================================================

CREATE TABLE IF NOT EXISTS lead_source_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_source_id uuid REFERENCES lead_sources(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Date
  date date NOT NULL,
  
  -- Volume
  leads_captured integer DEFAULT 0,
  leads_processed integer DEFAULT 0,
  leads_failed integer DEFAULT 0,
  
  -- Conversion
  prospects_created integer DEFAULT 0,
  meetings_booked integer DEFAULT 0,
  deals_closed integer DEFAULT 0,
  
  -- Revenue
  total_revenue numeric(12,2) DEFAULT 0,
  
  -- Performance
  avg_processing_time_ms integer,
  error_rate decimal(5,2) DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(lead_source_id, date)
);

CREATE INDEX IF NOT EXISTS idx_analytics_source ON lead_source_analytics(lead_source_id);
CREATE INDEX IF NOT EXISTS idx_analytics_user ON lead_source_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON lead_source_analytics(date DESC);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE lead_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE fb_leads_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_field_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_prospect_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_source_analytics ENABLE ROW LEVEL SECURITY;

-- Lead Sources
CREATE POLICY "Users can view own lead sources"
  ON lead_sources FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own lead sources"
  ON lead_sources FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- FB Leads Raw (through source)
CREATE POLICY "Users can view own FB leads"
  ON fb_leads_raw FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lead_sources
      WHERE lead_sources.id = fb_leads_raw.lead_source_id
      AND lead_sources.user_id = auth.uid()
    )
  );

-- Service role can insert/update
CREATE POLICY "Service can manage FB leads"
  ON fb_leads_raw FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Field Mappings
CREATE POLICY "Users can view own mappings"
  ON lead_field_mappings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lead_sources
      WHERE lead_sources.id = lead_field_mappings.lead_source_id
      AND lead_sources.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own mappings"
  ON lead_field_mappings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lead_sources
      WHERE lead_sources.id = lead_field_mappings.lead_source_id
      AND lead_sources.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lead_sources
      WHERE lead_sources.id = lead_field_mappings.lead_source_id
      AND lead_sources.user_id = auth.uid()
    )
  );

-- Lead Prospect Links (through prospect)
CREATE POLICY "Users can view own links"
  ON lead_prospect_links FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM prospects
      WHERE prospects.id = lead_prospect_links.prospect_id
      AND prospects.user_id = auth.uid()
    )
  );

-- Analytics
CREATE POLICY "Users can view own analytics"
  ON lead_source_analytics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Update lead source stats
CREATE OR REPLACE FUNCTION update_lead_source_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE lead_sources
  SET 
    total_leads_captured = total_leads_captured + 1,
    last_lead_captured_at = NEW.created_at,
    updated_at = now()
  WHERE id = NEW.lead_source_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_lead_source_stats
  AFTER INSERT ON fb_leads_raw
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_source_stats();

-- Track conversions
CREATE OR REPLACE FUNCTION track_lead_conversion()
RETURNS TRIGGER AS $$
BEGIN
  -- If prospect moved to appointment or closing stage
  IF NEW.pipeline_stage IN ('appointment', 'closing', 'closed_won') THEN
    UPDATE lead_prospect_links
    SET converted_to_meeting = true
    WHERE prospect_id = NEW.id;
  END IF;
  
  -- If deal closed
  IF NEW.pipeline_stage = 'closed_won' THEN
    UPDATE lead_prospect_links
    SET 
      converted_to_deal = true,
      conversion_value = NEW.deal_value
    WHERE prospect_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_track_lead_conversion
  AFTER UPDATE ON prospects
  FOR EACH ROW
  WHEN (OLD.pipeline_stage IS DISTINCT FROM NEW.pipeline_stage)
  EXECUTE FUNCTION track_lead_conversion();