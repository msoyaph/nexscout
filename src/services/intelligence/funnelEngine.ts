/**
 * Funnel Analytics Engine
 *
 * Track and analyze conversion funnels with drop-off detection
 */

import { supabase } from '../../lib/supabase';

export interface FunnelStep {
  step_number: number;
  step_name: string;
  event_name: string;
  required: boolean;
}

export interface FunnelDefinition {
  funnel_name: string;
  funnel_type: 'activation' | 'conversion' | 'churn' | 'viral';
  steps: FunnelStep[];
}

export interface FunnelAnalysis {
  funnel_name: string;
  total_entered: number;
  completed: number;
  completion_rate: number;
  steps: Array<{
    step_number: number;
    step_name: string;
    users_reached: number;
    drop_off_count: number;
    drop_off_rate: number;
    avg_time_to_next_step_seconds: number;
  }>;
  bottleneck_step: number;
  avg_completion_time_seconds: number;
}

class FunnelEngine {
  // Pre-defined funnels
  private funnels: FunnelDefinition[] = [
    {
      funnel_name: 'Activation',
      funnel_type: 'activation',
      steps: [
        { step_number: 1, step_name: 'Signup', event_name: 'user_signed_up', required: true },
        { step_number: 2, step_name: 'Onboarding', event_name: 'onboarding_completed', required: true },
        { step_number: 3, step_name: 'First Scan', event_name: 'prospect_scanned', required: true },
        { step_number: 4, step_name: 'Generate Message', event_name: 'ai_message_generated', required: false },
        { step_number: 5, step_name: 'Add to Pipeline', event_name: 'pipeline_stage_changed', required: false },
        { step_number: 6, step_name: 'Day 1 Return', event_name: 'user_logged_in', required: false },
      ],
    },
    {
      funnel_name: 'Conversion',
      funnel_type: 'conversion',
      steps: [
        { step_number: 1, step_name: 'Hit Limit', event_name: 'limit_reached', required: true },
        { step_number: 2, step_name: 'View Paywall', event_name: 'paywall_viewed', required: true },
        { step_number: 3, step_name: 'View Pricing', event_name: 'pricing_page_viewed', required: true },
        { step_number: 4, step_name: 'Start Checkout', event_name: 'checkout_started', required: true },
        { step_number: 5, step_name: 'Complete Upgrade', event_name: 'subscription_upgraded', required: true },
      ],
    },
    {
      funnel_name: 'Churn',
      funnel_type: 'churn',
      steps: [
        { step_number: 1, step_name: 'Active User', event_name: 'user_logged_in', required: true },
        { step_number: 2, step_name: '3 Days Inactive', event_name: 'inactivity_3d', required: false },
        { step_number: 3, step_name: '5 Days Inactive', event_name: 'inactivity_5d', required: false },
        { step_number: 4, step_name: '7 Days Inactive', event_name: 'inactivity_7d', required: false },
        { step_number: 5, step_name: 'Cancelled', event_name: 'subscription_cancelled', required: true },
      ],
    },
    {
      funnel_name: 'Viral',
      funnel_type: 'viral',
      steps: [
        { step_number: 1, step_name: 'Create Deck', event_name: 'ai_deck_generated', required: true },
        { step_number: 2, step_name: 'Share Content', event_name: 'app_shared', required: true },
        { step_number: 3, step_name: 'Referral Signup', event_name: 'referral_signup', required: true },
      ],
    },
  ];

  /**
   * Track funnel step completion
   */
  async trackFunnelStep(
    userId: string,
    funnelName: string,
    stepNumber: number,
    stepName: string,
    completed: boolean = true
  ): Promise<void> {
    const funnel = this.funnels.find(f => f.funnel_name === funnelName);
    if (!funnel) return;

    // Record step in analytics_funnel_steps (using existing analytics_events table)
    await supabase.from('analytics_events_v2').insert({
      user_id: userId,
      session_id: this.getSessionId(),
      event_name: `funnel_${funnelName.toLowerCase()}_step_${stepNumber}`,
      page: funnelName,
      properties: {
        funnel_name: funnelName,
        step_number: stepNumber,
        step_name: stepName,
        completed: completed,
      },
    });
  }

