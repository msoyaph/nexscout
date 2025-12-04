/*
  # Add Lead Temperature and Upsell Tracking

  1. Updates to public_chat_sessions
    - Add lead_temperature (cold/warm/hot/ready)
    - Add lead_score (0-100)
    - Add current_product_id (what they're considering)
    - Add suggested_product_id (what we recommended)
    - Add offer_type (upsell/downsell/crossSell/stay)
    - Add buying_signals_history (JSONB array)
    - Add intents_history (JSONB array)

  2. Security
    - Maintain existing RLS policies
    - Add indexes for performance
*/

-- Add lead temperature and upsell tracking columns
ALTER TABLE public_chat_sessions 
  ADD COLUMN IF NOT EXISTS lead_temperature text CHECK (lead_temperature IN ('cold', 'warm', 'hot', 'ready')),
  ADD COLUMN IF NOT EXISTS lead_score integer DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),
  ADD COLUMN IF NOT EXISTS current_product_id text,
  ADD COLUMN IF NOT EXISTS suggested_product_id text,
  ADD COLUMN IF NOT EXISTS offer_type text CHECK (offer_type IN ('upsell', 'downsell', 'crossSell', 'stay')),
  ADD COLUMN IF NOT EXISTS buying_signals_history jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS intents_history jsonb DEFAULT '[]'::jsonb;

-- Add indexes for lead temperature queries
CREATE INDEX IF NOT EXISTS idx_public_chat_sessions_lead_temperature 
  ON public_chat_sessions(lead_temperature) 
  WHERE lead_temperature IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_public_chat_sessions_lead_score 
  ON public_chat_sessions(lead_score) 
  WHERE lead_score IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_public_chat_sessions_current_product 
  ON public_chat_sessions(current_product_id) 
  WHERE current_product_id IS NOT NULL;

-- Add composite index for sales analytics
CREATE INDEX IF NOT EXISTS idx_public_chat_sessions_sales_analytics 
  ON public_chat_sessions(user_id, lead_temperature, lead_score, created_at);
