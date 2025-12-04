import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface RecalculateRequest {
  prospectId?: string;
  bulkRecalculate?: boolean;
  userId?: string;
}

interface OutcomeRequest {
  prospectId: string;
  outcome: 'won' | 'lost' | 'positive_reply' | 'no_response';
}

const DEFAULT_WEIGHTS = {
  engagement_score: 0.18,
  business_interest_score: 0.20,
  pain_point_score: 0.20,
  life_event_score: 0.15,
  responsiveness_score: 0.15,
  leadership_score: 0.12,
  relationship_score: 0.10,
};

const PHILIPPINE_MLM_KEYWORDS = {
  business: ['negosyo', 'business', 'sideline', 'extra income', 'kita', 'tubo'],
  finance: ['pera', 'money', 'income', 'sahod', 'salary', 'ipon', 'utang'],
};

function calculateRecencyScore(lastEventAt: string | null): number {
  if (!lastEventAt) return 0;
  const daysSince = Math.floor((Date.now() - new Date(lastEventAt).getTime()) / (1000 * 60 * 60 * 24));
  if (daysSince <= 1) return 1.0;
  if (daysSince <= 3) return 0.9;
  if (daysSince <= 7) return 0.7;
  if (daysSince <= 14) return 0.5;
  if (daysSince <= 30) return 0.3;
  return 0.1;
}

function calculateEngagementScore(profile: any, events: any[]): number {
  let score = 0;
  const eventCount = profile.total_events_count || 0;
  if (eventCount > 50) score += 40;
  else if (eventCount > 20) score += 30;
  else if (eventCount > 10) score += 20;
  else if (eventCount > 5) score += 10;

  const recencyScore = calculateRecencyScore(profile.last_event_at);
  score += recencyScore * 30;
  score += (profile.engagement_score || 0) / 100 * 30;
  return Math.min(100, score);
}

function calculateBusinessInterestScore(profile: any): number {
  let score = 0;
  const topics = profile.dominant_topics || [];
  const interests = profile.interests || [];
  const businessKeywords = [...PHILIPPINE_MLM_KEYWORDS.business, ...PHILIPPINE_MLM_KEYWORDS.finance];

  const businessTopics = topics.filter((t: string) =>
    businessKeywords.some(kw => t.toLowerCase().includes(kw.toLowerCase()))
  );
  score += Math.min(50, businessTopics.length * 15);

  const businessInterests = interests.filter((i: string) =>
    businessKeywords.some(kw => i.toLowerCase().includes(kw.toLowerCase()))
  );
  score += Math.min(30, businessInterests.length * 10);
  score += (profile.business_interest_score || 0) / 100 * 20;
  return Math.min(100, score);
}

function calculatePainPointScore(profile: any): number {
  let score = 0;
  const painPoints = profile.pain_points || [];
  const highValue = ['financial_stress', 'income', 'debt', 'money', 'job_dissatisfaction', 'time_freedom'];

  painPoints.forEach((pp: string) => {
    if (highValue.some(hvp => pp.toLowerCase().includes(hvp))) {
      score += 25;
    } else {
      score += 10;
    }
  });
  score += (profile.pain_point_score || 0) / 100 * 30;
  return Math.min(100, score);
}

function calculateLifeEventScore(profile: any): number {
  let score = 0;
  const lifeEvents = profile.life_events || [];
  const impactful: Record<string, number> = {
    new_baby: 40, baby: 40, marriage: 35, new_job: 30, job_change: 30,
    promotion: 25, relocation: 20, graduation: 20, milestone_birthday: 15,
  };

  lifeEvents.forEach((event: string) => {
    const eventLower = event.toLowerCase();
    for (const [key, value] of Object.entries(impactful)) {
      if (eventLower.includes(key)) {
        score += value;
        break;
      }
    }
  });
  score += (profile.life_event_score || 0) / 100 * 20;
  return Math.min(100, score);
}

