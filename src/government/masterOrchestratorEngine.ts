/**
 * MASTER ORCHESTRATOR ENGINE
 * The "President" of NexScout Government
 *
 * RESPONSIBILITIES:
 * - Route all AI jobs to the correct engine
 * - Enforce Congress rules (tier permissions, rate limits, costs)
 * - Coordinate with Supreme Court (pre/post checks)
 * - Manage Energy and Coin deductions
 * - Log all orchestrator events
 * - Handle failures and fallbacks
 *
 * ARCHITECTURE:
 * User Request → Orchestrator → Congress → Supreme Court → Engine → Supreme Court → User
 */

import { findEngine } from './findEngine';
import { Congress } from './congressRulesEngine';
import { SupremeCourt } from './supremeCourtEngine';
import {
  getUserProfile,
  saveOrchestratorEvent,
  updateOrchestratorEvent,
  hasEnergy,
  consumeEnergy,
  hasCoins,
  consumeCoins,
} from './db/orchestratorHelpers';
import type {
  OrchestratorJobInput,
  OrchestratorJobResult,
  SubscriptionTier,
} from './types/government';

// ============================================================================
// MAIN ORCHESTRATION FUNCTION
// ============================================================================

/**
 * Orchestrate an AI Job
 *
 * This is the central coordinator for all AI operations in NexScout.
 * It handles routing, permissions, costs, and execution.
 *
 * @param input - The job request from the user
 * @returns The result of the job execution
 *
 * @example
 * const result = await orchestrateAIJob({
 *   userId: 'user-123',
 *   jobType: 'SCAN',
 *   subType: 'DEEP_SCAN',
 *   payload: { prospectData: {...} }
 * });
 */
