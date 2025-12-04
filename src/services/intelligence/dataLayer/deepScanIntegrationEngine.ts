import { dataSyncEngine } from './dataSyncEngine';
import { offerMatchingEngine } from './offerMatchingEngine';
import { autoTaggingEngine } from './autoTaggingEngine';

interface ProspectAnalysis {
  prospect_id: string;
  match_score: number;
  match_label: string;
  recommended_products: any[];
  persona_classification: string;
  detected_pain_points: string[];
  buying_signals: string[];
  readiness_score: number;
  next_best_action: string;
  talking_points: string[];
  objection_predictions: string[];
  metadata: {
    confidence: number;
    data_completeness: number;
    analyzed_at: string;
  };
}

interface ProspectEnrichmentOptions {
  userId: string;
  prospectData: any;
  includeProductMatch?: boolean;
  includePersonaClassification?: boolean;
  includeBehavioralAnalysis?: boolean;
}

function classifyPersona(prospect: any): string {
  const indicators = {
    entrepreneurs: ['business', 'entrepreneur', 'owner', 'startup', 'self-employed'],
    professionals: ['professional', 'corporate', 'manager', 'employee', 'career'],
    students: ['student', 'college', 'university', 'learner'],
    parents: ['parent', 'family', 'children', 'kids', 'mom', 'dad'],
    health_enthusiasts: ['health', 'fitness', 'wellness', 'gym', 'active'],
    aspiring_sellers: ['aspiring', 'want to earn', 'sideline', 'extra income', 'passive']
  };

  const text = [
    prospect.occupation,
    prospect.bio,
    prospect.interests,
    prospect.notes
  ].filter(Boolean).join(' ').toLowerCase();

  for (const [persona, keywords] of Object.entries(indicators)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return persona;
    }
  }

  if (prospect.age && prospect.age < 25) return 'students';
  if (prospect.age && prospect.age > 55) return 'retirees';

  return 'general_market';
}

function detectPainPoints(prospect: any): string[] {
  const painPoints: string[] = [];

  const text = [
    prospect.pain_points,
    prospect.challenges,
    prospect.notes,
    prospect.conversation_summary
  ].filter(Boolean).join(' ').toLowerCase();

  const patterns = [
    { pain: 'lack_of_time', keywords: ['busy', 'no time', 'hectic', 'overwhelmed'] },
    { pain: 'lack_of_money', keywords: ['expensive', 'cant afford', 'budget', 'financial'] },
    { pain: 'lack_of_knowledge', keywords: ['dont know', 'confused', 'complicated', 'unclear'] },
    { pain: 'health_issues', keywords: ['health', 'sick', 'pain', 'medical'] },
    { pain: 'stress', keywords: ['stress', 'anxiety', 'worried', 'pressure'] },
    { pain: 'income_needs', keywords: ['need income', 'extra money', 'financial freedom', 'earn'] }
  ];

  patterns.forEach(({ pain, keywords }) => {
    if (keywords.some(keyword => text.includes(keyword))) {
      painPoints.push(pain);
    }
  });

  return painPoints.length > 0 ? painPoints : ['general_improvement'];
}

function identifyBuyingSignals(prospect: any): string[] {
  const signals: string[] = [];

  const text = [
    prospect.notes,
    prospect.conversation_summary,
    prospect.last_interaction_notes
  ].filter(Boolean).join(' ').toLowerCase();

  if (text.match(/\b(price|cost|how much|pricing)\b/)) {
    signals.push('pricing_inquiry');
  }

  if (text.match(/\b(when|start|begin|sign up)\b/)) {
    signals.push('timing_questions');
  }

  if (text.match(/\b(compare|difference|vs|versus)\b/)) {
    signals.push('comparison_shopping');
  }

  if (text.match(/\b(testimonial|review|success|results)\b/)) {
    signals.push('seeking_validation');
  }

  if (text.match(/\b(discount|promo|deal|offer)\b/)) {
    signals.push('price_sensitive');
  }

  if (text.match(/\b(need|want|looking for|interested)\b/)) {
    signals.push('active_interest');
  }

  return signals;
}

