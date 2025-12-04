/**
 * Facebook Lead Ads Webhook Handler
 *
 * Receives lead ads from Facebook and routes to NexScout auto-capture system.
 * Full automation: Form Submit → Prospect Created → Deep Scan → Pipeline
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // GET request - Webhook verification
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      const VERIFY_TOKEN = Deno.env.get('FB_LEAD_VERIFY_TOKEN') || 'nexscout_lead_verify_2024';

      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('[FB Lead Webhook] Verification successful');
        return new Response(challenge, { status: 200, headers: corsHeaders });
      }

      console.warn('[FB Lead Webhook] Verification failed');
      return new Response('Forbidden', { status: 403, headers: corsHeaders });
    }

    // POST request - Handle incoming leads
    if (req.method === 'POST') {
      const body = await req.json();
      console.log('[FB Lead Webhook] Received:', JSON.stringify(body));

      // Process each entry
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          if (change.field !== 'leadgen') continue;

          const leadData = change.value;

          // Build payload
          const payload = {
            id: leadData.leadgen_id,
            created_time: leadData.created_time,
            field_data: leadData.field_data || [],
            ad_id: leadData.ad_id,
            adset_id: leadData.adset_id,
            campaign_id: leadData.campaign_id,
            form_id: leadData.form_id,
            page_id: entry.id,
          };

          // Process lead
          await handleIncomingLead(supabase, payload);
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  } catch (error: any) {
    console.error('[FB Lead Webhook] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

/**
 * Process incoming FB lead
 */
async function handleIncomingLead(supabase: any, payload: any) {
  console.log('[FB Lead Webhook] Processing lead:', payload.id);

  try {
    // 1. Find lead source
    const { data: leadSource } = await supabase
      .from('lead_sources')
      .select('*')
      .eq('provider', 'facebook')
      .eq('form_id', payload.form_id)
      .eq('is_active', true)
      .maybeSingle();

    if (!leadSource) {
      console.warn('[FB Lead Webhook] No lead source found for form:', payload.form_id);
      return;
    }

    // 2. Save raw lead
    const { data: rawLead } = await supabase
      .from('fb_leads_raw')
      .insert({
        lead_source_id: leadSource.id,
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

    // 3. Get field mappings
    const { data: mappings } = await supabase
      .from('lead_field_mappings')
      .select('fb_field_name, prospect_field_name')
      .eq('lead_source_id', leadSource.id);

    const map: Record<string, string> = {};
    for (const m of mappings || []) {
      map[m.fb_field_name] = m.prospect_field_name;
    }

    // 4. Map fields to prospect data
    const normalized: any = {
      tags: ['fb_lead_form'],
      custom_fields: {},
    };

    for (const field of payload.field_data) {
      const value = field.values?.[0] ?? '';
      const mapped = map[field.name];

      if (!mapped) continue;

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
          if (mapped.startsWith('custom_')) {
            normalized.custom_fields[mapped] = value;
          }
      }
    }

    // 5. Create prospect
    const { data: prospect } = await supabase
      .from('prospects')
      .insert({
        user_id: leadSource.user_id,
        name: normalized.name || normalized.first_name || 'FB Lead',
        email: normalized.email,
        phone: normalized.phone,
        city: normalized.city,
        company: normalized.company,
        job_title: normalized.job_title,
        source: 'facebook_lead_ad',
        source_id: payload.id,
        pipeline_stage: leadSource.default_pipeline_stage || 'inquiry',
        status: 'new',
        tags: normalized.tags,
        scout_score: 60,
        notes: normalized.notes,
        metadata: {
          campaign_data: {
            ad_id: payload.ad_id,
            adset_id: payload.adset_id,
            campaign_id: payload.campaign_id,
            form_id: payload.form_id,
          },
          custom_fields: normalized.custom_fields,
        },
      })
      .select('id')
      .single();

    if (!prospect) {
      throw new Error('Failed to create prospect');
    }

    // 6. Link lead to prospect
    await supabase.from('lead_prospect_links').insert({
      fb_lead_id: payload.id,
      prospect_id: prospect.id,
      source_channel: 'facebook_lead_ad',
      campaign_id: payload.campaign_id,
      ad_id: payload.ad_id,
      adset_id: payload.adset_id,
    });

    // 7. Mark raw lead as processed
    await supabase
      .from('fb_leads_raw')
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
        prospect_id: prospect.id,
      })
      .eq('id', rawLead.id);

    // 8. Notify user
    await supabase.from('notifications').insert({
      user_id: leadSource.user_id,
      type: 'new_fb_lead',
      title: 'New FB Lead Captured! 🎯',
      message: `${normalized.name || 'Bagong lead'} from Facebook Lead Ad`,
      metadata: {
        prospect_id: prospect.id,
        source: 'facebook_lead_ad',
      },
      is_read: false,
    });

    // 9. Award coins
    await supabase.from('coin_transactions').insert({
      user_id: leadSource.user_id,
      amount: 5,
      transaction_type: 'earn',
      source: 'fb_lead_capture',
      description: 'Captured FB Lead Ad',
    });

    console.log('[FB Lead Webhook] Successfully processed lead:', payload.id);
  } catch (error: any) {
    console.error('[FB Lead Webhook] Error processing lead:', error);

    // Save error to raw lead
    await supabase
      .from('fb_leads_raw')
      .update({
        processed: false,
        error_message: error.message,
      })
      .eq('fb_lead_id', payload.id);
  }
}
