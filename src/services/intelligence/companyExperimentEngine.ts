import { supabase } from '../../lib/supabase';

export interface CreateExperimentInput {
  userId: string;
  companyId?: string;
  name: string;
  experimentType: string;
  goal: string;
  variants: {
    label: string;
    contentType: string;
    contentId?: string;
    trafficSplit: number;
  }[];
}

export interface Experiment {
  id: string;
  name: string;
  status: string;
  variants: ExperimentVariant[];
}

export interface ExperimentVariant {
  id: string;
  label: string;
  impressions: number;
  primaryMetricValue: number;
  isWinner: boolean;
}

export async function createExperiment(input: CreateExperimentInput): Promise<{ success: boolean; experimentId?: string }> {
  try {
    const { data: experiment, error: expError } = await supabase
      .from('company_experiments')
      .insert({
        user_id: input.userId,
        company_id: input.companyId || null,
        name: input.name,
        experiment_type: input.experimentType,
        goal: input.goal,
        status: 'draft',
      })
      .select()
      .single();

    if (expError || !experiment) {
      return { success: false };
    }

    const variants = input.variants.map((v) => ({
      experiment_id: experiment.id,
      label: v.label,
      content_type: v.contentType,
      content_id: v.contentId || null,
      traffic_split: v.trafficSplit,
    }));

    const { error: varError } = await supabase.from('company_experiment_variants').insert(variants);

    if (varError) {
      return { success: false };
    }

    return { success: true, experimentId: experiment.id };
  } catch (error) {
    console.error('Create experiment error:', error);
    return { success: false };
  }
}

export async function getExperiments(userId: string): Promise<Experiment[]> {
  try {
    const { data, error } = await supabase
      .from('company_experiments')
      .select(`*, company_experiment_variants(*)`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((exp: any) => ({
      id: exp.id,
      name: exp.name,
      status: exp.status,
      variants: (exp.company_experiment_variants || []).map((v: any) => ({
        id: v.id,
        label: v.label,
        impressions: v.impressions,
        primaryMetricValue: v.primary_metric_value,
        isWinner: v.is_winner,
      })),
    }));
  } catch (error) {
    console.error('Get experiments error:', error);
    return [];
  }
}

export async function updateExperimentStatus(experimentId: string, status: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('company_experiments')
      .update({ status })
      .eq('id', experimentId);

    return !error;
  } catch (error) {
    console.error('Update experiment status error:', error);
    return false;
  }
}
