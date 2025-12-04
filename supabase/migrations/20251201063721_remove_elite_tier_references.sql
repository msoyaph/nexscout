/*
  # Remove Elite Tier References

  1. Changes
    - Update orchestrator_job_costs to remove elite tier
    - Update any subscription plans with elite
    - Document removal in comments

  2. Notes
    - Elite tier is completely removed
    - System now uses: free, pro, team, enterprise
*/

-- Remove elite tier from orchestrator_job_costs
DELETE FROM orchestrator_job_costs
WHERE tier = 'elite';

-- Remove elite subscription plans if any exist
DELETE FROM subscription_plans
WHERE id = 'elite';

-- Add documentation
COMMENT ON TABLE subscription_plans IS 'Available tiers: free, pro, team, enterprise (elite tier removed)';
COMMENT ON TABLE orchestrator_job_costs IS 'Job costs for orchestrator - tiers: free, pro, team, enterprise';
