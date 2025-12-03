import { supabase } from '../lib/supabase';

export interface Mission {
  id: string;
  title: string;
  description: string;
  coinReward: number;
  isCompleted: boolean;
}

const COMPANY_MISSIONS = [
  { id: 'upload_logo', title: 'Upload Company Logo', reward: 20 },
  { id: 'upload_presentation', title: 'Upload Company Presentation', reward: 40 },
  { id: 'upload_brochure', title: 'Upload Product Brochure', reward: 50 },
  { id: 'upload_website', title: 'Add Company Website', reward: 30 },
  { id: 'complete_persona', title: 'Complete Company Persona Setup', reward: 60 },
  { id: 'full_setup', title: 'Complete Full Company Setup', reward: 100 },
];

export async function getOnboardingProgress(userId: string) {
  const { data, error } = await supabase
    .from('company_onboarding_progress')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Get onboarding progress error:', error);
    return null;
  }

  return data;
}

export async function updateOnboardingStep(userId: string, step: string, completed: boolean) {
  const updates: any = { [`step_${step}_completed`]: completed };

  const { error } = await supabase
    .from('company_onboarding_progress')
    .upsert({ user_id: userId, ...updates }, { onConflict: 'user_id' });

  if (error) {
    console.error('Update onboarding step error:', error);
    return false;
  }

  return true;
}

export async function completeMission(userId: string, missionId: string): Promise<boolean> {
  try {
    const mission = COMPANY_MISSIONS.find((m) => m.id === missionId);
    if (!mission) return false;

    const { error } = await supabase.from('user_mission_progress').upsert({
      user_id: userId,
      mission_id: missionId,
      mission_type: 'company_onboarding',
      mission_title: mission.title,
      coin_reward: mission.reward,
      is_completed: true,
      completed_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Complete mission error:', error);
      return false;
    }

    await supabase.rpc('increment', {
      table_name: 'user_profiles',
      column_name: 'coins_balance',
      amount: mission.reward,
      row_id: userId,
    });

    return true;
  } catch (error) {
    console.error('Complete mission error:', error);
    return false;
  }
}

export async function getUserMissions(userId: string): Promise<Mission[]> {
  const { data, error } = await supabase
    .from('user_mission_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('mission_type', 'company_onboarding');

  if (error) {
    console.error('Get missions error:', error);
    return [];
  }

  const completedIds = new Set(data?.map((m) => m.mission_id) || []);

  return COMPANY_MISSIONS.map((mission) => ({
    id: mission.id,
    title: mission.title,
    description: '',
    coinReward: mission.reward,
    isCompleted: completedIds.has(mission.id),
  }));
}
