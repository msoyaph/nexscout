/**
 * Analytics Department
 *
 * PURPOSE:
 * Manages analytics, insights, and business intelligence
 *
 * RESPONSIBILITIES:
 * - Data analysis
 * - Funnel tracking
 * - Cohort analysis
 * - Performance metrics
 * - Insight generation
 */

import { supabase } from '../../lib/supabase';
import type { DepartmentStatus, DepartmentAPI } from '../types/government';
import { createDefaultStatus, countOpenIncidents, determineHealth, getLastAuditTime } from './baseDepartment';

const DEPARTMENT_ID = 'analytics';
const DEPARTMENT_CODE = 'ANLY';
const DEPARTMENT_NAME = 'Analytics';
const MANAGED_ENGINES: string[] = [
  'analytics_engine_v2',
  'funnel_analytics',
  'nudge_analytics',
  'conversion_tracker',
  'ab_testing_engine',
  'retention_engine',
];

async function getStatus(): Promise<DepartmentStatus> {
  const incidents = await countOpenIncidents();
  const totalEvents = await countRecentEvents();
  const health = determineHealth(incidents);
  const lastAudit = await getLastAuditTime();

  return {
    ...createDefaultStatus(DEPARTMENT_ID, DEPARTMENT_NAME, DEPARTMENT_CODE, MANAGED_ENGINES, health),
    openIncidents: incidents,
    lastAuditAt: lastAudit,
    notes: `${totalEvents} events tracked in last 24h`,
  };
}

async function getEngines(): Promise<string[]> {
  return MANAGED_ENGINES;
}

async function runSelfCheck(): Promise<DepartmentStatus> {
  const totalEvents = await countRecentEvents();
  const health = totalEvents > 0 ? 'GREEN' : 'YELLOW';

  return {
    ...createDefaultStatus(DEPARTMENT_ID, DEPARTMENT_NAME, DEPARTMENT_CODE, MANAGED_ENGINES, health),
    openIncidents: 0,
    lastAuditAt: new Date().toISOString(),
    notes: totalEvents > 0 ? `Tracking ${totalEvents} events` : 'Low event volume',
  };
}

async function listOpenIssues(): Promise<any[]> {
  return [];
}

async function countRecentEvents(): Promise<number> {
  try {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const { count } = await supabase
      .from('orchestrator_events')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', last24Hours.toISOString());

    return count || 0;
  } catch (error) {
    return 0;
  }
}

export const analyticsDepartment: DepartmentAPI = {
  getStatus,
  getEngines,
  runSelfCheck,
  listOpenIssues,
};
