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
  scanType: 'text' | 'csv' | 'image';
  payload: any;
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
    const { scanId, userId, scanType, payload }: ProcessorRequest = await req.json();

    await emitProgress(supabase, scanId, "queued", 0, "Scan queued for processing");

    await emitProgress(supabase, scanId, "extracting_text", 5, "Extracting text from input...");
    const extractResult = await extractText(scanType, payload);

    if (extractResult.error || !extractResult.text) {
      throw new Error(extractResult.error || 'Failed to extract text');
    }

    await emitProgress(supabase, scanId, "extracting_text", 20, `Extracted ${extractResult.text.length} characters`);

    await emitProgress(supabase, scanId, "detecting_prospects", 25, "Analyzing text for prospects...");
    const prospects = await extractProspects(extractResult.text);

    if (prospects.length === 0) {
      throw new Error('No prospects found in the provided data');
    }

    await emitProgress(supabase, scanId, "detecting_prospects", 40, `Found ${prospects.length} potential prospects`);

    await emitProgress(supabase, scanId, "scoring", 45, "Scoring prospects with AI...");
    const scoredProspects = await scoreProspects(prospects);

    await emitProgress(supabase, scanId, "scoring", 75, `Scored all ${scoredProspects.length} prospects`);

    await emitProgress(supabase, scanId, "saving", 80, "Saving results to database...");

    try {
      await saveResults(supabase, scanId, userId, scoredProspects);
    } catch (saveError: any) {
      console.error("Critical error saving results:", saveError);
      await emitProgress(supabase, scanId, "failed", 80, `Failed to save: ${saveError.message}`);
      throw saveError;
    }

    const hotCount = scoredProspects.filter(p => p.bucket === 'hot').length;
    const warmCount = scoredProspects.filter(p => p.bucket === 'warm').length;
    const coldCount = scoredProspects.filter(p => p.bucket === 'cold').length;

    console.log(`Updating scan record: ${scoredProspects.length} total, ${hotCount}H/${warmCount}W/${coldCount}C`);

    const { error: updateError } = await supabase
      .from('scans')
      .update({
        status: 'completed',
        total_items: scoredProspects.length,
        hot_leads: hotCount,
        warm_leads: warmCount,
        cold_leads: coldCount,
        completed_at: new Date().toISOString(),
      })
      .eq('id', scanId);

    if (updateError) {
      console.error("Failed to update scan record:", updateError);
      throw new Error(`Failed to update scan: ${updateError.message}`);
    }

    await emitProgress(supabase, scanId, "creating_prospects", 90, "Creating prospects...");

    try {
      await createProspects(supabase, scanId, userId, scoredProspects);
    } catch (prospectError: any) {
      console.error("Error creating prospects:", prospectError);
    }

    await emitProgress(supabase, scanId, "completed", 100, `Scan completed! Found ${scoredProspects.length} prospects`);

    return new Response(
      JSON.stringify({
        success: true,
        scanId,
        prospectsFound: scoredProspects.length,
        hot: hotCount,
        warm: warmCount,
        cold: coldCount,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Scan processor error:", error);

    try {
      const { scanId } = await req.clone().json();
      if (scanId) {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        await supabase
          .from('scans')
          .update({ status: 'failed' })
          .eq('id', scanId);

        await supabase.from("scan_status").insert({
          scan_id: scanId,
          step: "failed",
          percent: 0,
          message: error.message || "Processing failed",
        });
      }
    } catch (updateError) {
      console.error("Failed to update error status:", updateError);
    }

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

async function emitProgress(supabase: any, scanId: string, stage: string, percent: number, message: string) {
  await supabase.from("scan_status").insert({
    scan_id: scanId,
    step: stage,
    percent: Math.min(100, Math.max(0, percent)),
    message,
  });

  await supabase
    .from('scans')
    .update({
      status: stage === 'completed' ? 'completed' : stage === 'failed' ? 'failed' : 'processing'
    })
    .eq('id', scanId);
}

async function extractText(scanType: string, payload: any): Promise<{ text: string; error?: string }> {
  try {
    if (scanType === 'text') {
      const text = typeof payload === 'string' ? payload : payload.text || payload.content || '';
      return { text: text.trim() };
    }

    if (scanType === 'csv') {
      const csvText = typeof payload === 'string' ? payload : payload.text || payload.content || '';
      const lines = csvText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

      if (lines.length === 0) return { text: '', error: 'CSV file is empty' };

      const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
      const nameIndex = headers.findIndex(h => h.includes('name'));
      const contentColumns = headers
        .map((h, i) => (h.includes('snippet') || h.includes('content') || h.includes('comment') || h.includes('text') || h.includes('context')) ? i : -1)
        .filter(i => i !== -1);

      const extractedRows: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line || line === headers.join(',')) continue;

        const fields: string[] = [];
        let currentField = '';
        let inQuotes = false;

        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            fields.push(currentField.trim().replace(/"/g, ''));
            currentField = '';
          } else {
            currentField += char;
          }
        }
        fields.push(currentField.trim().replace(/"/g, ''));

        const name = nameIndex >= 0 && fields[nameIndex] ? fields[nameIndex] : '';
        const contentParts = contentColumns.map(idx => fields[idx] || '').filter(Boolean);
        const content = contentParts.join(' ');

        if (name && name.length > 2) {
          extractedRows.push(`${name} — ${content || `Prospect: ${name}`}`);
        }
      }

      return { text: extractedRows.join('\n') };
    }

    return { text: '', error: 'Unsupported scan type' };
  } catch (error: any) {
    return { text: '', error: error.message };
  }
}

async function extractProspects(text: string): Promise<any[]> {
  const prospects: any[] = [];
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const dashPattern = /^([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){1,4})\s*[—\-]\s*(.+)$/;
    const dashMatch = line.match(dashPattern);

    if (dashMatch) {
      prospects.push({
        full_name: dashMatch[1].trim(),
        snippet: dashMatch[2].trim(),
        context: dashMatch[2].trim(),
        lineNumber: i + 1,
      });
    }
  }

  return prospects;
}

async function scoreProspects(prospects: any[]): Promise<any[]> {
  const PAIN_POINT_KEYWORDS = ['kailangan', 'need', 'hirap', 'kulang', 'gastos', 'bills', 'utang', 'pagod', 'stress', 'takot'];
  const OPPORTUNITY_KEYWORDS = ['extra income', 'side hustle', 'business', 'negosyo', 'opportunity', 'investment', 'online', 'wfh'];
  const URGENCY_KEYWORDS = ['ngayon', 'now', 'asap', 'urgent', 'soon', '2025'];

  return prospects.map(prospect => {
    const snippetLower = prospect.snippet.toLowerCase();
    let score = 50;
    const factors: string[] = [];
    const painPoints: string[] = [];
    const interests: string[] = [];

    const painMatches = PAIN_POINT_KEYWORDS.filter(kw => snippetLower.includes(kw));
    if (painMatches.length > 0) {
      score += painMatches.length * 8;
      painPoints.push(...painMatches);
      factors.push(`${painMatches.length} pain points`);
    }

    const oppMatches = OPPORTUNITY_KEYWORDS.filter(kw => snippetLower.includes(kw));
    if (oppMatches.length > 0) {
      score += oppMatches.length * 10;
      interests.push(...oppMatches);
      factors.push(`${oppMatches.length} opportunity signals`);
    }

    const urgMatches = URGENCY_KEYWORDS.filter(kw => snippetLower.includes(kw));
    if (urgMatches.length > 0) {
      score += urgMatches.length * 12;
      factors.push('High urgency');
    }

    score = Math.min(100, Math.max(0, score));
    const bucket = score >= 70 ? 'hot' : score >= 50 ? 'warm' : 'cold';

    return {
      ...prospect,
      score,
      bucket,
      confidence: 70 + (factors.length * 5),
      top_factors: factors,
      pain_points: painPoints,
      interests: interests,
      sentiment: 'neutral',
      opportunity_type: 'both',
    };
  });
}

async function saveResults(supabase: any, scanId: string, userId: string, prospects: any[]): Promise<void> {
  const items = prospects.map(p => ({
    scan_id: scanId,
    type: 'text',
    name: p.full_name,
    content: p.snippet,
    score: p.score,
    metadata: {
      bucket: p.bucket,
      confidence: p.confidence,
      top_factors: p.top_factors,
      pain_points: p.pain_points,
      interests: p.interests,
      sentiment: p.sentiment,
      opportunity_type: p.opportunity_type,
      signals: [...p.pain_points, ...p.interests],
    },
  }));

  console.log(`Saving ${items.length} items to scan_processed_items for scan ${scanId}`);

  const batchSize = 100;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    console.log(`Inserting batch ${i / batchSize + 1}: ${batch.length} items`);

    const { data, error } = await supabase.from('scan_processed_items').insert(batch);

    if (error) {
      console.error(`Failed to insert batch ${i / batchSize + 1}:`, error);
      throw new Error(`Failed to save prospects: ${error.message}`);
    }

    console.log(`Batch ${i / batchSize + 1} saved successfully`);
  }

  console.log(`All ${items.length} items saved to database`);
}

async function createProspects(supabase: any, scanId: string, userId: string, prospects: any[]): Promise<void> {
  const prospectRecords = prospects.map(p => ({
    user_id: userId,
    full_name: p.full_name,
    bio_text: p.snippet,
    platform: 'other',
    metadata: {
      scout_score: p.score,
      bucket: p.bucket,
      temperature: p.bucket,
      tags: [...p.pain_points, ...p.interests],
      pain_points: p.pain_points,
      interests: p.interests,
      scan_id: scanId,
      scan_source: 'paste-text'
    }
  }));

  console.log(`Creating ${prospectRecords.length} prospect records`);

  const batchSize = 100;
  for (let i = 0; i < prospectRecords.length; i += batchSize) {
    const batch = prospectRecords.slice(i, i + batchSize);

    const { error } = await supabase.from('prospects').insert(batch);

    if (error) {
      console.error(`Failed to insert prospect batch ${i / batchSize + 1}:`, error);
    } else {
      console.log(`Prospect batch ${i / batchSize + 1} created successfully`);
    }
  }

  console.log(`All prospects created`);
}
