const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export const API_CONFIG = {
  baseURL: SUPABASE_URL,

  endpoints: {
    scan: {
      start: `${SUPABASE_URL}/functions/v1/core-scan-start`,
      status: `${SUPABASE_URL}/functions/v1/core-scan-status`,
      results: `${SUPABASE_URL}/functions/v1/core-scan-results`,
      save: `${SUPABASE_URL}/functions/v1/core-scan-save`,
      list: `${SUPABASE_URL}/functions/v1/core-scan-list`,
    },

    message: {
      generate: `${SUPABASE_URL}/functions/v1/core-message-generate`,
    },

    deck: {
      generate: `${SUPABASE_URL}/functions/v1/core-deck-generate`,
    },

    sequence: {
      generate: `${SUPABASE_URL}/functions/v1/core-sequence-generate`,
    },

    prospect: {
      score: `${SUPABASE_URL}/functions/v1/core-prospect-score`,
      actions: `${SUPABASE_URL}/functions/v1/core-prospect-actions`,
    },

    insights: {
      summary: `${SUPABASE_URL}/functions/v1/core-insights-summary`,
      prospect: `${SUPABASE_URL}/functions/v1/core-insights-prospect`,
      aiSmartness: `${SUPABASE_URL}/functions/v1/core-insights-ai-smartness`,
    },

    limits: {
      check: `${SUPABASE_URL}/functions/v1/core-limits-check`,
    },

    coins: {
      spend: `${SUPABASE_URL}/functions/v1/core-coins-spend`,
    },
  },

  polling: {
    scanStatusInterval: 3000,
    maxRetries: 3,
    retryDelay: 1000,
  },
};

export type SourceType = 'url' | 'screenshots' | 'files' | 'paste_text' | 'social_connect' | 'browser_extension';

export type MessageType = 'first_touch' | 'follow_up' | 'revival' | 'referral' | 'call_invite';
export type Channel = 'messenger' | 'sms' | 'email' | 'whatsapp';
export type Tone = 'friendly' | 'professional' | 'bold' | 'story';
export type Language = 'taglish' | 'english' | 'filipino';

export type ScanStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type ScanStep = 'extracting_text' | 'detecting_names' | 'detecting_interests' | 'detecting_intent' | 'scoring' | 'finalizing';

export interface StartScanPayload {
  sourceType: SourceType;
  url?: string;
  files?: File[];
  rawText?: string;
  socialAccountIds?: string[];
  extensionCaptureId?: string;
  tags?: string[];
}

export interface ScanStatusResponse {
  scanId: string;
  state: ScanStatus;
  currentStep: ScanStep;
  progress: number;
  message?: string;
  error?: string;
}

export interface ProspectSummary {
  id: string;
  name: string;
  score: number;
  rank: 'hot' | 'warm' | 'cold';
  summary: string;
  tags: string[];
  metadata?: any;
}

export interface ScanInsights {
  topHotProspects: ProspectSummary[];
  commonInterests: string[];
  intentSignals: string[];
  engagementPatterns: string[];
  personaClusters: Array<{ label: string; count: number }>;
  aiStrategy: string;
}

export interface ScanResultsResponse {
  scanId: string;
  prospects: ProspectSummary[];
  insights: ScanInsights;
  meta: {
    totalProspects: number;
    hotCount: number;
    warmCount: number;
    coldCount: number;
    sourceTypes: string[];
    startedAt: string;
    finishedAt: string;
  };
}

export interface GenerateMessagePayload {
  prospectId: string;
  messageType: MessageType;
  channel: Channel;
  tone: Tone;
  language: Language;
  context?: {
    productType?: string;
    campaignGoal?: string;
    previousMessages?: string[];
  };
}

export interface GenerateMessageResponse {
  success: boolean;
  message: string;
  variants: string[];
  meta: {
    recommendedVariantIndex: number;
    kpiGoal: string;
  };
}

export interface AISmartness {
  overall: number;
  precision: number;
  speed: number;
  learningDepth: number;
  samplesCount: number;
}

export const STEP_LABELS: Record<ScanStep, string> = {
  extracting_text: 'Extracting text',
  detecting_names: 'Detecting names',
  detecting_interests: 'Detecting interests',
  detecting_intent: 'Detecting intent signals',
  scoring: 'Scoring prospects (ScoutScore V5)',
  finalizing: 'Finalizing insights',
};