export async function orchestrateAIJob(
  input: OrchestratorJobInput
): Promise<OrchestratorJobResult> {
  const start = performance.now();
  const jobId = crypto.randomUUID();

  console.log(`[Orchestrator] Starting job ${jobId}: ${input.jobType}${input.subType ? ':' + input.subType : ''}`);

  // ------------------------------------------------------------------------
  // STEP 1: Load User Profile
  // ------------------------------------------------------------------------
  const user = await getUserProfile(input.userId);
  if (!user) {
    return createFailureResult(
      jobId,
      input,
      'User not found',
      '',
      '',
      0,
      0,
      performance.now() - start
    );
  }

  const tier = user.subscriptionTier;
  console.log(`[Orchestrator] User ${input.userId} (${tier})`);

  // ------------------------------------------------------------------------
  // STEP 2: Log Job Started
  // ------------------------------------------------------------------------
  await saveOrchestratorEvent({
    id: jobId,
    user_id: input.userId,
    job_type: input.jobType,
    sub_type: input.subType,
    source: input.source,
    status: 'STARTED',
    created_at: new Date(),
  });

  // ------------------------------------------------------------------------
  // STEP 3: Supreme Court Pre-Check
  // ------------------------------------------------------------------------
  console.log(`[Orchestrator] Running Supreme Court pre-check...`);
  const preCheck = await SupremeCourt.preCheckJob({
    user,
    tier,
    jobType: input.jobType,
    subType: input.subType,
    source: input.source,
    payloadSummary: JSON.stringify(input.payload || {}).slice(0, 200),
  });

  if (!preCheck.allowed) {
    console.warn(`[Orchestrator] Job blocked by Supreme Court pre-check`);
    await updateOrchestratorEvent(jobId, {
      status: 'BLOCKED',
      error_message: preCheck.reasons?.join(', '),
    });

    return createFailureResult(
      jobId,
      input,
      'Blocked by Supreme Court',
      '',
      '',
      0,
      0,
      performance.now() - start,
      preCheck.reasons || ['Security policy violation']
    );
  }

  // ------------------------------------------------------------------------
  // STEP 4: Congress Permission Check
  // ------------------------------------------------------------------------
  console.log(`[Orchestrator] Checking Congress permissions...`);
  const canRun = Congress.canUserRunJob(input.jobType, tier);
  if (!canRun.allowed) {
    console.warn(`[Orchestrator] Job denied by Congress: ${canRun.reason}`);
    await updateOrchestratorEvent(jobId, {
      status: 'BLOCKED',
      error_message: canRun.reason,
    });

    return createFailureResult(
      jobId,
      input,
      canRun.reason || 'Upgrade required',
      '',
      '',
      0,
      0,
      performance.now() - start
    );
  }

  // ------------------------------------------------------------------------
  // STEP 5: Get Job Costs
  // ------------------------------------------------------------------------
  const cost = Congress.getJobCosts(
    input.jobType,
    tier,
    input.payload?.length || 0
  );
  console.log(`[Orchestrator] Job costs: ${cost.energyCost} energy, ${cost.coinCost} coins`);

  // ------------------------------------------------------------------------
  // STEP 6: Check Energy & Coins
  // ------------------------------------------------------------------------
  const energyOk = await hasEnergy(input.userId, cost.energyCost);
  if (!energyOk) {
    console.warn(`[Orchestrator] Insufficient energy`);
    await updateOrchestratorEvent(jobId, {
      status: 'FAILED',
      error_message: 'Not enough Energy',
    });

    return createFailureResult(
      jobId,
      input,
      'Not enough Energy',
      '',
      '',
      0,
      0,
      performance.now() - start
    );
  }

  const coinsOk = cost.coinCost === 0 || (await hasCoins(input.userId, cost.coinCost));
  if (!coinsOk) {
    console.warn(`[Orchestrator] Insufficient coins`);
    await updateOrchestratorEvent(jobId, {
      status: 'FAILED',
      error_message: 'Not enough Coins',
    });

    return createFailureResult(
      jobId,
      input,
      'Not enough Coins',
      '',
      '',
      0,
      0,
      performance.now() - start
    );
  }

  // ------------------------------------------------------------------------
  // STEP 7: Deduct Energy & Coins
  // ------------------------------------------------------------------------
  console.log(`[Orchestrator] Deducting resources...`);
  await consumeEnergy(input.userId, cost.energyCost, `${input.jobType} job`);
  if (cost.coinCost > 0) {
    await consumeCoins(input.userId, cost.coinCost, `${input.jobType} job`);
  }

  // ------------------------------------------------------------------------
  // STEP 8: Find Engine
  // ------------------------------------------------------------------------
  console.log(`[Orchestrator] Finding engine for ${input.jobType}:${input.subType || 'default'}...`);
  const engine = findEngine(input.jobType, input.subType);
  if (!engine) {
    console.error(`[Orchestrator] No engine found for ${input.jobType}`);
    await updateOrchestratorEvent(jobId, {
      status: 'FAILED',
      error_message: `No engine can handle jobType: ${input.jobType}`,
    });

    return createFailureResult(
      jobId,
      input,
      `No engine available for ${input.jobType}`,
      '',
      '',
      cost.energyCost,
      cost.coinCost,
      performance.now() - start
    );
  }

  console.log(`[Orchestrator] Using engine: ${engine.name} (${engine.modelPreference})`);

  // ------------------------------------------------------------------------
  // STEP 9: Execute Engine
  // ------------------------------------------------------------------------
  let engineResult: any;
  let error: any;

  try {
    console.log(`[Orchestrator] Executing engine...`);
    engineResult = await engine.run({
      jobId,
      user,
      tier,
      payload: input.payload,
      modelPreference: engine.modelPreference,
    });
    console.log(`[Orchestrator] Engine execution successful`);
  } catch (err: any) {
    error = err.message || 'Engine failed';
    console.error(`[Orchestrator] Engine execution failed:`, error);

    await updateOrchestratorEvent(jobId, {
      status: 'FAILED',
      engine_used: engine.name,
      model_used: engine.modelPreference,
      error_message: error,
      duration_ms: performance.now() - start,
    });

    return createFailureResult(
      jobId,
      input,
      error,
      engine.name,
      engine.modelPreference,
      cost.energyCost,
      cost.coinCost,
      performance.now() - start
    );
  }

  // ------------------------------------------------------------------------
  // STEP 10: Supreme Court Post-Check
  // ------------------------------------------------------------------------
  console.log(`[Orchestrator] Running Supreme Court post-check...`);
  const postCheck = await SupremeCourt.postCheckJob({
    user,
    tier,
    jobType: input.jobType,
    subType: input.subType,
    engineResult,
  });

  if (postCheck.blocked) {
    console.warn(`[Orchestrator] Output blocked by Supreme Court post-check`);
    await updateOrchestratorEvent(jobId, {
      status: 'BLOCKED',
      engine_used: engine.name,
      model_used: engine.modelPreference,
      error_message: postCheck.reasons?.join(', '),
      duration_ms: performance.now() - start,
    });

    return {
      success: false,
      jobId,
      userId: input.userId,
      jobType: input.jobType,
      engineUsed: engine.name,
      modelUsed: engine.modelPreference,
      energyCost: cost.energyCost,
      coinCost: cost.coinCost,
      durationMs: performance.now() - start,
      output: postCheck.sanitizedOutput,
      warnings: postCheck.reasons,
    };
  }

  // ------------------------------------------------------------------------
  // STEP 11: Log Success & Return
  // ------------------------------------------------------------------------
  const durationMs = performance.now() - start;
  console.log(`[Orchestrator] Job completed successfully in ${durationMs.toFixed(2)}ms`);

  await updateOrchestratorEvent(jobId, {
    status: 'COMPLETED',
    engine_used: engine.name,
    model_used: engine.modelPreference,
    duration_ms: durationMs,
    energy_cost: cost.energyCost,
    coin_cost: cost.coinCost,
  });

  return {
    success: true,
    jobId,
    userId: input.userId,
    jobType: input.jobType,
    engineUsed: engine.name,
    modelUsed: engine.modelPreference,
    energyCost: cost.energyCost,
    coinCost: cost.coinCost,
    durationMs,
    output: engineResult,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a failure result object
 */
function createFailureResult(
  jobId: string,
  input: OrchestratorJobInput,
  errorMessage: string,
  engineUsed: string,
  modelUsed: string,
  energyCost: number,
  coinCost: number,
  durationMs: number,
  errors?: string[]
): OrchestratorJobResult {
  return {
    success: false,
    jobId,
    userId: input.userId,
    jobType: input.jobType,
    engineUsed,
    modelUsed,
    energyCost,
    coinCost,
    durationMs,
    output: null,
    errors: errors || [errorMessage],
  };
}

// ============================================================================
// EXPORT MASTER ORCHESTRATOR
// ============================================================================

export const MasterOrchestrator = {
  orchestrateAIJob,

  /**
   * Orchestrate multiple jobs in parallel
   */
  async orchestrateMultipleJobs(
    inputs: OrchestratorJobInput[]
  ): Promise<OrchestratorJobResult[]> {
    return Promise.all(inputs.map((input) => orchestrateAIJob(input)));
  },

  /**
   * Get orchestrator statistics
   */
  async getStats(userId: string, timeframe: '24h' | '7d' | '30d' = '24h') {
    // Implementation would query orchestrator_events table
    return {
      totalJobs: 0,
      successfulJobs: 0,
      failedJobs: 0,
      blockedJobs: 0,
      totalEnergyCost: 0,
      totalCoinCost: 0,
      avgDuration: 0,
    };
  },
};
