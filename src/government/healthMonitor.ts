/**
 * Health Monitoring System
 *
 * PURPOSE:
 * Provides real-time health checks for the entire NexScout system.
 * Acts as the heartbeat and doctor for the government infrastructure.
 *
 * RESPONSIBILITIES:
 * - Run comprehensive health checks
 * - Monitor database performance
 * - Track orchestrator latency
 * - Calculate error rates
 * - Store health history
 * - Classify system status (GREEN/YELLOW/RED)
 */

import { supabase } from '../lib/supabase';
import { getAllDepartmentStatuses } from './departments';
import type { DepartmentStatus } from './types/government';

// ============================================================================
// TYPES
// ============================================================================

export interface HealthCheckResult {
  id: string;
  overallStatus: 'GREEN' | 'YELLOW' | 'RED';
  departments: DepartmentStatus[];
  orchestratorLatencyMs: number;
  dbLatencyMs: number;
  errorRate24h: number;
  totalJobs24h: number;
  failedJobs24h: number;
  blockedJobs24h: number;
  notes?: string[];
  createdAt: string;
}

// ============================================================================
// CORE HEALTH CHECK FUNCTION
// ============================================================================

/**
 * PURPOSE: Run a full system health check
 * OUTPUT: Complete health status with all metrics
 */
