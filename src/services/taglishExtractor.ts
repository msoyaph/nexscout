export interface TaglishAnalysis {
  language_mix: {
    filipino_percentage: number;
    english_percentage: number;
    taglish_score: number;
  };
  filipino_keywords: {
    business: string[];
    lifestyle: string[];
    emotions: string[];
    locations: string[];
    relationships: string[];
  };
  buying_intent_phrases: string[];
  cultural_signals: string[];
  communication_style: 'pure_filipino' | 'taglish' | 'pure_english' | 'mixed';
}

export class TaglishExtractor {
  private static readonly FILIPINO_BUSINESS_KEYWORDS = [
    'negosyo', 'sideline', 'sidebiz', 'kita', 'kumita', 'kikita',
    'kikitain', 'kitain', 'benta', 'bentahan', 'tinda', 'tindahan',
    'puhunan', 'capital', 'invest', 'investor', 'business',
    'partner', 'kasosyo', 'kapareha', 'kumpanya', 'opisina',
    'suweldo', 'sahod', 'bayad', 'presyo', 'halaga',
    'diskwento', 'sale', 'promo', 'libre', 'free',
    'networking', 'mlm', 'direct selling', 'online selling',
    'reseller', 'supplier', 'distributor', 'dealer',
    'pera', 'yaman', 'milyonaryo', 'milyon', 'libo',
    'income', 'kita', 'profit', 'tubo', 'balik',
    'franchise', 'branch', 'sangay', 'open na', 'grand opening',
  ];

  private static readonly FILIPINO_LIFESTYLE_KEYWORDS = [
    'bahay', 'condo', 'lupa', 'ari-arian', 'property',
    'kotse', 'sasakyan', 'motor', 'travel', 'lakad',
    'gala', 'vacation', 'pasyal', 'shopping', 'bili',
    'mamili', 'mall', 'foods', 'kain', 'kumain',
    'inom', 'inuman', 'party', 'celebrate', 'saya',
    'salo-salo', 'samahan', 'barkada', 'tropa', 'kaibigan',
    'pamilya', 'family', 'anak', 'asawa', 'misis', 'mister',
    'lovelife', 'jowa', 'syota', 'boyfriend', 'girlfriend',
    'wedding', 'kasal', 'debut', 'birthday', 'kaarawan',
  ];

  private static readonly FILIPINO_EMOTION_KEYWORDS = [
    'masaya', 'saya', 'happy', 'blessed', 'grateful',
    'salamat', 'thank you', 'thanks', 'appreciated',
    'malungkot', 'sad', 'down', 'lungkot', 'iyak',
    'galit', 'inis', 'badtrip', 'nakakainis', 'nakakagalit',
    'excited', 'sabik', 'sabaw', 'motivated', 'inspired',
    'pagod', 'tired', 'stressed', 'burnout', 'hirap',
    'takot', 'kaba', 'nervous', 'worried', 'alala',
    'proud', 'ipagmalaki', 'achievement', 'success', 'tagumpay',
    'love', 'mahal', 'pag-ibig', 'care', 'malasakit',
  ];

  private static readonly FILIPINO_LOCATIONS = [
    'manila', 'quezon city', 'makati', 'taguig', 'bgc',
    'ortigas', 'pasig', 'mandaluyong', 'pasay', 'paranaque',
    'las pinas', 'muntinlupa', 'alabang', 'cavite', 'laguna',
    'bulacan', 'pampanga', 'batangas', 'rizal', 'antipolo',
    'cebu', 'davao', 'iloilo', 'bacolod', 'baguio',
    'tagaytay', 'boracay', 'palawan', 'siargao', 'bohol',
    'metro manila', 'ncr', 'luzon', 'visayas', 'mindanao',
  ];

  private static readonly FILIPINO_RELATIONSHIP_KEYWORDS = [
    'kapatid', 'kuya', 'ate', 'bunso', 'panganay',
    'magulang', 'nanay', 'tatay', 'mama', 'papa',
    'lolo', 'lola', 'apo', 'pamangkin', 'pinsan',
    'tito', 'tita', 'ninong', 'ninang', 'inaanak',
    'kapitbahay', 'kaklase', 'kabatch', 'schoolmate',
    'officemate', 'workmate', 'kasama', 'ka-team',
  ];

  private static readonly BUYING_INTENT_PHRASES = [
    'gusto ko bumili', 'bibili ako', 'paano mag-order',
    'magkano', 'how much', 'presyo', 'may available',
    'meron ba', 'pwede ba', 'interested ako',
    'gusto ko', 'saan makakabili', 'paano makakuha',
    'looking for', 'hanap', 'hinahanap', 'need ko',
    'kailangan ko', 'bibili na', 'order na',
    'saan pwede', 'may alam ba kayo', 'may kilala',
    'recommend', 'paki-recommend', 'suggest naman',
  ];

  private static readonly CULTURAL_SIGNALS = [
    'po', 'opo', 'ho', 'oho',
    'kasi', 'kase', 'eh', 'diba', 'di ba',
    'naman', 'nga', 'lang', 'pa', 'na',
    'talaga', 'totoo', 'true', 'oo', 'yes',
    'hindi', 'no', 'nope', 'ayaw', 'wag',
    'sige', 'go', 'tara', 'sama', 'halika',
    'kumusta', 'kamusta', 'musta', 'how are you',
    'salamat', 'thanks', 'thank you', 'appreciated',
  ];

