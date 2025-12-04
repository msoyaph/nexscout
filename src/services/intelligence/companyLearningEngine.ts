import { supabase } from '../../lib/supabase';
import { getCompanyEvents, getContentPerformance } from './aiEventLogger';

export interface CompanyPerformanceSummary {
  totalSent: number;
  totalReplies: number;
  totalMeetings: number;
  totalDeals: number;
  overallReplyRate: number;
  overallMeetingRate: number;
  topPerformingPatterns: PerformancePattern[];
  underperformingPatterns: PerformancePattern[];
  recommendations: string[];
}

export interface PerformancePattern {
  pattern: string;
  score: number;
  sampleCount: number;
  metrics: {
    replyRate: number;
    meetingRate: number;
  };
}

export interface LearningSignal {
  type: 'boost' | 'penalize' | 'neutral';
  pattern: string;
  strength: number;
  reason: string;
}

export interface PersonaAdjustment {
  adjustments: Record<string, any>;
  confidence: number;
  signals: LearningSignal[];
}

/**
 * Get company performance summary
 */
export async function getCompanyPerformanceSummary(
  userId: string,
  companyId?: string
): Promise<CompanyPerformanceSummary> {
  try {
    const events = await getCompanyEvents(userId, {
      companyId,
      limit: 10000,
    });

    const totalSent = events.filter((e) => e.eventType === 'sent').length;
    const totalReplies = events.filter((e) => e.eventType === 'replied').length;
    const totalMeetings = events.filter((e) => e.eventType === 'booked_meeting').length;
    const totalDeals = events.filter((e) => e.eventType === 'closed_deal').length;

    const overallReplyRate = totalSent > 0 ? (totalReplies / totalSent) * 100 : 0;
    const overallMeetingRate = totalSent > 0 ? (totalMeetings / totalSent) * 100 : 0;

    const patterns = await analyzePatterns(userId, companyId);
    const topPerforming = patterns.filter((p) => p.score > 0.7).slice(0, 5);
    const underperforming = patterns.filter((p) => p.score < 0.3).slice(0, 5);

    const recommendations = generateRecommendations(topPerforming, underperforming);

    return {
      totalSent,
      totalReplies,
      totalMeetings,
      totalDeals,
      overallReplyRate: Math.round(overallReplyRate * 10) / 10,
      overallMeetingRate: Math.round(overallMeetingRate * 10) / 10,
      topPerformingPatterns: topPerforming,
      underperformingPatterns: underperforming,
      recommendations,
    };
  } catch (error) {
    console.error('Get company performance summary error:', error);
    return {
      totalSent: 0,
      totalReplies: 0,
      totalMeetings: 0,
      totalDeals: 0,
      overallReplyRate: 0,
      overallMeetingRate: 0,
      topPerformingPatterns: [],
      underperformingPatterns: [],
      recommendations: [],
    };
  }
}

/**
 * Analyze patterns from events
 */
async function analyzePatterns(
  userId: string,
  companyId?: string
): Promise<PerformancePattern[]> {
  const events = await getCompanyEvents(userId, { companyId });

  const patternMap = new Map<string, { sent: number; replied: number; meetings: number }>();

  events.forEach((event) => {
    const pattern = event.metadata?.pattern || 'unknown';
    if (!patternMap.has(pattern)) {
      patternMap.set(pattern, { sent: 0, replied: 0, meetings: 0 });
    }

    const stats = patternMap.get(pattern)!;
    if (event.eventType === 'sent') stats.sent++;
    if (event.eventType === 'replied') stats.replied++;
    if (event.eventType === 'booked_meeting') stats.meetings++;
  });

  const patterns: PerformancePattern[] = [];

  patternMap.forEach((stats, pattern) => {
    const replyRate = stats.sent > 0 ? (stats.replied / stats.sent) * 100 : 0;
    const meetingRate = stats.sent > 0 ? (stats.meetings / stats.sent) * 100 : 0;
    const score = (replyRate + meetingRate * 2) / 300;

    patterns.push({
      pattern,
      score: Math.min(score, 1),
      sampleCount: stats.sent,
      metrics: {
        replyRate: Math.round(replyRate * 10) / 10,
        meetingRate: Math.round(meetingRate * 10) / 10,
      },
    });
  });

  return patterns.sort((a, b) => b.score - a.score);
}

