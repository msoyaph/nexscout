/**
 * Department Coordinator
 * Manages coordination between engines within departments
 */

import { supabase } from '../../lib/supabase';
import type {
  Department,
  DepartmentMetrics,
  GovernmentDepartment,
  Governor,
} from '../types/government';
import { DEPARTMENTS, GOVERNOR_REGISTRY } from '../config/governmentConfig';

export class DepartmentCoordinator {
  private static instance: DepartmentCoordinator;
  private departments: Map<GovernmentDepartment, Department> = new Map();

  private constructor() {
    this.initializeDepartments();
  }

  static getInstance(): DepartmentCoordinator {
    if (!DepartmentCoordinator.instance) {
      DepartmentCoordinator.instance = new DepartmentCoordinator();
    }
    return DepartmentCoordinator.instance;
  }

  /**
   * Initialize departments from config
   */
  private initializeDepartments(): void {
    for (const [key, dept] of Object.entries(DEPARTMENTS)) {
      this.departments.set(key as GovernmentDepartment, dept);
    }
  }

  /**
   * Get department by name
   */
  getDepartment(name: GovernmentDepartment): Department | undefined {
    return this.departments.get(name);
  }

  /**
   * Get all departments
   */
  getAllDepartments(): Department[] {
    return Array.from(this.departments.values());
  }

  /**
   * Get governors for a department
   */
  getDepartmentGovernors(department: GovernmentDepartment): string[] {
    const dept = this.departments.get(department);
    return dept?.governors || [];
  }

  /**
   * Get department metrics
   */
  async getDepartmentMetrics(department: GovernmentDepartment): Promise<DepartmentMetrics | null> {
    try {
      const dept = this.departments.get(department);
      if (!dept) return null;

      const governorIds = dept.governors;
      if (governorIds.length === 0) {
        return {
          department,
          total_engines: 0,
          healthy_engines: 0,
          degraded_engines: 0,
          failed_engines: 0,
          avg_response_time_ms: 0,
          total_requests_24h: 0,
          success_rate: 100,
          cost_24h_usd: 0,
          tokens_used_24h: 0,
        };
      }

      const { data: healthData } = await supabase
        .from('government_engine_health')
        .select('*')
        .in('engine_id', governorIds);

      if (!healthData) {
        return {
          department,
          total_engines: governorIds.length,
          healthy_engines: 0,
          degraded_engines: 0,
          failed_engines: 0,
          avg_response_time_ms: 0,
          total_requests_24h: 0,
          success_rate: 0,
          cost_24h_usd: 0,
          tokens_used_24h: 0,
        };
      }

      const healthy = healthData.filter(h => h.status === 'healthy').length;
      const degraded = healthData.filter(h => h.status === 'degraded').length;
      const failed = healthData.filter(h => h.status === 'failed').length;

      const avgResponseTime = healthData.reduce((sum, h) => sum + (h.avg_response_time_ms || 0), 0) / healthData.length;
      const avgSuccessRate = healthData.reduce((sum, h) => sum + (h.success_rate || 0), 0) / healthData.length;

      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const { count: requests24h } = await supabase
        .from('government_decisions')
        .select('*', { count: 'exact', head: true })
        .gte('timestamp', yesterday.toISOString());

      return {
        department,
        total_engines: governorIds.length,
        healthy_engines: healthy,
        degraded_engines: degraded,
        failed_engines: failed,
        avg_response_time_ms: Math.round(avgResponseTime),
        total_requests_24h: requests24h || 0,
        success_rate: avgSuccessRate,
        cost_24h_usd: 0,
        tokens_used_24h: 0,
      };
    } catch (error) {
      console.error('Failed to get department metrics:', error);
      return null;
    }
  }

  /**
   * Get all department metrics
   */
  async getAllDepartmentMetrics(): Promise<DepartmentMetrics[]> {
    const metrics: DepartmentMetrics[] = [];

    for (const deptName of this.departments.keys()) {
      const deptMetrics = await this.getDepartmentMetrics(deptName);
      if (deptMetrics) {
        metrics.push(deptMetrics);
      }
    }

    return metrics;
  }

