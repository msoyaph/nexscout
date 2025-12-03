/**
 * Base Department Helper
 *
 * PURPOSE:
 * Provides common functionality for all departments
 */

import { supabase } from '../../lib/supabase';
import type { DepartmentStatus, DepartmentHealth } from '../types/government';

export async function countOpenIncidents(): Promise<number> {
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

export function determineHealth(incidents: number): DepartmentHealth {
  if (incidents === 0) return 'GREEN';
  if (incidents < 10) return 'YELLOW';
  return 'RED';
}

export async function getLastAuditTime(): Promise<string | undefined> {
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

export async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const { error } = await supabase.from(tableName).select('id').limit(1);
    return !error;
  } catch (error) {
    return false;
  }
}

export async function getRecentErrors(limit = 10): Promise<any[]> {
  try {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const { data } = await supabase
      .from('diagnostic_logs')
      .select('*')
      .eq('log_level', 'error')
      .gte('created_at', last24Hours.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);

    return data || [];
  } catch (error) {
    return [];
  }
}

export function createDefaultStatus(
  id: string,
  name: string,
  code: string,
  engines: string[],
  health: DepartmentHealth = 'GREEN',
  notes?: string
): DepartmentStatus {
  return {
    id,
    name,
    code,
    health,
    activeEngines: engines,
    openIncidents: 0,
    notes,
  };
}
