import { OCRResult } from './ocrEngine';

export interface ParsedProspect {
  name: string;
  mutualFriends?: number;
  source: string;
  rawText: string;
  platform: string;
  metadata?: Record<string, any>;
}

export interface FBParseResult {
  prospects: ParsedProspect[];
  layoutType: 'friends_list' | 'post' | 'comments' | 'profile' | 'timeline' | 'unknown';
  confidence: number;
}

const FRIENDS_LIST_INDICATORS = [
  'mutual friends',
  'friends',
  'Add Friend',
  'Message',
  'Following',
];

const POST_INDICATORS = [
  'hours ago',
  'minutes ago',
  'days ago',
  'Like',
  'Comment',
  'Share',
];

const PROFILE_INDICATORS = [
  'About',
  'Photos',
  'Videos',
  'Friends',
  'More',
];

export class FBScreenshotParser {
  parseScreenshot(ocrResult: OCRResult): FBParseResult {
    console.log('[FB Parser] Analyzing screenshot...');

    const layoutType = this.detectLayout(ocrResult);
    console.log('[FB Parser] Detected layout:', layoutType);

    let prospects: ParsedProspect[] = [];

    switch (layoutType) {
      case 'friends_list':
        prospects = this.parseFriendsList(ocrResult);
        break;
      case 'post':
        prospects = this.parsePost(ocrResult);
        break;
      case 'comments':
        prospects = this.parseComments(ocrResult);
        break;
      case 'profile':
        prospects = this.parseProfile(ocrResult);
        break;
      case 'timeline':
        prospects = this.parseTimeline(ocrResult);
        break;
      default:
        prospects = this.parseGeneric(ocrResult);
    }

    console.log('[FB Parser] Found', prospects.length, 'prospects');

    return {
      prospects,
      layoutType,
      confidence: ocrResult.confidence,
    };
  }

  private detectLayout(ocrResult: OCRResult): FBParseResult['layoutType'] {
    const text = ocrResult.rawText.toLowerCase();

    const friendsScore = FRIENDS_LIST_INDICATORS.reduce(
      (score, indicator) => score + (text.includes(indicator.toLowerCase()) ? 1 : 0),
      0
    );

    const postScore = POST_INDICATORS.reduce(
      (score, indicator) => score + (text.includes(indicator.toLowerCase()) ? 1 : 0),
      0
    );

    const profileScore = PROFILE_INDICATORS.reduce(
      (score, indicator) => score + (text.includes(indicator.toLowerCase()) ? 1 : 0),
      0
    );

    if (friendsScore >= 2) return 'friends_list';
    if (postScore >= 3) return 'post';
    if (profileScore >= 3) return 'profile';

    if (text.includes('comment')) return 'comments';
    if (text.includes('timeline') || text.includes('posts')) return 'timeline';

    return 'unknown';
  }

  private parseFriendsList(ocrResult: OCRResult): ParsedProspect[] {
    const prospects: ParsedProspect[] = [];
    const lines = ocrResult.lines;
    const mutualFriendsPattern = /(\d+)\s+mutual\s+friends?/gi;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      const names = ocrResult.detectedNames.filter(name =>
        line.includes(name)
      );

      if (names.length > 0) {
        const name = names[0];

        let mutualFriends: number | undefined;
        const nextLines = lines.slice(i, i + 3).join(' ');
        const mutualMatch = mutualFriendsPattern.exec(nextLines);
        if (mutualMatch) {
          mutualFriends = parseInt(mutualMatch[1], 10);
        }

        const existingProspect = prospects.find(p => p.name === name);
        if (!existingProspect) {
          prospects.push({
            name,
            mutualFriends,
            source: 'fb_screenshot',
            rawText: nextLines.slice(0, 200),
            platform: 'facebook',
            metadata: {
              layoutType: 'friends_list',
            },
          });
        }
      }
    }

    return prospects;
  }

  private parsePost(ocrResult: OCRResult): ParsedProspect[] {
    const prospects: ParsedProspect[] = [];
    const lines = ocrResult.lines;

    if (lines.length > 0) {
      const authorLine = lines[0];
      const names = ocrResult.detectedNames.filter(name =>
        authorLine.includes(name)
      );

      if (names.length > 0) {
        prospects.push({
          name: names[0],
          source: 'fb_screenshot',
          rawText: ocrResult.rawText.slice(0, 500),
          platform: 'facebook',
          metadata: {
            layoutType: 'post',
            postContent: lines.slice(1, 10).join(' '),
          },
        });
      }
    }

    return prospects;
  }

  private parseComments(ocrResult: OCRResult): ParsedProspect[] {
    const prospects: ParsedProspect[] = [];
    const names = ocrResult.detectedNames;

    names.forEach(name => {
      prospects.push({
        name,
        source: 'fb_screenshot',
        rawText: ocrResult.rawText.slice(0, 300),
        platform: 'facebook',
        metadata: {
          layoutType: 'comments',
        },
      });
    });

    return prospects;
  }

  private parseProfile(ocrResult: OCRResult): ParsedProspect[] {
    const prospects: ParsedProspect[] = [];
    const names = ocrResult.detectedNames;

    if (names.length > 0) {
      prospects.push({
        name: names[0],
        source: 'fb_screenshot',
        rawText: ocrResult.rawText.slice(0, 500),
        platform: 'facebook',
        metadata: {
          layoutType: 'profile',
        },
      });
    }

    return prospects;
  }

  private parseTimeline(ocrResult: OCRResult): ParsedProspect[] {
    return this.parseGeneric(ocrResult);
  }

  private parseGeneric(ocrResult: OCRResult): ParsedProspect[] {
    const prospects: ParsedProspect[] = [];
    const names = ocrResult.detectedNames;

    names.forEach(name => {
      prospects.push({
        name,
        source: 'fb_screenshot',
        rawText: ocrResult.rawText.slice(0, 200),
        platform: 'facebook',
        metadata: {
          layoutType: 'unknown',
        },
      });
    });

    return prospects;
  }
}

export const fbScreenshotParser = new FBScreenshotParser();
