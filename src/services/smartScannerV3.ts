import { supabase } from '../lib/supabase';
import { OCREngine, OCRResult } from './ocrEngine';
import { FBScreenshotParser, ParsedFacebookData } from './fbScreenshotParser';
import { TaglishExtractor, TaglishAnalysis } from './taglishExtractor';
import { NLPEnrichment, EnrichedData } from './ocr/nlpEnrichment';
import { PersonalityProfiler, PersonalityProfile } from './ocr/personalityProfiler';
import { PainPointAnalyzer, PainPointAnalysis } from './ocr/painPointAnalyzer';
import { ScanPipelineStateMachine, ScanPipelineState } from './scanPipelineStateMachine';

export interface SmartScanV3Result {
  scan_id: string;
  prospects_found: number;
  status: 'completed' | 'failed';
  processing_time_ms: number;
  ocr_confidence: number;
  taglish_score: number;
  language_mix: {
    filipino_percentage: number;
    english_percentage: number;
  };
}

export class SmartScannerV3 {
  static async processScan(scanId: string, images: string[]): Promise<SmartScanV3Result> {
    const startTime = Date.now();
    let pipelineState = ScanPipelineStateMachine.createInitialState();

    try {
      pipelineState = await this.updatePipelineState(scanId, pipelineState, 'initializing');

      pipelineState = await this.updatePipelineState(scanId, pipelineState, 'ocr_processing');
      const ocrResults = await this.performOCR(scanId, images);
      const combinedOCR = OCREngine.combineOCRResults(ocrResults);

      await this.saveOCRResults(scanId, ocrResults);

      pipelineState = await this.updatePipelineState(scanId, pipelineState, 'parsing_facebook');
      const parsedData = FBScreenshotParser.parse(combinedOCR);

      pipelineState = await this.updatePipelineState(scanId, pipelineState, 'nlp_enrichment');
      const enrichedData = NLPEnrichment.enrichText(combinedOCR.raw_text);

      pipelineState = await this.updatePipelineState(scanId, pipelineState, 'taglish_analysis');
      const taglishAnalysis = TaglishExtractor.analyze(combinedOCR.raw_text);

      await this.saveTaglishAnalysis(scanId, taglishAnalysis, parsedData);

      pipelineState = await this.updatePipelineState(scanId, pipelineState, 'personality_profiling');
      const personalityProfile = PersonalityProfiler.analyzePersonality(
        combinedOCR.raw_text,
        parsedData.posts
      );

      pipelineState = await this.updatePipelineState(scanId, pipelineState, 'pain_point_detection');
      const painPointAnalysis = PainPointAnalyzer.analyzePainPoints(combinedOCR.raw_text);

      pipelineState = await this.updatePipelineState(scanId, pipelineState, 'scoring');
      const prospects = await this.scoreAndSaveProspects(
        scanId,
        parsedData,
        enrichedData,
        taglishAnalysis,
        personalityProfile,
        painPointAnalysis
      );

      pipelineState = await this.updatePipelineState(scanId, pipelineState, 'saving_results');

      const processingTime = Date.now() - startTime;

      pipelineState = await this.updatePipelineState(scanId, pipelineState, 'completed', {
        prospects_found: prospects.length,
        processing_time_ms: processingTime,
      });

      return {
        scan_id: scanId,
        prospects_found: prospects.length,
        status: 'completed',
        processing_time_ms: processingTime,
        ocr_confidence: combinedOCR.confidence,
        taglish_score: taglishAnalysis.language_mix.taglish_score,
        language_mix: {
          filipino_percentage: taglishAnalysis.language_mix.filipino_percentage,
          english_percentage: taglishAnalysis.language_mix.english_percentage,
        },
      };
    } catch (error) {
      console.error('Smart Scanner v3 error:', error);

      pipelineState = ScanPipelineStateMachine.fail(
        pipelineState,
        error instanceof Error ? error.message : 'Unknown error'
      );

      await this.updateScanState(scanId, pipelineState);

      return {
        scan_id: scanId,
        prospects_found: 0,
        status: 'failed',
        processing_time_ms: Date.now() - startTime,
        ocr_confidence: 0,
        taglish_score: 0,
        language_mix: {
          filipino_percentage: 0,
          english_percentage: 0,
        },
      };
    }
  }

