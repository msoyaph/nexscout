import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
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
    const url = new URL(req.url);
    const scanId = url.searchParams.get("scanId");

    if (!scanId) {
      return new Response(
        JSON.stringify({ error: "Missing scanId parameter" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: scan, error: scanError } = await supabase
      .from("scans")
      .select("*")
      .eq("id", scanId)
      .single();

    if (scanError || !scan) {
      return new Response(
        JSON.stringify({ error: "Scan not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: items } = await supabase
      .from("scan_processed_items")
      .select("*")
      .eq("scan_id", scanId)
      .order("score", { ascending: false });

    const prospects = (items || []).map((item) => ({
      id: item.id,
      full_name: item.name,
      scout_score: item.score || 50,
      bucket: item.metadata?.bucket || "cold",
      pain_points: item.metadata?.pain_points || [],
      interests: item.metadata?.interests || [],
      life_events: item.metadata?.life_events || [],
      opportunity_type: item.metadata?.opportunity_type || "both",
      sentiment: item.metadata?.sentiment || "neutral",
      snippet: item.content,
    }));

    const hotCount = scan.hot_leads || 0;
    const warmCount = scan.warm_leads || 0;
    const coldCount = scan.cold_leads || 0;

    return new Response(
      JSON.stringify({
        scanId,
        summary: {
          totalProspects: scan.total_items || 0,
          hot: hotCount,
          warm: warmCount,
          cold: coldCount,
          sourceType: scan.sources?.type || "paste_text",
          sourceLabel: scan.sources?.label || "Unknown",
          createdAt: scan.created_at,
          completedAt: scan.updated_at,
        },
        prospects,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Scan results error:", error);

    return new Response(
      JSON.stringify({
        error: error.message || "Failed to fetch scan results",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
