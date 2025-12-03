export interface OcrBlock {
  text: string;
  confidence: number;
  type: 'heading' | 'subheading' | 'body' | 'fine_print' | 'table_like';
  source: 'screenshot';
  pageUrl: string;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface OcrInput {
  screenshotBase64: string;
  pageUrl: string;
  regionHints?: string[];
}

export interface OcrOutput {
  blocks: OcrBlock[];
  rawText: string;
  confidence: number;
}

class OcrService {
  /**
   * Extract text blocks from screenshot
   * In production, this would use Tesseract.js, Google Vision API, or similar
   */
  async extractBlocks(input: OcrInput): Promise<OcrOutput> {
    try {
      // For now, simulate OCR extraction
      // In production, would use actual OCR library
      const blocks = this.simulateOcrExtraction(input.pageUrl);

      const rawText = blocks.map(b => b.text).join('\n\n');
      const avgConfidence = blocks.reduce((sum, b) => sum + b.confidence, 0) / Math.max(blocks.length, 1);

      return {
        blocks,
        rawText,
        confidence: avgConfidence,
      };
    } catch (error) {
      console.error('OCR extraction error:', error);
      return {
        blocks: [],
        rawText: '',
        confidence: 0,
      };
    }
  }

  /**
   * Process multiple screenshots in parallel
   */
  async extractFromMultiple(inputs: OcrInput[]): Promise<OcrOutput[]> {
    const results = await Promise.all(
      inputs.map(input => this.extractBlocks(input))
    );
    return results;
  }

  /**
   * Simulate OCR extraction (for development)
   * In production, replace with real OCR API calls
   */
  private simulateOcrExtraction(pageUrl: string): OcrBlock[] {
    // Simulate finding compensation plan text, product info, etc.
    const blocks: OcrBlock[] = [];

    // Simulate finding headers
    if (pageUrl.includes('compensation') || pageUrl.includes('plan')) {
      blocks.push({
        text: 'COMPENSATION PLAN',
        confidence: 0.98,
        type: 'heading',
        source: 'screenshot',
        pageUrl,
        boundingBox: { x: 100, y: 50, width: 400, height: 60 },
      });

      blocks.push({
        text: 'BINARY SYSTEM - EARN UP TO 21% GENERATION BONUS',
        confidence: 0.95,
        type: 'subheading',
        source: 'screenshot',
        pageUrl,
        boundingBox: { x: 100, y: 120, width: 600, height: 40 },
      });

      blocks.push({
        text: 'Direct Referral Bonus: 10% of sales volume\n' +
              'Pairing Bonus: Points-based matching system\n' +
              'Leadership Bonus: Up to 21% on generation levels\n' +
              'Car Incentive: Qualify with 5,000 PV monthly\n' +
              'Travel Rewards: International trips for top performers',
        confidence: 0.92,
        type: 'body',
        source: 'screenshot',
        pageUrl,
        boundingBox: { x: 100, y: 170, width: 700, height: 250 },
      });

      blocks.push({
        text: 'RANK PROGRESSION\n' +
              'Diamond: 1,000 PV\n' +
              'Crown Diamond: 5,000 PV\n' +
              'Royal Crown Diamond: 10,000 PV\n' +
              'Imperial Crown Diamond: 25,000 PV',
        confidence: 0.90,
        type: 'table_like',
        source: 'screenshot',
        pageUrl,
        boundingBox: { x: 100, y: 440, width: 400, height: 200 },
      });
    }

    // Simulate finding product information
    if (pageUrl.includes('product') || pageUrl.includes('shop')) {
      blocks.push({
        text: 'PREMIUM HEALTH PRODUCTS',
        confidence: 0.97,
        type: 'heading',
        source: 'screenshot',
        pageUrl,
        boundingBox: { x: 100, y: 50, width: 500, height: 60 },
      });

      blocks.push({
        text: 'C24/7 Natura-Ceuticals - Complete Phytonutrients\n' +
              'Choleduz - Cholesterol Management\n' +
              'Restorlyf - Joint & Muscle Support\n' +
              'Complete - Meal Replacement\n' +
              'Burn Slim - Metabolic Support',
        confidence: 0.93,
        type: 'body',
        source: 'screenshot',
        pageUrl,
        boundingBox: { x: 100, y: 120, width: 700, height: 250 },
      });
    }

    // Simulate finding opportunity/business info
    if (pageUrl.includes('opportunity') || pageUrl.includes('join') || pageUrl.includes('business')) {
      blocks.push({
        text: 'START YOUR OWN BUSINESS',
        confidence: 0.96,
        type: 'heading',
        source: 'screenshot',
        pageUrl,
        boundingBox: { x: 100, y: 50, width: 600, height: 70 },
      });

      blocks.push({
        text: 'Low startup cost - Begin with minimal investment\n' +
              'Flexible schedule - Work from anywhere\n' +
              'Unlimited income potential - No salary cap\n' +
              'Training & support - Full mentorship program\n' +
              'Global opportunity - Expand internationally',
        confidence: 0.94,
        type: 'body',
        source: 'screenshot',
        pageUrl,
        boundingBox: { x: 100, y: 130, width: 700, height: 220 },
      });

      blocks.push({
        text: 'JOIN NOW - Limited Time Offer',
        confidence: 0.95,
        type: 'subheading',
        source: 'screenshot',
        pageUrl,
        boundingBox: { x: 100, y: 360, width: 400, height: 50 },
      });
    }

    // Simulate finding testimonials
    if (blocks.length === 0) {
      // Default content if no specific page type matched
      blocks.push({
        text: 'Information extracted from page screenshot',
        confidence: 0.85,
        type: 'body',
        source: 'screenshot',
        pageUrl,
      });
    }

    return blocks;
  }

  /**
   * Post-process OCR text to improve quality
   */
  postProcess(blocks: OcrBlock[]): OcrBlock[] {
    return blocks.map(block => ({
      ...block,
      text: this.cleanText(block.text),
    }));
  }

  /**
   * Clean and normalize extracted text
   */
  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\S\r\n]+/g, ' ') // Remove excessive spaces
      .trim();
  }

  /**
   * Detect if text contains compensation plan information
   */
  isCompensationPlanText(text: string): boolean {
    const keywords = [
      'compensation plan',
      'binary',
      'unilevel',
      'bonus',
      'commission',
      'rank',
      'generation bonus',
      'pairing',
      'matching bonus',
      'direct referral',
    ];

    const lowerText = text.toLowerCase();
    return keywords.some(keyword => lowerText.includes(keyword));
  }

  /**
   * Detect if text contains product information
   */
  isProductText(text: string): boolean {
    const keywords = [
      'product',
      'supplement',
      'ingredients',
      'benefits',
      'price',
      'package',
      'bundle',
    ];

    const lowerText = text.toLowerCase();
    return keywords.some(keyword => lowerText.includes(keyword));
  }
}

export const ocrService = new OcrService();
