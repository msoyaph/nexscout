import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface TimelineEntry {
  date: string;
  interactions: number;
  posts: number;
  comments: number;
  sentimentScore: number;
  painPointScore: number;
  opportunitySignalScore: number;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting daily behavior timeline update...');

    const { data: prospects } = await supabase
      .from('scan_processed_items')
      .select('id, user_id, name')
      .not('user_id', 'is', null)
      .limit(1000);

    if (!prospects || prospects.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No prospects to process' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let processedCount = 0;
    let updatedCount = 0;

    for (const prospect of prospects) {
      try {
        const { data: contact } = await supabase
          .from('social_contacts')
          .select('id')
          .eq('prospect_id', prospect.id)
          .maybeSingle();

        if (!contact) continue;

        const { data: interactions } = await supabase
          .from('social_interactions')
          .select('*')
          .eq('contact_id', contact.id)
          .gte('occurred_at', getDaysAgo(180));

        if (!interactions || interactions.length === 0) continue;

        await recordDailyBehavior(supabase, contact.id, prospect.user_id, interactions);

        const timeline = await buildTimeline(supabase, prospect.user_id, contact.id);

        if (timeline.length > 0) {
          const summary = await computeBehaviorSummary(supabase, prospect.id, prospect.user_id, timeline);
          await storeBehaviorSummary(supabase, prospect.id, prospect.user_id, summary);
          updatedCount++;
        }

        processedCount++;
      } catch (error) {
        console.error(`Failed to process prospect ${prospect.id}:`, error);
      }
    }

    console.log(`Processed ${processedCount} prospects, updated ${updatedCount} summaries`);

    return new Response(
      JSON.stringify({
        success: true,
        processedCount,
        updatedCount,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Cron job failed:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function recordDailyBehavior(supabase: any, contactId: string, userId: string, interactions: any[]): Promise<void> {
  const { data: contact } = await supabase
    .from('social_contacts')
    .select('platform')
    .eq('id', contactId)
    .single();

  if (!contact) return;

  const dailyAggregates = new Map<string, any>();

  for (const interaction of interactions) {
    const date = new Date(interaction.occurred_at).toISOString().split('T')[0];

    if (!dailyAggregates.has(date)) {
      dailyAggregates.set(date, {
        interactions: 0,
        posts: 0,
        comments: 0,
        sentimentScore: 0,
        painPointScore: 0,
        opportunitySignalScore: 0,
      });
    }

    const entry = dailyAggregates.get(date);
    entry.interactions++;

    if (interaction.interaction_type === 'post') entry.posts++;
    if (interaction.interaction_type === 'comment') entry.comments++;

    if (interaction.sentiment === 'positive') entry.sentimentScore += 1;
    else if (interaction.sentiment === 'negative') entry.sentimentScore -= 1;

    if (interaction.text_content) {
      const text = interaction.text_content.toLowerCase();
      if (containsPainSignals(text)) entry.painPointScore += 1;
      if (containsOpportunitySignals(text)) entry.opportunitySignalScore += 1;
    }
  }

  for (const [date, entry] of dailyAggregates) {
    const avgSentiment = entry.interactions > 0 ? entry.sentimentScore / entry.interactions : 0;

    await supabase.from('contact_behavior_timeline').upsert(
      {
        user_id: userId,
        contact_id: contactId,
        platform: contact.platform,
        date,
        interactions: entry.interactions,
        posts: entry.posts,
        comments: entry.comments,
        sentiment_score: avgSentiment,
        pain_point_score: entry.painPointScore,
        opportunity_signal_score: entry.opportunitySignalScore,
      },
      { onConflict: 'contact_id,date' }
    );
  }
}

async function buildTimeline(supabase: any, userId: string, contactId: string): Promise<TimelineEntry[]> {
  const { data: timeline } = await supabase
    .from('contact_behavior_timeline')
    .select('*')
    .eq('user_id', userId)
    .eq('contact_id', contactId)
    .gte('date', getDaysAgo(180))
    .order('date', { ascending: true });

  return (
    timeline?.map((t: any) => ({
      date: t.date,
      interactions: t.interactions,
      posts: t.posts,
      comments: t.comments,
      sentimentScore: t.sentiment_score,
      painPointScore: t.pain_point_score,
      opportunitySignalScore: t.opportunity_signal_score,
    })) || []
  );
}

async function computeBehaviorSummary(supabase: any, prospectId: string, userId: string, timeline: TimelineEntry[]): Promise<any> {
  const last30d = timeline.slice(-30);
  const last90d = timeline.slice(-90);

  const last30dActivity = last30d.reduce((sum, t) => sum + t.interactions, 0);
  const last90dActivity = last90d.reduce((sum, t) => sum + t.interactions, 0);

  const momentumScore = computeMomentum(timeline);
  const opportunityPhase = detectOpportunityPhase(timeline);
  const timelineStrength = computeTimelineStrength(timeline);

  const recentSentimentScore =
    last30d.length > 0
      ? (last30d.reduce((sum, t) => sum + t.sentimentScore, 0) / last30d.length) * 50 + 50
      : 50;

  const recentOpportunitySignals = last30d.reduce((sum, t) => sum + t.opportunitySignalScore, 0);

  const momentumDirection = momentumScore > 10 ? 'rising' : momentumScore < -10 ? 'dropping' : 'stable';

  return {
    last30dActivity,
    last90dActivity,
    momentumScore,
    recentSentimentScore,
    recentOpportunitySignals,
    timelineStrength,
    opportunityPhase,
    momentumDirection,
  };
}

async function storeBehaviorSummary(supabase: any, prospectId: string, userId: string, summary: any): Promise<void> {
  await supabase.from('prospect_behavior_summary').upsert(
    {
      prospect_id: prospectId,
      user_id: userId,
      last_30d_activity: summary.last30dActivity,
      last_90d_activity: summary.last90dActivity,
      momentum_score: summary.momentumScore,
      recent_sentiment_score: summary.recentSentimentScore,
      recent_opportunity_signals: summary.recentOpportunitySignals,
      timeline_strength: summary.timelineStrength,
      opportunity_phase: summary.opportunityPhase,
      momentum_direction: summary.momentumDirection,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'prospect_id' }
  );
}

function computeMomentum(timeline: TimelineEntry[]): number {
  if (timeline.length === 0) return 0;

  const recent7Days = timeline.slice(-7);
  const previous23Days = timeline.slice(-30, -7);

  const recentAvg = calculateAvgInteractions(recent7Days);
  const previousAvg = calculateAvgInteractions(previous23Days);

  if (previousAvg === 0) return recentAvg > 0 ? 100 : 0;

  const momentum = ((recentAvg - previousAvg) / Math.max(previousAvg, 1)) * 100;

  return Math.max(-100, Math.min(100, momentum));
}

function detectOpportunityPhase(timeline: TimelineEntry[]): string | undefined {
  if (timeline.length === 0) return undefined;

  const last14Days = timeline.slice(-14);

  const financialStressCount = last14Days.reduce((sum, t) => sum + t.painPointScore, 0);
  if (financialStressCount >= 3) return 'HIGH NEED';

  const opportunitySignalsCount = last14Days.reduce((sum, t) => sum + t.opportunitySignalScore, 0);
  if (opportunitySignalsCount >= 5) return 'OPPORTUNITY MODE';

  const hasBusinessSignals = last14Days.some(t => t.opportunitySignalScore > 0);
  const hasIncreasingPosts = last14Days.filter(t => t.posts > 0).length >= 5;

  if (hasBusinessSignals && hasIncreasingPosts) return 'CAREER SHIFT';
  if (opportunitySignalsCount >= 2) return 'LOOKING FOR EXTRA INCOME';

  return undefined;
}

function computeTimelineStrength(timeline: TimelineEntry[]): number {
  if (timeline.length === 0) return 0;

  const last30Days = timeline.slice(-30);

  const engagementScore = calculateEngagementScore(last30Days);
  const consistencyScore = calculateConsistencyScore(last30Days);
  const momentumScore = Math.abs(computeMomentum(timeline)) / 100;

  const strength = engagementScore * 0.3 + consistencyScore * 0.2 + momentumScore * 100 * 0.5;

  return Math.min(100, Math.max(0, strength));
}

function calculateAvgInteractions(entries: TimelineEntry[]): number {
  if (entries.length === 0) return 0;
  const total = entries.reduce((sum, e) => sum + e.interactions, 0);
  return total / entries.length;
}

function calculateEngagementScore(entries: TimelineEntry[]): number {
  const totalInteractions = entries.reduce((sum, e) => sum + e.interactions, 0);
  return Math.min((totalInteractions / entries.length) * 10, 100);
}

function calculateConsistencyScore(entries: TimelineEntry[]): number {
  const activeDays = entries.filter(e => e.interactions > 0).length;
  return (activeDays / entries.length) * 100;
}

function containsPainSignals(text: string): boolean {
  const painKeywords = [
    'hirap',
    'kulang',
    'utang',
    'debt',
    'problema',
    'struggle',
    'kailangan ng pera',
    'need money',
    'financial problem',
    'walang pera',
  ];
  return painKeywords.some(keyword => text.includes(keyword));
}

function containsOpportunitySignals(text: string): boolean {
  const opportunityKeywords = [
    'business',
    'extra income',
    'sideline',
    'raket',
    'opportunity',
    'negosyo',
    'work from home',
    'entrepreneur',
    'insurance',
    'dagdag kita',
  ];
  return opportunityKeywords.some(keyword => text.includes(keyword));
}

function getDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}
