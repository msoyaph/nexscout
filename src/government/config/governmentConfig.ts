/**
 * NexScout Government Configuration
 * Defines all departments, engines, rules, and authorities
 */

import type {
  Department,
  Governor,
  EconomyPolicy,
  PermissionsMatrix,
  RateLimits,
} from '../types/government';

// ============================================================================
// DEPARTMENT DEFINITIONS
// ============================================================================

export const DEPARTMENTS: Record<string, Department> = {
  engineering: {
    name: 'engineering',
    description: 'Manages all AI engines, pipelines, and ML systems',
    mandate: [
      'Maintain engine registry',
      'Coordinate pipeline execution',
      'Manage worker queues',
      'Oversee ML training',
      'Handle error recovery',
    ],
    governors: [
      'scanning_engine',
      'smart_scanner_v3',
      'ocr_engine',
      'scout_scoring_v5',
      'data_fusion_engine',
      'scan_pipeline',
      'identity_match',
    ],
    lead: 'Chief Engineering Officer',
    health_score: 100,
    last_audit: new Date(),
  },

  uiux: {
    name: 'uiux',
    description: 'Ensures design consistency and optimal user interactions',
    mandate: [
      'Maintain design system',
      'Enforce FB-inspired UI patterns',
      'Manage responsive layouts',
      'Coordinate animations',
      'A/B test coordination',
    ],
    governors: [],
    lead: 'Chief Design Officer',
    health_score: 100,
    last_audit: new Date(),
  },

  database: {
    name: 'database',
    description: 'Manages data storage, integrity, and performance',
    mandate: [
      'Schema management',
      'Index optimization',
      'Backup coordination',
      'Query performance',
      'Data lake management',
    ],
    governors: [
      'company_knowledge_graph',
      'company_vector_store',
      'social_graph_builder',
    ],
    lead: 'Chief Data Officer',
    health_score: 100,
    last_audit: new Date(),
  },

  security: {
    name: 'security',
    description: 'Protects systems, data, and users from threats',
    mandate: [
      'Threat detection',
      'API protection',
      'Rate limiting',
      'Vulnerability scanning',
      'Access control',
    ],
    governors: ['company_ai_safety_engine'],
    lead: 'Chief Security Officer',
    health_score: 100,
    last_audit: new Date(),
  },

  optimization: {
    name: 'optimization',
    description: 'Maximizes performance and minimizes costs',
    mandate: [
      'Token usage optimization',
      'Cost monitoring',
      'Load balancing',
      'Performance tuning',
      'Resource allocation',
    ],
    governors: [
      'energy_engine_v5',
      'energy_engine_v4',
      'energy_engine_v3',
      'scan_optimization_tools',
    ],
    lead: 'Chief Optimization Officer',
    health_score: 100,
    last_audit: new Date(),
  },

  user_experience: {
    name: 'user_experience',
    description: 'Enhances user journey and engagement',
    mandate: [
      'Onboarding optimization',
      'Mission system management',
      'Gamification coordination',
      'Analytics integration',
      'User feedback loops',
    ],
    governors: [
      'onboarding_missions',
      'referral_service',
      'funnel_analytics',
      'avatar_service',
    ],
    lead: 'Chief Experience Officer',
    health_score: 100,
    last_audit: new Date(),
  },

  communication: {
    name: 'communication',
    description: 'Manages all AI-driven communication systems',
    mandate: [
      'Chatbot behavior coordination',
      'Messaging engine management',
      'Persona consistency',
      'Tone enforcement',
      'Multi-channel orchestration',
    ],
    governors: [
      'messaging_engine_v2',
      'chatbot_engine',
      'conversational_ai_engine',
      'advanced_messaging_engines',
      'ai_productivity_engine',
      'coaching_engine',
      'copilot_engine',
      'handoff_detection_engine',
      'shadow_learning_engine',
    ],
    lead: 'Chief Communication Officer',
    health_score: 100,
    last_audit: new Date(),
  },

  knowledge: {
    name: 'knowledge',
    description: 'Builds and maintains intelligence systems',
    mandate: [
      'Company intelligence gathering',
      'Product graph building',
      'Multi-site crawling',
      'Knowledge base consolidation',
      'Intelligence sharing',
    ],
    governors: [
      'company_intelligence_v4',
      'company_ai_orchestrator',
      'company_web_crawler',
      'company_embedding_engine',
      'company_brain_sync',
      'company_multi_site_crawler',
      'company_master_deck_generator',
      'browser_capture_service',
    ],
    lead: 'Chief Intelligence Officer',
    health_score: 100,
    last_audit: new Date(),
  },
};

