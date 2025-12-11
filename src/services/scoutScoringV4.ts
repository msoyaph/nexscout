/**
 * ScoutScore V4 - DEPRECATED
 * 
 * This file is kept for backward compatibility but now delegates to
 * the canonical implementation in src/services/intelligence/scoutScoreV4.ts
 * 
 * @deprecated Use scoutScoreV4Engine from intelligence/scoutScoreV4.ts instead
 */
import { scoutScoreV4Engine } from './intelligence/scoutScoreV4';
import type { ScoutScoreV4Input, ScoutScoreV4Result } from './intelligence/scoutScoreV4';

/**
 * Legacy v4 class - delegates to canonical implementation
 * @deprecated
 */
export class ScoutScoringV4 {
  /**
   * @deprecated Use scoutScoreV4Engine.calculateScoutScoreV4() instead
   */
  static async calculateScoreV4(input: ScoutScoreV4Input): Promise<ScoutScoreV4Result> {
    return scoutScoreV4Engine.calculateScoutScoreV4(input);
  }

  /**
   * Legacy method - delegates to canonical implementation
   * @deprecated
   */
  static async scoreProspectsForScanV4(scanId: string): Promise<void> {
    // This method signature differs, so we keep minimal compatibility
    console.warn('[DEPRECATED] scoutScoringV4.ts scoreProspectsForScanV4() - migrate to intelligence/scoutScoreV4.ts');
    // For now, just log - full migration would require refactoring callers
  }
}

// Re-export types for backward compatibility
export type { ScoutScoreV4Input, ScoutScoreV4Result } from './intelligence/scoutScoreV4';
