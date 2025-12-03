/**
 * Engine Routing Logic
 * Finds the correct engine to handle a given jobType and subType
 *
 * ROUTING LOGIC:
 * 1. Try to find exact match (jobType + subType)
 * 2. Fall back to jobType-only match
 * 3. Return null if no engine can handle the job
 */

import { EnginesRegistry, type EngineDefinition } from './enginesRegistry';

/**
 * Find the appropriate engine for a job
 *
 * @param jobType - The type of job to execute (e.g., 'SCAN', 'MESSAGE')
 * @param subType - Optional subtype for more specific routing (e.g., 'DEEP_SCAN', 'REVIVE')
 * @returns The engine that can handle this job, or null if none found
 *
 * @example
 * // Find engine for deep scan
 * const engine = findEngine('SCAN', 'DEEP_SCAN');
 * // Returns: SCAN_DEEP engine
 *
 * @example
 * // Find engine for basic message
 * const engine = findEngine('MESSAGE');
 * // Returns: AI_MESSAGE engine
 */
export function findEngine(
  jobType: string,
  subType?: string
): EngineDefinition | null {
  const engines = Object.values(EnginesRegistry);

  // Strategy 1: Perfect match → jobType + subType
  if (subType) {
    const exact = engines.find(
      (e) =>
        e.handles.jobTypes.includes(jobType) &&
        e.handles.subTypes?.includes(subType)
    );
    if (exact) {
      console.log(`[FindEngine] Exact match: ${exact.id} for ${jobType}:${subType}`);
      return exact;
    }
  }

  // Strategy 2: Fallback → match jobType only
  const fallback = engines.find((e) => e.handles.jobTypes.includes(jobType));
  if (fallback) {
    console.log(`[FindEngine] Fallback match: ${fallback.id} for ${jobType}`);
    return fallback;
  }

  // Strategy 3: No engine found
  console.warn(`[FindEngine] No engine found for ${jobType}${subType ? ':' + subType : ''}`);
  return null;
}

/**
 * Get all engines that can handle a specific jobType
 * Useful for finding alternatives or fallbacks
 */
export function findAllEnginesForJobType(jobType: string): EngineDefinition[] {
  return Object.values(EnginesRegistry).filter((e) =>
    e.handles.jobTypes.includes(jobType)
  );
}

/**
 * Check if any engine can handle a jobType/subType combination
 */
export function canHandleJob(jobType: string, subType?: string): boolean {
  return findEngine(jobType, subType) !== null;
}
