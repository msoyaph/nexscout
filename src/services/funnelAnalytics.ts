import { supabase } from '../lib/supabase';

// ============================================================
// TYPES & INTERFACES
// ============================================================

export interface FunnelStep {
  step_number: number;
  step_name: string;
  event_name: string;
  users_entered: number;
  users_completed: number;
  users_dropped: number;
  conversion_rate: number;
  avg_time_to_complete_ms: number;
  drop_off_rate: number;
}

export interface FunnelMetrics {
  funnel_id: string;
  funnel_name: string;
  total_entered: number;
  total_completed: number;
  overall_conversion_rate: number;
  avg_completion_time_ms: number;
  steps: FunnelStep[];
  bottleneck_step: number;
  biggest_drop_off: number;
}

export interface UserInFunnel {
  user_id: string;
  current_step: number;
  step_name: string;
  stuck_duration_hours: number;
  last_activity: string;
}

// ============================================================
// FUNNEL ANALYTICS SERVICE
// ============================================================

class FunnelAnalyticsService {
  // ============================================================
  // FUNNEL TRACKING
  // ============================================================

  async trackFunnelStep(
    userId: string,
    funnelName: string,
    stepNumber: number,
    stepName: string,
    completed: boolean = false
  ): Promise<void> {
    // Get funnel ID
    const { data: funnel } = await supabase
      .from('analytics_funnels')
      .select('id')
      .eq('funnel_name', funnelName)
      .single();

    if (!funnel) return;

    // Check if user already has this step recorded
    const { data: existing } = await supabase
      .from('analytics_funnel_steps')
      .select('*')
      .eq('user_id', userId)
      .eq('funnel_id', funnel.id)
      .eq('current_step', stepNumber)
      .single();

    if (existing) {
      // Update existing step
      if (completed && !existing.completed) {
        await supabase
          .from('analytics_funnel_steps')
          .update({
            completed: true,
            completed_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      }
    } else {
      // Insert new step
      const { data: previousStep } = await supabase
        .from('analytics_funnel_steps')
        .select('reached_at')
        .eq('user_id', userId)
        .eq('funnel_id', funnel.id)
        .eq('current_step', stepNumber - 1)
        .single();

      const timeToReach = previousStep
        ? Date.now() - new Date(previousStep.reached_at).getTime()
        : 0;

      await supabase.from('analytics_funnel_steps').insert({
        user_id: userId,
        funnel_id: funnel.id,
        current_step: stepNumber,
        step_name: stepName,
        reached_at: new Date().toISOString(),
        completed,
        completed_at: completed ? new Date().toISOString() : null,
        time_to_reach_ms: timeToReach,
      });
    }
  }

  async markFunnelDropOff(
    userId: string,
    funnelName: string,
    stepNumber: number,
    reason?: string
  ): Promise<void> {
    const { data: funnel } = await supabase
      .from('analytics_funnels')
      .select('id')
      .eq('funnel_name', funnelName)
      .single();

    if (!funnel) return;

    await supabase
      .from('analytics_funnel_steps')
      .update({
        dropped_off: true,
        drop_reason: reason,
      })
      .eq('user_id', userId)
      .eq('funnel_id', funnel.id)
      .eq('current_step', stepNumber);
  }

  // ============================================================
  // FUNNEL METRICS CALCULATION
  // ============================================================

  async calculateFunnelMetrics(
    funnelName: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<FunnelMetrics> {
    const { data: funnel } = await supabase
      .from('analytics_funnels')
      .select('*')
      .eq('funnel_name', funnelName)
      .single();

    if (!funnel) {
      throw new Error('Funnel not found');
    }

    const steps: any[] = funnel.steps;
    const funnelSteps: FunnelStep[] = [];

    let previousStepUsers = 0;

    for (let i = 0; i < steps.length; i++) {
      const stepNumber = i + 1;
      const stepName = steps[i];

      // Count users who reached this step
      const { count: usersEntered } = await supabase
        .from('analytics_funnel_steps')
        .select('*', { count: 'exact', head: true })
        .eq('funnel_id', funnel.id)
        .eq('current_step', stepNumber);

      // Count users who completed this step
      const { count: usersCompleted } = await supabase
        .from('analytics_funnel_steps')
        .select('*', { count: 'exact', head: true })
        .eq('funnel_id', funnel.id)
        .eq('current_step', stepNumber)
        .eq('completed', true);

      // Count dropped users
      const { count: usersDropped } = await supabase
        .from('analytics_funnel_steps')
        .select('*', { count: 'exact', head: true })
        .eq('funnel_id', funnel.id)
        .eq('current_step', stepNumber)
        .eq('dropped_off', true);

      // Calculate average time to complete
      const { data: timeData } = await supabase
        .from('analytics_funnel_steps')
        .select('time_to_reach_ms')
        .eq('funnel_id', funnel.id)
        .eq('current_step', stepNumber)
        .not('time_to_reach_ms', 'is', null);

      const avgTime =
        timeData && timeData.length > 0
          ? timeData.reduce((sum, d) => sum + (d.time_to_reach_ms || 0), 0) / timeData.length
          : 0;

      const entered = usersEntered || 0;
      const completed = usersCompleted || 0;
      const dropped = usersDropped || 0;

      const conversionRate = entered > 0 ? (completed / entered) * 100 : 0;
      const dropOffRate = entered > 0 ? (dropped / entered) * 100 : 0;

      funnelSteps.push({
        step_number: stepNumber,
        step_name: stepName,
        event_name: stepName,
        users_entered: entered,
        users_completed: completed,
        users_dropped: dropped,
        conversion_rate: conversionRate,
        avg_time_to_complete_ms: Math.round(avgTime),
        drop_off_rate: dropOffRate,
      });

      previousStepUsers = entered;
    }

    // Overall metrics
    const totalEntered = funnelSteps[0]?.users_entered || 0;
    const totalCompleted = funnelSteps[funnelSteps.length - 1]?.users_completed || 0;
    const overallConversionRate =
      totalEntered > 0 ? (totalCompleted / totalEntered) * 100 : 0;

    const avgCompletionTime =
      funnelSteps.reduce((sum, step) => sum + step.avg_time_to_complete_ms, 0) /
      funnelSteps.length;

    // Find bottleneck (lowest conversion rate)
    const bottleneckStep =
      funnelSteps.reduce((min, step) =>
        step.conversion_rate < min.conversion_rate ? step : min
      ).step_number;

    // Find biggest drop-off (highest drop-off rate)
    const biggestDropOff =
      funnelSteps.reduce((max, step) =>
        step.drop_off_rate > max.drop_off_rate ? step : max
      ).step_number;

    return {
      funnel_id: funnel.id,
      funnel_name: funnel.funnel_name,
      total_entered: totalEntered,
      total_completed: totalCompleted,
      overall_conversion_rate: overallConversionRate,
      avg_completion_time_ms: Math.round(avgCompletionTime),
      steps: funnelSteps,
      bottleneck_step: bottleneckStep,
      biggest_drop_off: biggestDropOff,
    };
  }

  // ============================================================
  // USER QUERIES
  // ============================================================

  async getUsersInFunnel(funnelName: string, stepNumber: number): Promise<UserInFunnel[]> {
    const { data: funnel } = await supabase
      .from('analytics_funnels')
      .select('id')
      .eq('funnel_name', funnelName)
      .single();

    if (!funnel) return [];

    const { data: steps } = await supabase
      .from('analytics_funnel_steps')
      .select('user_id, step_name, reached_at')
      .eq('funnel_id', funnel.id)
      .eq('current_step', stepNumber)
      .eq('completed', false)
      .eq('dropped_off', false);

    if (!steps) return [];

    return steps.map((step) => {
      const stuckDuration =
        (Date.now() - new Date(step.reached_at).getTime()) / (1000 * 60 * 60);

      return {
        user_id: step.user_id,
        current_step: stepNumber,
        step_name: step.step_name,
        stuck_duration_hours: Math.round(stuckDuration * 10) / 10,
        last_activity: step.reached_at,
      };
    });
  }

  async getUserFunnelProgress(userId: string, funnelName: string): Promise<any> {
    const { data: funnel } = await supabase
      .from('analytics_funnels')
      .select('*')
      .eq('funnel_name', funnelName)
      .single();

    if (!funnel) return null;

    const { data: steps } = await supabase
      .from('analytics_funnel_steps')
      .select('*')
      .eq('user_id', userId)
      .eq('funnel_id', funnel.id)
      .order('current_step', { ascending: true });

    const totalSteps = (funnel.steps as any[]).length;
    const completedSteps = steps?.filter((s) => s.completed).length || 0;
    const currentStep = steps?.[steps.length - 1]?.current_step || 0;

    return {
      funnel_name: funnel.funnel_name,
      total_steps: totalSteps,
      current_step: currentStep,
      completed_steps: completedSteps,
      progress_percentage: (completedSteps / totalSteps) * 100,
      steps: steps || [],
    };
  }

  // ============================================================
  // AGGREGATION & REPORTING
  // ============================================================

  async aggregateFunnelPerformance(funnelName: string, date: Date): Promise<void> {
    const { data: funnel } = await supabase
      .from('analytics_funnels')
      .select('*')
      .eq('funnel_name', funnelName)
      .single();

    if (!funnel) return;

    const steps: any[] = funnel.steps;

    for (let i = 0; i < steps.length; i++) {
      const stepNumber = i + 1;
      const stepName = steps[i];

      // Calculate metrics for this step on this date
      const dateStr = date.toISOString().split('T')[0];

      const { count: usersEntered } = await supabase
        .from('analytics_funnel_steps')
        .select('*', { count: 'exact', head: true })
        .eq('funnel_id', funnel.id)
        .eq('current_step', stepNumber)
        .gte('reached_at', `${dateStr}T00:00:00Z`)
        .lt('reached_at', `${dateStr}T23:59:59Z`);

      const { count: usersCompleted } = await supabase
        .from('analytics_funnel_steps')
        .select('*', { count: 'exact', head: true })
        .eq('funnel_id', funnel.id)
        .eq('current_step', stepNumber)
        .eq('completed', true)
        .gte('completed_at', `${dateStr}T00:00:00Z`)
        .lt('completed_at', `${dateStr}T23:59:59Z`);

      const { count: usersDropped } = await supabase
        .from('analytics_funnel_steps')
        .select('*', { count: 'exact', head: true })
        .eq('funnel_id', funnel.id)
        .eq('current_step', stepNumber)
        .eq('dropped_off', true);

      const entered = usersEntered || 0;
      const completed = usersCompleted || 0;
      const dropped = usersDropped || 0;
      const conversionRate = entered > 0 ? (completed / entered) : 0;

      // Upsert performance data
      await supabase
        .from('analytics_funnel_performance')
        .upsert({
          funnel_id: funnel.id,
          date: dateStr,
          step_number: stepNumber,
          step_name: stepName,
          users_entered: entered,
          users_completed: completed,
          users_dropped: dropped,
          conversion_rate: conversionRate,
          calculated_at: new Date().toISOString(),
        });
    }
  }

  // ============================================================
  // PREDEFINED FUNNEL HELPERS
  // ============================================================

  async trackActivationFunnel(userId: string, event: string): Promise<void> {
    const eventStepMap: Record<string, number> = {
      user_signed_up: 1,
      onboarding_completed: 2,
      prospect_scanned: 3,
      ai_message_generated: 4,
      prospect_added_pipeline: 5,
      dashboard_viewed: 6,
    };

    const stepNumber = eventStepMap[event];
    if (!stepNumber) return;

    await this.trackFunnelStep(userId, 'activation_funnel', stepNumber, event, true);
  }

  async trackConversionFunnel(userId: string, event: string): Promise<void> {
    const eventStepMap: Record<string, number> = {
      ai_limit_reached: 1,
      paywall_viewed: 2,
      upgrade_clicked: 3,
      subscription_upgraded: 4,
    };

    const stepNumber = eventStepMap[event];
    if (!stepNumber) return;

    await this.trackFunnelStep(userId, 'conversion_funnel', stepNumber, event, true);
  }

  async trackViralFunnel(userId: string, event: string): Promise<void> {
    const eventStepMap: Record<string, number> = {
      ai_deck_generated: 1,
      app_shared: 2,
      referral_link_opened: 3,
      user_signed_up: 4,
    };

    const stepNumber = eventStepMap[event];
    if (!stepNumber) return;

    await this.trackFunnelStep(userId, 'viral_loop_funnel', stepNumber, event, true);
  }
}

// ============================================================
// EXPORT SINGLETON
// ============================================================

export const funnelAnalytics = new FunnelAnalyticsService();
export type { FunnelMetrics, FunnelStep, UserInFunnel };
