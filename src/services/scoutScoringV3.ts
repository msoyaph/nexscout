/**
 * ScoutScore V3 - CTA / Click Tracking & Conversion Heat Scoring
 * NEW IMPLEMENTATION: Tracks user interactions with CTAs, links, messages
 */
import { supabase } from '../lib/supabase';

export type CTAEventType = 
  | 'cta_clicked'
  | 'link_opened'
  | 'message_seen'
  | 'form_started'
  | 'form_submitted'
  | 'offer_viewed'
  | 'document_opened'
  | 'video_played';

export interface CTAEvent {
  type: CTAEventType;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface CTAHeatScoreInput {
  prospectId: string;
  userId: string;
  events?: CTAEvent[]; // Optional: can fetch from DB if not provided
  windowDays?: number; // How far back to look for events
}

export interface CTAHeatScoreResult {
  prospectId: string;
  userId: string;
  conversionHeatScore: number; // 0-100
  intentSignal: string | null;
  conversionLikelihood: number; // 0-100
  recommendedCTA: string | null;
  eventBreakdown: {
    ctaClicked: number;
    linkOpened: number;
    messageSeen: number;
    formStarted: number;
    formSubmitted: number;
    totalEvents: number;
  };
  insights: string[];
}

const EVENT_WEIGHTS: Record<CTAEventType, number> = {
  cta_clicked: 40,
  link_opened: 25,
  message_seen: 10,
  form_started: 30,
  form_submitted: 60,
  offer_viewed: 20,
  document_opened: 15,
  video_played: 35,
};

export class ScoutScoringV3Engine {
  async calculateCTAHeatScore(input: CTAHeatScoreInput): Promise<CTAHeatScoreResult> {
    const windowDays = input.windowDays || 30;
    const events = input.events || await this.fetchCTAEvents(input.prospectId, input.userId, windowDays);

    // Calculate base heat score from events
    const conversionHeatScore = this.calculateHeatScore(events);

    // Generate insights and recommendations
    const eventBreakdown = this.breakdownEvents(events);
    const intentSignal = this.determineIntentSignal(eventBreakdown);
    const conversionLikelihood = this.mapHeatToLikelihood(conversionHeatScore);
    const recommendedCTA = this.generateRecommendedCTA(conversionHeatScore, eventBreakdown);
    const insights = this.generateInsights(eventBreakdown, conversionHeatScore);

    return {
      prospectId: input.prospectId,
      userId: input.userId,
      conversionHeatScore,
      intentSignal,
      conversionLikelihood,
      recommendedCTA,
      eventBreakdown,
      insights,
    };
  }

  private async fetchCTAEvents(
    prospectId: string,
    userId: string,
    windowDays: number
  ): Promise<CTAEvent[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - windowDays);

      // Query prospect events table for CTA-related events
      // This assumes events are stored with event_type and metadata
      const { data: events, error } = await supabase
        .from('prospect_events')
        .select('*')
        .eq('prospect_id', prospectId)
        .eq('user_id', userId)
        .gte('created_at', cutoffDate.toISOString())
        .in('event_name', [
          'cta_clicked',
          'link_opened',
          'message_seen',
          'form_started',
          'form_submitted',
          'offer_viewed',
          'document_opened',
          'video_played'
        ])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching CTA events:', error);
        return [];
      }

      return (events || []).map(event => ({
        type: event.event_name as CTAEventType,
        timestamp: event.created_at,
        metadata: event.metadata || {},
      }));
    } catch (error) {
      console.error('Error in fetchCTAEvents:', error);
      return [];
    }
  }

  private calculateHeatScore(events: CTAEvent[]): number {
    if (events.length === 0) return 0;

    let totalScore = 0;

    events.forEach(event => {
      const weight = EVENT_WEIGHTS[event.type] || 0;
      totalScore += weight;
    });

    // Cap at 100, apply diminishing returns for many events
    const baseScore = Math.min(100, totalScore);
    
    // Bonus for multiple different event types (shows diverse engagement)
    const uniqueEventTypes = new Set(events.map(e => e.type)).size;
    const diversityBonus = Math.min(10, uniqueEventTypes * 2);

    return Math.min(100, baseScore + diversityBonus);
  }

  private breakdownEvents(events: CTAEvent[]) {
    return {
      ctaClicked: events.filter(e => e.type === 'cta_clicked').length,
      linkOpened: events.filter(e => e.type === 'link_opened').length,
      messageSeen: events.filter(e => e.type === 'message_seen').length,
      formStarted: events.filter(e => e.type === 'form_started').length,
      formSubmitted: events.filter(e => e.type === 'form_submitted').length,
      totalEvents: events.length,
    };
  }

  private determineIntentSignal(breakdown: ReturnType<typeof this.breakdownEvents>): string | null {
    if (breakdown.formSubmitted > 0) return 'cta_highly_engaged';
    if (breakdown.ctaClicked >= 2) return 'cta_engaged';
    if (breakdown.formStarted > 0) return 'cta_interested';
    if (breakdown.linkOpened >= 2) return 'link_only';
    if (breakdown.messageSeen > 0) return 'view_only';
    return null;
  }

  private mapHeatToLikelihood(heatScore: number): number {
    // Linear mapping with slight curve
    if (heatScore >= 80) return 90;
    if (heatScore >= 60) return 75;
    if (heatScore >= 40) return 55;
    if (heatScore >= 20) return 35;
    if (heatScore >= 10) return 20;
    return Math.round(heatScore);
  }

  private generateRecommendedCTA(
    heatScore: number,
    breakdown: ReturnType<typeof this.breakdownEvents>
  ): string | null {
    if (breakdown.formSubmitted > 0) return 'send_application_link';
    if (breakdown.formStarted > 0 && breakdown.formSubmitted === 0) return 'send_offer';
    if (breakdown.ctaClicked >= 2) return 'offer_call';
    if (breakdown.linkOpened >= 2) return 'send_offer';
    if (heatScore >= 60) return 'send_offer';
    if (heatScore >= 40) return 'send_application_link';
    if (heatScore >= 20) return 'offer_call';
    return null;
  }

  private generateInsights(
    breakdown: ReturnType<typeof this.breakdownEvents>,
    heatScore: number
  ): string[] {
    const insights: string[] = [];

    if (breakdown.formSubmitted > 0) {
      insights.push('Form submitted - high conversion intent');
    }

    if (breakdown.ctaClicked >= 3) {
      insights.push('Multiple CTA clicks - strong engagement');
    }

    if (breakdown.linkOpened >= 3) {
      insights.push('Multiple link opens - actively researching');
    }

    if (breakdown.formStarted > 0 && breakdown.formSubmitted === 0) {
      insights.push('Form started but not submitted - follow up needed');
    }

    if (heatScore >= 70) {
      insights.push('High conversion heat - ready for closing');
    } else if (heatScore >= 40) {
      insights.push('Moderate engagement - continue nurturing');
    } else if (breakdown.totalEvents === 0) {
      insights.push('No CTA interactions yet - initial engagement needed');
    }

    return insights;
  }
}

export const scoutScoringV3Engine = new ScoutScoringV3Engine();
