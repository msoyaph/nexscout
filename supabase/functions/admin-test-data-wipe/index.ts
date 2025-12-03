import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let totalDeleted = 0;

    const { data: testScans } = await supabase
      .from("scans")
      .select("id")
      .contains("sources", { isTestData: true });

    const testScanIds = (testScans || []).map((s) => s.id);

    if (testScanIds.length > 0) {
      const { error: itemsError } = await supabase
        .from("scan_processed_items")
        .delete()
        .in("scan_id", testScanIds);

      if (!itemsError) {
        totalDeleted += testScanIds.length * 10;
      }

      const { error: statusError } = await supabase
        .from("scan_status")
        .delete()
        .in("scan_id", testScanIds);

      if (!statusError) {
        totalDeleted += testScanIds.length;
      }

      const { error: scansError } = await supabase
        .from("scans")
        .delete()
        .in("id", testScanIds);

      if (!scansError) {
        totalDeleted += testScanIds.length;
      }
    }

    const { data: testItems } = await supabase
      .from("scan_processed_items")
      .select("id")
      .contains("metadata", { isTestData: true });

    if (testItems && testItems.length > 0) {
      const { error } = await supabase
        .from("scan_processed_items")
        .delete()
        .in("id", testItems.map((i) => i.id));

      if (!error) {
        totalDeleted += testItems.length;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        deleted: totalDeleted,
        message: `Successfully deleted ${totalDeleted} test data records`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Test data wipe error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to wipe test data",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
