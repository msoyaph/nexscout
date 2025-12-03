/**
 * Engineering Department
 *
 * PURPOSE:
 * Manages all AI engines, pipelines, and ML systems
 *
 * RESPONSIBILITIES:
 * - Maintain engine registry
 * - Coordinate pipeline execution
 * - Manage worker queues
 * - Oversee ML training
 * - Handle error recovery
 */

import { supabase } from '../../lib/supabase';
import type { DepartmentStatus, DepartmentAPI } from '../types/government';

const DEPARTMENT_ID = 'engineering';
const DEPARTMENT_CODE = 'ENG';
const DEPARTMENT_NAME = 'Engineering';

const MANAGED_ENGINES = [
  'scanning_engine',
  'smart_scanner_v3',
  'ocr_engine',
  'scout_scoring_v5',
  'data_fusion_engine',
  'scan_pipeline',
  'identity_match',
  'file_parser',
  'text_extractor',
];

async function getStatus(): Promise<DepartmentStatus> {
  try {
    const openIncidents = await countOpenIncidents();
    const health = determineHealth(openIncidents);
    const lastAudit = await getLastAuditTime();

    return {
      id: DEPARTMENT_ID,
      name: DEPARTMENT_NAME,
      code: DEPARTMENT_CODE,
      health,
      activeEngines: MANAGED_ENGINES,
      openIncidents,
      lastAuditAt: lastAudit,
      notes: openIncidents > 0 ? `${openIncidents} incidents require attention` : 'All systems operational',
    };
  } catch (error) {
    console.error('[Engineering Dept] getStatus error:', error);
    return {
      id: DEPARTMENT_ID,
      name: DEPARTMENT_NAME,
      code: DEPARTMENT_CODE,
      health: 'RED',
      activeEngines: MANAGED_ENGINES,
      openIncidents: 0,
      notes: 'Status check failed',
    };
  }
}

async function getEngines(): Promise<string[]> {
  return MANAGED_ENGINES;
}

async function runSelfCheck(): Promise<DepartmentStatus> {
  try {
    const checks: string[] = [];

    const scanTableCheck = await checkTableExists('scans');
    if (!scanTableCheck) {
      checks.push('scans table missing');
    }

    const uploadedFilesCheck = await checkTableExists('uploaded_files');
    if (!uploadedFilesCheck) {
      checks.push('uploaded_files table missing');
    }

    const recentErrors = await getRecentErrors();
    const criticalErrors = recentErrors.filter((e: any) =>
      e.error_message?.toLowerCase().includes('critical')
    );

    const health: 'GREEN' | 'YELLOW' | 'RED' =
      checks.length > 0 || criticalErrors.length > 5
        ? 'RED'
        : recentErrors.length > 20
        ? 'YELLOW'
        : 'GREEN';

    return {
      id: DEPARTMENT_ID,
      name: DEPARTMENT_NAME,
      code: DEPARTMENT_CODE,
      health,
      activeEngines: MANAGED_ENGINES,
      openIncidents: checks.length + criticalErrors.length,
      lastAuditAt: new Date().toISOString(),
      notes: checks.length > 0 ? checks.join(', ') : 'Self-check passed',
    };
  } catch (error) {
    console.error('[Engineering Dept] runSelfCheck error:', error);
    return {
      id: DEPARTMENT_ID,
      name: DEPARTMENT_NAME,
      code: DEPARTMENT_CODE,
      health: 'RED',
      activeEngines: MANAGED_ENGINES,
      openIncidents: 1,
      lastAuditAt: new Date().toISOString(),
      notes: 'Self-check failed',
    };
  }
}

async function listOpenIssues(): Promise<any[]> {
  try {
    const recentErrors = await getRecentErrors();
    return recentErrors.map((error: any) => ({
      type: 'error',
      severity: error.error_message?.toLowerCase().includes('critical') ? 'high' : 'medium',
      message: error.error_message || 'Unknown error',
      timestamp: error.created_at,
      engine: 'engineering',
    }));
  } catch (error) {
    console.error('[Engineering Dept] listOpenIssues error:', error);
    return [];
  }
}

async function countOpenIncidents(): Promise<number> {
  try {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const { count } = await supabase
      .from('diagnostic_logs')
      .select('*', { count: 'exact', head: true })
      .eq('log_level', 'error')
      .gte('created_at', last24Hours.toISOString());

    return count || 0;
  } catch (error) {
    return 0;
  }
}

function determineHealth(incidents: number): 'GREEN' | 'YELLOW' | 'RED' {
  if (incidents === 0) return 'GREEN';
  if (incidents < 10) return 'YELLOW';
  return 'RED';
}

async function getLastAuditTime(): Promise<string | undefined> {
  try {
    const { data } = await supabase
      .from('audit_jobs')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return data?.created_at;
  } catch (error) {
    return undefined;
  }
}

async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const { error } = await supabase.from(tableName).select('id').limit(1);
    return !error;
  } catch (error) {
    return false;
  }
}

async function getRecentErrors(): Promise<any[]> {
  try {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const { data } = await supabase
      .from('diagnostic_logs')
      .select('*')
      .eq('log_level', 'error')
      .gte('created_at', last24Hours.toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    return data || [];
  } catch (error) {
    return [];
  }
}

export const engineeringDepartment: DepartmentAPI = {
  getStatus,
  getEngines,
  runSelfCheck,
  listOpenIssues,
};
