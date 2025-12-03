export interface ParsedFriend {
  name: string;
  mutualFriends?: number;
  additionalInfo?: string;
}

export interface ParsedPost {
  authorName?: string;
  postText: string;
  timestamp?: string;
  reactions?: number;
  comments?: ParsedComment[];
}

export interface ParsedComment {
  commenterName: string;
  commentText: string;
  timestamp?: string;
}

export interface ParsedProfile {
  name: string;
  bio?: string;
  headline?: string;
  location?: string;
  additionalInfo?: string;
}

export class BrowserParser {
  static parseFriendsList(text: string): ParsedFriend[] {
    const friends: ParsedFriend[] = [];
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      const namePattern = /^([A-ZÀ-ÿ][a-zà-ÿ]+(?:\s+(?:de|dela|del|ng|san|von|van|der|De|Dela|Del|Jr|Sr|II|III|IV)\s+)?(?:[A-ZÀ-ÿ][a-zà-ÿ]+)+)\s*$/;
      const nameMatch = line.match(namePattern);

      if (nameMatch) {
        const name = this.normalizeName(nameMatch[1]);
        let mutualFriends: number | undefined;
        let additionalInfo: string | undefined;

        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1];

          const mutualMatch = nextLine.match(/(\d+)\s*mutual\s*friend/i);
          if (mutualMatch) {
            mutualFriends = parseInt(mutualMatch[1], 10);
            i++;
          } else if (!nextLine.match(namePattern)) {
            additionalInfo = nextLine;
            i++;
          }
        }

        friends.push({
          name,
          mutualFriends,
          additionalInfo,
        });
      }
    }

    return friends;
  }

  static parsePost(text: string): ParsedPost {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    let authorName: string | undefined;
    let postText = '';
    let timestamp: string | undefined;
    let reactions: number | undefined;

    if (lines.length > 0) {
      const firstLine = lines[0];
      const nameMatch = firstLine.match(/^([A-ZÀ-ÿ][a-zà-ÿ]+(?:\s+[A-ZÀ-ÿ][a-zà-ÿ]+)+)/);
      if (nameMatch) {
        authorName = this.normalizeName(nameMatch[1]);
      }
    }

    const timePatterns = [
      /(\d+)\s*(min|mins|minute|minutes|hour|hours|hrs|hr|day|days|week|weeks)\s*ago/i,
      /Just\s*now/i,
      /Yesterday/i,
      /\d{1,2}:\d{2}\s*(AM|PM)/i,
    ];

    let postStartIndex = 1;

    for (let i = 0; i < Math.min(lines.length, 5); i++) {
      const line = lines[i];

      for (const pattern of timePatterns) {
        if (pattern.test(line)) {
          timestamp = line;
          postStartIndex = i + 1;
          break;
        }
      }

      if (timestamp) break;
    }

    postText = lines.slice(postStartIndex).join('\n').trim();

    const reactionsMatch = postText.match(/(\d+)\s*(like|reaction|comment)/i);
    if (reactionsMatch) {
      reactions = parseInt(reactionsMatch[1], 10);
    }

    return {
      authorName,
      postText,
      timestamp,
      reactions,
    };
  }

  static parseComments(text: string): ParsedComment[] {
    const comments: ParsedComment[] = [];
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    let currentCommenter: string | undefined;
    let currentCommentText = '';
    let currentTimestamp: string | undefined;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      const nameMatch = line.match(/^([A-ZÀ-ÿ][a-zà-ÿ]+(?:\s+[A-ZÀ-ÿ][a-zà-ÿ]+)+)\s*$/);

      if (nameMatch) {
        if (currentCommenter && currentCommentText) {
          comments.push({
            commenterName: currentCommenter,
            commentText: currentCommentText.trim(),
            timestamp: currentTimestamp,
          });
        }

        currentCommenter = this.normalizeName(nameMatch[1]);
        currentCommentText = '';
        currentTimestamp = undefined;
        continue;
      }

      const timeMatch = line.match(/(\d+)\s*(min|mins|hour|hours|day|days|week|weeks)\s*ago/i);
      if (timeMatch && currentCommenter) {
        currentTimestamp = line;
        continue;
      }

      if (currentCommenter) {
        currentCommentText += (currentCommentText ? ' ' : '') + line;
      }
    }

    if (currentCommenter && currentCommentText) {
      comments.push({
        commenterName: currentCommenter,
        commentText: currentCommentText.trim(),
        timestamp: currentTimestamp,
      });
    }

    return comments;
  }

  static parseProfile(text: string): ParsedProfile {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    let name = '';
    let bio: string | undefined;
    let headline: string | undefined;
    let location: string | undefined;
    let additionalInfo: string | undefined;

    if (lines.length > 0) {
      const firstLine = lines[0];
      const nameMatch = firstLine.match(/^([A-ZÀ-ÿ][a-zà-ÿ]+(?:\s+[A-ZÀ-ÿ][a-zà-ÿ]+)+)/);
      if (nameMatch) {
        name = this.normalizeName(nameMatch[1]);
      }
    }

    const locationPattern = /(?:lives?\s+in|from|located\s+in)\s+([A-ZÀ-ÿ][a-zà-ÿ]+(?:\s+[A-ZÀ-ÿ][a-zà-ÿ]+)*)/i;
    const headlinePattern = /(?:works?\s+at|ceo|founder|manager|director)\s+(.+)/i;

    for (const line of lines.slice(1)) {
      const locationMatch = line.match(locationPattern);
      if (locationMatch && !location) {
        location = locationMatch[1];
        continue;
      }

      const headlineMatch = line.match(headlinePattern);
      if (headlineMatch && !headline) {
        headline = headlineMatch[0];
        continue;
      }

      if (!bio && line.length > 20 && line.length < 200) {
        bio = line;
      }
    }

    additionalInfo = lines.slice(1).join(' ').substring(0, 500);

    return {
      name,
      bio,
      headline,
      location,
      additionalInfo,
    };
  }

  private static normalizeName(name: string): string {
    return name
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\u00C0-\u017F-]/g, '')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  static extractMutualFriends(text: string): number | null {
    const match = text.match(/(\d+)\s*mutual\s*friend/i);
    return match ? parseInt(match[1], 10) : null;
  }

  static detectPlatform(url: string): 'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'tiktok' | 'unknown' {
    if (url.includes('facebook.com') || url.includes('fb.com')) return 'facebook';
    if (url.includes('instagram.com')) return 'instagram';
    if (url.includes('linkedin.com')) return 'linkedin';
    if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
    if (url.includes('tiktok.com')) return 'tiktok';
    return 'unknown';
  }
}