  /**
   * Get department health score
   */
  async getDepartmentHealth(department: GovernmentDepartment): Promise<number> {
    const metrics = await this.getDepartmentMetrics(department);
    if (!metrics) return 0;

    if (metrics.total_engines === 0) return 100;

    const healthScore =
      (metrics.healthy_engines / metrics.total_engines) * 100 +
      (metrics.degraded_engines / metrics.total_engines) * 50;

    return Math.round(healthScore);
  }

  /**
   * Coordinate engine execution within department
   */
  async coordinateEngineExecution(
    department: GovernmentDepartment,
    engineId: string,
    action: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    const dept = this.departments.get(department);
    if (!dept) {
      return { allowed: false, reason: 'Department not found' };
    }

    if (!dept.governors.includes(engineId)) {
      return {
        allowed: false,
        reason: `Engine ${engineId} does not belong to ${department} department`,
      };
    }

    const { data: health } = await supabase
      .from('government_engine_health')
      .select('status')
      .eq('engine_id', engineId)
      .maybeSingle();

    if (health && (health.status === 'failed' || health.status === 'maintenance')) {
      return {
        allowed: false,
        reason: `Engine ${engineId} is currently ${health.status}`,
      };
    }

    return { allowed: true };
  }

  /**
   * Report department status
   */
  async reportDepartmentStatus(department: GovernmentDepartment): Promise<string> {
    const metrics = await this.getDepartmentMetrics(department);
    if (!metrics) return `Department ${department}: No data available`;

    const health = await this.getDepartmentHealth(department);

    return `
Department: ${department}
Health Score: ${health}/100
Total Engines: ${metrics.total_engines}
  - Healthy: ${metrics.healthy_engines}
  - Degraded: ${metrics.degraded_engines}
  - Failed: ${metrics.failed_engines}
Avg Response Time: ${metrics.avg_response_time_ms}ms
Success Rate: ${(metrics.success_rate * 100).toFixed(1)}%
Requests (24h): ${metrics.total_requests_24h}
    `.trim();
  }

  /**
   * Update department health score
   */
  async updateDepartmentHealth(department: GovernmentDepartment): Promise<void> {
    try {
      const health = await this.getDepartmentHealth(department);
      const dept = this.departments.get(department);
      if (dept) {
        dept.health_score = health;
        dept.last_audit = new Date();
      }
    } catch (error) {
      console.error('Failed to update department health:', error);
    }
  }

  /**
   * Get engine's department
   */
  getEngineDepartment(engineId: string): GovernmentDepartment | null {
    for (const [deptName, dept] of this.departments) {
      if (dept.governors.includes(engineId)) {
        return deptName;
      }
    }
    return null;
  }

  /**
   * Register new engine with department
   */
  async registerEngine(
    engineId: string,
    department: GovernmentDepartment
  ): Promise<boolean> {
    try {
      const dept = this.departments.get(department);
      if (!dept) return false;

      if (!dept.governors.includes(engineId)) {
        dept.governors.push(engineId);
      }

      await supabase.from('government_engine_health').upsert({
        engine_id: engineId,
        department,
        status: 'healthy',
        avg_response_time_ms: 0,
        success_rate: 1.0,
        last_execution: new Date().toISOString(),
        last_health_check: new Date().toISOString(),
      });

      return true;
    } catch (error) {
      console.error('Failed to register engine:', error);
      return false;
    }
  }

  /**
   * Deregister engine from department
   */
  async deregisterEngine(engineId: string): Promise<boolean> {
    try {
      for (const dept of this.departments.values()) {
        const index = dept.governors.indexOf(engineId);
        if (index !== -1) {
          dept.governors.splice(index, 1);
        }
      }

      await supabase
        .from('government_engine_health')
        .delete()
        .eq('engine_id', engineId);

      return true;
    } catch (error) {
      console.error('Failed to deregister engine:', error);
      return false;
    }
  }

  /**
   * Get department lead
   */
  getDepartmentLead(department: GovernmentDepartment): string | undefined {
    return this.departments.get(department)?.lead;
  }

  /**
   * Get department mandate
   */
  getDepartmentMandate(department: GovernmentDepartment): string[] | undefined {
    return this.departments.get(department)?.mandate;
  }

  /**
   * Check if engine belongs to department
   */
  isEngineInDepartment(engineId: string, department: GovernmentDepartment): boolean {
    const dept = this.departments.get(department);
    return dept ? dept.governors.includes(engineId) : false;
  }
}

export const departmentCoordinator = DepartmentCoordinator.getInstance();
