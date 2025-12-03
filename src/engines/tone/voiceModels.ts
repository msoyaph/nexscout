/**
 * NEXSCOUT VOICE MODEL PACK
 *
 * Pre-configured voice profiles for different selling scenarios
 * Controls: tone, urgency, formality, sentence length, emoji usage
 */

export type VoicePreset = 'aggressiveCloser' | 'softNurturer' | 'professionalAdvisor' | 'energeticCoach' | 'empathicSupport';

export interface VoiceProfile {
  name: string;
  description: string;
  sentenceLength: 'short' | 'medium' | 'long';
  emojiUsage: 'none' | 'minimal' | 'moderate' | 'casual';
  urgencyLevel: 'low' | 'medium' | 'high';
  formality: 'casual' | 'neutral' | 'formal';
  defaultLanguageMix: 'english' | 'taglish' | 'local';
  cta_frequency: 'low' | 'medium' | 'high';
  question_frequency: 'low' | 'medium' | 'high';
  personality_traits: string[];
}

// ========================================
// VOICE MODEL DEFINITIONS
// ========================================

export const VoiceModels: Record<VoicePreset, VoiceProfile> = {
  aggressiveCloser: {
    name: 'Aggressive Closer',
    description: 'Direct, high-urgency, strong CTAs for hot leads ready to buy. Best for closing opportunities.',
    sentenceLength: 'short',
    emojiUsage: 'minimal',
    urgencyLevel: 'high',
    formality: 'neutral',
    defaultLanguageMix: 'taglish',
    cta_frequency: 'high',
    question_frequency: 'medium',
    personality_traits: [
      'direct',
      'confident',
      'action-oriented',
      'persistent',
      'results-focused'
    ]
  },

  softNurturer: {
    name: 'Soft Nurturer',
    description: 'Gentle, patient, supportive tone for cold/warm leads. Builds trust slowly without pressure.',
    sentenceLength: 'medium',
    emojiUsage: 'casual',
    urgencyLevel: 'low',
    formality: 'neutral',
    defaultLanguageMix: 'local',
    cta_frequency: 'low',
    question_frequency: 'high',
    personality_traits: [
      'empathetic',
      'patient',
      'supportive',
      'understanding',
      'reassuring'
    ]
  },

  professionalAdvisor: {
    name: 'Professional Advisor',
    description: 'Structured, formal, clear tone for B2B, insurance, real estate. Expert consultant approach.',
    sentenceLength: 'medium',
    emojiUsage: 'none',
    urgencyLevel: 'medium',
    formality: 'formal',
    defaultLanguageMix: 'english',
    cta_frequency: 'medium',
    question_frequency: 'high',
    personality_traits: [
      'knowledgeable',
      'professional',
      'analytical',
      'trustworthy',
      'consultative'
    ]
  },

  energeticCoach: {
    name: 'Energetic Coach',
    description: 'Enthusiastic, motivating, inspirational tone. Perfect for MLM recruiting and team building.',
    sentenceLength: 'short',
    emojiUsage: 'moderate',
    urgencyLevel: 'medium',
    formality: 'casual',
    defaultLanguageMix: 'taglish',
    cta_frequency: 'high',
    question_frequency: 'medium',
    personality_traits: [
      'enthusiastic',
      'motivating',
      'positive',
      'energetic',
      'inspiring'
    ]
  },

  empathicSupport: {
    name: 'Empathic Support',
    description: 'Warm, caring, problem-solving tone. Best for customer support and objection handling.',
    sentenceLength: 'medium',
    emojiUsage: 'minimal',
    urgencyLevel: 'low',
    formality: 'neutral',
    defaultLanguageMix: 'local',
    cta_frequency: 'low',
    question_frequency: 'high',
    personality_traits: [
      'caring',
      'helpful',
      'patient',
      'solution-oriented',
      'reassuring'
    ]
  }
};

// ========================================
// VOICE SELECTION ENGINE
// ========================================

export class VoiceModelEngine {
  /**
   * Get voice profile by preset
   */
  getVoiceProfile(preset: VoicePreset): VoiceProfile {
    return VoiceModels[preset];
  }

  /**
   * Auto-select voice based on intent and temperature
   */
  autoSelectVoice(intent: string, temperature: string): VoicePreset {
    // Closing opportunity + hot/ready -> aggressive closer
    if (intent === 'closingOpportunity' && (temperature === 'hot' || temperature === 'readyToBuy')) {
      return 'aggressiveCloser';
    }

    // MLM recruit -> energetic coach
    if (intent === 'mlmRecruit' || intent === 'mlmTraining') {
      return 'energeticCoach';
    }

    // Support/complaint -> empathic support
    if (intent === 'customerSupport' || intent === 'complaint' || intent === 'refund') {
      return 'empathicSupport';
    }

    // B2B/professional -> professional advisor
    if (intent === 'leadQualification' || intent === 'productEducation') {
      return 'professionalAdvisor';
    }

    // Cold leads -> soft nurturer
    if (temperature === 'cold' || temperature === 'warm') {
      return 'softNurturer';
    }

    // Default
    return 'professionalAdvisor';
  }

