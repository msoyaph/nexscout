import { companyWebScraper, CompanyScrapedData } from './companyWebScraper';
import { supabase } from '../lib/supabase';

export interface MultiSiteData {
  website?: CompanyScrapedData;
  facebook?: FacebookPageData;
  youtube?: YouTubeChannelData;
  linkedin?: LinkedInPageData;
  merged: MergedCompanyData;
}

export interface FacebookPageData {
  pageName: string;
  about: string;
  mission: string;
  category: string;
  recentPosts: Array<{ text: string; engagement: number }>;
  reviews: Array<{ text: string; rating: number }>;
  followers: number;
}

export interface YouTubeChannelData {
  channelName: string;
  about: string;
  playlists: string[];
  topVideos: Array<{ title: string; description: string; views: number }>;
  callsToAction: string[];
}

export interface LinkedInPageData {
  companyName: string;
  description: string;
  industry: string;
  employeeCount: string;
  services: string[];
  recentPosts: Array<{ text: string; engagement: number }>;
  companyStory: string;
}

export interface MergedCompanyData {
  companyName: string;
  displayName: string;
  normalizedName: string;
  description: string;
  industry: string;
  mission: string;
  values: string[];
  products: Array<{ name: string; description: string }>;
  services: Array<{ name: string; description: string }>;
  brandTone: string;
  keywords: string[];
  brandColors: string[];
  targetAudience: string[];
  painPoints: string[];
  callsToAction: string[];
  socialProof: Array<{ type: string; text: string; rating?: number }>;
  positioning: string;
  uniqueSellingPoints: string[];
  channels: {
    website?: string;
    facebook?: string;
    youtube?: string;
    linkedin?: string;
  };
  dataSources: string[];
  crawlQuality: number;
}

export class CompanyMultiSiteCrawler {
  async crawlWebsite(url: string): Promise<CompanyScrapedData | null> {
    try {
      const data = await companyWebScraper.generateStructuredCompanyJSON(url);
      return data;
    } catch (error) {
      console.error('Website crawl error:', error);
      return null;
    }
  }

  async crawlFacebookPage(pageUrl: string): Promise<FacebookPageData | null> {
    try {
      const html = await companyWebScraper.fetchHTML(pageUrl);
      const text = companyWebScraper.extractText(html);

      const pageName = this.extractFBPageName(html);
      const about = this.extractFBAbout(text);
      const category = this.extractFBCategory(html);

      return {
        pageName,
        about,
        mission: about,
        category,
        recentPosts: this.extractFBPosts(text),
        reviews: this.extractFBReviews(text),
        followers: 0,
      };
    } catch (error) {
      console.error('Facebook crawl error:', error);
      return null;
    }
  }

  async crawlYouTubeChannel(channelUrl: string): Promise<YouTubeChannelData | null> {
    try {
      const html = await companyWebScraper.fetchHTML(channelUrl);
      const text = companyWebScraper.extractText(html);

      const channelName = this.extractYTChannelName(html);
      const about = this.extractYTAbout(text);

      return {
        channelName,
        about,
        playlists: this.extractYTPlaylists(text),
        topVideos: this.extractYTTopVideos(text),
        callsToAction: this.extractCallsToAction(text),
      };
    } catch (error) {
      console.error('YouTube crawl error:', error);
      return null;
    }
  }

  async crawlLinkedInPage(pageUrl: string): Promise<LinkedInPageData | null> {
    try {
      const html = await companyWebScraper.fetchHTML(pageUrl);
      const text = companyWebScraper.extractText(html);

      const companyName = this.extractLinkedInName(html);
      const description = this.extractLinkedInDescription(text);

      return {
        companyName,
        description,
        industry: this.extractLinkedInIndustry(text),
        employeeCount: this.extractLinkedInEmployees(text),
        services: this.extractLinkedInServices(text),
        recentPosts: [],
        companyStory: description,
      };
    } catch (error) {
      console.error('LinkedIn crawl error:', error);
      return null;
    }
  }

  async crawlMultiSite(urls: {
    website?: string;
    facebook?: string;
    youtube?: string;
    linkedin?: string;
  }): Promise<MultiSiteData> {
    const results: Partial<MultiSiteData> = {};

    if (urls.website) {
      results.website = await this.crawlWebsite(urls.website);
    }

    if (urls.facebook) {
      results.facebook = await this.crawlFacebookPage(urls.facebook);
    }

    if (urls.youtube) {
      results.youtube = await this.crawlYouTubeChannel(urls.youtube);
    }

    if (urls.linkedin) {
      results.linkedin = await this.crawlLinkedInPage(urls.linkedin);
    }

    const merged = this.mergeAllData(results, urls);

    return {
      website: results.website,
      facebook: results.facebook,
      youtube: results.youtube,
      linkedin: results.linkedin,
      merged,
    };
  }

