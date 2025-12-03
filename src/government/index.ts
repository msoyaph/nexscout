/**
 * NexScout Government - Central Export
 * Main entry point for the Government system
 */

export * from './types/government';
export * from './config/governmentConfig';

export { masterOrchestrator } from './president/MasterOrchestrator';
export { congress } from './congress/Congress';
export { supremeCourt } from './supremeCourt/AuditEngine';
export { departmentCoordinator } from './departments/DepartmentCoordinator';

export { Government, government } from './Government';

export * from './middleware/governmentMiddleware';

export * from './enginesRegistry';
export { HealthMonitor } from './healthMonitor';
