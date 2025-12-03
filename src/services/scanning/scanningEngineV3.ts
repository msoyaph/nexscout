import { supabase } from '../../lib/supabase';
import { ScanInputs, startScanPipeline } from './scanPipeline';

export type SourceType =
  | 'screenshots'
  | 'text'
  | 'files_csv'
  | 'files_facebook_export'
  | 'files_linkedin_export'
  | 'social_connect_fb'
  | 'social_connect_ig'
  | 'social_url';

export interface ScanEngineInputs {
  images?: File[];
  textBlocks?: string[];
  csvFiles?: File[];
  facebookFiles?: File[];
  linkedinFiles?: File[];
  url?: string;
}

export interface ScanStartResult {
  scanId: string;
  totalItems: number;
  startedAt: string;
  status: string;
}

export class ScanningEngineV3 {
  async initiateScan(
    userId: string,
    sourceType: SourceType,
    inputs: ScanEngineInputs
  ): Promise<ScanStartResult> {
    console.log('[Scanning Engine V3] Initiating scan for user:', userId);
    console.log('[Scanning Engine V3] Source type:', sourceType);
    console.log('[Scanning Engine V3] Inputs:', {
      images: inputs.images?.length || 0,
      textBlocks: inputs.textBlocks?.length || 0,
      csvFiles: inputs.csvFiles?.length || 0,
      facebookFiles: inputs.facebookFiles?.length || 0,
      linkedinFiles: inputs.linkedinFiles?.length || 0,
    });

    const totalItems = this.calculateTotalItems(inputs);

    const { data: scan, error } = await supabase
      .from('scans')
      .insert({
        user_id: userId,
        status: 'processing',
        sources: {
          type: sourceType,
          imageCount: inputs.images?.length || 0,
          textBlockCount: inputs.textBlocks?.length || 0,
          csvFileCount: inputs.csvFiles?.length || 0,
          facebookFileCount: inputs.facebookFiles?.length || 0,
          linkedinFileCount: inputs.linkedinFiles?.length || 0,
        },
        total_items: totalItems,
        screenshot_count: inputs.images?.length || 0,
        file_count: (inputs.csvFiles?.length || 0) + (inputs.facebookFiles?.length || 0) + (inputs.linkedinFiles?.length || 0),
        text_count: inputs.textBlocks?.length || 0,
      })
      .select()
      .single();

    if (error || !scan) {
      console.error('[Scanning Engine V3] Error creating scan:', error);
      throw new Error('Failed to create scan record');
    }

    console.log('[Scanning Engine V3] Scan created:', scan.id);

    const text = inputs.textBlocks?.join('\n\n') || '';
    const url = inputs.url || '';

    const { data: session } = await supabase.auth.getSession();
    const token = session?.session?.access_token;

    if (token) {
      if (sourceType === 'social_url' && url) {
        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scan-url`;

        fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            scan_id: scan.id,
            url: url
          })
        }).catch(err => {
          console.error('[Scanning Engine V3] Failed to trigger URL scan:', err);
        });
      } else {
        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scan-processor`;

        fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            scan_id: scan.id,
            text: text || 'Sample text with John Smith and Maria Garcia'
          })
        }).catch(err => {
          console.error('[Scanning Engine V3] Failed to trigger scan processor:', err);
        });
      }
    }

    return {
      scanId: scan.id,
      totalItems,
      startedAt: scan.created_at,
      status: 'processing',
    };
  }

  async getScanStatus(scanId: string): Promise<{
    step: string;
    percent: number;
    message: string;
    status: string;
  } | null> {
    const { data: scan } = await supabase
      .from('scans')
      .select('status')
      .eq('id', scanId)
      .single();

    if (!scan) return null;

    const { data: progress } = await supabase
      .from('scan_progress')
      .select('*')
      .eq('scan_id', scanId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (!progress) {
      return {
        step: 'IDLE',
        percent: 0,
        message: 'Initializing...',
        status: scan.status,
      };
    }

    return {
      step: progress.step,
      percent: progress.percent,
      message: progress.message,
      status: scan.status,
    };
  }

  async getScanResults(scanId: string): Promise<{
    prospects: any[];
    summary: any;
    scoutScores: any[];
  } | null> {
    const { data: scan } = await supabase
      .from('scans')
      .select('*')
      .eq('id', scanId)
      .single();

    if (!scan) return null;

    const prospects = (scan.metadata as any)?.prospects || [];

    return {
      prospects,
      summary: {
        totalProspects: scan.total_items,
        hotCount: scan.hot_leads,
        warmCount: scan.warm_leads,
        coldCount: scan.cold_leads,
      },
      scoutScores: prospects.map((p: any) => ({
        name: p.name,
        score: p.scoutScore,
        bucket: p.bucket,
      })),
    };
  }

  private calculateTotalItems(inputs: ScanEngineInputs): number {
    let total = 0;

    if (inputs.images) total += inputs.images.length;
    if (inputs.textBlocks) total += inputs.textBlocks.length;
    if (inputs.csvFiles) total += inputs.csvFiles.length;
    if (inputs.facebookFiles) total += inputs.facebookFiles.length;
    if (inputs.linkedinFiles) total += inputs.linkedinFiles.length;

    return total;
  }
}

export const scanningEngineV3 = new ScanningEngineV3();
