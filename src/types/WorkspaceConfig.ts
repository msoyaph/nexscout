/**
 * WORKSPACE CONFIG TYPES
 *
 * Multi-tenant AI configuration system
 * Each workspace has isolated configs for all AI modules
 */

// ========================================
// CORE WORKSPACE CONFIG
// ========================================

export interface WorkspaceConfig {
  workspaceId: string;
  company: CompanyConfig;
  products: ProductConfig;
  toneProfile: ToneProfileConfig;
  funnels: FunnelConfig;
  aiBehavior: AIBehaviorConfig;
  customInstructions: CustomInstructionsConfig;
  aiPitchDeck: AIPitchDeckConfig;
  aiMessages: AIMessagesConfig;
  pipeline: PipelineConfig;
  aiSequences: AISequencesConfig;
  aiSellingPersonas: AISellingPersonasConfig;
  businessOpportunity: BusinessOpportunityConfig;
  compensation: CompensationConfig;
  recruitingFlow: RecruitingFlowConfig;
  createdAt: string;
  updatedAt: string;
}

// ========================================
// COMPANY CONFIG
// ========================================

export interface CompanyConfig {
  name: string;
  brandName: string;
  industry: string;
  audience: string;
  mission: string;
  description: string;
  website?: string;
  logo?: string;
}

// ========================================
// PRODUCT CONFIG
// ========================================

