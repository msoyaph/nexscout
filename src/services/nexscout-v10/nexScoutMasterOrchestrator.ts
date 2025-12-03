import { supabase } from '../../lib/supabase';
import { universalNormalizationEngine } from './universalNormalizationEngine';
import { multiPassScanningPipeline } from './multiPassScanningPipeline';
import { crowdLearningEngine } from './crowdLearningEngine';
import { industryModelEngine } from './industryModelEngine';

export interface IngestionRequest {
  userId: string;
  sourceType: string;
  rawData: any;
  priority?: number;
}

export class NexScoutMasterOrchestrator {

  async ingestData(request: IngestionRequest): Promise<any> {
    const { data: ingestion, error } = await supabase
      .from('data_ingestion_queue')
      .insert({
        user_id: request.userId,
        source_type: request.sourceType,
        raw_data: request.rawData,
        status: 'pending',
        priority: request.priority || 5
      })
      .select()
      .single();

    if (error || !ingestion) {
      throw new Error('Failed to queue ingestion');
    }

    await this.processIngestion(ingestion.id);

    return ingestion;
  }

  async processIngestion(ingestionId: string): Promise<any> {
    const { data: ingestion } = await supabase
      .from('data_ingestion_queue')
      .select('*')
      .eq('id', ingestionId)
      .single();

    if (!ingestion) {
      throw new Error('Ingestion not found');
    }

    await supabase
      .from('data_ingestion_queue')
      .update({
        status: 'processing',
        processing_started_at: new Date().toISOString()
      })
      .eq('id', ingestionId);

    try {
      const normalizedProspect = await universalNormalizationEngine.normalize({
        source_type: ingestion.source_type,
        raw_data: ingestion.raw_data,
        user_id: ingestion.user_id
      });

      const duplicates = await universalNormalizationEngine.findDuplicates(
        ingestion.user_id,
        normalizedProspect
      );

      let prospectId: string;

      if (duplicates.length > 0) {
        prospectId = duplicates[0].id;
        await universalNormalizationEngine.mergeProspects(
          ingestion.user_id,
          duplicates[0].id,
          prospectId
        );
      } else {
        const savedProspect = await universalNormalizationEngine.saveNormalizedProspect(
          ingestion.user_id,
          normalizedProspect
        );
        prospectId = savedProspect.id;
      }

      const scanResult = await multiPassScanningPipeline.executePipeline({
        ingestionId: ingestion.id,
        userId: ingestion.user_id,
        rawData: ingestion.raw_data,
        sourceType: ingestion.source_type
      });

      const detectedIndustry = await industryModelEngine.detectIndustry(
        normalizedProspect,
        JSON.stringify(ingestion.raw_data)
      );

      const industryScore = await industryModelEngine.calculateIndustryScore(
        { ...normalizedProspect, ...scanResult },
        detectedIndustry
      );

      const appliedTags = await industryModelEngine.applyIndustryTags(
        prospectId,
        normalizedProspect,
        JSON.stringify(ingestion.raw_data),
        detectedIndustry
      );

      await supabase
        .from('prospects_v10')
        .update({
          scoutscore_v10: scanResult.scoutscore_v10,
          confidence_score: scanResult.confidence_score,
          sentiment: scanResult.sentiment,
          personality_type: scanResult.personality_type,
          buying_capacity: scanResult.buying_capacity,
          emotion_score: scanResult.emotion_score,
          hot_prospect_score: this.calculateHotProspectScore(scanResult),
          interest_tags: [...(normalizedProspect.interest_tags || []), ...appliedTags],
          lead_stage: scanResult.lead_quality || 'new',
          updated_at: new Date().toISOString()
        })
        .eq('id', prospectId);

      await this.recordCrowdLearning(ingestion.user_id, prospectId, normalizedProspect, scanResult, detectedIndustry);

      await supabase
        .from('data_ingestion_queue')
        .update({
          status: 'completed',
          processing_completed_at: new Date().toISOString()
        })
        .eq('id', ingestionId);

      return {
        prospect_id: prospectId,
        scoutscore_v10: scanResult.scoutscore_v10,
        industry: detectedIndustry,
        lead_quality: scanResult.lead_quality
      };

    } catch (error: any) {
      const retryCount = ingestion.retry_count || 0;

      if (retryCount < 3) {
        await supabase
          .from('data_ingestion_queue')
          .update({
            status: 'retrying',
            retry_count: retryCount + 1,
            error_message: error.message
          })
          .eq('id', ingestionId);

        setTimeout(() => {
          this.processIngestion(ingestionId);
        }, Math.pow(2, retryCount) * 1000);
      } else {
        await supabase
          .from('data_ingestion_queue')
          .update({
            status: 'failed',
            error_message: error.message
          })
          .eq('id', ingestionId);
      }

      throw error;
    }
  }

