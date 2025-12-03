import { supabase } from '../../lib/supabase';

export interface LearningPattern {
  patternType: string;
  patternKey: string;
  patternData: any;
  industries?: string[];
}

export class CrowdLearningEngine {

  async recordPattern(pattern: LearningPattern): Promise<void> {
    const { data: existing } = await supabase
      .from('crowd_learning_patterns')
      .select('*')
      .eq('pattern_type', pattern.patternType)
      .eq('pattern_key', pattern.patternKey)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('crowd_learning_patterns')
        .update({
          occurrence_count: existing.occurrence_count + 1,
          pattern_data: this.mergePatternData(existing.pattern_data, pattern.patternData),
          industries: this.mergeArrays(existing.industries, pattern.industries),
          last_updated: new Date().toISOString()
        })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('crowd_learning_patterns')
        .insert({
          pattern_type: pattern.patternType,
          pattern_key: pattern.patternKey,
          pattern_data: pattern.patternData,
          industries: pattern.industries || [],
          occurrence_count: 1
        });
    }
  }

  async getPattern(patternType: string, patternKey: string): Promise<any> {
    const { data } = await supabase
      .from('crowd_learning_patterns')
      .select('*')
      .eq('pattern_type', patternType)
      .eq('pattern_key', patternKey)
      .maybeSingle();

    return data;
  }

  async getTopPatterns(patternType: string, limit: number = 10): Promise<any[]> {
    const { data } = await supabase
      .from('crowd_learning_patterns')
      .select('*')
      .eq('pattern_type', patternType)
      .order('occurrence_count', { ascending: false })
      .limit(limit);

    return data || [];
  }

  async recordNameOccupationPattern(name: string, occupation: string): Promise<void> {
    const normalizedName = this.normalizeName(name);
    await this.recordPattern({
      patternType: 'name_occupation',
      patternKey: normalizedName,
      patternData: { occupation, sample_count: 1 }
    });
  }

  async recordLocationIndustryPattern(location: string, industry: string): Promise<void> {
    const normalizedLocation = location.toLowerCase().trim();
    await this.recordPattern({
      patternType: 'location_industry',
      patternKey: normalizedLocation,
      patternData: { industry, sample_count: 1 },
      industries: [industry]
    });
  }

  async recordObjectionProductPattern(objection: string, product: string, industry: string): Promise<void> {
    await supabase
      .from('objection_global_patterns')
      .upsert({
        objection_text: objection,
        objection_category: this.categorizeObjection(objection),
        industries: [industry],
        frequency: 1
      }, {
        onConflict: 'objection_text',
        ignoreDuplicates: false
      });
  }

  async recordBuyingSignal(signal: string, industry: string, converted: boolean): Promise<void> {
    await this.recordPattern({
      patternType: 'buying_signal',
      patternKey: signal.toLowerCase(),
      patternData: {
        conversions: converted ? 1 : 0,
        total: 1,
        conversion_rate: converted ? 100 : 0
      },
      industries: [industry]
    });
  }

  async recordPersonalityTrait(personality: string, industry: string, outcome: string): Promise<void> {
    await this.recordPattern({
      patternType: 'personality_trait',
      patternKey: `${personality}_${industry}`,
      patternData: {
        personality,
        industry,
        outcome,
        sample_count: 1
      },
      industries: [industry]
    });
  }

  async recordConversionPath(path: any[], industry: string): Promise<void> {
    const pathKey = path.map(p => p.stage).join('->');
    await this.recordPattern({
      patternType: 'conversion_path',
      patternKey: pathKey,
      patternData: {
        path,
        conversions: 1,
        industry
      },
      industries: [industry]
    });
  }

  async updateIndustryIntelligence(industry: string, intelligenceType: string, data: any): Promise<void> {
    const { data: existing } = await supabase
      .from('industry_intelligence')
      .select('*')
      .eq('industry', industry)
      .eq('intelligence_type', intelligenceType)
      .maybeSingle();

    if (existing) {
      const mergedData = this.mergeIntelligenceData(existing.intelligence_data, data);
      const newSampleSize = (existing.sample_size || 0) + 1;

      await supabase
        .from('industry_intelligence')
        .update({
          intelligence_data: mergedData,
          sample_size: newSampleSize,
          confidence_level: this.calculateConfidence(newSampleSize),
          last_updated: new Date().toISOString()
        })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('industry_intelligence')
        .insert({
          industry,
          intelligence_type: intelligenceType,
          intelligence_data: data,
          sample_size: 1,
          confidence_level: 10
        });
    }
  }

  async getIndustryIntelligence(industry: string, intelligenceType: string): Promise<any> {
    const { data } = await supabase
      .from('industry_intelligence')
      .select('*')
      .eq('industry', industry)
      .eq('intelligence_type', intelligenceType)
      .maybeSingle();

    return data;
  }

  async updateCompanyRegistry(companyName: string, companyData: any): Promise<void> {
    const normalizedName = this.normalizeCompanyName(companyName);

    const { data: existing } = await supabase
      .from('company_global_registry')
      .select('*')
      .eq('company_normalized_name', normalizedName)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('company_global_registry')
        .update({
          total_mentions: existing.total_mentions + 1,
          industry: companyData.industry || existing.industry,
          company_type: companyData.company_type || existing.company_type,
          common_products: this.mergeArrays(existing.common_products, companyData.products),
          common_objections: this.mergeArrays(existing.common_objections, companyData.objections),
          typical_buyer_profile: this.mergeBuyerProfiles(existing.typical_buyer_profile, companyData.buyer_profile),
          last_mentioned: new Date().toISOString()
        })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('company_global_registry')
        .insert({
          company_name: companyName,
          company_normalized_name: normalizedName,
          industry: companyData.industry,
          company_type: companyData.company_type,
          common_products: companyData.products || [],
          common_objections: companyData.objections || [],
          typical_buyer_profile: companyData.buyer_profile || {},
          total_mentions: 1
        });
    }
  }

  async getCompanyIntelligence(companyName: string): Promise<any> {
    const normalizedName = this.normalizeCompanyName(companyName);

    const { data } = await supabase
      .from('company_global_registry')
      .select('*')
      .eq('company_normalized_name', normalizedName)
      .maybeSingle();

    return data;
  }

  async getSuccessfulObjectionResponses(objection: string, industry?: string): Promise<any[]> {
    let query = supabase
      .from('objection_global_patterns')
      .select('*')
      .ilike('objection_text', `%${objection}%`)
      .order('conversion_rate', { ascending: false });

    if (industry) {
      query = query.contains('industries', [industry]);
    }

    const { data } = await query.limit(5);

    return data || [];
  }

  async recordObjectionResponse(objection: string, response: string, wasSuccessful: boolean, industry: string): Promise<void> {
    const { data: existing } = await supabase
      .from('objection_global_patterns')
      .select('*')
      .ilike('objection_text', objection)
      .maybeSingle();

    if (existing) {
      const responses = existing.successful_responses || [];
      if (wasSuccessful) {
        responses.push({
          response,
          industry,
          timestamp: new Date().toISOString()
        });
      }

      const totalAttempts = (existing.frequency || 0) + 1;
      const successfulAttempts = wasSuccessful
        ? responses.length
        : responses.length;

      const conversionRate = (successfulAttempts / totalAttempts) * 100;

      await supabase
        .from('objection_global_patterns')
        .update({
          successful_responses: responses.slice(-10),
          frequency: totalAttempts,
          conversion_rate: conversionRate,
          last_encountered: new Date().toISOString()
        })
        .eq('id', existing.id);
    }
  }

  async getSimilarProspects(prospectData: any, industry: string): Promise<any[]> {
    const patterns: any[] = [];

    if (prospectData.occupation) {
      const occupationPattern = await this.getPattern('name_occupation', this.normalizeName(prospectData.name));
      if (occupationPattern) patterns.push(occupationPattern);
    }

    if (prospectData.location) {
      const locationPattern = await this.getPattern('location_industry', prospectData.location.toLowerCase());
      if (locationPattern) patterns.push(locationPattern);
    }

    return patterns;
  }

  async predictProspectBehavior(prospectData: any, industry: string): Promise<any> {
    const predictions: any = {
      likely_objections: [],
      buying_signals_to_watch: [],
      recommended_personality_approach: 'balanced',
      estimated_conversion_probability: 50
    };

    const industryIntel = await this.getIndustryIntelligence(industry, 'objections');
    if (industryIntel) {
      predictions.likely_objections = industryIntel.intelligence_data.common_objections || [];
    }

    const buyingSignals = await this.getTopPatterns('buying_signal', 5);
    predictions.buying_signals_to_watch = buyingSignals
      .filter(s => s.industries?.includes(industry))
      .map(s => s.pattern_key);

    if (prospectData.personality_type) {
      const personalityPatterns = await this.getPattern(
        'personality_trait',
        `${prospectData.personality_type}_${industry}`
      );
      if (personalityPatterns) {
        predictions.recommended_personality_approach = prospectData.personality_type;
      }
    }

    return predictions;
  }

  private normalizeName(name: string): string {
    return name.toLowerCase().trim().replace(/\s+/g, '_');
  }

  private normalizeCompanyName(name: string): string {
    return name.toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
  }

  private categorizeObjection(objection: string): string {
    const lowerObjection = objection.toLowerCase();

    if (lowerObjection.includes('price') || lowerObjection.includes('expensive') || lowerObjection.includes('mahal')) {
      return 'price';
    }
    if (lowerObjection.includes('time') || lowerObjection.includes('busy')) {
      return 'time';
    }
    if (lowerObjection.includes('scam') || lowerObjection.includes('trust') || lowerObjection.includes('legit')) {
      return 'trust';
    }
    if (lowerObjection.includes('not interested') || lowerObjection.includes('no need')) {
      return 'interest';
    }

    return 'other';
  }

  private mergePatternData(existing: any, newData: any): any {
    if (typeof existing !== 'object' || typeof newData !== 'object') {
      return newData;
    }

    const merged = { ...existing };

    Object.keys(newData).forEach(key => {
      if (key === 'sample_count') {
        merged[key] = (existing[key] || 0) + (newData[key] || 0);
      } else if (key === 'conversions' || key === 'total') {
        merged[key] = (existing[key] || 0) + (newData[key] || 0);
      } else if (key === 'conversion_rate') {
        merged[key] = merged.conversions && merged.total
          ? (merged.conversions / merged.total) * 100
          : 0;
      } else if (!existing[key]) {
        merged[key] = newData[key];
      }
    });

    return merged;
  }

  private mergeIntelligenceData(existing: any, newData: any): any {
    if (typeof existing !== 'object' || typeof newData !== 'object') {
      return { ...existing, ...newData };
    }

    const merged = { ...existing };

    Object.keys(newData).forEach(key => {
      if (Array.isArray(existing[key]) && Array.isArray(newData[key])) {
        merged[key] = [...new Set([...existing[key], ...newData[key]])];
      } else if (!existing[key]) {
        merged[key] = newData[key];
      }
    });

    return merged;
  }

  private mergeBuyerProfiles(existing: any, newProfile: any): any {
    if (!existing || typeof existing !== 'object') return newProfile;
    if (!newProfile || typeof newProfile !== 'object') return existing;

    const merged = { ...existing };

    Object.keys(newProfile).forEach(key => {
      if (Array.isArray(existing[key]) && Array.isArray(newProfile[key])) {
        merged[key] = [...new Set([...existing[key], ...newProfile[key]])];
      } else if (!existing[key]) {
        merged[key] = newProfile[key];
      }
    });

    return merged;
  }

  private mergeArrays(arr1: any[], arr2?: any[]): any[] {
    if (!arr1) arr1 = [];
    if (!arr2) arr2 = [];
    return [...new Set([...arr1, ...arr2])];
  }

  private calculateConfidence(sampleSize: number): number {
    if (sampleSize >= 1000) return 95;
    if (sampleSize >= 500) return 85;
    if (sampleSize >= 100) return 75;
    if (sampleSize >= 50) return 65;
    if (sampleSize >= 10) return 50;
    return 30;
  }

  async recordLearningEvent(eventType: string, userId: string, prospectId: string, eventData: any, outcome?: string): Promise<void> {
    await supabase
      .from('learning_feedback_events')
      .insert({
        event_type: eventType,
        user_id: userId,
        prospect_id: prospectId,
        event_data: eventData,
        outcome: outcome,
        learning_value: this.calculateLearningValue(eventType, outcome)
      });
  }

  private calculateLearningValue(eventType: string, outcome?: string): number {
    const eventValues: Record<string, number> = {
      'conversion': 100,
      'objection_handled': 80,
      'pipeline_moved': 60,
      'message_sent': 40,
      'scan_completed': 20
    };

    let value = eventValues[eventType] || 10;

    if (outcome === 'success') value *= 1.5;
    if (outcome === 'failure') value *= 0.5;

    return Math.min(value, 100);
  }
}

export const crowdLearningEngine = new CrowdLearningEngine();
