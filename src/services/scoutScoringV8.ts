/**
 * ScoutScore V8 - Emotional Intent & Tone Fit Scoring Overlay
 * 
 * Detects emotional state and trust level from message content
 * Suggests tone adjustments for AI replies
 */
import type { Industry, BaseScoutScore, OverlayScoreV8, ScoutScoreInput } from '../types/scoutScore';

interface EmotionalSignal {
  keywords: string[];
  phrases: string[];
  score: number; // Contribution to emotional state
}

const EMOTIONAL_SIGNALS: Record<OverlayScoreV8['emotionalState'], EmotionalSignal> = {
  anxious: {
    keywords: ['scared', 'afraid', 'worried', 'fear', 'anxious', 'nerve', 'takot', 'kaba'],
    phrases: ['takot ako', 'worried ako', 'natatakot', 'nakakatakot', 'scared'],
    score: 30,
  },
  skeptical: {
    keywords: ['scam', 'legit', 'totoo ba', 'trust', 'believe', 'doubt', 'sure', 'sigurado'],
    phrases: ['scam ba', 'legit ba', 'totoo ba', 'trustworthy', 'too good to be true'],
    score: 25,
  },
  confused: {
    keywords: ['confused', 'di ko gets', 'paki explain', 'nalilito', 'hindi clear', 'not clear'],
    phrases: ['di ko gets', 'paki-explain', 'nalilito ako', 'hindi ko maintindihan', 'confused'],
    score: 20,
  },
  excited: {
    keywords: ['nice', 'ganda', 'great', 'wow', 'amazing', 'awesome', 'gusto ko', 'want', 'interested'],
    phrases: ['nice!', 'ganda!', 'gusto ko to', 'I want this', 'interested ako', 'amazing!'],
    score: 25,
  },
  hopeful: {
    keywords: ['hope', 'sana', 'hoping', 'wish', 'pray', 'looking forward'],
    phrases: ['sana gumana', 'hoping this helps', 'sana magwork', 'looking forward'],
    score: 15,
  },
  neutral: {
    keywords: [],
    phrases: [],
    score: 0,
  },
};

const TRUST_SIGNALS = {
  positive: [
    'sounds good',
    'okay this helps',
    'thanks',
    'appreciate',
    'helpful',
    'salamat',
    'thank you',
    'nakakatulong',
  ],
  negative: [
    'scam',
    'fraud',
    'fake',
    'walang kwenta',
    'waste',
    'nagtry na ako',
    'naloko',
    'nabiktima',
  ],
};

const RISK_FLAGS: Record<string, { keywords: string[]; description: string }> = {
  scam_trauma: {
    keywords: ['scam', 'naloko', 'nabiktima', 'waste', 'fraud'],
    description: 'Has experienced scam or fraud in the past',
  },
  fear_of_commitment: {
    keywords: ['think about it', 'isipin ko', 'not sure', 'hesitant', 'think'],
    description: 'Shows hesitation and fear of commitment',
  },
  financial_concern: {
    keywords: ['walang pera', 'no money', 'expensive', 'mahal', 'budget'],
    description: 'Financial constraints may prevent commitment',
  },
  time_constraint: {
    keywords: ['busy', 'walang time', 'no time', 'sched', 'schedule'],
    description: 'Time constraints may affect engagement',
  },
  decision_maker_issue: {
    keywords: ['tanong ko muna', 'ask', 'discuss', 'asawa', 'spouse', 'family'],
    description: 'Requires approval from decision maker',
  },
};

export class ScoutScoringV8Engine {
  /**
   * Calculate emotional intent and tone fit overlay score
   */
  async calculateEmotionalOverlay(
    input: ScoutScoreInput,
    baseScore: BaseScoutScore,
    industry?: Industry
  ): Promise<OverlayScoreV8> {
    const messages = input.lastMessages || [];
    const userMessages = messages
      .filter(m => m.sender === 'user')
      .map(m => m.message.toLowerCase())
      .slice(-5); // Last 5 user messages

    const combinedText = userMessages.join(' ');

    // Detect emotional state
    const emotionalState = this.detectEmotionalState(combinedText);
    
    // Calculate trust score
    const trustScore = this.calculateTrustScore(combinedText, userMessages);
    
    // Detect risk flags
    const riskFlags = this.detectRiskFlags(combinedText, industry);
    
    // Determine tone adjustment
    const toneAdjustment = this.determineToneAdjustment(emotionalState, trustScore, riskFlags);

    return {
      version: 'v8',
      emotionalState,
      trustScore,
      riskFlags,
      toneAdjustment,
    };
  }

