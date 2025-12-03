import { supabase } from '../../lib/supabase';
import { ocrService, OcrBlock } from './ocrService';
import { formDetectionService, DetectedForm, LeadFlow } from './formDetectionService';
import { aiEnrichmentEngine } from './aiEnrichmentEngine';
import { crawlQualityScorer } from './crawlQualityScorer';

export interface CrawlProgressV6 {
  stage: string;
  message: string;
  progress: number;
  currentPage: number;
  totalPages: number;
}

export interface CrawlResultV6 {
  success: boolean;
  sessionId?: string;
  intelligenceId?: string;
  qualityScore?: number;
  error?: string;
  dataSources?: string[];
}

interface BrowserCrawlerOutput {
  pages: {
    url: string;
    title: string;
    html: string;
    screenshotBase64?: string;
  }[];
  sessionLog: {
    startTime: string;
    endTime: string;
    actions: { step: string; details?: string; timestamp: string }[];
  };
}

export class CompanyWebsiteIntelligenceCrawlerV6 {
  private onProgress?: (progress: CrawlProgressV6) => void;

  constructor(progressCallback?: (progress: CrawlProgressV6) => void) {
    this.onProgress = progressCallback;
  }

  private reportProgress(stage: string, message: string, progress: number, currentPage: number = 0, totalPages: number = 0) {
    if (this.onProgress) {
      this.onProgress({ stage, message, progress, currentPage, totalPages });
    }
    console.log(`[Crawler v6.0] ${stage}: ${message} (${progress}%)`);
  }

