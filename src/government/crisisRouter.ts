/**
 * Crisis Router
 * Routes jobs to healthy engines with fallback support
 */

import { supabase } from '../lib/supabase';
import { findEngine } from './findEngine';
import { getEngineState } from './crisisDetectionService';
import { isCertified } from './certificationEngine';
import type { EngineDefinition } from './enginesRegistry';

export type EngineMode = 'normal' | 'degraded' | 'fallback';

export interface ResolvedEngine {
  engine: EngineDefinition;
  mode: EngineMode;
  originalEngineId?: string;
}

/**
 * Resolve the best engine for a job considering health status
 */
export async function resolveEngineForJob(params: {
  jobType: string;
  subType?: string;
  preferredEngineId?: string;
}): Promise<ResolvedEngine | null> {
  try {
    const baseEngine = params.preferredEngineId
      ? await getEngineById(params.preferredEngineId)
      : findEngine(params.jobType, params.subType);

    if (!baseEngine) {
      console.error('[CrisisRouter] No engine found for job');
      return null;
    }

    const engineState = await getEngineState(baseEngine.id);

    if (engineState.status === 'GREEN') {
      return {
        engine: baseEngine,
        mode: 'normal',
      };
    }

    if (engineState.status === 'YELLOW') {
      const policy = await getCrisisPolicy(baseEngine.id);
      if (policy?.allow_degraded && policy.action_on_yellow === 'degrade') {
        return {
          engine: baseEngine,
          mode: 'degraded',
        };
      }
    }

    if (engineState.status === 'RED') {
      const fallbackEngine = await findHealthyFallback(baseEngine.id);
      if (fallbackEngine) {
        await logFallback(
          baseEngine.id,
          fallbackEngine.id,
          'Engine in RED status'
        );
        return {
          engine: fallbackEngine,
          mode: 'fallback',
          originalEngineId: baseEngine.id,
        };
      }
    }

    console.warn('[CrisisRouter] No healthy engine available, using degraded');
    return {
      engine: baseEngine,
      mode: 'degraded',
    };
  } catch (error) {
    console.error('[CrisisRouter] Error resolving engine:', error);
    return null;
  }
}

/**
 * Find a healthy fallback engine
 */
async function findHealthyFallback(
  engineId: string
): Promise<EngineDefinition | null> {
  try {
    const policy = await getCrisisPolicy(engineId);
    if (!policy?.fallback_engine_ids || policy.fallback_engine_ids.length === 0) {
      return null;
    }

    for (const fallbackId of policy.fallback_engine_ids) {
      const engine = await getEngineById(fallbackId);
      if (!engine) continue;

      const state = await getEngineState(fallbackId);
      const certified = await isCertified(fallbackId);

      if (state.status !== 'RED' && certified) {
        return engine;
      }
    }

    return null;
  } catch (error) {
    console.error('[CrisisRouter] Error finding fallback:', error);
    return null;
  }
}

/**
 * Get engine by ID
 */
async function getEngineById(
  engineId: string
): Promise<EngineDefinition | null> {
  try {
    const { EnginesRegistry } = await import('./enginesRegistry');
    return EnginesRegistry[engineId] || null;
  } catch (error) {
    console.error('[CrisisRouter] Error getting engine by ID:', error);
    return null;
  }
}

/**
 * Get crisis policy for engine
 */
async function getCrisisPolicy(engineId: string) {
  try {
    const { data } = await supabase
      .from('crisis_policies')
      .select('*')
      .eq('engine_id', engineId)
      .maybeSingle();

    return data;
  } catch (error) {
    console.error('[CrisisRouter] Error getting policy:', error);
    return null;
  }
}

/**
 * Log fallback usage
 */
async function logFallback(
  originalEngineId: string,
  fallbackEngineId: string,
  reason: string
): Promise<void> {
  try {
    await supabase.from('engine_fallback_logs').insert({
      original_engine_id: originalEngineId,
      fallback_engine_id: fallbackEngineId,
      reason,
    });
  } catch (error) {
    console.error('[CrisisRouter] Error logging fallback:', error);
  }
}

/**
 * Force a specific engine into fallback mode
 */
export async function forceFallback(
  engineId: string,
  targetStatus: 'YELLOW' | 'RED' = 'RED'
): Promise<void> {
  try {
    await supabase.from('engine_states').upsert({
      engine_id: engineId,
      status: targetStatus,
      last_updated: new Date().toISOString(),
      last_reason: 'Manually forced by admin',
    });

    await supabase.from('crisis_incidents').insert({
      engine_id: engineId,
      status: 'OPEN',
      severity: targetStatus,
      reason: 'Manually forced by admin',
    });
  } catch (error) {
    console.error('[CrisisRouter] Error forcing fallback:', error);
  }
}

/**
 * Resolve a crisis incident
 */
export async function resolveIncident(incidentId: string): Promise<void> {
  try {
    await supabase
      .from('crisis_incidents')
      .update({
        status: 'RESOLVED',
        resolved_at: new Date().toISOString(),
      })
      .eq('id', incidentId);

    const { data: incident } = await supabase
      .from('crisis_incidents')
      .select('engine_id')
      .eq('id', incidentId)
      .maybeSingle();

    if (incident) {
      await supabase
        .from('engine_states')
        .update({
          status: 'GREEN',
          last_updated: new Date().toISOString(),
          last_reason: 'Incident manually resolved',
        })
        .eq('engine_id', incident.engine_id);
    }
  } catch (error) {
    console.error('[CrisisRouter] Error resolving incident:', error);
  }
}
