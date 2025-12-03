import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ScanRequest {
  scan_id?: string;
  text?: string;
  user_id?: string;
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

    const body: ScanRequest = await req.json();
    const { scan_id, text } = body;

    if (scan_id) {
      // Process existing scan
      await runScanPipeline(supabase, scan_id);

      return new Response(
        JSON.stringify({ success: true, scan_id }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    } else if (text) {
      // Create new scan and start processing
      const { data: scan, error: scanError } = await supabase
        .from("scans")
        .insert({
          user_id: user.id,
          source_type: "text",
          raw_data: text,
          status: "processing"
        })
        .select()
        .single();

      if (scanError || !scan) {
        throw new Error("Failed to create scan");
      }

      // Start pipeline in background
      runScanPipeline(supabase, scan.id);

      return new Response(
        JSON.stringify({ success: true, scan_id: scan.id }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    } else {
      throw new Error("Either scan_id or text is required");
    }

  } catch (error) {
    console.error("Scan processor error:", error);

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

async function runScanPipeline(supabase: any, scanId: string) {
  try {
    // Get scan data
    const { data: scan } = await supabase
      .from("scans")
      .select("*")
      .eq("id", scanId)
      .single();

    if (!scan) {
      throw new Error("Scan not found");
    }

    const text = scan.raw_data || "";

    // STEP 1: Initialize scan status
    await supabase
      .from('scan_status')
      .insert({
        scan_id: scanId,
        step: 'EXTRACTING_TEXT',
        percent: 10,
        message: 'Extracting text...'
      });

    await new Promise(r => setTimeout(r, 500));

    // STEP 2: Detect names
    await supabase
      .from('scan_status')
      .update({
        step: 'DETECTING_NAMES',
        percent: 40,
        message: 'Detecting names...',
        updated_at: new Date().toISOString()
      })
      .eq('scan_id', scanId);

    await new Promise(r => setTimeout(r, 500));

    // Extract names from text
    const names = extractNames(text);

    // STEP 3: Score prospects
    await supabase
      .from('scan_status')
      .update({
        step: 'SCORING_PROSPECTS',
        percent: 80,
        message: 'Scoring prospects...',
        updated_at: new Date().toISOString()
      })
      .eq('scan_id', scanId);

    await new Promise(r => setTimeout(r, 500));

    // STEP 4: Save results
    await supabase
      .from('scan_results')
      .insert({
        scan_id: scanId,
        prospects: names
      });

    // Save individual prospect items
    for (const prospect of names) {
      await supabase
        .from('scan_processed_items')
        .insert({
          scan_id: scanId,
          type: 'prospect',
          name: prospect.name,
          score: prospect.score,
          content: prospect.name,
          metadata: { source: 'text_extraction' }
        });
    }

    // STEP 5: Mark as completed
    await supabase
      .from('scan_status')
      .update({
        step: 'COMPLETED',
        percent: 100,
        message: `Scan completed! Found ${names.length} prospects.`,
        updated_at: new Date().toISOString()
      })
      .eq('scan_id', scanId);

    // Update scan record status
    await supabase
      .from('scans')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', scanId);

  } catch (error) {
    console.error('Error in scan pipeline:', error);

    // Mark scan as failed
    await supabase
      .from('scan_status')
      .update({
        step: 'FAILED',
        percent: 0,
        message: 'Scan failed. Please try again.',
        updated_at: new Date().toISOString()
      })
      .eq('scan_id', scanId);

    await supabase
      .from('scans')
      .update({
        status: 'failed'
      })
      .eq('id', scanId);
  }
}

function extractNames(text: string): Array<{ name: string; score: number }> {
  // Match typical Filipino and English names (First Last)
  const regex = /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g;
  const detected = text.match(regex) || [];

  // Remove duplicates
  const uniqueNames = [...new Set(detected)];

  return uniqueNames.map(name => ({
    name,
    score: Math.floor(Math.random() * 30) + 50 // Random score between 50-79
  }));
}
