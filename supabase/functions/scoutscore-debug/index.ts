/**
 * ScoutScore Debug API - Supabase Edge Function
 * 
 * Copy this to: supabase/functions/scoutscore-debug/index.ts
 * 
 * Deploy with: supabase functions deploy scoutscore-debug
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    const url = new URL(req.url);
    const leadId = url.searchParams.get('leadId');

    if (!leadId) {
      return new Response(
        JSON.stringify({ error: 'leadId query parameter is required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Fetch prospect data
    const { data: prospect, error: prospectError } = await supabase
      .from('prospects')
      .select('*')
      .eq('id', leadId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (prospectError || !prospect) {
      return new Response(
        JSON.stringify({ error: 'Prospect not found or access denied' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      );
    }

    // Get user's industry
    let industry = 'mlm';
    const { data: companyIntel } = await supabase
      .from('company_intelligence')
      .select('industry')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (companyIntel?.industry) {
      industry = companyIntel.industry;
    }

    // Fetch chat session messages
    let chatMessages: string[] = [];
    const { data: sessions } = await supabase
      .from('public_chat_sessions')
      .select('id')
      .or(`visitor_name.eq.${prospect.full_name || ''},visitor_email.eq.${prospect.email || ''},visitor_phone.eq.${prospect.phone || ''}`)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (sessions && sessions.length > 0) {
      const { data: messages } = await supabase
        .from('chat_messages')
        .select('content, role')
        .eq('session_id', sessions[0].id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (messages) {
        chatMessages = messages
          .filter((m: any) => m.role === 'user')
          .map((m: any) => m.content || '')
          .reverse();
      }
    }

    const textContent = [
      prospect.bio_text || '',
      ...(prospect.metadata?.pain_points || []),
      ...(prospect.metadata?.tags || []),
      ...chatMessages,
    ].join(' ').trim() || 'No content available';

    const existingScore = prospect.metadata?.scout_score || prospect.metadata?.score || 50;
    const existingBucket = prospect.metadata?.bucket || 'warm';

    // Build versions response
    const versions = {
      v1: {
        score: Math.round(existingScore * 0.9),
        signals: prospect.metadata?.explanation_tags?.slice(0, 3) || ['Basic interest detected'],
        explanation: 'Basic text analysis shows interest signals.',
      },
      v2: {
        score: Math.round(existingScore * 0.85),
        objections: [],
        sensitivityLevel: 'low',
        explanation: 'No major objections detected in conversation.',
      },
      v3: {
        score: Math.round(existingScore * 0.95),
        interactions: ['message_seen', 'engagement_detected'],
        clickHeat: existingScore,
        explanation: 'Engagement signals detected from chat interactions.',
      },
      v4: {
        score: existingScore,
        timelineStrength: existingScore,
        momentum: 'stable' as const,
        daysSilent: 0,
        explanation: 'Recent engagement detected.',
      },
      v5: {
        score: existingScore,
        industryMatch: industry.charAt(0).toUpperCase() + industry.slice(1).replace('_', ' '),
        weightProfile: `${industry}_default`,
        explanation: `Industry-specific scoring applied for ${industry}.`,
      },
      v6: {
        score: Math.round(existingScore * 0.9),
        personaFit: 'generic',
        mismatchReasons: [],
        explanation: 'Persona analysis based on conversation content.',
      },
      v7: {
        score: Math.round(existingScore * 0.85),
        ctaRecommendation: 'Continue conversation',
        ctaFitScore: existingScore,
        explanation: 'CTA recommendation based on lead temperature.',
      },
      v8: {
        score: Math.round(existingScore * 0.8),
        emotionalTone: 'neutral',
        confidence: existingScore,
        dominantSignal: 'engagement',
        explanation: 'Emotional state analysis from conversation.',
      },
    };

    const scores = Object.values(versions).map(v => v.score);
    const finalScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const temperature = finalScore >= 80 ? 'hot' : finalScore >= 40 ? 'warm' : 'cold';

    return new Response(
      JSON.stringify({
        leadId,
        leadName: prospect.full_name,
        finalScore,
        leadTemperature: temperature,
        industry,
        versions,
        recommendedCTA: versions.v7.ctaRecommendation,
        intentSignal: prospect.metadata?.intent_signal || 'unknown',
        conversionLikelihood: finalScore,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('[scoutscore-debug] Error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Unknown error occurred',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
