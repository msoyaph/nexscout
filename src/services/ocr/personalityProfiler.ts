export interface PersonalityProfile {
  communication_style: 'formal' | 'casual' | 'professional' | 'friendly';
  engagement_level: 'high' | 'medium' | 'low';
  decision_maker_signals: number;
  influencer_signals: number;
  personality_traits: string[];
  preferred_content_types: string[];
  activity_patterns: {
    post_frequency: 'high' | 'medium' | 'low';
    engagement_times: string[];
  };
}

export class PersonalityProfiler {
  private static readonly FORMAL_INDICATORS = [
    'regards', 'sincerely', 'professional', 'corporate', 'executive',
    'strategic', 'implementation', 'stakeholder', 'pursuant',
  ];

  private static readonly CASUAL_INDICATORS = [
    'hey', 'lol', 'yeah', 'cool', 'awesome', 'gonna', 'wanna',
    'btw', 'omg', 'haha', 'yay', 'nope',
  ];

  private static readonly DECISION_MAKER_SIGNALS = [
    'decided', 'implementing', 'launching', 'invested', 'approved',
    'signed', 'committed', 'acquired', 'hired', 'chose', 'selected',
    'budget', 'strategy', 'initiative', 'ceo', 'founder', 'director',
    'head of', 'vp', 'president', 'owner',
  ];

  private static readonly INFLUENCER_SIGNALS = [
    'sharing', 'check out', 'recommend', 'amazing', 'everyone should',
    'you should', 'highly suggest', 'must try', 'loved', 'favorite',
    'follower', 'community', 'audience', 'engagement', 'viral',
  ];

  private static readonly PERSONALITY_TRAITS_MAP = {
    'analytical': ['data', 'analysis', 'metrics', 'research', 'study', 'statistics', 'numbers'],
    'creative': ['design', 'creative', 'art', 'innovative', 'inspiration', 'imagine', 'vision'],
    'collaborative': ['team', 'together', 'collaboration', 'partnership', 'cooperation', 'group'],
    'results-driven': ['achieve', 'goal', 'success', 'win', 'accomplish', 'target', 'results'],
    'relationship-focused': ['relationship', 'connection', 'network', 'people', 'community', 'trust'],
    'innovative': ['innovation', 'new', 'cutting-edge', 'breakthrough', 'pioneer', 'disrupt'],
    'strategic': ['strategy', 'plan', 'vision', 'long-term', 'roadmap', 'strategic'],
    'detail-oriented': ['detail', 'precise', 'thorough', 'meticulous', 'careful', 'accuracy'],
  };

  static analyzePersonality(text: string, posts: Array<{ text: string; timestamp: string | null }>): PersonalityProfile {
    const lowerText = text.toLowerCase();

    const communication_style = this.determineCommunicationStyle(lowerText);
    const engagement_level = this.calculateEngagementLevel(posts);
    const decision_maker_signals = this.countSignals(lowerText, this.DECISION_MAKER_SIGNALS);
    const influencer_signals = this.countSignals(lowerText, this.INFLUENCER_SIGNALS);
    const personality_traits = this.identifyTraits(lowerText);
    const preferred_content_types = this.analyzeContentPreferences(posts);
    const activity_patterns = this.analyzeActivityPatterns(posts);

    return {
      communication_style,
      engagement_level,
      decision_maker_signals,
      influencer_signals,
      personality_traits,
      preferred_content_types,
      activity_patterns,
    };
  }

  private static determineCommunicationStyle(text: string): 'formal' | 'casual' | 'professional' | 'friendly' {
    const formalCount = this.countSignals(text, this.FORMAL_INDICATORS);
    const casualCount = this.countSignals(text, this.CASUAL_INDICATORS);

    if (formalCount > casualCount * 1.5) return 'formal';
    if (casualCount > formalCount * 1.5) return 'casual';
    if (formalCount > 0 && casualCount > 0) return 'friendly';
    return 'professional';
  }

  private static calculateEngagementLevel(posts: Array<{ text: string; timestamp: string | null }>): 'high' | 'medium' | 'low' {
    if (posts.length >= 10) return 'high';
    if (posts.length >= 5) return 'medium';
    return 'low';
  }

  private static countSignals(text: string, signals: string[]): number {
    return signals.filter(signal => text.includes(signal.toLowerCase())).length;
  }

  private static identifyTraits(text: string): string[] {
    const traits: string[] = [];

    for (const [trait, keywords] of Object.entries(this.PERSONALITY_TRAITS_MAP)) {
      const matches = keywords.filter(keyword => text.includes(keyword.toLowerCase()));
      if (matches.length >= 2) {
        traits.push(trait);
      }
    }

    return traits.slice(0, 5);
  }

  private static analyzeContentPreferences(posts: Array<{ text: string; timestamp: string | null }>): string[] {
    const contentTypes: string[] = [];
    const allText = posts.map(p => p.text.toLowerCase()).join(' ');

    if (allText.includes('video') || allText.includes('watch')) {
      contentTypes.push('video');
    }
    if (allText.includes('article') || allText.includes('read')) {
      contentTypes.push('articles');
    }
    if (allText.includes('photo') || allText.includes('image')) {
      contentTypes.push('images');
    }
    if (allText.includes('link') || allText.includes('http')) {
      contentTypes.push('links');
    }
    if (allText.includes('shared') || allText.includes('repost')) {
      contentTypes.push('shares');
    }

    return contentTypes.length > 0 ? contentTypes : ['text posts'];
  }

  private static analyzeActivityPatterns(posts: Array<{ text: string; timestamp: string | null }>): {
    post_frequency: 'high' | 'medium' | 'low';
    engagement_times: string[];
  } {
    const post_frequency = posts.length >= 10 ? 'high' : posts.length >= 5 ? 'medium' : 'low';

    const engagement_times: string[] = [];
    const timePatterns = posts.map(p => p.timestamp).filter(Boolean);

    if (timePatterns.some(t => t?.includes('hr') || t?.includes('hour'))) {
      engagement_times.push('recently active');
    }
    if (timePatterns.some(t => t?.includes('day'))) {
      engagement_times.push('daily poster');
    }
    if (timePatterns.some(t => t?.includes('week'))) {
      engagement_times.push('weekly poster');
    }

    return {
      post_frequency,
      engagement_times: engagement_times.length > 0 ? engagement_times : ['irregular posting'],
    };
  }

  static calculatePersonalityScore(profile: PersonalityProfile): number {
    let score = 50;

    if (profile.engagement_level === 'high') score += 20;
    else if (profile.engagement_level === 'medium') score += 10;

    score += Math.min(profile.decision_maker_signals * 5, 20);

    score += Math.min(profile.influencer_signals * 3, 15);

    score += profile.personality_traits.length * 2;

    if (profile.communication_style === 'professional' || profile.communication_style === 'formal') {
      score += 5;
    }

    return Math.min(Math.max(score, 0), 100);
  }
}
