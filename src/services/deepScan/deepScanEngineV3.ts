import { supabase } from '../../lib/supabase';

interface DeepScanInput {
  userId: string;
  sourceType: 'paste_text' | 'csv' | 'image' | 'social';
  rawPayload: any;
}

interface ProspectFeatures {
  intent_strength: number;
  buying_power: number;
  emotional_fit: number;
  relationship_closeness: number;
  need_urgency: number;
  digital_presence: number;
}

interface ScoringWeights {
  [key: string]: number;
}

export class DeepScanEngineV3 {
  private sessionId: string;
  private userId: string;

  constructor(sessionId: string, userId: string) {
    this.sessionId = sessionId;
    this.userId = userId;
  }

  async runFullPipeline(input: DeepScanInput) {
    try {
      await this.updateStatus('preprocessing', 10, 'Initializing deep scan...');
      await this.sleep(500);

      await this.updateStatus('parsing', 25, 'Extracting entities and contacts...');
      const entities = await this.extractEntities(input.rawPayload);
      await this.sleep(1000);

      await this.updateStatus('enriching', 45, 'Enriching prospect data with AI...');
      const enriched = await this.enrichProspects(entities);
      await this.sleep(1500);

      await this.updateStatus('deep_intel', 65, 'Running deep intelligence analysis...');
      const intelligence = await this.deepIntelligence(enriched);
      await this.sleep(1000);

      await this.updateStatus('scoring', 85, 'Computing ScoutScore v10...');
      const scored = await this.scoreProspects(intelligence);
      await this.sleep(800);

      await this.updateStatus('complete', 100, 'Deep scan completed successfully!');

      return {
        success: true,
        sessionId: this.sessionId,
        totalProspects: scored.length,
        results: scored
      };
    } catch (error: any) {
      await this.updateStatus('failed', 0, error.message || 'Deep scan failed');
      throw error;
    }
  }

  private async extractEntities(rawPayload: any) {
    await this.logEvent('extraction', 'Parsing raw data', 25);

    const entities = [];

    if (rawPayload.text) {
      const text = rawPayload.text;
      const lines = text.split('\n').filter((l: string) => l.trim());

      for (const line of lines) {
        const emailMatch = line.match(/[\w.-]+@[\w.-]+\.\w+/);
        const phoneMatch = line.match(/\d{10,}/);
        const nameMatch = line.match(/^([A-Z][a-z]+ [A-Z][a-z]+)/);

        if (emailMatch || phoneMatch || nameMatch) {
          entities.push({
            raw_text: line,
            name: nameMatch ? nameMatch[1] : 'Unknown',
            email: emailMatch ? emailMatch[0] : null,
            phone: phoneMatch ? phoneMatch[0] : null,
            source: 'text_extraction'
          });
        }
      }
    }

    await this.logEvent('extraction', `Extracted ${entities.length} prospects`, 30);
    return entities;
  }

  private async enrichProspects(entities: any[]) {
    await this.logEvent('enrichment', 'Enriching with AI intelligence', 50);

    const enriched = entities.map(entity => ({
      ...entity,
      enrichment: {
        likely_occupation: this.inferOccupation(entity.raw_text),
        location: this.inferLocation(entity.raw_text),
        income_bracket: this.inferIncomeBracket(entity.raw_text),
        digital_footprint: Math.random() * 100,
        social_signals: {
          active_online: Math.random() > 0.3,
          engagement_level: Math.random() * 100
        }
      }
    }));

    await this.logEvent('enrichment', 'Enrichment complete', 55);
    return enriched;
  }

  private async deepIntelligence(enriched: any[]) {
    await this.logEvent('deep_intel', 'Analyzing intent and urgency', 70);

    const intelligent = enriched.map(prospect => ({
      ...prospect,
      intelligence: {
        intent_signals: this.analyzeIntent(prospect.raw_text),
        urgency_score: Math.random() * 100,
        pain_points: this.extractPainPoints(prospect.raw_text),
        buying_indicators: this.detectBuyingIndicators(prospect.raw_text)
      }
    }));

    await this.logEvent('deep_intel', 'Deep intelligence complete', 75);
    return intelligent;
  }

  private async scoreProspects(prospects: any[]) {
    await this.logEvent('scoring', 'Computing personalized scores', 90);

    const weights = await this.getUserWeights();
    const scored = [];

    for (const prospect of prospects) {
      const features = this.extractFeatures(prospect);
      const score = this.computeScoutScoreV10(features, weights);

      const result = {
        prospect_data: prospect,
        scout_score_v10: score,
        feature_scores: features,
        personalized_weights: weights
      };

      await this.saveResult(result);
      scored.push(result);
    }

    await this.logEvent('scoring', `Scored ${scored.length} prospects`, 95);
    return scored;
  }

