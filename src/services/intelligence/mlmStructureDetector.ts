class MLMStructureDetector {
  async detect(parsedPages: any[], aggregatedData: any): Promise<any> {
    const allText = parsedPages.map(p => p.text).join('\n').toLowerCase();

    const detected = this.detectMLMKeywords(allText);

    if (!detected) {
      return { detected: false, confidenceScore: 0 };
    }

    return {
      detected: true,
      planType: this.detectPlanType(allText),
      planName: this.extractPlanName(allText),
      compensationPlan: this.extractCompensationPlan(allText),
      rankSystem: this.extractRankSystem(allText),
      bonuses: this.extractBonuses(allText),
      incentives: this.extractIncentives(allText),
      requirements: this.extractRequirements(allText),
      rawText: allText.substring(0, 5000),
      confidenceScore: this.calculateConfidence(allText),
    };
  }

  private detectMLMKeywords(text: string): boolean {
    const mlmKeywords = [
      'compensation plan', 'binary plan', 'unilevel', 'matrix plan',
      'downline', 'upline', 'sponsor', 'distributor', 'network marketing',
      'mlm', 'direct selling', 'referral bonus', 'pairing bonus',
      'rank advancement', 'leadership bonus', 'generation bonus'
    ];

    return mlmKeywords.some(keyword => text.includes(keyword));
  }

  private detectPlanType(text: string): string {
    if (text.includes('binary')) return 'binary';
    if (text.includes('unilevel') || text.includes('uni-level')) return 'unilevel';
    if (text.includes('matrix')) return 'matrix';
    if (text.includes('hybrid')) return 'hybrid';
    return 'unspecified';
  }

  private extractPlanName(text: string): string {
    const match = text.match(/(?:plan|program)\s+(?:name|called)\s*:?\s*([a-z\s]{3,50})/i);
    return match ? match[1].trim() : 'Compensation Plan';
  }

  private extractCompensationPlan(text: string): any {
    return {
      directReferralBonus: this.extractPattern(text, /direct\s+(?:referral|sponsor)\s+bonus[:\s]*([^.\n]{10,100})/i),
      pairingBonus: this.extractPattern(text, /pairing\s+bonus[:\s]*([^.\n]{10,100})/i),
      leadershipBonus: this.extractPattern(text, /leadership\s+bonus[:\s]*([^.\n]{10,100})/i),
      matchingBonus: this.extractPattern(text, /matching\s+bonus[:\s]*([^.\n]{10,100})/i),
    };
  }

  private extractRankSystem(text: string): any[] {
    const ranks = [];
    const rankKeywords = ['starter', 'bronze', 'silver', 'gold', 'platinum', 'diamond', 'ruby', 'emerald', 'sapphire', 'ambassador', 'executive', 'director', 'president'];

    for (const rank of rankKeywords) {
      if (text.includes(rank)) {
        ranks.push({ name: rank, level: ranks.length + 1 });
      }
    }

    return ranks;
  }

  private extractBonuses(text: string): string[] {
    const bonuses = [];
    if (text.includes('direct bonus')) bonuses.push('Direct Referral Bonus');
    if (text.includes('pairing bonus')) bonuses.push('Pairing Bonus');
    if (text.includes('matching bonus')) bonuses.push('Matching Bonus');
    if (text.includes('leadership bonus')) bonuses.push('Leadership Bonus');
    if (text.includes('generation bonus')) bonuses.push('Generation Bonus');
    if (text.includes('infinity bonus')) bonuses.push('Infinity Bonus');
    return bonuses;
  }

  private extractIncentives(text: string): string[] {
    const incentives = [];
    if (text.match(/car\s+(?:bonus|incentive|program)/i)) incentives.push('Car Incentive');
    if (text.match(/travel|trip|vacation/i)) incentives.push('Travel Incentives');
    if (text.match(/retreat|convention|event/i)) incentives.push('Leadership Retreats');
    if (text.match(/recognition|award|achievement/i)) incentives.push('Recognition Programs');
    return incentives;
  }

  private extractRequirements(text: string): any {
    const pvMatch = text.match(/(\d+)\s*(?:pv|points?|volume)/i);
    const salesMatch = text.match(/\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:sales|volume)/i);

    return {
      personalVolume: pvMatch ? parseInt(pvMatch[1]) : null,
      salesRequirement: salesMatch ? parseFloat(salesMatch[1].replace(/,/g, '')) : null,
    };
  }

  private extractPattern(text: string, pattern: RegExp): string | null {
    const match = text.match(pattern);
    return match ? match[1].trim() : null;
  }

  private calculateConfidence(text: string): number {
    let score = 0;
    if (text.includes('compensation')) score += 20;
    if (text.includes('bonus')) score += 15;
    if (text.includes('rank')) score += 15;
    if (text.includes('downline') || text.includes('upline')) score += 20;
    if (text.includes('binary') || text.includes('unilevel')) score += 30;
    return Math.min(score, 100);
  }
}

export const mlmStructureDetector = new MLMStructureDetector();
