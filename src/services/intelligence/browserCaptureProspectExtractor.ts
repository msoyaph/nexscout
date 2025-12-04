export interface ExtractedProspect {
  fullName: string;
  inferredGender?: 'male' | 'female' | 'unknown';
  platformUsername?: string;
  platformUrl?: string;
  profileImageUrl?: string;
  mutualConnections?: number;
  sentimentSignals: string[];
  painPointSignals: string[];
  opportunitySignals: string[];
  businessKeywords: string[];
  timestamps?: string[];
  rawTextSnippet: string;
  confidence: number;
}

export interface BrowserProspectExtractionResult {
  success: boolean;
  platform: string;
  captureType: string;
  totalExtracted: number;
  prospects: ExtractedProspect[];
  diagnostics: {
    extractionMethod: string;
    htmlConfidence: number;
    textConfidence: number;
    processingTimeMs: number;
  };
}

export interface BrowserCaptureInput {
  textContent: string;
  htmlSnapshot: string;
  platform: string;
  captureType: string;
  tags?: string[];
  metadata?: any;
}

const PAIN_POINT_PATTERNS = [
  /hospital.*bill/i,
  /need.*money/i,
  /kailangan.*pera/i,
  /bills?.*due/i,
  /tuition.*fee/i,
  /rent.*overdue/i,
  /medical.*expenses?/i,
  /emergency.*fund/i,
  /utang/i,
  /naghahanap.*trabaho/i,
  /walang.*trabaho/i,
  /looking.*for.*job/i,
  /need.*extra.*income/i,
  /sideline/i,
];

const OPPORTUNITY_PATTERNS = [
  /open.*for.*business/i,
  /interested.*in/i,
  /pm.*me/i,
  /message.*me/i,
  /sino.*nag.*bibusiness/i,
  /looking.*for.*opportunity/i,
  /gusto.*mag.*business/i,
  /want.*to.*start/i,
  /insurance.*agent/i,
  /financial.*advisor/i,
  /entrepreneur/i,
  /business.*owner/i,
  /self.*employed/i,
];

const BUSINESS_KEYWORDS = [
  'insurance',
  'investment',
  'financial',
  'business',
  'entrepreneur',
  'sideline',
  'extra income',
  'passive income',
  'work from home',
  'online business',
  'negosyo',
  'raket',
  'MLM',
  'networking',
];

class BrowserCaptureProspectExtractor {
  async extractProspectsFromBrowserCapture(
    input: BrowserCaptureInput
  ): Promise<BrowserProspectExtractionResult> {
    const startTime = Date.now();
    const prospects: ExtractedProspect[] = [];

    try {
      switch (input.platform.toLowerCase()) {
        case 'facebook':
          prospects.push(...this.extractFacebookProspects(input));
          break;
        case 'instagram':
          prospects.push(...this.extractInstagramProspects(input));
          break;
        case 'linkedin':
          prospects.push(...this.extractLinkedInProspects(input));
          break;
        case 'twitter':
        case 'x':
          prospects.push(...this.extractTwitterProspects(input));
          break;
        case 'tiktok':
          prospects.push(...this.extractTikTokProspects(input));
          break;
        default:
          prospects.push(...this.extractGenericProspects(input));
      }

      const enrichedProspects = prospects.map((p) => this.enrichProspect(p, input));

      const processingTimeMs = Date.now() - startTime;

      return {
        success: true,
        platform: input.platform,
        captureType: input.captureType,
        totalExtracted: enrichedProspects.length,
        prospects: enrichedProspects,
        diagnostics: {
          extractionMethod: `${input.platform}_${input.captureType}`,
          htmlConfidence: input.htmlSnapshot ? 0.85 : 0.5,
          textConfidence: input.textContent ? 0.9 : 0.3,
          processingTimeMs,
        },
      };
    } catch (error) {
      console.error('Prospect extraction error:', error);
      return {
        success: false,
        platform: input.platform,
        captureType: input.captureType,
        totalExtracted: 0,
        prospects: [],
        diagnostics: {
          extractionMethod: 'error',
          htmlConfidence: 0,
          textConfidence: 0,
          processingTimeMs: Date.now() - startTime,
        },
      };
    }
  }

