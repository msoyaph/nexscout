import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const batchSize = parseInt(url.searchParams.get("batch_size") || "5");

    // Get queued items
    const { data: queueItems } = await supabase
      .from("file_intelligence_scan_queue")
      .select("*")
      .eq("step", "detect_entities")
      .eq("status", "queued")
      .limit(batchSize);

    if (!queueItems || queueItems.length === 0) {
      return new Response(
        JSON.stringify({ message: "No items to process", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = [];

    for (const item of queueItems) {
      try {
        await supabase
          .from("file_intelligence_scan_queue")
          .update({ status: "running" })
          .eq("id", item.id);

        // Get document and pages
        const { data: pages } = await supabase
          .from("file_intelligence_pages")
          .select("*, file_intelligence_documents!inner(*)")
          .eq("document_id", item.file_id)
          .order("page_number");

        if (!pages || pages.length === 0) throw new Error("No pages found");

        const fullText = pages.map(p => p.clean_text || p.raw_text).join("\n\n");

        // Extract entities
        const emails = extractEmails(fullText);
        const phones = extractPhones(fullText);
        const socialUrls = extractSocialUrls(fullText);
        const names = extractNames(fullText).slice(0, 50);

        let entitiesCreated = 0;

        // Save emails
        for (const email of emails) {
          await supabase.from("file_intelligence_extracted_entities").insert({
            document_id: pages[0].document_id,
            page_id: pages[0].id,
            user_id: item.user_id,
            entity_type: "email",
            raw_value: email,
            normalized_value: email.toLowerCase(),
            confidence: 0.9,
          });
          entitiesCreated++;

          // Link/create prospect
          await linkOrCreateProspect(supabase, item.user_id, { email });
        }

        // Save phones
        for (const phone of phones) {
          await supabase.from("file_intelligence_extracted_entities").insert({
            document_id: pages[0].document_id,
            page_id: pages[0].id,
            user_id: item.user_id,
            entity_type: "phone",
            raw_value: phone,
            normalized_value: phone.replace(/\D/g, ""),
            confidence: 0.8,
          });
          entitiesCreated++;
        }

        // Save social URLs
        for (const url of socialUrls) {
          await supabase.from("file_intelligence_extracted_entities").insert({
            document_id: pages[0].document_id,
            page_id: pages[0].id,
            user_id: item.user_id,
            entity_type: "social_url",
            raw_value: url,
            normalized_value: url.toLowerCase(),
            confidence: 0.95,
            metadata: { platform: detectPlatform(url) },
          });
          entitiesCreated++;

          await linkOrCreateProspect(supabase, item.user_id, { socialUrl: url });
        }

        // Save names
        for (const name of names) {
          await supabase.from("file_intelligence_extracted_entities").insert({
            document_id: pages[0].document_id,
            page_id: pages[0].id,
            user_id: item.user_id,
            entity_type: "prospect",
            raw_value: name,
            normalized_value: name.trim(),
            confidence: 0.6,
          });
          entitiesCreated++;
        }

        await supabase
          .from("file_intelligence_scan_queue")
          .update({ status: "completed" })
          .eq("id", item.id);

        // Enqueue next step
        await supabase.from("file_intelligence_scan_queue").insert({
          user_id: item.user_id,
          scan_batch_id: item.scan_batch_id,
          file_id: item.file_id,
          step: "generate_chunks",
          status: "queued",
        });

        results.push({ success: true, entitiesCreated });
      } catch (error: any) {
        await supabase
          .from("file_intelligence_scan_queue")
          .update({
            status: "failed",
            error_message: error.message,
            retries: item.retries + 1,
          })
          .eq("id", item.id);

        results.push({ success: false, error: error.message });
      }
    }

    return new Response(
      JSON.stringify({ message: "Batch processed", processed: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function extractEmails(text: string): string[] {
  const regex = /[\w.-]+@[\w.-]+\.\w+/g;
  return [...new Set(text.match(regex) || [])];
}

function extractPhones(text: string): string[] {
  const regex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  return [...new Set(text.match(regex) || [])];
}

function extractSocialUrls(text: string): string[] {
  const urls: string[] = [];
  urls.push(...(text.match(/https?:\/\/(www\.)?(facebook|fb)\.com\/[\w.-]+/gi) || []));
  urls.push(...(text.match(/https?:\/\/(www\.)?linkedin\.com\/in\/[\w-]+/gi) || []));
  urls.push(...(text.match(/https?:\/\/(www\.)?instagram\.com\/[\w.-]+/gi) || []));
  return [...new Set(urls)];
}

function extractNames(text: string): string[] {
  const regex = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;
  return [...new Set(text.match(regex) || [])];
}

function detectPlatform(url: string): string {
  if (url.includes("facebook") || url.includes("fb.com")) return "facebook";
  if (url.includes("linkedin")) return "linkedin";
  if (url.includes("instagram")) return "instagram";
  return "unknown";
}

async function linkOrCreateProspect(supabase: any, userId: string, data: any) {
  try {
    let existing = null;

    if (data.email) {
      const { data: prospects } = await supabase
        .from("prospects")
        .select("*")
        .eq("user_id", userId)
        .eq("email", data.email)
        .limit(1);
      existing = prospects?.[0];
    }

    if (existing) return { linked: true };

    await supabase.from("prospects").insert({
      user_id: userId,
      email: data.email || "",
      full_name: data.name || data.email?.split("@")[0] || "Unknown",
      social_media_url: data.socialUrl || "",
      source: "file_upload",
      status: "new",
    });

    return { created: true };
  } catch (error) {
    return { error };
  }
}
