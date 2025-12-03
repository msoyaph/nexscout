import { supabase } from '../../lib/supabase';
import { parseCSV } from '../scanner/csvChunker';
import { extractBatch } from '../scanner/batchExtractor';
import { scoreBatch } from '../scanner/parallelScoring';
import { bulkWriteAll } from '../scanner/bulkWriter';

export interface ScanBenchmarkOptions {
  sourceType: 'paste_text' | 'csv_upload' | 'screenshot_upload';
  prospectCount?: number;
  simulateOnly?: boolean;
}

export interface ScanBenchmarkResult {
  sourceType: string;
  totalProspects: number;
  timings: {
    parseMs: number;
    extractMs: number;
    scoreMs: number;
    dbWriteMs: number;
    totalMs: number;
  };
  averages: {
    msPerProspect: number;
    prospectsPerSecond: number;
  };
  notes?: string[];
}

function generateTestCSV(count: number): string {
  const names = ['Juan Dela Cruz', 'Maria Santos', 'Jose Rizal', 'Ana Reyes', 'Pedro Garcia', 'Lisa Tan', 'Mark Chen', 'Sarah Lee'];
  const snippets = [
    'Looking for extra income kailangan tuition',
    'Need side hustle for my family gastos',
    'Interested in business opportunity asap',
    'Want to start online business now',
    'Looking for investment opportunity 2025',
    'Hirap sa bills need help',
    'Want passive income for future',
    'Entrepreneur mindset ready to start'
  ];

  let csv = 'name,snippet,context,platform\n';
  for (let i = 0; i < count; i++) {
    const name = names[i % names.length] + ` ${i + 1}`;
    const snippet = snippets[i % snippets.length];
    csv += `"${name}","${snippet}","Facebook comment","facebook"\n`;
  }
  return csv;
}

function generateTestTextContent(count: number): string {
  const lines = [];
  for (let i = 0; i < count; i++) {
    lines.push(`Person ${i + 1}: Looking for business opportunity and extra income kailangan ngayon`);
  }
  return lines.join('\n');
}

export async function runScanBenchmark(
  userId: string,
  options: ScanBenchmarkOptions
): Promise<ScanBenchmarkResult> {
  const { sourceType, prospectCount = 30, simulateOnly = false } = options;

  const startTime = performance.now();
  const notes: string[] = [];

  try {
    let testData: string;
    if (sourceType === 'csv_upload') {
      testData = generateTestCSV(prospectCount);
    } else {
      testData = generateTestTextContent(prospectCount);
    }

    const parseStart = performance.now();
    const rows = parseCSV(testData);
    const parseMs = Math.round(performance.now() - parseStart);
    notes.push(`Parsed ${rows.length} rows`);

    const extractStart = performance.now();
    const extracted = await extractBatch(rows);
    const extractMs = Math.round(performance.now() - extractStart);
    notes.push(`Extracted ${extracted.length} prospects`);

    const scoreStart = performance.now();
    const scored = await scoreBatch(extracted);
    const scoreMs = Math.round(performance.now() - scoreStart);

    const hotCount = scored.filter(p => p.bucket === 'hot').length;
    const warmCount = scored.filter(p => p.bucket === 'warm').length;
    const coldCount = scored.filter(p => p.bucket === 'cold').length;
    notes.push(`Scored: ${hotCount}H/${warmCount}W/${coldCount}C`);

    let dbWriteMs = 0;
    if (!simulateOnly) {
      const tempScanId = crypto.randomUUID();
      const { error: scanError } = await supabase.from('scans').insert({
        id: tempScanId,
        user_id: userId,
        source_label: `Benchmark ${sourceType}`,
        source_type: sourceType,
        status: 'completed',
        total_items: scored.length,
        hot_leads: hotCount,
        warm_leads: warmCount,
        cold_leads: coldCount,
      });

      if (scanError) {
        throw new Error(`Failed to create scan: ${scanError.message}`);
      }

      const dbWriteStart = performance.now();
      await bulkWriteAll(supabase, tempScanId, userId, scored);
      dbWriteMs = Math.round(performance.now() - dbWriteStart);
      notes.push(`Wrote ${scored.length} records to DB`);
    } else {
      notes.push('Skipped DB write (simulate mode)');
    }

    const totalMs = Math.round(performance.now() - startTime);
    const msPerProspect = totalMs / scored.length;
    const prospectsPerSecond = (scored.length / totalMs) * 1000;

    const result: ScanBenchmarkResult = {
      sourceType,
      totalProspects: scored.length,
      timings: {
        parseMs,
        extractMs,
        scoreMs,
        dbWriteMs,
        totalMs,
      },
      averages: {
        msPerProspect: Math.round(msPerProspect * 100) / 100,
        prospectsPerSecond: Math.round(prospectsPerSecond * 100) / 100,
      },
      notes,
    };

    await saveBenchmarkResult(userId, options, result);

    return result;
  } catch (error: any) {
    throw new Error(`Benchmark failed: ${error.message}`);
  }
}

async function saveBenchmarkResult(
  userId: string,
  options: ScanBenchmarkOptions,
  result: ScanBenchmarkResult
): Promise<void> {
  try {
    await supabase.from('scan_benchmarks').insert({
      user_id: userId,
      source_type: options.sourceType,
      total_prospects: result.totalProspects,
      parse_ms: result.timings.parseMs,
      extract_ms: result.timings.extractMs,
      score_ms: result.timings.scoreMs,
      db_write_ms: result.timings.dbWriteMs,
      total_ms: result.timings.totalMs,
      ms_per_prospect: result.averages.msPerProspect,
      prospects_per_second: result.averages.prospectsPerSecond,
      simulate_only: options.simulateOnly || false,
      notes: result.notes?.join('; '),
    });
  } catch (error) {
    console.error('Failed to save benchmark result:', error);
  }
}

export async function getLatestBenchmarks(limit: number = 20): Promise<any[]> {
  const { data, error } = await supabase
    .from('scan_benchmarks')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch benchmarks:', error);
    return [];
  }

  return data || [];
}

export async function getScanHealthStatus(): Promise<{
  csvScans: 'ok' | 'slow' | 'critical';
  pasteTextScans: 'ok' | 'slow' | 'critical';
  screenshotScans: 'ok' | 'slow' | 'experimental';
  avgTimings: Record<string, number>;
}> {
  const { data } = await supabase
    .from('scan_benchmarks')
    .select('source_type, total_ms, total_prospects')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  const avgTimings: Record<string, number> = {};
  const counts: Record<string, number> = {};

  (data || []).forEach((row: any) => {
    const type = row.source_type;
    const avgTime = row.total_ms / row.total_prospects;
    avgTimings[type] = (avgTimings[type] || 0) + avgTime;
    counts[type] = (counts[type] || 0) + 1;
  });

  Object.keys(avgTimings).forEach(type => {
    avgTimings[type] = avgTimings[type] / (counts[type] || 1);
  });

  const getStatus = (avgMs: number) => {
    if (avgMs < 500) return 'ok';
    if (avgMs < 1500) return 'slow';
    return 'critical';
  };

  return {
    csvScans: getStatus(avgTimings['csv_upload'] || 0),
    pasteTextScans: getStatus(avgTimings['paste_text'] || 0),
    screenshotScans: 'experimental',
    avgTimings,
  };
}