  /**
   * Analyze funnel performance
   */
  async analyzeFunnel(funnelName: string, days: number = 30): Promise<FunnelAnalysis> {
    const funnel = this.funnels.find(f => f.funnel_name === funnelName);
    if (!funnel) {
      throw new Error(`Funnel ${funnelName} not found`);
    }

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // Get all events for this funnel
    const { data: events } = await supabase
      .from('analytics_events_v2')
      .select('user_id, event_name, timestamp, properties')
      .gte('timestamp', startDate)
      .order('timestamp', { ascending: true });

    if (!events || events.length === 0) {
      return this.emptyAnalysis(funnelName);
    }

    // Group by user and analyze progression
    const userJourneys = this.groupEventsByUser(events, funnel);

    // Calculate step metrics
    const stepMetrics = this.calculateStepMetrics(userJourneys, funnel);

    // Find bottleneck (highest drop-off rate)
    const bottleneck = stepMetrics.reduce((max, step) =>
      step.drop_off_rate > max.drop_off_rate ? step : max
    );

    const totalEntered = userJourneys.size;
    const completed = Array.from(userJourneys.values()).filter(
      journey => journey.length === funnel.steps.length
    ).length;

    return {
      funnel_name: funnelName,
      total_entered: totalEntered,
      completed: completed,
      completion_rate: totalEntered > 0 ? (completed / totalEntered) * 100 : 0,
      steps: stepMetrics,
      bottleneck_step: bottleneck.step_number,
      avg_completion_time_seconds: this.calculateAvgCompletionTime(userJourneys),
    };
  }

  /**
   * Get funnel analysis for all funnels
   */
  async analyzeAllFunnels(days: number = 30): Promise<FunnelAnalysis[]> {
    const analyses: FunnelAnalysis[] = [];

    for (const funnel of this.funnels) {
      const analysis = await this.analyzeFunnel(funnel.funnel_name, days);
      analyses.push(analysis);
    }

    return analyses;
  }

  /**
   * Get users who dropped off at a specific step
   */
  async getUsersAtStep(
    funnelName: string,
    stepNumber: number,
    droppedOff: boolean = true,
    limit: number = 100
  ): Promise<string[]> {
    const funnel = this.funnels.find(f => f.funnel_name === funnelName);
    if (!funnel) return [];

    const { data: events } = await supabase
      .from('analytics_events_v2')
      .select('user_id, properties')
      .ilike('event_name', `%funnel_${funnelName.toLowerCase()}%`)
      .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .limit(1000);

    if (!events) return [];

    const userSteps = new Map<string, number>();

    events.forEach(event => {
      const props = event.properties as any;
      if (props?.step_number) {
        const currentMax = userSteps.get(event.user_id) || 0;
        userSteps.set(event.user_id, Math.max(currentMax, props.step_number));
      }
    });

    const users: string[] = [];
    for (const [userId, maxStep] of userSteps.entries()) {
      if (droppedOff && maxStep === stepNumber && maxStep < funnel.steps.length) {
        users.push(userId);
      } else if (!droppedOff && maxStep >= stepNumber) {
        users.push(userId);
      }

      if (users.length >= limit) break;
    }

    return users;
  }

  /**
   * Compare funnel performance by segment
   */
  async compareFunnelBySegment(
    funnelName: string,
    segmentField: 'subscription_tier' | 'device_type',
    days: number = 30
  ): Promise<Record<string, FunnelAnalysis>> {
    const funnel = this.funnels.find(f => f.funnel_name === funnelName);
    if (!funnel) return {};

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data: events } = await supabase
      .from('analytics_events_v2')
      .select('user_id, event_name, timestamp, properties, subscription_tier, device_info')
      .gte('timestamp', startDate)
      .order('timestamp', { ascending: true });

    if (!events) return {};

    // Group by segment
    const segments: Record<string, any[]> = {};
    events.forEach(event => {
      let segmentValue = 'unknown';
      if (segmentField === 'subscription_tier') {
        segmentValue = event.subscription_tier || 'free';
      } else if (segmentField === 'device_type') {
        segmentValue = (event.device_info as any)?.device_type || 'unknown';
      }

      if (!segments[segmentValue]) segments[segmentValue] = [];
      segments[segmentValue].push(event);
    });

