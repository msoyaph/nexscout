export { processScanJob, emitProgress, isJobProcessing } from './scanQueue';
export type { ScanJob, ScanProgress } from './scanQueue';

export { extractTextFromInput } from './extractText';
export type { ExtractionResult } from './extractText';

export { extractProspectsFromText, detectPlatform } from './extractProspects';
export type { ProspectCandidate } from './extractProspects';

export { scoreProspects } from './scoutScoreEngine';
export type { ScoredProspect } from './scoutScoreEngine';

export { saveResults } from './saveResults';

export { startTextScan, startCsvScan, startImageScan, checkScanReadiness } from './scannerClient';
export type { StartScanResult, ScanReadinessCheck } from './scannerClient';
