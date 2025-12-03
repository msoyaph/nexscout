/**
 * NexScout Government Types
 * Constitutional definitions for all government entities
 */

// ============================================================================
// CORE GOVERNMENT TYPES
// ============================================================================

export type GovernmentBranch = 'president' | 'congress' | 'supreme_court';
export type GovernmentDepartment =
  | 'engineering'
  | 'uiux'
  | 'database'
  | 'security'
  | 'optimization'
  | 'user_experience'
  | 'communication'
  | 'knowledge';

export type SubscriptionTier = 'free' | 'pro' | 'team' | 'enterprise';

// ============================================================================
// ORCHESTRATOR TYPES
// ============================================================================

export interface OrchestratorJobInput {
  userId: string;
  jobType: string;
  subType?: string;
  source?: string;
  payload?: any;
}

export interface OrchestratorJobResult {
  success: boolean;
  jobId: string;
  userId: string;
  jobType: string;
  engineUsed: string;
  modelUsed: string;
  energyCost: number;
  coinCost: number;
  durationMs: number;
  output?: any;
  errors?: string[];
  warnings?: string[];
}

export interface ConstitutionVersion {
  version: string;
  effective_date: string;
  changes: string[];
  ratified_by: string[];
}

// ============================================================================
// PRESIDENT (MASTER ORCHESTRATOR) TYPES
// ============================================================================

export interface PresidentialDecision {
  request_id: string;
  user_id: string;
  feature: string;
  decision_type: 'approve' | 'deny' | 'defer' | 'escalate';
  selected_engine?: string;
  selected_model?: string;
  reasoning: string;
  cost_estimate: {
    energy: number;
    coins?: number;
    tokens: number;
  };
  timestamp: Date;
  execution_time_ms: number;
}

export interface EngineExecutionRequest {
  request_id: string;
  user_id: string;
  user_tier: SubscriptionTier;
  feature: string;
  engine: string;
  payload: any;
  priority: 'low' | 'normal' | 'high' | 'critical';
  max_tokens?: number;
  timeout_ms?: number;
  require_quality?: boolean;
}

export interface EngineExecutionResult {
  request_id: string;
  engine: string;
  status: 'success' | 'failure' | 'timeout' | 'blocked';
  result?: any;
  error?: string;
  tokens_used: number;
  cost_usd: number;
  energy_consumed: number;
  execution_time_ms: number;
  model_used: string;
  violations?: string[];
}

export interface ResourceAllocation {
  user_id: string;
  available_energy: number;
  available_coins: number;
  weekly_token_quota: number;
  tokens_used_this_week: number;
  tier: SubscriptionTier;
  surge_multiplier: number;
}

// ============================================================================
// CONGRESS (RULES ENGINE) TYPES
// ============================================================================

export interface CongressionalLaw {
  id: string;
  law_type: 'economy' | 'permissions' | 'rate_limit' | 'compliance' | 'safety';
  title: string;
  description: string;
  committee: string;
  rules: LawRule[];
  version: string;
  effective_date: Date;
  expires_date?: Date;
  created_by: string;
  status: 'draft' | 'active' | 'suspended' | 'repealed';
}

export interface LawRule {
  rule_id: string;
  condition: string; // e.g., "tier === 'free'"
  action: string; // e.g., "deny_access"
  parameters: Record<string, any>;
  priority: number;
}

export interface EconomyPolicy {
  coin_earning_rates: Record<string, number>; // action -> coins
  coin_spending_costs: Record<string, number>; // feature -> coins
  energy_regeneration_rate: number; // per hour
  energy_max_capacity: Record<SubscriptionTier, number>;
  surge_pricing_threshold: number; // system load %
  surge_multiplier: number;
  inflation_control_factor: number;
}

export interface PermissionsMatrix {
  tier: SubscriptionTier;
  features: Record<string, FeatureAccess>;
  engines: Record<string, EngineAccess>;
  rate_limits: RateLimits;
}

