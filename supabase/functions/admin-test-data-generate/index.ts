import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const FILIPINO_NAMES = [
  "Juan Dela Cruz", "Maria Santos", "Mark Alonzo", "Jerome Dizon",
  "Angela Ramos", "Jessa Mae Lopez", "Cliff Jefferson", "Grace Ann Bautista",
  "Rico Mercado", "Ana Marie Reyes", "Carlo Villanueva", "Jenny Rose Garcia",
  "Michael Torres", "Kristine Joy Cruz", "Robert James Santos", "Sarah Jane Gonzales",
  "Dennis Rodriguez", "Michelle Anne Perez", "Patrick Fernandez", "Angelica Mae Rivera",
];

const PAIN_POINTS = [
  "kulang sa oras", "financial stress", "need extra income", "career growth",
  "OFW family pressure", "high living costs", "unstable income", "work-life balance",
];

const INTERESTS = [
  "online business", "investing", "insurance", "real estate", "affiliate marketing",
  "stock market", "passive income", "entrepreneurship", "financial planning", "side hustles",
];

const LIFE_EVENTS = [
  "new baby", "getting married", "bought a house", "career change",
  "started business", "moved abroad", "graduated", "promotion",
];

const PERSONAS = [
  "Business Minded", "Opportunity Seeker", "Family Provider", "Ambitious Networker",
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomItems<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateScoutScore(): { score: number; bucket: string } {
  const score = Math.floor(Math.random() * 100);
  let bucket = "cold";
  if (score >= 80) bucket = "hot";
  else if (score >= 50) bucket = "warm";
  return { score, bucket };
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

    const { userId, scanType, count } = await req.json();

    if (!userId || !count) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const hotPercent = 0.15 + Math.random() * 0.1;
    const warmPercent = 0.45 + Math.random() * 0.1;
    const hotCount = Math.floor(count * hotPercent);
    const warmCount = Math.floor(count * warmPercent);
    const coldCount = count - hotCount - warmCount;

    const timestamp = new Date().toISOString().split("T")[0];
    const sourceLabel = `Test Scan – ${timestamp}`;

    const { data: scan, error: scanError } = await supabase
      .from("scans")
      .insert({
        user_id: userId,
        status: "completed",
        sources: {
          type: scanType || "paste_text",
          label: sourceLabel,
          isTestData: true,
        },
        total_items: count,
        hot_leads: hotCount,
        warm_leads: warmCount,
        cold_leads: coldCount,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (scanError || !scan) {
      throw new Error(`Failed to create scan: ${scanError?.message}`);
    }

    const prospects = [];

    for (let i = 0; i < count; i++) {
      const name = randomItem(FILIPINO_NAMES);
      const painPoints = randomItems(PAIN_POINTS, Math.floor(Math.random() * 3) + 1);
      const interests = randomItems(INTERESTS, Math.floor(Math.random() * 4) + 2);
      const lifeEvents = Math.random() > 0.5 ? randomItems(LIFE_EVENTS, 1) : [];
      const persona = randomItem(PERSONAS);
      const { score, bucket } = generateScoutScore();

      const snippet = `${name} is interested in ${interests[0]}. ${
        painPoints[0] ? `Experiencing ${painPoints[0]}.` : ""
      }`;

      prospects.push({
        scan_id: scan.id,
        user_id: userId,
        name,
        content: snippet,
        score,
        metadata: {
          pain_points: painPoints,
          interests,
          life_events: lifeEvents,
          persona,
          bucket,
          signals: [...painPoints, ...interests],
          isTestData: true,
        },
      });
    }

    const { error: itemsError } = await supabase
      .from("scan_processed_items")
      .insert(prospects);

    if (itemsError) {
      console.error("Failed to insert prospects:", itemsError);
    }

    await supabase.from("scan_status").insert({
      scan_id: scan.id,
      step: "COMPLETED",
      percent: 100,
      message: `Test scan completed: ${count} prospects generated`,
    });

    return new Response(
      JSON.stringify({
        success: true,
        scanId: scan.id,
        generated: count,
        hot: hotCount,
        warm: warmCount,
        cold: coldCount,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Test data generation error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to generate test data",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
