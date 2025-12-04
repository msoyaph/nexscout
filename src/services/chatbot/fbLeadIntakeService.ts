/**
 * Facebook Lead Ads Intake Service
 *
 * Processes incoming FB lead ads webhooks and automatically:
 * 1. Captures raw lead data
 * 2. Maps FB fields to prospect fields
 * 3. Creates prospect
 * 4. Triggers Deep Scan Lite
 * 5. Adds to pipeline
 * 6. Notifies user
 * 7. Starts AI follow-up
 */

import { supabase } from '../../lib/supabase';

export interface RawLeadPayload {
  id: string; // fb_lead_id
  created_time: string;
  field_data: { name: string; values: string[] }[];
  ad_id?: string;
  adset_id?: string;
  campaign_id?: string;
  form_id?: string;
  page_id?: string;
}

export class FbLeadIntakeService {
  /**
   * Main entry point: Handle incoming FB lead
   */
  static async handleIncomingLead(payload: RawLeadPayload): Promise<void> {
    console.log('[FB Lead Intake] Processing lead:', payload.id);

    try {
      // 1. Find lead source
      const leadSource = await this.findLeadSource(payload.form_id);
      if (!leadSource) {
        console.warn('[FB Lead Intake] No lead source found for form:', payload.form_id);
        return;
      }

      // 2. Save raw payload
      const rawLeadId = await this.saveRawLead(leadSource.id, payload);

      // 3. Map fields
      const normalized = await this.mapFields(leadSource.id, payload);

      // 4. Create prospect
      const prospectId = await this.createProspect(leadSource.user_id, normalized, payload);

      // 5. Link lead to prospect
      await this.linkLeadToProspect(payload.id, prospectId, payload);

      // 6. Mark raw lead as processed
      await this.markProcessed(rawLeadId, prospectId);

      // 7. Trigger deep scan if enabled
      if (leadSource.auto_deep_scan_enabled) {
        await this.triggerDeepScan(leadSource.user_id, prospectId);
      }

      // 8. Start AI follow-up if enabled
      if (leadSource.auto_followup_enabled) {
        await this.startFollowUp(leadSource.user_id, prospectId);
      }

      // 9. Notify user
      await this.notifyUser(leadSource.user_id, prospectId, normalized);

      // 10. Award coins/energy
      await this.awardRewards(leadSource.user_id);

      console.log('[FB Lead Intake] Successfully processed lead:', payload.id);
    } catch (error: any) {
      console.error('[FB Lead Intake] Error processing lead:', error);
      throw error;
    }
  }

  /**
   * Find lead source by form ID
   */
  private static async findLeadSource(formId?: string): Promise<any | null> {
    if (!formId) return null;

    const { data, error } = await supabase
      .from('lead_sources')
      .select('*')
      .eq('provider', 'facebook')
      .eq('form_id', formId)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('[FB Lead Intake] Error finding lead source:', error);
      return null;
    }