// ============================================================================
// GOVERNOR (ENGINE) REGISTRY
// ============================================================================

export const GOVERNOR_REGISTRY: Record<string, Partial<Governor>> = {
  // SCANNING & INTELLIGENCE
  scanning_engine: {
    engine_id: 'scanning_engine',
    engine_name: 'Scanning Engine',
    province: 'Population & Discovery',
    department: 'engineering',
    capabilities: ['fb_friends_scan', 'ocr_processing', 'prospect_extraction'],
  },
  smart_scanner_v3: {
    engine_id: 'smart_scanner_v3',
    engine_name: 'Smart Scanner V3',
    province: 'Intelligent Scanning',
    department: 'engineering',
    capabilities: ['multi_source_scan', 'adaptive_extraction', 'quality_scoring'],
  },
  scout_scoring_v5: {
    engine_id: 'scout_scoring_v5',
    engine_name: 'ScoutScore V5',
    province: 'Prospect Scoring',
    department: 'engineering',
    capabilities: ['behavioral_scoring', 'predictive_analytics', 'bucket_classification'],
  },

  // MESSAGING & COMMUNICATION
  messaging_engine_v2: {
    engine_id: 'messaging_engine_v2',
    engine_name: 'Messaging Engine V2',
    province: 'AI Communication',
    department: 'communication',
    capabilities: [
      'message_generation',
      'objection_handling',
      'booking_scripts',
      'elite_coaching',
    ],
  },
  chatbot_engine: {
    engine_id: 'chatbot_engine',
    engine_name: 'Chatbot Engine',
    province: 'Public Engagement',
    department: 'communication',
    capabilities: ['autonomous_conversation', 'lead_qualification', 'appointment_booking'],
  },
  conversational_ai_engine: {
    engine_id: 'conversational_ai_engine',
    engine_name: 'Conversational AI',
    province: 'Advanced Dialogue',
    department: 'communication',
    capabilities: ['context_awareness', 'multi_turn_dialogue', 'intent_detection'],
  },

  // COMPANY INTELLIGENCE
  company_intelligence_v4: {
    engine_id: 'company_intelligence_v4',
    engine_name: 'Company Intelligence V4',
    province: 'Market Intelligence',
    department: 'knowledge',
    capabilities: ['website_analysis', 'product_extraction', 'value_prop_detection'],
  },
  company_ai_orchestrator: {
    engine_id: 'company_ai_orchestrator',
    engine_name: 'Company AI Orchestrator',
    province: 'Intelligence Coordination',
    department: 'knowledge',
    capabilities: ['multi_engine_coordination', 'prompt_building', 'context_synthesis'],
  },
  company_web_crawler: {
    engine_id: 'company_web_crawler',
    engine_name: 'Web Crawler V6',
    province: 'Data Acquisition',
    department: 'knowledge',
    capabilities: ['multi_page_crawling', 'form_detection', 'content_extraction'],
  },

  // ENERGY & OPTIMIZATION
  energy_engine_v5: {
    engine_id: 'energy_engine_v5',
    engine_name: 'Energy Engine V5',
    province: 'Resource Economy',
    department: 'optimization',
    capabilities: [
      'token_governance',
      'auto_compression',
      'load_balancing',
      'cost_prediction',
      'surge_protection',
    ],
  },

  // AI PRODUCTIVITY
  ai_productivity_engine: {
    engine_id: 'ai_productivity_engine',
    engine_name: 'AI Productivity Engine',
    province: 'Productivity Automation',
    department: 'communication',
    capabilities: ['todo_generation', 'calendar_management', 'reminder_automation'],
  },
  coaching_engine: {
    engine_id: 'coaching_engine',
    engine_name: 'AI Coaching Engine',
    province: 'Elite Coaching',
    department: 'communication',
    capabilities: ['situation_analysis', 'strategic_recommendations', 'psychology_insights'],
  },
  copilot_engine: {
    engine_id: 'copilot_engine',
    engine_name: 'AI Co-Pilot',
    province: 'Real-Time Assistance',
    department: 'communication',
    capabilities: ['live_guidance', 'draft_suggestions', 'context_awareness'],
  },

  // SOCIAL & GRAPH
  social_graph_builder: {
    engine_id: 'social_graph_builder',
    engine_name: 'Social Graph Builder',
    province: 'Relationship Mapping',
    department: 'database',
    capabilities: ['connection_mapping', 'influence_scoring', 'network_analysis'],
  },

  // GAMIFICATION & MISSIONS
  onboarding_missions: {
    engine_id: 'onboarding_missions',
    engine_name: 'Mission System',
    province: 'User Engagement',
    department: 'user_experience',
    capabilities: ['mission_generation', 'reward_distribution', 'progress_tracking'],
  },
  referral_service: {
    engine_id: 'referral_service',
    engine_name: 'Referral Engine',
    province: 'Viral Growth',
    department: 'user_experience',
    capabilities: ['referral_tracking', 'reward_calculation', 'tier_upgrades'],
  },

  // SECURITY & SAFETY
  company_ai_safety_engine: {
    engine_id: 'company_ai_safety_engine',
    engine_name: 'AI Safety Engine',
    province: 'AI Safety & Compliance',
    department: 'security',
    capabilities: ['content_filtering', 'hallucination_detection', 'safety_scoring'],
  },
};

