export interface EnrichedData {
  topics: string[];
  interests: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  keywords: string[];
  entities: {
    people: string[];
    organizations: string[];
    locations: string[];
  };
  industry_signals: string[];
  buying_signals: string[];
}

export class NLPEnrichment {
  private static readonly TOPIC_KEYWORDS = {
    technology: ['tech', 'software', 'ai', 'data', 'cloud', 'digital', 'innovation', 'app', 'platform'],
    business: ['business', 'startup', 'entrepreneur', 'company', 'revenue', 'growth', 'market', 'sales'],
    marketing: ['marketing', 'brand', 'campaign', 'content', 'social media', 'seo', 'advertising'],
    finance: ['finance', 'investment', 'funding', 'capital', 'investor', 'money', 'budget', 'financial'],
    leadership: ['leadership', 'management', 'team', 'culture', 'vision', 'strategy', 'executive'],
    healthcare: ['health', 'medical', 'wellness', 'patient', 'clinic', 'hospital', 'healthcare'],
    education: ['education', 'learning', 'training', 'teaching', 'student', 'course', 'university'],
    ecommerce: ['ecommerce', 'online store', 'shop', 'retail', 'product', 'shipping', 'checkout'],
  };

  private static readonly INTEREST_KEYWORDS = {
    'artificial intelligence': ['ai', 'machine learning', 'neural network', 'deep learning', 'automation'],
    'social media': ['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'social'],
    'entrepreneurship': ['startup', 'founder', 'entrepreneur', 'business owner', 'venture'],
    'digital marketing': ['seo', 'sem', 'content marketing', 'email marketing', 'ads', 'campaign'],
    'sales': ['sales', 'selling', 'prospect', 'pipeline', 'deal', 'close', 'negotiation'],
    'productivity': ['productivity', 'efficiency', 'workflow', 'automation', 'time management'],
    'real estate': ['real estate', 'property', 'house', 'apartment', 'realtor', 'listing'],
    'fitness': ['fitness', 'gym', 'workout', 'exercise', 'health', 'training'],
  };

  private static readonly BUYING_SIGNALS = [
    'looking for',
    'need help with',
    'interested in',
    'considering',
    'evaluating',
    'budget for',
    'planning to',
    'searching for',
    'in the market for',
    'recommendations for',
    'best solution',
    'switching from',
    'upgrade',
    'improve',
    'struggling with',
    'challenge',
    'problem',
  ];

  private static readonly POSITIVE_WORDS = [
    'excited', 'amazing', 'great', 'excellent', 'wonderful', 'fantastic', 'love',
    'happy', 'successful', 'achieved', 'proud', 'thrilled', 'delighted',
  ];

  private static readonly NEGATIVE_WORDS = [
    'disappointed', 'frustrated', 'problem', 'issue', 'difficult', 'struggle',
    'failed', 'bad', 'terrible', 'awful', 'hate', 'angry', 'upset',
  ];

  static enrichText(text: string): EnrichedData {
    const lowerText = text.toLowerCase();

    const topics = this.detectTopics(lowerText);
    const interests = this.detectInterests(lowerText);
    const sentiment = this.analyzeSentiment(lowerText);
    const keywords = this.extractKeywords(text);
    const entities = this.extractEntities(text);
    const industry_signals = this.detectIndustrySignals(lowerText);
    const buying_signals = this.detectBuyingSignals(lowerText);

    return {
      topics,
      interests,
      sentiment,
      keywords,
      entities,
      industry_signals,
      buying_signals,
    };
  }

  private static detectTopics(text: string): string[] {
    const topics: string[] = [];

    for (const [topic, keywords] of Object.entries(this.TOPIC_KEYWORDS)) {
      const matches = keywords.filter(keyword => text.includes(keyword));
      if (matches.length >= 2) {
        topics.push(topic);
      }
    }

    return topics;
  }

  private static detectInterests(text: string): string[] {
    const interests: string[] = [];

    for (const [interest, keywords] of Object.entries(this.INTEREST_KEYWORDS)) {
      const matches = keywords.filter(keyword => text.includes(keyword));
      if (matches.length >= 1) {
        interests.push(interest);
      }
    }

    return interests;
  }

  private static analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
    let positiveCount = 0;
    let negativeCount = 0;

    this.POSITIVE_WORDS.forEach(word => {
      if (text.includes(word)) positiveCount++;
    });

    this.NEGATIVE_WORDS.forEach(word => {
      if (text.includes(word)) negativeCount++;
    });

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private static extractKeywords(text: string): string[] {
    const words = text.toLowerCase().split(/\s+/);
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is', 'was', 'are', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should']);

