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

    const { data: latestStatus } = await supabase
      .from("scan_status")
      .select("*")
      .eq("scan_id", scanId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    const status = latestStatus?.step || "QUEUED";
    const progress = latestStatus?.percent || 0;

    return new Response(
      JSON.stringify({
        scanId,
        status: scan.status,
        step: status,
        progress,
        hotCount: scan.hot_leads || 0,
        warmCount: scan.warm_leads || 0,
        coldCount: scan.cold_leads || 0,
        totalProspects: scan.total_items || 0,
        updatedAt: scan.updated_at || scan.created_at,
        message: latestStatus?.message,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Scan status error:", error);

    return new Response(
      JSON.stringify({
        error: error.message || "Failed to fetch scan status",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
