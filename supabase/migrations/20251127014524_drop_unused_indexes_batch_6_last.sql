/*
  # Drop Unused Indexes - Batch 6 (Last)

  1. Performance Optimization
    - Final batch of unused indexes
*/

DROP INDEX IF EXISTS public.idx_diagnostic_logs_user_id;
DROP INDEX IF EXISTS public.idx_scan_benchmarks_created_at;
DROP INDEX IF EXISTS public.idx_scan_benchmarks_source_type;
DROP INDEX IF EXISTS public.idx_scan_benchmarks_user_id;
DROP INDEX IF EXISTS public.idx_llm_load_tests_created_at;
DROP INDEX IF EXISTS public.idx_llm_load_tests_mode;
DROP INDEX IF EXISTS public.idx_llm_load_tests_user_id;
DROP INDEX IF EXISTS public.idx_csv_validation_logs_created_at;
DROP INDEX IF EXISTS public.idx_csv_validation_logs_user_id;
