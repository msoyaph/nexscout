import { ParsedProspect } from './fbScreenshotParser';

const NAME_PATTERN = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g;

const BUSINESS_INTENT_KEYWORDS = [
  'business',
  'negosyo',
  'insurance',
  'sideline',
  'extra income',
  'raket',
  'online business',
  'homebased',
  'work from home',
  'wfh',
  'entrepreneur',
  'networking',
  'investment',
  'passive income',
];

const PERSONA_KEYWORDS = [
  'ofw',
  'nurse',
  'call center',
  'teacher',
  'engineer',
  'bpo',
  'student',
  'mom',
  'dad',
  'parent',
  'graduate',
  'jobseeker',
  'freelancer',
];

const PAIN_POINT_KEYWORDS = [
  'financial',
  'income',
  'budget',
  'save',
  'saving',
  'debt',
  'loan',
  'bills',
  'expenses',
  'struggling',
  'mahirap',
  'hirap',
  'gastos',
  'utang',
];

export interface ExtractedData {
  prospects: ParsedProspect[];
  keywords: {
    businessIntent: string[];
    personas: string[];
    painPoints: string[];
  };
  rawText: string;
}

export class TextExtractor {
  extractFromText(text: string): ExtractedData {
    console.log('[Text Extractor] Processing text, length:', text.length);

    const names = this.extractNames(text);
    const keywords = {
      businessIntent: this.extractKeywords(text, BUSINESS_INTENT_KEYWORDS),
      personas: this.extractKeywords(text, PERSONA_KEYWORDS),
      painPoints: this.extractKeywords(text, PAIN_POINT_KEYWORDS),
    };

    console.log('[Text Extractor] Found', names.length, 'names');
    console.log('[Text Extractor] Keywords:', keywords);

    const prospects: ParsedProspect[] = names.map(name => ({
      name,
      source: 'text_paste',
      rawText: this.extractContextAroundName(text, name),
      platform: 'unknown',
      metadata: {
        businessIntent: keywords.businessIntent.length > 0,
        detectedPersonas: keywords.personas,
        detectedPainPoints: keywords.painPoints,
      },
    }));

    return {
      prospects,
      keywords,
      rawText: text,
    };
  }

  private extractNames(text: string): string[] {
    const names = new Set<string>();
    const matches = text.match(NAME_PATTERN);

    if (matches) {
      matches.forEach(name => {
        const trimmed = name.trim();
        if (this.isValidName(trimmed)) {
          names.add(trimmed);
        }
      });
    }

    return Array.from(names);
  }

  private isValidName(name: string): boolean {
    if (name.length < 4) return false;

    const parts = name.split(' ');
    if (parts.length < 2) return false;

    const commonWords = [
      'The', 'Like', 'Comment', 'Share', 'See', 'View', 'Show', 'More',
      'Post', 'Photo', 'Video', 'Link', 'Page', 'Group', 'Event',
    ];

    if (commonWords.some(word => name.includes(word))) return false;

    return true;
  }

  private extractKeywords(text: string, keywords: string[]): string[] {
    const found: string[] = [];
    const lowerText = text.toLowerCase();

    keywords.forEach(keyword => {
      if (lowerText.includes(keyword.toLowerCase())) {
        found.push(keyword);
      }
    });

    return found;
  }

  private extractContextAroundName(text: string, name: string): string {
    const index = text.indexOf(name);
    if (index === -1) return '';

    const start = Math.max(0, index - 100);
    const end = Math.min(text.length, index + name.length + 100);

    return text.slice(start, end).trim();
  }
}

export const textExtractor = new TextExtractor();
