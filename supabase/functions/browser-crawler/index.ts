import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface BrowserCrawlerInput {
  url: string;
  maxPages?: number;
}

interface PageSnapshot {
  url: string;
  title: string;
  html: string;
  screenshotBase64?: string;
}

interface CrawlAction {
  step: string;
  details?: string;
  timestamp: string;
}

interface BrowserCrawlerOutput {
  pages: PageSnapshot[];
  sessionLog: {
    startTime: string;
    endTime: string;
    actions: CrawlAction[];
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { url, maxPages = 20 }: BrowserCrawlerInput = await req.json();

    if (!url) {
      throw new Error("URL is required");
    }

    const startTime = new Date().toISOString();
    const actions: CrawlAction[] = [];
    const pages: PageSnapshot[] = [];

    // Log action
    const logAction = (step: string, details?: string) => {
      actions.push({
        step,
        details,
        timestamp: new Date().toISOString(),
      });
      console.log(`[Browser Crawler] ${step}${details ? `: ${details}` : ""}`);
    };

    logAction("initialize", `Starting crawl for ${url}`);

    // Since we don't have actual headless browser in edge function,
    // we'll simulate browser automation with fetch + smart parsing
    const visitedUrls = new Set<string>();
    const urlsToVisit = [url];

    while (urlsToVisit.length > 0 && pages.length < maxPages) {
      const currentUrl = urlsToVisit.shift()!;

      if (visitedUrls.has(currentUrl)) {
        continue;
      }

      visitedUrls.add(currentUrl);

      try {
        logAction("navigate", currentUrl);

        // Fetch with browser-like headers
        const response = await fetch(currentUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            "Cache-Control": "no-cache",
          },
          redirect: "follow",
        });

        if (!response.ok) {
          logAction("error", `HTTP ${response.status} for ${currentUrl}`);
          continue;
        }

        const html = await response.text();

        // Extract title
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : new URL(currentUrl).pathname;

        logAction("extract", `Title: ${title}`);

        // Simulate country gate handling
        if (html.match(/select.*country|choose.*country/i)) {
          logAction("auto_handle", "Country selector detected - would auto-select Philippines");
        }

        // Simulate cookie banner handling
        if (html.match(/cookie|gdpr|privacy/i)) {
          logAction("auto_handle", "Cookie banner detected - would auto-accept");
        }

        // Simulate "Enter Site" gate
        if (html.match(/enter.*site|see.*website|continue.*site/i)) {
          logAction("auto_handle", "Site gate detected - would auto-click");
        }

        // For production, screenshot would be captured here
        // For now, we'll mark it as simulated
        const screenshotBase64 = undefined; // Would contain actual base64 in production

        pages.push({
          url: currentUrl,
          title,
          html: html.substring(0, 100000), // Limit HTML size
          screenshotBase64,
        });

        // Extract links for traversal
        if (pages.length < maxPages) {
          const relevantLinks = extractRelevantLinks(html, currentUrl, url);
          urlsToVisit.push(...relevantLinks.filter(link => !visitedUrls.has(link)));
        }

        logAction("complete", `Page ${pages.length} processed`);

        // Small delay to be respectful
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        logAction("error", `Failed to crawl ${currentUrl}: ${error.message}`);
      }
    }

    const endTime = new Date().toISOString();

    logAction("finish", `Crawled ${pages.length} pages`);

    const output: BrowserCrawlerOutput = {
      pages,
      sessionLog: {
        startTime,
        endTime,
        actions,
      },
    };

    return new Response(JSON.stringify(output), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });

  } catch (error: any) {
    console.error("Browser crawler error:", error);

    return new Response(JSON.stringify({
      error: error.message || "Browser crawler failed",
      pages: [],
      sessionLog: {
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        actions: [{ step: "error", details: error.message, timestamp: new Date().toISOString() }],
      },
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
});

function extractRelevantLinks(html: string, currentUrl: string, baseUrl: string): string[] {
  const links: string[] = [];
  const linkRegex = /<a[^>]*href=["']([^"']+)["']/gi;
  let match;

  const relevantPatterns = [
    '/product', '/shop', '/about', '/opportunity', '/compensation',
    '/team', '/mission', '/company', '/join', '/packages', '/plans',
    '/price', '/pricing', '/membership', '/training', '/business',
    '/enroll', '/distributor', '/be-a'
  ];

  while ((match = linkRegex.exec(html)) !== null) {
    try {
      const href = match[1];
      const fullUrl = new URL(href, currentUrl).href;
      const urlObj = new URL(fullUrl);
      const baseUrlObj = new URL(baseUrl);

      // Must be same domain
      if (urlObj.hostname !== baseUrlObj.hostname) {
        continue;
      }

      const path = urlObj.pathname.toLowerCase();

      // Skip irrelevant paths
      if (path.match(/\.(pdf|jpg|jpeg|png|gif|svg|css|js|ico|woff|ttf)$/i) ||
          path.includes('/blog/') ||
          path.includes('/news/') ||
          path.includes('/article/')) {
        continue;
      }

      // Check if path matches relevant patterns
      const isRelevant = relevantPatterns.some(pattern => path.includes(pattern)) || path === '/';

      if (isRelevant) {
        // Normalize URL (remove hash, query params, trailing slash)
        urlObj.hash = '';
        urlObj.search = '';
        let normalized = urlObj.href;
        if (normalized.endsWith('/')) {
          normalized = normalized.slice(0, -1);
        }
        links.push(normalized);
      }
    } catch (e) {
      // Invalid URL, skip
    }
  }

  return [...new Set(links)];
}