  private static async updatePipelineState(
    scanId: string,
    currentState: ScanPipelineState,
    nextState: any,
    metadata?: Record<string, any>
  ): Promise<ScanPipelineState> {
    const newState = ScanPipelineStateMachine.transition(currentState, nextState, metadata);
    await this.updateScanState(scanId, newState);
    return newState;
  }

  private static async updateScanState(
    scanId: string,
    pipelineState: ScanPipelineState
  ): Promise<void> {
    const estimatedCompletion = new Date(
      Date.now() + ScanPipelineStateMachine.getRemainingTime(pipelineState)
    ).toISOString();

    await supabase
      .from('scans')
      .update({
        status: pipelineState.current_state === 'completed' ? 'completed' : 'processing',
        pipeline_state: pipelineState.current_state,
        processing_message: pipelineState.message,
        processing_metadata: pipelineState.metadata,
        estimated_completion_time: ScanPipelineStateMachine.isTerminalState(pipelineState.current_state)
          ? null
          : estimatedCompletion,
      })
      .eq('id', scanId);
  }

  private static async performOCR(scanId: string, images: string[]): Promise<OCRResult[]> {
    const results: OCRResult[] = [];

    for (let i = 0; i < images.length; i++) {
      const result = await OCREngine.processImage(images[i]);

      if (result.confidence > 50) {
        results.push(result);
      }
    }

    return results;
  }

  private static async saveOCRResults(scanId: string, ocrResults: OCRResult[]): Promise<void> {
    const items = ocrResults.map((result, index) => ({
      scan_id: scanId,
      image_index: index,
      raw_text: result.raw_text,
      lines: result.lines,
      blocks: result.blocks,
      confidence: result.confidence,
      processing_time_ms: 0,
    }));

    if (items.length > 0) {
      await supabase.from('scan_ocr_results').insert(items);

      const avgConfidence =
        items.reduce((sum, item) => sum + (item.confidence || 0), 0) / items.length;

      await supabase
        .from('scans')
        .update({ ocr_confidence: avgConfidence })
        .eq('id', scanId);
    }
  }

  private static async saveTaglishAnalysis(
    scanId: string,
    taglishAnalysis: TaglishAnalysis,
    parsedData: ParsedFacebookData
  ): Promise<void> {
    const businessOpportunity = TaglishExtractor.detectBusinessOpportunity(taglishAnalysis);
    const localizedMessage = TaglishExtractor.generateLocalizedMessage(taglishAnalysis);

    await supabase.from('scan_taglish_analysis').insert({
      scan_id: scanId,
      filipino_percentage: taglishAnalysis.language_mix.filipino_percentage,
      english_percentage: taglishAnalysis.language_mix.english_percentage,
      taglish_score: taglishAnalysis.language_mix.taglish_score,
      communication_style: taglishAnalysis.communication_style,
      business_keywords: taglishAnalysis.filipino_keywords.business,
      lifestyle_keywords: taglishAnalysis.filipino_keywords.lifestyle,
      emotion_keywords: taglishAnalysis.filipino_keywords.emotions,
      location_keywords: taglishAnalysis.filipino_keywords.locations,
      relationship_keywords: taglishAnalysis.filipino_keywords.relationships,
      buying_intent_phrases: taglishAnalysis.buying_intent_phrases,
      cultural_signals: taglishAnalysis.cultural_signals,
      has_business_interest: businessOpportunity.has_business_interest,
      business_confidence_score: businessOpportunity.confidence_score,
      localized_greeting: localizedMessage.greeting,
      localized_approach: localizedMessage.approach,
    });

    await supabase
      .from('scans')
      .update({
        taglish_score: taglishAnalysis.language_mix.taglish_score,
        language_mix: {
          filipino_percentage: taglishAnalysis.language_mix.filipino_percentage,
          english_percentage: taglishAnalysis.language_mix.english_percentage,
          taglish_score: taglishAnalysis.language_mix.taglish_score,
        },
      })
      .eq('id', scanId);
  }

