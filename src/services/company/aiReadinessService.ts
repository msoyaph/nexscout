import { supabase } from '../../lib/supabase';

export interface AIReadinessScore {
  grade: 'D' | 'C' | 'B' | 'A' | 'A+';
  percentage: number;
  level: number;
  missingItems: string[];
  completedItems: string[];
}

export async function calculateAIReadiness(userId: string): Promise<AIReadinessScore> {
  try {
    const [profileResult, assetsResult, personaResult] = await Promise.all([
      supabase.from('company_profiles').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('company_assets').select('id').eq('user_id', userId),
      supabase.from('company_personas').select('*').eq('user_id', userId).maybeSingle(),
    ]);

    const profile = profileResult.data;
    const assets = assetsResult.data || [];
    const persona = personaResult.data;

    const completedItems: string[] = [];
    const missingItems: string[] = [];

    if (profile?.company_name) completedItems.push('Company Name');
    else missingItems.push('Company Name');

    if (profile?.logo_url) completedItems.push('Company Logo');
    else missingItems.push('Company Logo');

    if (profile?.industry) completedItems.push('Industry');
    else missingItems.push('Industry');

    if (profile?.website) completedItems.push('Website');
    else missingItems.push('Website');

    if (profile?.description) completedItems.push('Description');
    else missingItems.push('Description');

    if (assets.length >= 1) completedItems.push('Materials Uploaded');
    else missingItems.push('Materials (Presentation/Brochure)');

    if (persona) completedItems.push('Persona Setup');
    else missingItems.push('Persona Setup');

    const totalItems = completedItems.length + missingItems.length;
    const percentage = Math.round((completedItems.length / totalItems) * 100);

    let grade: 'D' | 'C' | 'B' | 'A' | 'A+' = 'D';
    if (percentage >= 95) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 60) grade = 'B';
    else if (percentage >= 40) grade = 'C';

    const level = Math.min(10, Math.ceil((percentage / 100) * 10));

    return {
      grade,
      percentage,
      level,
      missingItems,
      completedItems,
    };
  } catch (error) {
    console.error('Calculate AI readiness error:', error);
    return {
      grade: 'D',
      percentage: 0,
      level: 0,
      missingItems: [],
      completedItems: [],
    };
  }
}

export function getGradeColor(grade: string): string {
  switch (grade) {
    case 'A+':
      return 'from-purple-600 to-pink-600';
    case 'A':
      return 'from-green-600 to-emerald-600';
    case 'B':
      return 'from-blue-600 to-cyan-600';
    case 'C':
      return 'from-yellow-600 to-orange-600';
    default:
      return 'from-red-600 to-rose-600';
  }
}

export function getGradeMessage(grade: string): string {
  switch (grade) {
    case 'A+':
      return 'Elite AI Trained! Your AI is at maximum intelligence.';
    case 'A':
      return 'Excellent! Your AI is highly trained and ready to perform.';
    case 'B':
      return 'Good progress! Add more materials to reach elite level.';
    case 'C':
      return 'Getting there! Upload more materials to improve AI accuracy.';
    default:
      return 'Your AI needs more training. Upload company materials now!';
  }
}

export async function trackAIReadinessImprovement(
  userId: string,
  action: string,
  improvementPercent: number
): Promise<void> {
  try {
    await supabase.from('company_ai_events').insert({
      user_id: userId,
      event_type: 'readiness_improvement',
      event_data: {
        action,
        improvement: improvementPercent,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Track AI readiness improvement error:', error);
  }
}
