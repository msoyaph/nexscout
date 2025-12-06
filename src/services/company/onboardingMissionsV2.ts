import { supabase } from '../../lib/supabase';

export interface TieredMission {
  id: string;
  category: string;
  title: string;
  description: string;
  rewardFree: number;
  rewardPro: number;
  rewardElite: number;
  isCompleted: boolean;
  coinsEarned: number;
  userTier: string;
}

export interface MissionProgress {
  completed: number;
  total: number;
  percentComplete: number;
  totalCoinsEarned: number;
  potentialCoinsRemaining: number;
}

export async function getUserTier(userId: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('subscription_tier')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return 'free';

    return data.subscription_tier || 'free';
  } catch (error) {
    console.error('Get user tier error:', error);
    return 'free';
  }
}

export async function getCompanyOnboardingMissions(userId: string): Promise<TieredMission[]> {
  try {
    const [definitionsResult, progressResult, tier] = await Promise.all([
      supabase
        .from('mission_definitions')
        .select('*')
        .eq('category', 'company_onboarding')
        .eq('is_active', true)
        .order('sort_order'),
      supabase
        .from('user_mission_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('mission_type', 'company_onboarding'),
      getUserTier(userId),
    ]);

    if (definitionsResult.error) {
      console.error('Get mission definitions error:', definitionsResult.error);
      return [];
    }

    const completedMap = new Map(
      (progressResult.data || []).map((p) => [
        p.mission_id,
        { isCompleted: p.is_completed, coinsEarned: p.coins_earned || 0 },
      ])
    );

    return (definitionsResult.data || []).map((def) => {
      const progress = completedMap.get(def.id);
      return {
        id: def.id,
        category: def.category,
        title: def.title,
        description: def.description,
        rewardFree: def.reward_free,
        rewardPro: def.reward_pro,
        rewardElite: def.reward_elite,
        isCompleted: progress?.isCompleted || false,
        coinsEarned: progress?.coinsEarned || 0,
        userTier: tier,
      };
    });
  } catch (error) {
    console.error('Get company onboarding missions error:', error);
    return [];
  }
}

export function getCurrentReward(mission: TieredMission): number {
  const tier = mission.userTier.toLowerCase();
  if (tier === 'pro') return mission.rewardPro || mission.rewardElite; // Elite removed, use Pro rewards
  if (tier === 'pro') return mission.rewardPro;
  return mission.rewardFree;
}

export function getUpgradeReward(mission: TieredMission, targetTier: 'pro' | 'elite'): number {
  if (targetTier === 'pro') return mission.rewardPro || mission.rewardElite; // Elite removed, use Pro rewards
  if (targetTier === 'pro') return mission.rewardPro;
  return mission.rewardFree;
}

export async function completeTieredMission(
  userId: string,
  missionId: string
): Promise<{ success: boolean; coinsAwarded: number }> {
  try {
    const tier = await getUserTier(userId);

    const { data: missionDef, error: defError } = await supabase
      .from('mission_definitions')
      .select('*')
      .eq('id', missionId)
      .maybeSingle();

    if (defError || !missionDef) {
      return { success: false, coinsAwarded: 0 };
    }

    let coinsAwarded = missionDef.reward_free;
    if (tier === 'pro') coinsAwarded = missionDef.reward_pro;
    if (tier === 'pro') coinsAwarded = missionDef.reward_pro || missionDef.reward_elite; // Elite removed

    const { error: progressError } = await supabase.from('user_mission_progress').upsert(
      {
        user_id: userId,
        mission_id: missionId,
        mission_type: 'company_onboarding',
        mission_title: missionDef.title,
        coin_reward: coinsAwarded,
        reward_coins_free: missionDef.reward_free,
        reward_coins_pro: missionDef.reward_pro,
        reward_coins_elite: missionDef.reward_elite,
        coins_earned: coinsAwarded,
        user_tier: tier,
        is_completed: true,
        completed_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,mission_id' }
    );

    if (progressError) {
      console.error('Complete mission error:', progressError);
      return { success: false, coinsAwarded: 0 };
    }

    const { error: coinError } = await supabase.from('coin_transactions').insert({
      user_id: userId,
      amount: coinsAwarded,
      transaction_type: 'earned',
      description: `Completed: ${missionDef.title}`,
      source: 'mission_completion',
    });

    if (coinError) {
      console.error('Award coins error:', coinError);
    }

    const { error: updateError } = await supabase.rpc('increment_user_coins', {
      p_user_id: userId,
      p_amount: coinsAwarded,
    });

    if (updateError) {
      console.error('Update balance error:', updateError);
    }

    return { success: true, coinsAwarded };
  } catch (error) {
    console.error('Complete tiered mission error:', error);
    return { success: false, coinsAwarded: 0 };
  }
}

export async function getMissionProgress(userId: string): Promise<MissionProgress> {
  try {
    const missions = await getCompanyOnboardingMissions(userId);
    const completed = missions.filter((m) => m.isCompleted).length;
    const totalCoinsEarned = missions.reduce((sum, m) => sum + m.coinsEarned, 0);
    const potentialCoinsRemaining = missions
      .filter((m) => !m.isCompleted)
      .reduce((sum, m) => sum + getCurrentReward(m), 0);

    return {
      completed,
      total: missions.length,
      percentComplete: missions.length > 0 ? Math.round((completed / missions.length) * 100) : 0,
      totalCoinsEarned,
      potentialCoinsRemaining,
    };
  } catch (error) {
    console.error('Get mission progress error:', error);
    return {
      completed: 0,
      total: 0,
      percentComplete: 0,
      totalCoinsEarned: 0,
      potentialCoinsRemaining: 0,
    };
  }
}

export async function trackUpgradePrompt(
  userId: string,
  context: string,
  promptType: string
): Promise<void> {
  try {
    await supabase.from('upgrade_prompt_views').insert({
      user_id: userId,
      context,
      prompt_type: promptType,
    });
  } catch (error) {
    console.error('Track upgrade prompt error:', error);
  }
}
