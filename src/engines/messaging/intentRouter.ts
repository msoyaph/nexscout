/**
 * INTENT ROUTER ENGINE - FILIPINO SALES OPTIMIZED
 *
 * Detects user intent from messages and routes to appropriate persona/prompt
 * Optimized for Taglish (Filipino + English) sales conversations
 *
 * Detection Methods:
 * - Keyword pattern matching with Filipino patterns (Phase 1)
 * - Sentiment analysis (Phase 2)
 * - LLM-based detection (Phase 3)
 */

export type UserIntent =
  | "greeting"
  | "product_inquiry"
  | "benefits"
  | "price"
  | "ordering_process"
  | "shipping_cod"
  | "side_effects"
  | "objection"
  | "hesitation"
  | "earning_opportunity"
  | "business_details"
  | "ready_to_buy"
  | "follow_up"
  | "salesInquiry"
  | "productInterest"
  | "pricing"
  | "closingOpportunity"
  | "leadQualification"
  | "mlmRecruit"
  | "mlmTraining"
  | "leadFollowUp"
  | "customerSupport"
  | "techSupport"
  | "complaint"
  | "orderTracking"
  | "refund"
  | "productEducation"
  | "off_topic"
  | "default";

export type MessageLanguage = 'en' | 'fil' | 'taglish' | 'auto';
import { supabase } from '../../lib/supabase';

// Unified Filipino Sales Intent Patterns
const FILIPINO_SALES_PATTERNS = {
  greeting: /^(hello|hi|hey|good\s?(morning|afternoon|evening|am|pm)|kumusta|mustah|kamusta|musta|yo|sup|oy)/i,
  ready_to_buy: /\b(order na|bili na|kuha ako|ready ako|sige na|go na|avail|pabili|send|gusto ko na|kailangan ko na)\b/i,
  price: /\b(magkano|price|how much|hm|presyo|gaano|cost|pila|pira|rate|pricing)\b/i,
  benefits: /\b(benefit|ano ang gagawin|effect|para saan|good for|ano gamit|pano gumana|epekto|benepisyo|mabuti|para sa|use|purpose|gamit|works)\b/i,
  shipping_cod: /\b(cod|cash on delivery|shipping|deliver|padala|hatid|free shipping|paano padala|payment|bayad|pay|deliver)\b/i,
  ordering: /\b(order|saan bibili|how to buy|paano mag order|paano bumili|saan makakabili|pano order|where to buy|paano)\b/i,
  earning: /\b(paano kumita|income|business|negosyo|magkano kita|komisyon|reseller|agent|pwede ba ako|mag agent|mag negosyo|mag business|extra income|sideline)\b/i,
  business_details: /\b(business details|company|legit|registered|permits|fda|ano company|sino kayo|where are you based|taga saan)\b/i,
  side_effects: /\b(side effect|safe ba|may masama ba|allergy|ligtas|ok lang|pwede|contra|bawal|allowed)\b/i,
  objection: /\b(no|hindi|ayaw|di kailangan|not interested|wala|pass|nah)\b/i,
  hesitation: /\b(mahal|expensive|think about|babalikan|di sure|baka next time|later|kita|pag isipan|tingnan|isip muna|siguro)\b/i,
  follow_up: /\b(balikan|follow up|pm kita|chat kita|message|later|bukas|tom|tomorrow)\b/i,
  product_inquiry: /\b(product|ano meron|details|info|available|meron|may|stock|ano ba|how|what|tell me|about)\b/i
};

// ========================================
// INTENT DETECTION PATTERNS
// ========================================

/**
 * Quick Filipino sales intent detection
 * Returns most likely intent for immediate routing
 */
