/**
 * Energy/Coin Revenue Forecasting Engine
 * Predicts future economy revenue using historical data
 */

import { supabase } from '../../lib/supabase';

export interface RevenueForecast {
  dates: string[];
  energyRevenue: number[];
  coinRevenue: number[];
  subscriptionRevenue: number[];
  totalRevenue: number[];
}

export interface ForecastAssumptions {
  monthlyUserGrowth?: number;
  energyPriceAdjustment?: number;
  coinPriceAdjustment?: number;
}

/**
 * Generate energy and coin revenue forecast
 */
export async function generateEnergyCoinForecast(
  horizonDays: number = 30,
  assumptions?: ForecastAssumptions
): Promise<RevenueForecast> {
  try {
    const historical = await getHistoricalRevenue(90);

    const userGrowthRate = assumptions?.monthlyUserGrowth || 0.05;
    const energyPriceMultiplier = 1 + (assumptions?.energyPriceAdjustment || 0);
    const coinPriceMultiplier = 1 + (assumptions?.coinPriceAdjustment || 0);

    const avgEnergyRevenue = calculateAverage(historical.energy);
    const avgCoinRevenue = calculateAverage(historical.coins);
    const avgSubscriptionRevenue = calculateAverage(historical.subscriptions);

    const forecast: RevenueForecast = {
      dates: [],
      energyRevenue: [],
      coinRevenue: [],
      subscriptionRevenue: [],
      totalRevenue: [],
    };

    for (let day = 1; day <= horizonDays; day++) {
      const date = new Date(Date.now() + day * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const growthFactor = Math.pow(1 + userGrowthRate, day / 30);

      const energyRev = avgEnergyRevenue * growthFactor * energyPriceMultiplier;
      const coinRev = avgCoinRevenue * growthFactor * coinPriceMultiplier;
      const subRev = avgSubscriptionRevenue * growthFactor;

      forecast.dates.push(date);
      forecast.energyRevenue.push(energyRev);
      forecast.coinRevenue.push(coinRev);
      forecast.subscriptionRevenue.push(subRev);
      forecast.totalRevenue.push(energyRev + coinRev + subRev);
    }

    await supabase.from('energy_coin_revenue_forecasts').upsert({
      forecast_date: new Date().toISOString().split('T')[0],
      horizon_days: horizonDays,
      forecast_energy_revenue: forecast.energyRevenue[horizonDays - 1],
      forecast_coin_revenue: forecast.coinRevenue[horizonDays - 1],
      forecast_subscription_revenue: forecast.subscriptionRevenue[horizonDays - 1],
      forecast_total_revenue: forecast.totalRevenue[horizonDays - 1],
      method: 'moving_average',
      assumptions: assumptions as any,
    });

    return forecast;
  } catch (error) {
    console.error('[Forecast] Error generating forecast:', error);
    throw error;
  }
}

/**
 * Get historical revenue data
 */
async function getHistoricalRevenue(days: number) {
  try {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const { data: snapshots } = await supabase
      .from('profit_snapshots')
      .select('energy_revenue, coin_revenue, subscription_revenue')
      .gte('snapshot_date', since)
      .order('snapshot_date');

    return {
      energy: snapshots?.map((s) => s.energy_revenue) || [],
      coins: snapshots?.map((s) => s.coin_revenue) || [],
      subscriptions: snapshots?.map((s) => s.subscription_revenue) || [],
    };
  } catch (error) {
    console.error('[Forecast] Error getting historical revenue:', error);
    return { energy: [], coins: [], subscriptions: [] };
  }
}

/**
 * Calculate average from array
 */
function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Get forecast summary for a specific horizon
 */
export async function getForecastSummary(horizonDays: number = 30) {
  try {
    const { data } = await supabase
      .from('energy_coin_revenue_forecasts')
      .select('*')
      .eq('horizon_days', horizonDays)
      .order('forecast_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    return data;
  } catch (error) {
    console.error('[Forecast] Error getting forecast summary:', error);
    return null;
  }
}
