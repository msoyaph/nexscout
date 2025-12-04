import { supabase } from '../../lib/supabase';
import { ocrEngine } from './ocrEngine';
import { fbScreenshotParser, ParsedProspect } from './fbScreenshotParser';
import { fileParser } from './fileParser';
import { textExtractor } from './textExtractor';

export type ScanStep =
  | 'IDLE'
  | 'EXTRACTING_TEXT'
  | 'DETECTING_NAMES'
  | 'DETECTING_EVENTS'
  | 'CLASSIFYING_TOPICS'
  | 'DETECTING_INTERESTS'
  | 'SCORING_PROSPECTS'
  | 'FINALIZING'
  | 'COMPLETED'
  | 'ERROR';

export interface ScanInputs {
  images?: File[];
  textBlocks?: string[];
  csvFiles?: File[];
  facebookFiles?: File[];
  linkedinFiles?: File[];
}

export interface ScanProgress {
  step: ScanStep;
  percent: number;
  message: string;
}

export class ScanPipeline {
  private scanId: string;
  private userId: string;

  constructor(scanId: string, userId: string) {
    this.scanId = scanId;
    this.userId = userId;
  }

  async start(sourceType: string, inputs: ScanInputs): Promise<void> {
    console.log('[Scan Pipeline] Starting scan:', this.scanId);

    try {
      await this.updateProgress('EXTRACTING_TEXT', 0, 'Initializing scan...');

      const allProspects: ParsedProspect[] = [];

      if (inputs.images && inputs.images.length > 0) {
        const imageProspects = await this.processImages(inputs.images);
        allProspects.push(...imageProspects);
      }

      if (inputs.textBlocks && inputs.textBlocks.length > 0) {
        const textProspects = await this.processTextBlocks(inputs.textBlocks);
        allProspects.push(...textProspects);
      }

      if (inputs.csvFiles && inputs.csvFiles.length > 0) {
        const csvProspects = await this.processCSVFiles(inputs.csvFiles);
        allProspects.push(...csvProspects);
      }

      if (inputs.facebookFiles && inputs.facebookFiles.length > 0) {
        const fbProspects = await this.processFacebookFiles(inputs.facebookFiles);
        allProspects.push(...fbProspects);
      }

      if (inputs.linkedinFiles && inputs.linkedinFiles.length > 0) {
        const linkedinProspects = await this.processLinkedInFiles(inputs.linkedinFiles);
        allProspects.push(...linkedinProspects);
      }

      await this.updateProgress('SCORING_PROSPECTS', 80, 'Scoring prospects...');
      await this.scoreProspects(allProspects);

      await this.updateProgress('FINALIZING', 95, 'Finalizing results...');
      await this.saveResults(allProspects);

      await this.updateProgress('COMPLETED', 100, 'Scan completed successfully!');
      await this.markScanComplete();

      console.log('[Scan Pipeline] Completed successfully');
    } catch (error) {
      console.error('[Scan Pipeline] Error:', error);
      await this.updateProgress('ERROR', 0, error instanceof Error ? error.message : 'Unknown error');
      await this.markScanError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      await ocrEngine.terminate();
    }
  }

  private async processImages(images: File[]): Promise<ParsedProspect[]> {
    console.log('[Scan Pipeline] Processing', images.length, 'images');
    await this.updateProgress('EXTRACTING_TEXT', 10, `Processing ${images.length} screenshots...`);

    const allProspects: ParsedProspect[] = [];

    for (let i = 0; i < images.length; i++) {
      const percent = 10 + Math.floor((i / images.length) * 30);
      await this.updateProgress(
        'EXTRACTING_TEXT',
        percent,
        `Processing image ${i + 1}/${images.length}...`
      );

      const ocrResult = await ocrEngine.processImage(images[i]);

      await supabase.from('scan_extracted_data').insert({
        scan_id: this.scanId,
        source_index: i,
        raw_text: ocrResult.rawText,
        detected_names: ocrResult.detectedNames,
        detected_keywords: {
          numbers: ocrResult.detectedNumbers,
          confidence: ocrResult.confidence,
        },
        ocr_metadata: {
          layoutHints: ocrResult.layoutHints.length,
          confidence: ocrResult.confidence,
        },
      });

      await this.updateProgress('DETECTING_NAMES', 40 + i, 'Analyzing screenshot layout...');
      const parseResult = fbScreenshotParser.parseScreenshot(ocrResult);
      allProspects.push(...parseResult.prospects);
    }

    return allProspects;
  }

  private async processTextBlocks(textBlocks: string[]): Promise<ParsedProspect[]> {
    console.log('[Scan Pipeline] Processing', textBlocks.length, 'text blocks');
    await this.updateProgress('EXTRACTING_TEXT', 15, 'Processing text input...');

    const allProspects: ParsedProspect[] = [];

    for (const text of textBlocks) {
      const extracted = textExtractor.extractFromText(text);
      allProspects.push(...extracted.prospects);
    }

    await this.updateProgress('DETECTING_NAMES', 45, 'Names detected');

    return allProspects;
  }

