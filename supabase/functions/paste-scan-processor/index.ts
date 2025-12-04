import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ProcessorRequest {
  scanId: string;
  userId: string;
  rawText: string;
}

interface ProspectCandidate {
  name: string;
  snippet: string;
  lineIndex: number;
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
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { scanId, userId, rawText }: ProcessorRequest = await req.json();

    // Log to database for debugging
    await supabase.from("diagnostic_logs").insert({
      category: "paste_scan_debug",
      message: `Paste scan started: scanId=${scanId}, textLength=${rawText?.length || 0}`,
      result: {
        scanId,
        userId,
        rawTextPreview: rawText?.substring(0, 500),
        rawTextLength: rawText?.length,
      },
    }).catch(() => {});

    await updateScanStatus(supabase, scanId, "EXTRACTING_TEXT", 10, "Extracting text...");

    console.log("=== DEBUG: Raw text length:", rawText?.length);
    console.log("=== DEBUG: First 200 chars:", rawText?.substring(0, 200));

    // Check if this is CSV format
    const isCSV = rawText.includes(',') && (rawText.includes('full_name') || rawText.includes('name') || rawText.split('\n')[0].split(',').length > 2);

    const lines = rawText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    console.log("=== DEBUG: Total lines:", lines.length);
    console.log("=== DEBUG: Is CSV format:", isCSV);
    console.log("=== DEBUG: First 3 lines:", lines.slice(0, 3));

    const candidates: ProspectCandidate[] = [];

    // Handle CSV format
    if (isCSV && lines.length > 1) {
      const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
      const nameIndex = headers.findIndex(h => h.includes('name'));
      const snippetIndex = headers.findIndex(h => h.includes('snippet') || h.includes('content') || h.includes('comment') || h.includes('text'));
      const contextIndex = headers.findIndex(h => h.includes('context'));

      console.log("=== DEBUG: CSV headers:", headers);
      console.log("=== DEBUG: Name column index:", nameIndex);
      console.log("=== DEBUG: Snippet column index:", snippetIndex);

      if (nameIndex >= 0) {
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          if (!line || line === headers.join(',')) continue;

          // Parse CSV line (handle quoted fields)
          const fields: string[] = [];
          let currentField = '';
          let inQuotes = false;

          for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              fields.push(currentField.trim());
              currentField = '';
            } else {
              currentField += char;
            }
          }
          fields.push(currentField.trim());

          const name = fields[nameIndex]?.replace(/"/g, '').trim();
          let snippet = fields[snippetIndex]?.replace(/"/g, '').trim() || '';

          if (contextIndex >= 0 && fields[contextIndex]) {
            const context = fields[contextIndex].replace(/"/g, '').trim();
            snippet = `${snippet} ${context}`.trim();
          }

          if (name && name.length > 2) {
            console.log(`=== DEBUG: CSV row ${i}: name="${name}", snippet="${snippet.substring(0, 50)}..."`);
            candidates.push({
              name: name,
              snippet: snippet || `Prospect from CSV: ${name}`,
              lineIndex: i,
            });
          }
        }

        console.log("=== DEBUG: CSV parsing complete, found", candidates.length, "prospects");
      }
    }

    // If not CSV or CSV parsing failed, try text pattern matching
    if (candidates.length === 0) {
      console.log("=== DEBUG: No CSV candidates, trying text pattern matching");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Skip CSV header line
        if (i === 0 && isCSV) continue;

        // Match pattern: "Name — text" or "Name - text"
        const nameWithDashMatch = line.match(/^([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){1,4})\s*[—\-]\s*(.+)$/);

        if (nameWithDashMatch) {
          const name = nameWithDashMatch[1].trim();
          const content = nameWithDashMatch[2].trim();

          console.log(`=== DEBUG: Matched line ${i}: name="${name}"`);
          candidates.push({
            name: name,
            snippet: content,
            lineIndex: i,
          });
          continue;
        }

        // Fallback: Simple name pattern (2-4 capitalized words)
        const nameMatch = line.match(/^[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){1,3}$/);
        if (nameMatch) {
          console.log(`=== DEBUG: Fallback matched line ${i}: name="${line}"`);
          const contextLines = lines.slice(Math.max(0, i - 1), Math.min(lines.length, i + 3));
          candidates.push({
            name: line,
            snippet: contextLines.join(" "),
            lineIndex: i,
          });
        }
      }