export interface FeatureAccess {
  enabled: boolean;
  daily_limit?: number;
  requires_upgrade?: boolean;
  upgrade_prompt?: string;
}

export interface EngineAccess {
  enabled: boolean;
  max_tokens_per_request?: number;
  cooldown_seconds?: number;
  quality_tier: 'basic' | 'standard' | 'premium';
}

export interface RateLimits {
  api_requests_per_minute: number;
  ai_generations_per_hour: number;
  scans_per_day: number;
  messages_per_day: number;
  prospect_actions_per_day: number;
}

// ============================================================================
// SUPREME COURT (AUDIT ENGINE) TYPES
// ============================================================================

export interface AuditReport {
  audit_id: string;
  audit_type: 'code' | 'security' | 'ai_safety' | 'compliance' | 'performance';
  scope: string; // what was audited
  findings: AuditFinding[];
  violations: ConstitutionalViolation[];
  recommendations: string[];
  severity: 'info' | 'warning' | 'critical';
  audited_at: Date;
  audited_by: 'automated' | 'manual';
  status: 'open' | 'acknowledged' | 'resolved';
}

export interface AuditFinding {
  finding_id: string;
  category: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affected_components: string[];
  evidence: any;
  remediation_steps: string[];
}

export interface ConstitutionalViolation {
  violation_id: string;
  article: string; // which article was violated
  violator: string; // engine, user, or system component
  violation_type: string;
  description: string;
  timestamp: Date;
  evidence: any;
  action_taken: string;
  resolved: boolean;
}

export interface SecurityCheck {
  check_type: 'sql_injection' | 'xss' | 'csrf' | 'rate_limit' | 'token_leakage' | 'data_exposure';
  passed: boolean;
  details?: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
}

export interface AIQualityCheck {
  check_type: 'hallucination' | 'coherence' | 'relevance' | 'safety' | 'bias' | 'toxicity';
  score: number; // 0-100
  passed: boolean;
  threshold: number;
  details?: string;
}

// ============================================================================
// DEPARTMENT TYPES
// ============================================================================

export interface Department {
  name: GovernmentDepartment;
  description: string;
  mandate: string[];
  governors: string[]; // engine IDs under this department
  lead: string;
  health_score: number; // 0-100
  last_audit: Date;
}

export interface DepartmentMetrics {
  department: GovernmentDepartment;
  total_engines: number;
  healthy_engines: number;
  degraded_engines: number;
  failed_engines: number;
  avg_response_time_ms: number;
  total_requests_24h: number;
  success_rate: number;
  cost_24h_usd: number;
  tokens_used_24h: number;
}

// ============================================================================
// GOVERNOR (ENGINE) TYPES
// ============================================================================

export interface Governor {
  engine_id: string;
  engine_name: string;
  province: string; // domain of responsibility
  department: GovernmentDepartment;
  version: string;
  status: 'healthy' | 'degraded' | 'failed' | 'maintenance';
  capabilities: string[];
  dependencies: string[]; // other engines this depends on
  health_metrics: GovernorHealth;
  last_execution: Date;
}

export interface GovernorHealth {
  uptime_percent: number;
  avg_response_time_ms: number;
  success_rate: number;
  error_rate: number;
  tokens_per_request_avg: number;
  cost_per_request_usd: number;
  last_health_check: Date;
}

export interface GovernorExecution {
  execution_id: string;
  governor: string;
  request: any;
  result: EngineExecutionResult;
  approved_by: 'president' | 'congress' | 'override';
  audited_by_supreme_court: boolean;
  violations: string[];
  timestamp: Date;
}

// ============================================================================
// CHECKS & BALANCES TYPES
// ============================================================================

export interface ConflictResolution {
  conflict_id: string;
  conflict_type: 'engine_overlap' | 'resource_contention' | 'rule_contradiction' | 'priority_dispute';
  involved_parties: string[];
  description: string;
  resolved_by: GovernmentBranch;
  resolution: string;
  timestamp: Date;
}

