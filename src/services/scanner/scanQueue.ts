import { supabase } from '../../lib/supabase';
import { extractTextFromInput } from './extractText';
import { extractProspectsFromText } from './extractProspects';
import { scoreProspects } from './scoutScoreEngine';
import { saveResults } from './saveResults';

export interface ScanJob {
  scanId: string;
  userId: string;
  scanType: 'text' | 'csv' | 'image' | 'social_upload' | 'browser_extension';
  payload: any;
}

export interface ScanProgress {
  scanId: string;
  stage: 'queued' | 'extracting_text' | 'detecting_prospects' | 'scoring' | 'saving' | 'completed' | 'failed';
  percent: number;
  message: string;
  itemsProcessed?: number;
  totalItems?: number;
}

const activeJobs = new Map<string, boolean>();

export async function emitProgress(scanId: string, stage: ScanProgress['stage'], percent: number, message: string, extra?: any) {
  try {
    await supabase.from('scan_status').insert({
      scan_id: scanId,
      step: stage,
      percent: Math.min(100, Math.max(0, percent)),
      message,
      items_processed: extra?.itemsProcessed,
      total_items: extra?.totalItems,
    });

    await supabase
      .from('scans')
      .update({
        status: stage === 'completed' ? 'completed' : stage === 'failed' ? 'failed' : 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', scanId);
  } catch (error) {
    console.error('Failed to emit progress:', error);
  }
}

export async function processScanJob(job: ScanJob): Promise<void> {
  const { scanId, userId, scanType, payload } = job;

  if (activeJobs.has(scanId)) {
    console.log(`Scan ${scanId} already processing, skipping...`);
    return;
  }

  activeJobs.set(scanId, true);

  try {
    await emitProgress(scanId, 'queued', 0, 'Scan queued for processing');

    await emitProgress(scanId, 'extracting_text', 5, 'Extracting text from input...');
    const { text, error: extractError } = await extractTextFromInput(scanType, payload);

    if (extractError || !text) {
      throw new Error(extractError || 'Failed to extract text');
    }

    await emitProgress(scanId, 'extracting_text', 20, `Extracted ${text.length} characters`);

    await emitProgress(scanId, 'detecting_prospects', 25, 'Analyzing text for prospects...');
    const prospects = await extractProspectsFromText(text, scanId);

    if (prospects.length === 0) {
      throw new Error('No prospects found in the provided data');
    }

    await emitProgress(scanId, 'detecting_prospects', 40, `Found ${prospects.length} potential prospects`);

    await emitProgress(scanId, 'scoring', 45, 'Scoring prospects with AI...');
    const scoredProspects = await scoreProspects(prospects, scanId, (processed, total) => {
      const progressPercent = 45 + Math.floor((processed / total) * 30);
      emitProgress(scanId, 'scoring', progressPercent, `Scored ${processed} of ${total} prospects`, {
        itemsProcessed: processed,
        totalItems: total,
      });
    });

    await emitProgress(scanId, 'scoring', 75, `Scored all ${scoredProspects.length} prospects`);

    await emitProgress(scanId, 'saving', 80, 'Saving results to database...');
    await saveResults(scanId, userId, scoredProspects);

    await emitProgress(scanId, 'saving', 95, 'Finalizing scan...');

    const hotCount = scoredProspects.filter(p => p.bucket === 'hot').length;
    const warmCount = scoredProspects.filter(p => p.bucket === 'warm').length;
    const coldCount = scoredProspects.filter(p => p.bucket === 'cold').length;

    await supabase
      .from('scans')
      .update({
        status: 'completed',
        total_items: scoredProspects.length,
        hot_leads: hotCount,
        warm_leads: warmCount,
        cold_leads: coldCount,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', scanId);

    await emitProgress(scanId, 'completed', 100, `Scan completed! Found ${scoredProspects.length} prospects`);

  } catch (error: any) {
    console.error(`Scan ${scanId} failed:`, error);

    await emitProgress(scanId, 'failed', 0, error.message || 'Scan failed');

    await supabase
      .from('scans')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', scanId);

    throw error;
  } finally {
    activeJobs.delete(scanId);
  }
}

export function isJobProcessing(scanId: string): boolean {
  return activeJobs.has(scanId);
}
