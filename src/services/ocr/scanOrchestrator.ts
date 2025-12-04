import { supabase } from '../../lib/supabase';
import { OCRProcessor, OCROutput } from './ocrProcessor';
import { NLPEnrichment, EnrichedData } from './nlpEnrichment';
import { PersonalityProfiler, PersonalityProfile } from './personalityProfiler';
import { PainPointAnalyzer, PainPointAnalysis } from './painPointAnalyzer';

export interface ScanResult {
  scan_id: string;
  prospects_found: number;
  status: 'completed' | 'failed';
  processing_time_ms: number;
}

export class ScanOrchestrator {
  static async processScan(scanId: string, images: string[]): Promise<ScanResult> {
    const startTime = Date.now();

    try {
      await this.updateStatus(scanId, 'processing', 'Extracting text from images...');

      const ocrOutputs = await OCRProcessor.processMultipleImages(images);
      const combinedOCR = OCRProcessor.combineOCROutputs(ocrOutputs);

      await this.updateStatus(scanId, 'processing', 'Detecting names and entities...');

      await this.saveProcessedItems(scanId, combinedOCR);

      await this.updateStatus(scanId, 'processing', 'Classifying topics...');

      const enrichedData = NLPEnrichment.enrichText(combinedOCR.raw_text);

      await this.updateStatus(scanId, 'processing', 'Detecting interests...');

      const personalityProfile = PersonalityProfiler.analyzePersonality(
        combinedOCR.raw_text,
        combinedOCR.posts
      );

      await this.updateStatus(scanId, 'processing', 'Analyzing pain points...');

      const painPointAnalysis = PainPointAnalyzer.analyzePainPoints(combinedOCR.raw_text);

      await this.updateStatus(scanId, 'processing', 'Scoring prospects...');

      const prospects = await this.scoreAndSaveProspects(
        scanId,
        combinedOCR,
        enrichedData,
        personalityProfile,
        painPointAnalysis
      );

      await this.updateStatus(scanId, 'processing', 'Finalizing scan...');

      const processingTime = Date.now() - startTime;

      await this.updateStatus(
        scanId,
        'completed',
        `Scan completed. Found ${prospects.length} prospects.`
      );

      return {
        scan_id: scanId,
        prospects_found: prospects.length,
        status: 'completed',
        processing_time_ms: processingTime,
      };
    } catch (error) {
      console.error('Scan orchestration error:', error);

      await this.updateStatus(
        scanId,
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );

      return {
        scan_id: scanId,
        prospects_found: 0,
        status: 'failed',
        processing_time_ms: Date.now() - startTime,
      };
    }
  }

  private static async updateStatus(
    scanId: string,
    status: string,
    message: string
  ): Promise<void> {
    await supabase
      .from('scans')
      .update({
        status,
        processing_message: message,
        updated_at: new Date().toISOString(),
      })
      .eq('id', scanId);
  }

  private static async saveProcessedItems(
    scanId: string,
    ocrOutput: OCROutput
  ): Promise<void> {
    const items = [];

    for (const post of ocrOutput.posts) {
      items.push({
        scan_id: scanId,
        type: 'post',
        content: post.text,
        raw_ocr_text: post.text,
        metadata: { timestamp: post.timestamp },
      });
    }

    for (const friend of ocrOutput.friends_list) {
      items.push({
        scan_id: scanId,
        type: 'friend',
        name: friend.name,
        content: `Friend with ${friend.mutual_friends || 0} mutual connections`,
        metadata: { mutual_friends: friend.mutual_friends },
      });
    }

    if (items.length > 0) {
      await supabase.from('scan_processed_items').insert(items);
    }
  }

  private static async scoreAndSaveProspects(
    scanId: string,
    ocrOutput: OCROutput,
    enrichedData: EnrichedData,
    personalityProfile: PersonalityProfile,
    painPointAnalysis: PainPointAnalysis
  ): Promise<any[]> {
    const prospects = [];

    for (const name of ocrOutput.detected_names) {
      let score = 50;

      if (enrichedData.buying_signals.length > 0) {
        score += 20;
      }

      if (personalityProfile.decision_maker_signals > 2) {
        score += 15;
      }

      if (painPointAnalysis.opportunity_score > 60) {
        score += 15;
      }

      if (personalityProfile.engagement_level === 'high') {
        score += 10;
      }

      const prospectData = {
        scan_id: scanId,
        type: 'text',
        name,
        score: Math.min(score, 100),
        content: JSON.stringify({
          topics: enrichedData.topics,
          interests: enrichedData.interests,
          personality: personalityProfile,
          pain_points: painPointAnalysis.pain_points,
        }),
        metadata: {
          topics: enrichedData.topics,
          interests: enrichedData.interests,
          sentiment: enrichedData.sentiment,
          communication_style: personalityProfile.communication_style,
          engagement_level: personalityProfile.engagement_level,
          opportunity_score: painPointAnalysis.opportunity_score,
        },
      };

      prospects.push(prospectData);
    }

    for (const friend of ocrOutput.friends_list) {
      let score = 40;

      if (friend.mutual_friends && friend.mutual_friends > 10) {
        score += 20;
      }

      if (friend.mutual_friends && friend.mutual_friends > 20) {
        score += 10;
      }

      const prospectData = {
        scan_id: scanId,
        type: 'friend',
        name: friend.name,
        score: Math.min(score, 100),
        content: `Friend with ${friend.mutual_friends || 0} mutual connections`,
        metadata: {
          mutual_friends: friend.mutual_friends,
          topics: enrichedData.topics,
        },
      };

      prospects.push(prospectData);
    }

    if (prospects.length > 0) {
      await supabase.from('scan_processed_items').insert(prospects);
    }

    return prospects;
  }

  static async pollScanStatus(scanId: string): Promise<{
    status: string;
    message: string;
    progress: number;
  }> {
    const { data, error } = await supabase
      .from('scans')
      .select('status, processing_message')
      .eq('id', scanId)
      .single();

    if (error || !data) {
      throw new Error('Scan not found');
    }

    const progressMap: Record<string, number> = {
      'Extracting text from images...': 10,
      'Detecting names and entities...': 25,
      'Classifying topics...': 40,
      'Detecting interests...': 55,
      'Analyzing pain points...': 70,
      'Scoring prospects...': 85,
      'Finalizing scan...': 95,
    };

    const progress = progressMap[data.processing_message] || 0;

    return {
      status: data.status,
      message: data.processing_message,
      progress,
    };
  }
}
