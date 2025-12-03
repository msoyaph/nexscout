import { supabase } from '../../lib/supabase';
import { energyEngine } from '../energy/energyEngine';

/**
 * Energy Mission Rewards System
 * Awards energy for completing specific missions
 */

export interface EnergyMission {
  id: string;
  missionId: string;
  energyReward: number;
  description: string;
}

// Mission ID → Energy Reward mapping
const ENERGY_MISSION_REWARDS: Record<string, number> = {
  'send_3_messages': 1,
  'pipeline_update': 1,
  'share_to_facebook': 2,
  'complete_profile': 2,
  'first_scan': 1,
  'upload_5_prospects': 2,
  'generate_pitch_deck': 1,
  'daily_login': 1,
  'invite_team_member': 3,
  'complete_training': 2
};

/**
 * Award energy for mission completion
 */
export async function awardEnergyForMission(
  userId: string,
  missionId: string
): Promise<{ success: boolean; energyAwarded: number; error?: string }> {
  try {
    // Check if mission has energy reward
    const energyReward = ENERGY_MISSION_REWARDS[missionId];

    if (!energyReward) {
      return { success: true, energyAwarded: 0 };
    }

    // Check if user already received this reward today
    const alreadyAwarded = await checkMissionRewardToday(userId, missionId);
    if (alreadyAwarded) {
      return {
        success: false,
        energyAwarded: 0,
        error: 'Already received this reward today'
      };
    }

    // Award energy
    await energyEngine.addEnergy(
      userId,
      energyReward,
      'mission_reward',
      { mission_id: missionId }
    );

    // Record reward
    await supabase
      .from('energy_transactions')
      .insert({
        user_id: userId,
        event_type: 'mission_reward',
        energy_change: energyReward,
        reason: `Mission reward: ${missionId}`,
        metadata: { mission_id: missionId }
      });

    return { success: true, energyAwarded: energyReward };
  } catch (error: any) {
    console.error('Error awarding energy for mission:', error);
    return { success: false, energyAwarded: 0, error: error.message };
  }
}

/**
 * Check if user already received mission reward today
 */
async function checkMissionRewardToday(
  userId: string,
  missionId: string
): Promise<boolean> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('energy_transactions')
    .select('id')
    .eq('user_id', userId)
    .eq('event_type', 'mission_reward')
    .gte('created_at', today.toISOString())
    .filter('metadata->mission_id', 'eq', missionId)
    .maybeSingle();

  if (error) {
    console.error('Error checking mission reward:', error);
    return false;
  }

  return !!data;
}

/**
 * Get total energy earned from missions today
 */
export async function getTodayMissionEnergy(userId: string): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('energy_transactions')
    .select('energy_change')
    .eq('user_id', userId)
    .eq('event_type', 'mission_reward')
    .gte('created_at', today.toISOString());

  if (error) {
    console.error('Error getting mission energy:', error);
    return 0;
  }

  return data.reduce((sum, t) => sum + (t.energy_change || 0), 0);
}

/**
 * Get available missions with energy rewards
 */
export async function getEnergyMissions(userId: string): Promise<EnergyMission[]> {
  const missions: EnergyMission[] = [];

  for (const [missionId, energyReward] of Object.entries(ENERGY_MISSION_REWARDS)) {
    const alreadyAwarded = await checkMissionRewardToday(userId, missionId);

    if (!alreadyAwarded) {
      missions.push({
        id: missionId,
        missionId,
        energyReward,
        description: getMissionDescription(missionId)
      });
    }
  }

  return missions;
}

/**
 * Get human-readable mission description
 */
function getMissionDescription(missionId: string): string {
  const descriptions: Record<string, string> = {
    'send_3_messages': 'Send 3 messages to prospects',
    'pipeline_update': 'Update your pipeline',
    'share_to_facebook': 'Share NexScout to Facebook',
    'complete_profile': 'Complete your profile',
    'first_scan': 'Complete your first scan',
    'upload_5_prospects': 'Upload 5 prospects',
    'generate_pitch_deck': 'Generate a pitch deck',
    'daily_login': 'Login daily',
    'invite_team_member': 'Invite a team member',
    'complete_training': 'Complete training module'
  };

  return descriptions[missionId] || missionId;
}

/**
 * Hook into missions system - call this when mission completes
 */
export async function onMissionComplete(
  userId: string,
  missionId: string
): Promise<void> {
  const result = await awardEnergyForMission(userId, missionId);

  if (result.success && result.energyAwarded > 0) {
    console.log(`✅ Awarded ${result.energyAwarded} energy for mission: ${missionId}`);
  }
}
