/**
 * Certification Engine
 * Validates and certifies engines before they can run in production
 */

import { supabase } from '../lib/supabase';
import type { EngineDefinition } from './enginesRegistry';

export interface CertificationResult {
  certified: boolean;
  testResults?: any;
  healthCheck?: any;
  errors?: string[];
}

/**
 * Certify an engine
 */
export async function certifyEngine(
  engine: EngineDefinition
): Promise<CertificationResult> {
  try {
    console.log(`[Certification] Certifying engine: ${engine.id}`);

    const testResults = await runEngineTests(engine);
    const healthCheck = engine.healthCheck
      ? await engine.healthCheck()
      : { status: 'no_health_check', passed: true };

    const certified =
      testResults.passed === true && healthCheck.passed === true;

    await supabase.from('engine_certification').upsert({
      engine_id: engine.id,
      certified,
      last_test_result: testResults,
      last_health_check: healthCheck,
      certification_date: certified ? new Date().toISOString() : null,
      expires_at: certified
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    });

    return {
      certified,
      testResults,
      healthCheck,
    };
  } catch (error: any) {
    console.error('[Certification] Error certifying engine:', error);
    return {
      certified: false,
      errors: [error.message],
    };
  }
}

/**
 * Check if engine is certified
 */
export async function isCertified(engineId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('engine_certification')
      .select('certified, expires_at')
      .eq('engine_id', engineId)
      .maybeSingle();

    if (error || !data) return false;

    if (!data.certified) return false;

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Certification] Error checking certification:', error);
    return false;
  }
}

/**
 * Run engine tests
 */
async function runEngineTests(engine: EngineDefinition): Promise<any> {
  try {
    const { data: tests } = await supabase
      .from('engine_tests')
      .select('*')
      .eq('engine_id', engine.id);

    if (!tests || tests.length === 0) {
      return {
        passed: true,
        message: 'No tests defined for this engine',
        total: 0,
        failed: 0,
      };
    }

    let passedCount = 0;
    let failedCount = 0;

    for (const test of tests) {
      try {
        const result = await executeTest(engine, test);
        if (result.passed) {
          passedCount++;
        } else {
          failedCount++;
        }

        await supabase
          .from('engine_tests')
          .update({
            passed: result.passed,
            output: result.output,
            last_run: new Date().toISOString(),
          })
          .eq('id', test.id);
      } catch (error: any) {
        failedCount++;
        console.error(`[Certification] Test failed: ${test.test_name}`, error);
      }
    }

    return {
      passed: failedCount === 0,
      total: tests.length,
      passedCount,
      failedCount,
    };
  } catch (error) {
    console.error('[Certification] Error running tests:', error);
    return {
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Execute a single test
 */
async function executeTest(engine: EngineDefinition, test: any): Promise<any> {
  try {
    const testPayload = test.payload || {};
    const result = await engine.run(testPayload);

    return {
      passed: result !== null && result !== undefined,
      output: result,
    };
  } catch (error) {
    return {
      passed: false,
      output: error instanceof Error ? error.message : 'Test execution failed',
    };
  }
}

/**
 * Get certification status for all engines
 */
export async function getAllCertifications() {
  try {
    const { data, error } = await supabase
      .from('engine_certification')
      .select('*')
      .order('engine_id');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[Certification] Error fetching certifications:', error);
    return [];
  }
}

/**
 * Recertify all engines
 */
export async function recertifyAllEngines(engines: EngineDefinition[]) {
  const results = [];

  for (const engine of engines) {
    const result = await certifyEngine(engine);
    results.push({
      engineId: engine.id,
      ...result,
    });
  }

  return results;
}
