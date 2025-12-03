import { supabase } from '../lib/supabase';
import { OcrFileResult } from './ocrEngineV2';

export type RecognizedFriend = {
  fullName: string;
  mutualFriends: number | null;
  fromFileId: string;
  rowIndex: number;
  confidence: number;
};

export type FriendsRecognitionResult = {
  scanId: string;
  friends: RecognizedFriend[];
  totalCandidates: number;
  avgConfidence: number;
};

export class FBFriendsRecognizer {
  private static readonly IGNORE_PATTERNS = [
    /sponsored/i,
    /suggested for you/i,
    /people you may know/i,
    /add friend/i,
    /message/i,
    /^friends$/i,
    /^mutual friends$/i,
    /see all/i,
    /show more/i,
  ];

  private static readonly NAME_PATTERN = /^([A-ZÀ-ÿ][a-zà-ÿ]+(?:\s+(?:de|dela|del|ng|san|von|van|der|De|Dela|Del|Jr|Sr|II|III)\s+)?(?:[A-ZÀ-ÿ][a-zà-ÿ]+)+)\s*$/;

  private static readonly MUTUAL_FRIENDS_PATTERN = /(\d+)\s*mutual\s*friend/i;

  private static readonly FRIENDS_LINE_PATTERN = /Friends\s*[·•]\s*(\d+)\s*mutual\s*friend/i;

  static async recognizeFriendsFromOcr(
    scanId: string,
    ocrResults: OcrFileResult[]
  ): Promise<FriendsRecognitionResult> {
    const allFriends: RecognizedFriend[] = [];
    let totalCandidates = 0;

    for (const ocrResult of ocrResults) {
      const friends = this.extractFriendsFromOcrResult(ocrResult);
      allFriends.push(...friends);
      totalCandidates += friends.length;
    }

    const deduplicatedFriends = this.deduplicateFriends(allFriends);

    const avgConfidence =
      deduplicatedFriends.length > 0
        ? deduplicatedFriends.reduce((sum, f) => sum + f.confidence, 0) / deduplicatedFriends.length
        : 0;

    await this.persistFriends(scanId, deduplicatedFriends);

    return {
      scanId,
      friends: deduplicatedFriends,
      totalCandidates,
      avgConfidence,
    };
  }

  private static extractFriendsFromOcrResult(ocrResult: OcrFileResult): RecognizedFriend[] {
    const friends: RecognizedFriend[] = [];
    const lines = ocrResult.lines;

    let i = 0;
    while (i < lines.length) {
      const line = lines[i].trim();

      if (this.shouldIgnoreLine(line)) {
        i++;
        continue;
      }

      const friendsLineMatch = line.match(this.FRIENDS_LINE_PATTERN);
      if (friendsLineMatch) {
        const mutualCount = parseInt(friendsLineMatch[1], 10);

        if (i > 0) {
          const prevLine = lines[i - 1].trim();
          const nameMatch = prevLine.match(this.NAME_PATTERN);

          if (nameMatch) {
            friends.push({
              fullName: this.cleanName(nameMatch[1]),
              mutualFriends: mutualCount,
              fromFileId: ocrResult.fileId,
              rowIndex: i - 1,
              confidence: ocrResult.confidence * 0.95,
            });
          }
        }

        i++;
        continue;
      }

      const nameMatch = line.match(this.NAME_PATTERN);

      if (nameMatch) {
        const candidateName = this.cleanName(nameMatch[1]);

        let mutualFriends: number | null = null;
        let confidence = ocrResult.confidence * 0.7;

        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();

          const mutualMatch = nextLine.match(this.MUTUAL_FRIENDS_PATTERN);
          if (mutualMatch) {
            mutualFriends = parseInt(mutualMatch[1], 10);
            confidence = ocrResult.confidence * 0.9;
            i++;
          }
        }

        if (i + 1 < lines.length && !mutualFriends) {
          const nextLine = lines[i + 1].trim();
          const nextNameMatch = nextLine.match(this.NAME_PATTERN);

          if (nextNameMatch && this.mightBeMultilineName(candidateName, nextLine)) {
            const fullName = `${candidateName} ${nextLine}`;
            i++;

            if (i + 1 < lines.length) {
              const thirdLine = lines[i + 1].trim();
              const mutualMatch = thirdLine.match(this.MUTUAL_FRIENDS_PATTERN);
              if (mutualMatch) {
                mutualFriends = parseInt(mutualMatch[1], 10);
                confidence = ocrResult.confidence * 0.85;
                i++;
              }
            }

            friends.push({
              fullName: this.cleanName(fullName),
              mutualFriends,
              fromFileId: ocrResult.fileId,
              rowIndex: i,
              confidence,
            });
            i++;
            continue;
          }
        }

        friends.push({
          fullName: candidateName,
          mutualFriends,
          fromFileId: ocrResult.fileId,
          rowIndex: i,
          confidence,
        });
      }

      i++;
    }

    return friends;
  }

  private static shouldIgnoreLine(line: string): boolean {
    if (line.length === 0) return true;

    for (const pattern of this.IGNORE_PATTERNS) {
      if (pattern.test(line)) return true;
    }

    return false;
  }

  private static mightBeMultilineName(firstName: string, secondLine: string): boolean {
    return secondLine.length < 30 && !secondLine.includes('mutual') && !secondLine.includes('friend');
  }

  private static cleanName(name: string): string {
    return name
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\u00C0-\u017F-]/g, '')
      .replace(/\s+(Jr|Sr|II|III|IV)$/i, ' $1');
  }

  private static deduplicateFriends(friends: RecognizedFriend[]): RecognizedFriend[] {
    const nameMap = new Map<string, RecognizedFriend>();

    for (const friend of friends) {
      const normalizedName = friend.fullName.toLowerCase().replace(/\s+/g, '');

      const existing = nameMap.get(normalizedName);

      if (!existing || friend.confidence > existing.confidence) {
        nameMap.set(normalizedName, friend);
      }
    }

    return Array.from(nameMap.values());
  }

  private static async persistFriends(
    scanId: string,
    friends: RecognizedFriend[]
  ): Promise<void> {
    if (friends.length === 0) return;

    const items = friends.map(friend => ({
      scan_id: scanId,
      type: 'friend_list',
      name: friend.fullName,
      content: `Friend with ${friend.mutualFriends || 0} mutual connections`,
      score: 0,
      metadata: {
        from_file_id: friend.fromFileId,
        row_index: friend.rowIndex,
        confidence: friend.confidence,
        mutual_friends: friend.mutualFriends,
      },
    }));

    const { error } = await supabase.from('scan_processed_items').insert(items);

    if (error) {
      console.error('Failed to persist friends:', error);
      throw error;
    }
  }
}