  private async processCSVFiles(csvFiles: File[]): Promise<ParsedProspect[]> {
    console.log('[Scan Pipeline] Processing', csvFiles.length, 'CSV files');
    await this.updateProgress('EXTRACTING_TEXT', 20, 'Parsing CSV files...');

    const allProspects: ParsedProspect[] = [];

    for (const file of csvFiles) {
      const prospects = await fileParser.parseCSV(file);
      allProspects.push(...prospects);
    }

    await this.updateProgress('DETECTING_NAMES', 50, 'CSV data parsed');

    return allProspects;
  }

  private async processFacebookFiles(facebookFiles: File[]): Promise<ParsedProspect[]> {
    console.log('[Scan Pipeline] Processing', facebookFiles.length, 'Facebook files');
    await this.updateProgress('EXTRACTING_TEXT', 25, 'Parsing Facebook export...');

    const allProspects: ParsedProspect[] = [];

    for (const file of facebookFiles) {
      const prospects = await fileParser.parseFacebookExport(file);
      allProspects.push(...prospects);
    }

    await this.updateProgress('DETECTING_NAMES', 55, 'Facebook data parsed');

    return allProspects;
  }

  private async processLinkedInFiles(linkedinFiles: File[]): Promise<ParsedProspect[]> {
    console.log('[Scan Pipeline] Processing', linkedinFiles.length, 'LinkedIn files');
    await this.updateProgress('EXTRACTING_TEXT', 30, 'Parsing LinkedIn export...');

    const allProspects: ParsedProspect[] = [];

    for (const file of linkedinFiles) {
      const prospects = await fileParser.parseLinkedInExport(file);
      allProspects.push(...prospects);
    }

    await this.updateProgress('DETECTING_NAMES', 60, 'LinkedIn data parsed');

    return allProspects;
  }

  private async scoreProspects(prospects: ParsedProspect[]): Promise<void> {
    console.log('[Scan Pipeline] Scoring', prospects.length, 'prospects');
    await this.updateProgress('SCORING_PROSPECTS', 85, 'Calculating ScoutScores...');

    for (const prospect of prospects) {
      const score = this.calculateBasicScore(prospect);
      prospect.metadata = {
        ...prospect.metadata,
        scoutScore: score,
        bucket: score >= 75 ? 'hot' : score >= 50 ? 'warm' : 'cold',
      };
    }
  }

  private calculateBasicScore(prospect: ParsedProspect): number {
    let score = 50;

    if (prospect.mutualFriends) {
      score += Math.min(prospect.mutualFriends * 2, 30);
    }

    if (prospect.metadata?.businessIntent) {
      score += 15;
    }

    if (prospect.metadata?.detectedPainPoints?.length > 0) {
      score += 10;
    }

    return Math.min(score, 100);
  }

  private async saveResults(prospects: ParsedProspect[]): Promise<void> {
    const hotCount = prospects.filter(p => p.metadata?.bucket === 'hot').length;
    const warmCount = prospects.filter(p => p.metadata?.bucket === 'warm').length;
    const coldCount = prospects.filter(p => p.metadata?.bucket === 'cold').length;

    await supabase.from('scans').update({
      total_items: prospects.length,
      hot_leads: hotCount,
      warm_leads: warmCount,
      cold_leads: coldCount,
      metadata: {
        prospects: prospects.map(p => ({
          name: p.name,
          platform: p.platform,
          source: p.source,
          mutualFriends: p.mutualFriends,
          scoutScore: p.metadata?.scoutScore,
          bucket: p.metadata?.bucket,
        })),
      },
    }).eq('id', this.scanId);
  }

  private async markScanComplete(): Promise<void> {
    await supabase.from('scans').update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    }).eq('id', this.scanId);
  }

  private async markScanError(errorMessage: string): Promise<void> {
    await supabase.from('scans').update({
      status: 'failed',
      completed_at: new Date().toISOString(),
      metadata: { error: errorMessage },
    }).eq('id', this.scanId);
  }

  private async updateProgress(step: ScanStep, percent: number, message: string): Promise<void> {
    console.log(`[Scan Pipeline] ${step}: ${percent}% - ${message}`);

    await supabase.from('scan_progress').insert({
      scan_id: this.scanId,
      step,
      percent,
      message,
    });

    await supabase.from('scans').update({
      status: step === 'COMPLETED' ? 'completed' : step === 'ERROR' ? 'failed' : 'processing',
    }).eq('id', this.scanId);
  }
}

export async function startScanPipeline(
  scanId: string,
  userId: string,
  sourceType: string,
  inputs: ScanInputs
): Promise<void> {
  const pipeline = new ScanPipeline(scanId, userId);
  await pipeline.start(sourceType, inputs);
}
