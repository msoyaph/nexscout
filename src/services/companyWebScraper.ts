import { supabase } from '../lib/supabase';

export interface CompanyScrapedData {
  companyName: string;
  description: string;
  products: Array<{ name: string; description: string }>;
  services: Array<{ name: string; description: string }>;
  mission: string;
  values: string[];
  brandTone: string;
  keywords: string[];
  brandColors: string[];
  socialLinks: { [key: string]: string };
  contact: {
    email: string;
    phone: string;
    address: string;
  };
  rawContent: string;
  htmlSnapshot: string;
  crawlDepth: number;
  sourceType: string;
}

export class CompanyWebScraper {
  validateURL(url: string): boolean {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }

  normalizeURL(url: string): string {
    try {
      let normalized = url.trim();
      if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
        normalized = 'https://' + normalized;
      }
      const parsed = new URL(normalized);
      return parsed.toString();
    } catch {
      return url;
    }
  }

  async fetchHTML(url: string): Promise<string> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scrape-website`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data.success || !data.html) {
        throw new Error('Failed to fetch HTML from edge function');
      }

      return data.html;
    } catch (error: any) {
      console.error('Fetch error:', error);
      throw new Error(`Failed to fetch website: ${error.message}`);
    }
  }

  extractText(html: string): string {
    const doc = new DOMParser().parseFromString(html, 'text/html');

    const elementsToRemove = doc.querySelectorAll('script, style, nav, header, footer, iframe, noscript');
    elementsToRemove.forEach(el => el.remove());

    const text = doc.body?.textContent || '';
    return text.replace(/\s+/g, ' ').trim();
  }

  extractMetadata(html: string): { title: string; description: string; keywords: string[] } {
    const doc = new DOMParser().parseFromString(html, 'text/html');

    const title = doc.querySelector('title')?.textContent ||
                  doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
                  '';

    const description = doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
                       doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
                       '';

    const keywordsContent = doc.querySelector('meta[name="keywords"]')?.getAttribute('content') || '';
    const keywords = keywordsContent.split(',').map(k => k.trim()).filter(Boolean);

    return { title, description, keywords };
  }

  detectBrandColors(html: string): string[] {
    const colors: Set<string> = new Set();

    const colorRegex = /#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})\b/g;
    const matches = html.match(colorRegex);

    if (matches) {
      matches.slice(0, 10).forEach(color => colors.add(color.toUpperCase()));
    }

    return Array.from(colors).slice(0, 5);
  }

  detectBrandTone(text: string): string {
    const lowerText = text.toLowerCase();

    const professional = ['professional', 'enterprise', 'business', 'corporate', 'solution'];
    const friendly = ['friendly', 'welcome', 'easy', 'simple', 'fun', 'love'];
    const innovative = ['innovative', 'cutting-edge', 'revolutionary', 'advanced', 'leading'];
    const trustworthy = ['trusted', 'reliable', 'secure', 'proven', 'certified'];

    const scores = {
      professional: professional.filter(w => lowerText.includes(w)).length,
      friendly: friendly.filter(w => lowerText.includes(w)).length,
      innovative: innovative.filter(w => lowerText.includes(w)).length,
      trustworthy: trustworthy.filter(w => lowerText.includes(w)).length,
    };

    const maxScore = Math.max(...Object.values(scores));
    const tone = Object.entries(scores).find(([_, score]) => score === maxScore)?.[0] || 'professional';

    return tone;
  }

  extractProducts(text: string): Array<{ name: string; description: string }> {
    const products: Array<{ name: string; description: string }> = [];

    const productKeywords = ['product', 'solution', 'offering', 'platform', 'service'];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);

    for (const sentence of sentences.slice(0, 50)) {
      const lower = sentence.toLowerCase();
      if (productKeywords.some(kw => lower.includes(kw))) {
        const words = sentence.trim().split(' ');
        if (words.length >= 5) {
          products.push({
            name: words.slice(0, 5).join(' '),
            description: sentence.trim(),
          });
        }

        if (products.length >= 5) break;
      }
    }

    return products;
  }

  extractCompanyAbout(text: string): { mission: string; values: string[] } {
    let mission = '';
    const values: string[] = [];

    const missionKeywords = ['mission', 'vision', 'purpose', 'goal', 'objective'];
    const valueKeywords = ['values', 'principles', 'beliefs', 'commitment'];

    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);

    for (const sentence of sentences) {
      const lower = sentence.toLowerCase();

      if (!mission && missionKeywords.some(kw => lower.includes(kw))) {
        mission = sentence.trim();
      }

      if (valueKeywords.some(kw => lower.includes(kw))) {
        values.push(sentence.trim());
      }

      if (mission && values.length >= 3) break;
    }

    return { mission, values };
  }

  extractContactInfo(html: string): { email: string; phone: string; address: string } {
    const text = html.replace(/<[^>]*>/g, ' ');

    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;

    const emails = text.match(emailRegex) || [];
    const phones = text.match(phoneRegex) || [];

    return {
      email: emails[0] || '',
      phone: phones[0] || '',
      address: '',
    };
  }

  extractSocialLinks(html: string): { [key: string]: string } {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const links = doc.querySelectorAll('a[href]');
    const socialLinks: { [key: string]: string } = {};

    const socialPlatforms = {
      facebook: /facebook\.com/,
      twitter: /twitter\.com|x\.com/,
      linkedin: /linkedin\.com/,
      instagram: /instagram\.com/,
      youtube: /youtube\.com/,
    };

    links.forEach(link => {
      const href = link.getAttribute('href') || '';
      for (const [platform, regex] of Object.entries(socialPlatforms)) {
        if (regex.test(href) && !socialLinks[platform]) {
          socialLinks[platform] = href;
        }
      }
    });

    return socialLinks;
  }

  async crawlChildrenLinks(url: string, depth: number): Promise<string[]> {
    if (depth <= 1) return [];

    try {
      const html = await this.fetchHTML(url);
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const baseUrl = new URL(url);
      const links: Set<string> = new Set();

      const anchors = doc.querySelectorAll('a[href]');
      anchors.forEach(anchor => {
        try {
          const href = anchor.getAttribute('href');
          if (!href) return;

          const linkUrl = new URL(href, baseUrl.origin);

          if (linkUrl.hostname === baseUrl.hostname &&
              linkUrl.pathname !== baseUrl.pathname &&
              !linkUrl.pathname.match(/\.(pdf|jpg|png|gif|css|js)$/i)) {
            links.add(linkUrl.toString());
          }
        } catch {}
      });

      return Array.from(links).slice(0, depth - 1);
    } catch {
      return [];
    }
  }

  async generateStructuredCompanyJSON(url: string): Promise<CompanyScrapedData> {
    const html = await this.fetchHTML(url);
    const text = this.extractText(html);
    const metadata = this.extractMetadata(html);
    const brandColors = this.detectBrandColors(html);
    const brandTone = this.detectBrandTone(text);
    const products = this.extractProducts(text);
    const { mission, values } = this.extractCompanyAbout(text);
    const contact = this.extractContactInfo(html);
    const socialLinks = this.extractSocialLinks(html);

    return {
      companyName: metadata.title.split('-')[0].trim() || 'Unknown Company',
      description: metadata.description || text.slice(0, 500),
      products,
      services: [],
      mission,
      values,
      brandTone,
      keywords: metadata.keywords,
      brandColors,
      socialLinks,
      contact,
      rawContent: text,
      htmlSnapshot: html.slice(0, 50000),
      crawlDepth: 1,
      sourceType: 'website',
    };
  }
}

export const companyWebScraper = new CompanyWebScraper();
