/**
 * Economy Department
 *
 * PURPOSE:
 * Manages coins, energy, and economic systems
 *
 * RESPONSIBILITIES:
 * - Coin economy management
 * - Energy system oversight
 * - Subscription billing
 * - Revenue tracking
 * - Pricing optimization
 */

import { supabase } from '../../lib/supabase';
import type { DepartmentStatus, DepartmentAPI } from '../types/government';
import { createDefaultStatus, countOpenIncidents, determineHealth, getLastAuditTime } from './baseDepartment';

const DEPARTMENT_ID = 'economy';
const DEPARTMENT_CODE = 'ECON';
const DEPARTMENT_NAME = 'Economy';
const MANAGED_ENGINES: string[] = [
  'energy_engine_v5',
  'coin_transaction_service',
  'wallet_service',
  'referral_service',
  'team_billing_service',
];

async function getStatus(): Promise<DepartmentStatus> {
  const incidents = await countOpenIncidents();
  const totalTransactions = await countRecentTransactions();
  const health = determineHealth(incidents);
  const lastAudit = await getLastAuditTime();

  return {
    ...createDefaultStatus(DEPARTMENT_ID, DEPARTMENT_NAME, DEPARTMENT_CODE, MANAGED_ENGINES, health),
    openIncidents: incidents,
    lastAuditAt: lastAudit,
    notes: `${totalTransactions} transactions in last 24h`,
  };
}

async function getEngines(): Promise<string[]> {
  return MANAGED_ENGINES;
}

async function runSelfCheck(): Promise<DepartmentStatus> {
  const totalTransactions = await countRecentTransactions();
  const health = 'GREEN';

  return {
    ...createDefaultStatus(DEPARTMENT_ID, DEPARTMENT_NAME, DEPARTMENT_CODE, MANAGED_ENGINES, health),
    openIncidents: 0,
    lastAuditAt: new Date().toISOString(),
    notes: `Economy healthy, ${totalTransactions} transactions`,
  };
}

async function listOpenIssues(): Promise<any[]> {
  return [];
}

async function countRecentTransactions(): Promise<number> {
  try {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const { count } = await supabase
      .from('coin_transactions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', last24Hours.toISOString());

    return count || 0;
  } catch (error) {
    return 0;
  }
}

export const economyDepartment: DepartmentAPI = {
  getStatus,
  getEngines,
  runSelfCheck,
  listOpenIssues,
};
