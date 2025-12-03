import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ProcessScanRequest {
  sessionId: string;
  candidateId: string;
}

interface ParsedProspect {
  name: string;
  username?: string;
  platform?: string;
  profileLink?: string;
  bio?: string;
  location?: string;
  occupation?: string;
  events: Array<{
    type: string;
    text: string;
    timestamp?: string;
  }>;
}

function parsePastedText(text: string): ParsedProspect[] {
  const prospects: ParsedProspect[] = [];
  const lines = text.split('\n').filter(line => line.trim().length > 0);

  for (const line of lines) {
    const name = line.trim();
    if (name.length > 2) {
      prospects.push({
        name,
        events: [{
          type: 'post',
          text: line,
        }],
      });
    }
  }

  return prospects;
}

function parseCSV(rows: Array<Record<string, unknown>>): ParsedProspect[] {
  return rows.map(row => ({
    name: String(row.name || row.full_name || row.Name || 'Unknown'),
    username: row.username ? String(row.username) : undefined,
    platform: row.platform ? String(row.platform) : 'other',
    profileLink: row.profile_link || row.url ? String(row.profile_link || row.url) : undefined,
    location: row.location ? String(row.location) : undefined,
    occupation: row.occupation || row.job_title ? String(row.occupation || row.job_title) : undefined,
    events: [{
      type: 'post',
      text: String(row.bio || row.about || row.note || ''),
    }],
  }));
}

function analyzeText(text: string): { sentiment: string; topics: string[]; painPoints: string[]; lifeEvents: string[] } {
  const lowerText = text.toLowerCase();
  const sentiment = lowerText.includes('happy') || lowerText.includes('excited') ? 'positive' :
                   lowerText.includes('sad') || lowerText.includes('stress') ? 'negative' : 'neutral';
  
  const topics: string[] = [];
  const painPoints: string[] = [];
  const lifeEvents: string[] = [];

  if (lowerText.includes('business') || lowerText.includes('negosyo')) topics.push('business');
  if (lowerText.includes('family') || lowerText.includes('pamilya')) topics.push('family');
  if (lowerText.includes('health') || lowerText.includes('fitness')) topics.push('health');
  
  if (lowerText.includes('walang pera') || lowerText.includes('broke')) painPoints.push('financial_stress');
  if (lowerText.includes('utang') || lowerText.includes('debt')) painPoints.push('debt_burden');
  
  if (/\b(baby|buntis|pregnant)\b/i.test(text)) lifeEvents.push('new_baby');
  if (/\b(kasal|wedding|married)\b/i.test(text)) lifeEvents.push('wedding');
  if (/\b(new job|hired|promoted)\b/i.test(text)) lifeEvents.push('job_change');

  return { sentiment, topics, painPoints, lifeEvents };
}

function calculateScoutScore(
  engagement: number,
  businessInterest: number,
  painPoint: number,
  lifeEvent: number,
  responsiveness: number,
  mlmLeadership: number
): number {
  const score = 0.25 * engagement + 0.20 * businessInterest + 0.20 * painPoint +
                0.15 * lifeEvent + 0.10 * responsiveness + 0.10 * mlmLeadership;
  return Math.round(score * 100 * 100) / 100;
}

function determineBucket(score: number): 'hot' | 'warm' | 'cold' {
  if (score >= 80) return 'hot';
  if (score >= 50) return 'warm';
  return 'cold';
}