export interface ProductConfig {
  products: Product[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  benefits: string[];
  pricing: ProductPricing;
  category: string;
  imageUrl?: string;
}

export interface ProductPricing {
  amount: number;
  currency: string;
  discounts?: {
    type: string;
    value: number;
  }[];
}

// ========================================
// TONE PROFILE CONFIG
// ========================================

export interface ToneProfileConfig {
  brandVoice: string; // warm, corporate, energetic, spiritual, professional
  languageMix: 'english' | 'filipino' | 'taglish' | 'cebuano' | 'spanish';
  emojiUsage: 'none' | 'minimal' | 'moderate' | 'frequent';
  formality: 'casual' | 'neutral' | 'formal';
  personality: string[];
  sentenceLength: 'short' | 'medium' | 'long';
  pacing: 'fast' | 'medium' | 'slow';
}

// ========================================
// FUNNEL CONFIG
// ========================================

export interface FunnelConfig {
  funnels: {
    [funnelName: string]: {
      stages: string[];
      labels: Record<string, string>;
      automationRules?: {
        autoMoveToNextStage?: boolean;
        revivalAfterDays?: number;
        autoTagHotLead?: boolean;
      };
    };
  };
}

// ========================================
// AI BEHAVIOR CONFIG
// ========================================

export interface AIBehaviorConfig {
  agentName: string; // Mila, Jax, Clara, etc.
  defaultPersona: string;
  voicePresets: {
    closing: string;
    revival: string;
    training: string;
    support: string;
  };
  behaviorFlags: {
    allowAutoFollowups: boolean;
    useRankBasedCoaching: boolean;
    enableSmartRouting: boolean;
  };
}

// ========================================
// CUSTOM INSTRUCTIONS CONFIG
// ========================================

export interface CustomInstructionsConfig {
  globalInstructions: string;
  channelSpecific?: {
    messenger?: string;
    whatsapp?: string;
    sms?: string;
    email?: string;
    webchat?: string;
  };
  priority: number; // 1-10, higher = more important
}

// ========================================
// AI PITCH DECK CONFIG
// ========================================

export interface AIPitchDeckConfig {
  slides: PitchSlide[];
}

export interface PitchSlide {
  id: string;
  title: string;
  content: string;
  order: number;
  imageUrl?: string;
}

// ========================================
// AI MESSAGES CONFIG
// ========================================

export interface AIMessagesConfig {
  welcomeMessages: string[];
  followUpTemplates: {
    warmLead: string[];
    coldLead: string[];
    hotLead: string[];
  };
  closingScripts: string[];
  objectionHandlers: {
    [objectionType: string]: string[];
  };
  faqResponses: {
    [question: string]: string;
  };
}

// ========================================
// PIPELINE CONFIG
// ========================================

export interface PipelineConfig {
  stages: string[];
  automationRules: {
    autoTagHotLead: boolean;
    autoMoveToNextStage: boolean;
    revivalAfterDays: number;
  };
  customFields?: {
    name: string;
    type: string;
    required: boolean;
  }[];
}

// ========================================
// AI SEQUENCES CONFIG
// ========================================

export interface AISequencesConfig {
  sequences: {
    [sequenceName: string]: string[];
  };
}

// ========================================
// AI SELLING PERSONAS CONFIG
// ========================================

export interface AISellingPersonasConfig {
  personas: SellingPersona[];
  defaultPersona: string;
}

export interface SellingPersona {
  id: string;
  title: string;
  description: string;
  tone: string;
  approach: string;
}

// ========================================
// BUSINESS OPPORTUNITY CONFIG
// ========================================

export interface BusinessOpportunityConfig {
  earningModel: 'reseller' | 'affiliate' | 'mlm' | 'direct_sales';
  startAmount: number;
  currency: string;
  commissions: {
    direct: string;
    rebates?: string;
    referralBonus?: string;
  };
  simpleExplanation: string;
  detailedSteps: string[];
}

// ========================================
// COMPENSATION CONFIG
// ========================================

export interface CompensationConfig {
  planType: 'unilevel' | 'binary' | 'matrix';
  levels: {
    level: number;
    percentage: number;
  }[];
  bonuses?: {
    type: string;
    amount: number;
    criteria: string;
  }[];
}

// ========================================
// RECRUITING FLOW CONFIG
// ========================================

export interface RecruitingFlowConfig {
  steps: string[];
  materials: {
    type: string;
    url: string;
    title: string;
  }[];
  automatedMessages: {
    stage: string;
    message: string;
    delayHours: number;
  }[];
}

// ========================================
// DEFAULT CONFIGS
// ========================================

export function getDefaultWorkspaceConfig(workspaceId: string, companyName: string): WorkspaceConfig {
  return {
    workspaceId,
    company: {
      name: companyName,
      brandName: companyName,
      industry: 'general',
      audience: 'General audience',
      mission: 'Serving our customers with excellence',
      description: 'A trusted provider of quality products and services',
    },
    products: {
      products: [],
    },
    toneProfile: {
      brandVoice: 'warm',
      languageMix: 'english',
      emojiUsage: 'minimal',
      formality: 'neutral',
      personality: ['helpful', 'friendly', 'professional'],
      sentenceLength: 'medium',
      pacing: 'medium',
    },
    funnels: {
      funnels: {
        recruiting: {
          stages: ['awareness', 'interest', 'evaluation', 'decision', 'closing'],
          labels: {
            awareness: 'Building Awareness',
            interest: 'Generating Interest',
            evaluation: 'Evaluating Fit',
            decision: 'Making Decision',
            closing: 'Closing the Deal',
          },
        },
      },
    },
    aiBehavior: {
      agentName: 'AI Assistant',
      defaultPersona: 'professionalAdvisor',
      voicePresets: {
        closing: 'aggressiveCloser',
        revival: 'softNurturer',
        training: 'professionalAdvisor',
        support: 'empathicSupport',
      },
      behaviorFlags: {
        allowAutoFollowups: true,
        useRankBasedCoaching: true,
        enableSmartRouting: true,
      },
    },
    customInstructions: {
      globalInstructions: '',
      priority: 10,
    },
    aiPitchDeck: {
      slides: [],
    },
    aiMessages: {
      welcomeMessages: ['Hello! How can I help you today?'],
      followUpTemplates: {
        warmLead: ['Just checking in! Are you still interested?'],
        coldLead: ['Hi! Would you like to learn more?'],
        hotLead: ['Ready to get started? I can help you right away!'],
      },
      closingScripts: ['Would you like to proceed? I can guide you step-by-step.'],
      objectionHandlers: {},
      faqResponses: {},
    },
    pipeline: {
      stages: ['New Lead', 'Engaged', 'Interested', 'Decision', 'Closing'],
      automationRules: {
        autoTagHotLead: true,
        autoMoveToNextStage: false,
        revivalAfterDays: 3,
      },
    },
    aiSequences: {
      sequences: {
        warmLeadFollowUp: ['Hello! How are you?', 'Just wanted to follow up on our conversation.'],
        closingSequence: ['Ready to get started?', 'I can guide you through the process.'],
      },
    },
    aiSellingPersonas: {
      personas: [
        {
          id: 'professionalAdvisor',
          title: 'Professional Advisor',
          description: 'Direct, structured, expert tone',
          tone: 'professional',
          approach: 'consultative',
        },
      ],
      defaultPersona: 'professionalAdvisor',
    },
    businessOpportunity: {
      earningModel: 'direct_sales',
      startAmount: 0,
      currency: 'PHP',
      commissions: {
        direct: '0%',
      },
      simpleExplanation: 'Earn by sharing and helping others.',
      detailedSteps: [],
    },
    compensation: {
      planType: 'unilevel',
      levels: [],
    },
    recruitingFlow: {
      steps: [],
      materials: [],
      automatedMessages: [],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