  private static async scoreAndSaveProspects(
    scanId: string,
    parsedData: ParsedFacebookData,
    enrichedData: EnrichedData,
    taglishAnalysis: TaglishAnalysis,
    personalityProfile: PersonalityProfile,
    painPointAnalysis: PainPointAnalysis
  ): Promise<any[]> {
    const prospects = [];

    for (const friend of parsedData.friends_list) {
      let score = 40;

      if (friend.mutual_friends && friend.mutual_friends > 10) score += 15;
      if (friend.mutual_friends && friend.mutual_friends > 20) score += 10;

      if (taglishAnalysis.filipino_keywords.business.length > 0) score += 10;

      if (enrichedData.buying_signals.length > 0) score += 10;

      if (personalityProfile.decision_maker_signals > 2) score += 10;

      if (painPointAnalysis.opportunity_score > 60) score += 10;

      const prospectData = {
        scan_id: scanId,
        type: 'friend',
        name: friend.name,
        score: Math.min(score, 100),
        content: JSON.stringify({
          mutual_friends: friend.mutual_friends,
          additional_info: friend.additional_info,
          topics: enrichedData.topics,
          interests: enrichedData.interests,
          taglish_style: taglishAnalysis.communication_style,
        }),
        metadata: {
          mutual_friends: friend.mutual_friends,
          additional_info: friend.additional_info,
          communication_style: taglishAnalysis.communication_style,
          has_business_interest: taglishAnalysis.filipino_keywords.business.length > 0,
        },
      };

      prospects.push(prospectData);
    }

    for (const post of parsedData.posts) {
      if (post.author) {
        let score = 50;

        if (enrichedData.buying_signals.length > 0) score += 20;
        if (personalityProfile.decision_maker_signals > 2) score += 15;
        if (painPointAnalysis.opportunity_score > 60) score += 15;

        if (post.reactions && post.reactions > 100) score += 5;
        if (post.comments && post.comments > 20) score += 5;

        const prospectData = {
          scan_id: scanId,
          type: 'post',
          name: post.author,
          score: Math.min(score, 100),
          content: post.text,
          metadata: {
            timestamp: post.timestamp,
            reactions: post.reactions,
            comments: post.comments,
            shares: post.shares,
            topics: enrichedData.topics,
            sentiment: enrichedData.sentiment,
          },
        };

        prospects.push(prospectData);
      }
    }

    if (prospects.length > 0) {
      await supabase.from('scan_processed_items').insert(prospects);
    }

    return prospects;
  }

  static async pollScanStatus(scanId: string): Promise<{
    status: string;
    pipeline_state: string;
    message: string;
    progress: number;
    estimated_remaining_seconds: number;
    ocr_confidence?: number;
    taglish_score?: number;
  }> {
    const { data, error } = await supabase
      .from('scans')
      .select('status, pipeline_state, processing_message, estimated_completion_time, ocr_confidence, taglish_score')
      .eq('id', scanId)
      .single();

    if (error || !data) {
      throw new Error('Scan not found');
    }

    const progress = ScanPipelineStateMachine.getStateProgress(data.pipeline_state as any) || 0;

    let estimated_remaining_seconds = 0;
    if (data.estimated_completion_time) {
      const now = Date.now();
      const completionTime = new Date(data.estimated_completion_time).getTime();
      estimated_remaining_seconds = Math.max(0, Math.round((completionTime - now) / 1000));
    }

    return {
      status: data.status,
      pipeline_state: data.pipeline_state,
      message: data.processing_message || 'Processing...',
      progress,
      estimated_remaining_seconds,
      ocr_confidence: data.ocr_confidence,
      taglish_score: data.taglish_score,
    };
  }
}
