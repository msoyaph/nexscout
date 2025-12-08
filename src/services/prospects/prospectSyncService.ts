/**
 * Prospect Sync Service
 * 
 * Centralized service to sync prospect data (name, email, phone) across:
 * - Chatbot Sessions (public_chat_sessions)
 * - Prospects (prospects table)
 * - Pipeline entries
 * - All related pages and components
 */

import { supabase } from '../../lib/supabase';

export interface ProspectSyncData {
  name?: string;
  email?: string;
  phone?: string;
}

export class ProspectSyncService {
  /**
   * Sync prospect data from session to prospect and vice versa
   * Updates both the session and the prospect record
   */
  async syncSessionToProspect(
    sessionId: string,
    prospectId: string | null,
    data: ProspectSyncData
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Update session first
      const sessionUpdate: any = {};
      if (data.name !== undefined) sessionUpdate.visitor_name = data.name || null;
      if (data.email !== undefined) sessionUpdate.visitor_email = data.email || null;
      if (data.phone !== undefined) sessionUpdate.visitor_phone = data.phone || null;

      if (Object.keys(sessionUpdate).length > 0) {
        const { error: sessionError } = await supabase
          .from('public_chat_sessions')
          .update(sessionUpdate)
          .eq('id', sessionId);

        if (sessionError) {
          console.error('[ProspectSync] Error updating session:', sessionError);
          return { success: false, error: sessionError.message };
        }
      }

      // If prospect exists, update it too
      if (prospectId) {
        const metadata = await this.getProspectMetadata(prospectId);
        const prospectUpdate: any = {};
        if (data.name !== undefined) prospectUpdate.full_name = data.name || null;
        if (data.email !== undefined) {
          prospectUpdate.email = data.email || null;
          prospectUpdate.metadata = {
            ...metadata,
            email: data.email || null
          };
        }
        if (data.phone !== undefined) {
          prospectUpdate.phone = data.phone || null;
          prospectUpdate.metadata = {
            ...metadata,
            phone: data.phone || null
          };
        }
        // If both email and phone are being updated, merge metadata properly
        if (data.email !== undefined && data.phone !== undefined) {
          prospectUpdate.metadata = {
            ...metadata,
            email: data.email || null,
            phone: data.phone || null
          };
        }

        if (Object.keys(prospectUpdate).length > 0) {
          const { error: prospectError } = await supabase
            .from('prospects')
            .update(prospectUpdate)
            .eq('id', prospectId);

          if (prospectError) {
            console.error('[ProspectSync] Error updating prospect:', prospectError);
            return { success: false, error: prospectError.message };
          }
        }
      }

      return { success: true };
    } catch (error: any) {
      console.error('[ProspectSync] Unexpected error:', error);
      return { success: false, error: error.message || 'Failed to sync data' };
    }
  }

  /**
   * Sync prospect data to all related sessions
   * When prospect is updated, update all their chat sessions
   */
  async syncProspectToSessions(
    prospectId: string,
    data: ProspectSyncData
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get prospect to find matching sessions
      const { data: prospect, error: prospectError } = await supabase
        .from('prospects')
        .select('user_id, full_name, email, phone')
        .eq('id', prospectId)
        .maybeSingle();

      if (prospectError || !prospect) {
        console.error('[ProspectSync] Error finding prospect:', prospectError);
        return { success: false, error: prospectError?.message || 'Prospect not found' };
      }

      // Build search conditions
      const conditions: string[] = [];
      if (data.name || prospect.full_name) {
        conditions.push(`visitor_name.eq.${data.name || prospect.full_name || ''}`);
      }
      if (data.email || prospect.email) {
        conditions.push(`visitor_email.eq.${data.email || prospect.email || ''}`);
      }
      if (data.phone || prospect.phone) {
        conditions.push(`visitor_phone.eq.${data.phone || prospect.phone || ''}`);
      }

      if (conditions.length === 0) {
        return { success: true }; // Nothing to sync
      }

      // Find all sessions for this prospect
      const { data: sessions, error: findError } = await supabase
        .from('public_chat_sessions')
        .select('id')
        .eq('user_id', prospect.user_id)
        .or(conditions.join(','));

      if (findError) {
        console.error('[ProspectSync] Error finding sessions:', findError);
        return { success: false, error: findError.message };
      }

      // Update all matching sessions
      if (sessions && sessions.length > 0) {
        const sessionUpdate: any = {};
        if (data.name !== undefined) sessionUpdate.visitor_name = data.name || null;
        if (data.email !== undefined) sessionUpdate.visitor_email = data.email || null;
        if (data.phone !== undefined) sessionUpdate.visitor_phone = data.phone || null;

        if (Object.keys(sessionUpdate).length > 0) {
          const sessionIds = sessions.map(s => s.id);
          const { error: updateError } = await supabase
            .from('public_chat_sessions')
            .update(sessionUpdate)
            .in('id', sessionIds);

          if (updateError) {
            console.error('[ProspectSync] Error updating sessions:', updateError);
            return { success: false, error: updateError.message };
          }
        }
      }

      return { success: true };
    } catch (error: any) {
      console.error('[ProspectSync] Unexpected error:', error);
      return { success: false, error: error.message || 'Failed to sync data' };
    }
  }

  /**
   * Helper: Get prospect metadata
   */
  private async getProspectMetadata(prospectId: string): Promise<any> {
    const { data } = await supabase
      .from('prospects')
      .select('metadata')
      .eq('id', prospectId)
      .maybeSingle();

    return data?.metadata || {};
  }
}

export const prospectSyncService = new ProspectSyncService();
