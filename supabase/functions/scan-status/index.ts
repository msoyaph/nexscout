import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const url = new URL(req.url);
    const scanId = url.searchParams.get("scan_id");

    if (!scanId) {
      throw new Error("scan_id parameter is required");
    }

    const { data: scan, error: scanError } = await supabase
      .from("scans")
      .select(`
        id,
        status,
        pipeline_state,
        processing_message,
        ocr_confidence,
        taglish_score,
        language_mix,
        processing_metadata,
        estimated_completion_time,
        created_at
      `)
      .eq("id", scanId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (scanError) {
      throw scanError;
    }

    if (!scan) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Scan not found",
        }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const stateProgressMap: Record<string, number> = {
      queued: 0,
      initializing: 5,
      ocr_processing: 15,
      parsing_facebook: 30,
      nlp_enrichment: 45,
      taglish_analysis: 55,
      personality_profiling: 65,
      pain_point_detection: 75,
      scoring: 85,
      saving_results: 95,
      completed: 100,
      failed: 0,
    };

    const progress_percentage = stateProgressMap[scan.pipeline_state || "queued"] || 0;

    const { data: ocrResults, error: ocrError } = await supabase
      .from("scan_ocr_results")
      .select("confidence, processing_time_ms")
      .eq("scan_id", scanId);

    const { data: taglishAnalysis, error: taglishError } = await supabase
      .from("scan_taglish_analysis")
      .select("*")
      .eq("scan_id", scanId)
      .maybeSingle();

    const { data: processedItems, error: itemsError } = await supabase
      .from("scan_processed_items")
      .select("type, score")
      .eq("scan_id", scanId);

    const prospectsFound = processedItems?.filter(i => i.type === "text" || i.type === "friend").length || 0;

    let estimated_remaining_seconds = 0;
    if (scan.estimated_completion_time) {
      const now = new Date().getTime();
      const completionTime = new Date(scan.estimated_completion_time).getTime();
      estimated_remaining_seconds = Math.max(0, Math.round((completionTime - now) / 1000));
    }

    return new Response(
      JSON.stringify({
        success: true,
        scan: {
          id: scan.id,
          status: scan.status,
          pipeline_state: scan.pipeline_state,
          progress_percentage,
          message: scan.processing_message || "Processing...",
          ocr_confidence: scan.ocr_confidence,
          taglish_score: scan.taglish_score,
          language_mix: scan.language_mix,
          estimated_remaining_seconds,
          prospects_found: prospectsFound,
          created_at: scan.created_at,
          ocr_results_count: ocrResults?.length || 0,
          has_taglish_analysis: !!taglishAnalysis,
          taglish_analysis: taglishAnalysis ? {
            communication_style: taglishAnalysis.communication_style,
            filipino_percentage: taglishAnalysis.filipino_percentage,
            english_percentage: taglishAnalysis.english_percentage,
            has_business_interest: taglishAnalysis.has_business_interest,
            localized_greeting: taglishAnalysis.localized_greeting,
          } : null,
        },
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Scan status API error:", error);

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