export function detectFilipinoIntent(message: string): UserIntent {
  const m = message.toLowerCase().trim();

  // Priority order: strongest signals first
  if (FILIPINO_SALES_PATTERNS.greeting.test(m) && m.length < 20) return "greeting";
  if (FILIPINO_SALES_PATTERNS.ready_to_buy.test(m)) return "ready_to_buy";
  if (FILIPINO_SALES_PATTERNS.price.test(m)) return "price";
  if (FILIPINO_SALES_PATTERNS.benefits.test(m)) return "benefits";
  if (FILIPINO_SALES_PATTERNS.shipping_cod.test(m)) return "shipping_cod";
  if (FILIPINO_SALES_PATTERNS.ordering.test(m)) return "ordering_process";
  if (FILIPINO_SALES_PATTERNS.earning.test(m)) return "earning_opportunity";
  if (FILIPINO_SALES_PATTERNS.business_details.test(m)) return "business_details";
  if (FILIPINO_SALES_PATTERNS.side_effects.test(m)) return "side_effects";
  if (FILIPINO_SALES_PATTERNS.objection.test(m) && m.length < 30) return "objection";
  if (FILIPINO_SALES_PATTERNS.hesitation.test(m)) return "hesitation";
  if (FILIPINO_SALES_PATTERNS.follow_up.test(m)) return "follow_up";
  if (FILIPINO_SALES_PATTERNS.product_inquiry.test(m)) return "product_inquiry";

  return "off_topic";
}