export interface EmergencyAction {
  action_id: string;
  action_type: 'shutdown' | 'rollback' | 'surge_protection' | 'maintenance_mode';
  triggered_by: GovernmentBranch;
  reason: string;
  affected_components: string[];
  duration_minutes?: number;
  timestamp: Date;
  post_incident_review_completed: boolean;
}

// ============================================================================
// SYSTEM HEALTH TYPES
// ============================================================================

export interface SystemHealth {
  overall_health_score: number; // 0-100
  branch_health: {
    president: number;
    congress: number;
    supreme_court: number;
  };
  department_health: Record<GovernmentDepartment, number>;
  active_governors: number;
  total_governors: number;
  active_violations: number;
  active_emergencies: number;
  system_load: number; // 0-100
  timestamp: Date;
}

export interface PerformanceMetrics {
  avg_request_latency_ms: number;
  requests_per_second: number;
  success_rate: number;
  token_efficiency: number; // requests per token
  cost_efficiency_usd: number;
  user_satisfaction_score: number;
  uptime_percent: number;
}

// ============================================================================
// GOVERNMENT EVENTS
// ============================================================================

export type GovernmentEvent =
  | { type: 'presidential_decision'; data: PresidentialDecision }
  | { type: 'law_enacted'; data: CongressionalLaw }
  | { type: 'audit_completed'; data: AuditReport }
  | { type: 'violation_detected'; data: ConstitutionalViolation }
  | { type: 'emergency_declared'; data: EmergencyAction }
  | { type: 'conflict_resolved'; data: ConflictResolution }
  | { type: 'governor_status_change'; data: { governor: string; old_status: string; new_status: string } }
  | { type: 'system_health_update'; data: SystemHealth };

// ============================================================================
// API TYPES
// ============================================================================

export interface GovernmentRequest {
  user_id: string;
  feature: string;
  action: string;
  payload: any;
  context?: {
    tier?: SubscriptionTier;
    energy?: number;
    coins?: number;
    user_profile?: any;
  };
}

export interface GovernmentResponse {
  approved: boolean;
  engine?: string;
  model?: string;
  result?: any;
  error?: string;
  violations?: string[];
  cost: {
    energy: number;
    coins?: number;
    tokens: number;
  };
  metadata: {
    decision_time_ms: number;
    audited: boolean;
    branch_approvals: GovernmentBranch[];
  };
}

// ============================================================================
// MASTER ORCHESTRATOR TYPES
// ============================================================================

export type OrchestratorJobType =
  | 'SCAN'
  | 'MESSAGE'
  | 'PITCH_DECK'
  | 'CHATBOT'
  | 'FOLLOW_UP'
  | 'COMPANY_INTELLIGENCE'
  | 'PUBLIC_CHATBOT'
  | 'ANALYTICS_QUERY';

export type OrchestratorJobSource =
  | 'APP'
  | 'PUBLIC_CHATBOT'
  | 'BROWSER_EXTENSION'
  | 'IMPORT_CSV'
  | 'WEBSITE_CRAWLER';

export type OrchestratorJobStatus =
  | 'STARTED'
  | 'COMPLETED'
  | 'BLOCKED'
  | 'FAILED';

export interface OrchestratorJobInput {
  userId: string;
  jobType: OrchestratorJobType;
  subType?: string;
  source: OrchestratorJobSource;
  payload: any;
  contextOverrides?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  };
  metadata?: {
    requestId?: string;
    traceId?: string;
    ip?: string;
    userAgent?: string;
  };
}

export interface OrchestratorJobResult {
  success: boolean;
  jobId: string;
  userId: string;
  jobType: OrchestratorJobType;
  engineUsed: string;
  modelUsed: string;
  energyCost: number;
  coinCost: number;
  durationMs: number;
  output: any;
  warnings?: string[];
  errors?: string[];
  auditTrailId?: string;
}

export interface OrchestratorJobCosts {
  energyCostBase: number;
  coinCostBase: number;
  rateLimitPerHour: number;
  rateLimitPerDay: number;
  modelPreference: string;
}

