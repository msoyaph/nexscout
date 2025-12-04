import { supabase } from '../../lib/supabase';
import { extractBatch, ExtractedProspect } from '../scanner/batchExtractor';
import { scoreBatch, ScoredProspect } from '../scanner/parallelScoring';
import { CSVRow } from '../scanner/csvChunker';

export interface LlmLoadTesterOptions {
  mode: 'extraction' | 'scoring' | 'full';
  batches: number;
  batchSize: number;
  parallelBatches?: number;
}

export interface LlmLoadTesterResult {
  mode: string;
  batches: number;
  batchSize: number;
  parallelBatches: number;
  totalCalls: number;
  totalMs: number;
  avgMsPerCall: number;
  maxMsPerCall: number;
  minMsPerCall: number;
  errors: number;
}

function generateSyntheticProspects(count: number): CSVRow[] {
  const names = [
    'Juan Dela Cruz', 'Maria Santos', 'Jose Rizal', 'Ana Reyes',
    'Pedro Garcia', 'Lisa Tan', 'Mark Chen', 'Sarah Lee',
    'David Wong', 'Jenny Kim', 'Carlos Mendoza', 'Sofia Rodriguez'
  ];

  const snippets = [
    'Looking for extra income kailangan tuition for kids',
    'Need side hustle for my family gastos monthly',
    'Interested in business opportunity asap this year',
    'Want to start online business now 2025',
    'Looking for investment opportunity passive income',
    'Hirap sa bills need help urgently',
    'Want passive income for future retirement',
    'Entrepreneur mindset ready to start negosyo',
    'Searching for wfh opportunities freelance',
    'Need extra cash for emergency funds soon'
  ];

  const prospects: CSVRow[] = [];

  for (let i = 0; i < count; i++) {
    prospects.push({
      full_name: `${names[i % names.length]} ${i + 1}`,
      snippet: snippets[i % snippets.length],
      context: 'Facebook comment from load test',
      platform: 'facebook',
    });
  }

  return prospects;
}

async function runExtractionBatch(batch: CSVRow[]): Promise<{ duration: number; error?: string }> {
  const start = performance.now();
  try {
    await extractBatch(batch);
    return { duration: performance.now() - start };
  } catch (error: any) {
    return { duration: performance.now() - start, error: error.message };
  }
}

async function runScoringBatch(batch: ExtractedProspect[]): Promise<{ duration: number; error?: string }> {
  const start = performance.now();
  try {
    await scoreBatch(batch);
    return { duration: performance.now() - start };
  } catch (error: any) {
    return { duration: performance.now() - start, error: error.message };
  }
}

async function runFullBatch(batch: CSVRow[]): Promise<{ duration: number; error?: string }> {
  const start = performance.now();
  try {
    const extracted = await extractBatch(batch);
    await scoreBatch(extracted);
    return { duration: performance.now() - start };
  } catch (error: any) {
    return { duration: performance.now() - start, error: error.message };
  }
}

export async function runLlmLoadTest(
  userId: string,
  options: LlmLoadTesterOptions
): Promise<LlmLoadTesterResult> {
  const { mode, batches, batchSize, parallelBatches = 2 } = options;

  const totalProspects = batches * batchSize;
  const allProspects = generateSyntheticProspects(totalProspects);

  const batchGroups: CSVRow[][] = [];
  for (let i = 0; i < batches; i++) {
    batchGroups.push(allProspects.slice(i * batchSize, (i + 1) * batchSize));
  }

  const durations: number[] = [];
  let errors = 0;
  const startTime = performance.now();

  for (let i = 0; i < batchGroups.length; i += parallelBatches) {
    const currentBatchGroup = batchGroups.slice(i, i + parallelBatches);

    const results = await Promise.all(
      currentBatchGroup.map(async (batch) => {
        if (mode === 'extraction') {
          return runExtractionBatch(batch);
        } else if (mode === 'scoring') {
          const extracted: ExtractedProspect[] = batch.map(row => ({
            full_name: row.full_name,
            snippet: row.snippet,
            context: row.context,
            platform: row.platform,
            raw: row,
          }));
          return runScoringBatch(extracted);
        } else {
          return runFullBatch(batch);
        }
      })
    );

    results.forEach(result => {
      durations.push(result.duration);
      if (result.error) {
        errors++;
        console.warn('Load test batch error:', result.error);
      }
    });
  }

  const totalMs = Math.round(performance.now() - startTime);
  const avgMsPerCall = durations.reduce((a, b) => a + b, 0) / durations.length;
  const maxMsPerCall = Math.max(...durations);
  const minMsPerCall = Math.min(...durations);

  const result: LlmLoadTesterResult = {
    mode,
    batches,
    batchSize,
    parallelBatches,
    totalCalls: durations.length,
    totalMs,
    avgMsPerCall: Math.round(avgMsPerCall),
    maxMsPerCall: Math.round(maxMsPerCall),
    minMsPerCall: Math.round(minMsPerCall),
    errors,
  };

  await saveLoadTestResult(userId, result);

  return result;
}

async function saveLoadTestResult(
  userId: string,
  result: LlmLoadTesterResult
): Promise<void> {
  try {
    await supabase.from('llm_load_tests').insert({
      user_id: userId,
      mode: result.mode,
      batches: result.batches,
      batch_size: result.batchSize,
      parallel_batches: result.parallelBatches,
      total_calls: result.totalCalls,
      total_ms: result.totalMs,
      avg_ms_per_call: result.avgMsPerCall,
      max_ms_per_call: result.maxMsPerCall,
      min_ms_per_call: result.minMsPerCall,
      errors: result.errors,
    });
  } catch (error) {
    console.error('Failed to save load test result:', error);
  }
}

export async function getLatestLoadTests(limit: number = 20): Promise<any[]> {
  const { data, error } = await supabase
    .from('llm_load_tests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch load tests:', error);
    return [];
  }

  return data || [];
}

export async function getLoadTestSummary(): Promise<{
  totalTests: number;
  avgResponseTime: number;
  totalErrors: number;
  errorRate: number;
}> {
  const { data } = await supabase
    .from('llm_load_tests')
    .select('avg_ms_per_call, total_calls, errors')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  if (!data || data.length === 0) {
    return { totalTests: 0, avgResponseTime: 0, totalErrors: 0, errorRate: 0 };
  }

  const totalTests = data.length;
  const totalCalls = data.reduce((sum: number, row: any) => sum + row.total_calls, 0);
  const totalErrors = data.reduce((sum: number, row: any) => sum + row.errors, 0);
  const avgResponseTime = data.reduce((sum: number, row: any) => sum + row.avg_ms_per_call, 0) / totalTests;
  const errorRate = totalCalls > 0 ? (totalErrors / totalCalls) * 100 : 0;

  return {
    totalTests,
    avgResponseTime: Math.round(avgResponseTime),
    totalErrors,
    errorRate: Math.round(errorRate * 100) / 100,
  };
}
