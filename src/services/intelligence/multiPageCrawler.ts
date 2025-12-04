export interface CrawlOptions {
  maxPages?: number;
  onPageCrawled?: (pageNum: number, total: number) => void;
}

export interface PageData {
  url: string;
  html: string;
  statusCode: number;
}

export interface CrawlResult {
  success: boolean;
  pages: PageData[];
  error?: string;
}

class MultiPageCrawler {
  private readonly RELEVANT_PATHS = [
    '/product', '/shop', '/about', '/opportunity', '/compensation',
    '/team', '/mission', '/company', '/join', '/packages', '/plans',
    '/price', '/pricing', '/membership', '/training', '/testimonial',
    '/contact', '/service', '/solution', '/offer'
  ];

  private readonly MAX_PAGES = 20;
  private visitedUrls = new Set<string>();

  async crawl(startUrl: string, options: CrawlOptions = {}): Promise<CrawlResult> {
    const maxPages = options.maxPages || this.MAX_PAGES;
    this.visitedUrls.clear();

    const pages: PageData[] = [];
    const urlsToVisit = [this.normalizeUrl(startUrl)];

    try {
      while (urlsToVisit.length > 0 && pages.length < maxPages) {
        const currentUrl = urlsToVisit.shift()!;

        if (this.visitedUrls.has(currentUrl)) {
          continue;
        }

        this.visitedUrls.add(currentUrl);

        try {
          const pageData = await this.fetchPage(currentUrl);

          if (pageData) {
            pages.push(pageData);

            if (options.onPageCrawled) {
              options.onPageCrawled(pages.length, maxPages);
            }

            // Extract and queue relevant links
            if (pages.length < maxPages) {
              const links = this.extractLinks(pageData.html, currentUrl);
              const relevantLinks = links.filter(link =>
                this.isRelevantLink(link, startUrl) && !this.visitedUrls.has(link)
              );
              urlsToVisit.push(...relevantLinks.slice(0, maxPages - pages.length));
            }
          }
        } catch (error) {
          console.error(`Error fetching ${currentUrl}:`, error);
        }

        // Small delay to be respectful
        await this.delay(500);
      }

      return {
        success: pages.length > 0,
        pages,
      };
    } catch (error: any) {
      return {
        success: false,
        pages: [],
        error: error.message,
      };
    }
  }

  private async fetchPage(url: string): Promise<PageData | null> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        redirect: 'follow',
      });

      if (!response.ok) {
        console.warn(`HTTP ${response.status} for ${url}`);
        return null;
      }

      const html = await response.text();

      return {
        url,
        html,
        statusCode: response.status,
      };
    } catch (error) {
      console.error(`Fetch error for ${url}:`, error);
      return null;
    }
  }

  private extractLinks(html: string, baseUrl: string): string[] {
    const links: string[] = [];
    const linkRegex = /<a[^>]*href=["']([^"']+)["']/gi;
    let match;

    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1];
      try {
        const fullUrl = new URL(href, baseUrl).href;
        links.push(this.normalizeUrl(fullUrl));
      } catch (e) {
        // Invalid URL, skip
      }
    }

    return [...new Set(links)];
  }

  private isRelevantLink(url: string, baseUrl: string): boolean {
    try {
      const urlObj = new URL(url);
      const baseObj = new URL(baseUrl);

      // Must be same domain
      if (urlObj.hostname !== baseObj.hostname) {
        return false;
      }

      const path = urlObj.pathname.toLowerCase();

      // Skip irrelevant paths
      if (path.includes('/blog/') || path.includes('/news/') ||
          path.includes('/article/') || path.includes('/wp-') ||
          path.match(/\.(pdf|jpg|jpeg|png|gif|svg|css|js)$/)) {
        return false;
      }

      // Check if path matches relevant patterns
      return this.RELEVANT_PATHS.some(pattern => path.includes(pattern)) || path === '/';
    } catch {
      return false;
    }
  }

  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // Remove trailing slash, hash, and query params for deduplication
      urlObj.hash = '';
      urlObj.search = '';
      let normalized = urlObj.href;
      if (normalized.endsWith('/')) {
        normalized = normalized.slice(0, -1);
      }
      return normalized;
    } catch {
      return url;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const multiPageCrawler = new MultiPageCrawler();