export interface OrchestratorPreCheckResult {
  allowed: boolean;
  reasons: string[];
  warnings?: string[];
  suggestedAction?: string;
}

export interface OrchestratorPostCheckResult {
  blocked: boolean;
  reasons: string[];
  auditTrailId?: string;
  actionTaken?: string;
}

export interface OrchestratorRateLimit {
  userId: string;
  jobType: OrchestratorJobType;
  hourCount: number;
  dayCount: number;
  hourWindowStart: Date;
  dayWindowStart: Date;
}

// ============================================================================
// CONGRESS RULES ENGINE TYPES
// ============================================================================

export type ModelClass = 'CHEAP' | 'STANDARD' | 'PREMIUM';
export type JobPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export interface CongressJobCost {
  coinCost: number;
  energyCost: number;
  modelClass: ModelClass;
  priority: JobPriority;
}

export interface CongressRateLimit {
  maxPerDay: number;
  maxPerHour?: number;
  burstLimit?: number;
}

export interface CongressPermissionResult {
  allowed: boolean;
  reason?: string;
  requiredTier?: SubscriptionTier;
  upgradeMessage?: string;
}

export interface TierConfig {
  tier: SubscriptionTier;
  name: string;
  monthlyPrice: number;
  currency: string;
  description: string;
  features: string[];
  limits: {
    scansPerDay: number;
    messagesPerDay: number;
    pitchDecksPerWeek: number;
    companyIntelligence: 'none' | 'lite' | 'standard' | 'advanced';
    chatbotMode: 'none' | 'website_only' | 'multi_channel' | 'enterprise';
    modelQuality: ModelClass;
    priority: JobPriority;
    seatsIncluded?: number;
    teamFeatures?: boolean;
  };
  energyCapacity: number;
  energyRegenPerHour: number;
}

export interface UsageStats {
  scansToday: number;
  messagesToday: number;
  pitchDecksThisWeek: number;
  totalJobsToday: number;
  energyRemaining: number;
  coinsRemaining: number;
}

export interface UpgradeRecommendation {
  shouldUpgrade: boolean;
  suggestedTier: SubscriptionTier;
  reasons: string[];
  savings?: string;
  benefits: string[];
}

// ============================================================================
// SUPREME COURT ENGINE TYPES
// ============================================================================

export interface SupremeCourtPreCheckResult {
  allowed: boolean;
  reasons?: string[];
  riskScore?: number;
}

export interface SupremeCourtPostCheckResult {
  allowed: boolean;
  blocked: boolean;
  reasons?: string[];
  sanitizedOutput?: any;
  auditId: string;
  riskScore?: number;
}

export interface PreCheckContext {
  userId: string;
  tier: SubscriptionTier;
  jobType: OrchestratorJobType;
  source: OrchestratorJobSource;
  payload: any;
  metadata?: any;
}

export interface PostCheckContext {
  userId: string;
  tier: SubscriptionTier;
  jobType: OrchestratorJobType;
  jobId: string;
  engineOutput: any;
  executionMetadata: {
    durationMs: number;
    tokenCount?: number;
    cost?: number;
  };
}

export interface PIIDetectionResult {
  hasPII: boolean;
  types: string[];
  locations: Array<{ type: string; text: string }>;
}

export interface ContentSafetyResult {
  isSafe: boolean;
  issues: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// ============================================================================
// DEPARTMENT TYPES
// ============================================================================

export type DepartmentHealth = 'GREEN' | 'YELLOW' | 'RED';

export interface DepartmentStatus {
  id: string;
  name: string;
  code: string;
  health: DepartmentHealth;
  activeEngines: string[];
  openIncidents: number;
  lastAuditAt?: string;
  notes?: string;
}

export interface DepartmentAPI {
  getStatus(): Promise<DepartmentStatus>;
  getEngines(): Promise<string[]>;
  runSelfCheck(): Promise<DepartmentStatus>;
  listOpenIssues(): Promise<any[]>;
}
