import { supabase } from '../../lib/supabase';

export type TimelineEventSource =
  | 'facebook'
  | 'instagram'
  | 'linkedin'
  | 'tiktok'
  | 'scanner'
  | 'browser_capture'
  | 'pipeline'
  | 'message'
  | 'system';

export type TimelineEventType =
  | 'post'
  | 'comment'
  | 'like'
  | 'reaction'
  | 'scan'
  | 'message_sent'
  | 'message_replied'
  | 'pitch_deck_generated'
  | 'pipeline_stage_change'
  | 'meeting_booked'
  | 'meeting_done'
  | 'payment_mentioned'
  | 'life_event'
  | 'emotion_peak';

export type TimelineEvent = {
  timestamp: string;
  source: TimelineEventSource;
  type: TimelineEventType;
  sentiment?: 'positive' | 'neutral' | 'negative';
  emotion?: string;
  opportunitySignal?: boolean;
  painPointSignal?: boolean;
  keywords?: string[];
  metadata?: any;
};

export type TrendDirection = 'warming_up' | 'cooling_down' | 'volatile' | 'stable';

export interface BehavioralTimelineResult {
  success: boolean;
  prospectId: string;
  userId: string;
  windowDays: number;
  events: TimelineEvent[];
  analytics: {
    trendDirection: TrendDirection;
    lastInteractionDaysAgo: number;
    opportunityMomentum: number;
    painPointIntensity: number;
    engagementMomentum: number;
  };
  explanation: string[];
}

const OPPORTUNITY_KEYWORDS = [
  'sideline',
  'raket',
  'extra income',
  'negosyo',
  'online selling',
  'business',
  'investment',
  'insurance',
  'financial advisor',
  'work from home',
  'passive income',
];

const PAIN_POINT_KEYWORDS = [
  'utang',
  'bills',
  'hospital',
  'rent',
  'sweldo kulang',
  'walang pera',
  'tuition',
  'medical',
  'emergency',
  'kailangan ng pera',
];

class BehavioralTimelineEngine {
  async buildBehavioralTimeline(input: {
    prospectId: string;
    userId: string;
    windowDays?: number;
  }): Promise<BehavioralTimelineResult> {
    const windowDays = input.windowDays || 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - windowDays);

