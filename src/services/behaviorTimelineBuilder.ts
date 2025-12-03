import { supabase } from '../lib/supabase';

export interface TimelineEntry {
  date: string;
  interactions: number;
  posts: number;
  comments: number;
  sentimentScore: number;
  painPointScore: number;
  opportunitySignalScore: number;
}

export interface BehaviorSummary {
  prospectId: string;
  last30dActivity: number;
  last90dActivity: number;
  last90dTrend: number;
  momentumScore: number;
  recentSentimentScore: number;
  recentOpportunitySignals: number;
  timelineStrength: number;
  opportunityPhase?: string;
  momentumDirection: 'rising' | 'stable' | 'dropping';
}

export class BehaviorTimelineBuilder {
  static async recordDailyBehavior(contactId: string, interactions: any[]): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: contact } = await supabase
      .from('social_contacts')
      .select('platform')
      .eq('id', contactId)
      .single();

    if (!contact) return;

    const dailyAggregates = new Map<string, TimelineEntry>();

    for (const interaction of interactions) {
      const date = new Date(interaction.occurred_at).toISOString().split('T')[0];

      if (!dailyAggregates.has(date)) {
        dailyAggregates.set(date, {
          date,
          interactions: 0,
          posts: 0,
          comments: 0,
          sentimentScore: 0,
          painPointScore: 0,
          opportunitySignalScore: 0,
        });
      }

      const entry = dailyAggregates.get(date)!;
      entry.interactions++;

      if (interaction.interaction_type === 'post') entry.posts++;
      if (interaction.interaction_type === 'comment') entry.comments++;

      if (interaction.sentiment === 'positive') entry.sentimentScore += 1;
      else if (interaction.sentiment === 'negative') entry.sentimentScore -= 1;

      if (interaction.text_content) {
        const text = interaction.text_content.toLowerCase();
        if (this.containsPainSignals(text)) entry.painPointScore += 1;
        if (this.containsOpportunitySignals(text)) entry.opportunitySignalScore += 1;
      }
    }

    for (const [date, entry] of dailyAggregates) {
      const avgSentiment = entry.interactions > 0 ? entry.sentimentScore / entry.interactions : 0;

      await supabase
        .from('contact_behavior_timeline')
        .upsert(
          {
            user_id: user.id,
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

  static async buildTimelineForContact(userId: string, contactId: string): Promise<TimelineEntry[]> {
    const { data: timeline } = await supabase
      .from('contact_behavior_timeline')
      .select('*')
      .eq('user_id', userId)
      .eq('contact_id', contactId)
      .gte('date', this.getDaysAgo(180))
      .order('date', { ascending: true });

    return (
      timeline?.map(t => ({
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

  static computeMomentum(timeline: TimelineEntry[]): number {
    if (timeline.length === 0) return 0;

    const recent7Days = timeline.slice(-7);
    const previous23Days = timeline.slice(-30, -7);

    const recentAvg = this.calculateAvgInteractions(recent7Days);
    const previousAvg = this.calculateAvgInteractions(previous23Days);

    if (previousAvg === 0) return recentAvg > 0 ? 100 : 0;

    const momentum = ((recentAvg - previousAvg) / Math.max(previousAvg, 1)) * 100;

    return Math.max(-100, Math.min(100, momentum));
  }

  static detectOpportunityPhase(timeline: TimelineEntry[]): string | undefined {
    if (timeline.length === 0) return undefined;

    const last14Days = timeline.slice(-14);

    const financialStressCount = last14Days.reduce((sum, t) => sum + t.painPointScore, 0);

    if (financialStressCount >= 3) {
      return 'HIGH NEED';
    }

    const opportunitySignalsCount = last14Days.reduce((sum, t) => sum + t.opportunitySignalScore, 0);

    if (opportunitySignalsCount >= 5) {
      return 'OPPORTUNITY MODE';
    }

    const hasBusinessSignals = last14Days.some(t => t.opportunitySignalScore > 0);
    const hasIncreasingPosts = last14Days.filter(t => t.posts > 0).length >= 5;

    if (hasBusinessSignals && hasIncreasingPosts) {
      return 'CAREER SHIFT';
    }

    if (opportunitySignalsCount >= 2) {
      return 'LOOKING FOR EXTRA INCOME';
    }

    return undefined;
  }

  static computeTimelineStrength(timeline: TimelineEntry[]): number {
    if (timeline.length === 0) return 0;

    const last30Days = timeline.slice(-30);

    const engagementScore = this.calculateEngagementScore(last30Days);
    const consistencyScore = this.calculateConsistencyScore(last30Days);
    const momentumScore = Math.abs(this.computeMomentum(timeline)) / 100;
    const sentimentScore = this.calculateSentimentScore(last30Days);
    const opportunityScore = this.calculateOpportunityScore(last30Days);

    const strength =
      engagementScore * 0.3 +
      consistencyScore * 0.2 +
      momentumScore * 100 * 0.3 +
      sentimentScore * 0.1 +
      opportunityScore * 0.1;

    return Math.min(100, Math.max(0, strength));
  }

  static async buildBehaviorSummary(userId: string, prospectId: string): Promise<BehaviorSummary> {
    const { data: contact } = await supabase
      .from('social_contacts')
      .select('id')
      .eq('prospect_id', prospectId)
      .maybeSingle();

    if (!contact) {
      return this.getDefaultSummary(prospectId);
    }

    const timeline = await this.buildTimelineForContact(userId, contact.id);

    if (timeline.length === 0) {
      return this.getDefaultSummary(prospectId);
    }

    const last30d = timeline.slice(-30);
    const last90d = timeline.slice(-90);

    const last30dActivity = last30d.reduce((sum, t) => sum + t.interactions, 0);
    const last90dActivity = last90d.reduce((sum, t) => sum + t.interactions, 0);

    const first30dAvg = this.calculateAvgInteractions(last90d.slice(0, 30));
    const last30dAvg = this.calculateAvgInteractions(last30d);
    const last90dTrend = first30dAvg > 0 ? ((last30dAvg - first30dAvg) / first30dAvg) * 100 : 0;

    const momentumScore = this.computeMomentum(timeline);
    const opportunityPhase = this.detectOpportunityPhase(timeline);
    const timelineStrength = this.computeTimelineStrength(timeline);

    const recentSentimentScore =
      last30d.length > 0
        ? (last30d.reduce((sum, t) => sum + t.sentimentScore, 0) / last30d.length) * 50 + 50
        : 50;

    const recentOpportunitySignals = last30d.reduce((sum, t) => sum + t.opportunitySignalScore, 0);

    const momentumDirection: 'rising' | 'stable' | 'dropping' =
      momentumScore > 10 ? 'rising' : momentumScore < -10 ? 'dropping' : 'stable';

    const summary: BehaviorSummary = {
      prospectId,
      last30dActivity,
      last90dActivity,
      last90dTrend,
      momentumScore,
      recentSentimentScore,
      recentOpportunitySignals,
      timelineStrength,
      opportunityPhase,
      momentumDirection,
    };

    await this.storeBehaviorSummary(userId, summary);

    return summary;
  }

  private static async storeBehaviorSummary(userId: string, summary: BehaviorSummary): Promise<void> {
    await supabase
      .from('prospect_behavior_summary')
      .upsert(
        {
          prospect_id: summary.prospectId,
          user_id: userId,
          last_30d_activity: summary.last30dActivity,
          last_90d_activity: summary.last90dActivity,
          last_90d_trend: summary.last90dTrend,
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

  private static getDefaultSummary(prospectId: string): BehaviorSummary {
    return {
      prospectId,
      last30dActivity: 0,
      last90dActivity: 0,
      last90dTrend: 0,
      momentumScore: 0,
      recentSentimentScore: 50,
      recentOpportunitySignals: 0,
      timelineStrength: 0,
      momentumDirection: 'stable',
    };
  }

  private static calculateAvgInteractions(entries: TimelineEntry[]): number {
    if (entries.length === 0) return 0;
    const total = entries.reduce((sum, e) => sum + e.interactions, 0);
    return total / entries.length;
  }

  private static calculateEngagementScore(entries: TimelineEntry[]): number {
    const totalInteractions = entries.reduce((sum, e) => sum + e.interactions, 0);
    return Math.min((totalInteractions / entries.length) * 10, 100);
  }

  private static calculateConsistencyScore(entries: TimelineEntry[]): number {
    const activeDays = entries.filter(e => e.interactions > 0).length;
    return (activeDays / entries.length) * 100;
  }

  private static calculateSentimentScore(entries: TimelineEntry[]): number {
    if (entries.length === 0) return 50;
    const avgSentiment = entries.reduce((sum, e) => sum + e.sentimentScore, 0) / entries.length;
    return avgSentiment * 50 + 50;
  }

  private static calculateOpportunityScore(entries: TimelineEntry[]): number {
    const totalSignals = entries.reduce((sum, e) => sum + e.opportunitySignalScore, 0);
    return Math.min((totalSignals / entries.length) * 20, 100);
  }

  private static containsPainSignals(text: string): boolean {
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
      'gastos',
      'expense',
      'bayaran',
    ];

    return painKeywords.some(keyword => text.includes(keyword));
  }

  private static containsOpportunitySignals(text: string): boolean {
    const opportunityKeywords = [
      'business',
      'extra income',
      'sideline',
      'raket',
      'opportunity',
      'investment',
      'negosyo',
      'work from home',
      'online business',
      'entrepreneur',
      'insurance',
      'financial freedom',
      'passive income',
      'part time',
      'dagdag kita',
    ];

    return opportunityKeywords.some(keyword => text.includes(keyword));
  }

  private static getDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }
}
