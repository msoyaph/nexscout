import { supabase } from '../lib/supabase';

export interface NormalizedScanPayload {
  textCorpus: string;
  htmlCorpus: string;
  platform: string;
  captureType: string;
  metadata: any;
  sourceUrl?: string;
  tags?: string[];
}

export interface ScanSourceInput {
  sourceType: 'browser_extension' | 'screenshot' | 'upload' | 'social_connection';
  captureId?: string;
  userId: string;
}

export class ScanningSourceLoader {
  async loadBrowserCapture(captureId: string, userId: string): Promise<NormalizedScanPayload> {
    const { data: capture, error } = await supabase
      .from('browser_captures')
      .select('*')
      .eq('id', captureId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load capture: ${error.message}`);
    }

    if (!capture) {
      throw new Error('Capture not found or unauthorized');
    }

    if (!capture.text_content && !capture.html_snapshot) {
      throw new Error('Capture missing textContent and htmlSnapshot');
    }

    return {
      textCorpus: capture.text_content || '',
      htmlCorpus: capture.html_snapshot || '',
      platform: capture.platform,
      captureType: capture.capture_type,
      metadata: {
        ...capture.metadata,
        tags: capture.tags,
        extensionVersion: capture.extension_version,
        captureDate: capture.created_at,
      },
      sourceUrl: capture.source_url,
      tags: capture.tags,
    };
  }

  async loadSource(input: ScanSourceInput): Promise<NormalizedScanPayload> {
    switch (input.sourceType) {
      case 'browser_extension':
        if (!input.captureId) {
          throw new Error('captureId is required for browser_extension source');
        }
        return this.loadBrowserCapture(input.captureId, input.userId);

      case 'screenshot':
      case 'upload':
      case 'social_connection':
        throw new Error(`Source type ${input.sourceType} not yet implemented`);

      default:
        throw new Error(`Unknown source type: ${input.sourceType}`);
    }
  }

  validatePayload(payload: NormalizedScanPayload): boolean {
    if (!payload.textCorpus && !payload.htmlCorpus) {
      return false;
    }

    if (!payload.platform || !payload.captureType) {
      return false;
    }

    return true;
  }
}

export const scanningSourceLoader = new ScanningSourceLoader();
