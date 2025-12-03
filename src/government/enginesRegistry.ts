/**
 * NexScout Engines Registry
 * Centralized source-of-truth for ALL AI Engines.
 *
 * The Master Orchestrator loads this registry to:
 *  - find which engine runs which jobType/subType
 *  - decide routing
 *  - determine fallback engines
 *  - feed data to the Government Dashboard
 *  - run department self-checks
 */

import * as scanningEngine from '../services/ai/scanningEngine';
import * as deepScanEngine from '../services/ai/deepScanEngine';
import * as messagingEngine from '../services/ai/messagingEngine';
import * as pitchDeckGenerator from '../services/ai/pitchDeckGenerator';
import * as followUpSequencer from '../services/ai/followUpSequencer';
import * as chatbotEngine from '../services/ai/chatbotEngine';
import * as companyIntelligenceEngine from '../services/intelligence/companyIntelligenceEngine';
import * as analyticsIntelligenceEngine from '../services/intelligence/analyticsIntelligenceEngine';
import * as websiteCrawlerEngine from '../services/intelligence/websiteCrawlerEngine';
import * as prospectQualificationEngine from '../services/ai/prospectQualificationEngine';
import * as prospectDeepAnalyzer from '../services/intelligence/prospectDeepAnalyzer';
import * as personalityProfiler from '../services/ai/personalityProfiler';
import * as pipelineSortingEngine from '../services/ai/pipelineSortingEngine';

import * as leadRevivalEngine from '../services/ai/leadRevivalEngine';
import * as dealCloserEngine from '../services/ai/dealCloserEngine';
import * as emotionalPersuasionLayer from '../services/ai/emotionalPersuasionLayer';
import * as autonomousCloserEngine from '../services/ai/autonomousCloserEngine';

import * as energyEngine from '../services/economy/energyEngine';
import * as coinEngine from '../services/economy/coinEngine';
import * as productIntelligenceEngineV5 from '../services/intelligence/productIntelligenceEngineV5';
import * as publicChatbotProductFlowEngine from '../services/chatbot/publicChatbotProductFlowEngine';

import * as chatbotPublicEngine from '../services/ai/chatbotPublicEngine';
import * as omniChannelEngine from '../services/ai/omniChannelEngine';

import * as predictionEngine from '../services/intelligence/predictionEngine';
import * as retentionEngine from '../services/intelligence/retentionEngine';
import * as viralEngine from '../services/intelligence/viralEngine';
import * as uxRecommendationEngine from '../services/intelligence/uxRecommendationEngine';

export interface EngineDefinition {
  id: string;
  name: string;
  department: string;
  handles: {
    jobTypes: string[];
    subTypes?: string[];
  };
  run: Function;
  modelPreference: 'CHEAP' | 'STANDARD' | 'PREMIUM';
  healthCheck?: Function;
  notes?: string;
}

// ============================================================================
// ENGINE REGISTRY
// ============================================================================

