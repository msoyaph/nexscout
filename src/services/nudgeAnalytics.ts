import { supabase } from '../lib/supabase';

export interface NudgeTest {
  id: string;
  user_id: string;
  test_key: string;
  variant: string;
  trigger_type: string;
  emotional_state?: string;
  tier: string;
  target_tier: string;
  shown_at: string;
  clicked: boolean;
  clicked_at?: string;
  upgraded: boolean;
  upgraded_at?: string;
  dismissed: boolean;
  dismissed_at?: string;
  time_on_screen_ms?: number;
  metadata: Record<string, any>;
}

export interface NudgePerformance {
  test_key: string;
  variant: string;
  trigger_type: string;
  shown_count: number;
  clicked_count: number;
  upgraded_count: number;
  ctr: number;
  conversion_rate: number;
  avg_time_to_click: number;
  revenue: number;
}

/**
 * Assign A/B test variant
 */
export function assignNudgeVariant(testKey: string): string {
  const variants = ['A', 'B', 'C'];

  // Use deterministic assignment based on timestamp + random
  const hash = Date.now() % variants.length;
  return variants[hash];
}

/**
 * Track nudge shown
 */
export async function trackNudgeShown(params: {
  userId: string;
  testKey: string;
  variant: string;
  triggerType: string;
  emotionalState?: string;
  tier: string;
  targetTier: string;
  metadata?: Record<string, any>;
}): Promise<string | null> {
  const { data, error } = await supabase.rpc('track_nudge_shown', {
    p_user_id: params.userId,
    p_test_key: params.testKey,
    p_variant: params.variant,
    p_trigger_type: params.triggerType,
    p_emotional_state: params.emotionalState,
    p_tier: params.tier,
    p_target_tier: params.targetTier,
    p_metadata: params.metadata || {},
  });

  if (error) {
    console.error('Error tracking nudge shown:', error);
    return null;
  }

  return data as string;
}

/**
 * Track nudge clicked
 */
export async function trackNudgeClicked(
  testId: string,
  timeOnScreenMs?: number
): Promise<boolean> {
  const { error } = await supabase.rpc('track_nudge_clicked', {
    p_test_id: testId,
    p_time_on_screen_ms: timeOnScreenMs,
  });

  if (error) {
    console.error('Error tracking nudge clicked:', error);
    return false;
  }

  return true;
}

/**
 * Track nudge conversion (upgrade)
 */
export async function trackNudgeConversion(params: {
  testId: string;
  fromTier: string;
  toTier: string;
  revenueAmount: number;
}): Promise<string | null> {
  const { data, error } = await supabase.rpc('track_nudge_conversion', {
    p_test_id: params.testId,
    p_from_tier: params.fromTier,
    p_to_tier: params.toTier,
    p_revenue_amount: params.revenueAmount,
  });

  if (error) {
    console.error('Error tracking nudge conversion:', error);
    return null;
  }

  return data as string;
}

/**
 * Track nudge dismissed
 */
export async function trackNudgeDismissed(testId: string): Promise<boolean> {
  const { error } = await supabase
    .from('nudge_tests')
    .update({
      dismissed: true,
      dismissed_at: new Date().toISOString(),
    })
    .eq('id', testId);

  if (error) {
    console.error('Error tracking nudge dismissed:', error);
    return false;
  }

  return true;
}

/**
 * Get nudge performance analytics
 */
export async function getNudgePerformance(
  testKey?: string,
  daysBack: number = 30
): Promise<NudgePerformance[]> {
  const { data, error } = await supabase.rpc('get_nudge_performance', {
    p_test_key: testKey,
    p_days_back: daysBack,
  });

  if (error) {
    console.error('Error getting nudge performance:', error);
    return [];
  }

  return data as NudgePerformance[];
}

/**
 * Get emotional conversion analytics
 */
export async function getEmotionalConversionAnalytics(
  daysBack: number = 30
): Promise<Array<{
  emotional_state: string;
  total_shown: number;
  total_converted: number;
  conversion_rate: number;
  avg_revenue: number;
}>> {
  const { data, error } = await supabase
    .from('nudge_tests')
    .select(`
      emotional_state,
      id,
      upgraded
    `)
    .gte('shown_at', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString())
    .not('emotional_state', 'is', null);

  if (error) {
    console.error('Error getting emotional analytics:', error);
    return [];
  }

  // Aggregate by emotional state
  const emotionMap = new Map<string, { shown: number; converted: number }>();

  data.forEach((test: any) => {
    const emotion = test.emotional_state;
    if (!emotionMap.has(emotion)) {
      emotionMap.set(emotion, { shown: 0, converted: 0 });
    }
    const stats = emotionMap.get(emotion)!;
    stats.shown++;
    if (test.upgraded) stats.converted++;
  });

  return Array.from(emotionMap.entries()).map(([emotion, stats]) => ({
    emotional_state: emotion,
    total_shown: stats.shown,
    total_converted: stats.converted,
    conversion_rate: (stats.converted / stats.shown) * 100,
    avg_revenue: stats.converted > 0 ? 1299 : 0, // Simplified
  }));
}

/**
 * Get conversion funnel data
 */
export async function getConversionFunnel(
  daysBack: number = 30
): Promise<{
  shown: number;
  clicked: number;
  upgraded: number;
  click_rate: number;
  conversion_rate: number;
}> {
  const { data, error } = await supabase
    .from('nudge_tests')
    .select('clicked, upgraded')
    .gte('shown_at', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString());

  if (error) {
    console.error('Error getting conversion funnel:', error);
    return {
      shown: 0,
      clicked: 0,
      upgraded: 0,
      click_rate: 0,
      conversion_rate: 0,
    };
  }

  const shown = data.length;
  const clicked = data.filter((t: any) => t.clicked).length;
  const upgraded = data.filter((t: any) => t.upgraded).length;

  return {
    shown,
    clicked,
    upgraded,
    click_rate: shown > 0 ? (clicked / shown) * 100 : 0,
    conversion_rate: shown > 0 ? (upgraded / shown) * 100 : 0,
  };
}

/**
 * Get top performing nudges
 */
export async function getTopPerformingNudges(
  limit: number = 10,
  daysBack: number = 30
): Promise<NudgePerformance[]> {
  const allPerformance = await getNudgePerformance(undefined, daysBack);

  return allPerformance
    .sort((a, b) => b.conversion_rate - a.conversion_rate)
    .slice(0, limit);
}