      // Final fallback: look for capitalized name patterns in full text
      if (candidates.length === 0) {
        console.log("=== DEBUG: No candidates found, trying global search");
        const allText = lines.join(" ");
        const namePattern = /([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){1,3})\s*[—\-]\s*([^—\-]{10,})/g;
        let match;

        while ((match = namePattern.exec(allText)) !== null) {
          console.log(`=== DEBUG: Global match found: name="${match[1]}"`);
          candidates.push({
            name: match[1].trim(),
            snippet: match[2].trim().substring(0, 200),
            lineIndex: 0,
          });
        }
      }
    }

    console.log("=== DEBUG: Total candidates found:", candidates.length);

    await updateScanStatus(
      supabase,
      scanId,
      "DETECTING_NAMES",
      30,
      `Detected ${candidates.length} potential prospects`
    );

    const prospects = [];

    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];

      await updateScanStatus(
        supabase,
        scanId,
        "DETECTING_INTERESTS",
        30 + Math.floor((i / candidates.length) * 30),
        `Analyzing prospect ${i + 1} of ${candidates.length}`
      );

      let enrichedData: any = {
        full_name: candidate.name,
        pain_points: [],
        interests: [],
        life_events: [],
        sentiment: "neutral",
        opportunity_type: "both",
      };

      if (openaiKey && i < 10) {
        try {
          const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${openaiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: [
                {
                  role: "system",
                  content:
                    "You are a prospect analyzer. Extract pain points, interests, life events, sentiment, and opportunity type from text. Return JSON only.",
                },
                {
                  role: "user",
                  content: `Analyze this prospect: ${candidate.snippet}`,
                },
              ],
              max_tokens: 300,
              temperature: 0.3,
            }),
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            const content = aiData.choices?.[0]?.message?.content;
            if (content) {
              try {
                const parsed = JSON.parse(content);
                enrichedData = { ...enrichedData, ...parsed };
              } catch (e) {
                console.log("Failed to parse AI response");
              }
            }
          }
        } catch (error) {
          console.error("OpenAI error:", error);
        }
      }

      const scoutScore = calculateScoutScore(enrichedData, candidate.snippet);
      const bucket = scoutScore >= 70 ? "hot" : scoutScore >= 50 ? "warm" : "cold";

      const { data: insertedItem, error: insertError } = await supabase
        .from("scan_processed_items")
        .insert({
          scan_id: scanId,
          type: "prospect",
          name: enrichedData.full_name,
          content: candidate.snippet,
          score: scoutScore,
          metadata: {
            pain_points: enrichedData.pain_points,
            interests: enrichedData.interests,
            life_events: enrichedData.life_events,
            sentiment: enrichedData.sentiment,
            opportunity_type: enrichedData.opportunity_type,
            bucket,
            signals: [...enrichedData.pain_points, ...enrichedData.interests],
          },
        })
        .select()
        .single();

      if (insertError) {
        console.error(`Failed to insert prospect ${i + 1}:`, insertError);
      }

      if (insertedItem) {
        prospects.push(insertedItem);
      }
    }

    await updateScanStatus(supabase, scanId, "SCOUTSCORE_V5", 70, "Calculating ScoutScores...");

    const hotCount = prospects.filter((p) => (p.metadata?.bucket || "cold") === "hot").length;
    const warmCount = prospects.filter((p) => (p.metadata?.bucket || "cold") === "warm").length;
    const coldCount = prospects.filter((p) => (p.metadata?.bucket || "cold") === "cold").length;

    await supabase
      .from("scans")
      .update({
        status: "completed",
        total_items: prospects.length,
        hot_leads: hotCount,
        warm_leads: warmCount,
        cold_leads: coldCount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", scanId);

    await updateScanStatus(
      supabase,
      scanId,
      "COMPLETED",
      100,
      `Scan completed: ${prospects.length} prospects found`
    );

    return new Response(
      JSON.stringify({
        success: true,
        scanId,
        prospectsFound: prospects.length,
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
    console.error("Paste scan processor error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Processing failed",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function updateScanStatus(
  supabase: any,
  scanId: string,
  step: string,
  percent: number,
  message: string
) {
  await supabase.from("scan_status").insert({
    scan_id: scanId,
    step,
    percent,
    message,
  });
}

function calculateScoutScore(enrichedData: any, snippet: string): number {
  let score = 50;

  if (enrichedData.pain_points?.length > 0) {
    score += enrichedData.pain_points.length * 10;
  }

  if (enrichedData.interests?.length > 0) {
    score += enrichedData.interests.length * 5;
  }

  if (enrichedData.life_events?.length > 0) {
    score += enrichedData.life_events.length * 8;
  }

  if (enrichedData.sentiment === "positive") {
    score += 10;
  }

  const businessKeywords = [
    "business",
    "income",
    "opportunity",
    "investment",
    "earn",
    "profit",
    "financial",
  ];
  const snippetLower = snippet.toLowerCase();
  const keywordMatches = businessKeywords.filter((kw) => snippetLower.includes(kw)).length;
  score += keywordMatches * 5;

  return Math.min(Math.max(score, 0), 100);
}