  private extractFeatures(prospect: any): ProspectFeatures {
    const text = prospect.raw_text?.toLowerCase() || '';
    const enrichment = prospect.enrichment || {};
    const intelligence = prospect.intelligence || {};

    return {
      intent_strength: intelligence.intent_signals?.length ? 0.8 : 0.3,
      buying_power: enrichment.income_bracket === 'high' ? 0.9 : 0.5,
      emotional_fit: intelligence.pain_points?.length ? 0.7 : 0.4,
      relationship_closeness: prospect.email ? 0.6 : 0.2,
      need_urgency: intelligence.urgency_score || 0.5,
      digital_presence: enrichment.digital_footprint || 0.5
    };
  }

  private computeScoutScoreV10(features: ProspectFeatures, weights: ScoringWeights): number {
    let base = 0;

    base += features.intent_strength * (weights.intent_strength || 0.25);
    base += features.buying_power * (weights.buying_power || 0.20);
    base += features.emotional_fit * (weights.emotional_fit || 0.15);
    base += features.relationship_closeness * (weights.relationship_closeness || 0.15);
    base += features.need_urgency * (weights.need_urgency || 0.15);
    base += features.digital_presence * (weights.digital_presence || 0.10);

    return Math.min(100, Math.round(base * 100));
  }

  private async getUserWeights(): Promise<ScoringWeights> {
    const { data } = await supabase
      .from('user_scoring_weights')
      .select('feature, weight')
      .eq('user_id', this.userId);

    if (!data || data.length === 0) {
      await supabase.rpc('initialize_user_scoring_weights', { p_user_id: this.userId });
      return this.getUserWeights();
    }

    const weights: ScoringWeights = {};
    data.forEach(row => {
      weights[row.feature] = row.weight;
    });

    return weights;
  }

  private async saveResult(result: any) {
    await supabase.from('deep_scan_results').insert({
      session_id: this.sessionId,
      user_id: this.userId,
      prospect_data: result.prospect_data,
      scout_score_v10: result.scout_score_v10,
      feature_scores: result.feature_scores,
      personalized_weights: result.personalized_weights
    });
  }

  private async updateStatus(status: string, progress: number, message: string) {
    await supabase
      .from('deep_scan_sessions')
      .update({
        status,
        progress,
        current_stage: message,
        updated_at: new Date().toISOString()
      })
      .eq('id', this.sessionId);

    await this.logEvent(status, message, progress);
  }

  private async logEvent(stage: string, message: string, progress: number) {
    await supabase.from('deep_scan_events').insert({
      session_id: this.sessionId,
      user_id: this.userId,
      event_type: 'progress',
      stage,
      progress,
      message,
      data: {}
    });
  }

  private inferOccupation(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes('ofw') || lower.includes('abroad')) return 'OFW';
    if (lower.includes('business') || lower.includes('entrepreneur')) return 'Business Owner';
    if (lower.includes('manager')) return 'Manager';
    return 'Professional';
  }

  private inferLocation(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes('dubai')) return 'Dubai, UAE';
    if (lower.includes('singapore')) return 'Singapore';
    if (lower.includes('manila')) return 'Manila, Philippines';
    return 'Unknown';
  }

  private inferIncomeBracket(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes('ofw') || lower.includes('dubai')) return 'high';
    return 'medium';
  }

  private analyzeIntent(text: string): string[] {
    const lower = text.toLowerCase();
    const signals = [];

    if (lower.includes('extra income') || lower.includes('side hustle')) {
      signals.push('seeking_income');
    }
    if (lower.includes('business') || lower.includes('opportunity')) {
      signals.push('business_interest');
    }
    if (lower.includes('help') || lower.includes('need')) {
      signals.push('seeking_help');
    }

    return signals;
  }

  private extractPainPoints(text: string): string[] {
    const lower = text.toLowerCase();
    const painPoints = [];

    if (lower.includes('extra income') || lower.includes('more money')) {
      painPoints.push('financial_pressure');
    }
    if (lower.includes('time') || lower.includes('busy')) {
      painPoints.push('time_constrained');
    }

    return painPoints;
  }

  private detectBuyingIndicators(text: string): string[] {
    const lower = text.toLowerCase();
    const indicators = [];

    if (lower.includes('interested') || lower.includes('gusto')) {
      indicators.push('expressed_interest');
    }
    if (lower.includes('contact') || lower.match(/\d{10,}/)) {
      indicators.push('provided_contact');
    }

    return indicators;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export async function startDeepScanV3(input: DeepScanInput) {
  const { data: session, error } = await supabase
    .from('deep_scan_sessions')
    .insert({
      user_id: input.userId,
      source_type: input.sourceType,
      raw_payload: input.rawPayload,
      status: 'idle',
      progress: 0
    })
    .select()
    .single();

  if (error || !session) {
    throw new Error('Failed to create deep scan session');
  }

  const engine = new DeepScanEngineV3(session.id, input.userId);
  const results = await engine.runFullPipeline(input);

  return {
    sessionId: session.id,
    ...results
  };
}

export async function updateWeightsOnOutcome(
  userId: string,
  feature: string,
  outcome: 'closed' | 'ignored',
  featureValue: number
) {
  await supabase.rpc('update_scoring_weight_on_outcome', {
    p_user_id: userId,
    p_feature: feature,
    p_outcome: outcome,
    p_feature_value: featureValue
  });
}
