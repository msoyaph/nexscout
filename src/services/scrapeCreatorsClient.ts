const API_KEY = "wXJGe89EmiRUl7QBTommgtsHaMm1";
const API_URL = "https://api.scrapecreators.com/scrape";

export interface ScrapeResult {
  html?: string;
  text?: string;
  links?: string[];
  error?: string;
}

export interface ScrapeOptions {
  url: string;
  render_js?: boolean;
  block_ads?: boolean;
  remove_selectors?: string[];
  extract_html?: boolean;
  extract_text?: boolean;
  extract_links?: boolean;
  extract_comments?: boolean;
  extract_social_graph?: boolean;
}

export async function scrapeURL(url: string, options?: Partial<ScrapeOptions>): Promise<ScrapeResult> {
  try {
    console.log('[ScrapeCreators] Scraping URL:', url);

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY
      },
      body: JSON.stringify({
        url,
        render_js: options?.render_js ?? true,
        block_ads: options?.block_ads ?? true,
        remove_selectors: options?.remove_selectors ?? ["script", "style", "noscript"],
        extract_html: options?.extract_html ?? true,
        extract_text: options?.extract_text ?? true,
        extract_links: options?.extract_links ?? true,
        extract_comments: options?.extract_comments ?? false,
        extract_social_graph: options?.extract_social_graph ?? false,
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[ScrapeCreators] API Error:', data);
      throw new Error(data.message || data.error || "Scraping failed");
    }

    console.log('[ScrapeCreators] Successfully scraped:', {
      hasHtml: !!data.html,
      hasText: !!data.text,
      linkCount: data.links?.length || 0
    });

    return {
      html: data.html || "",
      text: data.text || "",
      links: data.links || []
    };
  } catch (err) {
    console.error('[ScrapeCreators] Error:', err);
    return {
      error: err instanceof Error ? err.message : "Unknown scraping error"
    };
  }
}

export async function scrapePageHTML(url: string): Promise<string | null> {
  const result = await scrapeURL(url, { extract_html: true, extract_text: false, extract_links: false });
  return result.error ? null : result.html || null;
}

export async function scrapePageText(url: string): Promise<string | null> {
  const result = await scrapeURL(url, { extract_html: false, extract_text: true, extract_links: false });
  return result.error ? null : result.text || null;
}

export async function scrapeSocialGraph(url: string): Promise<ScrapeResult> {
  return scrapeURL(url, {
    extract_social_graph: true,
    extract_comments: true,
    extract_html: true,
    extract_text: true
  });
}

export function detectPlatform(url: string): string {
  const lowerUrl = url.toLowerCase();

  if (lowerUrl.includes("facebook.com") || lowerUrl.includes("fb.com")) {
    return "facebook";
  }
  if (lowerUrl.includes("instagram.com")) {
    return "instagram";
  }
  if (lowerUrl.includes("twitter.com") || lowerUrl.includes("x.com")) {
    return "twitter";
  }
  if (lowerUrl.includes("linkedin.com")) {
    return "linkedin";
  }
  if (lowerUrl.includes("tiktok.com")) {
    return "tiktok";
  }

  return "unknown";
}

export function isValidSocialURL(url: string): boolean {
  const platform = detectPlatform(url);
  return platform !== "unknown";
}

export async function fallbackScrape(url: string): Promise<ScrapeResult> {
  try {
    console.log('[ScrapeCreators] Attempting fallback scrape:', url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();

    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    console.log('[ScrapeCreators] Fallback successful');

    return {
      html,
      text: textContent,
      links: []
    };
  } catch (err) {
    console.error('[ScrapeCreators] Fallback failed:', err);
    return {
      error: err instanceof Error ? err.message : "Fallback scraping failed"
    };
  }
}
