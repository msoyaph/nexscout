interface EnrichmentInput {
  companyName: string;
  url: string;
  rawData: any;
  mlmStructure: any;
  pages: any[];
}

class AIEnrichmentEngine {
  async enrich(input: EnrichmentInput): Promise<any> {
    // In production, this would call an LLM API (OpenAI, Anthropic, etc.)
    // For now, we'll generate structured insights from the raw data

    return {
      companySummary: this.generateCompanySummary(input),
      brandVoice: this.analyzeBrandVoice(input),
      valuePropositions: this.extractValuePropositions(input),
      objectionList: this.generateObjections(input),
      productCatalogSummary: this.summarizeProducts(input.rawData.products),
      mlmOpportunitySummary: this.summarizeMLMOpportunity(input.mlmStructure),
      targetAudience: this.identifyTargetAudience(input),
      marketingIntelligence: this.analyzeMarketingPsychology(input),
      salesPsychologyNotes: this.extractSalesPsychology(input),
      qualityInsights: this.generateQualityInsights(input),
    };
  }

  private generateCompanySummary(input: EnrichmentInput): string {
    const { companyName, rawData } = input;
    const identity = rawData.companyIdentity;

    let summary = `${companyName} is `;

    if (input.mlmStructure.detected) {
      summary += `a ${input.mlmStructure.planType} MLM company `;
    } else {
      summary += `a company `;
    }

    if (identity.industries?.length > 0) {
      summary += `specializing in ${identity.industries.join(', ')} `;
    }

    if (rawData.products?.length > 0) {
      const categories = [...new Set(rawData.products.map((p: any) => p.category))];
      summary += `offering ${categories.join(', ')} products. `;
    }

    if (identity.mission) {
      summary += `Their mission: ${identity.mission.substring(0, 200)} `;
    }

    return summary.trim();
  }

