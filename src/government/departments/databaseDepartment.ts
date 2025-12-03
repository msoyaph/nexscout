/**
 * Database Department
 *
 * PURPOSE:
 * Manages data storage, integrity, and performance
 *
 * RESPONSIBILITIES:
 * - Schema management
 * - Index optimization
 * - Backup coordination
 * - Query performance
 * - Data lake management
 */

import type { DepartmentStatus, DepartmentAPI } from '../types/government';
import { createDefaultStatus, countOpenIncidents, determineHealth, getLastAuditTime, checkTableExists } from './baseDepartment';

const DEPARTMENT_ID = 'database';
const DEPARTMENT_CODE = 'DB';
const DEPARTMENT_NAME = 'Database';
const MANAGED_ENGINES: string[] = [
  'company_knowledge_graph',
  'company_vector_store',
  'social_graph_builder',
  'data_fusion_engine',
];

const CRITICAL_TABLES = [
  'profiles',
  'prospects',
  'scans',
  'user_subscriptions',
  'orchestrator_events',
  'audit_jobs',
];

async function getStatus(): Promise<DepartmentStatus> {
  const incidents = await countOpenIncidents();
  const health = determineHealth(incidents);
  const lastAudit = await getLastAuditTime();

  return {
    ...createDefaultStatus(DEPARTMENT_ID, DEPARTMENT_NAME, DEPARTMENT_CODE, MANAGED_ENGINES, health),
    openIncidents: incidents,
    lastAuditAt: lastAudit,
    notes: 'Database systems operational',
  };
}

async function getEngines(): Promise<string[]> {
  return MANAGED_ENGINES;
}

async function runSelfCheck(): Promise<DepartmentStatus> {
  const checks: string[] = [];

  for (const table of CRITICAL_TABLES) {
    const exists = await checkTableExists(table);
    if (!exists) {
      checks.push(`Missing table: ${table}`);
    }
  }

  const health: 'GREEN' | 'YELLOW' | 'RED' = checks.length > 0 ? 'RED' : 'GREEN';

  return {
    ...createDefaultStatus(DEPARTMENT_ID, DEPARTMENT_NAME, DEPARTMENT_CODE, MANAGED_ENGINES, health),
    openIncidents: checks.length,
    lastAuditAt: new Date().toISOString(),
    notes: checks.length > 0 ? checks.join(', ') : 'All critical tables present',
  };
}

async function listOpenIssues(): Promise<any[]> {
  return [];
}

export const databaseDepartment: DepartmentAPI = {
  getStatus,
  getEngines,
  runSelfCheck,
  listOpenIssues,
};
