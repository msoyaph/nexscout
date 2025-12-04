import { supabase } from '../../lib/supabase';

export async function recordLearning(
  userId: string,
  scanId: string,
  prospectIds: string[]
): Promise<void> {
  const { data: profile } = await supabase
    .from('ai_learning_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  const newStats = {
    total_scans: (profile?.total_scans || 0) + 1,
    total_prospects_discovered: (profile?.total_prospects_discovered || 0) + prospectIds.length,
    avg_prospects_per_scan:
      ((profile?.total_prospects_discovered || 0) + prospectIds.length) /
      ((profile?.total_scans || 0) + 1),
  };

  await supabase.from('ai_learning_profiles').upsert({
    user_id: userId,
    ...newStats,
    learning_data: {
      ...(profile?.learning_data || {}),
      last_scan_id: scanId,
      last_scan_timestamp: new Date().toISOString(),
    },
  });

  await supabase.from('scan_queue').update({ status: 'completed' }).eq('scan_id', scanId);
}

export async function getLearningProfile(userId: string) {
  const { data } = await supabase
    .from('ai_learning_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  return data;
}
