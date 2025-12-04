export interface ParsedPage {
  url: string;
  pageType: string;
  rawHtml: string;
  text: string;

  // Meta & SEO
  metaTags: any;
  structuredData: any[];
  h1s: string[];
  h2s: string[];
  keywords: string[];

  // Company identity
  companyName?: string;
  tagline?: string;
  mission?: string;
  vision?: string;
  aboutSection?: string;
  foundedYear?: number;

  // Products
  products: any[];

  // Navigation & structure
  navLinks: string[];
  ctaButtons: any[];
  forms: any[];

  // Media
  images: any[];
  videos: any[];
  pdfs: string[];
}

class AdvancedHTMLParser {
  async parse(html: string, url: string): Promise<ParsedPage> {
    // Extract all text content
    const text = this.extractText(html);

    // Determine page type
    const pageType = this.detectPageType(url, html, text);

    return {
      url,
      pageType,
      rawHtml: html.substring(0, 50000), // Store first 50KB
      text,

      metaTags: this.extractMetaTags(html),
      structuredData: this.extractStructuredData(html),
      h1s: this.extractHeaders(html, 'h1'),
      h2s: this.extractHeaders(html, 'h2'),
      keywords: this.extractKeywords(text),

      companyName: this.extractCompanyName(html, text),
      tagline: this.extractTagline(html, text),
      mission: this.extractMission(text),
      vision: this.extractVision(text),
      aboutSection: this.extractAboutSection(text),
      foundedYear: this.extractFoundedYear(text),

      products: this.extractProducts(html, text),

      navLinks: this.extractNavLinks(html),
      ctaButtons: this.extractCTAs(html),
      forms: this.extractForms(html),

      images: this.extractImages(html, url),
      videos: this.extractVideos(html),
      pdfs: this.extractPDFs(html, url),
    };
  }

  private extractText(html: string): string {
    // Remove script and style tags
    let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

    // Remove HTML tags
    text = text.replace(/<[^>]+>/g, ' ');

    // Decode HTML entities
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');

    // Clean up whitespace
    text = text.replace(/\s+/g, ' ').trim();

    return text;
  }

  private extractMetaTags(html: string): any {
    const meta: any = {};

    // Title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) meta.title = titleMatch[1].trim();

    // Meta description
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    if (descMatch) meta.description = descMatch[1];

    // Open Graph
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
    if (ogTitleMatch) meta.ogTitle = ogTitleMatch[1];

    const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
    if (ogDescMatch) meta.ogDescription = ogDescMatch[1];

    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
    if (ogImageMatch) meta.ogImage = ogImageMatch[1];

    return meta;
  }

  private extractStructuredData(html: string): any[] {
    const structured: any[] = [];
    const ldJsonRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match;

    while ((match = ldJsonRegex.exec(html)) !== null) {
      try {
        const json = JSON.parse(match[1]);
        structured.push(json);
      } catch (e) {
        // Invalid JSON, skip
      }
    }

    return structured;
  }

  private extractHeaders(html: string, tag: string): string[] {
    const headers: string[] = [];
    const regex = new RegExp(`<${tag}[^>]*>([^<]+)<\/${tag}>`, 'gi');
    let match;

    while ((match = regex.exec(html)) !== null) {
      headers.push(match[1].trim());
    }

    return headers;
  }

  private extractKeywords(text: string): string[] {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 4);

    const wordCounts = new Map<string, number>();
    words.forEach(word => {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    });

    return Array.from(wordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
      .map(([word]) => word);
  }

  private detectPageType(url: string, html: string, text: string): string {
    const urlLower = url.toLowerCase();
    const textLower = text.toLowerCase();

    if (urlLower.includes('/product') || urlLower.includes('/shop')) return 'products';
    if (urlLower.includes('/about')) return 'about';
    if (urlLower.includes('/compensation') || urlLower.includes('/plan')) return 'compensation';
    if (urlLower.includes('/opportunity') || urlLower.includes('/join')) return 'opportunity';
    if (urlLower.includes('/contact')) return 'contact';
    if (urlLower.includes('/testimonial') || textLower.includes('testimonial')) return 'testimonials';
    if (url === new URL(url).origin || urlLower.endsWith('/')) return 'home';

    return 'other';
  }

  private extractCompanyName(html: string, text: string): string | undefined {
    // Try meta tags first
    const ogSiteName = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i);
    if (ogSiteName) return ogSiteName[1];

    // Try title
    const titleMatch = html.match(/<title[^>]*>([^<|]+)/i);
    if (titleMatch) return titleMatch[1].trim();

    // Try first H1
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (h1Match) return h1Match[1].trim();