// ============================================================================
// ECONOMY POLICIES
// ============================================================================

export const ECONOMY_POLICY: EconomyPolicy = {
  coin_earning_rates: {
    scan_completion: 50,
    prospect_added: 10,
    message_sent: 5,
    call_completed: 100,
    deal_closed: 500,
    referral_signup: 200,
    daily_login: 10,
    mission_completed: 25,
    profile_completed: 50,
  },
  coin_spending_costs: {
    ai_message_generation: 20,
    ai_pitch_deck: 100,
    ai_objection_handler: 30,
    elite_coaching: 50,
    deep_scan: 75,
    company_intelligence: 150,
    unlock_prospect: 25,
  },
  energy_regeneration_rate: 10, // per hour
  energy_max_capacity: {
    free: 100,
    pro: 250,
    team: 400,
    enterprise: 1000,
  },
  surge_pricing_threshold: 80, // % system load
  surge_multiplier: 1.5,
  inflation_control_factor: 0.95,
};

// ============================================================================
// PERMISSIONS MATRICES
// ============================================================================

const FREE_RATE_LIMITS: RateLimits = {
  api_requests_per_minute: 10,
  ai_generations_per_hour: 5,
  scans_per_day: 2,
  messages_per_day: 2,
  prospect_actions_per_day: 10,
};

const PRO_RATE_LIMITS: RateLimits = {
  api_requests_per_minute: 60,
  ai_generations_per_hour: 50,
  scans_per_day: 20,
  messages_per_day: 999,
  prospect_actions_per_day: 500,
};

const TEAM_RATE_LIMITS: RateLimits = {
  api_requests_per_minute: 120,
  ai_generations_per_hour: 200,
  scans_per_day: 100,
  messages_per_day: 500,
  prospect_actions_per_day: 2000,
};

const ENTERPRISE_RATE_LIMITS: RateLimits = {
  api_requests_per_minute: 300,
  ai_generations_per_hour: 1000,
  scans_per_day: 9999,
  messages_per_day: 9999,
  prospect_actions_per_day: 99999,
};

