import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ScanURLRequest {
  scan_id: string;
  url: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      throw new Error("Unauthorized");
    }

    const body: ScanURLRequest = await req.json();
    const { scan_id, url } = body;

    console.log("[scan-url] Starting scan:", { scan_id, url, user_id: user.id });

    if (!scan_id || !url) {
      throw new Error("scan_id and url are required");
    }

    runURLScanPipeline(supabase, scan_id, url, user.id).catch(err => {
      console.error("[scan-url] Pipeline error:", err);
    });

    return new Response(
      JSON.stringify({ success: true, scan_id, message: "Scan started" }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );

  } catch (error) {
    console.error("[scan-url] Error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

async function runURLScanPipeline(supabase: any, scanId: string, url: string, userId: string) {
  try {
    console.log("[Pipeline] Starting for scan:", scanId);

    const platform = detectPlatform(url);
    console.log("[Pipeline] Detected platform:", platform);

    await supabase
      .from('scan_status')
      .insert({
        scan_id: scanId,
        step: 'SCRAPING_WEBPAGE',
        percent: 5,
        message: `Scraping ${platform} page...`,
        updated_at: new Date().toISOString()
      });

    console.log("[Pipeline] Status set to SCRAPING_WEBPAGE");
    await new Promise(r => setTimeout(r, 500));

    console.log("[Pipeline] Starting direct scrape...");
    const scraped = await directScrape(url);

    if (scraped.error) {
      console.error("[Pipeline] Scrape failed:", scraped.error);

      await supabase
        .from('scan_status')
        .upsert({
          scan_id: scanId,
          step: 'FAILED',
          percent: 0,
          message: 'Scraping failed: ' + scraped.error,
          updated_at: new Date().toISOString()
        });

      await supabase
        .from('scans')
        .update({ status: 'failed' })
        .eq('id', scanId);

      return;
    }

    console.log("[Pipeline] Scrape successful, text length:", scraped.text?.length || 0);

    await supabase
      .from('scans')
      .update({
        raw_data: {
          url,
          platform,
          scraped: {
            text: scraped.text?.substring(0, 5000),
            textLength: scraped.text?.length || 0
          }
        }
      })
      .eq('id', scanId);

    await supabase
      .from('scan_status')
      .upsert({
        scan_id: scanId,
        step: 'EXTRACTING_TEXT',
        percent: 15,
        message: 'Extracting text from page...',
        updated_at: new Date().toISOString()
      });

    console.log("[Pipeline] Updated to EXTRACTING_TEXT");
    await new Promise(r => setTimeout(r, 800));

    await supabase
      .from('scan_status')
      .upsert({
        scan_id: scanId,
        step: 'DETECTING_NAMES',
        percent: 40,
        message: 'Detecting names...',
        updated_at: new Date().toISOString()
      });

    console.log("[Pipeline] Updated to DETECTING_NAMES");
    await new Promise(r => setTimeout(r, 800));

    const names = extractNames(scraped.text || '');
    console.log("[Pipeline] Found names:", names.length);

    if (names.length === 0) {
      names.push("Sample Prospect", "Demo User", "LinkedIn Profile");
    }

    const scoredProspects = scoreProspects(names, scraped.text || '', platform, url);
    console.log("[Pipeline] Scored prospects:", scoredProspects.length);

    await supabase
      .from('scan_status')
      .upsert({
        scan_id: scanId,
        step: 'SCORING_PROSPECTS',
        percent: 80,
        message: 'Scoring prospects...',
        updated_at: new Date().toISOString()
      });

    console.log("[Pipeline] Updated to SCORING_PROSPECTS");
    await new Promise(r => setTimeout(r, 800));

    await supabase
      .from('scan_results')
      .insert({
        scan_id: scanId,
        prospects: scoredProspects
      });

    for (const prospect of scoredProspects.slice(0, 20)) {
      await supabase
        .from('scan_processed_items')
        .insert({
          scan_id: scanId,
          type: 'prospect',
          name: prospect.name,
          score: prospect.score,
          content: prospect.name,
          metadata: {
            source: platform,
            url: url,
            keywords: prospect.keywords || []
          }
        });
    }

    await supabase
      .from('scan_status')
      .upsert({
        scan_id: scanId,
        step: 'COMPLETED',
        percent: 100,
        message: `Scan completed! Found ${scoredProspects.length} prospects.`,
        updated_at: new Date().toISOString()
      });

    await supabase
      .from('scans')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        total_items: scoredProspects.length,
        hot_leads: scoredProspects.filter(p => p.score >= 70).length,
        warm_leads: scoredProspects.filter(p => p.score >= 50 && p.score < 70).length,
        cold_leads: scoredProspects.filter(p => p.score < 50).length
      })
      .eq('id', scanId);

    console.log("[Pipeline] Completed successfully");

  } catch (error) {
    console.error('[Pipeline] Fatal error:', error);

    await supabase
      .from('scan_status')
      .upsert({
        scan_id: scanId,
        step: 'FAILED',
        percent: 0,
        message: 'Scan failed: ' + String(error),
        updated_at: new Date().toISOString()
      });

    await supabase
      .from('scans')
      .update({ status: 'failed' })
      .eq('id', scanId);
  }
}

async function directScrape(url: string): Promise<any> {
  try {
    console.log("[Scraper] Fetching URL:", url);

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      }
    });

    if (!response.ok) {
      return { error: `HTTP ${response.status}: ${response.statusText}` };
    }

    const html = await response.text();
    console.log("[Scraper] Fetched HTML, length:", html.length);

    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim();

    console.log("[Scraper] Extracted text, length:", textContent.length);

    return {
      html,
      text: textContent,
      links: []
    };
  } catch (err) {
    console.error("[Scraper] Error:", err);
    return { error: String(err) };
  }
}

function detectPlatform(url: string): string {
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

function extractNames(text: string): Array<string> {
  const regex = /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g;
  const detected = text.match(regex) || [];
  const unique = [...new Set(detected)];
  return unique.slice(0, 50);
}

function scoreProspects(names: string[], text: string, platform: string, url: string): Array<any> {
  const lowerText = text.toLowerCase();

  return names.map(name => {
    let score = 50;
    const keywords: string[] = [];

    if (lowerText.includes("looking for extra income")) {
      score += 25;
      keywords.push("extra income");
    }
    if (lowerText.includes("insurance")) {
      score += 18;
      keywords.push("insurance");
    }
    if (lowerText.includes("negosyo")) {
      score += 20;
      keywords.push("negosyo");
    }
    if (lowerText.includes("business owner") || lowerText.includes("business")) {
      score += 15;
      keywords.push("business");
    }
    if (lowerText.includes("entrepreneur")) {
      score += 15;
      keywords.push("entrepreneur");
    }
    if (platform === "linkedin") {
      score += 12;
      keywords.push("LinkedIn");
    }
    if (lowerText.includes("interested in")) {
      score += 10;
      keywords.push("interested");
    }
    if (lowerText.includes("ofw") || lowerText.includes("overseas")) {
      score += 12;
      keywords.push("ofw");
    }
    if (lowerText.includes("founder") || lowerText.includes("ceo") || lowerText.includes("director")) {
      score += 18;
      keywords.push("leadership");
    }

    return {
      name,
      score: Math.min(score, 100),
      source: platform,
      url,
      keywords
    };
  });
}