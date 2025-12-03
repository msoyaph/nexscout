/**
 * LANGUAGE ROUTER ENGINE
 *
 * Auto-detects and routes messages by language
 * Supports: English, Filipino/Tagalog, Cebuano, Spanish
 *
 * Detection Methods:
 * - Keyword pattern matching
 * - Character set analysis
 * - Language confidence scoring
 */

import { MessageLanguage } from '../../shared/types';

// ========================================
// LANGUAGE DETECTION PATTERNS
// ========================================

const LANGUAGE_PATTERNS = {
  // Spanish indicators
  spanish: {
    keywords: [
      'hola', 'gracias', 'por favor', 'buenos días', 'buenas tardes',
      'cómo', 'qué', 'cuánto', 'dónde', 'cuándo', 'señor', 'señora',
      'muy bien', 'de nada', 'hasta luego', 'adiós', 'sí', 'no'
    ],
    patterns: [
      /¿[^?]+\?/,  // Spanish question marks
      /¡[^!]+!/,   // Spanish exclamation marks
      /(hola|gracias|buenos días|buenas tardes)/i,
      /(señor|señora|usted)/i
    ],
    characters: /[áéíóúüñ]/
  },

  // Cebuano indicators
  cebuano: {
    keywords: [
      'unsaon', 'ganahan', 'kaayo', 'lagi', 'bitaw', 'gud', 'gyud',
      'nganong', 'kinsa', 'asa', 'kanus-a', 'pila', 'maayo',
      'salamat', 'palihug', 'ayaw', 'pwede', 'dili', 'wala'
    ],
    patterns: [
      /(unsaon|ganahan|kaayo)/i,
      /(lagi|bitaw|gud|gyud)/i,
      /(maayo|salamat|palihug)/i
    ],
    distinctiveWords: ['kaayo', 'gyud', 'bitaw', 'unsaon', 'nganong']
  },

  // Filipino/Tagalog indicators
  filipino: {
    keywords: [
      'po', 'opo', 'naman', 'diba', 'gusto ko', 'sige na', 'ano',
      'paano', 'saan', 'kailan', 'magkano', 'ilan', 'bakit',
      'salamat', 'paki', 'pwede', 'hindi', 'wala', 'meron',
      'kumusta', 'tama', 'mali', 'oo', 'siguro', 'talaga'
    ],
    patterns: [
      /(po|opo)\b/i,
      /(naman|diba|talaga)/i,
      /(gusto ko|sige na|kumusta)/i,
      /(salamat|paki|pwede)/i
    ],
    distinctiveWords: ['po', 'opo', 'naman', 'diba', 'talaga', 'kumusta']
  },

  // English indicators (default)
  english: {
    keywords: [
      'the', 'and', 'that', 'have', 'what', 'when', 'where', 'why',
      'how', 'thank', 'please', 'yes', 'hello', 'help', 'want', 'need'
    ],
    patterns: [
      /\b(the|and|that|have|what)\b/i,
      /\b(thank you|thanks|please)\b/i,
      /\b(yes|no|hello|hi)\b/i
    ]
  }
};

// ========================================
// LANGUAGE ROUTER ENGINE
// ========================================