export const PERMISSIONS_MATRICES: Record<string, PermissionsMatrix> = {
  free: {
    tier: 'free',
    features: {
      scanning: { enabled: true, daily_limit: 2 },
      ai_messages: { enabled: true, daily_limit: 2, requires_upgrade: true },
      ai_pitch_deck: { enabled: false, requires_upgrade: true },
      elite_coaching: { enabled: false, requires_upgrade: true },
      company_intelligence: { enabled: false, requires_upgrade: true },
      deep_scan: { enabled: false, requires_upgrade: true },
      chatbot: { enabled: false, requires_upgrade: true },
      calendar: { enabled: true },
      todos: { enabled: true },
      reminders: { enabled: true },
      pipeline: { enabled: true },
    },
    engines: {
      messaging_engine_v2: { enabled: true, max_tokens_per_request: 500, quality_tier: 'basic' },
      chatbot_engine: { enabled: false, quality_tier: 'basic' },
      company_intelligence_v4: { enabled: false, quality_tier: 'basic' },
      energy_engine_v5: { enabled: true, quality_tier: 'basic' },
    },
    rate_limits: FREE_RATE_LIMITS,
  },

  pro: {
    tier: 'pro',
    features: {
      scanning: { enabled: true, daily_limit: 20 },
      ai_messages: { enabled: true },
      ai_pitch_deck: { enabled: true },
      elite_coaching: { enabled: false, requires_upgrade: true },
      company_intelligence: { enabled: true },
      deep_scan: { enabled: true },
      chatbot: { enabled: true },
      calendar: { enabled: true },
      todos: { enabled: true },
      reminders: { enabled: true },
      pipeline: { enabled: true },
    },
    engines: {
      messaging_engine_v2: { enabled: true, max_tokens_per_request: 2000, quality_tier: 'standard' },
      chatbot_engine: { enabled: true, max_tokens_per_request: 2000, quality_tier: 'standard' },
      company_intelligence_v4: { enabled: true, max_tokens_per_request: 3000, quality_tier: 'standard' },
      energy_engine_v5: { enabled: true, quality_tier: 'standard' },
    },
    rate_limits: PRO_RATE_LIMITS,
  },

  team: {
    tier: 'team',
    features: {
      scanning: { enabled: true },
      ai_messages: { enabled: true },
      ai_pitch_deck: { enabled: true },
      elite_coaching: { enabled: true },
      company_intelligence: { enabled: true },
      deep_scan: { enabled: true },
      chatbot: { enabled: true },
      calendar: { enabled: true },
      todos: { enabled: true },
      reminders: { enabled: true },
      pipeline: { enabled: true },
    },
    engines: {
      messaging_engine_v2: { enabled: true, max_tokens_per_request: 5000, quality_tier: 'standard' },
      chatbot_engine: { enabled: true, max_tokens_per_request: 5000, quality_tier: 'standard' },
      company_intelligence_v4: { enabled: true, max_tokens_per_request: 6000, quality_tier: 'standard' },
      energy_engine_v5: { enabled: true, quality_tier: 'standard' },
    },
    rate_limits: TEAM_RATE_LIMITS,
  },

  enterprise: {
    tier: 'enterprise',
    features: {
      scanning: { enabled: true },
      ai_messages: { enabled: true },
      ai_pitch_deck: { enabled: true },
      elite_coaching: { enabled: true },
      company_intelligence: { enabled: true },
      deep_scan: { enabled: true },
      chatbot: { enabled: true },
      calendar: { enabled: true },
      todos: { enabled: true },
      reminders: { enabled: true },
      pipeline: { enabled: true },
    },
    engines: {
      messaging_engine_v2: { enabled: true, max_tokens_per_request: 20000, quality_tier: 'premium' },
      chatbot_engine: { enabled: true, max_tokens_per_request: 20000, quality_tier: 'premium' },
      company_intelligence_v4: { enabled: true, max_tokens_per_request: 30000, quality_tier: 'premium' },
      energy_engine_v5: { enabled: true, quality_tier: 'premium' },
    },
    rate_limits: ENTERPRISE_RATE_LIMITS,
  },
};

// ============================================================================
// CONSTITUTIONAL CONSTANTS
// ============================================================================

export const CONSTITUTION_VERSION = '1.0.0';
export const GOVERNMENT_EFFECTIVE_DATE = '2025-12-01';

export const BRANCH_AUTHORITIES = {
  president: [
    'engine_activation',
    'request_routing',
    'resource_allocation',
    'conflict_resolution',
    'emergency_powers',
  ],
  congress: ['rule_creation', 'permission_enforcement', 'economy_management', 'compliance_oversight'],
  supreme_court: ['code_audit', 'security_enforcement', 'ai_safety', 'compliance_validation', 'rollback_authority'],
};