  static analyze(text: string): TaglishAnalysis {
    const lowerText = text.toLowerCase();

    const filipino_keywords = {
      business: this.extractMatches(lowerText, this.FILIPINO_BUSINESS_KEYWORDS),
      lifestyle: this.extractMatches(lowerText, this.FILIPINO_LIFESTYLE_KEYWORDS),
      emotions: this.extractMatches(lowerText, this.FILIPINO_EMOTION_KEYWORDS),
      locations: this.extractMatches(lowerText, this.FILIPINO_LOCATIONS),
      relationships: this.extractMatches(lowerText, this.FILIPINO_RELATIONSHIP_KEYWORDS),
    };

    const buying_intent_phrases = this.extractMatches(lowerText, this.BUYING_INTENT_PHRASES);
    const cultural_signals = this.extractMatches(lowerText, this.CULTURAL_SIGNALS);

    const language_mix = this.analyzeLanguageMix(
      lowerText,
      filipino_keywords,
      cultural_signals
    );

    const communication_style = this.determineCommunicationStyle(language_mix);

    return {
      language_mix,
      filipino_keywords,
      buying_intent_phrases,
      cultural_signals,
      communication_style,
    };
  }

  private static extractMatches(text: string, keywords: string[]): string[] {
    const matches: string[] = [];

    for (const keyword of keywords) {
      const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedKeyword}\\b`, 'i');

      if (regex.test(text)) {
        matches.push(keyword);
      }
    }

    return matches;
  }

  private static analyzeLanguageMix(
    text: string,
    filipino_keywords: any,
    cultural_signals: string[]
  ): {
    filipino_percentage: number;
    english_percentage: number;
    taglish_score: number;
  } {
    const words = text.split(/\s+/).filter(w => w.length > 2);
    const totalWords = words.length;

    if (totalWords === 0) {
      return {
        filipino_percentage: 0,
        english_percentage: 0,
        taglish_score: 0,
      };
    }

    const totalFilipinoMatches =
      Object.values(filipino_keywords).flat().length + cultural_signals.length;

    const filipino_percentage = Math.min(
      100,
      (totalFilipinoMatches / totalWords) * 100 * 3
    );

    const english_percentage = Math.max(0, 100 - filipino_percentage);

    const taglish_score =
      filipino_percentage > 20 && filipino_percentage < 80
        ? Math.min(100, filipino_percentage + english_percentage / 2)
        : 0;

    return {
      filipino_percentage: Math.round(filipino_percentage),
      english_percentage: Math.round(english_percentage),
      taglish_score: Math.round(taglish_score),
    };
  }

  private static determineCommunicationStyle(language_mix: {
    filipino_percentage: number;
    english_percentage: number;
    taglish_score: number;
  }): 'pure_filipino' | 'taglish' | 'pure_english' | 'mixed' {
    if (language_mix.taglish_score > 50) {
      return 'taglish';
    }

    if (language_mix.filipino_percentage > 70) {
      return 'pure_filipino';
    }

    if (language_mix.english_percentage > 70) {
      return 'pure_english';
    }

    return 'mixed';
  }

  static detectBusinessOpportunity(analysis: TaglishAnalysis): {
    has_business_interest: boolean;
    confidence_score: number;
    indicators: string[];
  } {
    const indicators: string[] = [];
    let score = 0;

    if (analysis.filipino_keywords.business.length > 0) {
      indicators.push('Filipino business keywords detected');
      score += analysis.filipino_keywords.business.length * 10;
    }

    if (analysis.buying_intent_phrases.length > 0) {
      indicators.push('Buying intent phrases found');
      score += analysis.buying_intent_phrases.length * 15;
    }

    const hasBusinessLocation = analysis.filipino_keywords.locations.some(loc =>
      ['manila', 'makati', 'bgc', 'ortigas', 'cebu', 'davao'].includes(loc.toLowerCase())
    );

    if (hasBusinessLocation) {
      indicators.push('Located in business hub');
      score += 10;
    }

    const confidence_score = Math.min(100, score);

    return {
      has_business_interest: confidence_score > 30,
      confidence_score,
      indicators,
    };
  }

  static generateLocalizedMessage(analysis: TaglishAnalysis): {
    greeting: string;
    approach: string;
    tone: string;
  } {
    let greeting = '';
    let approach = '';
    let tone = '';

    switch (analysis.communication_style) {
      case 'pure_filipino':
        greeting = 'Kumusta po!';
        approach = 'formal_respectful';
        tone = 'Use Filipino language with respectful tone (po/ho)';
        break;

      case 'taglish':
        greeting = 'Hi! Kumusta?';
        approach = 'casual_friendly';
        tone = 'Mix Filipino and English naturally';
        break;

      case 'pure_english':
        greeting = 'Hi there!';
        approach = 'professional';
        tone = 'Use English with professional tone';
        break;

      default:
        greeting = 'Hello!';
        approach = 'neutral';
        tone = 'Adapt based on response';
    }

    return { greeting, approach, tone };
  }
}