function calculateResponsivenessScore(profile: any): number {
  let score = 50;
  const sentimentAvg = profile.sentiment_avg || 0;
  if (sentimentAvg > 0.5) score += 25;
  else if (sentimentAvg > 0) score += 10;
  else if (sentimentAvg < -0.3) score -= 20;

  const personality = profile.personality_traits || {};
  if (personality.openness === 'high') score += 15;
  if (personality.responsiveness === 'high') score += 20;
  if (personality.engagement === 'active') score += 10;
  score += (profile.responsiveness_likelihood || 0) / 100 * 20;
  return Math.max(0, Math.min(100, score));
}

function calculateLeadershipScore(profile: any): number {
  let score = 0;
  const personality = profile.personality_traits || {};
  if (personality.leadership === 'high') score += 40;
  else if (personality.leadership === 'medium') score += 20;

  const leadershipKeywords = ['lead', 'manage', 'team', 'organize'];
  const topics = [...(profile.dominant_topics || []), ...(profile.interests || [])];
  const leadershipTopics = topics.filter((t: string) =>
    leadershipKeywords.some(kw => t.toLowerCase().includes(kw))
  );
  score += Math.min(30, leadershipTopics.length * 10);
  score += (profile.mlm_leadership_potential || 0) / 100 * 30;
  return Math.min(100, score);
}

function calculateRelationshipScore(profile: any, events: any[]): number {
  let score = 30;
  const eventCount = events.length;
  if (eventCount > 30) score += 30;
  else if (eventCount > 15) score += 20;
  else if (eventCount > 5) score += 10;

  const sentimentAvg = profile.sentiment_avg || 0;
  if (sentimentAvg > 0.3) score += 20;
  score += calculateRecencyScore(profile.last_event_at) * 20;
  return Math.min(100, score);
}

function extractFeatures(profile: any, events: any[]) {
  return {
    engagement_score: calculateEngagementScore(profile, events),
    business_interest_score: calculateBusinessInterestScore(profile),
    pain_point_score: calculatePainPointScore(profile),
    life_event_score: calculateLifeEventScore(profile),
    responsiveness_score: calculateResponsivenessScore(profile),
    leadership_score: calculateLeadershipScore(profile),
    relationship_score: calculateRelationshipScore(profile, events),
  };
}

function computeWeightedScore(features: any, weights: any): number {
  let score = 0;
  Object.keys(features).forEach(key => {
    score += features[key] * (weights[key] || 0);
  });
  return Math.max(0, Math.min(100, Math.round(score)));
}

function classifyBucket(score: number): string {
  if (score >= 80) return 'hot';
  if (score >= 50) return 'warm';
  return 'cold';
}

function generateExplanationTags(features: any): string[] {
  const tags: string[] = [];
  const sorted = Object.entries(features)
    .sort((a: any, b: any) => b[1] - a[1])
    .slice(0, 3);

  sorted.forEach(([key, value]: [string, any]) => {
    if (value >= 70) {
      if (key === 'business_interest_score') tags.push('Strong business interest');
      else if (key === 'pain_point_score') tags.push('Clear pain points identified');
      else if (key === 'life_event_score') tags.push('Recent life event (opportunity window)');
      else if (key === 'engagement_score') tags.push('Highly engaged prospect');
      else if (key === 'leadership_score') tags.push('Strong leadership potential');
      else if (key === 'responsiveness_score') tags.push('High response likelihood');
      else if (key === 'relationship_score') tags.push('Good relationship foundation');
    }
  });

  if (features.pain_point_score >= 60 && features.business_interest_score >= 60) {
    tags.push('Problem-aware + business-minded');
  }
  if (features.life_event_score >= 50 && features.responsiveness_score >= 60) {
    tags.push('Prime timing for outreach');
  }
  if (features.leadership_score >= 70) {
    tags.push('Potential team builder');
  }

  return tags.slice(0, 5);
}