  private detectEmotionalState(text: string): OverlayScoreV8['emotionalState'] {
    const scores: Record<string, number> = {
      anxious: 0,
      skeptical: 0,
      confused: 0,
      excited: 0,
      hopeful: 0,
      neutral: 0,
    };

    // Score each emotional state
    for (const [state, signal] of Object.entries(EMOTIONAL_SIGNALS)) {
      if (state === 'neutral') continue;
      
      let stateScore = 0;
      
      // Check keywords
      for (const keyword of signal.keywords) {
        if (text.includes(keyword)) {
          stateScore += 10;
        }
      }
      
      // Check phrases (higher weight)
      for (const phrase of signal.phrases) {
        if (text.includes(phrase)) {
          stateScore += 20;
        }
      }
      
      scores[state] = stateScore;
    }

    // Find dominant emotion
    const dominantState = Object.entries(scores).reduce((a, b) => 
      scores[a[0]] > scores[b[0]] ? a : b
    )[0] as OverlayScoreV8['emotionalState'];

    // If no strong signal, return neutral
    if (scores[dominantState] < 15) {
      return 'neutral';
    }

    return dominantState;
  }

  private calculateTrustScore(text: string, messages: string[]): number {
    let trustScore = 65; // Start neutral-high

    // Check positive trust signals
    let positiveCount = 0;
    for (const signal of TRUST_SIGNALS.positive) {
      if (text.includes(signal)) {
        positiveCount++;
      }
    }

    // Check negative trust signals
    let negativeCount = 0;
    for (const signal of TRUST_SIGNALS.negative) {
      if (text.includes(signal)) {
        negativeCount++;
      }
    }

    // Adjust trust score
    trustScore += positiveCount * 5; // Increase with positive signals
    trustScore -= negativeCount * 10; // Decrease more with negative signals

    // If multiple scam mentions, significant trust drop
    const scamMentions = (text.match(/scam/g) || []).length;
    if (scamMentions >= 2) {
      trustScore -= 20;
    }

    // Clamp to 0-100
    return Math.max(0, Math.min(100, Math.round(trustScore)));
  }

  private detectRiskFlags(text: string, industry?: Industry): string[] {
    const flags: string[] = [];

    for (const [flagKey, flagData] of Object.entries(RISK_FLAGS)) {
      const hasFlag = flagData.keywords.some(keyword => text.includes(keyword));
      
      if (hasFlag) {
        // Industry-specific flag relevance
        if (flagKey === 'scam_trauma' && (industry === 'mlm' || industry === 'insurance')) {
          flags.push(flagKey); // More relevant in MLM/insurance
        } else if (flagKey !== 'scam_trauma') {
          flags.push(flagKey); // Always include other flags
        } else {
          flags.push(flagKey); // Include anyway but may be less critical
        }
      }
    }

    return flags;
  }

  private determineToneAdjustment(
    emotionalState: OverlayScoreV8['emotionalState'],
    trustScore: number,
    riskFlags: string[]
  ): OverlayScoreV8['toneAdjustment'] {
    // Anxious or skeptical → more reassuring
    if (emotionalState === 'anxious' || emotionalState === 'skeptical' || trustScore < 50) {
      return 'more_reassuring';
    }

    // Confused → more clarifying
    if (emotionalState === 'confused') {
      return 'more_clarifying';
    }

    // Excited and high trust → more confident (ready to close)
    if (emotionalState === 'excited' && trustScore >= 70) {
      return 'more_confident';
    }

    // Fear of commitment or financial concern → softer approach
    if (riskFlags.includes('fear_of_commitment') || riskFlags.includes('financial_concern')) {
      return 'softer';
    }

    // Default: no adjustment needed
    return 'none';
  }
}

export const scoutScoringV8Engine = new ScoutScoringV8Engine();