  private mergeAllData(data: Partial<MultiSiteData>, urls: any): MergedCompanyData {
    const companyName =
      data.website?.companyName ||
      data.facebook?.pageName ||
      data.youtube?.channelName ||
      data.linkedin?.companyName ||
      'Unknown Company';

    const description =
      data.website?.description ||
      data.linkedin?.description ||
      data.facebook?.about ||
      data.youtube?.about ||
      '';

    const mission =
      data.website?.mission ||
      data.facebook?.mission ||
      '';

    const values = data.website?.values || [];

    const products = data.website?.products || [];
    const services = data.linkedin?.services.map(s => ({ name: s, description: '' })) || [];

    const brandTone = data.website?.brandTone || 'professional';
    const keywords = data.website?.keywords || [];
    const brandColors = data.website?.brandColors || [];

    const targetAudience = this.extractTargetAudiences(data);
    const painPoints = this.extractPainPoints(data);
    const callsToAction = data.youtube?.callsToAction || [];

    const socialProof: Array<{ type: string; text: string; rating?: number }> = [];
    if (data.facebook?.reviews) {
      data.facebook.reviews.forEach(review => {
        socialProof.push({
          type: 'facebook_review',
          text: review.text,
          rating: review.rating,
        });
      });
    }

    const positioning = this.extractPositioning(data);
    const uniqueSellingPoints = this.extractUSPs(data);

    const dataSources: string[] = [];
    if (data.website) dataSources.push('website');
    if (data.facebook) dataSources.push('facebook');
    if (data.youtube) dataSources.push('youtube');
    if (data.linkedin) dataSources.push('linkedin');

    const crawlQuality = this.calculateMergedQuality(data);

    return {
      companyName,
      displayName: companyName,
      normalizedName: this.normalizeCompanyName(companyName),
      description,
      industry: data.linkedin?.industry || data.website?.brandTone || '',
      mission,
      values,
      products,
      services,
      brandTone,
      keywords,
      brandColors,
      targetAudience,
      painPoints,
      callsToAction,
      socialProof,
      positioning,
      uniqueSellingPoints,
      channels: {
        website: urls.website,
        facebook: urls.facebook,
        youtube: urls.youtube,
        linkedin: urls.linkedin,
      },
      dataSources,
      crawlQuality,
    };
  }

  private normalizeCompanyName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractTargetAudiences(data: Partial<MultiSiteData>): string[] {
    const audiences: string[] = [];

    if (data.website?.target_audience) {
      audiences.push(data.website.target_audience);
    }

    return audiences;
  }

  private extractPainPoints(data: Partial<MultiSiteData>): string[] {
    const painPoints: string[] = [];

    if (data.website?.description) {
      const keywords = ['problem', 'challenge', 'struggle', 'difficult', 'pain'];
      const sentences = data.website.description.split(/[.!?]+/);

      sentences.forEach(sentence => {
        if (keywords.some(kw => sentence.toLowerCase().includes(kw))) {
          painPoints.push(sentence.trim());
        }
      });
    }

    return painPoints.slice(0, 5);
  }

  private extractPositioning(data: Partial<MultiSiteData>): string {
    if (data.linkedin?.description) {
      return data.linkedin.description.split('.')[0];
    }
    if (data.website?.description) {
      return data.website.description.split('.')[0];
    }
    return '';
  }

  private extractUSPs(data: Partial<MultiSiteData>): string[] {
    const usps: string[] = [];

    if (data.website?.value_propositions) {
      usps.push(...data.website.value_propositions);
    }

    return usps.slice(0, 5);
  }

  private calculateMergedQuality(data: Partial<MultiSiteData>): number {
    let score = 0;
    let maxScore = 100;

    if (data.website) score += 40;
    if (data.facebook) score += 20;
    if (data.youtube) score += 20;
    if (data.linkedin) score += 20;

    return (score / maxScore) * 100;
  }

  private extractFBPageName(html: string): string {
    const match = html.match(/<title>([^<]+)<\/title>/i);
    return match ? match[1].split('|')[0].trim() : '';
  }

  private extractFBAbout(text: string): string {
    const aboutMatch = text.match(/About[:\s]+([^.]+\.)/i);
    return aboutMatch ? aboutMatch[1].trim() : '';
  }

  private extractFBCategory(html: string): string {
    return 'Business';
  }

  private extractFBPosts(text: string): Array<{ text: string; engagement: number }> {
    return [];
  }

  private extractFBReviews(text: string): Array<{ text: string; rating: number }> {
    return [];
  }

  private extractYTChannelName(html: string): string {
    const match = html.match(/<title>([^<]+)<\/title>/i);
    return match ? match[1].replace('- YouTube', '').trim() : '';
  }

  private extractYTAbout(text: string): string {
    const lines = text.split('\n');
    const aboutLine = lines.find(line => line.length > 100 && line.length < 500);
    return aboutLine || '';
  }

  private extractYTPlaylists(text: string): string[] {
    return [];
  }

  private extractYTTopVideos(text: string): Array<{ title: string; description: string; views: number }> {
    return [];
  }

  private extractCallsToAction(text: string): string[] {
    const ctas: string[] = [];
    const ctaKeywords = ['subscribe', 'join', 'buy', 'get started', 'sign up', 'learn more', 'download'];

    const sentences = text.toLowerCase().split(/[.!?\n]+/);
    sentences.forEach(sentence => {
      if (ctaKeywords.some(kw => sentence.includes(kw))) {
        ctas.push(sentence.trim());
      }
    });

    return ctas.slice(0, 5);
  }

  private extractLinkedInName(html: string): string {
    const match = html.match(/<title>([^<|]+)/i);
    return match ? match[1].trim() : '';
  }

  private extractLinkedInDescription(text: string): string {
    const lines = text.split('\n').filter(line => line.length > 50);
    return lines[0] || '';
  }

  private extractLinkedInIndustry(text: string): string {
    return '';
  }

  private extractLinkedInEmployees(text: string): string {
    return '';
  }

  private extractLinkedInServices(text: string): string[] {
    return [];
  }
}

export const companyMultiSiteCrawler = new CompanyMultiSiteCrawler();