  private extractFacebookProspects(input: BrowserCaptureInput): ExtractedProspect[] {
    const prospects: ExtractedProspect[] = [];

    const nameMatches = input.textContent.match(/[A-Z][a-z]+ [A-Z][a-z]+/g) || [];
    const uniqueNames = [...new Set(nameMatches)];

    const urlMatches = input.htmlSnapshot.match(
      /facebook\.com\/(profile\.php\?id=\d+|[\w.]+)/g
    ) || [];

    const mutualFriendsPattern = /(\d+)\s+(mutual|common)\s+friends?/gi;
    const mutualMatches = [...input.textContent.matchAll(mutualFriendsPattern)];

    uniqueNames.forEach((name, index) => {
      const context = this.getContextAroundName(name, input.textContent);
      const mutualCount = mutualMatches[index]
        ? parseInt(mutualMatches[index][1], 10)
        : undefined;

      prospects.push({
        fullName: name,
        inferredGender: this.inferGender(name),
        platformUsername: this.extractUsername(urlMatches[index] || ''),
        platformUrl: urlMatches[index] || undefined,
        mutualConnections: mutualCount,
        sentimentSignals: this.extractSentimentSignals(context),
        painPointSignals: this.extractPainPoints(context),
        opportunitySignals: this.extractOpportunitySignals(context),
        businessKeywords: this.extractBusinessKeywords(context),
        rawTextSnippet: context.substring(0, 200),
        confidence: 0.75,
      });
    });

    return prospects;
  }

  private extractInstagramProspects(input: BrowserCaptureInput): ExtractedProspect[] {
    const prospects: ExtractedProspect[] = [];

    const usernamePattern = /@([\w.]+)/g;
    const usernames = [...input.textContent.matchAll(usernamePattern)];

    usernames.forEach((match) => {
      const username = match[1];
      const context = this.getContextAroundUsername(username, input.textContent);

      prospects.push({
        fullName: username,
        platformUsername: username,
        platformUrl: `https://instagram.com/${username}`,
        sentimentSignals: this.extractSentimentSignals(context),
        painPointSignals: this.extractPainPoints(context),
        opportunitySignals: this.extractOpportunitySignals(context),
        businessKeywords: this.extractBusinessKeywords(context),
        rawTextSnippet: context.substring(0, 200),
        confidence: 0.65,
      });
    });

    return prospects;
  }

  private extractLinkedInProspects(input: BrowserCaptureInput): ExtractedProspect[] {
    const prospects: ExtractedProspect[] = [];

    const nameMatches = input.textContent.match(/[A-Z][a-z]+ [A-Z][a-z]+/g) || [];
    const uniqueNames = [...new Set(nameMatches)];

    uniqueNames.forEach((name) => {
      const context = this.getContextAroundName(name, input.textContent);
      const hasOpenToWork = /open\s+to\s+work/i.test(context);
      const hasLookingFor = /looking\s+for\s+opportunit/i.test(context);

      prospects.push({
        fullName: name,
        inferredGender: this.inferGender(name),
        sentimentSignals: this.extractSentimentSignals(context),
        painPointSignals: this.extractPainPoints(context),
        opportunitySignals: [
          ...this.extractOpportunitySignals(context),
          ...(hasOpenToWork ? ['open_to_work'] : []),
          ...(hasLookingFor ? ['looking_for_opportunities'] : []),
        ],
        businessKeywords: this.extractBusinessKeywords(context),
        rawTextSnippet: context.substring(0, 200),
        confidence: 0.8,
      });
    });

    return prospects;
  }

  private extractTwitterProspects(input: BrowserCaptureInput): ExtractedProspect[] {
    const prospects: ExtractedProspect[] = [];

    const handlePattern = /@([\w]+)/g;
    const handles = [...input.textContent.matchAll(handlePattern)];

    handles.forEach((match) => {
      const handle = match[1];
      const context = this.getContextAroundUsername(handle, input.textContent);

      prospects.push({
        fullName: handle,
        platformUsername: handle,
        platformUrl: `https://twitter.com/${handle}`,
        sentimentSignals: this.extractSentimentSignals(context),
        painPointSignals: this.extractPainPoints(context),
        opportunitySignals: this.extractOpportunitySignals(context),
        businessKeywords: this.extractBusinessKeywords(context),
        rawTextSnippet: context.substring(0, 200),
        confidence: 0.7,
      });
    });

    return prospects;
  }

  private extractTikTokProspects(input: BrowserCaptureInput): ExtractedProspect[] {
    const prospects: ExtractedProspect[] = [];

    const usernamePattern = /@([\w.]+)/g;
    const usernames = [...input.textContent.matchAll(usernamePattern)];

    usernames.forEach((match) => {
      const username = match[1];
      const context = this.getContextAroundUsername(username, input.textContent);

      prospects.push({
        fullName: username,
        platformUsername: username,
        platformUrl: `https://tiktok.com/@${username}`,
        sentimentSignals: this.extractSentimentSignals(context),
        painPointSignals: this.extractPainPoints(context),
        opportunitySignals: this.extractOpportunitySignals(context),
        businessKeywords: this.extractBusinessKeywords(context),
        rawTextSnippet: context.substring(0, 200),
        confidence: 0.6,
      });
    });

    return prospects;
  }

