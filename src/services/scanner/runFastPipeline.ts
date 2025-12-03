import { SupabaseClient } from '@supabase/supabase-js';
import { chunkCSV } from './csvChunker';
import { extractAllBatches } from './batchExtractor';
import { scoreAllBatches, ScoredProspect } from './parallelScoring';
import { bulkWriteAll } from './bulkWriter';
import { ProgressTracker } from './progressTracker';

export interface FastPipelineResult {
  success: boolean;
  scanId: string;
  totalProspects: number;
  hot: number;
  warm: number;
  cold: number;
  error?: string;
  duration?: number;
}

export async function runFastPipeline(
  supabase: SupabaseClient,
  scanId: string,
  userId: string,
  csvContent: string
): Promise<FastPipelineResult> {
  const startTime = Date.now();

  try {
    console.log(`[Fast Pipeline] Starting scan ${scanId}`);

    const batches = chunkCSV(csvContent, 15);
    console.log(`[Fast Pipeline] Created ${batches.length} batches`);

    const tracker = new ProgressTracker(supabase, scanId, batches.length);

    await tracker.queued();
    await tracker.chunking();

    console.log(`[Fast Pipeline] Extracting prospects from ${batches.length} batches...`);
    const batchItems = batches.map(b => b.items);
    const extractedBatches = await extractAllBatches(batchItems);

    for (let i = 0; i < extractedBatches.length; i++) {
      await tracker.extracting(i + 1);
    }

    console.log(`[Fast Pipeline] Scoring ${extractedBatches.flat().length} prospects...`);
    const scoredBatches = await scoreAllBatches(extractedBatches);

    for (let i = 0; i < scoredBatches.length; i++) {
      await tracker.scoring(i + 1);
    }

    const allProspects = scoredBatches.flat();
    console.log(`[Fast Pipeline] Total prospects scored: ${allProspects.length}`);

    await tracker.saving();

    const hotCount = allProspects.filter(p => p.bucket === 'hot').length;
    const warmCount = allProspects.filter(p => p.bucket === 'warm').length;
    const coldCount = allProspects.filter(p => p.bucket === 'cold').length;

    const writeResult = await bulkWriteAll(supabase, scanId, userId, allProspects);
    console.log(`[Fast Pipeline] Bulk write result:`, writeResult);

    const { error: updateError } = await supabase
      .from('scans')
      .update({
        status: 'completed',
        total_items: allProspects.length,
        hot_leads: hotCount,
        warm_leads: warmCount,
        cold_leads: coldCount,
        completed_at: new Date().toISOString(),
      })
      .eq('id', scanId);

    if (updateError) {
      console.error('[Fast Pipeline] Failed to update scan record:', updateError);
    }

    await tracker.completed(allProspects.length, hotCount, warmCount, coldCount);

    const duration = Date.now() - startTime;
    console.log(`[Fast Pipeline] Completed in ${duration}ms`);

    return {
      success: true,
      scanId,
      totalProspects: allProspects.length,
      hot: hotCount,
      warm: warmCount,
      cold: coldCount,
      duration,
    };
  } catch (error: any) {
    console.error('[Fast Pipeline] Error:', error);

    const tracker = new ProgressTracker(supabase, scanId, 0);
    await tracker.failed(error.message);

    await supabase
      .from('scans')
      .update({ status: 'failed' })
      .eq('id', scanId);

    return {
      success: false,
      scanId,
      totalProspects: 0,
      hot: 0,
      warm: 0,
      cold: 0,
      error: error.message,
      duration: Date.now() - startTime,
    };
  }
}
