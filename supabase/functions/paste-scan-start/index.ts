import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PasteScanRequest {
  scanId: string;
  rawText: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing authorization" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { scanId, rawText }: PasteScanRequest = await req.json();

    if (!scanId || !rawText || rawText.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: scan, error: scanError } = await supabase
      .from("scans")
      .select("*")
      .eq("id", scanId)
      .single();

    if (scanError || !scan) {
      throw new Error(`Scan not found: ${scanError?.message}`);
    }

    const { error: statusError } = await supabase.from("scan_status").insert({
      scan_id: scan.id,
      step: "QUEUED",
      percent: 0,
      message: "Scan queued for processing",
    });

    if (statusError) {
      console.error("Failed to create status:", statusError);
    }

    const processorUrl = `${supabaseUrl}/functions/v1/scan-processor-v2`;

    console.log("=== Triggering V2 processor for scan:", scan.id);
    console.log("=== Raw text length:", rawText?.length);
    console.log("=== Raw text preview:", rawText?.substring(0, 100));

    fetch(processorUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        scanId: scan.id,
        userId: scan.user_id,
        scanType: 'text',
        payload: rawText,
      }),
    }).then(async (res) => {
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Processor responded with error:", res.status, errorText);
      } else {
        console.log("Processor triggered successfully");
      }
    }).catch((err) => {
      console.error("Failed to trigger processor:", err);
    });

    return new Response(
      JSON.stringify({
        success: true,
        scanId: scan.id,
        status: "queued",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Paste scan start error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to start scan",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
