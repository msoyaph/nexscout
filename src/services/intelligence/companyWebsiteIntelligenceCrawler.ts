import { supabase } from '../../lib/supabase';
import { advancedHTMLParser } from './advancedHTMLParser';
import { mlmStructureDetector } from './mlmStructureDetector';
import { multiPageCrawler } from './multiPageCrawler';
import { aiEnrichmentEngine } from './aiEnrichmentEngine';
import { crawlQualityScorer } from './crawlQualityScorer';

export interface CrawlProgress {
  stage: string;
  message: string;
  progress: number;
  pagesProcessed: number;
  totalPages: number;
}

export interface IntelligenceCrawlResult {
  success: boolean;
  intelligenceId?: string;
  data?: any;
  qualityScore?: number;
  error?: string;
}

export class CompanyWebsiteIntelligenceCrawler {
  private onProgress?: (progress: CrawlProgress) => void;

  constructor(progressCallback?: (progress: CrawlProgress) => void) {
    this.onProgress = progressCallback;
  }

  private reportProgress(stage: string, message: string, progress: number, pagesProcessed: number = 0, totalPages: number = 0) {
    if (this.onProgress) {
      this.onProgress({ stage, message, progress, pagesProcessed, totalPages });
    }
    console.log(`[${stage}] ${message} (${progress}%)`);
  }