  async crawlCompanyWebsite(input: {
    companyId?: string;
    entryUrl: string;
    userId: string;
    forceRecrawl?: boolean;
  }): Promise<CrawlResultV6> {
    const startTime = Date.now();
    let sessionId: string | null = null;

    try {
      this.reportProgress('initialize', 'Starting v6.0 browser automation crawl...', 0);

      // Create crawl session
      const { data: session, error: sessionError } = await supabase
        .from('company_crawl_sessions')
        .insert({
          user_id: input.userId,
          company_id: input.companyId,
          crawler_version: '6.0',
          entry_url: input.entryUrl,
          status: 'running',
          start_time: new Date().toISOString(),
        })
        .select()
        .single();

      if (sessionError || !session) {
        throw new Error('Failed to create crawl session');
      }

      sessionId = session.id;

      // STAGE 1: Browser Automation Crawl
      this.reportProgress('browser', 'Launching headless browser...', 10);

      const browserResult = await this.callBrowserCrawler(input.entryUrl);

      if (!browserResult || browserResult.pages.length === 0) {
        throw new Error('Browser crawl failed - no pages retrieved');
      }

      this.reportProgress('browser', `Retrieved ${browserResult.pages.length} pages`, 25);

      // STAGE 2: Save Pages to Database
      this.reportProgress('save_pages', 'Saving page snapshots...', 30);

      for (const page of browserResult.pages) {
        await supabase.from('company_crawl_pages').insert({
          session_id: sessionId,
          company_id: input.companyId,
          url: page.url,
          title: page.title,
          html_excerpt: page.html.substring(0, 10000),
          screenshot_base64: page.screenshotBase64?.substring(0, 50000), // Limit size
          is_primary_page: page.url === input.entryUrl,
        });
      }

      // STAGE 3: OCR Extraction
      this.reportProgress('ocr', 'Extracting text from screenshots...', 40);

      const ocrBlocks = await this.processScreenshots(browserResult.pages, sessionId);

      // STAGE 4: Form Detection
      this.reportProgress('forms', 'Detecting forms and lead flows...', 55);

      const detectedForms = await this.detectForms(browserResult.pages, sessionId, input.companyId);

      // STAGE 5: Lead Flow Mapping
      this.reportProgress('flow', 'Mapping lead generation flows...', 65);

      const leadFlow = formDetectionService.buildLeadFlow(
        detectedForms,
        browserResult.pages.map(p => ({ url: p.url, html: p.html }))
      );

      await this.saveLeadFlow(sessionId, input.companyId, leadFlow);

      // STAGE 6: AI Enrichment
      this.reportProgress('enrich', 'Generating AI insights...', 75);

      const enrichedData = await this.enrichWithAI(
        browserResult.pages,
        ocrBlocks,
        detectedForms,
        leadFlow
      );

      // STAGE 7: Quality Scoring
      this.reportProgress('score', 'Calculating crawl quality...', 85);

      const qualityScore = this.calculateQualityScore(
        browserResult.pages.length,
        ocrBlocks.length,
        detectedForms.length,
        leadFlow,
        enrichedData
      );

      // STAGE 8: Save Intelligence Data
      this.reportProgress('save', 'Saving intelligence data...', 90);

      const dataSources = ['browser', 'html'];
      if (ocrBlocks.length > 0) dataSources.push('ocr');
      if (detectedForms.length > 0) dataSources.push('forms');

      const intelligenceData = {
        user_id: input.userId,
        company_id: input.companyId,
        company_name: enrichedData.companyName || 'Unknown Company',
        primary_url: input.entryUrl,
        urls_crawled: browserResult.pages.map(p => p.url),

        raw_html: browserResult.pages[0]?.html || '',
        raw_text: this.aggregateText(browserResult.pages, ocrBlocks),

        enriched_json: enrichedData,
        lead_flows: leadFlow,
        detected_forms: detectedForms,
        data_sources: dataSources,
        ocr_data: { blocks: ocrBlocks, count: ocrBlocks.length },
        form_patterns: this.analyzeFormPatterns(detectedForms),
        lead_generation_strategy: enrichedData.leadGenerationStrategy,

        crawl_quality_score: qualityScore,
        pages_crawled: browserResult.pages.length,

        last_crawled_at: new Date().toISOString(),
        crawl_duration_ms: Date.now() - startTime,
        crawler_version: 'v6.0',
      };

      const { data: intelligence, error: saveError } = await supabase
        .from('company_intelligence_v2')
        .insert(intelligenceData)
        .select()
        .single();

      if (saveError || !intelligence) {
        console.error('Error saving intelligence:', saveError);
        throw saveError || new Error('Failed to save intelligence');
      }

      // Update session with results
      await supabase
        .from('company_crawl_sessions')
        .update({
          intelligence_id: intelligence.id,
          status: 'completed',
          end_time: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
          pages_crawled: browserResult.pages.length,
          sources: dataSources,
          quality_score: qualityScore,
          session_log: browserResult.sessionLog,
        })
        .eq('id', sessionId);

      this.reportProgress('complete', 'Crawl complete!', 100);

      return {
        success: true,
        sessionId,
        intelligenceId: intelligence.id,
        qualityScore,
        dataSources,
      };

    } catch (error: any) {
      console.error('Crawler v6.0 error:', error);

      if (sessionId) {
        await supabase
          .from('company_crawl_sessions')
          .update({
            status: 'failed',
            end_time: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
            notes: error.message,
          })
          .eq('id', sessionId);
      }

      return {
        success: false,
        error: error.message || 'Crawl failed',
      };
    }
  }

