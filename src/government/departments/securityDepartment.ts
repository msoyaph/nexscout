/**
 * Security Department
 *
 * PURPOSE:
 * Protects systems, data, and users from threats
 *
 * RESPONSIBILITIES:
 * - Threat detection
 * - API protection
 * - Rate limiting
 * - Vulnerability scanning
 * - Access control
 */

import { supabase } from '../../lib/supabase';
import type { DepartmentStatus, DepartmentAPI } from '../types/government';
import { createDefaultStatus, countOpenIncidents, determineHealth, getLastAuditTime } from './baseDepartment';

const DEPARTMENT_ID = 'security';
const DEPARTMENT_CODE = 'SEC';
const DEPARTMENT_NAME = 'Security';
const MANAGED_ENGINES: string[] = [
  'company_ai_safety_engine',
  'supreme_court_engine',
  'content_moderation',
];

async function getStatus(): Promise<DepartmentStatus> {
  const incidents = await countOpenIncidents();
  const blockedJobs = await countBlockedJobs();
  const health = determineHealth(incidents + blockedJobs);
  const lastAudit = await getLastAuditTime();

  return {
    ...createDefaultStatus(DEPARTMENT_ID, DEPARTMENT_NAME, DEPARTMENT_CODE, MANAGED_ENGINES, health),
    openIncidents: incidents + blockedJobs,
    lastAuditAt: lastAudit,
    notes: blockedJobs > 0 ? `${blockedJobs} jobs blocked in last 24h` : 'No security incidents',
  };
}

async function getEngines(): Promise<string[]> {
  return MANAGED_ENGINES;
}

async function runSelfCheck(): Promise<DepartmentStatus> {
  const blockedJobs = await countBlockedJobs();
  const bannedUsers = await countBannedUsers();

  const health: 'GREEN' | 'YELLOW' | 'RED' =
    blockedJobs > 50 ? 'RED' : blockedJobs > 20 ? 'YELLOW' : 'GREEN';

  return {
    ...createDefaultStatus(DEPARTMENT_ID, DEPARTMENT_NAME, DEPARTMENT_CODE, MANAGED_ENGINES, health),
    openIncidents: blockedJobs,
    lastAuditAt: new Date().toISOString(),
    notes: `${blockedJobs} blocked jobs, ${bannedUsers} banned users`,
  };
}

async function listOpenIssues(): Promise<any[]> {
  try {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const { data } = await supabase
      .from('audit_jobs')
      .select('*')
      .eq('postcheck_blocked', true)
      .gte('created_at', last24Hours.toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    return (data || []).map(job => ({
      type: 'security_block',
      severity: 'high',
      message: `Job blocked: ${job.job_type}`,
      timestamp: job.created_at,
      userId: job.user_id,
    }));
  } catch (error) {
    return [];
  }
}

async function countBlockedJobs(): Promise<number> {
  try {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const { count } = await supabase
      .from('audit_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('postcheck_blocked', true)
      .gte('created_at', last24Hours.toISOString());

    return count || 0;
  } catch (error) {
    return 0;
  }
}

async function countBannedUsers(): Promise<number> {
  try {
    const { count } = await supabase
      .from('banned_users')
      .select('*', { count: 'exact', head: true });

    return count || 0;
  } catch (error) {
    return 0;
  }
}

export const securityDepartment: DepartmentAPI = {
  getStatus,
  getEngines,
  runSelfCheck,
  listOpenIssues,
};
