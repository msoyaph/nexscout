import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface FastScanRequest {
  scanId: string;
  userId: string;
  csvContent: string;
}

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
    const { scanId, userId, csvContent }: FastScanRequest = await req.json();

    console.log(`[CSV Fast Scan] Starting scan ${scanId} for user ${userId}`);

    const result = await runFastPipeline(supabase, scanId, userId, csvContent);

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("[CSV Fast Scan] Error:", error);

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

async function runFastPipeline(supabase: any, scanId: string, userId: string, csvContent: string) {
  const startTime = Date.now();

  try {
    console.log(`[Fast Pipeline] Starting with ${csvContent.length} chars of CSV data`);

    const batches = chunkCSV(csvContent, 15);
    console.log(`[Fast Pipeline] Created ${batches.length} batches with ${batches.reduce((sum, b) => sum + b.items.length, 0)} total items`);

    const { error: progressError } = await supabase.from('scan_status').insert({
      scan_id: scanId,
      step: 'chunking',
      percent: 10,
      message: 'Chunking CSV data',
    });

    if (progressError) {
      console.error('[Fast Pipeline] Failed to insert progress:', progressError);
    }

    await updateProgress(supabase, scanId, 'chunking', 10, 'Chunking CSV data');

    const batchItems = batches.map((b: any) => b.items);
    const extractedBatches = [];

    for (let i = 0; i < batchItems.length; i++) {
      const batch = batchItems[i];
      const extracted = batch.map((row: any) => ({
        full_name: row.full_name,
        snippet: row.snippet || row.context || '',
        context: row.context || row.snippet || '',
        platform: row.platform || 'other',
        raw: row,
      }));
      extractedBatches.push(extracted);

      const percent = 10 + Math.floor(((i + 1) / batchItems.length) * 30);
      await updateProgress(supabase, scanId, 'extracting', percent, `Extracting prospects (${i + 1}/${batchItems.length} batches)`);
    }

    const scoredBatches = [];
    for (let i = 0; i < extractedBatches.length; i++) {
      const batch = extractedBatches[i];
      const scored = batch.map((p: any) => scoreProspect(p));
      scoredBatches.push(scored);

      const percent = 40 + Math.floor(((i + 1) / extractedBatches.length) * 30);
      await updateProgress(supabase, scanId, 'scoring', percent, `Scoring prospects (${i + 1}/${extractedBatches.length} batches)`);
    }

    const allProspects = scoredBatches.flat();
    console.log(`[Fast Pipeline] Total prospects: ${allProspects.length}`);

    await updateProgress(supabase, scanId, 'saving', 75, 'Saving results to database');

    const hotCount = allProspects.filter((p: any) => p.bucket === 'hot').length;
    const warmCount = allProspects.filter((p: any) => p.bucket === 'warm').length;
    const coldCount = allProspects.filter((p: any) => p.bucket === 'cold').length;

    await bulkWriteAll(supabase, scanId, userId, allProspects);

    await supabase
      .from('scans')
      .update({
        status: 'completed',
        total_items: allProspects.length,
        hot_leads: hotCount,
        warm_leads: warmCount,
        cold_leads: coldCount,
        completed_at: new Date().toISOString(),
      })
      .eq('id', scanId);

    await updateProgress(supabase, scanId, 'completed', 100, `Scan completed! Found ${allProspects.length} prospects (${hotCount}H/${warmCount}W/${coldCount}C)`);

    const duration = Date.now() - startTime;
    console.log(`[Fast Pipeline] Completed in ${duration}ms`);

    return {
      success: true,
      scanId,
      totalProspects: allProspects.length,
      hot: hotCount,
      warm: warmCount,
      cold: coldCount,
      duration,
    };
  } catch (error: any) {
    console.error('[Fast Pipeline] Error:', error);
    await updateProgress(supabase, scanId, 'failed', 0, `Scan failed: ${error.message}`);
    await supabase.from('scans').update({ status: 'failed' }).eq('id', scanId);

    throw error;
  }
}

function chunkCSV(csvContent: string, batchSize: number) {
  const lines = csvContent.split('\n').map((line: string) => line.trim()).filter((line: string) => line.length > 0);

  if (lines.length === 0) throw new Error('CSV file is empty');

  const headers = lines[0].toLowerCase().split(',').map((h: string) => h.trim().replace(/"/g, ''));
  const rows = [];

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

    const row: any = { full_name: '', snippet: '', context: '', platform: 'other' };

    headers.forEach((header: string, idx: number) => {
      const value = fields[idx] || '';
      if (header.includes('name')) row.full_name = value;
      else if (header.includes('snippet') || header.includes('content') || header.includes('comment')) row.snippet = value;
      else if (header.includes('context')) row.context = value;
      else if (header.includes('platform')) row.platform = value || 'other';
      row[header] = value;
    });

    if (row.full_name && row.full_name.length > 2) rows.push(row);
  }

  const batches = [];
  for (let i = 0; i < rows.length; i += batchSize) {
    batches.push({ batchId: Math.floor(i / batchSize) + 1, items: rows.slice(i, i + batchSize) });
  }

  return batches;
}

function scoreProspect(prospect: any) {
  const PAIN_KEYWORDS = ['kailangan', 'need', 'hirap', 'kulang', 'gastos', 'bills', 'utang', 'pagod', 'stress', 'takot'];
  const OPP_KEYWORDS = ['extra income', 'side hustle', 'business', 'negosyo', 'opportunity', 'investment', 'online', 'wfh'];
  const URG_KEYWORDS = ['ngayon', 'now', 'asap', 'urgent', 'soon', '2025'];

  const snippetLower = (prospect.snippet + ' ' + prospect.context).toLowerCase();
  let score = 50;
  const factors: string[] = [];
  const painPoints: string[] = [];
  const interests: string[] = [];

  const painMatches = PAIN_KEYWORDS.filter((kw: string) => snippetLower.includes(kw));
  if (painMatches.length > 0) {
    score += painMatches.length * 8;
    painPoints.push(...painMatches);
    factors.push(`${painMatches.length} pain points`);
  }

  const oppMatches = OPP_KEYWORDS.filter((kw: string) => snippetLower.includes(kw));
  if (oppMatches.length > 0) {
    score += oppMatches.length * 10;
    interests.push(...oppMatches);
    factors.push(`${oppMatches.length} opportunity signals`);
  }

  const urgMatches = URG_KEYWORDS.filter((kw: string) => snippetLower.includes(kw));
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
}

async function bulkWriteAll(supabase: any, scanId: string, userId: string, prospects: any[]) {
  const scanItems = prospects.map((p: any) => ({
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

  await supabase.from('scan_processed_items').insert(scanItems);

  const prospectRecords = prospects.map((p: any) => ({
    user_id: userId,
    full_name: p.full_name,
    bio_text: p.snippet,
    platform: p.platform || 'other',
    metadata: {
      scout_score: p.score,
      bucket: p.bucket,
      temperature: p.bucket,
      tags: [...p.pain_points, ...p.interests],
      pain_points: p.pain_points,
      interests: p.interests,
      scan_id: scanId,
      scan_source: 'csv-fast-scan'
    }
  }));

  await supabase.from('prospects').insert(prospectRecords);
}

async function updateProgress(supabase: any, scanId: string, stage: string, percent: number, message: string) {
  await supabase.from('scan_status').insert({
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
