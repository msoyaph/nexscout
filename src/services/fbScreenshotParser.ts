import { OCRResult } from './ocrEngine';

export interface ParsedFacebookData {
  detected_names: string[];
  friends_list: Array<{
    name: string;
    mutual_friends: number | null;
    additional_info?: string;
  }>;
  posts: Array<{
    author: string | null;
    text: string;
    timestamp: string | null;
    reactions?: number;
    comments?: number;
    shares?: number;
  }>;
  comments: Array<{
    author: string;
    text: string;
    timestamp: string | null;
  }>;
  interests_keywords: string[];
  business_signals: string[];
}

export class FBScreenshotParser {
  private static readonly FRIEND_LIST_PATTERN = /^([A-ZÀ-ÿ][a-zà-ÿ]+(?:\s+(?:de|dela|del|ng|san|ng|von|van|der|De|Dela|Del)\s+)?(?:[A-ZÀ-ÿ][a-zà-ÿ]+)+)\s*$/;

  private static readonly MUTUAL_FRIENDS_PATTERN = /(\d+)\s*mutual\s*friend/i;

  private static readonly TIMESTAMP_PATTERNS = [
    /(\d+)\s*(hr|hour|hrs|hours)\s*ago/i,
    /(\d+)\s*(min|minute|mins|minutes)\s*ago/i,
    /(\d+)\s*(day|days)\s*ago/i,
    /(\d+)\s*(week|weeks)\s*ago/i,
    /(\d+)\s*(month|months)\s*ago/i,
    /(yesterday|today|just now)/i,
    /\d{1,2}\/\d{1,2}\/\d{2,4}/,
    /\w+\s+\d{1,2},?\s+\d{4}/,
  ];

  private static readonly POST_INDICATORS = [
    'posted',
    'shared',
    'updated',
    'added',
    'commented',
    'reacted',
  ];

  private static readonly REACTION_PATTERN = /(\d+(?:\.\d+)?[kKmM]?)\s*(reaction|like|comment|share)/i;

  private static readonly COMMENT_PATTERN = /^([A-ZÀ-ÿ][a-zà-ÿ]+(?:\s+[A-ZÀ-ÿ][a-zà-ÿ]+)*)\s*[·•]\s*(.+)/;

  private static readonly INTEREST_KEYWORDS = [
    'interested in',
    'passion for',
    'love',
    'enjoy',
    'hobbies',
    'favorite',
  ];

  private static readonly BUSINESS_SIGNALS = [
    'entrepreneur',
    'business owner',
    'ceo',
    'founder',
    'co-founder',
    'director',
    'manager',
    'startup',
    'company',
    'corporation',
    'enterprise',
    'looking for',
    'hiring',
    'investment',
    'partnership',
    'opportunity',
  ];

  static parse(ocrResult: OCRResult): ParsedFacebookData {
    const lines = ocrResult.lines;
    const rawText = ocrResult.raw_text.toLowerCase();

    const friends_list = this.extractFriendsList(lines);
    const posts = this.extractPosts(lines, ocrResult.blocks);
    const comments = this.extractComments(lines);
    const detected_names = this.extractAllNames(lines, friends_list, posts, comments);
    const interests_keywords = this.extractInterests(rawText);
    const business_signals = this.extractBusinessSignals(rawText);

    return {
      detected_names,
      friends_list,
      posts,
      comments,
      interests_keywords,
      business_signals,
    };
  }

  private static extractFriendsList(lines: string[]): Array<{
    name: string;
    mutual_friends: number | null;
    additional_info?: string;
  }> {
    const friends: Array<{ name: string; mutual_friends: number | null; additional_info?: string }> = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i].trim();

      const nameMatch = line.match(this.FRIEND_LIST_PATTERN);

      if (nameMatch) {
        const name = this.cleanName(nameMatch[1]);
        let mutual_friends: number | null = null;
        let additional_info: string | undefined;

        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          const mutualMatch = nextLine.match(this.MUTUAL_FRIENDS_PATTERN);

          if (mutualMatch) {
            mutual_friends = parseInt(mutualMatch[1], 10);
            i++;
          }
        }

        if (i + 1 < lines.length) {
          const infoLine = lines[i + 1].trim();
          if (
            !this.MUTUAL_FRIENDS_PATTERN.test(infoLine) &&
            !this.FRIEND_LIST_PATTERN.test(infoLine) &&
            infoLine.length > 0 &&
            infoLine.length < 100
          ) {
            additional_info = infoLine;
            i++;
          }
        }

