/*
  # Economy Engine 2.0 - Agent Revenue Reports

  1. New Tables
    - `agent_revenue_reports` - CRM-level impact revenue stats

  2. Changes
    - Tracks estimated revenue, closed deals, leads recovered
    - AI-generated messages and deep scans count
    - 30-day periods for reporting

  3. Security
    - Indexed on user_id for performance
*/

DROP TABLE IF EXISTS agent_revenue_reports CASCADE;

CREATE TABLE agent_revenue_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    estimated_revenue INTEGER DEFAULT 0,
    total_closed_deals INTEGER DEFAULT 0,
    leads_recovered INTEGER DEFAULT 0,
    ai_generated_messages INTEGER DEFAULT 0,
    ai_deep_scans INTEGER DEFAULT 0,
    period_start DATE DEFAULT CURRENT_DATE,
    period_end DATE DEFAULT CURRENT_DATE + INTERVAL '30 days',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX agent_revenue_reports_user_idx ON agent_revenue_reports(user_id);