  private extractGenericProspects(input: BrowserCaptureInput): ExtractedProspect[] {
    const prospects: ExtractedProspect[] = [];

    const nameMatches = input.textContent.match(/[A-Z][a-z]+ [A-Z][a-z]+/g) || [];
    const uniqueNames = [...new Set(nameMatches)];

    uniqueNames.slice(0, 50).forEach((name) => {
      const context = this.getContextAroundName(name, input.textContent);

      prospects.push({
        fullName: name,
        inferredGender: this.inferGender(name),
        sentimentSignals: this.extractSentimentSignals(context),
        painPointSignals: this.extractPainPoints(context),
        opportunitySignals: this.extractOpportunitySignals(context),
        businessKeywords: this.extractBusinessKeywords(context),
        rawTextSnippet: context.substring(0, 200),
        confidence: 0.5,
      });
    });

    return prospects;
  }

  private enrichProspect(prospect: ExtractedProspect, input: BrowserCaptureInput): ExtractedProspect {
    return {
      ...prospect,
      timestamps: [new Date().toISOString()],
    };
  }

  private getContextAroundName(name: string, text: string, window = 500): string {
    const index = text.indexOf(name);
    if (index === -1) return '';

    const start = Math.max(0, index - window / 2);
    const end = Math.min(text.length, index + name.length + window / 2);

    return text.substring(start, end);
  }

  private getContextAroundUsername(username: string, text: string, window = 500): string {
    const pattern = new RegExp(`@${username}`, 'i');
    const match = text.match(pattern);

    if (!match) return '';

    const index = match.index!;
    const start = Math.max(0, index - window / 2);
    const end = Math.min(text.length, index + username.length + window / 2);

    return text.substring(start, end);
  }

  private extractPainPoints(text: string): string[] {
    const painPoints: string[] = [];

    PAIN_POINT_PATTERNS.forEach((pattern) => {
      if (pattern.test(text)) {
        const match = text.match(pattern);
        if (match) {
          painPoints.push(match[0].toLowerCase().replace(/\s+/g, '_'));
        }
      }
    });

    return [...new Set(painPoints)];
  }

  private extractOpportunitySignals(text: string): string[] {
    const signals: string[] = [];

    OPPORTUNITY_PATTERNS.forEach((pattern) => {
      if (pattern.test(text)) {
        const match = text.match(pattern);
        if (match) {
          signals.push(match[0].toLowerCase().replace(/\s+/g, '_'));
        }
      }
    });

    return [...new Set(signals)];
  }

  private extractBusinessKeywords(text: string): string[] {
    const keywords: string[] = [];

    BUSINESS_KEYWORDS.forEach((keyword) => {
      if (new RegExp(keyword, 'i').test(text)) {
        keywords.push(keyword.toLowerCase().replace(/\s+/g, '_'));
      }
    });

    return [...new Set(keywords)];
  }

  private extractSentimentSignals(text: string): string[] {
    const signals: string[] = [];

    const emojiPatterns: Record<string, string> = {
      '😭': 'crying',
      '😡': 'angry',
      '🙏': 'praying',
      '😔': 'sad',
      '🔥': 'excited',
      '💰': 'money_focused',
      '💼': 'business_minded',
      '🎯': 'goal_oriented',
      '❤️': 'positive',
      '👍': 'supportive',
    };

    Object.entries(emojiPatterns).forEach(([emoji, signal]) => {
      if (text.includes(emoji)) {
        signals.push(signal);
      }
    });

    if (/help.*need/i.test(text)) signals.push('seeking_help');
    if (/thank/i.test(text)) signals.push('grateful');
    if (/excit/i.test(text)) signals.push('excited');
    if (/worr/i.test(text)) signals.push('worried');
    if (/stress/i.test(text)) signals.push('stressed');

    return [...new Set(signals)];
  }

  private extractUsername(url: string): string {
    const match = url.match(/facebook\.com\/([\w.]+)/);
    return match ? match[1] : '';
  }

  private inferGender(name: string): 'male' | 'female' | 'unknown' {
    const firstName = name.split(' ')[0].toLowerCase();

    const maleNames = ['john', 'mark', 'james', 'robert', 'michael', 'juan', 'jose'];
    const femaleNames = ['mary', 'maria', 'jennifer', 'jessica', 'sarah', 'ana'];

    if (maleNames.some((n) => firstName.includes(n))) return 'male';
    if (femaleNames.some((n) => firstName.includes(n))) return 'female';

    return 'unknown';
  }
}

export const browserCaptureProspectExtractor = new BrowserCaptureProspectExtractor();
