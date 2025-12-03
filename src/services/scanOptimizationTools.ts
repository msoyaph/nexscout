import {
  runScanBenchmark as runBenchmarkInternal,
  ScanBenchmarkOptions,
  ScanBenchmarkResult,
  getLatestBenchmarks as fetchLatestBenchmarks,
  getScanHealthStatus as fetchScanHealthStatus,
} from './tools/scanBenchmark';

import {
  runLlmLoadTest as runLoadTestInternal,
  LlmLoadTesterOptions,
  LlmLoadTesterResult,
  getLatestLoadTests as fetchLatestLoadTests,
  getLoadTestSummary as fetchLoadTestSummary,
} from './tools/llmLoadTester';

import {
  validateCsv as validateCsvInternal,
  CsvValidationResult,
  CsvValidationIssue,
  getRecentValidations as fetchRecentValidations,
} from './tools/csvValidator';

export type { ScanBenchmarkOptions, ScanBenchmarkResult, LlmLoadTesterOptions, LlmLoadTesterResult, CsvValidationResult, CsvValidationIssue };

export async function runFastBenchmark(
  userId: string,
  options: ScanBenchmarkOptions
): Promise<ScanBenchmarkResult> {
  try {
    return await runBenchmarkInternal(userId, options);
  } catch (error: any) {
    throw new Error(`Benchmark failed: ${error.message}`);
  }
}

export async function runLlmLoadTest(
  userId: string,
  options: LlmLoadTesterOptions
): Promise<LlmLoadTesterResult> {
  try {
    return await runLoadTestInternal(userId, options);
  } catch (error: any) {
    throw new Error(`Load test failed: ${error.message}`);
  }
}

export async function validateCsv(
  rawCsv: string,
  userId?: string
): Promise<CsvValidationResult> {
  try {
    return await validateCsvInternal(rawCsv, userId);
  } catch (error: any) {
    throw new Error(`CSV validation failed: ${error.message}`);
  }
}

export async function getLatestBenchmarks(limit: number = 20): Promise<any[]> {
  return fetchLatestBenchmarks(limit);
}

export async function getScanHealthStatus() {
  return fetchScanHealthStatus();
}

export async function getLatestLoadTests(limit: number = 20): Promise<any[]> {
  return fetchLatestLoadTests(limit);
}

export async function getLoadTestSummary() {
  return fetchLoadTestSummary();
}

export async function getRecentValidations(userId: string, limit: number = 10): Promise<any[]> {
  return fetchRecentValidations(userId, limit);
}