  private analyzeBrandVoice(input: EnrichmentInput): any {
    const text = input.rawData.allText.toLowerCase();

    const tones = [];
    if (text.match(/dream|achieve|success|freedom|lifestyle/)) tones.push('Aspirational');
    if (text.match(/science|research|study|clinical|proven/)) tones.push('Scientific');
    if (text.match(/luxury|premium|exclusive|elite/)) tones.push('Luxury');
    if (text.match(/community|family|together|team/)) tones.push('Community-focused');
    if (text.match(/empower|transform|change|impact/)) tones.push('Inspirational');
    if (text.match(/limited|now|today|urgent|don't miss/)) tones.push('Urgency-driven');

    return {
      primaryTone: tones[0] || 'Professional',
      tones,
      coreThemes: this.extractCoreThemes(text),
      emotionalAppeal: tones.length > 2 ? 'High' : 'Moderate',
    };
  }

  private extractCoreThemes(text: string): string[] {
    const themes = [];
    if (text.includes('financial freedom') || text.includes('passive income')) themes.push('Financial Freedom');
    if (text.includes('health') || text.includes('wellness')) themes.push('Health & Wellness');
    if (text.includes('entrepreneurship') || text.includes('business owner')) themes.push('Entrepreneurship');
    if (text.includes('time freedom') || text.includes('work from home')) themes.push('Lifestyle Flexibility');
    if (text.includes('community') || text.includes('network')) themes.push('Community Building');
    return themes;
  }

  private extractValuePropositions(input: EnrichmentInput): string[] {
    const props: string[] = [];
    const text = input.rawData.allText;

    // Extract sentences with value indicators
    const sentences = text.split(/[.!?]\s+/);
    const valueKeywords = ['benefit', 'advantage', 'unique', 'exclusive', 'proven', 'guarantee', 'free', 'bonus'];

    for (const sentence of sentences) {
      if (valueKeywords.some(kw => sentence.toLowerCase().includes(kw)) && sentence.length < 150) {
        props.push(sentence.trim());
        if (props.length >= 10) break;
      }
    }

    return props.length > 0 ? props : [
      'Quality products',
      'Business opportunity',
      'Income potential',
      'Training and support',
      'Global network',
    ];
  }

  private generateObjections(input: EnrichmentInput): string[] {
    const objections = [
      'Is this a pyramid scheme?',
      'How much does it cost to start?',
      'How much time do I need to invest?',
      'Can I really make money with this?',
      'What if I don\'t have sales experience?',
      'Is there a money-back guarantee?',
      'What kind of training do you provide?',
      'How long until I see results?',
      'Do I need to buy inventory?',
      'What are the ongoing costs?',
    ];

    return objections;
  }

  private summarizeProducts(products: any[]): string {
    if (!products || products.length === 0) {
      return 'No products detected.';
    }

    const categories = [...new Set(products.map(p => p.category))];
    return `${products.length} products across ${categories.length} categories: ${categories.join(', ')}`;
  }

  private summarizeMLMOpportunity(mlmStructure: any): string | null {
    if (!mlmStructure.detected) return null;

    let summary = `${mlmStructure.planType} compensation plan`;

    if (mlmStructure.bonuses?.length > 0) {
      summary += ` with ${mlmStructure.bonuses.length} bonus types`;
    }

    if (mlmStructure.rankSystem?.length > 0) {
      summary += ` and ${mlmStructure.rankSystem.length} rank levels`;
    }

    return summary;
  }

  private identifyTargetAudience(input: EnrichmentInput): string[] {
    const text = input.rawData.allText.toLowerCase();
    const audiences = [];

    if (text.match(/entrepreneur|business owner|self-employed/)) audiences.push('Aspiring Entrepreneurs');
    if (text.match(/stay-at-home|work from home|flexible schedule/)) audiences.push('Stay-at-home Parents');
    if (text.match(/health conscious|wellness|fitness/)) audiences.push('Health-conscious Individuals');
    if (text.match(/retire|pension|financial security/)) audiences.push('Pre-retirement Professionals');
    if (text.match(/millennial|young|student/)) audiences.push('Young Professionals');
    if (text.match(/ofw|overseas|expatriate/)) audiences.push('Overseas Workers');

    return audiences.length > 0 ? audiences : ['General Public', 'Aspiring Entrepreneurs'];
  }

  private analyzeMarketingPsychology(input: EnrichmentInput): any {
    const ctas = input.pages.flatMap(p => p.ctaButtons || []);
    const text = input.rawData.allText.toLowerCase();

    return {
      urgencyTactics: text.match(/limited|now|today|hurry|don't miss/i) ? 'High' : 'Low',
      socialProof: text.match(/testimonial|review|success story|member/i) ? 'Present' : 'Absent',
      scarcityMentioned: text.match(/limited spots|exclusive|only \d+|while supplies/i) ? true : false,
      ctaCount: ctas.length,
      primaryCTAType: ctas[0]?.type || 'unknown',
      emotionalTriggers: this.identifyEmotionalTriggers(text),
    };
  }

  private identifyEmotionalTriggers(text: string): string[] {
    const triggers = [];
    if (text.includes('freedom')) triggers.push('Freedom');
    if (text.includes('security')) triggers.push('Security');
    if (text.includes('success')) triggers.push('Achievement');
    if (text.includes('family')) triggers.push('Family');
    if (text.includes('dream')) triggers.push('Aspiration');
    return triggers;
  }

  private extractSalesPsychology(input: EnrichmentInput): string[] {
    const notes = [];
    const text = input.rawData.allText.toLowerCase();

    if (text.includes('financial freedom')) notes.push('Emphasizes financial freedom');
    if (text.includes('success stor')) notes.push('Uses community success stories');
    if (text.includes('bonus') || text.includes('incentive')) notes.push('Strong incentive-based motivation');
    if (input.mlmStructure.incentives?.length > 0) notes.push('Multiple reward programs');
    if (text.match(/guarantee|risk-free|money back/)) notes.push('Risk reversal strategy');

    return notes;
  }

  private generateQualityInsights(input: EnrichmentInput): any {
    return {
      dataCompleteness: input.rawData.products?.length > 5 ? 'High' : 'Moderate',
      structureClarity: input.mlmStructure.detected ? 'Clear MLM structure' : 'Standard business model',
      contentDepth: input.pages.length > 10 ? 'Comprehensive' : 'Basic',
      recommendedActions: this.generateRecommendations(input),
    };
  }

  private generateRecommendations(input: EnrichmentInput): string[] {
    const recommendations = [];

    if (!input.rawData.companyIdentity.mission) {
      recommendations.push('Add company mission statement');
    }

    if (input.rawData.products.length < 3) {
      recommendations.push('Add more product information');
    }

    if (input.mlmStructure.detected && !input.mlmStructure.rankSystem?.length) {
      recommendations.push('Clarify rank progression system');
    }

    return recommendations;
  }
}

export const aiEnrichmentEngine = new AIEnrichmentEngine();
