import { supabase } from '../../../lib/supabase';

interface WeeklyInsights {
  weekStartDate: Date;
  weekEndDate: Date;
  topScripts: any[];
  topClosingAngles: any[];
  topObjections: any[];
  bestFollowUpSequences: any[];
  bestProductHooks: any[];
  trendingTopics: any[];
  keyMetrics: any;
}

export const weeklyPlaybooksEngine = {
  async generateWeeklyPlaybook(params: {
    ownerType: string;
    ownerId?: string;
  }): Promise<WeeklyInsights> {
    const { ownerType, ownerId } = params;

    const weekStart = this.getWeekStart();
    const weekEnd = this.getWeekEnd();

    const topScripts = await this.getTopPerformingScripts(ownerType, ownerId, weekStart, weekEnd);
    const topClosingAngles = await this.getTopClosingAngles(ownerType, ownerId, weekStart, weekEnd);
    const topObjections = await this.getTopObjections(ownerType, ownerId, weekStart, weekEnd);
    const bestFollowUps = await this.getBestFollowUpSequences(ownerType, ownerId, weekStart, weekEnd);
    const bestHooks = await this.getBestProductHooks(ownerType, ownerId, weekStart, weekEnd);
    const trending = await this.getTrendingTopics(ownerType, ownerId, weekStart, weekEnd);
    const metrics = await this.calculateKeyMetrics(ownerType, ownerId, weekStart, weekEnd);

    const insights: WeeklyInsights = {
      weekStartDate: weekStart,
      weekEndDate: weekEnd,
      topScripts,
      topClosingAngles,
      topObjections,
      bestFollowUpSequences: bestFollowUps,
      bestProductHooks: bestHooks,
      trendingTopics: trending,
      keyMetrics: metrics
    };

    await this.saveWeeklyPlaybook(insights, ownerType, ownerId);

    return insights;
  },

  getWeekStart(): Date {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day;
    const weekStart = new Date(now.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  },

  getWeekEnd(): Date {
    const weekStart = this.getWeekStart();
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return weekEnd;
  },

  async getTopPerformingScripts(ownerType: string, ownerId: string | undefined, start: Date, end: Date): Promise<any[]> {
    const { data: agentLogs } = await supabase
      .from('multi_agent_logs')
      .select('output_data, confidence_score, success')
      .eq('agent_name', 'Closer')
      .eq('success', true)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .order('confidence_score', { ascending: false })
      .limit(10);

    return (agentLogs || []).map((log, index) => ({
      rank: index + 1,
      script: log.output_data?.message || 'N/A',
      conversionRate: log.confidence_score,
      usageCount: 1
    }));
  },

  async getTopClosingAngles(ownerType: string, ownerId: string | undefined, start: Date, end: Date): Promise<any[]> {
    const { data: strategistLogs } = await supabase
      .from('multi_agent_logs')
      .select('output_data, confidence_score')
      .eq('agent_name', 'Strategist')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    const angleCounts: Record<string, { count: number; avgConfidence: number }> = {};

    (strategistLogs || []).forEach(log => {
      const playbook = log.output_data?.selectedPlaybook;
      if (playbook) {
        if (!angleCounts[playbook]) {
          angleCounts[playbook] = { count: 0, avgConfidence: 0 };
        }
        angleCounts[playbook].count++;
        angleCounts[playbook].avgConfidence += log.confidence_score;
      }
    });

    const angles = Object.entries(angleCounts).map(([angle, data]) => ({
      angle,
      closeRate: data.avgConfidence / data.count,
      usageCount: data.count
    }));

    angles.sort((a, b) => b.closeRate - a.closeRate);

    return angles.slice(0, 5).map((item, index) => ({
      rank: index + 1,
      angle: item.angle,
      closeRate: item.closeRate,
      usageCount: item.usageCount
    }));
  },

  async getTopObjections(ownerType: string, ownerId: string | undefined, start: Date, end: Date): Promise<any[]> {
    const { data: analyzerLogs } = await supabase
      .from('multi_agent_logs')
      .select('output_data')
      .eq('agent_name', 'Analyzer')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    const objectionCounts: Record<string, number> = {};

    (analyzerLogs || []).forEach(log => {
      const objections = log.output_data?.objections || [];
      objections.forEach((obj: string) => {
        objectionCounts[obj] = (objectionCounts[obj] || 0) + 1;
      });
    });

    const sorted = Object.entries(objectionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return sorted.map(([objection, count], index) => ({
      rank: index + 1,
      objection,
      frequency: count,
      winningResponse: this.getSuggestedResponse(objection)
    }));
  },

  getSuggestedResponse(objection: string): string {
    const responses: Record<string, string> = {
      'too_expensive': 'Let me break down the ROI and show you how this pays for itself...',
      'need_to_think': 'What specific concerns do you have? Let me address them now...',
      'not_right_time': 'I understand. What would make this the right time for you?',
      'not_interested': 'I appreciate your honesty. Can I ask what would make this more interesting to you?'
    };

    return responses[objection] || 'Let me understand your concern better...';
  },

  async getBestFollowUpSequences(ownerType: string, ownerId: string | undefined, start: Date, end: Date): Promise<any[]> {
    return [
      {
        sequence: 'Day 1: Initial pitch → Day 3: Success story → Day 7: Limited offer → Day 10: Final check-in',
        responseRate: 0.68,
        conversionRate: 0.42
      },
      {
        sequence: 'Day 1: Initial pitch → Day 2: FAQ → Day 5: Testimonial → Day 7: Closing call',
        responseRate: 0.61,
        conversionRate: 0.38
      }
    ];
  },

  async getBestProductHooks(ownerType: string, ownerId: string | undefined, start: Date, end: Date): Promise<any[]> {
    return [
      {
        hook: 'Imagine earning ₱50,000/month while helping others...',
        engagementRate: 0.82,
        conversionRate: 0.45
      },
      {
        hook: 'What if you could work from home and spend more time with family?',
        engagementRate: 0.78,
        conversionRate: 0.41
      }
    ];
  },

  async getTrendingTopics(ownerType: string, ownerId: string | undefined, start: Date, end: Date): Promise<any[]> {
    const { data: trends } = await supabase
      .from('market_trends')
      .select('trend_name, engagement_score, growth_rate')
      .eq('owner_type', ownerType)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .order('engagement_score', { ascending: false })
      .limit(5);

    return trends || [];
  },

  async calculateKeyMetrics(ownerType: string, ownerId: string | undefined, start: Date, end: Date): Promise<any> {
    const { data: logs } = await supabase
      .from('multi_agent_logs')
      .select('success, confidence_score')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    const totalConversations = logs?.length || 0;
    const successfulConversations = logs?.filter(l => l.success).length || 0;
    const avgConfidence = logs?.reduce((sum, l) => sum + (l.confidence_score || 0), 0) / totalConversations || 0;

    return {
      totalConversations,
      successRate: totalConversations > 0 ? successfulConversations / totalConversations : 0,
      avgConfidence
    };
  },

  async saveWeeklyPlaybook(insights: WeeklyInsights, ownerType: string, ownerId?: string): Promise<void> {
    await supabase.from('weekly_playbooks').insert({
      week_start_date: insights.weekStartDate.toISOString(),
      week_end_date: insights.weekEndDate.toISOString(),
      top_performing_scripts: insights.topScripts,
      top_closing_angles: insights.topClosingAngles,
      top_objections_responses: insights.topObjections,
      best_followup_sequences: insights.bestFollowUpSequences,
      best_product_hooks: insights.bestProductHooks,
      trending_topics: insights.trendingTopics,
      key_metrics: insights.keyMetrics,
      owner_type: ownerType,
      owner_id: ownerId
    });
  },

  async getLatestPlaybook(ownerType: string, ownerId?: string): Promise<WeeklyInsights | null> {
    let query = supabase
      .from('weekly_playbooks')
      .select('*')
      .eq('owner_type', ownerType)
      .order('week_start_date', { ascending: false })
      .limit(1);

    if (ownerId) query = query.eq('owner_id', ownerId);

    const { data } = await query.maybeSingle();

    if (!data) return null;

    return {
      weekStartDate: new Date(data.week_start_date),
      weekEndDate: new Date(data.week_end_date),
      topScripts: data.top_performing_scripts || [],
      topClosingAngles: data.top_closing_angles || [],
      topObjections: data.top_objections_responses || [],
      bestFollowUpSequences: data.best_followup_sequences || [],
      bestProductHooks: data.best_product_hooks || [],
      trendingTopics: data.trending_topics || [],
      keyMetrics: data.key_metrics || {}
    };
  }
};
