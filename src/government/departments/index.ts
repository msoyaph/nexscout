/**
 * Departments Registry
 *
 * PURPOSE:
 * Central registry for all NexScout Government departments
 *
 * USAGE:
 * import { Departments } from './government/departments';
 * const status = await Departments.ENGINEERING.getStatus();
 */

import { engineeringDepartment } from './engineeringDepartment';
import { uiuxDepartment } from './uiuxDepartment';
import { databaseDepartment } from './databaseDepartment';
import { securityDepartment } from './securityDepartment';
import { knowledgeDepartment } from './knowledgeDepartment';
import { productivityDepartment } from './productivityDepartment';
import { communicationDepartment } from './communicationDepartment';
import { economyDepartment } from './economyDepartment';
import { analyticsDepartment } from './analyticsDepartment';
import type { DepartmentAPI, DepartmentStatus } from '../types/government';

export const Departments = {
  ENGINEERING: engineeringDepartment,
  UIUX: uiuxDepartment,
  DATABASE: databaseDepartment,
  SECURITY: securityDepartment,
  KNOWLEDGE: knowledgeDepartment,
  PRODUCTIVITY: productivityDepartment,
  COMMUNICATION: communicationDepartment,
  ECONOMY: economyDepartment,
  ANALYTICS: analyticsDepartment,
};

export async function getAllDepartmentStatuses(): Promise<DepartmentStatus[]> {
  const statuses = await Promise.all([
    Departments.ENGINEERING.getStatus(),
    Departments.UIUX.getStatus(),
    Departments.DATABASE.getStatus(),
    Departments.SECURITY.getStatus(),
    Departments.KNOWLEDGE.getStatus(),
    Departments.PRODUCTIVITY.getStatus(),
    Departments.COMMUNICATION.getStatus(),
    Departments.ECONOMY.getStatus(),
    Departments.ANALYTICS.getStatus(),
  ]);

  return statuses;
}

export async function runAllSelfChecks(): Promise<DepartmentStatus[]> {
  const results = await Promise.all([
    Departments.ENGINEERING.runSelfCheck(),
    Departments.UIUX.runSelfCheck(),
    Departments.DATABASE.runSelfCheck(),
    Departments.SECURITY.runSelfCheck(),
    Departments.KNOWLEDGE.runSelfCheck(),
    Departments.PRODUCTIVITY.runSelfCheck(),
    Departments.COMMUNICATION.runSelfCheck(),
    Departments.ECONOMY.runSelfCheck(),
    Departments.ANALYTICS.runSelfCheck(),
  ]);

  return results;
}

export async function getSystemHealth(): Promise<{
  overall: 'GREEN' | 'YELLOW' | 'RED';
  departmentCount: number;
  healthyCount: number;
  degradedCount: number;
  criticalCount: number;
  totalIncidents: number;
}> {
  const statuses = await getAllDepartmentStatuses();

  const healthyCount = statuses.filter(s => s.health === 'GREEN').length;
  const degradedCount = statuses.filter(s => s.health === 'YELLOW').length;
  const criticalCount = statuses.filter(s => s.health === 'RED').length;
  const totalIncidents = statuses.reduce((sum, s) => sum + s.openIncidents, 0);

  const overall: 'GREEN' | 'YELLOW' | 'RED' =
    criticalCount > 0 ? 'RED' : degradedCount > 2 ? 'YELLOW' : 'GREEN';

  return {
    overall,
    departmentCount: statuses.length,
    healthyCount,
    degradedCount,
    criticalCount,
    totalIncidents,
  };
}

export type { DepartmentAPI, DepartmentStatus };
