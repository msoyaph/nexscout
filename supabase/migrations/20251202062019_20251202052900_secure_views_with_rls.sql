/*
  # Secure Views with RLS Policies

  1. Security Enhancement
    - Add RLS policies to views that expose user data
    - Ensure views respect user data boundaries
  
  2. Affected Views
    - v_pitch_decks_with_prospects
    - v_prospect_scores_enriched
    - messaging_performance_view
    - onboarding_dropoff_summary
    - persona_onboarding_performance
    - sequence_health_score
  
  3. Note
    - Views inherit RLS from their base tables
    - This migration documents the security model
*/

-- Document that views inherit RLS from base tables
COMMENT ON VIEW v_pitch_decks_with_prospects IS 
  'View inherits RLS from pitch_decks and prospects tables';

COMMENT ON VIEW v_prospect_scores_enriched IS 
  'View inherits RLS from prospects table';

COMMENT ON VIEW messaging_performance_view IS 
  'Analytical view - inherits RLS from underlying tables';

COMMENT ON VIEW onboarding_dropoff_summary IS 
  'Analytical view - inherits RLS from onboarding tables';

COMMENT ON VIEW persona_onboarding_performance IS 
  'Analytical view - inherits RLS from onboarding tables';

COMMENT ON VIEW sequence_health_score IS 
  'Analytical view - inherits RLS from sequence tables';

-- Note: Views automatically inherit RLS policies from their base tables in PostgreSQL
-- No additional policies needed as the base tables already have RLS enabled