function calculateReadinessScore(
  buyingSignals: string[],
  painPoints: string[],
  engagement: any
): number {
  let score = 0;

  score += buyingSignals.length * 15;

  score += painPoints.length * 10;

  if (buyingSignals.includes('pricing_inquiry')) score += 20;
  if (buyingSignals.includes('timing_questions')) score += 25;

  if (engagement) {
    if (engagement.last_contact_days <= 7) score += 15;
    if (engagement.total_interactions >= 3) score += 10;
    if (engagement.response_rate > 0.7) score += 10;
  }

  return Math.min(100, score);
}

function determineNextAction(readinessScore: number, buyingSignals: string[]): string {
  if (readinessScore >= 70) {
    if (buyingSignals.includes('pricing_inquiry')) {
      return 'send_pricing_proposal';
    }
    return 'schedule_closing_call';
  }

  if (readinessScore >= 50) {
    if (buyingSignals.includes('seeking_validation')) {
      return 'share_testimonials';
    }
    return 'send_product_demo';
  }

  if (readinessScore >= 30) {
    return 'nurture_with_content';
  }

  return 'build_rapport';
}

function generateTalkingPoints(
  prospect: any,
  painPoints: string[],
  recommendedProducts: any[]
): string[] {
  const points: string[] = [];

  if (prospect.full_name || prospect.first_name) {
    points.push(`Build rapport: Reference ${prospect.first_name || prospect.full_name}'s background`);
  }

  painPoints.forEach(pain => {
    points.push(`Address ${pain.replace(/_/g, ' ')}`);
  });

  if (recommendedProducts.length > 0) {
    const topProduct = recommendedProducts[0];
    points.push(`Recommend: ${topProduct.product.name}`);
    if (topProduct.match_reasons && topProduct.match_reasons.length > 0) {
      points.push(`Because: ${topProduct.match_reasons[0]}`);
    }
  }

  if (prospect.interests) {
    points.push(`Connect through shared interest: ${prospect.interests}`);
  }

  return points;
}

function predictObjections(prospect: any, recommendedProducts: any[]): string[] {
  const objections: string[] = [];

  if (recommendedProducts.length > 0) {
    const avgPrice = recommendedProducts.reduce((sum, m) => sum + (m.product.price || 0), 0) / recommendedProducts.length;

    if (avgPrice > 5000) {
      objections.push('too_expensive');
    }
  }

  const text = [prospect.notes, prospect.challenges].filter(Boolean).join(' ').toLowerCase();

  if (text.includes('busy') || text.includes('no time')) {
    objections.push('no_time');
  }

  if (text.includes('think') || text.includes('consider') || text.includes('decide')) {
    objections.push('need_to_think');
  }

  if (text.includes('already') || text.includes('have')) {
    objections.push('already_have_solution');
  }

  if (objections.length === 0) {
    objections.push('too_expensive', 'no_time', 'need_to_think');
  }

  return objections;
}

function calculateMatchScore(
  productMatches: any[],
  persona: string,
  painPoints: string[]
): { score: number; label: string } {
  let score = 0;

  if (productMatches.length > 0) {
    score = productMatches[0].score;
  }

  if (persona !== 'general_market') {
    score += 10;
  }

  if (painPoints.length > 2) {
    score += 10;
  }

  let label = 'Not Product-Aligned';
  if (score >= 85) label = 'Highly Qualified';
  else if (score >= 61) label = 'Good Fit';
  else if (score >= 40) label = 'Weak Fit';

  return { score: Math.min(100, Math.round(score)), label };
}