  /**
   * Generate prompt instructions from voice profile
   */
  generatePromptInstructions(profile: VoiceProfile): string {
    const instructions: string[] = [];

    // Tone instructions
    instructions.push(`VOICE: ${profile.name}`);
    instructions.push(`PERSONALITY: ${profile.personality_traits.join(', ')}`);

    // Sentence length
    if (profile.sentenceLength === 'short') {
      instructions.push('Keep sentences SHORT (max 15 words). Be concise.');
    } else if (profile.sentenceLength === 'medium') {
      instructions.push('Use MEDIUM-length sentences. Balance clarity and depth.');
    } else {
      instructions.push('Use LONGER sentences when needed for clarity. Explain thoroughly.');
    }

    // Emoji usage
    if (profile.emojiUsage === 'none') {
      instructions.push('NO EMOJIS. Keep it professional and text-only.');
    } else if (profile.emojiUsage === 'minimal') {
      instructions.push('Use emojis SPARINGLY (1-2 max per message).');
    } else if (profile.emojiUsage === 'moderate') {
      instructions.push('Use emojis MODERATELY to add warmth (3-4 per message).');
    } else {
      instructions.push('Use emojis FREQUENTLY to be friendly and approachable.');
    }

    // Urgency level
    if (profile.urgencyLevel === 'high') {
      instructions.push('CREATE URGENCY. Use time-sensitive language. Strong CTAs.');
    } else if (profile.urgencyLevel === 'medium') {
      instructions.push('BALANCED urgency. Suggest next steps without pressure.');
    } else {
      instructions.push('LOW PRESSURE. Take your time. No rush. Build trust first.');
    }

    // Formality
    if (profile.formality === 'formal') {
      instructions.push('FORMAL tone. Use proper grammar. Address professionally.');
    } else if (profile.formality === 'neutral') {
      instructions.push('NEUTRAL tone. Friendly but professional.');
    } else {
      instructions.push('CASUAL tone. Be friendly and conversational.');
    }

    // CTA frequency
    if (profile.cta_frequency === 'high') {
      instructions.push('ALWAYS include a clear call-to-action in every message.');
    } else if (profile.cta_frequency === 'medium') {
      instructions.push('Include CTAs when appropriate, but not forced.');
    } else {
      instructions.push('Soft CTAs only. Focus on building rapport first.');
    }

    // Question frequency
    if (profile.question_frequency === 'high') {
      instructions.push('ASK QUESTIONS frequently to understand needs.');
    } else if (profile.question_frequency === 'medium') {
      instructions.push('Ask 1-2 questions per message to qualify.');
    } else {
      instructions.push('Minimize questions. Focus on providing value.');
    }

    return instructions.join('\n');
  }

  /**
   * Apply voice adjustments to a message
   */
  applyVoiceAdjustments(message: string, profile: VoiceProfile): string {
    let adjusted = message;

    // Apply sentence length adjustments
    if (profile.sentenceLength === 'short') {
      // Split long sentences (basic heuristic)
      adjusted = adjusted.replace(/([.!?])\s+/g, '$1\n');
    }

    // Apply emoji adjustments
    if (profile.emojiUsage === 'none') {
      // Remove all emojis
      adjusted = adjusted.replace(/[\u{1F300}-\u{1F9FF}]/gu, '');
    }

    // Apply urgency adjustments
    if (profile.urgencyLevel === 'high') {
      // Add urgency markers (if not present)
      if (!adjusted.includes('!') && !adjusted.includes('now') && !adjusted.includes('today')) {
        adjusted = adjusted.replace(/\.$/, '!');
      }
    }

    return adjusted;
  }

  /**
   * Get all available voice presets
   */
  getAvailableVoices(): Array<{ preset: VoicePreset; profile: VoiceProfile }> {
    return Object.entries(VoiceModels).map(([preset, profile]) => ({
      preset: preset as VoicePreset,
      profile
    }));
  }
}

// ========================================
// VOICE-TO-INTENT MAPPING
// ========================================

export const INTENT_TO_VOICE_MAP: Record<string, VoicePreset> = {
  salesInquiry: 'professionalAdvisor',
  productInterest: 'professionalAdvisor',
  pricing: 'professionalAdvisor',
  closingOpportunity: 'aggressiveCloser',
  leadQualification: 'professionalAdvisor',
  mlmRecruit: 'energeticCoach',
  mlmTraining: 'energeticCoach',
  leadFollowUp: 'softNurturer',
  customerSupport: 'empathicSupport',
  techSupport: 'empathicSupport',
  complaint: 'empathicSupport',
  orderTracking: 'empathicSupport',
  refund: 'empathicSupport',
  productEducation: 'professionalAdvisor',
  default: 'professionalAdvisor'
};

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Get voice profile by preset
 */
export function getVoiceProfile(preset: VoicePreset): VoiceProfile {
  return VoiceModels[preset];
}

/**
 * Auto-select voice
 */
export function autoSelectVoice(intent: string, temperature: string): VoicePreset {
  const engine = new VoiceModelEngine();
  return engine.autoSelectVoice(intent, temperature);
}

/**
 * Generate prompt instructions
 */
export function generateVoiceInstructions(preset: VoicePreset): string {
  const engine = new VoiceModelEngine();
  const profile = engine.getVoiceProfile(preset);
  return engine.generatePromptInstructions(profile);
}

// Export singleton
export const voiceModelEngine = new VoiceModelEngine();