  async batchIngestData(requests: IngestionRequest[]): Promise<any[]> {
    const results: any[] = [];

    const highPriority = requests.filter(r => (r.priority || 5) <= 3);
    const normalPriority = requests.filter(r => (r.priority || 5) > 3);

    for (const request of highPriority) {
      try {
        const result = await this.ingestData(request);
        results.push({ success: true, result });
      } catch (error: any) {
        results.push({ success: false, error: error.message });
      }
    }

    const normalPromises = normalPriority.map(async (request) => {
      try {
        const result = await this.ingestData(request);
        return { success: true, result };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    const normalResults = await Promise.all(normalPromises);
    results.push(...normalResults);

    return results;
  }

  async getProspectIntelligence(prospectId: string, userId: string): Promise<any> {
    const { data: prospect } = await supabase
      .from('prospects_v10')
      .select('*')
      .eq('id', prospectId)
      .eq('user_id', userId)
      .single();

    if (!prospect) {
      throw new Error('Prospect not found');
    }

    const detectedIndustry = prospect.interest_tags?.[0]
      ? await industryModelEngine.detectIndustry(prospect, prospect.interest_tags.join(' '))
      : 'General';

    const nextAction = await industryModelEngine.recommendNextAction(prospect, detectedIndustry);

    const predictions = await crowdLearningEngine.predictProspectBehavior(prospect, detectedIndustry);

    const companyIntel = prospect.occupation
      ? await crowdLearningEngine.getCompanyIntelligence(prospect.occupation)
      : null;

    return {
      prospect,
      industry: detectedIndustry,
      next_recommended_action: nextAction,
      predictions,
      company_intelligence: companyIntel,
      hot_prospect: prospect.hot_prospect_score >= 70,
      confidence_level: prospect.confidence_score >= 75 ? 'high' : 'medium'
    };
  }

  async getHotProspects(userId: string, limit: number = 20): Promise<any[]> {
    const { data } = await supabase
      .from('prospects_v10')
      .select('*')
      .eq('user_id', userId)
      .gte('hot_prospect_score', 70)
      .order('hot_prospect_score', { ascending: false })
      .limit(limit);

    return data || [];
  }

  async detectHotProspectSignals(prospectId: string, userId: string): Promise<any> {
    const { data: prospect } = await supabase
      .from('prospects_v10')
      .select('*')
      .eq('id', prospectId)
      .eq('user_id', userId)
      .single();

    if (!prospect) return { is_hot: false, signals: [] };

    const signals: string[] = [];
    let hotScore = 0;

    if (prospect.past_interactions && Array.isArray(prospect.past_interactions)) {
      const recentInteractions = prospect.past_interactions.slice(-5);
      const hotPhrases = [
        'how to join', 'paano sumali', 'magkano', 'how much',
        'price', 'presyo', 'pwede ba', 'can i', 'interested',
        'gusto ko', 'i want', 'sign up', 'register'
      ];

      recentInteractions.forEach((interaction: any) => {
        const text = (interaction.content || interaction.message || '').toLowerCase();
        const foundHot = hotPhrases.some(phrase => text.includes(phrase));
        if (foundHot) {
          signals.push('Used hot buying phrase');
          hotScore += 20;
        }
      });
    }

    if (prospect.scoutscore_v10 >= 80) {
      signals.push('High ScoutScore v10');
      hotScore += 25;
    }

    if (prospect.sentiment === 'very_positive' || prospect.sentiment === 'positive') {
      signals.push('Positive sentiment');
      hotScore += 15;
    }

    if (prospect.buying_capacity === 'high' || prospect.buying_capacity === 'very_high') {
      signals.push('Strong buying capacity');
      hotScore += 20;
    }

    if (prospect.emotion_score >= 75) {
      signals.push('High emotion engagement');
      hotScore += 10;
    }

    const isHot = hotScore >= 50;

    if (isHot && prospect.hot_prospect_score !== hotScore) {
      await supabase
        .from('prospects_v10')
        .update({ hot_prospect_score: hotScore })
        .eq('id', prospectId);
    }

    return {
      is_hot: isHot,
      hot_score: hotScore,
      signals,
      recommended_action: isHot ? 'immediate_follow_up' : 'continue_nurturing'
    };
  }

  private calculateHotProspectScore(scanResult: any): number {
    let score = 0;

    if (scanResult.scoutscore_v10 >= 80) score += 30;
    else if (scanResult.scoutscore_v10 >= 60) score += 15;

    if (scanResult.sentiment === 'very_positive') score += 25;
    else if (scanResult.sentiment === 'positive') score += 15;

    if (scanResult.buying_capacity === 'very_high') score += 25;
    else if (scanResult.buying_capacity === 'high') score += 15;

    if (scanResult.emotion_score >= 75) score += 20;
    else if (scanResult.emotion_score >= 50) score += 10;

    return Math.min(score, 100);
  }

  private async recordCrowdLearning(
    userId: string,
    prospectId: string,
    normalizedProspect: any,
    scanResult: any,
    industry: string
  ): Promise<void> {
    if (normalizedProspect.name && normalizedProspect.occupation) {
      await crowdLearningEngine.recordNameOccupationPattern(
        normalizedProspect.name,
        normalizedProspect.occupation
      );
    }

    if (normalizedProspect.location && industry) {
      await crowdLearningEngine.recordLocationIndustryPattern(
        normalizedProspect.location,
        industry
      );
    }

    if (normalizedProspect.objection_type && normalizedProspect.objection_type.length > 0) {
      for (const objection of normalizedProspect.objection_type) {
        await crowdLearningEngine.recordObjectionProductPattern(
          objection,
          normalizedProspect.product_interest?.[0] || 'unknown',
          industry
        );
      }
    }

    if (scanResult.personality_type && scanResult.personality_type !== 'unknown') {
      await crowdLearningEngine.recordPersonalityTrait(
        scanResult.personality_type,
        industry,
        scanResult.lead_quality
      );
    }

    await crowdLearningEngine.recordLearningEvent(
      'scan_completed',
      userId,
      prospectId,
      {
        scoutscore: scanResult.scoutscore_v10,
        industry,
        source_type: normalizedProspect.source
      },
      'success'
    );
  }

  async getSystemStats(userId: string): Promise<any> {
    const { data: prospects } = await supabase
      .from('prospects_v10')
      .select('scoutscore_v10, hot_prospect_score, lead_stage, sentiment')
      .eq('user_id', userId);

    const { data: queueStats } = await supabase
      .from('data_ingestion_queue')
      .select('status')
      .eq('user_id', userId);

    const totalProspects = prospects?.length || 0;
    const hotProspects = prospects?.filter(p => p.hot_prospect_score >= 70).length || 0;
    const avgScoutScore = prospects?.length
      ? prospects.reduce((sum, p) => sum + (p.scoutscore_v10 || 0), 0) / prospects.length
      : 0;

    const leadStageBreakdown = prospects?.reduce((acc: any, p) => {
      acc[p.lead_stage] = (acc[p.lead_stage] || 0) + 1;
      return acc;
    }, {});

    const queueBreakdown = queueStats?.reduce((acc: any, q) => {
      acc[q.status] = (acc[q.status] || 0) + 1;
      return acc;
    }, {});

    return {
      total_prospects: totalProspects,
      hot_prospects: hotProspects,
      avg_scoutscore: Math.round(avgScoutScore * 100) / 100,
      lead_stage_breakdown: leadStageBreakdown,
      queue_status: queueBreakdown,
      system_health: 'operational'
    };
  }
}

export const nexScoutMasterOrchestrator = new NexScoutMasterOrchestrator();
