import { supabase } from '../../lib/supabase';
import { ScoredProspect } from './scoutScoreEngine';

export async function saveResults(scanId: string, userId: string, prospects: ScoredProspect[]): Promise<void> {
  try {
    const items = prospects.map(prospect => ({
      scan_id: scanId,
      type: 'prospect',
      name: prospect.full_name,
      content: prospect.snippet,
      score: prospect.score,
      metadata: {
        bucket: prospect.bucket,
        confidence: prospect.confidence,
        top_factors: prospect.top_factors,
        explanation: prospect.explanation,
        pain_points: prospect.pain_points,
        interests: prospect.interests,
        life_events: prospect.life_events,
        sentiment: prospect.sentiment,
        opportunity_type: prospect.opportunity_type,
        urgency_level: prospect.urgency_level,
        signals: [...prospect.pain_points, ...prospect.interests],
      },
    }));

    const batchSize = 100;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const { error } = await supabase.from('scan_processed_items').insert(batch);

      if (error) {
        console.error(`Failed to insert batch ${i / batchSize + 1}:`, error);
        throw error;
      }
    }

    for (const prospect of prospects) {
      const { error: prospectError } = await supabase
        .from('prospects')
        .upsert({
          user_id: userId,
          full_name: prospect.full_name,
          snippet: prospect.snippet,
          scout_score: prospect.score,
          bucket: prospect.bucket,
          pain_points: prospect.pain_points,
          interests: prospect.interests,
          life_events: prospect.life_events,
          sentiment: prospect.sentiment,
          opportunity_type: prospect.opportunity_type,
          pipeline_stage: 'new',
          source_scan_id: scanId,
          metadata: {
            top_factors: prospect.top_factors,
            explanation: prospect.explanation,
            confidence: prospect.confidence,
            urgency_level: prospect.urgency_level,
          },
        }, {
          onConflict: 'user_id,full_name',
        });

      if (prospectError) {
        console.error(`Failed to upsert prospect ${prospect.full_name}:`, prospectError);
      }
    }

    console.log(`Successfully saved ${prospects.length} prospects for scan ${scanId}`);
  } catch (error) {
    console.error('Failed to save results:', error);
    throw error;
  }
}
