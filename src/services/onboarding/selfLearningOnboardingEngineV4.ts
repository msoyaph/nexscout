import { supabase } from '../../lib/supabase';
import { OnboardingPersona } from './onboardingPersonaEngine';
import { OnboardingVariant } from './onboardingExperimentEngine';

export type OnboardingStepId =
  | 'industry_selected'
  | 'product_added'
  | 'company_added'
  | 'chatbot_setup'
  | 'pipeline_setup'
  | 'first_lead_captured'
  | 'first_followup_sent'
  | 'enable_daily_missions'
  | 'team_recruiting_flow_setup'
  | 'product_catalog_upload'
  | 'first_scan_started';

interface FlowPattern {
  persona: OnboardingPersona;
  flow_id: string;
  steps: OnboardingStepId[];
  win_rate_7d: number;
  win_rate_30d: number;
  avg_time_to_first_win_minutes: number;
  sample_size: number;
  win_score: number;
  is_champion: boolean;
}

interface Journey {
  user_id: string;
  persona: OnboardingPersona;
  steps: OnboardingStepId[];
  activated_7d: boolean;
  retained_30d: boolean;
  time_to_first_win_minutes: number;
}

interface FlowAssignment {
  flow_id: string | null;
  variant: OnboardingVariant;
  mode: 'explore' | 'exploit';
  steps?: OnboardingStepId[];
}

