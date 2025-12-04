export type SourceType =
  | 'paste_text'
  | 'csv'
  | 'image'
  | 'ocr'
  | 'web_crawl'
  | 'browser_capture'
  | 'chatbot_conversation'
  | 'fb_data_file'
  | 'linkedin_export'
  | 'manual_input';

export interface ProspectSource {
  id: string;
  user_id: string;
  source_type: SourceType;
  raw_payload: any;
  processed: boolean;
  created_at: string;
  updated_at: string;
}

export type ScanState =
  | 'IDLE'
  | 'PREPROCESSING'
  | 'PARSING'
  | 'ENTITY_MATCHING'
  | 'ENRICHING'
  | 'DEEP_SCANNING'
  | 'ASSEMBLING_INTEL'
  | 'SAVING'
  | 'LEARNING_UPDATE'
  | 'COMPLETE'
  | 'ERROR';

export interface ScanContext {
  scanId: string;
  userId: string;
  sourceId: string;
  state: ScanState;
  error?: string | null;

  language?: 'en' | 'fil' | 'taglish' | 'unknown';
  structure?: 'list' | 'paragraphs' | 'csv' | 'ocr' | 'html';

  rawText?: string;
  parsedProspects?: DraftProspect[];
  normalizedProspects?: DraftProspect[];
  finalProspectIds?: string[];
}

export interface DraftProspect {
  display_name?: string;
  first_name?: string;
  last_name?: string;
  contact_info?: {
    emails?: string[];
    phones?: string[];
  };
  social_handles?: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    tiktok?: string;
  };
  source_refs?: string[];
}

export interface DeepIntelResult {
  scout_score_v10: number;
  confidence_score: number;
  personality_profile: any;
  pain_points: any;
  financial_signals: any;
  business_interest: any;
  life_events: any;
  emotional_state: any;
  engagement_prediction: any;
  upsell_readiness: any;
  closing_likelihood: any;
  top_opportunities: any;
  raw_ai_output: any;
}

export interface ScanProgressEvent {
  scanId: string;
  userId: string;
  state: ScanState;
  progress: number;
  label: string;
  details?: any;
}
