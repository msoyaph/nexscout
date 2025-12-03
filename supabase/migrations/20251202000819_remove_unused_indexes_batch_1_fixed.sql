/*
  # Remove Unused Indexes - Batch 1

  Drop indexes that have never been scanned to reduce database overhead.
  Skipping constraint-backed indexes.

  ## Indexes Removed
  - idx_social_proof_active (social_proof_messages)
  - idx_social_proof_segment (social_proof_messages)
  - idx_onboarding_variant_stats_persona (onboarding_variant_stats)
  - idx_onboarding_variant_stats_variant (onboarding_variant_stats)
  - idx_pending_coin_transactions_user_id (pending_coin_transactions)
  - idx_pic_personas (product_intelligence_cache)
  - idx_pic_tags (product_intelligence_cache)
  - idx_pic_normalized (product_intelligence_cache)
  - idx_pic_classification (product_intelligence_cache)
  - idx_micro_seg_members (micro_segments)
  - idx_admin_users_role_id (admin_users)
  - idx_government_engine_health_status (government_engine_health)
  - idx_government_engine_health_department (government_engine_health)
  - idx_company_profiles_source (company_profiles)
  - idx_company_profiles_admin_link (company_profiles)

  ## Security
  These indexes are unused and can be safely removed.
  Constraint-backed indexes are skipped as they're required.
*/

-- social_proof_messages
DROP INDEX IF EXISTS public.idx_social_proof_active;
DROP INDEX IF EXISTS public.idx_social_proof_segment;

-- onboarding_variant_stats
DROP INDEX IF EXISTS public.idx_onboarding_variant_stats_persona;
DROP INDEX IF EXISTS public.idx_onboarding_variant_stats_variant;

-- pending_coin_transactions
DROP INDEX IF EXISTS public.idx_pending_coin_transactions_user_id;

-- product_intelligence_cache
DROP INDEX IF EXISTS public.idx_pic_personas;
DROP INDEX IF EXISTS public.idx_pic_tags;
DROP INDEX IF EXISTS public.idx_pic_normalized;
DROP INDEX IF EXISTS public.idx_pic_classification;

-- micro_segments
DROP INDEX IF EXISTS public.idx_micro_seg_members;

-- admin_users
DROP INDEX IF EXISTS public.idx_admin_users_role_id;

-- government_engine_health
DROP INDEX IF EXISTS public.idx_government_engine_health_status;
DROP INDEX IF EXISTS public.idx_government_engine_health_department;

-- company_profiles
DROP INDEX IF EXISTS public.idx_company_profiles_source;
DROP INDEX IF EXISTS public.idx_company_profiles_admin_link;