export const selfLearningOnboardingEngineV4 = {
  async runNightlyLearningJob(): Promise<{
    success: boolean;
    patterns: number;
    champions: number;
    error?: string;
  }> {
    const jobId = await this.startLearningJob('nightly_analysis');

    try {
      const { data: journeys, error } = await supabase.rpc(
        'get_recent_onboarding_journeys'
      );

      if (error) throw error;

      if (!journeys || journeys.length === 0) {
        await this.completeLearningJob(jobId, 'completed', 0, 0);
        return { success: true, patterns: 0, champions: 0 };
      }

      const flowStats = this.aggregateFlows(journeys as Journey[]);

      let patternsDiscovered = 0;
      for (const pattern of flowStats) {
        await this.upsertFlowPattern(pattern);
        patternsDiscovered++;
      }

      const championsUpdated = await this.updateChampionFlows();

      await this.completeLearningJob(
        jobId,
        'completed',
        patternsDiscovered,
        championsUpdated
      );

      return {
        success: true,
        patterns: patternsDiscovered,
        champions: championsUpdated
      };
    } catch (error: any) {
      console.error('Error in nightly learning job:', error);
      await this.completeLearningJob(jobId, 'failed', 0, 0, error.message);
      return {
        success: false,
        patterns: 0,
        champions: 0,
        error: error.message
      };
    }
  },

  async assignFlowForUser(
    userId: string,
    persona: OnboardingPersona
  ): Promise<FlowAssignment> {
    try {
      const champion = await this.getChampionFlow(persona);
      const explorationFlow = await this.maybePickExplorationFlow(persona);

      const chosen = explorationFlow ?? champion;

      if (!chosen) {
        return {
          flow_id: null,
          variant: 'fast_track_90s',
          mode: 'exploit'
        };
      }

      const mode: 'explore' | 'exploit' = explorationFlow ? 'explore' : 'exploit';

      await supabase.from('onboarding_flow_assignments').upsert({
        user_id: userId,
        persona,
        flow_id: chosen.flow_id,
        assigned_at: new Date().toISOString(),
        mode
      });

      return {
        flow_id: chosen.flow_id,
        variant: (chosen.suggested_variant as OnboardingVariant) || 'fast_track_90s',
        mode,
        steps: chosen.steps
      };
    } catch (error) {
      console.error('Error assigning flow for user:', error);
      return {
        flow_id: null,
        variant: 'fast_track_90s',
        mode: 'exploit'
      };
    }
  },

  async recordOutcome(
    userId: string,
    outcome: 'activated' | 'upgraded' | 'retained_30d'
  ): Promise<void> {
    try {
      await supabase.rpc('record_onboarding_outcome', {
        p_user_id: userId,
        p_outcome: outcome
      });
    } catch (error) {
      console.error('Error recording outcome:', error);
    }
  },

  async getChampionFlow(
    persona: OnboardingPersona
  ): Promise<FlowPattern | null> {
    try {
      const { data, error } = await supabase
        .from('onboarding_flow_patterns')
        .select('*')
        .eq('persona', persona)
        .eq('is_champion', true)
        .limit(1);

      if (error) throw error;

      return data?.[0] || null;
    } catch (error) {
      console.error('Error getting champion flow:', error);
      return null;
    }
  },

  async maybePickExplorationFlow(
    persona: OnboardingPersona
  ): Promise<FlowPattern | null> {
    const epsilon = 0.2;

    if (Math.random() > epsilon) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('onboarding_flow_patterns')
        .select('*')
        .eq('persona', persona)
        .eq('is_champion', false)
        .order('exploration_priority', { ascending: false })
        .limit(3);

      if (error) throw error;

      if (!data || data.length === 0) {
        return null;
      }

      return data[Math.floor(Math.random() * data.length)];
    } catch (error) {
      console.error('Error picking exploration flow:', error);
      return null;
    }
  },

  async updateChampionFlows(): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('elect_champion_flows');

      if (error) throw error;

      return data?.length || 0;
    } catch (error) {
      console.error('Error updating champion flows:', error);
      return 0;
    }
  },

  aggregateFlows(journeys: Journey[]): FlowPattern[] {
    const flowMap = new Map<string, {
      persona: OnboardingPersona;
      steps: OnboardingStepId[];
      activated_7d_count: number;
      retained_30d_count: number;
      total_time_to_win: number;
      count: number;
      win_count: number;
    }>();

    for (const journey of journeys) {
      if (!journey.steps || journey.steps.length === 0) continue;

      const sortedSteps = [...journey.steps].sort();
      const flowKey = `${journey.persona}::${sortedSteps.join('>')}`;

      if (!flowMap.has(flowKey)) {
        flowMap.set(flowKey, {
          persona: journey.persona,
          steps: sortedSteps,
          activated_7d_count: 0,
          retained_30d_count: 0,
          total_time_to_win: 0,
          count: 0,
          win_count: 0
        });
      }

      const entry = flowMap.get(flowKey)!;
      entry.count += 1;
      entry.activated_7d_count += journey.activated_7d ? 1 : 0;
      entry.retained_30d_count += journey.retained_30d ? 1 : 0;
      entry.total_time_to_win +=
        journey.time_to_first_win_minutes || 0;

      if (journey.activated_7d) {
        entry.win_count += 1;
      }
    }

    const patterns: FlowPattern[] = [];

    for (const [flowKey, entry] of flowMap.entries()) {
      const win_rate_7d = entry.count > 0
        ? entry.activated_7d_count / entry.count
        : 0;
      const win_rate_30d = entry.count > 0
        ? entry.retained_30d_count / entry.count
        : 0;
      const avg_time_to_first_win = entry.win_count > 0
        ? entry.total_time_to_win / entry.win_count
        : 0;

      const win_score =
        win_rate_7d * 0.5 +
        win_rate_30d * 0.3 +
        (avg_time_to_first_win > 0
          ? (1 - Math.min(avg_time_to_first_win / 1440, 1)) * 0.2
          : 0);

      patterns.push({
        persona: entry.persona,
        flow_id: flowKey,
        steps: entry.steps,
        win_rate_7d,
        win_rate_30d,
        avg_time_to_first_win_minutes: avg_time_to_first_win,
        sample_size: entry.count,
        win_score,
        is_champion: false
      });
    }

    return patterns.sort((a, b) => b.win_score - a.win_score);
  },

  async upsertFlowPattern(pattern: FlowPattern): Promise<void> {
    try {
      const explorationPriority = pattern.sample_size < 10
        ? 1.0
        : pattern.sample_size < 30
        ? 0.5
        : 0.1;

      const { error } = await supabase
        .from('onboarding_flow_patterns')
        .upsert({
          persona: pattern.persona,
          flow_id: pattern.flow_id,
          steps: pattern.steps,
          win_rate_7d: pattern.win_rate_7d,
          win_rate_30d: pattern.win_rate_30d,
          avg_time_to_first_win_minutes: pattern.avg_time_to_first_win_minutes,
          sample_size: pattern.sample_size,
          win_score: pattern.win_score,
          exploration_priority: explorationPriority,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error upserting flow pattern:', error);
    }
  },

  async startLearningJob(jobType: string): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('onboarding_learning_jobs')
        .insert({
          job_type: jobType,
          status: 'running',
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return data.id;
    } catch (error) {
      console.error('Error starting learning job:', error);
      return '';
    }
  },

  async completeLearningJob(
    jobId: string,
    status: 'completed' | 'failed',
    patternsDiscovered: number,
    championsUpdated: number,
    errorMessage?: string
  ): Promise<void> {
    try {
      await supabase
        .from('onboarding_learning_jobs')
        .update({
          status,
          patterns_discovered: patternsDiscovered,
          champions_updated: championsUpdated,
          error_message: errorMessage || null,
          completed_at: new Date().toISOString()
        })
        .eq('id', jobId);
    } catch (error) {
      console.error('Error completing learning job:', error);
    }
  },

  async getAllFlowPatterns(
    persona?: OnboardingPersona
  ): Promise<FlowPattern[]> {
    try {
      let query = supabase
        .from('onboarding_flow_patterns')
        .select('*')
        .order('win_score', { ascending: false });

      if (persona) {
        query = query.eq('persona', persona);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting flow patterns:', error);
      return [];
    }
  },

  async getFlowPerformanceByPersona(): Promise<
    Record<string, FlowPattern[]>
  > {
    try {
      const { data, error } = await supabase
        .from('onboarding_flow_patterns')
        .select('*')
        .order('persona')
        .order('win_score', { ascending: false });

      if (error) throw error;

      const grouped: Record<string, FlowPattern[]> = {};

      for (const pattern of data || []) {
        if (!grouped[pattern.persona]) {
          grouped[pattern.persona] = [];
        }
        grouped[pattern.persona].push(pattern);
      }

      return grouped;
    } catch (error) {
      console.error('Error getting flow performance:', error);
      return {};
    }
  },

  async setExplorationRate(epsilon: number): Promise<void> {
    if (epsilon < 0 || epsilon > 1) {
      throw new Error('Exploration rate must be between 0 and 1');
    }
  },

  async getActivationTrendData(days: number = 90): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('onboarding_journey_metrics')
        .select('created_at, activated_7d')
        .gte(
          'created_at',
          new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
        )
        .order('created_at', { ascending: true });

      if (error) throw error;

      const dailyStats = new Map<string, { total: number; activated: number }>();

      for (const record of data || []) {
        const date = new Date(record.created_at).toISOString().split('T')[0];

        if (!dailyStats.has(date)) {
          dailyStats.set(date, { total: 0, activated: 0 });
        }

        const stats = dailyStats.get(date)!;
        stats.total += 1;
        if (record.activated_7d) {
          stats.activated += 1;
        }
      }

      return Array.from(dailyStats.entries()).map(([date, stats]) => ({
        date,
        total: stats.total,
        activated: stats.activated,
        activation_rate: stats.total > 0 ? stats.activated / stats.total : 0
      }));
    } catch (error) {
      console.error('Error getting activation trend:', error);
      return [];
    }
  }
};
