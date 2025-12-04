interface ScoringInput {
  pagesCrawled: number;
  companyIdentity: any;
  products: any[];
  mlmStructure: any;
  seoSignals: any;
  brandVoice: any;
}

class CrawlQualityScorer {
  calculateScore(input: ScoringInput): number {
    let score = 0;

    // Pages crawled (0-15 points)
    score += Math.min(input.pagesCrawled * 0.75, 15);

    // Company identity (0-25 points)
    if (input.companyIdentity.companyName) score += 10;
    if (input.companyIdentity.mission) score += 5;
    if (input.companyIdentity.about) score += 5;
    if (input.companyIdentity.foundedYear) score += 5;

    // Products (0-20 points)
    if (input.products.length > 0) score += 5;
    if (input.products.length >= 5) score += 10;
    if (input.products.length >= 10) score += 5;

    // MLM structure (0-20 points)
    if (input.mlmStructure.detected) {
      score += 10;
      if (input.mlmStructure.rankSystem?.length > 0) score += 5;
      if (input.mlmStructure.bonuses?.length > 0) score += 5;
    }

    // SEO signals (0-10 points)
    if (input.seoSignals.titles?.length > 0) score += 3;
    if (input.seoSignals.descriptions?.length > 0) score += 3;
    if (input.seoSignals.h1s?.length > 0) score += 4;

    // Brand voice (0-10 points)
    if (input.brandVoice) {
      score += 5;
      if (input.brandVoice.tones?.length > 2) score += 5;
    }

    return Math.min(Math.round(score), 100);
  }

  getQualityLabel(score: number): string {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Basic';
    return 'Low';
  }

  getQualityDescription(score: number): string {
    if (score >= 90) return 'Full structured data extracted with comprehensive intelligence';
    if (score >= 70) return 'Product catalog and MLM structure successfully detected';
    if (score >= 50) return 'Basic company information and keywords extracted';
    return 'Limited data extracted - manual input recommended';
  }
}

export const crawlQualityScorer = new CrawlQualityScorer();
