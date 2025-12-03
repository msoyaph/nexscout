import { supabase } from '../lib/supabase';

export interface ConversionEvent {
  userId: string;
  eventType: 'upgrade_initiated' | 'upgrade_completed' | 'upgrade_failed' | 'upgrade_abandoned';
  fromTier: string;
  toTier: string;
  offerId?: string;
  nudgeType?: string;
  emotionalState?: string;
  behaviorPattern?: string;
  surgeTriggered?: boolean;
  paymentAmount?: number;
  metadata?: any;
}

export interface ConversionFunnel {
  stage: string;
  count: number;
  percentage: number;
  dropoff?: number;
}

export async function trackConversion(event: ConversionEvent): Promise<void> {
  try {
    await supabase.from('conversion_events').insert({
      user_id: event.userId,
      event_type: event.eventType,
      from_tier: event.fromTier,
      to_tier: event.toTier,
      offer_id: event.offerId,
      nudge_type: event.nudgeType,
      emotional_state: event.emotionalState,
      behavior_pattern: event.behaviorPattern,
      surge_triggered: event.surgeTriggered,
      payment_amount: event.paymentAmount,
      metadata: event.metadata,
    });

    if (event.eventType === 'upgrade_completed' && event.offerId) {
      await supabase
        .from('upgrade_offer_events')
        .update({
          upgraded: true,
          upgraded_at: new Date().toISOString(),
        })
        .eq('id', event.offerId);
    }
  } catch (error) {
    console.error('Error tracking conversion:', error);
  }
}

export async function getConversionFunnel(
  userId?: string,
  days: number = 30
): Promise<ConversionFunnel[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  let query = supabase
    .from('conversion_events')
    .select('event_type')
    .gte('created_at', startDate.toISOString());

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data: events } = await query;

  if (!events) return [];

  const counts = {
    nudge_shown: 0,
    upgrade_initiated: 0,
    upgrade_completed: 0,
    upgrade_failed: 0,
    upgrade_abandoned: 0,
  };

  events.forEach((event) => {
    if (event.event_type in counts) {
      counts[event.event_type as keyof typeof counts]++;
    }
  });

  const { data: offers } = await supabase
    .from('upgrade_offer_events')
    .select('id')
    .gte('shown_at', startDate.toISOString());

  counts.nudge_shown = offers?.length || 0;

  const total = counts.nudge_shown || 1;

  return [
    {
      stage: 'Nudge Shown',
      count: counts.nudge_shown,
      percentage: 100,
    },
    {
      stage: 'Upgrade Initiated',
      count: counts.upgrade_initiated,
      percentage: (counts.upgrade_initiated / total) * 100,
      dropoff: counts.nudge_shown - counts.upgrade_initiated,
    },
    {
      stage: 'Upgrade Completed',
      count: counts.upgrade_completed,
      percentage: (counts.upgrade_completed / total) * 100,
      dropoff: counts.upgrade_initiated - counts.upgrade_completed,
    },
  ];
}

export async function getConversionRate(
  fromTier: string,
  toTier: string,
  days: number = 30
): Promise<number> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data: completed } = await supabase
    .from('conversion_events')
    .select('id')
    .eq('event_type', 'upgrade_completed')
    .eq('from_tier', fromTier)
    .eq('to_tier', toTier)
    .gte('created_at', startDate.toISOString());

  const { data: initiated } = await supabase
    .from('conversion_events')
    .select('id')
    .eq('event_type', 'upgrade_initiated')
    .eq('from_tier', fromTier)
    .eq('to_tier', toTier)
    .gte('created_at', startDate.toISOString());

  const completedCount = completed?.length || 0;
  const initiatedCount = initiated?.length || 1;

  return (completedCount / initiatedCount) * 100;
}

export async function getConversionByEmotion(
  days: number = 30
): Promise<Array<{ emotion: string; conversions: number; rate: number }>> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data: events } = await supabase
    .from('conversion_events')
    .select('emotional_state, event_type')
    .eq('event_type', 'upgrade_completed')
    .gte('created_at', startDate.toISOString());

  if (!events) return [];

  const emotionMap = new Map<string, number>();
  events.forEach((event) => {
    const emotion = event.emotional_state || 'unknown';
    emotionMap.set(emotion, (emotionMap.get(emotion) || 0) + 1);
  });

  const result = Array.from(emotionMap.entries()).map(([emotion, conversions]) => ({
    emotion,
    conversions,
    rate: (conversions / events.length) * 100,
  }));

  return result.sort((a, b) => b.conversions - a.conversions);
}

export async function getConversionBySurge(
  days: number = 30
): Promise<Array<{ surgeType: string; conversions: number; rate: number }>> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data: surgeEvents } = await supabase
    .from('surge_events')
    .select('surge_type, converted')
    .gte('detected_at', startDate.toISOString());

  if (!surgeEvents) return [];

  const surgeMap = new Map<string, { total: number; converted: number }>();

  surgeEvents.forEach((event) => {
    const current = surgeMap.get(event.surge_type) || { total: 0, converted: 0 };
    surgeMap.set(event.surge_type, {
      total: current.total + 1,
      converted: current.converted + (event.converted ? 1 : 0),
    });
  });

  return Array.from(surgeMap.entries()).map(([surgeType, data]) => ({
    surgeType,
    conversions: data.converted,
    rate: (data.converted / data.total) * 100,
  }));
}

