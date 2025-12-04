/**
 * INCOME PROJECTION ML MODEL V1
 *
 * Features + heuristic scoring for MLM income projection
 * Can be replaced with trained ML model later
 */

export interface IncomeFeatures {
  currentRank: string;
  personalSalesVolume: number;
  teamVolume: number;
  activeFrontlineCount: number;
  totalDownlineCount: number;
  avgCommissionRate: number;
  retentionRate: number;
  activityConsistencyScore: number;
  leadConversionRate: number;
}

export interface IncomeProjectionResult {
  projectedMonthlyIncome: number;
  projectedRank: string;
  rankUpProbability: number;
  keyDrivers: string[];
  recommendations: string[];
}

const RANK_MULTIPLIERS: Record<string, number> = {
  Starter: 0.8,
  Bronze: 1.0,
  Silver: 1.3,
  Gold: 1.7,
  Platinum: 2.2,
  Diamond: 3.0,
};

const RANK_ORDER = ['Starter', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];

function nextRank(currentRank: string): string {
  const idx = RANK_ORDER.indexOf(currentRank);
  return idx === -1 || idx === RANK_ORDER.length - 1 ? currentRank : RANK_ORDER[idx + 1];
}

/**
 * Project income using heuristic model v1
 */
export function projectIncomeV1(features: IncomeFeatures): IncomeProjectionResult {
  const rankMultiplier = RANK_MULTIPLIERS[features.currentRank] ?? 1.0;

  // Base income calculation
  const baseIncome =
    (features.teamVolume + features.personalSalesVolume) *
    (features.avgCommissionRate / 100);

  // Behavior boost factor (0.7 to 1.3 multiplier)
  const behaviorBoost =
    0.4 * features.retentionRate +
    0.3 * features.activityConsistencyScore +
    0.3 * features.leadConversionRate;

  const projectedMonthlyIncome =
    baseIncome * rankMultiplier * (0.7 + 0.6 * behaviorBoost);

  // Rank-up probability heuristic
  const volumeFactor = Math.min(features.teamVolume / 5000, 1);
  const teamSizeFactor = Math.min(features.activeFrontlineCount / 5, 1);
  const activityFactor =
    (features.activityConsistencyScore + features.leadConversionRate) / 2;

  const rankUpProbability = Math.max(
    0,
    Math.min(
      1,
      0.3 * volumeFactor + 0.3 * teamSizeFactor + 0.4 * activityFactor
    )
  );

  const projectedRank =
    rankUpProbability > 0.65
      ? nextRank(features.currentRank)
      : features.currentRank;

  // Key drivers
  const keyDrivers = [];
  if (features.teamVolume > 0) {
    keyDrivers.push(
      `Team volume: ${features.teamVolume.toLocaleString()} PHP`
    );
  }
  if (features.personalSalesVolume > 0) {
    keyDrivers.push(
      `Personal sales: ${features.personalSalesVolume.toLocaleString()} PHP`
    );
  }
  keyDrivers.push(
    `Retention: ${(features.retentionRate * 100).toFixed(0)}%`
  );
  keyDrivers.push(
    `Activity score: ${(features.activityConsistencyScore * 100).toFixed(0)}%`
  );
  keyDrivers.push(
    `Lead conversion: ${(features.leadConversionRate * 100).toFixed(0)}%`
  );

  // Recommendations
  const recommendations = generateRecommendations(features, rankUpProbability);

  return {
    projectedMonthlyIncome: Math.round(projectedMonthlyIncome),
    projectedRank,
    rankUpProbability,
    keyDrivers,
    recommendations,
  };
}

/**
 * Generate personalized recommendations
 */
function generateRecommendations(
  features: IncomeFeatures,
  rankUpProbability: number
): string[] {
  const recommendations: string[] = [];

  // Volume recommendations
  if (features.teamVolume < 5000) {
    recommendations.push(
      'Focus on building team volume through consistent recruiting'
    );
  }

  if (features.personalSalesVolume < features.teamVolume * 0.1) {
    recommendations.push('Increase personal sales to maintain credibility');
  }

  // Team building recommendations
  if (features.activeFrontlineCount < 3) {
    recommendations.push(
      'Build your frontline to at least 3-5 active partners'
    );
  }

  if (
    features.totalDownlineCount > 0 &&
    features.activeFrontlineCount / features.totalDownlineCount < 0.2
  ) {
    recommendations.push(
      'Focus on activation - many inactive team members detected'
    );
  }

  // Activity recommendations
  if (features.activityConsistencyScore < 0.5) {
    recommendations.push(
      'Improve daily consistency - aim for 80%+ activity rate'
    );
  }

  if (features.leadConversionRate < 0.15) {
    recommendations.push(
      'Work on conversion skills - current rate is below average'
    );
  }

  // Retention recommendations
  if (features.retentionRate < 0.6) {
    recommendations.push(
      'URGENT: Fix retention issues - losing too many team members'
    );
  }

  // Rank advancement
  if (rankUpProbability > 0.5 && rankUpProbability < 0.7) {
    recommendations.push(
      `You're close to ranking up! Focus on consistent volume for next 30 days`
    );
  }

  // If no specific recommendations, add general one
  if (recommendations.length === 0) {
    recommendations.push('Maintain current momentum and scale your activities');
  }

  return recommendations.slice(0, 4); // Max 4 recommendations
}

/**
 * Calculate activity consistency score from action logs
 */
export function calculateActivityScore(
  actionsLast30Days: number[],
  targetDailyActions: number = 5
): number {
  if (actionsLast30Days.length === 0) return 0;

  const daysWithTargetMet = actionsLast30Days.filter(
    (count) => count >= targetDailyActions
  ).length;

  return daysWithTargetMet / actionsLast30Days.length;
}

/**
 * Calculate lead conversion rate
 */
export function calculateConversionRate(
  leadsContacted: number,
  conversions: number
): number {
  if (leadsContacted === 0) return 0;
  return conversions / leadsContacted;
}

/**
 * Calculate retention rate
 */
export function calculateRetentionRate(
  activeThisMonth: number,
  activeLastMonth: number
): number {
  if (activeLastMonth === 0) return 1;
  return Math.min(1, activeThisMonth / activeLastMonth);
}

/**
 * Training data structure for real ML model (future)
 */
export interface MLTrainingData {
  feature: IncomeFeatures;
  label: {
    actualIncomeNextMonth: number;
    actualRankNextMonth: string;
  };
}
