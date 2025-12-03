import { SupabaseClient } from '@supabase/supabase-js';

export type ScanStage = 'queued' | 'chunking' | 'extracting' | 'scoring' | 'saving' | 'completed' | 'failed';

export interface ProgressUpdate {
  scanId: string;
  stage: ScanStage;
  percent: number;
  message: string;
  batchesProcessed?: number;
  totalBatches?: number;
}

export async function updateProgress(
  supabase: SupabaseClient,
  update: ProgressUpdate
): Promise<void> {
  const { scanId, stage, percent, message, batchesProcessed, totalBatches } = update;

  const progressMessage = totalBatches
    ? `${message} (${batchesProcessed}/${totalBatches} batches)`
    : message;

  await supabase.from('scan_status').insert({
    scan_id: scanId,
    step: stage,
    percent: Math.min(100, Math.max(0, percent)),
    message: progressMessage,
  });

  await supabase
    .from('scans')
    .update({
      status: stage === 'completed' ? 'completed' : stage === 'failed' ? 'failed' : 'processing'
    })
    .eq('id', scanId);
}

export class ProgressTracker {
  private supabase: SupabaseClient;
  private scanId: string;
  private totalBatches: number;

  constructor(supabase: SupabaseClient, scanId: string, totalBatches: number) {
    this.supabase = supabase;
    this.scanId = scanId;
    this.totalBatches = totalBatches;
  }

  async queued() {
    await updateProgress(this.supabase, {
      scanId: this.scanId,
      stage: 'queued',
      percent: 5,
      message: 'Scan queued for processing',
    });
  }

  async chunking() {
    await updateProgress(this.supabase, {
      scanId: this.scanId,
      stage: 'chunking',
      percent: 10,
      message: 'Chunking CSV data',
      totalBatches: this.totalBatches,
    });
  }

  async extracting(batchesProcessed: number) {
    const percent = 10 + Math.floor((batchesProcessed / this.totalBatches) * 30);
    await updateProgress(this.supabase, {
      scanId: this.scanId,
      stage: 'extracting',
      percent,
      message: 'Extracting prospects',
      batchesProcessed,
      totalBatches: this.totalBatches,
    });
  }

  async scoring(batchesProcessed: number) {
    const percent = 40 + Math.floor((batchesProcessed / this.totalBatches) * 30);
    await updateProgress(this.supabase, {
      scanId: this.scanId,
      stage: 'scoring',
      percent,
      message: 'Scoring prospects',
      batchesProcessed,
      totalBatches: this.totalBatches,
    });
  }

  async saving() {
    await updateProgress(this.supabase, {
      scanId: this.scanId,
      stage: 'saving',
      percent: 75,
      message: 'Saving results to database',
    });
  }

  async completed(totalProspects: number, hot: number, warm: number, cold: number) {
    await updateProgress(this.supabase, {
      scanId: this.scanId,
      stage: 'completed',
      percent: 100,
      message: `Scan completed! Found ${totalProspects} prospects (${hot}H/${warm}W/${cold}C)`,
    });
  }

  async failed(error: string) {
    await updateProgress(this.supabase, {
      scanId: this.scanId,
      stage: 'failed',
      percent: 0,
      message: `Scan failed: ${error}`,
    });
  }
}