function generateExplanationTags(params: {
  engagement: number;
  businessInterest: number;
  painPoints: string[];
  lifeEvents: string[];
}): string[] {
  const tags: string[] = [];
  if (params.engagement >= 0.7) tags.push('🔥 Highly engaged');
  if (params.businessInterest >= 0.6) tags.push('💼 Business interest');
  if (params.painPoints.includes('financial_stress')) tags.push('💰 Financial pressure');
  if (params.lifeEvents.includes('new_baby')) tags.push('👶 New baby opportunity');
  if (params.lifeEvents.includes('job_change')) tags.push('🎯 Career change');
  return tags;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { sessionId, candidateId }: ProcessScanRequest = await req.json();
    const startTime = Date.now();

    // Fetch candidate
    const { data: candidate, error: fetchError } = await supabase
      .from('raw_prospect_candidates')
      .select('*')
      .eq('id', candidateId)
      .single();

    if (fetchError || !candidate) {
      throw new Error('Candidate not found');
    }

    await supabase.from('raw_prospect_candidates').update({ processing_status: 'processing' }).eq('id', candidateId);
    await supabase.from('scanning_sessions').update({ progress_percentage: 20, current_stage: 'Parsing' }).eq('id', sessionId);

    // Parse based on source type
    let parsedProspects: ParsedProspect[] = [];
    const rawContent = candidate.raw_content as Record<string, unknown>;

    if (candidate.source_type === 'paste') {
      parsedProspects = parsePastedText(rawContent.text as string || '');
    } else if (candidate.source_type === 'csv') {
      parsedProspects = parseCSV(rawContent.rows as Array<Record<string, unknown>> || []);
    }

    let hotCount = 0, warmCount = 0, coldCount = 0, createdCount = 0;

    // Process each prospect
    for (const parsed of parsedProspects) {
      try {
        await supabase.from('scanning_sessions').update({ progress_percentage: 40, current_stage: 'Creating prospects' }).eq('id', sessionId);

        // Create prospect
        const { data: newProspect, error: prospectError } = await supabase
          .from('prospects')
          .insert({
            user_id: user.id,
            full_name: parsed.name,
            username: parsed.username,
            platform: parsed.platform || 'other',
            profile_link: parsed.profileLink,
            bio_text: parsed.bio,
            location: parsed.location,
            occupation: parsed.occupation,
            last_seen_activity_at: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (prospectError || !newProspect) continue;

        const prospectId = newProspect.id;
        createdCount++;

        await supabase.from('scanning_sessions').update({ progress_percentage: 60, current_stage: 'NLP analysis' }).eq('id', sessionId);

        // Create events and analyze
        let allTopics: string[] = [];
        let allPainPoints: string[] = [];
        let allLifeEvents: string[] = [];
        let sentimentSum = 0;

        for (const event of parsed.events) {
          if (!event.text || event.text.trim().length === 0) continue;

          const analysis = analyzeText(event.text);
          allTopics.push(...analysis.topics);
          allPainPoints.push(...analysis.painPoints);
          allLifeEvents.push(...analysis.lifeEvents);
          sentimentSum += analysis.sentiment === 'positive' ? 1 : analysis.sentiment === 'negative' ? -1 : 0;

          await supabase.from('prospect_events').insert({
            prospect_id: prospectId,
            user_id: user.id,
            event_type: event.type,
            event_text: event.text,
            event_timestamp: event.timestamp || new Date().toISOString(),
            platform: parsed.platform || 'unknown',
            sentiment: analysis.sentiment,
            metadata: { topics: analysis.topics, pain_points: analysis.painPoints, life_events: analysis.lifeEvents },
          });
        }

        const sentimentAvg = parsed.events.length > 0 ? sentimentSum / parsed.events.length : 0;
        const uniqueTopics = [...new Set(allTopics)];
        const uniquePainPoints = [...new Set(allPainPoints)];
        const uniqueLifeEvents = [...new Set(allLifeEvents)];

        // Calculate scores
        const engagementScore = Math.min(1.0, parsed.events.length * 0.2);
        const businessInterestScore = uniqueTopics.filter(t => t === 'business').length > 0 ? 0.8 : 0.2;
        const painPointScore = Math.min(1.0, uniquePainPoints.length * 0.3);
        const lifeEventScore = uniqueLifeEvents.length > 0 ? 0.8 : 0.2;
        const responsivenessScore = (sentimentAvg + 1) / 2 * 0.5 + engagementScore * 0.5;
        const mlmLeadershipScore = businessInterestScore * 0.6 + ((sentimentAvg + 1) / 2) * 0.4;

        await supabase.from('scanning_sessions').update({ progress_percentage: 70, current_stage: 'Enriching profiles' }).eq('id', sessionId);

        // Save profile
        await supabase.from('prospect_profiles').upsert({
          prospect_id: prospectId,
          user_id: user.id,
          sentiment_avg: sentimentAvg,
          dominant_topics: uniqueTopics,
          interests: uniqueTopics,
          pain_points: uniquePainPoints,
          life_events: uniqueLifeEvents,
          personality_traits: {},
          engagement_score: engagementScore,
          business_interest_score: businessInterestScore,
          pain_point_score: painPointScore,
          life_event_score: lifeEventScore,
          responsiveness_likelihood: responsivenessScore,
          mlm_leadership_potential: mlmLeadershipScore,
          last_updated_at: new Date().toISOString(),
        });

        await supabase.from('scanning_sessions').update({ progress_percentage: 85, current_stage: 'Calculating scores' }).eq('id', sessionId);

        // Calculate and save score
        const scoutScore = calculateScoutScore(engagementScore, businessInterestScore, painPointScore, lifeEventScore, responsivenessScore, mlmLeadershipScore);
        const bucket = determineBucket(scoutScore);
        const explanationTags = generateExplanationTags({ engagement: engagementScore, businessInterest: businessInterestScore, painPoints: uniquePainPoints, lifeEvents: uniqueLifeEvents });

        await supabase.from('prospect_scores').insert({
          prospect_id: prospectId,
          user_id: user.id,
          scout_score: scoutScore,
          bucket,
          explanation_tags: explanationTags,
          engagement_score: engagementScore,
          business_interest_score: businessInterestScore,
          pain_point_score: painPointScore,
          life_event_score: lifeEventScore,
          responsiveness_likelihood: responsivenessScore,
          mlm_leadership_potential: mlmLeadershipScore,
        });

        if (bucket === 'hot') hotCount++;
        else if (bucket === 'warm') warmCount++;
        else coldCount++;
      } catch (error) {
        console.error('Error processing prospect:', error);
      }
    }

    await supabase.from('scanning_sessions').update({ progress_percentage: 100, current_stage: 'Completed' }).eq('id', sessionId);

    // Finalize session
    const processingTime = Date.now() - startTime;
    await supabase.from('raw_prospect_candidates').update({ processing_status: 'completed', processed_at: new Date().toISOString() }).eq('id', candidateId);
    await supabase.from('scanning_sessions').update({
      status: 'completed',
      prospects_found: createdCount,
      hot_count: hotCount,
      warm_count: warmCount,
      cold_count: coldCount,
      processing_time_ms: processingTime,
      completed_at: new Date().toISOString(),
    }).eq('id', sessionId);

    return new Response(
      JSON.stringify({ success: true, prospectsCreated: createdCount, hotCount, warmCount, coldCount }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in process-scan function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
