/**
 * Pricing Model Engine
 * ML-based pricing recommendations using historical data
 */

import { supabase } from '../../lib/supabase';

export interface PricingRecommendation {
  recommendedProPrice: number;
  recommendedTeamBasePrice: number;
  recommendedTeamSeatPrice: number;
  recommendedEnterpriseMinPrice: number;
  recommendedEnergyPacks: Array<{ energy: number; price: number }>;
  recommendedCoinPacks: Array<{ coins: number; price: number }>;
  explanation: string;
  confidenceScore: number;
}

/**
 * Analyze pricing elasticity (how sensitive users are to price changes)
 */
export async function analyzePricingElasticity() {
  try {
    const { data: subscriptions } = await supabase
      .from('user_subscriptions')
      .select('tier, price, status, created_at, updated_at');

    const { data: cancellations } = await supabase
      .from('subscription_cancellation_reasons')
      .select('reason');

    const priceRelatedCancellations =
      cancellations?.filter((c) =>
        c.reason?.toLowerCase().includes('expensive')
      ).length || 0;

    const totalCancellations = cancellations?.length || 1;
    const priceElasticity = priceRelatedCancellations / totalCancellations;

    return {
      priceElasticity,
      recommendation:
        priceElasticity > 0.3 ? 'high_sensitivity' : 'low_sensitivity',
      priceSensitiveTiers: ['free', 'pro'],
    };
  } catch (error) {
    console.error('[PricingModel] Error analyzing elasticity:', error);
    return {
      priceElasticity: 0.2,
      recommendation: 'low_sensitivity',
      priceSensitiveTiers: [],
    };
  }
}

/**
 * Generate pricing recommendations based on data
 */
export async function generatePricingRecommendations(): Promise<PricingRecommendation> {
  try {
    const elasticity = await analyzePricingElasticity();
    const tierMetrics = await analyzeTierMetrics();

    let recommendedProPrice = 1299;
    let recommendedTeamBasePrice = 4990;
    let recommendedTeamSeatPrice = 999;
    let recommendedEnterpriseMinPrice = 30000;

    let explanation = 'Pricing recommendations based on current metrics:\n';
    let confidenceScore = 0.7;

    if (tierMetrics.pro.grossMargin > 85) {
      recommendedProPrice = 1499;
      explanation += '- Pro tier has high margin (>85%), recommend price increase to ₱1,499\n';
      confidenceScore += 0.1;
    }

    if (tierMetrics.pro.grossMargin < 70) {
      recommendedProPrice = 1599;
      explanation += '- Pro tier margin low (<70%), recommend price increase to ₱1,599\n';
    }

    if (elasticity.priceElasticity > 0.4) {
      recommendedProPrice = Math.max(1199, recommendedProPrice - 100);
      explanation += '- High price sensitivity detected, moderating price increase\n';
      confidenceScore -= 0.1;
    }

    if (tierMetrics.team.userCount < 10) {
      recommendedTeamBasePrice = 4490;
      explanation += '- Low Team adoption, recommend lower entry price: ₱4,490\n';
    }

    const recommendedEnergyPacks = [
      { energy: 100, price: 199 },
      { energy: 500, price: 899 },
      { energy: 1000, price: 1599 },
    ];

    const recommendedCoinPacks = [
      { coins: 100, price: 99 },
      { coins: 500, price: 449 },
      { coins: 1000, price: 799 },
    ];

    const recommendation: PricingRecommendation = {
      recommendedProPrice,
      recommendedTeamBasePrice,
      recommendedTeamSeatPrice,
      recommendedEnterpriseMinPrice,
      recommendedEnergyPacks,
      recommendedCoinPacks,
      explanation,
      confidenceScore: Math.min(1, Math.max(0, confidenceScore)),
    };

    await supabase.from('pricing_recommendations').insert({
      generated_at: new Date().toISOString(),
      recommended_pro_price: recommendedProPrice,
      recommended_team_base_price: recommendedTeamBasePrice,
      recommended_team_seat_price: recommendedTeamSeatPrice,
      recommended_enterprise_min_price: recommendedEnterpriseMinPrice,
      recommended_energy_pack_configs: recommendedEnergyPacks as any,
      recommended_coin_pack_configs: recommendedCoinPacks as any,
      explanation,
      confidence_score: recommendation.confidenceScore,
    });

    return recommendation;
  } catch (error) {
    console.error('[PricingModel] Error generating recommendations:', error);
    throw error;
  }
}

/**
 * Analyze metrics by tier
 */
async function analyzeTierMetrics() {
  try {
    const { data: tiers } = await supabase
      .from('tier_profitability_v2')
      .select('*')
      .order('period_start', { ascending: false })
      .limit(4);

    const metrics: Record<string, any> = {
      pro: { grossMargin: 80, userCount: 0 },
      team: { grossMargin: 80, userCount: 0 },
      enterprise: { grossMargin: 90, userCount: 0 },
    };

    tiers?.forEach((t) => {
      if (metrics[t.tier]) {
        metrics[t.tier].grossMargin = t.gross_margin;
        metrics[t.tier].userCount = t.active_users;
      }
    });

    return metrics;
  } catch (error) {
    console.error('[PricingModel] Error analyzing tier metrics:', error);
    return {
      pro: { grossMargin: 80, userCount: 0 },
      team: { grossMargin: 80, userCount: 0 },
      enterprise: { grossMargin: 90, userCount: 0 },
    };
  }
}

/**
 * Get latest pricing recommendations
 */
export async function getLatestPricingRecommendations() {
  try {
    const { data } = await supabase
      .from('pricing_recommendations')
      .select('*')
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return data;
  } catch (error) {
    console.error('[PricingModel] Error getting recommendations:', error);
    return null;
  }
}
