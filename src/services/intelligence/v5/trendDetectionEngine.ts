import { supabase } from '../../../lib/supabase';

interface TrendData {
  trendName: string;
  trendType: 'product' | 'phrase' | 'objection' | 'competitor' | 'topic';
  engagementScore: number;
  growthRate: number;
  peakDate?: Date;
  trendStage: 'emerging' | 'growing' | 'peak' | 'declining';
  relatedKeywords: string[];
  industryFocus?: string;
  geographicFocus?: string;
}

export const trendDetectionEngine = {
  async detectTrends(params: {
    ownerType: string;
    ownerId?: string;
    days?: number;
  }): Promise<TrendData[]> {
    const { ownerType, ownerId, days = 30 } = params;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const productTrends = await this.detectProductTrends(ownerType, ownerId, startDate);
    const phraseTrends = await this.detectPhraseTrends(ownerType, ownerId, startDate);
    const objectionTrends = await this.detectObjectionTrends(ownerType, ownerId, startDate);

    return [...productTrends, ...phraseTrends, ...objectionTrends];
  },

  async detectProductTrends(ownerType: string, ownerId: string | undefined, startDate: Date): Promise<TrendData[]> {
    const { data: conversations } = await supabase
      .from('multi_agent_logs')
      .select('output_data, created_at')
      .gte('created_at', startDate.toISOString());

    const productMentions: Record<string, number[]> = {};

    (conversations || []).forEach(conv => {
      const products = conv.output_data?.recommendedProducts || [];
      products.forEach((p: any) => {
        const week = Math.floor((new Date(conv.created_at).getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
        if (!productMentions[p.name]) productMentions[p.name] = [];
        productMentions[p.name][week] = (productMentions[p.name][week] || 0) + 1;
      });
    });

    const trends: TrendData[] = [];

    Object.entries(productMentions).forEach(([productName, weeklyCounts]) => {
      if (weeklyCounts.length < 2) return;

      const growthRate = this.calculateGrowthRate(weeklyCounts);
      const engagementScore = weeklyCounts.reduce((sum, count) => sum + count, 0) / weeklyCounts.length;

      if (growthRate > 0.1 || engagementScore > 5) {
        trends.push({
          trendName: productName,
          trendType: 'product',
          engagementScore,
          growthRate,
          trendStage: this.determineTrendStage(weeklyCounts, growthRate),
          relatedKeywords: [productName]
        });
      }
    });

    return trends;
  },

  async detectPhraseTrends(ownerType: string, ownerId: string | undefined, startDate: Date): Promise<TrendData[]> {
    const { data: emotionalData } = await supabase
      .from('emotional_state_snapshots')
      .select('primary_emotion, created_at')
      .gte('created_at', startDate.toISOString());

    const phraseMentions: Record<string, number[]> = {};
    const weekCount = 4;

    (emotionalData || []).forEach(snap => {
      const week = Math.floor((new Date(snap.created_at).getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
      const emotion = snap.primary_emotion;
      if (!phraseMentions[emotion]) phraseMentions[emotion] = Array(weekCount).fill(0);
      if (week < weekCount) phraseMentions[emotion][week]++;
    });

    const trends: TrendData[] = [];

    Object.entries(phraseMentions).forEach(([phrase, weeklyCounts]) => {
      const growthRate = this.calculateGrowthRate(weeklyCounts);
      const engagementScore = weeklyCounts.reduce((sum, count) => sum + count, 0) / weeklyCounts.length;

      if (growthRate > 0.15 || engagementScore > 10) {
        trends.push({
          trendName: `${phrase} emotion trend`,
          trendType: 'phrase',
          engagementScore,
          growthRate,
          trendStage: this.determineTrendStage(weeklyCounts, growthRate),
          relatedKeywords: [phrase]
        });
      }
    });

    return trends;
  },

  async detectObjectionTrends(ownerType: string, ownerId: string | undefined, startDate: Date): Promise<TrendData[]> {
    const { data: agentLogs } = await supabase
      .from('multi_agent_logs')
      .select('output_data, created_at')
      .eq('agent_name', 'Analyzer')
      .gte('created_at', startDate.toISOString());

    const objectionCounts: Record<string, number[]> = {};
    const weekCount = 4;

    (agentLogs || []).forEach(log => {
      const objections = log.output_data?.objections || [];
      const week = Math.floor((new Date(log.created_at).getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));

      objections.forEach((obj: string) => {
        if (!objectionCounts[obj]) objectionCounts[obj] = Array(weekCount).fill(0);
        if (week < weekCount) objectionCounts[obj][week]++;
      });
    });

    const trends: TrendData[] = [];

    Object.entries(objectionCounts).forEach(([objection, weeklyCounts]) => {
      const growthRate = this.calculateGrowthRate(weeklyCounts);
      const engagementScore = weeklyCounts.reduce((sum, count) => sum + count, 0) / weeklyCounts.length;

      if (engagementScore > 3) {
        trends.push({
          trendName: objection,
          trendType: 'objection',
          engagementScore,
          growthRate,
          trendStage: this.determineTrendStage(weeklyCounts, growthRate),
          relatedKeywords: [objection]
        });
      }
    });

    return trends;
  },

  calculateGrowthRate(counts: number[]): number {
    if (counts.length < 2) return 0;

    const recent = counts[counts.length - 1] || 0;
    const previous = counts[counts.length - 2] || 0;

    if (previous === 0) return recent > 0 ? 1.0 : 0;

    return (recent - previous) / previous;
  },

  determineTrendStage(counts: number[], growthRate: number): 'emerging' | 'growing' | 'peak' | 'declining' {
    if (counts.length < 2) return 'emerging';

    if (growthRate > 0.5) return 'emerging';
    if (growthRate > 0.1) return 'growing';
    if (growthRate < -0.2) return 'declining';
    return 'peak';
  },

  async saveTrend(trend: TrendData, ownerType: string, ownerId?: string): Promise<void> {
    await supabase.from('market_trends').insert({
      trend_name: trend.trendName,
      trend_type: trend.trendType,
      engagement_score: trend.engagementScore,
      growth_rate: trend.growthRate,
      peak_date: trend.peakDate?.toISOString(),
      trend_stage: trend.trendStage,
      related_keywords: trend.relatedKeywords,
      industry_focus: trend.industryFocus,
      geographic_focus: trend.geographicFocus,
      owner_type: ownerType,
      owner_id: ownerId
    });
  },

  async getTrendingTopics(ownerType: string, ownerId?: string, limit: number = 10): Promise<TrendData[]> {
    let query = supabase
      .from('market_trends')
      .select('*')
      .eq('owner_type', ownerType)
      .in('trend_stage', ['emerging', 'growing', 'peak'])
      .order('engagement_score', { ascending: false })
      .limit(limit);

    if (ownerId) query = query.eq('owner_id', ownerId);

    const { data } = await query;

    return (data || []).map(t => ({
      trendName: t.trend_name,
      trendType: t.trend_type,
      engagementScore: t.engagement_score,
      growthRate: t.growth_rate,
      peakDate: t.peak_date ? new Date(t.peak_date) : undefined,
      trendStage: t.trend_stage,
      relatedKeywords: t.related_keywords || [],
      industryFocus: t.industry_focus,
      geographicFocus: t.geographic_focus
    }));
  }
};