    // Analyze each segment
    const results: Record<string, FunnelAnalysis> = {};
    for (const [segment, segmentEvents] of Object.entries(segments)) {
      const userJourneys = this.groupEventsByUser(segmentEvents, funnel);
      const stepMetrics = this.calculateStepMetrics(userJourneys, funnel);

      const totalEntered = userJourneys.size;
      const completed = Array.from(userJourneys.values()).filter(
        journey => journey.length === funnel.steps.length
      ).length;

      const bottleneck = stepMetrics.reduce((max, step) =>
        step.drop_off_rate > max.drop_off_rate ? step : max
      );

      results[segment] = {
        funnel_name: `${funnelName} (${segment})`,
        total_entered: totalEntered,
        completed: completed,
        completion_rate: totalEntered > 0 ? (completed / totalEntered) * 100 : 0,
        steps: stepMetrics,
        bottleneck_step: bottleneck.step_number,
        avg_completion_time_seconds: this.calculateAvgCompletionTime(userJourneys),
      };
    }

    return results;
  }

  /**
   * Group events by user
   */
  private groupEventsByUser(events: any[], funnel: FunnelDefinition): Map<string, any[]> {
    const userJourneys = new Map<string, any[]>();

    events.forEach(event => {
      const props = event.properties as any;
      if (props?.funnel_name === funnel.funnel_name) {
        if (!userJourneys.has(event.user_id)) {
          userJourneys.set(event.user_id, []);
        }
        userJourneys.get(event.user_id)!.push(event);
      }
    });

    return userJourneys;
  }

  /**
   * Calculate step metrics
   */
  private calculateStepMetrics(userJourneys: Map<string, any[]>, funnel: FunnelDefinition): any[] {
    const stepCounts = Array(funnel.steps.length).fill(0);
    const stepTimes = Array(funnel.steps.length).fill(0).map(() => [] as number[]);

    for (const journey of userJourneys.values()) {
      const sortedJourney = journey.sort((a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      for (let i = 0; i < sortedJourney.length; i++) {
        const event = sortedJourney[i];
        const stepNum = (event.properties as any)?.step_number - 1;

        if (stepNum >= 0 && stepNum < stepCounts.length) {
          stepCounts[stepNum]++;

          // Calculate time to next step
          if (i < sortedJourney.length - 1) {
            const nextEvent = sortedJourney[i + 1];
            const timeDiff = (new Date(nextEvent.timestamp).getTime() - new Date(event.timestamp).getTime()) / 1000;
            stepTimes[stepNum].push(timeDiff);
          }
        }
      }
    }

    return funnel.steps.map((step, index) => {
      const usersReached = stepCounts[index];
      const usersFromPrevious = index > 0 ? stepCounts[index - 1] : userJourneys.size;
      const dropOff = usersFromPrevious - usersReached;
      const avgTime = stepTimes[index].length > 0
        ? stepTimes[index].reduce((a, b) => a + b, 0) / stepTimes[index].length
        : 0;

      return {
        step_number: step.step_number,
        step_name: step.step_name,
        users_reached: usersReached,
        drop_off_count: dropOff,
        drop_off_rate: usersFromPrevious > 0 ? (dropOff / usersFromPrevious) * 100 : 0,
        avg_time_to_next_step_seconds: Math.round(avgTime),
      };
    });
  }

  /**
   * Calculate average completion time
   */
  private calculateAvgCompletionTime(userJourneys: Map<string, any[]>): number {
    const completionTimes: number[] = [];

    for (const journey of userJourneys.values()) {
      if (journey.length < 2) continue;

      const sorted = journey.sort((a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      const first = new Date(sorted[0].timestamp).getTime();
      const last = new Date(sorted[sorted.length - 1].timestamp).getTime();
      completionTimes.push((last - first) / 1000);
    }

    return completionTimes.length > 0
      ? Math.round(completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length)
      : 0;
  }

  /**
   * Empty analysis template
   */
  private emptyAnalysis(funnelName: string): FunnelAnalysis {
    return {
      funnel_name: funnelName,
      total_entered: 0,
      completed: 0,
      completion_rate: 0,
      steps: [],
      bottleneck_step: 1,
      avg_completion_time_seconds: 0,
    };
  }

  /**
   * Get session ID (stub - should use real session)
   */
  private getSessionId(): string {
    return `session_${Date.now()}`;
  }
}

export const funnelEngine = new FunnelEngine();