export async function getAverageTimeToConversion(
  fromTier: string,
  toTier: string,
  days: number = 30
): Promise<number> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data: events } = await supabase
    .from('conversion_events')
    .select('user_id, event_type, created_at')
    .in('event_type', ['upgrade_initiated', 'upgrade_completed'])
    .eq('from_tier', fromTier)
    .eq('to_tier', toTier)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true });

  if (!events || events.length < 2) return 0;

  const userTimelines = new Map<string, { initiated?: Date; completed?: Date }>();

  events.forEach((event) => {
    const timeline = userTimelines.get(event.user_id) || {};

    if (event.event_type === 'upgrade_initiated') {
      timeline.initiated = new Date(event.created_at);
    } else if (event.event_type === 'upgrade_completed') {
      timeline.completed = new Date(event.created_at);
    }

    userTimelines.set(event.user_id, timeline);
  });

  const completionTimes: number[] = [];

  userTimelines.forEach((timeline) => {
    if (timeline.initiated && timeline.completed) {
      const diffMs = timeline.completed.getTime() - timeline.initiated.getTime();
      const diffMinutes = diffMs / (1000 * 60);
      completionTimes.push(diffMinutes);
    }
  });

  if (completionTimes.length === 0) return 0;

  const avgMinutes =
    completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length;

  return avgMinutes;
}

export async function getRevenueByNudgeType(
  days: number = 30
): Promise<Array<{ nudgeType: string; revenue: number; conversions: number }>> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data: events } = await supabase
    .from('conversion_events')
    .select('nudge_type, payment_amount')
    .eq('event_type', 'upgrade_completed')
    .gte('created_at', startDate.toISOString());

  if (!events) return [];

  const revenueMap = new Map<string, { revenue: number; conversions: number }>();

  events.forEach((event) => {
    const nudgeType = event.nudge_type || 'unknown';
    const current = revenueMap.get(nudgeType) || { revenue: 0, conversions: 0 };

    revenueMap.set(nudgeType, {
      revenue: current.revenue + (event.payment_amount || 499),
      conversions: current.conversions + 1,
    });
  });

  return Array.from(revenueMap.entries())
    .map(([nudgeType, data]) => ({
      nudgeType,
      revenue: data.revenue,
      conversions: data.conversions,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

export async function trackUpgradeJourney(userId: string): Promise<
  Array<{
    stage: string;
    timestamp: Date;
    metadata?: any;
  }>
> {
  const { data: events } = await supabase
    .from('conversion_events')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (!events) return [];

  return events.map((event) => ({
    stage: event.event_type,
    timestamp: new Date(event.created_at),
    metadata: {
      fromTier: event.from_tier,
      toTier: event.to_tier,
      emotionalState: event.emotional_state,
      surgeTriggered: event.surge_triggered,
    },
  }));
}

export function calculateROI(
  investmentCost: number,
  monthlyRevenue: number,
  months: number = 12
): {
  totalRevenue: number;
  netProfit: number;
  roi: number;
  paybackMonths: number;
} {
  const totalRevenue = monthlyRevenue * months;
  const netProfit = totalRevenue - investmentCost;
  const roi = (netProfit / investmentCost) * 100;
  const paybackMonths = Math.ceil(investmentCost / monthlyRevenue);

  return {
    totalRevenue,
    netProfit,
    roi,
    paybackMonths,
  };
}

export async function getTopConversionPaths(
  limit: number = 10,
  days: number = 30
): Promise<
  Array<{
    path: string;
    conversions: number;
    avgTimeToConvert: number;
  }>
> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data: events } = await supabase
    .from('conversion_events')
    .select('user_id, event_type, nudge_type, created_at')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true });

  if (!events) return [];

  const userPaths = new Map<string, { path: string[]; startTime: Date; endTime?: Date }>();

  events.forEach((event) => {
    const userPath = userPaths.get(event.user_id) || {
      path: [],
      startTime: new Date(event.created_at),
    };

    const step = `${event.nudge_type || 'unknown'}_${event.event_type}`;
    userPath.path.push(step);

    if (event.event_type === 'upgrade_completed') {
      userPath.endTime = new Date(event.created_at);
    }

    userPaths.set(event.user_id, userPath);
  });

  const pathStats = new Map<string, { count: number; totalTime: number }>();

  userPaths.forEach((userPath) => {
    if (!userPath.endTime) return;

    const pathKey = userPath.path.join(' → ');
    const timeToConvert = userPath.endTime.getTime() - userPath.startTime.getTime();
    const current = pathStats.get(pathKey) || { count: 0, totalTime: 0 };

    pathStats.set(pathKey, {
      count: current.count + 1,
      totalTime: current.totalTime + timeToConvert,
    });
  });

  const results = Array.from(pathStats.entries())
    .map(([path, stats]) => ({
      path,
      conversions: stats.count,
      avgTimeToConvert: stats.totalTime / stats.count / (1000 * 60),
    }))
    .sort((a, b) => b.conversions - a.conversions)
    .slice(0, limit);

  return results;
}