  async crawlCompany(
    userId: string,
    companyUrl: string,
    companyId?: string,
    companyName?: string
  ): Promise<IntelligenceCrawlResult> {
    const startTime = Date.now();
    let crawlLogId: string | null = null;

    try {
      // Create crawler log
      const { data: logData, error: logError } = await supabase
        .from('crawler_logs')
        .insert({
          user_id: userId,
          crawl_type: 'full_intelligence',
          target_url: companyUrl,
          status: 'running',
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (!logError && logData) {
        crawlLogId = logData.id;
      }

      // STAGE A: Advanced Fetch & Multi-Page Discovery
      this.reportProgress('fetch', 'Discovering website structure...', 5);

      const crawlResult = await multiPageCrawler.crawl(companyUrl, {
        maxPages: 20,
        onPageCrawled: (pageNum, total) => {
          const progress = 5 + Math.floor((pageNum / total) * 30);
          this.reportProgress('crawl', `Crawling page ${pageNum} of ${total}...`, progress, pageNum, total);
        }
      });

      if (!crawlResult.success || crawlResult.pages.length === 0) {
        throw new Error('Failed to fetch website content');
      }

      // STAGE B: Multi-Level Parsing
      this.reportProgress('parse', 'Parsing HTML and extracting structured data...', 40);

      const parsedPages = await Promise.all(
        crawlResult.pages.map(page => advancedHTMLParser.parse(page.html, page.url))
      );

      // STAGE C: Smart Content Extraction
      this.reportProgress('extract', 'Extracting company identity and products...', 55);

      const aggregatedData = this.aggregatePageData(parsedPages);

      // STAGE D: MLM Structure Detection
      this.reportProgress('mlm', 'Detecting MLM structure and compensation plans...', 70);

      const mlmStructure = await mlmStructureDetector.detect(parsedPages, aggregatedData);

      // STAGE E: AI Enrichment
      this.reportProgress('enrich', 'Generating AI-powered insights...', 80);

      const enrichedData = await aiEnrichmentEngine.enrich({
        companyName: companyName || aggregatedData.companyIdentity.companyName || 'Unknown Company',
        url: companyUrl,
        rawData: aggregatedData,
        mlmStructure,
        pages: parsedPages,
      });

      // STAGE F: Quality Scoring
      this.reportProgress('score', 'Calculating crawl quality score...', 90);

      const qualityScore = crawlQualityScorer.calculateScore({
        pagesC rawled: crawlResult.pages.length,
        companyIdentity: aggregatedData.companyIdentity,
        products: aggregatedData.products,
        mlmStructure,
        seoSignals: aggregatedData.seoSignals,
        brandVoice: enrichedData.brandVoice,
      });

      // STAGE G: Save to Database
      this.reportProgress('save', 'Saving intelligence data...', 95);

      const intelligenceData = {
        user_id: userId,
        company_id: companyId,
        company_name: companyName || aggregatedData.companyIdentity.companyName || 'Unknown Company',
        primary_url: companyUrl,
        urls_crawled: crawlResult.pages.map(p => p.url),

        raw_html: crawlResult.pages[0]?.html || '',
        raw_text: aggregatedData.allText,

        enriched_json: enrichedData,
        company_identity: aggregatedData.companyIdentity,
        product_catalog: aggregatedData.products,
        seo_signals: aggregatedData.seoSignals,
        mlm_structure: mlmStructure,
        brand_voice: enrichedData.brandVoice,
        marketing_intelligence: enrichedData.marketingIntelligence,

        extracted_keywords: aggregatedData.keywords,

        crawl_quality_score: qualityScore,
        pages_crawled: crawlResult.pages.length,
        extraction_completeness: this.calculateCompleteness(aggregatedData, mlmStructure, enrichedData),

        last_crawled_at: new Date().toISOString(),
        crawl_duration_ms: Date.now() - startTime,
        crawler_version: 'v5.0',
      };

      const { data: intelligence, error: saveError } = await supabase
        .from('company_intelligence_v2')
        .insert(intelligenceData)
        .select()
        .single();

      if (saveError) {
        console.error('Error saving intelligence:', saveError);
        throw saveError;
      }

      // Save individual pages
      if (intelligence) {
        await this.savePages(intelligence.id, parsedPages);
        await this.saveProducts(intelligence.id, aggregatedData.products);
        if (mlmStructure && mlmStructure.detected) {
          await this.saveMLMStructure(intelligence.id, mlmStructure);
        }
      }

      // Update crawler log
      if (crawlLogId) {
        await supabase
          .from('crawler_logs')
          .update({
            intelligence_id: intelligence?.id,
            status: 'completed',
            pages_crawled: crawlResult.pages.length,
            completed_at: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
            metadata: {
              quality_score: qualityScore,
              pages: crawlResult.pages.length,
            },
          })
          .eq('id', crawlLogId);
      }

      this.reportProgress('complete', 'Intelligence extraction complete!', 100);

      return {
        success: true,
        intelligenceId: intelligence?.id,
        data: enrichedData,
        qualityScore,
      };

    } catch (error: any) {
      console.error('Crawl error:', error);

      // Update crawler log with error
      if (crawlLogId) {
        await supabase
          .from('crawler_logs')
          .update({
            status: 'failed',
            errors: [{ message: error.message, timestamp: new Date().toISOString() }],
            completed_at: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
          })
          .eq('id', crawlLogId);
      }

      return {
        success: false,
        error: error.message || 'Unknown error occurred',
      };
    }
  }

  private aggregatePageData(parsedPages: any[]): any {
    const allText = parsedPages.map(p => p.text).join('\n\n');
    const allKeywords = new Set<string>();
    const products: any[] = [];
    const seoSignals: any = {
      titles: [],
      descriptions: [],
      h1s: [],
      keywords: [],
    };

    let companyIdentity: any = {
      companyName: '',
      tagline: '',
      mission: '',
      vision: '',
      about: '',
      foundedYear: null,
      industries: [],
      locations: [],
    };

    parsedPages.forEach(page => {
      // Aggregate keywords
      page.keywords?.forEach((kw: string) => allKeywords.add(kw));

      // Aggregate products
      if (page.products) {
        products.push(...page.products);
      }

      // Aggregate SEO signals
      if (page.metaTags?.title) seoSignals.titles.push(page.metaTags.title);
      if (page.metaTags?.description) seoSignals.descriptions.push(page.metaTags.description);
      if (page.h1s) seoSignals.h1s.push(...page.h1s);

      // Extract company identity (prioritize About/Home pages)
      if (!companyIdentity.companyName && page.companyName) {
        companyIdentity.companyName = page.companyName;
      }
      if (!companyIdentity.tagline && page.tagline) {
        companyIdentity.tagline = page.tagline;
      }
      if (!companyIdentity.about && page.aboutSection) {
        companyIdentity.about = page.aboutSection;
      }
      if (page.mission) companyIdentity.mission = page.mission;
      if (page.vision) companyIdentity.vision = page.vision;
    });

    return {
      allText,
      keywords: Array.from(allKeywords),
      products: this.deduplicateProducts(products),
      seoSignals,
      companyIdentity,
    };
  }

  private deduplicateProducts(products: any[]): any[] {
    const seen = new Set<string>();
    return products.filter(product => {
      const key = product.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private calculateCompleteness(aggregatedData: any, mlmStructure: any, enrichedData: any): any {
    return {
      companyIdentity: aggregatedData.companyIdentity.companyName ? 100 : 0,
      products: aggregatedData.products.length > 0 ? 100 : 0,
      mlmStructure: mlmStructure.detected ? 100 : 0,
      seo: aggregatedData.seoSignals.titles.length > 0 ? 100 : 0,
      brandVoice: enrichedData.brandVoice ? 100 : 0,
      overall: Math.round((
        (aggregatedData.companyIdentity.companyName ? 20 : 0) +
        (aggregatedData.products.length > 0 ? 20 : 0) +
        (mlmStructure.detected ? 20 : 0) +
        (aggregatedData.seoSignals.titles.length > 0 ? 20 : 0) +
        (enrichedData.brandVoice ? 20 : 0)
      )),
    };
  }

  private async savePages(intelligenceId: string, parsedPages: any[]): Promise<void> {
    const pagesToInsert = parsedPages.map(page => ({
      intelligence_id: intelligenceId,
      url: page.url,
      page_type: page.pageType,
      title: page.metaTags?.title || '',
      raw_html: page.rawHtml || '',
      raw_text: page.text || '',
      parsed_data: page,
      meta_tags: page.metaTags || {},
      structured_data: page.structuredData || [],
    }));

    await supabase.from('company_intelligence_pages').insert(pagesToInsert);
  }

  private async saveProducts(intelligenceId: string, products: any[]): Promise<void> {
    if (products.length === 0) return;

    const productsToInsert = products.map(product => ({
      intelligence_id: intelligenceId,
      name: product.name,
      category: product.category,
      description: product.description,
      benefits: product.benefits || [],
      features: product.features || [],
      price: product.price,
      currency: product.currency || 'USD',
      images: product.images || [],
      product_url: product.url,
      metadata: product.metadata || {},
    }));

    await supabase.from('company_intelligence_products').insert(productsToInsert);
  }

  private async saveMLMStructure(intelligenceId: string, mlmStructure: any): Promise<void> {
    await supabase.from('company_intelligence_mlm').insert({
      intelligence_id: intelligenceId,
      plan_type: mlmStructure.planType,
      plan_name: mlmStructure.planName,
      compensation_structure: mlmStructure.compensationPlan || {},
      rank_system: mlmStructure.rankSystem || [],
      bonuses: mlmStructure.bonuses || [],
      incentives: mlmStructure.incentives || [],
      requirements: mlmStructure.requirements || {},
      extracted_text: mlmStructure.rawText || '',
      confidence_score: mlmStructure.confidenceScore || 0,
    });
  }
}

export const companyWebsiteIntelligenceCrawler = new CompanyWebsiteIntelligenceCrawler();