export const EnginesRegistry: Record<string, EngineDefinition> = {
  // --------------------------------------------------------------------------
  // SCANNING ENGINES
  // --------------------------------------------------------------------------
  SCAN_BASIC: {
    id: 'SCAN_BASIC',
    name: 'Basic Scanner Engine',
    department: 'ENGINEERING',
    handles: { jobTypes: ['SCAN'], subTypes: ['LIGHT_SCAN'] },
    run: scanningEngine.run,
    modelPreference: 'CHEAP',
  },

  SCAN_DEEP: {
    id: 'SCAN_DEEP',
    name: 'DeepScan Engine',
    department: 'ENGINEERING',
    handles: { jobTypes: ['SCAN'], subTypes: ['DEEP_SCAN'] },
    run: deepScanEngine.run,
    modelPreference: 'STANDARD',
  },

  // --------------------------------------------------------------------------
  // MESSAGING + FOLLOWUP ENGINES
  // --------------------------------------------------------------------------
  AI_MESSAGE: {
    id: 'AI_MESSAGE',
    name: 'AI Messaging Engine',
    department: 'COMMUNICATION',
    handles: { jobTypes: ['MESSAGE'] },
    run: messagingEngine.run,
    modelPreference: 'STANDARD',
  },

  AI_FOLLOW_UP: {
    id: 'AI_FOLLOW_UP',
    name: 'Follow-Up Sequencer',
    department: 'COMMUNICATION',
    handles: { jobTypes: ['FOLLOW_UP'] },
    run: followUpSequencer.run,
    modelPreference: 'STANDARD',
  },

  // --------------------------------------------------------------------------
  // PUBLIC CHATBOT ENGINES
  // --------------------------------------------------------------------------
  PUBLIC_CHATBOT_BASIC: {
    id: 'PUBLIC_CHATBOT_BASIC',
    name: 'Public Chatbot Engine (Basic)',
    department: 'COMMUNICATION',
    handles: { jobTypes: ['PUBLIC_CHATBOT'], subTypes: ['BASIC'] },
    run: chatbotPublicEngine.runBasic,
    modelPreference: 'CHEAP',
  },

  PUBLIC_CHATBOT_ADVANCED: {
    id: 'PUBLIC_CHATBOT_ADVANCED',
    name: 'Public Chatbot Engine (Auto Closer)',
    department: 'COMMUNICATION',
    handles: { jobTypes: ['PUBLIC_CHATBOT'], subTypes: ['AUTO_CLOSER'] },
    run: chatbotPublicEngine.runAutoCloser,
    modelPreference: 'STANDARD',
  },

  PUBLIC_CHATBOT_OMNI: {
    id: 'PUBLIC_CHATBOT_OMNI',
    name: 'Public Chatbot Omni-Channel',
    department: 'COMMUNICATION',
    handles: { jobTypes: ['PUBLIC_CHATBOT'], subTypes: ['OMNI'] },
    run: omniChannelEngine.run,
    modelPreference: 'PREMIUM',
  },

  // --------------------------------------------------------------------------
  // AI CONTENT ENGINES
  // --------------------------------------------------------------------------
  PITCH_DECK: {
    id: 'PITCH_DECK',
    name: 'AI Pitch Deck Generator',
    department: 'KNOWLEDGE',
    handles: { jobTypes: ['PITCH_DECK'] },
    run: pitchDeckGenerator.run,
    modelPreference: 'STANDARD',
  },

  // --------------------------------------------------------------------------
  // COMPANY INTELLIGENCE ENGINES
  // --------------------------------------------------------------------------
  COMPANY_INTELLIGENCE: {
    id: 'COMPANY_INTELLIGENCE',
    name: 'Company Intelligence Engine',
    department: 'KNOWLEDGE',
    handles: { jobTypes: ['COMPANY_INTELLIGENCE'] },
    run: companyIntelligenceEngine.run,
    modelPreference: 'STANDARD',
  },

  WEBSITE_CRAWLER: {
    id: 'WEBSITE_CRAWLER',
    name: 'Website Intelligence Crawler',
    department: 'KNOWLEDGE',
    handles: { jobTypes: ['COMPANY_INTELLIGENCE'], subTypes: ['CRAWL'] },
    run: websiteCrawlerEngine.run,
    modelPreference: 'STANDARD',
  },

  // --------------------------------------------------------------------------
  // PROSPECT INTELLIGENCE
  // --------------------------------------------------------------------------
  QUALIFICATION: {
    id: 'QUALIFICATION',
    name: 'Prospect Qualification Engine',
    department: 'KNOWLEDGE',
    handles: { jobTypes: ['SCAN'], subTypes: ['QUALIFY'] },
    run: prospectQualificationEngine.run,
    modelPreference: 'STANDARD',
  },

  DEEP_ANALYZER: {
    id: 'DEEP_ANALYZER',
    name: 'Pain Point / Deep Analyzer',
    department: 'KNOWLEDGE',
    handles: { jobTypes: ['SCAN'], subTypes: ['DEEP_ANALYZE'] },
    run: prospectDeepAnalyzer.run,
    modelPreference: 'PREMIUM',
  },

  PERSONALITY_PROFILER: {
    id: 'PERSONALITY_PROFILER',
    name: 'NLP Personality Profiler',
    department: 'KNOWLEDGE',
    handles: { jobTypes: ['SCAN'], subTypes: ['PERSONALITY'] },
    run: personalityProfiler.run,
    modelPreference: 'STANDARD',
  },

  PIPELINE_SORTER: {
    id: 'PIPELINE_SORTER',
    name: 'Pipeline Sorting AI',
    department: 'PRODUCTIVITY',
    handles: { jobTypes: ['PIPELINE_SORT'] },
    run: pipelineSortingEngine.run,
    modelPreference: 'CHEAP',
  },

  // --------------------------------------------------------------------------
  // CLOSING INTELLIGENCE
  // --------------------------------------------------------------------------
  LEAD_REVIVAL: {
    id: 'LEAD_REVIVAL',
    name: 'Lead Revival Engine',
    department: 'COMMUNICATION',
    handles: { jobTypes: ['MESSAGE'], subTypes: ['REVIVE'] },
    run: leadRevivalEngine.run,
    modelPreference: 'STANDARD',
  },

  DEAL_CLOSER: {
    id: 'DEAL_CLOSER',
    name: 'Deal Closing Engine',
    department: 'COMMUNICATION',
    handles: { jobTypes: ['MESSAGE'], subTypes: ['CLOSE_DEAL'] },
    run: dealCloserEngine.run,
    modelPreference: 'PREMIUM',
  },

  EMOTIONAL_LAYER: {
    id: 'EMOTIONAL_LAYER',
    name: 'Emotional Persuasion Layer',
    department: 'COMMUNICATION',
    handles: { jobTypes: ['MESSAGE'], subTypes: ['EMOTION_LAYER'] },
    run: emotionalPersuasionLayer.run,
    modelPreference: 'PREMIUM',
  },

  AUTONOMOUS_CLOSER: {
    id: 'AUTONOMOUS_CLOSER',
    name: 'Autonomous Closer Engine',
    department: 'COMMUNICATION',
    handles: { jobTypes: ['PUBLIC_CHATBOT'], subTypes: ['AUTONOMOUS_CLOSER'] },
    run: autonomousCloserEngine.run,
    modelPreference: 'PREMIUM',
  },

  // --------------------------------------------------------------------------
  // INTELLIGENCE SUITE ENGINES (Admin)
  // --------------------------------------------------------------------------
  PREDICTIONS: {
    id: 'PREDICTIONS',
    name: 'ML Upgrade & Churn Predictions',
    department: 'ANALYTICS',
    handles: { jobTypes: ['ANALYTICS_QUERY'], subTypes: ['PREDICT'] },
    run: predictionEngine.run,
    modelPreference: 'STANDARD',
  },

  RETENTION: {
    id: 'RETENTION',
    name: 'Retention Intelligence Engine',
    department: 'ANALYTICS',
    handles: { jobTypes: ['ANALYTICS_QUERY'], subTypes: ['RETENTION'] },
    run: retentionEngine.run,
    modelPreference: 'STANDARD',
  },

  VIRAL: {
    id: 'VIRAL',
    name: 'Viral Loop Intelligence Engine',
    department: 'ANALYTICS',
    handles: { jobTypes: ['ANALYTICS_QUERY'], subTypes: ['VIRAL'] },
    run: viralEngine.run,
    modelPreference: 'STANDARD',
  },

  UX_RECOMMENDATION: {
    id: 'UX_RECOMMENDATION',
    name: 'UX Recommendation Engine',
    department: 'UIUX',
    handles: { jobTypes: ['ANALYTICS_QUERY'], subTypes: ['UX_INSIGHTS'] },
    run: uxRecommendationEngine.run,
    modelPreference: 'STANDARD',
  },

  // --------------------------------------------------------------------------
  // ECONOMY ENGINES
  // --------------------------------------------------------------------------
  ENERGY_ENGINE: {
    id: 'ENERGY_ENGINE',
    name: 'Energy Engine v5.0',
    department: 'ECONOMY',
    handles: { jobTypes: ['ENERGY_MANAGEMENT'] },
    run: energyEngine.run,
    modelPreference: 'CHEAP',
  },

  COIN_ENGINE: {
    id: 'COIN_ENGINE',
    name: 'Coin Engine',
    department: 'ECONOMY',
    handles: { jobTypes: ['COIN_MANAGEMENT'] },
    run: coinEngine.run,
    modelPreference: 'CHEAP',
  },

  PRODUCT_INTELLIGENCE_V5: {
    id: 'PRODUCT_INTELLIGENCE_V5',
    name: 'Product Intelligence Engine v5.0',
    department: 'COMMERCE',
    handles: {
      jobTypes: ['PRODUCT_INTELLIGENCE'],
      subTypes: ['auto_competitor_analysis', 'product_analysis']
    },
    run: productIntelligenceEngineV5.run,
    modelPreference: 'BALANCED',
    description: 'Analyzes products vs online competitors and suggests better positioning, scripts, and angles',
  },

  PUBLIC_CHATBOT_PRODUCT_FLOW: {
    id: 'PUBLIC_CHATBOT_PRODUCT_FLOW',
    name: 'Public Chatbot Product Flow Engine',
    department: 'SALES',
    handles: {
      jobTypes: ['CHATBOT_PRODUCT_FLOW'],
      subTypes: ['auto_product_selling', 'product_recommendation']
    },
    run: publicChatbotProductFlowEngine.run,
    modelPreference: 'FAST',
    description: 'Auto-detects customer needs and offers right products through chatbot',
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Find engine by jobType and optional subType
 */
export function findEngine(jobType: string, subType?: string): EngineDefinition | null {
  const engines = Object.values(EnginesRegistry);

  for (const engine of engines) {
    const matchesJobType = engine.handles.jobTypes.includes(jobType);

    if (!matchesJobType) continue;

    if (subType && engine.handles.subTypes) {
      if (engine.handles.subTypes.includes(subType)) {
        return engine;
      }
    } else if (!subType && !engine.handles.subTypes) {
      return engine;
    }
  }

  return engines.find(e => e.handles.jobTypes.includes(jobType) && !e.handles.subTypes) || null;
}

/**
 * Get all engines for a specific department
 */
export function getEnginesByDepartment(department: string): EngineDefinition[] {
  return Object.values(EnginesRegistry).filter(e => e.department === department);
}

/**
 * Get all engines that handle a specific jobType
 */
export function getEnginesByJobType(jobType: string): EngineDefinition[] {
  return Object.values(EnginesRegistry).filter(e => e.handles.jobTypes.includes(jobType));
}

/**
 * Get engine count by department
 */
export function getEngineCounts(): Record<string, number> {
  const counts: Record<string, number> = {};

  Object.values(EnginesRegistry).forEach(engine => {
    counts[engine.department] = (counts[engine.department] || 0) + 1;
  });

  return counts;
}

/**
 * Get all unique jobTypes across all engines
 */
export function getAllJobTypes(): string[] {
  const jobTypes = new Set<string>();

  Object.values(EnginesRegistry).forEach(engine => {
    engine.handles.jobTypes.forEach(jt => jobTypes.add(jt));
  });

  return Array.from(jobTypes);
}