async function runFullHealthCheck(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  const notes: string[] = [];

  try {
    // Step 1: Check database latency
    const dbLatency = await measureDatabaseLatency();
    if (dbLatency > 1000) {
      notes.push(`High DB latency: ${dbLatency}ms`);
    }

    // Step 2: Get all department statuses
    const departments = await getAllDepartmentStatuses();
    const redDepts = departments.filter(d => d.health === 'RED');
    const yellowDepts = departments.filter(d => d.health === 'YELLOW');

    if (redDepts.length > 0) {
      notes.push(`${redDepts.length} departments critical: ${redDepts.map(d => d.code).join(', ')}`);
    }
    if (yellowDepts.length > 0) {
      notes.push(`${yellowDepts.length} departments degraded: ${yellowDepts.map(d => d.code).join(', ')}`);
    }

    // Step 3: Calculate orchestrator metrics
    const orchestratorMetrics = await getOrchestratorMetrics();
    const orchestratorLatency = orchestratorMetrics.avgLatency;

    if (orchestratorLatency > 5000) {
      notes.push(`High orchestrator latency: ${orchestratorLatency}ms`);
    }

    // Step 4: Calculate error rate
    const { errorRate, totalJobs, failedJobs } = await calculateErrorRate();

    if (errorRate > 5) {
      notes.push(`High error rate: ${errorRate.toFixed(2)}%`);
    }

    // Step 5: Get blocked jobs count
    const blockedJobs = await getBlockedJobsCount();

    if (blockedJobs > 50) {
      notes.push(`High blocked jobs: ${blockedJobs} in last 24h`);
    }

    // Step 6: Determine overall status
    const overallStatus = determineOverallStatus(
      departments,
      errorRate,
      dbLatency,
      orchestratorLatency
    );

    // Step 7: Create result
    const result: HealthCheckResult = {
      id: crypto.randomUUID(),
      overallStatus,
      departments,
      orchestratorLatencyMs: orchestratorLatency,
      dbLatencyMs: dbLatency,
      errorRate24h: parseFloat(errorRate.toFixed(2)),
      totalJobs24h: totalJobs,
      failedJobs24h: failedJobs,
      blockedJobs24h: blockedJobs,
      notes: notes.length > 0 ? notes : undefined,
      createdAt: new Date().toISOString(),
    };

    // Step 8: Store in database
    await storeHealthCheck(result);

    const totalTime = Date.now() - startTime;
    console.log(`[HealthMonitor] Health check completed in ${totalTime}ms`);

    return result;
  } catch (error: any) {
    console.error('[HealthMonitor] Health check failed:', error);

    const fallbackResult: HealthCheckResult = {
      id: crypto.randomUUID(),
      overallStatus: 'RED',
      departments: [],
      orchestratorLatencyMs: 0,
      dbLatencyMs: 0,
      errorRate24h: 0,
      totalJobs24h: 0,
      failedJobs24h: 0,
      blockedJobs24h: 0,
      notes: [`Health check failed: ${error.message}`],
      createdAt: new Date().toISOString(),
    };

    await storeHealthCheck(fallbackResult);
    return fallbackResult;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * PURPOSE: Measure database response time
 * OUTPUT: Latency in milliseconds
 */
async function measureDatabaseLatency(): Promise<number> {
  const start = Date.now();
  try {
    await supabase.from('profiles').select('id').limit(1);
    return Date.now() - start;
  } catch (error) {
    return 9999;
  }
}

/**
 * PURPOSE: Get orchestrator performance metrics
 * OUTPUT: Average latency and job counts
 */
async function getOrchestratorMetrics() {
  try {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const { data: events } = await supabase
      .from('orchestrator_events')
      .select('metadata')
      .gte('created_at', last24Hours.toISOString())
      .limit(1000);

    if (!events || events.length === 0) {
      return { avgLatency: 0, totalEvents: 0 };
    }

    const latencies = events
      .filter(e => e.metadata?.duration)
      .map(e => e.metadata.duration);

    const avgLatency = latencies.length > 0
      ? Math.round(latencies.reduce((sum, l) => sum + l, 0) / latencies.length)
      : 0;

    return {
      avgLatency,
      totalEvents: events.length,
    };
  } catch (error) {
    console.error('[HealthMonitor] getOrchestratorMetrics error:', error);
    return { avgLatency: 0, totalEvents: 0 };
  }
}

/**
 * PURPOSE: Calculate error rate for last 24 hours
 * OUTPUT: Error rate percentage and job counts
 */
async function calculateErrorRate(): Promise<{
  errorRate: number;
  totalJobs: number;
  failedJobs: number;
}> {
  try {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const { count: totalJobs } = await supabase
      .from('orchestrator_events')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', last24Hours.toISOString());

    const { count: failedJobs } = await supabase
      .from('orchestrator_events')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'FAILED')
      .gte('created_at', last24Hours.toISOString());

    const errorRate = totalJobs && totalJobs > 0
      ? ((failedJobs || 0) / totalJobs) * 100
      : 0;

    return {
      errorRate,
      totalJobs: totalJobs || 0,
      failedJobs: failedJobs || 0,
    };
  } catch (error) {
    console.error('[HealthMonitor] calculateErrorRate error:', error);
    return { errorRate: 0, totalJobs: 0, failedJobs: 0 };
  }
}

/**
 * PURPOSE: Get count of blocked jobs by Supreme Court
 * OUTPUT: Number of blocked jobs in last 24h
 */
async function getBlockedJobsCount(): Promise<number> {
  try {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const { count } = await supabase
      .from('audit_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('postcheck_blocked', true)
      .gte('created_at', last24Hours.toISOString());

    return count || 0;
  } catch (error) {
    console.error('[HealthMonitor] getBlockedJobsCount error:', error);
    return 0;
  }
}

/**
 * PURPOSE: Determine overall system status
 * INPUT: Departments, error rate, latencies
 * OUTPUT: GREEN, YELLOW, or RED
 */
function determineOverallStatus(
  departments: DepartmentStatus[],
  errorRate: number,
  dbLatency: number,
  orchestratorLatency: number
): 'GREEN' | 'YELLOW' | 'RED' {
  const redDepts = departments.filter(d => d.health === 'RED').length;
  const yellowDepts = departments.filter(d => d.health === 'YELLOW').length;

  if (
    redDepts > 0 ||
    errorRate > 5 ||
    dbLatency > 2000 ||
    orchestratorLatency > 10000
  ) {
    return 'RED';
  }

  if (
    yellowDepts > 2 ||
    errorRate > 1 ||
    dbLatency > 1000 ||
    orchestratorLatency > 5000
  ) {
    return 'YELLOW';
  }

  return 'GREEN';
}

/**
 * PURPOSE: Store health check result in database
 * INPUT: HealthCheckResult
 */
async function storeHealthCheck(result: HealthCheckResult): Promise<void> {
  try {
    await supabase.from('system_health_checks').insert({
      overall_status: result.overallStatus,
      departments: JSON.stringify(result.departments),
      orchestrator_latency_ms: result.orchestratorLatencyMs,
      db_latency_ms: result.dbLatencyMs,
      error_rate_24h: result.errorRate24h,
      total_jobs_24h: result.totalJobs24h,
      failed_jobs_24h: result.failedJobs24h,
      blocked_jobs_24h: result.blockedJobs24h,
      notes: JSON.stringify(result.notes || []),
    });

    console.log(`[HealthMonitor] Health check stored: ${result.overallStatus}`);
  } catch (error) {
    console.error('[HealthMonitor] Failed to store health check:', error);
  }
}

/**
 * PURPOSE: Get the most recent health check
 * OUTPUT: Latest HealthCheckResult or null
 */
async function getLatestHealthCheck(): Promise<HealthCheckResult | null> {
  try {
    const { data } = await supabase
      .from('system_health_checks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) return null;

    return mapDatabaseToHealthCheck(data);
  } catch (error) {
    console.error('[HealthMonitor] getLatestHealthCheck error:', error);
    return null;
  }
}

/**
 * PURPOSE: Get health check history
 * INPUT: Number of checks to retrieve
 * OUTPUT: Array of HealthCheckResults
 */
async function getHealthHistory(limit: number = 24): Promise<HealthCheckResult[]> {
  try {
    const { data } = await supabase
      .from('system_health_checks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!data) return [];

    return data.map(mapDatabaseToHealthCheck);
  } catch (error) {
    console.error('[HealthMonitor] getHealthHistory error:', error);
    return [];
  }
}

/**
 * PURPOSE: Map database row to HealthCheckResult
 */
function mapDatabaseToHealthCheck(data: any): HealthCheckResult {
  return {
    id: data.id,
    overallStatus: data.overall_status,
    departments: JSON.parse(data.departments || '[]'),
    orchestratorLatencyMs: data.orchestrator_latency_ms,
    dbLatencyMs: data.db_latency_ms,
    errorRate24h: parseFloat(data.error_rate_24h || 0),
    totalJobs24h: data.total_jobs_24h || 0,
    failedJobs24h: data.failed_jobs_24h || 0,
    blockedJobs24h: data.blocked_jobs_24h || 0,
    notes: JSON.parse(data.notes || '[]'),
    createdAt: data.created_at,
  };
}

// ============================================================================
// EXPORT HEALTH MONITOR API
// ============================================================================

export const HealthMonitor = {
  runFullHealthCheck,
  getLatestHealthCheck,
  getHealthHistory,
};