async function calculateScore(supabase: any, prospectId: string, userId: string) {
  const { data: prospect } = await supabase
    .from('prospects')
    .select('*, prospect_profiles!inner(*), prospect_events(*)')
    .eq('id', prospectId)
    .eq('user_id', userId)
    .single();

  if (!prospect) throw new Error('Prospect not found');

  const profile = prospect.prospect_profiles[0];
  const events = prospect.prospect_events || [];

  const features = extractFeatures(profile, events);

  const { data: userProfile } = await supabase
    .from('user_scoring_profiles')
    .select('weights')
    .eq('user_id', userId)
    .maybeSingle();

  const weights = userProfile?.weights || DEFAULT_WEIGHTS;
  const score = computeWeightedScore(features, weights);
  const bucket = classifyBucket(score);
  const tags = generateExplanationTags(features);

  await supabase.from('prospect_feature_vectors').upsert({
    prospect_id: prospectId,
    user_id: userId,
    ...features,
    features,
    updated_at: new Date().toISOString(),
  });

  await supabase.from('prospect_scores').upsert({
    prospect_id: prospectId,
    user_id: userId,
    scout_score: score,
    bucket,
    explanation_tags: tags,
    feature_vector: features,
    weight_vector: weights,
    model_version: 'v2.0',
    last_calculated_at: new Date().toISOString(),
  });

  return { score, bucket, tags, features };
}

async function adjustWeights(supabase: any, userId: string, prospectId: string, outcome: string) {
  const { data: profile } = await supabase
    .from('user_scoring_profiles')
    .select('weights, total_wins, total_losses')
    .eq('user_id', userId)
    .single();

  if (!profile) return;

  const { data: featureVector } = await supabase
    .from('prospect_feature_vectors')
    .select('*')
    .eq('prospect_id', prospectId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!featureVector) return;

  const currentWeights = profile.weights;
  const adjustedWeights = { ...currentWeights };
  const boostRate = outcome === 'won' ? 0.05 : outcome === 'positive_reply' ? 0.02 : 0;
  const penaltyRate = outcome === 'lost' ? 0.03 : outcome === 'no_response' ? 0.01 : 0;

  Object.keys(adjustedWeights).forEach(key => {
    const featureValue = featureVector[key];
    if (featureValue > 70) {
      if (boostRate > 0) adjustedWeights[key] *= (1 + boostRate);
      else if (penaltyRate > 0) adjustedWeights[key] *= (1 - penaltyRate);
    }
  });

  const totalWeight = Object.values(adjustedWeights).reduce((a: any, b: any) => a + b, 0);
  Object.keys(adjustedWeights).forEach(key => {
    adjustedWeights[key] /= totalWeight;
  });

  const newWins = profile.total_wins + (outcome === 'won' ? 1 : 0);
  const newLosses = profile.total_losses + (outcome === 'lost' ? 1 : 0);
  const winRate = newWins / (newWins + newLosses || 1);

  await supabase.from('user_scoring_profiles').update({
    weights: adjustedWeights,
    total_wins: newWins,
    total_losses: newLosses,
    win_rate: winRate,
    updated_at: new Date().toISOString(),
  }).eq('user_id', userId);
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

    const url = new URL(req.url);
    const path = url.pathname;

    if (path.includes('/recalculate')) {
      const body: RecalculateRequest = await req.json();

      if (body.bulkRecalculate) {
        const { data: prospects } = await supabase
          .from('prospects')
          .select('id')
          .eq('user_id', user.id)
          .limit(100);

        const results = [];
        for (const p of prospects || []) {
          try {
            const result = await calculateScore(supabase, p.id, user.id);
            results.push({ prospectId: p.id, success: true, result });
          } catch (error) {
            results.push({ prospectId: p.id, success: false, error: error.message });
          }
        }

        return new Response(
          JSON.stringify({ success: true, results, count: results.length }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (body.prospectId) {
        const result = await calculateScore(supabase, body.prospectId, user.id);
        return new Response(
          JSON.stringify({ success: true, result }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Missing prospectId or bulkRecalculate flag' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (path.includes('/outcome')) {
      const body: OutcomeRequest = await req.json();
      await adjustWeights(supabase, user.id, body.prospectId, body.outcome);
      await calculateScore(supabase, body.prospectId, user.id);

      return new Response(
        JSON.stringify({ success: true, message: 'Weights adjusted and score recalculated' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid endpoint' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('ScoutScore v2 error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});