    return data;
  }

  /**
   * Save raw lead payload
   */
  private static async saveRawLead(leadSourceId: string, payload: RawLeadPayload): Promise<string> {
    const { data, error } = await supabase
      .from('fb_leads_raw')
      .insert({
        lead_source_id: leadSourceId,
        fb_lead_id: payload.id,
        page_id: payload.page_id,
        ad_id: payload.ad_id,
        adset_id: payload.adset_id,
        campaign_id: payload.campaign_id,
        form_id: payload.form_id,
        raw_payload: payload,
        field_data: payload.field_data,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[FB Lead Intake] Error saving raw lead:', error);
      throw error;
    }

    return data.id;
  }

  /**
   * Map FB fields to prospect fields using saved mappings
   */
  private static async mapFields(leadSourceId: string, payload: RawLeadPayload): Promise<any> {
    // Get field mappings
    const { data: mappings } = await supabase
      .from('lead_field_mappings')
      .select('fb_field_name, prospect_field_name, transform_function')
      .eq('lead_source_id', leadSourceId);

    const map: Record<string, string> = {};
    const transforms: Record<string, string> = {};

    for (const m of mappings || []) {
      map[m.fb_field_name] = m.prospect_field_name;
      if (m.transform_function) {
        transforms[m.fb_field_name] = m.transform_function;
      }
    }

    // Build normalized prospect data
    const normalized: any = {
      source: 'facebook_lead_ad',
      source_id: payload.id,
      tags: ['fb_lead_form'],
      custom_fields: {},
    };

    for (const field of payload.field_data) {
      let value = field.values?.[0] ?? '';
      const fieldName = field.name;
      const mapped = map[fieldName];

      if (!mapped) continue;

      // Apply transform
      const transform = transforms[fieldName];
      if (transform) {
        value = this.applyTransform(value, transform);
      }

      // Map to prospect field
      switch (mapped) {
        case 'full_name':
          normalized.name = value;
          break;
        case 'first_name':
          normalized.first_name = value;
          break;
        case 'last_name':
          normalized.last_name = value;
          break;
        case 'email':
          normalized.email = value;
          break;
        case 'phone':
          normalized.phone = value;
          break;
        case 'city':
          normalized.city = value;
          break;
        case 'company':
          normalized.company = value;
          break;
        case 'job_title':
          normalized.job_title = value;
          break;
        case 'notes':
          normalized.notes = value;
          break;
        case 'tags':
          normalized.tags.push(value);
          break;
        default:
          // Custom field
          if (mapped.startsWith('custom_')) {
            normalized.custom_fields[mapped] = value;
          }
      }
    }

    // Add campaign metadata
    normalized.campaign_data = {
      ad_id: payload.ad_id,
      adset_id: payload.adset_id,
      campaign_id: payload.campaign_id,
      form_id: payload.form_id,
    };

    return normalized;
  }

  /**
   * Apply field transform
   */
  private static applyTransform(value: string, transform: string): string {
    switch (transform) {
      case 'uppercase':
        return value.toUpperCase();
      case 'lowercase':
        return value.toLowerCase();
      case 'trim':
        return value.trim();
      case 'split_name':
        // Split "Juan Dela Cruz" into first/last
        const parts = value.trim().split(' ');
        return parts[0]; // Return first name (caller should handle last name separately)
      default:
        return value;
    }
  }

  /**
   * Create prospect
   */
  private static async createProspect(
    userId: string,
    normalized: any,
    payload: RawLeadPayload
  ): Promise<string> {
    const { data, error } = await supabase
      .from('prospects')
      .insert({
        user_id: userId,
        name: normalized.name || normalized.first_name || 'FB Lead',
        email: normalized.email,
        phone: normalized.phone,
        city: normalized.city,
        company: normalized.company,
        job_title: normalized.job_title,
        source: 'facebook_lead_ad',
        source_id: payload.id,
        pipeline_stage: 'inquiry',
        status: 'new',
        tags: normalized.tags,
        scout_score: 60, // FB leads are pre-qualified
        notes: normalized.notes,
        metadata: {
          campaign_data: normalized.campaign_data,
          custom_fields: normalized.custom_fields,
        },
      })
      .select('id')
      .single();

    if (error) {
      console.error('[FB Lead Intake] Error creating prospect:', error);
      throw error;
    }

    return data.id;
  }

  /**
   * Link FB lead to prospect
   */
  private static async linkLeadToProspect(
    fbLeadId: string,
    prospectId: string,
    payload: RawLeadPayload
  ): Promise<void> {
    await supabase.from('lead_prospect_links').insert({
      fb_lead_id: fbLeadId,
      prospect_id: prospectId,
      source_channel: 'facebook_lead_ad',
      campaign_id: payload.campaign_id,
      ad_id: payload.ad_id,
      adset_id: payload.adset_id,
    });
  }

  /**
   * Mark raw lead as processed
   */
  private static async markProcessed(rawLeadId: string, prospectId: string): Promise<void> {
    await supabase
      .from('fb_leads_raw')
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
        prospect_id: prospectId,
      })
      .eq('id', rawLeadId);
  }

  /**
   * Trigger deep scan (lite mode for leads)
   */
  private static async triggerDeepScan(userId: string, prospectId: string): Promise<void> {
    // TODO: Wire to actual deep scan queue
    console.log('[FB Lead Intake] Triggering deep scan for prospect:', prospectId);

    // For now, just log
    // await deepScanQueue.enqueue({
    //   userId,
    //   prospectId,
    //   intensity: 'lite',
    //   trigger: 'facebook_lead',
    // });
  }

  /**
   * Start AI follow-up sequence
   */
  private static async startFollowUp(userId: string, prospectId: string): Promise<void> {
    // TODO: Wire to actual follow-up sequencer
    console.log('[FB Lead Intake] Starting follow-up for prospect:', prospectId);

    // For now, just log
    // await followUpSequencer.start({
    //   userId,
    //   prospectId,
    //   sequence: 'lead_warmup_7day',
    // });
  }

  /**
   * Notify user about new lead
   */
  private static async notifyUser(userId: string, prospectId: string, normalized: any): Promise<void> {
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'new_fb_lead',
      title: 'New FB Lead Captured! 🎯',
      message: `${normalized.name || 'Bagong lead'} from Facebook Lead Ad`,
      metadata: {
        prospect_id: prospectId,
        source: 'facebook_lead_ad',
      },
      is_read: false,
    });
  }

  /**
   * Award rewards for capturing lead
   */
  private static async awardRewards(userId: string): Promise<void> {
    // Award 5 coins for capturing a lead
    await supabase.from('coin_transactions').insert({
      user_id: userId,
      amount: 5,
      transaction_type: 'earn',
      source: 'fb_lead_capture',
      description: 'Captured FB Lead Ad',
    });

    // Consume 3 energy for processing
    await supabase.rpc('consume_user_energy', {
      p_user_id: userId,
      p_amount: 3,
      p_reason: 'fb_lead_processing',
    });
  }
}