const INTENT_PATTERNS: Record<string, {keywords: string[]; patterns: RegExp[]}> = {
  salesInquiry: {
    keywords: ['interested', 'tell me more', 'how does it work', 'gusto ko malaman', 'paano', 'info'],
    patterns: [/how (does|do|can) (it|this) work/i, /tell me (more|about)/i, /interested in/i]
  },

  productInterest: {
    keywords: ['product', 'offer', 'service', 'package', 'produkto', 'alok', 'available', 'meron ba'],
    patterns: [/what (do you|does|are) (have|offer|sell)/i, /show me (your|the) product/i]
  },

  pricing: {
    keywords: ['price', 'cost', 'how much', 'magkano', 'presyo', 'pricing', 'rates', 'fees', 'bayad'],
    patterns: [/how much (is|does|for)/i, /what('| i)s the (price|cost)/i, /magkano/i]
  },

  closingOpportunity: {
    keywords: ['ready', 'sign up', 'buy', 'purchase', 'order', 'checkout', 'bili na', 'ready na', 'go na', 'sige'],
    patterns: [/ready to (buy|purchase|sign|start)/i, /(yes|okay|sure), let('| i)s (go|do it)/i]
  },

  leadQualification: {
    keywords: ['budget', 'timeline', 'need', 'looking for', 'hanap', 'kailangan', 'gusto'],
    patterns: [/looking for/i, /(what|which) (option|plan|package)/i, /need (help|assistance)/i]
  },

  mlmRecruit: {
    keywords: ['join', 'recruit', 'team', 'opportunity', 'business', 'income', 'sumali', 'negosyo', 'kita'],
    patterns: [/join (the|your) team/i, /business opportunity/i, /extra income/i, /sumali/i]
  },

  mlmTraining: {
    keywords: ['training', 'learn', 'teach', 'how to sell', 'paano magbenta', 'matuto', 'workshop'],
    patterns: [/how (do i|to) (sell|recruit)/i, /training/i, /teach me/i]
  },

  leadFollowUp: {
    keywords: ['follow up', 'checking in', 'reminder', 'status', 'update', 'kumusta', 'ano na'],
    patterns: [/just (checking|following)/i, /any update/i, /status (on|of)/i]
  },

  customerSupport: {
    keywords: ['help', 'problem', 'issue', 'question', 'tulong', 'problema', 'tanong', 'support'],
    patterns: [/need help/i, /(have|got) (a|an) (problem|issue|question)/i]
  },

  techSupport: {
    keywords: ['not working', 'error', 'broken', 'bug', 'ayaw gumana', 'sira', 'mali'],
    patterns: [/not working/i, /(error|bug|broken)/i, /ayaw gumana/i]
  },

  complaint: {
    keywords: ['complain', 'disappointed', 'unhappy', 'refund', 'reklamo', 'dismaya', 'refund'],
    patterns: [/not happy/i, /disappointed/i, /want (my|a) refund/i]
  },

  orderTracking: {
    keywords: ['track', 'where is', 'delivery', 'shipping', 'order status', 'nasaan', 'kailan darating'],
    patterns: [/where is my (order|package)/i, /track (my|the) (order|shipment)/i]
  },

  refund: {
    keywords: ['refund', 'return', 'money back', 'cancel order', 'ibalik', 'refund'],
    patterns: [/(want|need|request) (a|my) refund/i, /return (this|my order)/i, /money back/i]
  },

  productEducation: {
    keywords: ['how to use', 'tutorial', 'guide', 'instructions', 'paano gamitin', 'turuan'],
    patterns: [/how (do i|to) use/i, /show me how/i, /instructions/i]
  },

  default: {
    keywords: [],
    patterns: []
  }
};

// ========================================
// INTENT CONFIDENCE THRESHOLDS
// ========================================

const CONFIDENCE_THRESHOLD = {
  high: 0.8,
  medium: 0.5,
  low: 0.3
};

// ========================================
// INTENT DETECTION ENGINE
// ========================================

export class IntentRouterEngine {
  /**
   * Detect intent from message text with Filipino sales optimization
   */
  detectIntent(message: string, language: MessageLanguage = 'auto'): {
    intent: UserIntent;
    confidence: number;
    signals: string[];
  } {
    // Fast path: Try Filipino sales patterns first
    const filipinoIntent = detectFilipinoIntent(message);
    if (filipinoIntent !== 'off_topic') {
      return {
        intent: filipinoIntent,
        confidence: 0.85,
        signals: ['filipino_pattern_match']
      };
    }

    // Fallback to comprehensive pattern matching
    const text = message.toLowerCase();
    const intentScores: Partial<Record<UserIntent, { score: number; signals: string[] }>> = {};

    // Score each intent
    for (const [intent, patterns] of Object.entries(INTENT_PATTERNS) as [UserIntent, typeof INTENT_PATTERNS[UserIntent]][]) {
      let score = 0;
      const signals: string[] = [];

      // Check keywords
      for (const keyword of patterns.keywords) {
        if (text.includes(keyword.toLowerCase())) {
          score += 1;
          signals.push(`keyword: ${keyword}`);
        }
      }

      // Check regex patterns
      for (const pattern of patterns.patterns) {
        if (pattern.test(text)) {
          score += 2; // Patterns weighted higher
          signals.push(`pattern: ${pattern.source}`);
        }
      }

      if (score > 0) {
        intentScores[intent] = { score, signals };
      }
    }

    // Find highest scoring intent
    let bestIntent: UserIntent = 'default';
    let bestScore = 0;
    let bestSignals: string[] = [];

    for (const [intent, result] of Object.entries(intentScores) as [UserIntent, { score: number; signals: string[] }][]) {
      if (result.score > bestScore) {
        bestScore = result.score;
        bestIntent = intent;
        bestSignals = result.signals;
      }
    }

    // Calculate confidence (normalized 0-1)
    const maxPossibleScore = 10; // Approximate max for any intent
    const confidence = Math.min(bestScore / maxPossibleScore, 1);

    return {
      intent: bestIntent,
      confidence,
      signals: bestSignals
    };
  }

  /**
   * Detect intent with context awareness
   */
  detectIntentWithContext(
    message: string,
    previousIntent?: UserIntent,
    conversationHistory?: string[]
  ): {
    intent: UserIntent;
    confidence: number;
    signals: string[];
  } {
    const baseDetection = this.detectIntent(message);

    // Boost confidence if intent is consistent with previous
    if (previousIntent && baseDetection.intent === previousIntent) {
      baseDetection.confidence = Math.min(baseDetection.confidence + 0.2, 1);
      baseDetection.signals.push('context: consistent with previous intent');
    }

    // Boost confidence if conversation history suggests intent
    if (conversationHistory && conversationHistory.length > 0) {
      const historyText = conversationHistory.join(' ').toLowerCase();

      // Check if pricing was mentioned before (likely still pricing inquiry)
      if (baseDetection.intent === 'pricing' && historyText.includes('price')) {
        baseDetection.confidence = Math.min(baseDetection.confidence + 0.1, 1);
        baseDetection.signals.push('context: pricing mentioned in history');
      }

      // Check if closing was attempted before (likely closing opportunity)
      if (baseDetection.intent === 'closingOpportunity' &&
          (historyText.includes('ready') || historyText.includes('interested'))) {
        baseDetection.confidence = Math.min(baseDetection.confidence + 0.15, 1);
        baseDetection.signals.push('context: previous buying signals');
      }
    }

    return baseDetection;
  }

  /**
   * Log intent detection for analytics
   */
  async logIntentDetection(
    userId: string,
    message: string,
    intent: UserIntent,
    confidence: number,
    selectedPersona: string,
    signals: string[]
  ): Promise<void> {
    try {
      await supabase.from('intent_detection_logs').insert({
        user_id: userId,
        message_content: message,
        detected_intent: intent,
        confidence_score: confidence,
        selected_persona: selectedPersona,
        signals: { keywords: signals },
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error logging intent detection:', error);
    }
  }

  /**
   * Get intent accuracy metrics
   */
  async getIntentAccuracyMetrics(userId: string, days: number = 30): Promise<{
    totalDetections: number;
    averageConfidence: number;
    intentDistribution: Record<UserIntent, number>;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('intent_detection_logs')
      .select('detected_intent, confidence_score')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString());

    if (error || !data) {
      return {
        totalDetections: 0,
        averageConfidence: 0,
        intentDistribution: {} as Record<UserIntent, number>
      };
    }

    const totalDetections = data.length;
    const averageConfidence = data.reduce((sum, log) => sum + (log.confidence_score || 0), 0) / totalDetections;

    const intentDistribution: Record<string, number> = {};
    for (const log of data) {
      intentDistribution[log.detected_intent] = (intentDistribution[log.detected_intent] || 0) + 1;
    }

    return {
      totalDetections,
      averageConfidence,
      intentDistribution: intentDistribution as Record<UserIntent, number>
    };
  }
}

// ========================================
// INTENT-TO-PERSONA MAPPING
// ========================================

export const INTENT_TO_PERSONA_MAP: Record<UserIntent, string> = {
  salesInquiry: 'sales',
  productInterest: 'sales',
  pricing: 'sales',
  closingOpportunity: 'sales',
  leadQualification: 'sales',
  mlmRecruit: 'mlmLeader',
  mlmTraining: 'mlmLeader',
  leadFollowUp: 'sales',
  customerSupport: 'support',
  techSupport: 'support',
  complaint: 'support',
  orderTracking: 'support',
  refund: 'support',
  productEducation: 'productExpert',
  default: 'default'
};

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Quick intent detection (no context) - Filipino optimized
 */
export function detectIntent(message: string): UserIntent {
  return detectFilipinoIntent(message);
}

/**
 * Get intent with confidence score
 */
export function detectIntentWithConfidence(message: string): {
  intent: UserIntent;
  confidence: number;
  keywords: string[];
} {
  const intent = detectFilipinoIntent(message);
  const m = message.toLowerCase();
  let confidence = 0.7;
  const keywords: string[] = [];

  // Boost confidence for clear signals
  switch (intent) {
    case 'greeting':
      if (/^(hi|hello|hey)/.test(m)) confidence = 0.95;
      keywords.push('greeting');
      break;
    case 'ready_to_buy':
      if (/order na|bili na/.test(m)) confidence = 0.95;
      keywords.push('buying_signal');
      break;
    case 'price':
      if (/magkano|how much/.test(m)) confidence = 0.9;
      keywords.push('price_inquiry');
      break;
    case 'hesitation':
      if (/mahal|expensive/.test(m)) confidence = 0.85;
      keywords.push('price_objection');
      break;
    default:
      confidence = 0.7;
  }

  return { intent, confidence, keywords };
}

/**
 * Get persona from intent
 */
export function getPersonaFromIntent(intent: UserIntent): string {
  return INTENT_TO_PERSONA_MAP[intent] || 'default';
}

// Export singleton instance
export const intentRouter = new IntentRouterEngine();