export class LanguageRouterEngine {
  /**
   * Detect language from text with confidence scoring
   */
  detectLanguage(text: string): {
    language: MessageLanguage;
    confidence: number;
    signals: string[];
  } {
    const normalizedText = text.toLowerCase().trim();
    const scores: Record<string, { score: number; signals: string[] }> = {
      es: { score: 0, signals: [] },
      ceb: { score: 0, signals: [] },
      fil: { score: 0, signals: [] },
      en: { score: 0, signals: [] }
    };

    // 1. Check Spanish
    this.scoreLanguage(normalizedText, LANGUAGE_PATTERNS.spanish, scores.es, 'Spanish');

    // 2. Check Cebuano (check before Filipino as they share some words)
    this.scoreLanguage(normalizedText, LANGUAGE_PATTERNS.cebuano, scores.ceb, 'Cebuano');

    // 3. Check Filipino/Tagalog
    this.scoreLanguage(normalizedText, LANGUAGE_PATTERNS.filipino, scores.fil, 'Filipino');

    // 4. Check English
    this.scoreLanguage(normalizedText, LANGUAGE_PATTERNS.english, scores.en, 'English');

    // Special handling for distinctive words
    if (LANGUAGE_PATTERNS.cebuano.distinctiveWords.some(w => normalizedText.includes(w))) {
      scores.ceb.score += 5;
      scores.ceb.signals.push('distinctive Cebuano word found');
    }

    if (LANGUAGE_PATTERNS.filipino.distinctiveWords.some(w => normalizedText.includes(w))) {
      scores.fil.score += 5;
      scores.fil.signals.push('distinctive Filipino word found');
    }

    // Find highest scoring language
    let bestLang: MessageLanguage = 'en';
    let bestScore = scores.en.score;
    let bestSignals = scores.en.signals;

    if (scores.es.score > bestScore) {
      bestLang = 'es';
      bestScore = scores.es.score;
      bestSignals = scores.es.signals;
    }

    if (scores.ceb.score > bestScore) {
      bestLang = 'ceb';
      bestScore = scores.ceb.score;
      bestSignals = scores.ceb.signals;
    }

    if (scores.fil.score > bestScore) {
      bestLang = 'fil';
      bestScore = scores.fil.score;
      bestSignals = scores.fil.signals;
    }

    // Calculate confidence (0-1)
    const maxPossibleScore = 15;
    const confidence = Math.min(bestScore / maxPossibleScore, 1);

    // If confidence is too low, default to English
    if (confidence < 0.2) {
      return {
        language: 'en',
        confidence: 0.5,
        signals: ['Low confidence, defaulting to English']
      };
    }

    return {
      language: bestLang,
      confidence,
      signals: bestSignals
    };
  }

  /**
   * Score a language based on patterns
   */
  private scoreLanguage(
    text: string,
    patterns: any,
    scoreObj: { score: number; signals: string[] },
    langName: string
  ): void {
    // Check keywords
    if (patterns.keywords) {
      for (const keyword of patterns.keywords) {
        if (text.includes(keyword.toLowerCase())) {
          scoreObj.score += 1;
          scoreObj.signals.push(`${langName} keyword: ${keyword}`);
        }
      }
    }

    // Check regex patterns
    if (patterns.patterns) {
      for (const pattern of patterns.patterns) {
        if (pattern.test(text)) {
          scoreObj.score += 2;
          scoreObj.signals.push(`${langName} pattern matched`);
        }
      }
    }

    // Check special characters (Spanish)
    if (patterns.characters && patterns.characters.test(text)) {
      scoreObj.score += 3;
      scoreObj.signals.push(`${langName} special characters found`);
    }
  }

  /**
   * Route language with configuration override
   */
  routeLanguage(text: string, configLanguage: MessageLanguage = 'auto'): MessageLanguage {
    // If language is explicitly set, use it
    if (configLanguage !== 'auto') {
      return configLanguage;
    }

    // Auto-detect
    const detection = this.detectLanguage(text);
    return detection.language;
  }

  /**
   * Get all supported languages
   */
  getSupportedLanguages(): Array<{ code: MessageLanguage; name: string; nativeName: string }> {
    return [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'fil', name: 'Filipino', nativeName: 'Filipino/Tagalog' },
      { code: 'ceb', name: 'Cebuano', nativeName: 'Cebuano/Bisaya' },
      { code: 'es', name: 'Spanish', nativeName: 'Español' }
    ];
  }

  /**
   * Check if language is supported
   */
  isLanguageSupported(language: string): boolean {
    return ['en', 'fil', 'ceb', 'es', 'auto'].includes(language);
  }
}

// ========================================
// MULTI-LANGUAGE TEMPLATE SYSTEM
// ========================================

export interface MultiLanguageTemplate {
  en: string;
  fil?: string;
  ceb?: string;
  es?: string;
}

export class MultiLanguageTemplateEngine {
  /**
   * Get template in specified language with fallback
   */
  getTemplate(template: MultiLanguageTemplate, language: MessageLanguage): string {
    // Try requested language
    if (language !== 'auto' && template[language]) {
      return template[language]!;
    }

    // Fallback chain: fil -> ceb -> es -> en
    if (template.fil) return template.fil;
    if (template.ceb) return template.ceb;
    if (template.es) return template.es;
    return template.en;
  }