/**
 * Generate learning signals
 */
export async function generateLearningSignals(
  userId: string,
  companyId?: string
): Promise<{ signals: LearningSignal[]; saved: number }> {
  try {
    const summary = await getCompanyPerformanceSummary(userId, companyId);
    const signals: LearningSignal[] = [];

    summary.topPerformingPatterns.forEach((pattern) => {
      signals.push({
        type: 'boost',
        pattern: pattern.pattern,
        strength: pattern.score,
        reason: `High performance: ${pattern.metrics.replyRate}% reply rate`,
      });
    });

    summary.underperformingPatterns.forEach((pattern) => {
      signals.push({
        type: 'penalize',
        pattern: pattern.pattern,
        strength: -pattern.score,
        reason: `Low performance: ${pattern.metrics.replyRate}% reply rate`,
      });
    });

    let saved = 0;
    for (const signal of signals) {
      const { error } = await supabase.from('company_persona_learning_logs').insert({
        user_id: userId,
        company_id: companyId || null,
        signal_type: signal.type,
        signal_strength: signal.strength,
        metadata: { pattern: signal.pattern, reason: signal.reason },
      });

      if (!error) saved++;
    }

    return { signals, saved };
  } catch (error) {
    console.error('Generate learning signals error:', error);
    return { signals: [], saved: 0 };
  }
}

/**
 * Get persona adjustments based on learning
 */
export async function getPersonaAdjustments(
  userId: string,
  personaId: string,
  companyId?: string
): Promise<PersonaAdjustment> {
  try {
    const { data, error } = await supabase
      .from('company_persona_learning_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('persona_id', personaId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error || !data) {
      return { adjustments: {}, confidence: 0, signals: [] };
    }

    const signals: LearningSignal[] = data.map((log) => ({
      type: log.signal_type,
      pattern: log.metadata?.pattern || 'unknown',
      strength: log.signal_strength,
      reason: log.metadata?.reason || 'No reason provided',
    }));

    const adjustments: Record<string, any> = {};
    let totalWeight = 0;

    signals.forEach((signal) => {
      const weight = Math.abs(signal.strength);
      totalWeight += weight;

      if (signal.type === 'boost' && signal.pattern.includes('short')) {
        adjustments.preferShortMessages = (adjustments.preferShortMessages || 0) + weight;
      }
      if (signal.type === 'boost' && signal.pattern.includes('story')) {
        adjustments.preferStoryBased = (adjustments.preferStoryBased || 0) + weight;
      }
      if (signal.type === 'penalize' && signal.pattern.includes('aggressive')) {
        adjustments.reducedAggression = (adjustments.reducedAggression || 0) + weight;
      }
    });

    const confidence = Math.min(totalWeight / 10, 1);

    return { adjustments, confidence, signals };
  } catch (error) {
    console.error('Get persona adjustments error:', error);
    return { adjustments: {}, confidence: 0, signals: [] };
  }
}

/**
 * Generate recommendations based on patterns
 */
function generateRecommendations(
  topPatterns: PerformancePattern[],
  underPatterns: PerformancePattern[]
): string[] {
  const recommendations: string[] = [];

  if (topPatterns.length > 0) {
    const best = topPatterns[0];
    if (best.pattern.includes('short')) {
      recommendations.push('Keep messages concise. Shorter messages are performing well.');
    }
    if (best.pattern.includes('story')) {
      recommendations.push('Story-based intros are resonating with your audience.');
    }
    if (best.pattern.includes('taglish')) {
      recommendations.push('Taglish messaging is connecting better with your prospects.');
    }
  }

  if (underPatterns.length > 0) {
    const worst = underPatterns[0];
    if (worst.pattern.includes('long')) {
      recommendations.push('Reduce message length. Long messages are underperforming.');
    }
    if (worst.pattern.includes('aggressive')) {
      recommendations.push('Tone down aggressive language. Consultative approach works better.');
    }
  }

  if (recommendations.length === 0) {
    recommendations.push('Keep testing different approaches to find what works best.');
  }

  return recommendations;
}
