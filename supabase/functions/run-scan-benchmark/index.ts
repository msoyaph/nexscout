import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
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
      throw new Error("Missing authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { data: adminCheck } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!adminCheck) {
      throw new Error("Admin access required");
    }

    const { sourceType, prospectCount, simulateOnly } = await req.json();

    console.log(`[Scan Benchmark] Running ${sourceType} benchmark for ${prospectCount} prospects`);

    const result = {
      sourceType,
      totalProspects: prospectCount || 30,
      timings: {
        parseMs: 150,
        extractMs: 2000,
        scoreMs: 500,
        dbWriteMs: simulateOnly ? 0 : 300,
        totalMs: 2950,
      },
      averages: {
        msPerProspect: 98.33,
        prospectsPerSecond: 10.17,
      },
      notes: ["Simulated benchmark result"],
    };

    return new Response(
      JSON.stringify({ success: true, result }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("[Scan Benchmark] Error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Benchmark failed",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
