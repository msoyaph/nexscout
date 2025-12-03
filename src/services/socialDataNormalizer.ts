import { supabase } from '../lib/supabase';

export type SocialPlatform = 'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'tiktok' | 'upload';
export type SourceType = 'screenshot' | 'export_file' | 'page_api' | 'browser_capture';

export interface RawSocialItem {
  name?: string;
  text?: string;
  mutualFriends?: number;
  comments?: string[];
  platform: SocialPlatform;
  timestamp?: string;
  engagement?: number;
  sourceType: SourceType;
  fileId?: string;
  metadata?: Record<string, any>;
}

export interface NormalizedSocialItem {
  scanId: string;
  type: string;
  name?: string;
  content?: string;
  score: number;
  metadata: Record<string, any>;
}

export class SocialDataNormalizer {
  static async normalizeAndStore(
    scanId: string,
    rawItems: RawSocialItem[]
  ): Promise<{ success: boolean; itemsStored: number }> {
    const normalizedItems: NormalizedSocialItem[] = [];

    for (const rawItem of rawItems) {
      const normalized = this.normalizeItem(scanId, rawItem);
      normalizedItems.push(normalized);
    }

    if (normalizedItems.length === 0) {
      return { success: true, itemsStored: 0 };
    }

    const { error } = await supabase
      .from('scan_processed_items')
      .insert(normalizedItems.map(item => ({
        scan_id: item.scanId,
        type: item.type,
        name: item.name,
        content: item.content,
        score: item.score,
        metadata: item.metadata,
      })));

    if (error) {
      console.error('Failed to store normalized items:', error);
      return { success: false, itemsStored: 0 };
    }

    return { success: true, itemsStored: normalizedItems.length };
  }

  private static normalizeItem(scanId: string, rawItem: RawSocialItem): NormalizedSocialItem {
    let type = 'text';
    let content = rawItem.text || '';

    if (rawItem.name && rawItem.mutualFriends !== undefined) {
      type = 'friend_list';
      content = `Friend with ${rawItem.mutualFriends} mutual connections`;
    } else if (rawItem.text) {
      type = 'post';
    } else if (rawItem.comments && rawItem.comments.length > 0) {
      type = 'comment';
      content = rawItem.comments.join('\n');
    }

    const baseScore = this.calculateBaseScore(rawItem);

    return {
      scanId,
      type,
      name: rawItem.name,
      content,
      score: baseScore,
      metadata: {
        platform: rawItem.platform,
        source_type: rawItem.sourceType,
        timestamp: rawItem.timestamp,
        engagement: rawItem.engagement,
        mutual_friends: rawItem.mutualFriends,
        file_id: rawItem.fileId,
        comments_count: rawItem.comments?.length || 0,
        ...rawItem.metadata,
      },
    };
  }

  private static calculateBaseScore(rawItem: RawSocialItem): number {
    let score = 40;

    if (rawItem.mutualFriends) {
      if (rawItem.mutualFriends > 50) score += 20;
      else if (rawItem.mutualFriends > 20) score += 15;
      else if (rawItem.mutualFriends > 10) score += 10;
    }

    if (rawItem.engagement) {
      if (rawItem.engagement > 1000) score += 15;
      else if (rawItem.engagement > 100) score += 10;
      else if (rawItem.engagement > 10) score += 5;
    }

    if (rawItem.comments && rawItem.comments.length > 0) {
      score += Math.min(rawItem.comments.length * 2, 15);
    }

    if (rawItem.sourceType === 'page_api') {
      score += 10;
    }

    return Math.min(score, 100);
  }

  static async normalizeUploadedScreenshots(
    scanId: string,
    ocrResults: any[]
  ): Promise<RawSocialItem[]> {
    const items: RawSocialItem[] = [];

    for (const ocrResult of ocrResults) {
      const lines = ocrResult.lines || [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        const nameMatch = line.match(/^([A-ZÀ-ÿ][a-zà-ÿ]+(?:\s+[A-ZÀ-ÿ][a-zà-ÿ]+)+)\s*$/);

        if (nameMatch) {
          let mutualFriends: number | undefined;

          if (i + 1 < lines.length) {
            const nextLine = lines[i + 1];
            const mutualMatch = nextLine.match(/(\d+)\s*mutual\s*friend/i);
            if (mutualMatch) {
              mutualFriends = parseInt(mutualMatch[1], 10);
            }
          }

          items.push({
            name: nameMatch[1],
            mutualFriends,
            platform: 'upload',
            sourceType: 'screenshot',
            fileId: ocrResult.fileId,
          });
        }
      }
    }

    return items;
  }

  static async normalizeExportedData(
    scanId: string,
    exportData: any,
    platform: SocialPlatform
  ): Promise<RawSocialItem[]> {
    const items: RawSocialItem[] = [];

    if (platform === 'facebook' && exportData.friends) {
      for (const friend of exportData.friends) {
        items.push({
          name: friend.name,
          platform: 'facebook',
          sourceType: 'export_file',
          timestamp: friend.timestamp,
        });
      }
    }

    if (platform === 'instagram' && exportData.followers) {
      for (const follower of exportData.followers) {
        items.push({
          name: follower.username,
          platform: 'instagram',
          sourceType: 'export_file',
        });
      }
    }

    if (platform === 'linkedin' && exportData.connections) {
      for (const connection of exportData.connections) {
        items.push({
          name: `${connection.firstName} ${connection.lastName}`,
          platform: 'linkedin',
          sourceType: 'export_file',
          metadata: {
            company: connection.company,
            position: connection.position,
          },
        });
      }
    }

    return items;
  }

  static async normalizePageData(
    scanId: string,
    pageData: any,
    platform: SocialPlatform
  ): Promise<RawSocialItem[]> {
    const items: RawSocialItem[] = [];

    if (pageData.posts) {
      for (const post of pageData.posts) {
        items.push({
          name: pageData.pageName || 'Page',
          text: post.message || post.caption,
          platform,
          sourceType: 'page_api',
          timestamp: post.created_time,
          engagement: (post.likes || 0) + (post.comments || 0) + (post.shares || 0),
          metadata: {
            post_id: post.id,
            likes: post.likes,
            comments: post.comments,
            shares: post.shares,
          },
        });

        if (post.commentsList) {
          items.push({
            text: post.commentsList.map((c: any) => c.message).join('\n'),
            platform,
            sourceType: 'page_api',
            comments: post.commentsList.map((c: any) => c.message),
            metadata: {
              post_id: post.id,
            },
          });
        }
      }
    }

    return items;
  }
}