  private async callBrowserCrawler(url: string): Promise<BrowserCrawlerOutput> {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/browser-crawler`;
    const headers = {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ url, maxPages: 20 }),
    });

    if (!response.ok) {
      throw new Error(`Browser crawler failed: ${response.statusText}`);
    }

    return await response.json();
  }

  private async processScreenshots(pages: any[], sessionId: string): Promise<OcrBlock[]> {
    const allBlocks: OcrBlock[] = [];

    for (const page of pages) {
      if (page.screenshotBase64) {
        try {
          const ocrResult = await ocrService.extractBlocks({
            screenshotBase64: page.screenshotBase64,
            pageUrl: page.url,
          });

          allBlocks.push(...ocrResult.blocks);

          // Update page with OCR data
          await supabase
            .from('company_crawl_pages')
            .update({
              ocr_text: ocrResult.rawText,
              ocr_blocks: ocrResult.blocks,
            })
            .eq('session_id', sessionId)
            .eq('url', page.url);
        } catch (error) {
          console.error('OCR error for page:', page.url, error);
        }
      } else {
        // Simulate OCR for development
        const simulatedOcr = await ocrService.extractBlocks({
          screenshotBase64: 'simulated',
          pageUrl: page.url,
        });
        allBlocks.push(...simulatedOcr.blocks);
      }
    }

    return allBlocks;
  }

  private async detectForms(pages: any[], sessionId: string, companyId?: string): Promise<DetectedForm[]> {
    const allForms: DetectedForm[] = [];

    for (const page of pages) {
      try {
        const forms = await formDetectionService.detectForms({
          html: page.html,
          url: page.url,
        });

        for (const form of forms) {
          // Save to database
          await supabase.from('company_detected_forms').insert({
            session_id: sessionId,
            company_id: companyId,
            page_url: form.pageUrl,
            form_type: form.formType,
            cta_text: form.ctaText,
            fields_json: form.fields,
            form_action: form.formAction,
            form_method: form.formMethod,
            complexity_score: form.complexityScore,
            barrier_score: form.barrierScore,
          });

          allForms.push(form);
        }
      } catch (error) {
        console.error('Form detection error for page:', page.url, error);
      }
    }

    return allForms;
  }

  private async saveLeadFlow(sessionId: string, companyId: string | undefined, leadFlow: LeadFlow): Promise<void> {
    await supabase.from('company_lead_flows').insert({
      session_id: sessionId,
      company_id: companyId,
      flow_name: 'Primary Lead Flow',
      nodes_json: leadFlow.nodes,
      edges_json: leadFlow.edges,
      entry_points: leadFlow.nodes.filter(n => n.nodeType === 'info').map(n => n.pageUrl),
      conversion_points: leadFlow.nodes.filter(n => n.nodeType === 'join_form' || n.nodeType === 'checkout').map(n => n.pageUrl),
      complexity_rating: leadFlow.nodes.length > 5 ? 'complex' : leadFlow.nodes.length > 2 ? 'moderate' : 'simple',
    });
  }

  private async enrichWithAI(pages: any[], ocrBlocks: OcrBlock[], forms: DetectedForm[], leadFlow: LeadFlow): Promise<any> {
    const htmlText = pages.map(p => p.html.substring(0, 5000)).join('\n\n');
    const ocrText = ocrBlocks.map(b => b.text).join('\n\n');

    return {
      companyName: this.extractCompanyName(pages[0]),
      leadGenerationStrategy: this.analyzeLeadStrategy(forms, leadFlow),
      funnelStages: this.analyzeFunnelStages(leadFlow),
      contactFieldComplexity: this.analyzeFieldComplexity(forms),
      barriersToEntry: this.analyzeBarriers(forms),
      aiNotesAboutForms: this.generateFormNotes(forms),
      aiNotesAboutScreenshots: this.generateOcrNotes(ocrBlocks),
      dataSourcesUsed: ['html', 'browser', ocrBlocks.length > 0 ? 'ocr' : null, forms.length > 0 ? 'forms' : null].filter(Boolean),
      crawlerVersion: '6.0',
    };
  }

  private extractCompanyName(page: any): string {
    const titleMatch = page.title || '';
    return titleMatch.split('|')[0].split('-')[0].trim();
  }

  private analyzeLeadStrategy(forms: DetectedForm[], leadFlow: LeadFlow): string {
    if (forms.length === 0) {
      return 'No lead capture forms detected. Company may rely on other channels.';
    }

    const leadForms = forms.filter(f => f.formType === 'lead_capture');
    const avgBarrier = forms.reduce((sum, f) => sum + f.barrierScore, 0) / forms.length;

    return `Company uses ${leadForms.length} lead capture form(s) with ${avgBarrier > 60 ? 'high' : avgBarrier > 30 ? 'moderate' : 'low'} barrier to entry. ${leadFlow.nodes.length} step funnel.`;
  }

  private analyzeFunnelStages(leadFlow: LeadFlow): string[] {
    return leadFlow.nodes.map(n => `${n.nodeType}: ${n.description}`);
  }

  private analyzeFieldComplexity(forms: DetectedForm[]): string {
    const avgFields = forms.reduce((sum, f) => sum + f.fields.length, 0) / Math.max(forms.length, 1);
    return avgFields > 10 ? 'Very complex' : avgFields > 5 ? 'Moderate' : 'Simple';
  }

  private analyzeBarriers(forms: DetectedForm[]): string[] {
    const barriers: string[] = [];
    const avgBarrier = forms.reduce((sum, f) => sum + f.barrierScore, 0) / Math.max(forms.length, 1);

    if (avgBarrier > 60) barriers.push('High form complexity');
    if (forms.some(f => f.fields.length > 10)) barriers.push('Many required fields');
    if (forms.some(f => f.formType === 'checkout')) barriers.push('Payment required');

    return barriers;
  }

  private generateFormNotes(forms: DetectedForm[]): string {
    return `Detected ${forms.length} forms: ${forms.map(f => f.formType).join(', ')}`;
  }

  private generateOcrNotes(ocrBlocks: OcrBlock[]): string {
    const hasCompPlan = ocrBlocks.some(b => ocrService.isCompensationPlanText(b.text));
    const hasProducts = ocrBlocks.some(b => ocrService.isProductText(b.text));

    const notes: string[] = [];
    if (hasCompPlan) notes.push('Compensation plan details found in screenshots');
    if (hasProducts) notes.push('Product information extracted from images');

    return notes.join('. ') || 'No significant visual content detected';
  }

  private aggregateText(pages: any[], ocrBlocks: OcrBlock[]): string {
    const htmlText = pages.map(p => p.html.substring(0, 5000)).join('\n\n');
    const ocrText = ocrBlocks.map(b => b.text).join('\n\n');
    return `${htmlText}\n\n[OCR DATA]\n${ocrText}`;
  }

  private analyzeFormPatterns(forms: DetectedForm[]): any {
    return {
      totalForms: forms.length,
      formTypes: forms.map(f => f.formType),
      avgComplexity: forms.reduce((sum, f) => sum + f.complexityScore, 0) / Math.max(forms.length, 1),
      avgBarrier: forms.reduce((sum, f) => sum + f.barrierScore, 0) / Math.max(forms.length, 1),
    };
  }

  private calculateQualityScore(pageCount: number, ocrCount: number, formCount: number, leadFlow: LeadFlow, enrichedData: any): number {
    let score = 0;

    score += Math.min(pageCount * 3, 30);
    score += Math.min(ocrCount * 2, 20);
    score += Math.min(formCount * 5, 25);
    score += Math.min(leadFlow.nodes.length * 3, 15);
    if (enrichedData.companyName) score += 10;

    return Math.min(score, 100);
  }
}

export const companyWebsiteIntelligenceCrawlerV6 = new CompanyWebsiteIntelligenceCrawlerV6();

// Export main function
export async function crawlCompanyWebsiteV6(input: {
  companyId: string;
  entryUrl: string;
  forceRecrawl?: boolean;
}): Promise<{ success: boolean; qualityScore?: number; summary: string }> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const result = await companyWebsiteIntelligenceCrawlerV6.crawlCompanyWebsite({
    ...input,
    userId: user.id,
  });

  return {
    success: result.success,
    qualityScore: result.qualityScore,
    summary: result.success
      ? `Successfully crawled with quality score ${result.qualityScore}/100 using ${result.dataSources?.join(', ')}`
      : `Crawl failed: ${result.error}`,
  };
}
