import { supabase } from '../lib/supabase';
import { BrowserParser } from './browserParser';

export type CaptureType = 'friends_list' | 'post' | 'comments' | 'messages' | 'profile' | 'custom';
export type Platform = 'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'tiktok' | 'unknown';

export interface BrowserCapturePayload {
  captureType: CaptureType;
  platform: Platform;
  sourceUrl: string;
  htmlSnapshot: string;
  textContent: string;
  metadata?: {
    screenshotId?: string;
    fileId?: string;
    notes?: string;
  };
}

export interface ParsedContact {
  fullName: string;
  username?: string;
  profileUrl?: string;
  mutualFriends?: number;
  platform: Platform;
}

export interface ParsedInteraction {
  contactName: string;
  interactionType: 'post' | 'comment' | 'reaction' | 'share' | 'tag';
  textContent: string;
  occurredAt?: Date;
}

export class BrowserCaptureIngestor {
  static async ingestCapture(payload: BrowserCapturePayload): Promise<{ success: boolean; contactsAdded: number; interactionsAdded: number }> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const captureEvent = await this.storeCaptureEvent(user.id, payload);

    const parsed = await this.parseBrowserCapture(payload);

    const contactsAdded = await this.upsertContacts(user.id, parsed.contacts, payload.platform);

    const interactionsAdded = await this.storeInteractions(user.id, parsed.interactions, payload.platform);

    if (payload.captureType === 'friends_list') {
      await this.createSocialEdges(user.id, parsed.contacts, payload.platform);
    }

    await supabase
      .from('browser_capture_events')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('id', captureEvent.id);

