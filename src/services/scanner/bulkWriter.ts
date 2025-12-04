import { SupabaseClient } from '@supabase/supabase-js';
import { ScoredProspect } from './parallelScoring';

export interface BulkWriteResult {
  scanItemsInserted: number;
  prospectsInserted: number;
  errors: string[];
}

export async function bulkWriteScanItems(
  supabase: SupabaseClient,
  scanId: string,
  prospects: ScoredProspect[]
): Promise<number> {
  const items = prospects.map(p => ({
    scan_id: scanId,
    type: 'text',
    name: p.full_name,
    content: p.snippet,
    score: p.score,
    metadata: {
      bucket: p.bucket,
      confidence: p.confidence,
      top_factors: p.top_factors,
      pain_points: p.pain_points,
      interests: p.interests,
      sentiment: p.sentiment,
      opportunity_type: p.opportunity_type,
      signals: [...p.pain_points, ...p.interests],
    },
  }));

  const { error } = await supabase.from('scan_processed_items').insert(items);

  if (error) {
    console.error('Failed to bulk insert scan items:', error);
    throw new Error(`Failed to save scan items: ${error.message}`);
  }

  return items.length;
}

export async function bulkWriteProspects(
  supabase: SupabaseClient,
  scanId: string,
  userId: string,
  prospects: ScoredProspect[]
): Promise<number> {
  const prospectRecords = prospects.map(p => ({
    user_id: userId,
    full_name: p.full_name,
    bio_text: p.snippet,
    platform: p.platform || 'other',
    metadata: {
      scout_score: p.score,
      bucket: p.bucket,
      temperature: p.bucket,
      tags: [...p.pain_points, ...p.interests],
      pain_points: p.pain_points,
      interests: p.interests,
      scan_id: scanId,
      scan_source: 'csv-fast-scan'
    }
  }));

  const { error } = await supabase.from('prospects').insert(prospectRecords);

  if (error) {
    console.error('Failed to bulk insert prospects:', error);
  }

  return prospectRecords.length;
}

export async function bulkWriteAll(
  supabase: SupabaseClient,
  scanId: string,
  userId: string,
  prospects: ScoredProspect[]
): Promise<BulkWriteResult> {
  const errors: string[] = [];
  let scanItemsInserted = 0;
  let prospectsInserted = 0;

  try {
    scanItemsInserted = await bulkWriteScanItems(supabase, scanId, prospects);
  } catch (err: any) {
    errors.push(`Scan items: ${err.message}`);
  }

  try {
    prospectsInserted = await bulkWriteProspects(supabase, scanId, userId, prospects);
  } catch (err: any) {
    errors.push(`Prospects: ${err.message}`);
  }

  return {
    scanItemsInserted,
    prospectsInserted,
    errors,
  };
}