    return undefined;
  }

  private extractTagline(html: string, text: string): string | undefined {
    // Look for common tagline patterns
    const patterns = [
      /tagline[^:]*:?\s*([^.!?\n]{10,100}[.!?])/i,
      /slogan[^:]*:?\s*([^.!?\n]{10,100}[.!?])/i,
      /<p[^>]*class=["'][^"']*tagline[^"']*["'][^>]*>([^<]+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1].trim();
    }

    return undefined;
  }

  private extractMission(text: string): string | undefined {
    const missionMatch = text.match(/mission[^:]*:?\s*([^.!?\n]{20,500}[.!?])/i);
    return missionMatch ? missionMatch[1].trim() : undefined;
  }

  private extractVision(text: string): string | undefined {
    const visionMatch = text.match(/vision[^:]*:?\s*([^.!?\n]{20,500}[.!?])/i);
    return visionMatch ? visionMatch[1].trim() : undefined;
  }

  private extractAboutSection(text: string): string | undefined {
    const aboutMatch = text.match(/about\s+(?:us|our company)[^.!?]*([^]{100,1000})/i);
    return aboutMatch ? aboutMatch[1].substring(0, 500).trim() : undefined;
  }

  private extractFoundedYear(text: string): number | undefined {
    const yearMatch = text.match(/(?:founded|established|since|started)\s+(?:in\s+)?(\d{4})/i);
    if (yearMatch) {
      const year = parseInt(yearMatch[1]);
      if (year > 1800 && year <= new Date().getFullYear()) {
        return year;
      }
    }
    return undefined;
  }

  private extractProducts(html: string, text: string): any[] {
    const products: any[] = [];

    // Look for product patterns (e.g., product cards, lists)
    const productRegex = /<div[^>]*class=["'][^"']*product[^"']*["'][^>]*>([\s\S]{0,2000}?)<\/div>/gi;
    let match;

    while ((match = productRegex.exec(html)) !== null) {
      const productHtml = match[1];
      const productText = this.extractText(productHtml);

      // Extract product name (usually in h2, h3, or strong)
      const nameMatch = productHtml.match(/<(?:h[2-4]|strong)[^>]*>([^<]+)</i);
      if (nameMatch) {
        const name = nameMatch[1].trim();

        // Extract price
        const priceMatch = productText.match(/\$\s*(\d+(?:\.\d{2})?)/);

        products.push({
          name,
          description: productText.substring(0, 200),
          price: priceMatch ? parseFloat(priceMatch[1]) : null,
          category: this.guessProductCategory(name, productText),
        });
      }

      if (products.length >= 50) break; // Limit to 50 products
    }

    return products;
  }

  private guessProductCategory(name: string, description: string): string {
    const text = (name + ' ' + description).toLowerCase();

    if (text.match(/supplement|vitamin|mineral|nutrient/)) return 'Health Supplements';
    if (text.match(/skin|beauty|cream|serum|lotion/)) return 'Skin Care';
    if (text.match(/insurance|coverage|policy/)) return 'Insurance';
    if (text.match(/membership|package|kit|starter/)) return 'Membership Package';
    if (text.match(/training|course|program|education/)) return 'Training';
    if (text.match(/digital|ebook|software|app/)) return 'Digital Product';

    return 'General';
  }

  private extractNavLinks(html: string): string[] {
    const links: string[] = [];
    const navRegex = /<nav[^>]*>([\s\S]*?)<\/nav>/gi;
    let navMatch;

    while ((navMatch = navRegex.exec(html)) !== null) {
      const navHtml = navMatch[1];
      const linkRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>([^<]+)</gi;
      let linkMatch;

      while ((linkMatch = linkRegex.exec(navHtml)) !== null) {
        links.push(linkMatch[2].trim());
      }
    }

    return links;
  }

  private extractCTAs(html: string): any[] {
    const ctas: any[] = [];
    const buttonRegex = /<(?:button|a)[^>]*(?:class|id)=["'][^"']*(?:btn|cta|button)[^"']*["'][^>]*>([^<]+)/gi;
    let match;

    while ((match = buttonRegex.exec(html)) !== null) {
      const text = match[1].trim();
      if (text.length > 0 && text.length < 100) {
        ctas.push({ text, type: this.categorizeCTA(text) });
      }
      if (ctas.length >= 20) break;
    }

    return ctas;
  }

  private categorizeCTA(text: string): string {
    const lower = text.toLowerCase();
    if (lower.match(/join|sign\s*up|register|enroll/)) return 'signup';
    if (lower.match(/buy|purchase|shop|order/)) return 'purchase';
    if (lower.match(/learn|discover|explore|see/)) return 'learn_more';
    if (lower.match(/contact|call|email/)) return 'contact';
    if (lower.match(/download|get|claim/)) return 'download';
    return 'other';
  }

  private extractForms(html: string): any[] {
    const forms: any[] = [];
    const formRegex = /<form[^>]*>([\s\S]{0,5000}?)<\/form>/gi;
    let match;

    while ((match = formRegex.exec(html)) !== null) {
      const formHtml = match[0];
      const inputs = (formHtml.match(/<input[^>]*name=["']([^"']+)["']/gi) || []).length;
      forms.push({ inputs, hasEmailField: formHtml.includes('email') });
      if (forms.length >= 10) break;
    }

    return forms;
  }

  private extractImages(html: string, baseUrl: string): any[] {
    const images: any[] = [];
    const imgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*(?:alt=["']([^"']*)["'])?/gi;
    let match;

    while ((match = imgRegex.exec(html)) !== null) {
      try {
        const src = new URL(match[1], baseUrl).href;
        const alt = match[2] || '';
        images.push({ src, alt });
        if (images.length >= 50) break;
      } catch (e) {
        // Invalid URL
      }
    }

    return images;
  }

  private extractVideos(html: string): any[] {
    const videos: any[] = [];

    // YouTube embeds
    const ytRegex = /(?:youtube\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/g;
    let match;

    while ((match = ytRegex.exec(html)) !== null) {
      videos.push({ platform: 'youtube', id: match[1] });
      if (videos.length >= 10) break;
    }

    return videos;
  }

  private extractPDFs(html: string, baseUrl: string): string[] {
    const pdfs: string[] = [];
    const pdfRegex = /href=["']([^"']*\.pdf[^"']*)["']/gi;
    let match;

    while ((match = pdfRegex.exec(html)) !== null) {
      try {
        const pdfUrl = new URL(match[1], baseUrl).href;
        pdfs.push(pdfUrl);
        if (pdfs.length >= 20) break;
      } catch (e) {
        // Invalid URL
      }
    }

    return pdfs;
  }
}

export const advancedHTMLParser = new AdvancedHTMLParser();