  /**
   * Fill template variables
   */
  fillTemplate(template: string, variables: Record<string, string>): string {
    let filled = template;
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      filled = filled.replace(placeholder, value);
    }
    return filled;
  }

  /**
   * Get template and fill variables
   */
  render(template: MultiLanguageTemplate, language: MessageLanguage, variables: Record<string, string> = {}): string {
    const text = this.getTemplate(template, language);
    return this.fillTemplate(text, variables);
  }
}

// ========================================
// PREDEFINED MULTI-LANGUAGE TEMPLATES
// ========================================

export const MULTI_LANGUAGE_TEMPLATES = {
  // Greetings
  greeting: {
    en: 'Hi! How can I help you today?',
    fil: 'Hello! Paano kita matutulungan ngayon?',
    ceb: 'Hello! Unsaon nako pagtabang nimo?',
    es: 'Hola! ¿Cómo puedo ayudarle hoy?'
  },

  // Discovery
  goalQuestion: {
    en: 'What goal are you trying to achieve right now?',
    fil: 'Ano ang goal mo na gusto mong makamit ngayon?',
    ceb: 'Unsa imong goal nga gusto nimong makab-ot karon?',
    es: '¿Cuál es su objetivo principal en este momento?'
  },

  // Objection handling
  objectionNoMoney: {
    en: 'I understand your concern. Many people felt the same at first, but after seeing the value and results, they realized it was worth it.',
    fil: 'Gets ko po yung concern mo. Marami rin ang ganyan nung una, pero pagkatapos makita yung value at results, na-realize nila na worth it.',
    ceb: 'Nakasabot ko sa imong concern. Daghan usab nga mura nimo sa una, pero human makita ang value ug results, na-realize nila nga worth it.',
    es: 'Entiendo su preocupación. Muchas personas sintieron lo mismo al principio, pero después de ver el valor y los resultados, se dieron cuenta de que valía la pena.'
  },

  objectionNoTime: {
    en: 'Totally fair. Just so I can guide you properly—what part do you want more clarity on?',
    fil: 'Gets ko yan. Para lang maayos kong i-guide ka—anong part ang gusto mong mas malaman?',
    ceb: 'Sige ra. Aron maayo kong ma-guide nimo—unsa nga part ang gusto nimong mas klaro?',
    es: 'Totalmente justo. Solo para poder guiarlo correctamente—¿qué parte desea aclarar?'
  },

  // Closing
  readyToStart: {
    en: 'Ready for the next step? I can help you activate your account now.',
    fil: 'Ready ka na ba sa next step? Tutulungan kita mag-activate ng account mo ngayon.',
    ceb: 'Andam na ka sa next step? Tabangan tika ug activate sa imong account karon.',
    es: '¿Listo para el siguiente paso? Puedo ayudarle a activar su cuenta ahora.'
  },

  // Follow-up
  checkingIn: {
    en: 'Hi again! Just checking—are you still interested?',
    fil: 'Hi ulit! Checking lang—interested ka pa ba?',
    ceb: 'Hi ug usab! Checking lang—interested ka pa ba?',
    es: 'Hola de nuevo! Solo verificando—¿todavía está interesado?'
  }
};

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Quick language detection (no class instantiation)
 */
export function detectLanguageFromText(text: string): MessageLanguage {
  const engine = new LanguageRouterEngine();
  const result = engine.detectLanguage(text);
  return result.language;
}

/**
 * Route language with config override
 */
export function routeLanguage(text: string, configLanguage: MessageLanguage = 'auto'): MessageLanguage {
  const engine = new LanguageRouterEngine();
  return engine.routeLanguage(text, configLanguage);
}

/**
 * Get multi-language template
 */
export function getMultiLanguageTemplate(
  templateKey: keyof typeof MULTI_LANGUAGE_TEMPLATES,
  language: MessageLanguage,
  variables: Record<string, string> = {}
): string {
  const templateEngine = new MultiLanguageTemplateEngine();
  const template = MULTI_LANGUAGE_TEMPLATES[templateKey];
  return templateEngine.render(template, language, variables);
}

// Export singleton instances
export const languageRouter = new LanguageRouterEngine();
export const multiLanguageTemplates = new MultiLanguageTemplateEngine();