    const wordFreq = new Map<string, number>();

    words.forEach(word => {
      const cleaned = word.replace(/[^a-z]/g, '');
      if (cleaned.length > 3 && !stopWords.has(cleaned)) {
        wordFreq.set(cleaned, (wordFreq.get(cleaned) || 0) + 1);
      }
    });

    return Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  private static extractEntities(text: string): {
    people: string[];
    organizations: string[];
    locations: string[];
  } {
    const namePattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g;
    const people = [...new Set(text.match(namePattern) || [])];

    const orgPattern = /\b[A-Z][a-z]+(?:\s+(?:Inc|Corp|LLC|Ltd|Company|Group|Technologies|Solutions))\.?\b/g;
    const organizations = [...new Set(text.match(orgPattern) || [])];

    const locationPattern = /\b(?:New York|San Francisco|Los Angeles|Chicago|Boston|Seattle|Austin|Miami|Manila|Cebu|Davao|Singapore|Tokyo|London|Paris)\b/g;
    const locations = [...new Set(text.match(locationPattern) || [])];

    return { people, organizations, locations };
  }

  private static detectIndustrySignals(text: string): string[] {
    const signals: string[] = [];

    if (text.includes('saas') || text.includes('software as a service')) {
      signals.push('SaaS');
    }
    if (text.includes('b2b') || text.includes('business to business')) {
      signals.push('B2B');
    }
    if (text.includes('b2c') || text.includes('business to consumer')) {
      signals.push('B2C');
    }
    if (text.includes('fintech') || text.includes('financial technology')) {
      signals.push('FinTech');
    }
    if (text.includes('edtech') || text.includes('education technology')) {
      signals.push('EdTech');
    }
    if (text.includes('healthtech') || text.includes('health technology')) {
      signals.push('HealthTech');
    }

    return signals;
  }

  private static detectBuyingSignals(text: string): string[] {
    const signals: string[] = [];

    this.BUYING_SIGNALS.forEach(signal => {
      if (text.includes(signal)) {
        signals.push(signal);
      }
    });

    return signals;
  }

  static enrichMultipleTexts(texts: string[]): EnrichedData {
    const allEnriched = texts.map(text => this.enrichText(text));

    return {
      topics: [...new Set(allEnriched.flatMap(e => e.topics))],
      interests: [...new Set(allEnriched.flatMap(e => e.interests))],
      sentiment: this.aggregateSentiment(allEnriched.map(e => e.sentiment)),
      keywords: [...new Set(allEnriched.flatMap(e => e.keywords))].slice(0, 20),
      entities: {
        people: [...new Set(allEnriched.flatMap(e => e.entities.people))],
        organizations: [...new Set(allEnriched.flatMap(e => e.entities.organizations))],
        locations: [...new Set(allEnriched.flatMap(e => e.entities.locations))],
      },
      industry_signals: [...new Set(allEnriched.flatMap(e => e.industry_signals))],
      buying_signals: [...new Set(allEnriched.flatMap(e => e.buying_signals))],
    };
  }

  private static aggregateSentiment(sentiments: Array<'positive' | 'neutral' | 'negative'>): 'positive' | 'neutral' | 'negative' {
    const counts = { positive: 0, neutral: 0, negative: 0 };
    sentiments.forEach(s => counts[s]++);

    if (counts.positive > counts.negative && counts.positive > counts.neutral) return 'positive';
    if (counts.negative > counts.positive && counts.negative > counts.neutral) return 'negative';
    return 'neutral';
  }
}
