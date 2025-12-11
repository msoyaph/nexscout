/**
 * ScoutScore V5 - DEPRECATED DUPLICATE
 * 
 * This is the simpler function-based v5 implementation that is NOT used.
 * The canonical v5 is in src/services/intelligence/scoutScoreV5.ts
 * 
 * This file is kept for backward compatibility but should be migrated away from.
 * 
 * @deprecated Use scoutScoreV5Engine from intelligence/scoutScoreV5.ts instead
 */
import { scoutScoreV5Engine } from './intelligence/scoutScoreV5';
import type { Industry } from './intelligence/conversionPatternMapper';
import type { ScoutScoreV5Result } from './intelligence/scoutScoreV5';

/**
 * Legacy ProspectSignals interface (kept for backward compatibility)
 * @deprecated
 */
export interface ProspectSignals {
  text?: string;
  occupation?: string;
  interests?: string[];
  signals?: string[];
  painPoints?: string[];
  lifeEvents?: string[];
  followers?: number;
  engagement?: number;
  mutualFriends?: number;
  interactions?: number;
  profile?: {
    hasOccupation?: boolean;
    hasLocation?: boolean;
    hasSocialLinks?: boolean;
    hasSkills?: boolean;
  };
}

/**
 * Legacy function-based v5 - supports both old and new signatures for backward compatibility
 * @deprecated Use scoutScoreV5Engine.calculateScoutScoreV5() instead
 */
export async function calculateScoutScoreV5(
  inputOrSignals: ProspectSignals | {
    prospectId: string;
    userId: string;
    industry?: Industry;
    horizonDays?: number;
  }
): Promise<ScoutScoreV5Result> {
  console.warn('[DEPRECATED] scoutScoreV5.ts calculateScoutScoreV5() - migrate to intelligence/scoutScoreV5.ts');
  
  // Check if it's the old signature (ProspectSignals object)
  if ('text' in inputOrSignals || 'interests' in inputOrSignals || 'signals' in inputOrSignals) {
    // Old signature - ProspectSignals only
    // This was a simpler function-based implementation that didn't require prospectId
    // For backward compatibility, return a simplified result
    // TODO: Migrate callers to use prospectId/userId signature
    const signals = inputOrSignals as ProspectSignals;
    console.warn('[DEPRECATED] Old ProspectSignals signature used - migrate to prospectId/userId signature');
    
    // Simplified scoring for backward compatibility (falls back to v1-like scoring)
    const score = calculateSimpleScoreFromSignals(signals);
    const rank: 'hot' | 'warm' | 'cold' = score >= 70 ? 'hot' : score >= 50 ? 'warm' : 'cold';
    
    return {
      success: true,
      prospectId: '',
      userId: '',
      v4Score: score,
      v5Score: score,
      scoreBoost: 0,
      reasoning: {
        summary: 'Simplified scoring from signals (legacy mode)',
        keyStrengths: signals.interests?.length ? [`${signals.interests.length} interests detected`] : [],
        keyWeaknesses: [],
        actionableInsights: ['Migrate to prospectId/userId signature for full v5 scoring'],
        confidenceLevel: 'low',
      },
      dimensions: {
        baseScore: score,
        behavioralMomentum: 50,
        socialInfluence: signals.followers ? Math.min(100, (signals.followers / 1000) * 100) : 30,
        opportunityReadiness: 50,
        patternMatch: 50,
      },
      recommendations: {
        nextStep: 'Gather more data for accurate scoring',
        timing: 'wait',
        approach: 'Migrate to full v5 engine',
      },
      metadata: {
        dataSourcesCombined: 1,
        timelineEventsAnalyzed: 0,
        patternsMatched: 0,
        graphNodesConsidered: 0,
      },
    };
  }
  
  // New signature - object with prospectId/userId
  return scoutScoreV5Engine.calculateScoutScoreV5(inputOrSignals as {
    prospectId: string;
    userId: string;
    industry?: Industry;
    horizonDays?: number;
  });
}

/**
 * Simple scoring function for backward compatibility with old ProspectSignals signature
 */
function calculateSimpleScoreFromSignals(signals: ProspectSignals): number {
  let score = 50;
  
  if (signals.text) {
    const text = signals.text.toLowerCase();
    if (text.includes('interested') || text.includes('gusto')) score += 15;
    if (text.includes('price') || text.includes('magkano')) score += 10;
    if (text.includes('business') || text.includes('opportunity')) score += 15;
  }
  
  if (signals.interests?.length) score += Math.min(10, signals.interests.length * 2);
  if (signals.signals?.length) score += Math.min(10, signals.signals.length * 2);
  if (signals.painPoints?.length) score += Math.min(10, signals.painPoints.length * 3);
  if (signals.profile?.hasOccupation) score += 5;
  if (signals.followers && signals.followers > 1000) score += 5;
  
  return Math.max(0, Math.min(100, score));
}

// Note: The actual ScoutScoreV5Result type is in intelligence/scoutScoreV5.ts
// We re-export it for backward compatibility
export type { ScoutScoreV5Result } from './intelligence/scoutScoreV5';
