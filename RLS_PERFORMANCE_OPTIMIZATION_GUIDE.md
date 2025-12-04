# RLS Performance Optimization Guide

## Overview
Supabase has identified 119+ Row Level Security (RLS) policies that need performance optimization. These policies use `auth.uid()` which gets re-evaluated for each row, causing performance degradation at scale.

## The Issue
When RLS policies use `auth.uid()` directly like this:
```sql
USING (user_id = auth.uid())
```

The `auth.uid()` function is called for EVERY row being scanned, which is inefficient.

## The Solution
Wrap `auth.uid()` in a SELECT subquery:
```sql
USING (user_id = (select auth.uid()))
```

This causes the auth function to be evaluated ONCE per query instead of once per row, dramatically improving performance at scale.

## Affected Tables (119+ policies across 44 tables)

### Primary Tables
- library_groups (4 policies)
- social_edges (3 policies)
- social_contact_features (3 policies)
- pending_coin_transactions (3 policies)
- social_graph_metrics (3 policies)
- social_contacts (4 policies)
- social_interactions (2 policies)
- uploaded_batches (4 policies)
- uploaded_files (4 policies)
- extracted_entities (4 policies)
- ai_smartness (3 policies)
- scan_sessions (4 policies)
- scan_session_files (4 policies)
- scan_session_social_data (4 policies)
- scan_session_prospects (4 policies)
- social_connections (4 policies)
- scans (4 policies)
- referral_codes (2 policies)
- referrals (2 policies)
- contact_behavior_timeline (3 policies)
- prospect_behavior_summary (3 policies)
- scan_processed_items (4 policies)
- scan_ocr_results (2 policies)
- scan_taglish_analysis (3 policies)
- social_identities (4 policies)
- social_page_insights (2 policies)
- linkedin_page_insights (2 policies)
- tiktok_insights (2 policies)
- twitter_insights (2 policies)
- scan_smartness_events (2 policies)
- social_connect_logs (2 policies)
- social_graph_nodes (5 policies)
- social_graph_edges (5 policies)
- browser_capture_events (6 policies)
- browser_captures (5 policies)
- browser_extension_tokens (5 policies)
- social_graph_insights (3 policies)
- scan_progress (3 policies)
- scan_extracted_data (2 policies)

### And 6 more tables with additional policies

## Impact

### Current State
- Policies work correctly
- No functional issues
- Performance acceptable for small datasets (<1000 rows)

### At Scale (10,000+ rows)
- Query performance degrades linearly with row count
- Database CPU usage increases significantly
- Response times slow down noticeably
- User experience suffers

## Implementation Strategy

### Option 1: Gradual Migration (Recommended)
Fix policies incrementally, starting with most-used tables:
1. scans and scan_progress (active scanning)
2. social_contacts and social_interactions (social graph)
3. browser_captures (extension data)
4. Remaining tables in batches

### Option 2: Bulk Migration
Create comprehensive migration fixing all policies at once.

**Pros:**
- One-time fix
- Complete optimization

**Cons:**
- Large migration file
- Higher risk of errors
- Harder to debug issues

## Example Migration Pattern

```sql
-- Example for one table
DROP POLICY IF EXISTS "Users can view own data" ON table_name;
CREATE POLICY "Users can view own data"
  ON table_name FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can create own data" ON table_name;
CREATE POLICY "Users can create own data"
  ON table_name FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own data" ON table_name;
CREATE POLICY "Users can update own data"
  ON table_name FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own data" ON table_name;
CREATE POLICY "Users can delete own data"
  ON table_name FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));
```

## Other Security Issues Identified

### 1. Unused Indexes (190+ indexes)
Many indexes are created but never used by queries. Consider dropping unused indexes to:
- Reduce storage
- Improve write performance
- Simplify maintenance

### 2. Multiple Permissive Policies (13 tables)
Some tables have multiple SELECT policies that are all permissive, which can cause confusion:
- ai_message_sequences
- browser_capture_events
- browser_captures
- browser_extension_tokens
- coin_transactions
- pitch_decks
- referrals
- social_graph_edges
- social_graph_insights
- social_graph_nodes
- team_members
- team_subscriptions
- training_video_modules

### 3. Security Definer Views (2 views)
These views run with elevated privileges:
- v_prospect_scores_enriched
- v_pitch_decks_with_prospects

Ensure these don't leak sensitive data.

### 4. Function Search Path Mutable (9 functions)
Functions without fixed search paths can be vulnerable:
- increment_ai_usage
- generate_browser_extension_token
- get_user_from_extension_token
- update_social_graph_nodes_updated_at
- update_scan_progress_timestamp
- format_php_currency
- cleanup_stale_pending_transactions
- calculate_smartness_score
- update_user_smartness
- generate_referral_code

### 5. Leaked Password Protection Disabled
Enable HaveIBeenPwned integration in Supabase Auth settings.

## Testing After Migration

After applying RLS optimizations:

1. **Functional Testing**
   - Verify users can only see their own data
   - Test all CRUD operations
   - Confirm cross-user isolation

2. **Performance Testing**
   ```sql
   -- Before and after comparison
   EXPLAIN ANALYZE
   SELECT * FROM scans
   WHERE user_id = auth.uid();
   ```

3. **Load Testing**
   - Test with 1,000+ rows per user
   - Measure query response times
   - Monitor database CPU usage

## Priority Ranking

### High Priority (Performance Critical)
1. scans (main scanning table)
2. scan_progress (real-time updates)
3. social_contacts (large datasets)
4. browser_captures (frequent writes)

### Medium Priority
5. All scan_session_* tables
6. social_graph_* tables
7. analytics tables

### Low Priority
8. Infrequently accessed tables
9. Small dataset tables

## Rollback Plan

If issues occur after migration:
```sql
-- Revert to original policy
DROP POLICY IF EXISTS "policy_name" ON table_name;
CREATE POLICY "policy_name"
  ON table_name FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());  -- Original format
```

## Monitoring

After optimization, monitor:
- Query execution times
- Database CPU usage
- Row scan counts
- Cache hit rates

## Conclusion

The RLS performance optimization is not urgent for current scale but becomes critical as the user base grows. The recommended approach is gradual migration starting with high-traffic tables, with thorough testing at each step.

Current system is fully functional - these are optimization opportunities, not breaking bugs.
