import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface DiagnosticResult {
  ready: boolean;
  env: Record<string, boolean>;
  services: Record<string, string>;
  thirdParty: Record<string, string>;
  database: Record<string, string>;
  issues: Array<{ category: string; item: string; message: string; fix: string }>;
  timestamp: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const result: DiagnosticResult = {
      ready: true,
      env: {},
      services: {},
      thirdParty: {},
      database: {},
      issues: [],
      timestamp: new Date().toISOString(),
    };

    const requiredEnvVars = [
      "SCRAPE_CREATORS_KEY",
      "OPENAI_API_KEY",
      "SUPABASE_URL",
      "SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
    ];

    for (const envVar of requiredEnvVars) {
      const value = Deno.env.get(envVar);
      result.env[envVar] = !!value;

      if (!value) {
        result.ready = false;
        result.issues.push({
          category: "environment",
          item: envVar,
          message: `Missing environment variable: ${envVar}`,
          fix: `Set ${envVar} in your Supabase project settings under Edge Functions secrets.`,
        });
      }
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const requiredTables = [
      "scans",
      "scan_status",
      "scan_processed_items",
      "user_profiles",
      "diagnostic_logs",
    ];

    if (supabaseUrl && supabaseKey) {
      for (const table of requiredTables) {
        try {
          const response = await fetch(`${supabaseUrl}/rest/v1/${table}?limit=1`, {
            headers: {
              Authorization: `Bearer ${supabaseKey}`,
              apikey: supabaseKey,
            },
          });

          result.database[table] = response.ok ? "ok" : "error";

          if (!response.ok) {
            result.ready = false;
            result.issues.push({
              category: "database",
              item: table,
              message: `Table '${table}' is not accessible or does not exist.`,
              fix: `Run the database migrations to create the '${table}' table.`,
            });
          }
        } catch (error) {
          result.database[table] = "error";
          result.ready = false;
          result.issues.push({
            category: "database",
            item: table,
            message: `Failed to check table '${table}': ${error.message}`,
            fix: `Verify database connection and ensure migrations are applied.`,
          });
        }
      }
    }

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (openaiKey) {
      try {
        const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openaiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: "ping" }],
            max_tokens: 5,
          }),
        });

        result.services.textExtractor = openaiResponse.ok ? "ok" : "error";
        result.services.aiClassifier = openaiResponse.ok ? "ok" : "error";
        result.services.prospectScoring = openaiResponse.ok ? "ok" : "error";

        if (!openaiResponse.ok) {
          result.ready = false;
          result.issues.push({
            category: "service",
            item: "OpenAI API",
            message: "OpenAI API connection failed or key is invalid.",
            fix: "Verify your OPENAI_API_KEY is valid and has sufficient credits.",
          });
        }
      } catch (error) {
        result.services.textExtractor = "error";
        result.services.aiClassifier = "error";
        result.services.prospectScoring = "error";
        result.ready = false;
        result.issues.push({
          category: "service",
          item: "OpenAI API",
          message: `OpenAI connection error: ${error.message}`,
          fix: "Check your network connection and OpenAI API status.",
        });
      }
    } else {
      result.services.textExtractor = "not_configured";
      result.services.aiClassifier = "not_configured";
      result.services.prospectScoring = "not_configured";
    }

    const scrapeCreatorsKey = Deno.env.get("SCRAPE_CREATORS_KEY");
    if (scrapeCreatorsKey) {
      try {
        const scrapeResponse = await fetch("https://api.scrapecreators.com/scrape", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${scrapeCreatorsKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: "https://example.com",
          }),
          signal: AbortSignal.timeout(5000),
        });

        result.thirdParty.scrapeCreators = scrapeResponse.ok ? "ok" : "error";

        if (!scrapeResponse.ok && scrapeResponse.status !== 402) {
          result.ready = false;
          result.issues.push({
            category: "third_party",
            item: "ScrapeCreators API",
            message: "ScrapeCreators API connection failed.",
            fix: "Verify your SCRAPE_CREATORS_KEY is valid and the service is operational.",
          });
        }
      } catch (error) {
        result.thirdParty.scrapeCreators = "timeout";
        result.issues.push({
          category: "third_party",
          item: "ScrapeCreators API",
          message: `ScrapeCreators timeout or network error: ${error.message}`,
          fix: "Check network connectivity or try again later.",
        });
      }
    } else {
      result.thirdParty.scrapeCreators = "not_configured";
    }

    if (supabaseUrl && supabaseKey && result.database.diagnostic_logs === "ok") {
      try {
        await fetch(`${supabaseUrl}/rest/v1/diagnostic_logs`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${supabaseKey}`,
            apikey: supabaseKey,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify({
            category: "full_diagnostic",
            message: `Diagnostic check completed: ${result.ready ? "READY" : "NOT READY"}`,
            result: result,
            created_at: new Date().toISOString(),
          }),
        });
      } catch (error) {
        console.error("Failed to log diagnostic:", error);
      }
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Diagnostic error:", error);

    return new Response(
      JSON.stringify({
        ready: false,
        error: error.message,
        timestamp: new Date().toISOString(),
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