    return { success: true, contactsAdded, interactionsAdded };
  }

  private static async storeCaptureEvent(userId: string, payload: BrowserCapturePayload): Promise<any> {
    const { data, error } = await supabase
      .from('browser_capture_events')
      .insert({
        user_id: userId,
        capture_type: payload.captureType,
        source_url: payload.sourceUrl,
        html_snapshot: payload.htmlSnapshot,
        text_content: payload.textContent,
        platform_guess: payload.platform,
        processed: false,
        metadata: payload.metadata || {},
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  private static async parseBrowserCapture(payload: BrowserCapturePayload): Promise<{
    contacts: ParsedContact[];
    interactions: ParsedInteraction[];
  }> {
    const contacts: ParsedContact[] = [];
    const interactions: ParsedInteraction[] = [];

    if (payload.captureType === 'friends_list') {
      const parsedFriends = BrowserParser.parseFriendsList(payload.textContent);
      contacts.push(
        ...parsedFriends.map(f => ({
          fullName: f.name,
          mutualFriends: f.mutualFriends,
          platform: payload.platform,
        }))
      );
    }

    if (payload.captureType === 'post') {
      const parsedPost = BrowserParser.parsePost(payload.textContent);

      if (parsedPost.authorName) {
        contacts.push({
          fullName: parsedPost.authorName,
          platform: payload.platform,
        });

        interactions.push({
          contactName: parsedPost.authorName,
          interactionType: 'post',
          textContent: parsedPost.postText,
          occurredAt: new Date(),
        });
      }

      if (parsedPost.comments) {
        for (const comment of parsedPost.comments) {
          contacts.push({
            fullName: comment.commenterName,
            platform: payload.platform,
          });

          interactions.push({
            contactName: comment.commenterName,
            interactionType: 'comment',
            textContent: comment.commentText,
            occurredAt: new Date(),
          });
        }
      }
    }

    if (payload.captureType === 'comments') {
      const parsedComments = BrowserParser.parseComments(payload.textContent);

      for (const comment of parsedComments) {
        contacts.push({
          fullName: comment.commenterName,
          platform: payload.platform,
        });

        interactions.push({
          contactName: comment.commenterName,
          interactionType: 'comment',
          textContent: comment.commentText,
          occurredAt: new Date(),
        });
      }
    }

    if (payload.captureType === 'profile') {
      const parsedProfile = BrowserParser.parseProfile(payload.textContent);

      if (parsedProfile.name) {
        contacts.push({
          fullName: parsedProfile.name,
          platform: payload.platform,
        });
      }
    }

    return { contacts, interactions };
  }

  static async processEvent(eventId: string): Promise<{ success: boolean; contactsAdded: number; interactionsAdded: number }> {
    const { data: event, error } = await supabase
      .from('browser_capture_events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (error || !event) {
      throw new Error('Event not found');
    }

    if (event.processed) {
      return { success: true, contactsAdded: 0, interactionsAdded: 0 };
    }

    const payload: BrowserCapturePayload = {
      captureType: event.capture_type as CaptureType,
      platform: event.platform as Platform,
      sourceUrl: event.source_url,
      htmlSnapshot: event.html_snapshot,
      textContent: event.text_content,
      metadata: event.metadata,
    };

    const parsed = await this.parseBrowserCapture(payload);

    const contactsAdded = await this.upsertContacts(event.user_id, parsed.contacts, payload.platform);

    const interactionsAdded = await this.storeInteractions(event.user_id, parsed.interactions, payload.platform);

    if (payload.captureType === 'friends_list') {
      await this.createSocialEdges(event.user_id, parsed.contacts, payload.platform);
    }

    await supabase
      .from('browser_capture_events')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('id', eventId);

    return { success: true, contactsAdded, interactionsAdded };
  }

  static async processAllUnprocessed(userId: string): Promise<{ eventsProcessed: number; totalContacts: number; totalInteractions: number }> {
    const { data: events } = await supabase
      .from('browser_capture_events')
      .select('id')
      .eq('user_id', userId)
      .eq('processed', false)
      .order('created_at', { ascending: true });

    if (!events || events.length === 0) {
      return { eventsProcessed: 0, totalContacts: 0, totalInteractions: 0 };
    }

    let totalContacts = 0;
    let totalInteractions = 0;

    for (const event of events) {
      try {
        const result = await this.processEvent(event.id);
        totalContacts += result.contactsAdded;
        totalInteractions += result.interactionsAdded;
      } catch (error) {
        console.error(`Failed to process event ${event.id}:`, error);
      }
    }

    return { eventsProcessed: events.length, totalContacts, totalInteractions };
  }

  private static async upsertContacts(
    userId: string,
    contacts: ParsedContact[],
    platform: Platform
  ): Promise<number> {
    if (contacts.length === 0) return 0;

    let addedCount = 0;

    for (const contact of contacts) {
      const { data: existing } = await supabase
        .from('social_contacts')
        .select('id, source_types, last_seen_at')
        .eq('user_id', userId)
        .eq('full_name', contact.fullName)
        .eq('platform', platform)
        .maybeSingle();

      if (existing) {
        const updatedSourceTypes = Array.from(new Set([...(existing.source_types || []), 'browser_capture']));

        await supabase
          .from('social_contacts')
          .update({
            last_seen_at: new Date().toISOString(),
            source_types: updatedSourceTypes,
            mutual_friends_estimate: contact.mutualFriends || existing.mutual_friends_estimate,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        await supabase.from('social_contacts').insert({
          user_id: userId,
          platform,
          full_name: contact.fullName,
          username: contact.username,
          profile_url: contact.profileUrl,
          mutual_friends_estimate: contact.mutualFriends,
          source_types: ['browser_capture'],
          first_seen_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString(),
        });

        addedCount++;
      }
    }

    return addedCount;
  }

  private static async storeInteractions(
    userId: string,
    interactions: ParsedInteraction[],
    platform: Platform
  ): Promise<number> {
    if (interactions.length === 0) return 0;

    let addedCount = 0;

    for (const interaction of interactions) {
      const { data: contact } = await supabase
        .from('social_contacts')
        .select('id')
        .eq('user_id', userId)
        .eq('full_name', interaction.contactName)
        .maybeSingle();

      if (contact) {
        await supabase.from('social_interactions').insert({
          user_id: userId,
          contact_id: contact.id,
          platform,
          interaction_type: interaction.interactionType,
          text_content: interaction.textContent,
          occurred_at: interaction.occurredAt?.toISOString() || new Date().toISOString(),
          engagement_score: this.calculateEngagementScore(interaction.interactionType),
        });

        await supabase
          .from('social_contacts')
          .update({ last_interaction_at: new Date().toISOString() })
          .eq('id', contact.id);

        addedCount++;
      }
    }

    return addedCount;
  }

  private static async createSocialEdges(
    userId: string,
    contacts: ParsedContact[],
    platform: Platform
  ): Promise<void> {
    const { data: userContact } = await supabase
      .from('social_contacts')
      .select('id')
      .eq('user_id', userId)
      .eq('contact_type', 'person')
      .limit(1)
      .maybeSingle();

    if (!userContact) return;

    for (const contact of contacts) {
      const { data: toContact } = await supabase
        .from('social_contacts')
        .select('id')
        .eq('user_id', userId)
        .eq('full_name', contact.fullName)
        .eq('platform', platform)
        .maybeSingle();

      if (toContact) {
        const { data: existingEdge } = await supabase
          .from('social_edges')
          .select('id')
          .eq('user_id', userId)
          .eq('from_contact_id', userContact.id)
          .eq('to_contact_id', toContact.id)
          .maybeSingle();

        if (!existingEdge) {
          await supabase.from('social_edges').insert({
            user_id: userId,
            from_contact_id: userContact.id,
            to_contact_id: toContact.id,
            relationship_type: 'friend',
            platform,
            weight: contact.mutualFriends ? Math.min(contact.mutualFriends / 100, 1.0) : 0.5,
          });
        }
      }
    }
  }

  private static normalizeName(name: string): string {
    return name
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\u00C0-\u017F-]/g, '');
  }

  private static calculateEngagementScore(interactionType: string): number {
    const scores: Record<string, number> = {
      comment: 10,
      share: 8,
      reaction: 5,
      post: 7,
      tag: 6,
    };

    return scores[interactionType] || 3;
  }

  static detectPlatformFromUrl(url: string): Platform {
    if (url.includes('facebook.com')) return 'facebook';
    if (url.includes('instagram.com')) return 'instagram';
    if (url.includes('linkedin.com')) return 'linkedin';
    if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
    if (url.includes('tiktok.com')) return 'tiktok';
    return 'unknown';
  }
}