        friends.push({ name, mutual_friends, additional_info });
      }

      i++;
    }

    return friends;
  }

  private static extractPosts(lines: string[], blocks: string[]): Array<{
    author: string | null;
    text: string;
    timestamp: string | null;
    reactions?: number;
    comments?: number;
    shares?: number;
  }> {
    const posts: Array<{
      author: string | null;
      text: string;
      timestamp: string | null;
      reactions?: number;
      comments?: number;
      shares?: number;
    }> = [];

    for (const block of blocks) {
      const blockLines = block.split('\n').filter(l => l.trim());

      if (blockLines.length === 0) continue;

      let author: string | null = null;
      let timestamp: string | null = null;
      let postText = '';
      let reactions: number | undefined;
      let comments: number | undefined;
      let shares: number | undefined;

      for (let i = 0; i < blockLines.length; i++) {
        const line = blockLines[i].trim();

        const nameMatch = line.match(this.FRIEND_LIST_PATTERN);
        if (nameMatch && i === 0) {
          author = this.cleanName(nameMatch[1]);
          continue;
        }

        const timestampMatch = this.extractTimestamp(line);
        if (timestampMatch && !timestamp) {
          timestamp = timestampMatch;
          continue;
        }

        const postIndicator = this.POST_INDICATORS.some(indicator =>
          line.toLowerCase().includes(indicator)
        );
        if (postIndicator && i < 3) {
          continue;
        }

        const reactionMatch = line.match(this.REACTION_PATTERN);
        if (reactionMatch) {
          const value = this.parseNumber(reactionMatch[1]);
          const type = reactionMatch[2].toLowerCase();

          if (type.includes('reaction') || type.includes('like')) {
            reactions = value;
          } else if (type.includes('comment')) {
            comments = value;
          } else if (type.includes('share')) {
            shares = value;
          }
          continue;
        }

        if (line.toLowerCase().includes('see more')) {
          continue;
        }

        if (line.toLowerCase().match(/^(like|comment|share)\s*[·•]?\s*(like|comment|share)/)) {
          continue;
        }

        postText += line + ' ';
      }

      postText = postText.trim();

      if (postText.length > 10) {
        posts.push({
          author,
          text: postText,
          timestamp,
          reactions,
          comments,
          shares,
        });
      }
    }

    return posts;
  }

  private static extractComments(lines: string[]): Array<{
    author: string;
    text: string;
    timestamp: string | null;
  }> {
    const comments: Array<{ author: string; text: string; timestamp: string | null }> = [];

    for (const line of lines) {
      const match = line.match(this.COMMENT_PATTERN);

      if (match) {
        const author = this.cleanName(match[1]);
        let text = match[2].trim();
        let timestamp: string | null = null;

        const timestampMatch = this.extractTimestamp(text);
        if (timestampMatch) {
          timestamp = timestampMatch;
          text = text.replace(timestampMatch, '').trim();
        }

        if (text.length > 0) {
          comments.push({ author, text, timestamp });
        }
      }
    }

    return comments;
  }

  private static extractAllNames(
    lines: string[],
    friends: any[],
    posts: any[],
    comments: any[]
  ): string[] {
    const names = new Set<string>();

    friends.forEach(f => names.add(f.name));

    posts.forEach(p => {
      if (p.author) names.add(p.author);
    });

    comments.forEach(c => names.add(c.author));

    for (const line of lines) {
      const nameMatch = line.match(this.FRIEND_LIST_PATTERN);
      if (nameMatch) {
        names.add(this.cleanName(nameMatch[1]));
      }
    }

    return Array.from(names);
  }

  private static extractInterests(text: string): string[] {
    const interests: string[] = [];

    for (const keyword of this.INTEREST_KEYWORDS) {
      const regex = new RegExp(`${keyword}:?\\s*([^\\n\\.]+)`, 'i');
      const match = text.match(regex);

      if (match) {
        const interestText = match[1].trim();
        const items = interestText.split(/,|and|\||&/).map(i => i.trim());
        interests.push(...items.filter(i => i.length > 0));
      }
    }

    return [...new Set(interests)];
  }

  private static extractBusinessSignals(text: string): string[] {
    const signals: string[] = [];

    for (const signal of this.BUSINESS_SIGNALS) {
      if (text.includes(signal)) {
        signals.push(signal);
      }
    }

    return signals;
  }

  private static extractTimestamp(text: string): string | null {
    for (const pattern of this.TIMESTAMP_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        return match[0];
      }
    }
    return null;
  }

  private static cleanName(name: string): string {
    return name
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\u00C0-\u017F-]/g, '');
  }

  private static parseNumber(str: string): number {
    const lower = str.toLowerCase();

    if (lower.includes('k')) {
      return parseFloat(lower.replace('k', '')) * 1000;
    }
    if (lower.includes('m')) {
      return parseFloat(lower.replace('m', '')) * 1000000;
    }

    return parseInt(str.replace(/[^\d]/g, ''), 10) || 0;
  }
}