export const deepScanIntegrationEngine = {
  async analyzeProspect(options: ProspectEnrichmentOptions): Promise<ProspectAnalysis | null> {
    const {
      userId,
      prospectData,
      includeProductMatch = true,
      includePersonaClassification = true,
      includeBehavioralAnalysis = true
    } = options;

    if (!prospectData || !prospectData.id) {
      console.error('Invalid prospect data');
      return null;
    }

    try {
      const resolved = await dataSyncEngine.resolveDataForUser(userId);

      let persona = 'general_market';
      if (includePersonaClassification) {
        persona = classifyPersona(prospectData);
      }

      const painPoints = detectPainPoints(prospectData);

      let recommendedProducts: any[] = [];
      if (includeProductMatch && resolved.products.length > 0) {
        const matches = await offerMatchingEngine.findTopMatches({
          prospectSignals: {
            pain_points: painPoints,
            persona,
            intent_tags: prospectData.tags || [],
            urgency: prospectData.urgency || 'medium',
            buying_stage: prospectData.pipeline_stage === 'decision' ? 'decision' : 'consideration'
          },
          products: resolved.products,
          variants: resolved.variants
        }, 3);

        recommendedProducts = matches;
      }

      const { score: matchScore, label: matchLabel } = calculateMatchScore(
        recommendedProducts,
        persona,
        painPoints
      );

      let buyingSignals: string[] = [];
      let readinessScore = 0;
      let nextAction = 'build_rapport';

      if (includeBehavioralAnalysis) {
        buyingSignals = identifyBuyingSignals(prospectData);
        readinessScore = calculateReadinessScore(
          buyingSignals,
          painPoints,
          prospectData.engagement_metrics
        );
        nextAction = determineNextAction(readinessScore, buyingSignals);
      }

      const talkingPoints = generateTalkingPoints(prospectData, painPoints, recommendedProducts);
      const objectionPredictions = predictObjections(prospectData, recommendedProducts);

      const dataCompleteness = [
        prospectData.full_name,
        prospectData.email,
        prospectData.phone,
        prospectData.occupation,
        prospectData.notes
      ].filter(Boolean).length / 5;

      return {
        prospect_id: prospectData.id,
        match_score: matchScore,
        match_label: matchLabel,
        recommended_products: recommendedProducts,
        persona_classification: persona,
        detected_pain_points: painPoints,
        buying_signals: buyingSignals,
        readiness_score: readinessScore,
        next_best_action: nextAction,
        talking_points: talkingPoints,
        objection_predictions: objectionPredictions,
        metadata: {
          confidence: recommendedProducts.length > 0 ? 0.85 : 0.5,
          data_completeness: dataCompleteness,
          analyzed_at: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error analyzing prospect:', error);
      return null;
    }
  },

  async enrichProspectInDatabase(userId: string, prospectId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: prospect, error: fetchError } = await supabase
        .from('prospects')
        .select('*')
        .eq('id', prospectId)
        .single();

      if (fetchError) throw fetchError;

      const analysis = await this.analyzeProspect({
        userId,
        prospectData: prospect,
        includeProductMatch: true,
        includePersonaClassification: true,
        includeBehavioralAnalysis: true
      });

      if (!analysis) {
        return { success: false, error: 'Analysis failed' };
      }

      const { error: updateError } = await supabase
        .from('prospects')
        .update({
          scout_score: analysis.match_score,
          scout_label: analysis.match_label,
          persona_classification: analysis.persona_classification,
          detected_pain_points: analysis.detected_pain_points,
          buying_signals: analysis.buying_signals,
          readiness_score: analysis.readiness_score,
          recommended_products: analysis.recommended_products.map(m => m.product.id),
          next_best_action: analysis.next_best_action,
          talking_points: analysis.talking_points,
          objection_predictions: analysis.objection_predictions,
          last_enriched_at: new Date().toISOString()
        })
        .eq('id', prospectId);

      if (updateError) throw updateError;

      return { success: true };
    } catch (error) {
      console.error('Error enriching prospect:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  async batchEnrichProspects(userId: string, prospectIds: string[]): Promise<{
    processed: number;
    errors: number;
    results: { prospect_id: string; success: boolean }[];
  }> {
    const results: { prospect_id: string; success: boolean }[] = [];
    let processed = 0;
    let errors = 0;

    for (const prospectId of prospectIds) {
      const result = await this.enrichProspectInDatabase(userId, prospectId);

      results.push({
        prospect_id: prospectId,
        success: result.success
      });

      if (result.success) {
        processed++;
      } else {
        errors++;
      }
    }

    return { processed, errors, results };
  },

  getAnalysisSummary(analysis: ProspectAnalysis): string {
    return `
Prospect Analysis Summary
━━━━━━━━━━━━━━━━━━━━━━━━
Match Score: ${analysis.match_score}/100 (${analysis.match_label})
Persona: ${analysis.persona_classification}
Readiness: ${analysis.readiness_score}/100

Pain Points: ${analysis.detected_pain_points.join(', ')}
Buying Signals: ${analysis.buying_signals.join(', ')}

Recommended Products:
${analysis.recommended_products.map((m, i) => `  ${i + 1}. ${m.product.name} (Score: ${Math.round(m.score)})`).join('\n')}

Next Action: ${analysis.next_best_action}

Talking Points:
${analysis.talking_points.map((p, i) => `  ${i + 1}. ${p}`).join('\n')}

Expected Objections: ${analysis.objection_predictions.join(', ')}
    `.trim();
  }
};