    try {
      const events: TimelineEvent[] = [];

      await Promise.all([
        this.loadBrowserCaptureEvents(input.prospectId, input.userId, cutoffDate, events),
        this.loadScanEvents(input.prospectId, input.userId, cutoffDate, events),
        this.loadMessageEvents(input.prospectId, input.userId, cutoffDate, events),
        this.loadPipelineEvents(input.prospectId, input.userId, cutoffDate, events),
      ]);

      events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      const analytics = this.computeAnalytics(events, windowDays);
      const explanation = this.generateExplanation(events, analytics);

      return {
        success: true,
        prospectId: input.prospectId,
        userId: input.userId,
        windowDays,
        events,
        analytics,
        explanation,
      };
    } catch (error) {
      console.error('Behavioral timeline error:', error);
      return {
        success: false,
        prospectId: input.prospectId,
        userId: input.userId,
        windowDays,
        events: [],
        analytics: {
          trendDirection: 'stable',
          lastInteractionDaysAgo: 999,
          opportunityMomentum: 0,
          painPointIntensity: 0,
          engagementMomentum: 0,
        },
        explanation: ['Unable to build timeline'],
      };
    }
  }

  private async loadBrowserCaptureEvents(
    prospectId: string,
    userId: string,
    cutoffDate: Date,
    events: TimelineEvent[]
  ): Promise<void> {
    const { data: captures } = await supabase
      .from('browser_captures')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', cutoffDate.toISOString());

    if (captures) {
      captures.forEach((capture) => {
        const text = capture.text_content || '';
        const keywords = this.extractKeywords(text);

        events.push({
          timestamp: capture.created_at,
          source: capture.platform as TimelineEventSource,
          type: this.inferEventType(capture.capture_type),
          sentiment: this.analyzeSentiment(text),
          opportunitySignal: this.hasOpportunitySignal(text),
          painPointSignal: this.hasPainPointSignal(text),
          keywords,
          metadata: {
            captureId: capture.id,
            captureType: capture.capture_type,
            tags: capture.tags,
          },
        });
      });
    }
  }

  private async loadScanEvents(
    prospectId: string,
    userId: string,
    cutoffDate: Date,
    events: TimelineEvent[]
  ): Promise<void> {
    const { data: scans } = await supabase
      .from('smart_scans')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', cutoffDate.toISOString());

    if (scans) {
      scans.forEach((scan) => {
        events.push({
          timestamp: scan.created_at,
          source: 'scanner',
          type: 'scan',
          sentiment: 'neutral',
          metadata: {
            scanId: scan.id,
            sessionType: scan.session_type,
            sourceType: scan.source_type,
          },
        });
      });
    }
  }

  private async loadMessageEvents(
    prospectId: string,
    userId: string,
    cutoffDate: Date,
    events: TimelineEvent[]
  ): Promise<void> {
    const { data: messages } = await supabase
      .from('ai_generated_messages')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', cutoffDate.toISOString());

    if (messages) {
      messages.forEach((message) => {
        events.push({
          timestamp: message.created_at,
          source: 'system',
          type: 'message_sent',
          sentiment: 'neutral',
          metadata: {
            messageId: message.id,
            messageType: message.message_type,
            platform: message.platform,
          },
        });
      });
    }
  }

  private async loadPipelineEvents(
    prospectId: string,
    userId: string,
    cutoffDate: Date,
    events: TimelineEvent[]
  ): Promise<void> {
    const { data: prospects } = await supabase
      .from('prospects')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', cutoffDate.toISOString());

    if (prospects) {
      prospects.forEach((prospect) => {
        events.push({
          timestamp: prospect.created_at,
          source: 'pipeline',
          type: 'pipeline_stage_change',
          sentiment: 'neutral',
          metadata: {
            prospectId: prospect.id,
            stage: prospect.pipeline_stage || 'new',
          },
        });
      });
    }
  }

  private computeAnalytics(
    events: TimelineEvent[],
    windowDays: number
  ): BehavioralTimelineResult['analytics'] {
    const now = Date.now();
    const last30Days = now - 30 * 24 * 60 * 60 * 1000;
    const previous30Days = last30Days - 30 * 24 * 60 * 60 * 1000;

    const recentEvents = events.filter((e) => new Date(e.timestamp).getTime() > last30Days);
    const previousEvents = events.filter((e) => {
      const time = new Date(e.timestamp).getTime();
      return time > previous30Days && time <= last30Days;
    });

    const lastInteractionDaysAgo = events.length > 0
      ? Math.floor((now - new Date(events[events.length - 1].timestamp).getTime()) / (24 * 60 * 60 * 1000))
      : 999;

    const opportunityMomentum = this.calculateOpportunityMomentum(recentEvents);
    const painPointIntensity = this.calculatePainPointIntensity(recentEvents);
    const engagementMomentum = this.calculateEngagementMomentum(recentEvents);

    const recentScore = opportunityMomentum + engagementMomentum;
    const previousScore = this.calculateOpportunityMomentum(previousEvents) + this.calculateEngagementMomentum(previousEvents);

    const trendDirection = this.determineTrend(recentScore, previousScore, recentEvents.length);

    return {
      trendDirection,
      lastInteractionDaysAgo,
      opportunityMomentum: Math.round(opportunityMomentum),
      painPointIntensity: Math.round(painPointIntensity),
      engagementMomentum: Math.round(engagementMomentum),
    };
  }

  private calculateOpportunityMomentum(events: TimelineEvent[]): number {
    let score = 0;
    const now = Date.now();

    events.forEach((event) => {
      if (event.opportunitySignal) {
        const daysAgo = (now - new Date(event.timestamp).getTime()) / (24 * 60 * 60 * 1000);
        const recencyWeight = Math.max(0, 1 - daysAgo / 30);
        score += 10 * recencyWeight;
      }
    });

    return Math.min(100, score);
  }

  private calculatePainPointIntensity(events: TimelineEvent[]): number {
    let score = 0;
    const now = Date.now();

    events.forEach((event) => {
      if (event.painPointSignal) {
        const daysAgo = (now - new Date(event.timestamp).getTime()) / (24 * 60 * 60 * 1000);
        const recencyWeight = Math.max(0, 1 - daysAgo / 30);
        score += 15 * recencyWeight;
      }
    });

    return Math.min(100, score);
  }

  private calculateEngagementMomentum(events: TimelineEvent[]): number {
    let score = 0;
    const now = Date.now();

    const engagementTypes: TimelineEventType[] = ['comment', 'like', 'reaction', 'message_replied'];

    events.forEach((event) => {
      if (engagementTypes.includes(event.type)) {
        const daysAgo = (now - new Date(event.timestamp).getTime()) / (24 * 60 * 60 * 1000);
        const recencyWeight = Math.max(0, 1 - daysAgo / 30);
        score += 8 * recencyWeight;
      }
    });

    return Math.min(100, score);
  }

  private determineTrend(recentScore: number, previousScore: number, recentEventCount: number): TrendDirection {
    const delta = recentScore - previousScore;

    if (recentEventCount < 3) return 'stable';

    if (delta > 20) return 'warming_up';
    if (delta < -20) return 'cooling_down';
    if (Math.abs(delta) > 40 && recentEventCount > 10) return 'volatile';

    return 'stable';
  }

  private generateExplanation(events: TimelineEvent[], analytics: BehavioralTimelineResult['analytics']): string[] {
    const explanations: string[] = [];

    if (analytics.trendDirection === 'warming_up') {
      explanations.push('Prospect is showing increasing interest and engagement over the last 30 days');
    } else if (analytics.trendDirection === 'cooling_down') {
      explanations.push('Engagement is declining compared to previous period - may need re-engagement');
    } else if (analytics.trendDirection === 'volatile') {
      explanations.push('Highly variable engagement pattern - unpredictable but active');
    }

    if (analytics.opportunityMomentum > 60) {
      explanations.push('Strong and frequent opportunity signals detected - prime for outreach');
    }

    if (analytics.painPointIntensity > 60) {
      explanations.push('Multiple pain point indicators - financial or emotional stress present');
    }

    if (analytics.lastInteractionDaysAgo < 7) {
      explanations.push('Very recent activity - optimal timing for contact');
    } else if (analytics.lastInteractionDaysAgo > 30) {
      explanations.push('No recent activity for over a month - may need re-engagement strategy');
    }

    if (events.length > 20) {
      explanations.push(`High activity with ${events.length} events in timeline - engaged prospect`);
    }

    return explanations;
  }

  private inferEventType(captureType: string): TimelineEventType {
    const typeMap: Record<string, TimelineEventType> = {
      'friends_list': 'like',
      'post': 'post',
      'comment': 'comment',
      'profile': 'like',
    };

    return typeMap[captureType] || 'post';
  }

  private analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = ['happy', 'excited', 'great', 'good', 'salamat', 'thank'];
    const negativeWords = ['sad', 'angry', 'problema', 'hirap', 'stress', 'utang'];

    const lowerText = text.toLowerCase();
    let score = 0;

    positiveWords.forEach(word => {
      if (lowerText.includes(word)) score += 1;
    });

    negativeWords.forEach(word => {
      if (lowerText.includes(word)) score -= 1;
    });

    if (score > 0) return 'positive';
    if (score < 0) return 'negative';
    return 'neutral';
  }

  private hasOpportunitySignal(text: string): boolean {
    const lowerText = text.toLowerCase();
    return OPPORTUNITY_KEYWORDS.some(keyword => lowerText.includes(keyword));
  }

  private hasPainPointSignal(text: string): boolean {
    const lowerText = text.toLowerCase();
    return PAIN_POINT_KEYWORDS.some(keyword => lowerText.includes(keyword));
  }

  private extractKeywords(text: string): string[] {
    const lowerText = text.toLowerCase();
    const allKeywords = [...OPPORTUNITY_KEYWORDS, ...PAIN_POINT_KEYWORDS];

    return allKeywords.filter(keyword => lowerText.includes(keyword));
  }

  async getRecentOpportunitySpikes(prospectId: string, userId: string): Promise<TimelineEvent[]> {
    const result = await this.buildBehavioralTimeline({ prospectId, userId, windowDays: 30 });
    return result.events.filter(e => e.opportunitySignal);
  }

  async getRecentPainPointSpikes(prospectId: string, userId: string): Promise<TimelineEvent[]> {
    const result = await this.buildBehavioralTimeline({ prospectId, userId, windowDays: 30 });
    return result.events.filter(e => e.painPointSignal);
  }

  async getTrendSummary(prospectId: string, userId: string): Promise<BehavioralTimelineResult['analytics']> {
    const result = await this.buildBehavioralTimeline({ prospectId, userId, windowDays: 90 });
    return result.analytics;
  }
}

export const behavioralTimelineEngine = new BehavioralTimelineEngine();
