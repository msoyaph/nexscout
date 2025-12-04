import { supabase } from '../../lib/supabase';
import { runAIOptimized } from '../ai/runAIOptimized';

export interface ScanPipelineConfig {
  ingestionId: string;
  userId: string;
  rawData: any;
  sourceType: string;
}

export interface PassResult {
  passNumber: number;
  passName: string;
  results: any;
  processingTimeMs: number;
  success: boolean;
}

export class MultiPassScanningPipeline {

  async executePipeline(config: ScanPipelineConfig): Promise<any> {
    const startTime = Date.now();

    const { data: pipelineState, error: stateError } = await supabase
      .from('scan_pipeline_state')
      .insert({
        user_id: config.userId,
        ingestion_id: config.ingestionId,
        overall_status: 'processing',
        current_pass: 1,
        progress_percentage: 0,
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (stateError || !pipelineState) {
      throw new Error('Failed to create pipeline state');
    }

    try {
      const pass1 = await this.pass1CleanExtract(pipelineState.id, config);
      await this.updatePipelineProgress(pipelineState.id, 1, 15);

      const pass2 = await this.pass2FirstPassClassification(pipelineState.id, pass1.results, config);
      await this.updatePipelineProgress(pipelineState.id, 2, 30);

      const pass3 = await this.pass3BehaviorEmotion(pipelineState.id, pass2.results, config);
      await this.updatePipelineProgress(pipelineState.id, 3, 45);

      const pass4 = await this.pass4MultiAgentDeepScan(pipelineState.id, pass3.results, config);
      await this.updatePipelineProgress(pipelineState.id, 4, 65);

      const pass5 = await this.pass5FusionLayer(pipelineState.id, [pass2, pass3, pass4], config);
      await this.updatePipelineProgress(pipelineState.id, 5, 80);

      const pass6 = await this.pass6RiskSafety(pipelineState.id, pass5.results, config);
      await this.updatePipelineProgress(pipelineState.id, 6, 90);

      const pass7 = await this.pass7FinalOutput(pipelineState.id, pass6.results, config);
      await this.updatePipelineProgress(pipelineState.id, 7, 100);

      const totalTime = Date.now() - startTime;

      await supabase
        .from('scan_pipeline_state')
        .update({
          overall_status: 'completed',
          completed_at: new Date().toISOString(),
          total_processing_time_ms: totalTime
        })
        .eq('id', pipelineState.id);

      return pass7.results;

    } catch (error) {
      await supabase
        .from('scan_pipeline_state')
        .update({
          overall_status: 'failed'
        })
        .eq('id', pipelineState.id);

      throw error;
    }
  }

  private async pass1CleanExtract(pipelineStateId: string, config: ScanPipelineConfig): Promise<PassResult> {
    const startTime = Date.now();

    await this.updatePassStatus(pipelineStateId, 1, 'processing');

    let cleanedText = '';
    let extractedData: any = {};

    if (typeof config.rawData === 'string') {
      cleanedText = this.cleanText(config.rawData);
    } else if (config.rawData.extracted_text) {
      cleanedText = this.cleanText(config.rawData.extracted_text);
    } else if (config.rawData.messages) {
      cleanedText = config.rawData.messages
        .map((m: any) => m.content || m.message || '')
        .join('\n');
      cleanedText = this.cleanText(cleanedText);
    }

    extractedData = {
      cleaned_text: cleanedText,
      detected_language: this.detectLanguage(cleanedText),
      word_count: cleanedText.split(/\s+/).length,
      has_spam: this.detectSpam(cleanedText)
    };

    const processingTime = Date.now() - startTime;

    await this.savePassResult(pipelineStateId, 1, 'Clean + Extract', extractedData, processingTime);
    await this.updatePassStatus(pipelineStateId, 1, 'completed');

    return {
      passNumber: 1,
      passName: 'Clean + Extract',
      results: extractedData,
      processingTimeMs: processingTime,
      success: true
    };
  }

  private async pass2FirstPassClassification(pipelineStateId: string, pass1Data: any, config: ScanPipelineConfig): Promise<PassResult> {
    const startTime = Date.now();

    await this.updatePassStatus(pipelineStateId, 2, 'processing');

    const text = pass1Data.cleaned_text;
    const keywords = this.extractKeywords(text);
    const industries = this.detectIndustries(text);
    const buyingIntent = this.detectBuyingIntent(text);
    const personalInfo = this.extractPersonalInfo(text);

    const classificationData = {
      keywords,
      industries,
      buying_intent: buyingIntent,
      personal_info: personalInfo,
      has_contact_info: !!(personalInfo.email || personalInfo.phone)
    };

    const processingTime = Date.now() - startTime;

    await this.savePassResult(pipelineStateId, 2, 'First-Pass Classification', classificationData, processingTime);
    await this.updatePassStatus(pipelineStateId, 2, 'completed');

    return {
      passNumber: 2,
      passName: 'First-Pass Classification',
      results: classificationData,
      processingTimeMs: processingTime,
      success: true
    };
  }

  private async pass3BehaviorEmotion(pipelineStateId: string, pass2Data: any, config: ScanPipelineConfig): Promise<PassResult> {
    const startTime = Date.now();

    await this.updatePassStatus(pipelineStateId, 3, 'processing');

    const sentiment = this.analyzeSentiment(config.rawData);
    const urgencySignals = this.detectUrgencySignals(config.rawData);
    const buyingSignals = this.detectHiddenBuyingSignals(config.rawData);

    const behaviorData = {
      sentiment,
      urgency_level: urgencySignals.level,
      urgency_signals: urgencySignals.signals,
      buying_signals: buyingSignals,
      emotion_score: this.calculateEmotionScore(sentiment, urgencySignals)
    };

    const processingTime = Date.now() - startTime;

    await this.savePassResult(pipelineStateId, 3, 'Behavior & Emotion Classification', behaviorData, processingTime);
    await this.updatePassStatus(pipelineStateId, 3, 'completed');

    return {
      passNumber: 3,
      passName: 'Behavior & Emotion Classification',
      results: behaviorData,
      processingTimeMs: processingTime,
      success: true
    };
  }

  private async pass4MultiAgentDeepScan(pipelineStateId: string, pass3Data: any, config: ScanPipelineConfig): Promise<PassResult> {
    const startTime = Date.now();

    await this.updatePassStatus(pipelineStateId, 4, 'processing');

    const [salesAnalysis, investigatorAnalysis, personalityAnalysis] = await Promise.all([
      this.runSalesAnalyst(config, pass3Data),
      this.runInvestigator(config, pass3Data),
      this.runPersonalityProfiler(config, pass3Data)
    ]);

    await supabase.from('ai_specialist_results').insert([
      {
        pipeline_state_id: pipelineStateId,
        specialist_type: 'sales_analyst',
        specialist_findings: salesAnalysis,
        confidence_score: salesAnalysis.confidence
      },
      {
        pipeline_state_id: pipelineStateId,
        specialist_type: 'investigator',
        specialist_findings: investigatorAnalysis,
        confidence_score: investigatorAnalysis.confidence
      },
      {
        pipeline_state_id: pipelineStateId,
        specialist_type: 'personality_profiler',
        specialist_findings: personalityAnalysis,
        confidence_score: personalityAnalysis.confidence
      }
    ]);

    const multiAgentData = {
      sales_analyst: salesAnalysis,
      investigator: investigatorAnalysis,
      personality_profiler: personalityAnalysis
    };

    const processingTime = Date.now() - startTime;

    await this.savePassResult(pipelineStateId, 4, 'Multi-Agent Deep Scan', multiAgentData, processingTime);
    await this.updatePassStatus(pipelineStateId, 4, 'completed');

    return {
      passNumber: 4,
      passName: 'Multi-Agent Deep Scan',
      results: multiAgentData,
      processingTimeMs: processingTime,
      success: true
    };
  }

  private async pass5FusionLayer(pipelineStateId: string, previousPasses: PassResult[], config: ScanPipelineConfig): Promise<PassResult> {
    const startTime = Date.now();

    await this.updatePassStatus(pipelineStateId, 5, 'processing');

    const pass2Data = previousPasses.find(p => p.passNumber === 2)?.results || {};
    const pass3Data = previousPasses.find(p => p.passNumber === 3)?.results || {};
    const pass4Data = previousPasses.find(p => p.passNumber === 4)?.results || {};

    const scoutScoreV10 = this.calculateScoutScoreV10({
      classification: pass2Data,
      behavior: pass3Data,
      multiAgent: pass4Data
    });

    const confidenceScore = this.calculateConfidenceScore({
      classification: pass2Data,
      behavior: pass3Data,
      multiAgent: pass4Data
    });

    const fusionData = {
      scoutscore_v10: scoutScoreV10,
      confidence_score: confidenceScore,
      buying_capacity: pass4Data.sales_analyst?.buying_capacity || 'unknown',
      personality_type: pass4Data.personality_profiler?.personality_type || 'unknown',
      sentiment: pass3Data.sentiment || 'neutral',
      lead_quality: this.determineLeadQuality(scoutScoreV10)
    };

    const processingTime = Date.now() - startTime;

    await this.savePassResult(pipelineStateId, 5, 'Fusion Layer', fusionData, processingTime);
    await this.updatePassStatus(pipelineStateId, 5, 'completed');

    return {
      passNumber: 5,
      passName: 'Fusion Layer',
      results: fusionData,
      processingTimeMs: processingTime,
      success: true
    };
  }

  private async pass6RiskSafety(pipelineStateId: string, pass5Data: any, config: ScanPipelineConfig): Promise<PassResult> {
    const startTime = Date.now();

    await this.updatePassStatus(pipelineStateId, 6, 'processing');

    const { data: complianceFilters } = await supabase
      .from('compliance_filters')
      .select('*')
      .eq('is_active', true);

    const violations: any[] = [];
    const text = JSON.stringify(config.rawData).toLowerCase();

    complianceFilters?.forEach(filter => {
      const patterns = filter.filter_rules?.patterns || [];
      patterns.forEach((pattern: string) => {
        if (text.includes(pattern.toLowerCase())) {
          violations.push({
            filter_type: filter.filter_type,
            filter_name: filter.filter_name,
            severity: filter.severity,
            detected_pattern: pattern
          });
        }
      });
    });

    const isCompliant = violations.length === 0;
    const riskLevel = this.calculateRiskLevel(violations);

    const safetyData = {
      is_compliant: isCompliant,
      violations,
      risk_level: riskLevel,
      should_proceed: isCompliant && riskLevel !== 'critical'
    };

    const processingTime = Date.now() - startTime;

    await this.savePassResult(pipelineStateId, 6, 'Risk & Safety Filter', safetyData, processingTime);
    await this.updatePassStatus(pipelineStateId, 6, 'completed');

    return {
      passNumber: 6,
      passName: 'Risk & Safety Filter',
      results: safetyData,
      processingTimeMs: processingTime,
      success: true
    };
  }

  private async pass7FinalOutput(pipelineStateId: string, pass6Data: any, config: ScanPipelineConfig): Promise<PassResult> {
    const startTime = Date.now();

    await this.updatePassStatus(pipelineStateId, 7, 'processing');

    const { data: allPasses } = await supabase
      .from('scan_pass_results')
      .select('*')
      .eq('pipeline_state_id', pipelineStateId)
      .order('pass_number', { ascending: true });

    if (!pass6Data.should_proceed) {
      throw new Error('Prospect failed compliance check');
    }

    const finalProspectProfile = this.buildFinalProfile(allPasses || []);

    const processingTime = Date.now() - startTime;

    await this.savePassResult(pipelineStateId, 7, 'Final Prospect Output', finalProspectProfile, processingTime);
    await this.updatePassStatus(pipelineStateId, 7, 'completed');

    return {
      passNumber: 7,
      passName: 'Final Prospect Output',
      results: finalProspectProfile,
      processingTimeMs: processingTime,
      success: true
    };
  }

  private async runSalesAnalyst(config: ScanPipelineConfig, contextData: any): Promise<any> {
    return {
      buying_ability: 'medium',
      product_fit: 75,
      interest_level: 'high',
      confidence: 80
    };
  }

  private async runInvestigator(config: ScanPipelineConfig, contextData: any): Promise<any> {
    return {
      social_signals: ['active_social_media', 'engaging_content'],
      status_indicators: ['professional', 'employed'],
      pain_points: ['income', 'time_freedom'],
      confidence: 75
    };
  }

  private async runPersonalityProfiler(config: ScanPipelineConfig, contextData: any): Promise<any> {
    const text = JSON.stringify(config.rawData).toLowerCase();

    let personality_type = 'unknown';
    if (text.includes('now') || text.includes('asap') || text.includes('quick')) {
      personality_type = 'driver';
    } else if (text.includes('help') || text.includes('support') || text.includes('together')) {
      personality_type = 'amiable';
    } else if (text.includes('data') || text.includes('proof') || text.includes('analyze')) {
      personality_type = 'analytical';
    } else if (text.includes('exciting') || text.includes('fun') || text.includes('amazing')) {
      personality_type = 'expressive';
    }

    return {
      personality_type,
      communication_style: this.determineCommStyle(personality_type),
      confidence: 70
    };
  }

  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s.,!?@-]/g, '')
      .trim();
  }

  private detectLanguage(text: string): string {
    const tagalogWords = ['ako', 'ka', 'ng', 'na', 'sa', 'mga', 'ang', 'po', 'naman', 'kasi'];
    const lowerText = text.toLowerCase();
    const tagalogCount = tagalogWords.filter(word => lowerText.includes(word)).length;
    return tagalogCount >= 3 ? 'tagalog' : 'english';
  }

  private detectSpam(text: string): boolean {
    const spamPatterns = ['click here', 'free money', 'winner', 'congratulations', 'claim now'];
    const lowerText = text.toLowerCase();
    return spamPatterns.some(pattern => lowerText.includes(pattern));
  }

  private extractKeywords(text: string): string[] {
    const keywords = ['business', 'income', 'investment', 'health', 'insurance', 'property', 'sales', 'marketing'];
    const lowerText = text.toLowerCase();
    return keywords.filter(keyword => lowerText.includes(keyword));
  }

  private detectIndustries(text: string): string[] {
    const industries: Record<string, string[]> = {
      'MLM': ['network', 'mlm', 'opportunity', 'recruit'],
      'Insurance': ['insurance', 'coverage', 'policy', 'protection'],
      'Real_Estate': ['property', 'condo', 'house', 'real estate'],
      'Small_Business': ['business', 'startup', 'entrepreneur', 'sales']
    };

    const detected: string[] = [];
    const lowerText = text.toLowerCase();

    Object.entries(industries).forEach(([industry, keywords]) => {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        detected.push(industry);
      }
    });

    return detected;
  }

  private detectBuyingIntent(text: string): string {
    const highIntent = ['buy', 'purchase', 'how much', 'price', 'magkano', 'join', 'sumali'];
    const mediumIntent = ['interested', 'learn more', 'tell me', 'curious'];
    const lowerText = text.toLowerCase();

    if (highIntent.some(word => lowerText.includes(word))) return 'high';
    if (mediumIntent.some(word => lowerText.includes(word))) return 'medium';
    return 'low';
  }

  private extractPersonalInfo(text: string): any {
    const emailRegex = /[^\s@]+@[^\s@]+\.[^\s@]+/;
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;

    const emailMatch = text.match(emailRegex);
    const phoneMatch = text.match(phoneRegex);

    return {
      email: emailMatch ? emailMatch[0] : null,
      phone: phoneMatch ? phoneMatch[0] : null
    };
  }

  private analyzeSentiment(rawData: any): string {
    const text = JSON.stringify(rawData).toLowerCase();
    const positive = ['happy', 'excited', 'great', 'amazing', 'love', 'yes', 'interested'];
    const negative = ['no', 'not', 'bad', 'scam', 'fake', 'angry', 'disappointed'];

    const positiveCount = positive.filter(word => text.includes(word)).length;
    const negativeCount = negative.filter(word => text.includes(word)).length;

    if (positiveCount > negativeCount + 2) return 'very_positive';
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private detectUrgencySignals(rawData: any): any {
    const text = JSON.stringify(rawData).toLowerCase();
    const urgentWords = ['now', 'asap', 'urgent', 'immediately', 'today', 'tonight'];

    const signals = urgentWords.filter(word => text.includes(word));
    const level = signals.length >= 2 ? 'high' : signals.length === 1 ? 'medium' : 'low';

    return { level, signals };
  }

  private detectHiddenBuyingSignals(rawData: any): string[] {
    const text = JSON.stringify(rawData).toLowerCase();
    const signals = [];

    if (text.includes('how to') || text.includes('paano')) signals.push('seeking_guidance');
    if (text.includes('afford') || text.includes('kaya ko ba')) signals.push('budget_consideration');
    if (text.includes('compare') || text.includes('vs')) signals.push('evaluating_options');
    if (text.includes('wife') || text.includes('husband') || text.includes('family')) signals.push('family_involvement');

    return signals;
  }

  private calculateEmotionScore(sentiment: string, urgencySignals: any): number {
    let score = 50;

    const sentimentScores: Record<string, number> = {
      'very_positive': 90,
      'positive': 70,
      'neutral': 50,
      'negative': 30,
      'very_negative': 10
    };

    score = sentimentScores[sentiment] || 50;

    if (urgencySignals.level === 'high') score += 15;
    else if (urgencySignals.level === 'medium') score += 8;

    return Math.min(score, 100);
  }

  private calculateScoutScoreV10(data: any): number {
    let score = 0;

    if (data.classification?.buying_intent === 'high') score += 30;
    else if (data.classification?.buying_intent === 'medium') score += 15;

    if (data.behavior?.sentiment === 'very_positive') score += 20;
    else if (data.behavior?.sentiment === 'positive') score += 10;

    if (data.multiAgent?.sales_analyst?.buying_ability === 'high') score += 25;
    else if (data.multiAgent?.sales_analyst?.buying_ability === 'medium') score += 15;

    if (data.multiAgent?.sales_analyst?.product_fit >= 75) score += 15;
    else if (data.multiAgent?.sales_analyst?.product_fit >= 50) score += 8;

    if (data.classification?.has_contact_info) score += 10;

    return Math.min(score, 100);
  }

  private calculateConfidenceScore(data: any): number {
    const scores = [
      data.multiAgent?.sales_analyst?.confidence || 0,
      data.multiAgent?.investigator?.confidence || 0,
      data.multiAgent?.personality_profiler?.confidence || 0
    ];

    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }

  private determineLeadQuality(scoutScore: number): string {
    if (scoutScore >= 80) return 'hot';
    if (scoutScore >= 60) return 'warm';
    if (scoutScore >= 40) return 'qualified';
    return 'cold';
  }

  private calculateRiskLevel(violations: any[]): string {
    if (violations.some(v => v.severity === 'critical')) return 'critical';
    if (violations.some(v => v.severity === 'high')) return 'high';
    if (violations.some(v => v.severity === 'medium')) return 'medium';
    return 'low';
  }

  private determineCommStyle(personalityType: string): string {
    const styles: Record<string, string> = {
      'driver': 'direct_results_focused',
      'amiable': 'relationship_focused',
      'analytical': 'data_focused',
      'expressive': 'enthusiasm_focused',
      'unknown': 'balanced'
    };
    return styles[personalityType] || 'balanced';
  }

  private buildFinalProfile(passes: any[]): any {
    const profile: any = {
      pipeline_passes_completed: passes.length,
      data_sources: {}
    };

    passes.forEach(pass => {
      profile.data_sources[`pass_${pass.pass_number}`] = pass.pass_results;
    });

    const fusionPass = passes.find(p => p.pass_number === 5);
    if (fusionPass) {
      Object.assign(profile, fusionPass.pass_results);
    }

    return profile;
  }

  private async updatePipelineProgress(pipelineStateId: string, currentPass: number, progressPercentage: number): Promise<void> {
    await supabase
      .from('scan_pipeline_state')
      .update({
        current_pass: currentPass,
        progress_percentage: progressPercentage,
        updated_at: new Date().toISOString()
      })
      .eq('id', pipelineStateId);
  }

  private async updatePassStatus(pipelineStateId: string, passNumber: number, status: string): Promise<void> {
    const passField = `pass_${passNumber}_${this.getPassFieldName(passNumber)}`;
    await supabase
      .from('scan_pipeline_state')
      .update({ [passField]: status })
      .eq('id', pipelineStateId);
  }

  private getPassFieldName(passNumber: number): string {
    const names = [
      'clean_extract',
      'classification',
      'behavior_emotion',
      'multi_agent',
      'fusion',
      'risk_safety',
      'final_output'
    ];
    return names[passNumber - 1] || 'unknown';
  }

  private async savePassResult(pipelineStateId: string, passNumber: number, passName: string, results: any, processingTimeMs: number): Promise<void> {
    await supabase
      .from('scan_pass_results')
      .insert({
        pipeline_state_id: pipelineStateId,
        pass_number: passNumber,
        pass_name: passName,
        pass_results: results,
        processing_time_ms: processingTimeMs
      });
  }
}

export const multiPassScanningPipeline = new MultiPassScanningPipeline();
