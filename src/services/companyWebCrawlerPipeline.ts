import { supabase } from '../lib/supabase';
import { companyWebScraper, CompanyScrapedData } from './companyWebScraper';

export interface CrawlProgressEvent {
  step: string;
  progress: number;
  message: string;
  metadata?: any;
}

export type CrawlProgressCallback = (event: CrawlProgressEvent) => void;

export class CompanyWebCrawlerPipeline {
  private getTierDepth(tier: string): number {
    const depths: { [key: string]: number } = {
      free: 1,
      pro: 3,
      elite: 10,
    };
    return depths[tier] || 1;
  }

  async logEvent(
    userId: string,
    url: string,
    step: string,
    progress: number,
    message: string,
    companyId?: string
  ): Promise<void> {
    try {
      await supabase.from('company_crawl_events').insert({
        user_id: userId,
        company_id: companyId,
        url,
        step,
        progress,
        message,
        metadata: {},
      });
    } catch (error) {
      console.error('Failed to log event:', error);
    }
  }

  async saveExtractedData(
    userId: string,
    url: string,
    data: CompanyScrapedData,
    companyId?: string
  ): Promise<string> {
    // First, check if data exists for this user + URL
    const { data: existing } = await supabase
      .from('company_multi_site_data')
      .select('id')
      .eq('user_id', userId)
      .eq('url', url)
      .maybeSingle();

    const payload = {
      user_id: userId,
      company_id: companyId || null,
      platform: 'website',
      url,
      scraped_data: {
        companyName: data.companyName,
        description: data.description,
        products: data.products,
        services: data.services,
        mission: data.mission,
        values: data.values,
        brandTone: data.brandTone,
        brandColors: data.brandColors,
        keywords: data.keywords,
        socialLinks: data.socialLinks,
        contact: data.contact,
      },
      raw_content: data.rawContent,
      metadata: {
        crawl_depth: data.crawlDepth,
        source_type: data.sourceType,
        html_snapshot: data.htmlSnapshot ? data.htmlSnapshot.substring(0, 50000) : '',
        extraction_quality: this.calculateQuality(data),
      },
      scrape_quality: this.calculateQuality(data) / 100,
      last_scraped_at: new Date().toISOString(),
    };

    let saved;
    let error;

    if (existing) {
      // Update existing record
      const result = await supabase
        .from('company_multi_site_data')
        .update(payload)
        .eq('id', existing.id)
        .select('id')
        .single();

      saved = result.data;
      error = result.error;
    } else {
      // Insert new record
      const result = await supabase
        .from('company_multi_site_data')
        .insert(payload)
        .select('id')
        .single();

      saved = result.data;
      error = result.error;
    }

    if (error) throw error;
    return saved.id;
  }

  async saveCrawlHistory(
    userId: string,
    url: string,
    status: string,
    pagesCrawled: number,
    tier: string,
    depth: number,
    durationMs: number,
    errorMessage?: string,
    companyId?: string
  ): Promise<void> {
    await supabase.from('company_crawl_history').insert({
      user_id: userId,
      company_id: companyId,
      url,
      status,
      pages_crawled: pagesCrawled,
      tier_used: tier,
      crawl_depth_used: depth,
      crawl_duration_ms: durationMs,
      error_message: errorMessage,
    });
  }

  calculateQuality(data: CompanyScrapedData): number {
    let score = 0;

    if (data.companyName) score += 20;
    if (data.description && data.description.length > 50) score += 20;
    if (data.products && data.products.length > 0) score += 15;
    if (data.mission) score += 15;
    if (data.brandTone) score += 10;
    if (data.brandColors && data.brandColors.length > 0) score += 10;
    if (data.keywords && data.keywords.length > 0) score += 5;
    if (Object.keys(data.socialLinks).length > 0) score += 5;

    return Math.min(100, score);
  }

  async crawlWebsite(
    userId: string,
    url: string,
    tier: string = 'free',
    companyId?: string,
    onProgress?: CrawlProgressCallback
  ): Promise<{ success: boolean; extractedDataId?: string; data?: CompanyScrapedData; error?: string }> {
    const startTime = Date.now();
    const depth = this.getTierDepth(tier);

    const emitProgress = async (step: string, progress: number, message: string, metadata?: any) => {
      await this.logEvent(userId, url, step, progress, message, companyId);
      if (onProgress) {
        onProgress({ step, progress, message, metadata });
      }
    };

    try {
      await emitProgress('validating', 0, 'Validating website URL...');

      const normalizedUrl = companyWebScraper.normalizeURL(url);
      if (!companyWebScraper.validateURL(normalizedUrl)) {
        throw new Error('Invalid URL format');
      }

      await emitProgress('fetching', 10, 'Fetching website...');

      const html = await companyWebScraper.fetchHTML(normalizedUrl);

      await emitProgress('scraping', 30, 'Scraping content...');

      const data = await companyWebScraper.generateStructuredCompanyJSON(normalizedUrl);

      await emitProgress('extracting', 50, 'Extracting company information...');

      if (depth > 1) {
        await emitProgress('extracting', 60, `Crawling additional pages (depth: ${depth})...`);
        const childLinks = await companyWebScraper.crawlChildrenLinks(normalizedUrl, depth);
        data.crawlDepth = Math.min(childLinks.length + 1, depth);
      }

      await emitProgress('analyzing', 70, 'Analyzing brand elements...');

      const quality = this.calculateQuality(data);

      await emitProgress('syncing', 85, 'Saving to database...');

      const extractedDataId = await this.saveExtractedData(userId, normalizedUrl, data, companyId);

      await emitProgress('completed', 100, 'Crawl completed successfully!');

      const duration = Date.now() - startTime;
      await this.saveCrawlHistory(
        userId,
        normalizedUrl,
        'success',
        data.crawlDepth,
        tier,
        depth,
        duration,
        undefined,
        companyId
      );

      return {
        success: true,
        extractedDataId,
        data,
      };
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error';
      await emitProgress('failed', 0, `Crawl failed: ${errorMessage}`);

      const duration = Date.now() - startTime;
      await this.saveCrawlHistory(
        userId,
        url,
        'failed',
        0,
        tier,
        depth,
        duration,
        errorMessage,
        companyId
      );

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async getLatestCrawlData(userId: string, url: string): Promise<CompanyScrapedData | null> {
    const { data, error } = await supabase
      .from('company_multi_site_data')
      .select('scraped_data')
      .eq('url', url)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return data.scraped_data as CompanyScrapedData;
  }

  async getCrawlProgress(userId: string, url: string): Promise<CrawlProgressEvent[]> {
    const { data, error } = await supabase
      .from('company_crawl_events')
      .select('step, progress, message, metadata, created_at')
      .eq('user_id', userId)
      .eq('url', url)
      .order('created_at', { ascending: true })
      .limit(20);

    if (error || !data) return [];

    return data.map(event => ({
      step: event.step,
      progress: event.progress,
      message: event.message,
      metadata: event.metadata,
    }));
  }
}

export const companyWebCrawlerPipeline = new CompanyWebCrawlerPipeline();
