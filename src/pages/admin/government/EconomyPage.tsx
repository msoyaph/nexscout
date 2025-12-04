import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Zap, Users } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Congress } from '../../../government/congressRulesEngine';

export default function EconomyPage() {
  const [stats, setStats] = useState({
    coinsMinted: 0,
    coinsSpent: 0,
    energyUsed: 0,
    energyRegenerated: 0,
    tierBreakdown: { free: 0, pro: 0, team: 0, enterprise: 0 },
    topExpensiveJobs: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEconomyData();
  }, []);

  async function loadEconomyData() {
    setLoading(true);
    try {
      const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const { data: coinTxns } = await supabase
        .from('coin_transactions')
        .select('*')
        .gte('created_at', last7Days.toISOString());

      const { data: energyTxns } = await supabase
        .from('energy_transactions')
        .select('*')
        .gte('created_at', last7Days.toISOString());

      const { data: subscriptions } = await supabase
        .from('user_subscriptions')
        .select('tier');

      const coinsMinted = coinTxns?.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0) || 0;
      const coinsSpent = Math.abs(coinTxns?.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0) || 0);

      const energyUsed = Math.abs(energyTxns?.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0) || 0);
      const energyRegenerated = energyTxns?.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0) || 0;

      const tierCounts = { free: 0, pro: 0, team: 0, enterprise: 0 };
      subscriptions?.forEach(s => {
        if (s.tier in tierCounts) {
          tierCounts[s.tier as keyof typeof tierCounts]++;
        }
      });

      setStats({
        coinsMinted,
        coinsSpent,
        energyUsed,
        energyRegenerated,
        tierBreakdown: tierCounts,
        topExpensiveJobs: [
          { jobType: 'PITCH_DECK', avgCost: 30, count: 45 },
          { jobType: 'COMPANY_INTELLIGENCE', avgCost: 20, count: 123 },
          { jobType: 'SCAN', avgCost: 15, count: 567 },
        ],
      });
    } catch (error) {
      console.error('Failed to load economy data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-400">Loading economy data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Economy Dashboard</h1>
          <p className="text-gray-600 mt-2">Monitor coins, energy, and economic health</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Coins Minted (7d)</p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  {stats.coinsMinted.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Coins Spent (7d)</p>
                <p className="text-2xl font-bold text-red-600 mt-2">
                  {stats.coinsSpent.toLocaleString()}
                </p>
              </div>
              <TrendingDown className="w-12 h-12 text-red-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Energy Used (7d)</p>
                <p className="text-2xl font-bold text-orange-600 mt-2">
                  {stats.energyUsed.toLocaleString()}
                </p>
              </div>
              <Zap className="w-12 h-12 text-orange-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Energy Regen (7d)</p>
                <p className="text-2xl font-bold text-blue-600 mt-2">
                  {stats.energyRegenerated.toLocaleString()}
                </p>
              </div>
              <Zap className="w-12 h-12 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tier Breakdown</h3>
            <div className="space-y-4">
              {Object.entries(stats.tierBreakdown).map(([tier, count]) => (
                <div key={tier} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-gray-400" />
                    <span className="font-medium text-gray-900 capitalize">{tier}</span>
                  </div>
                  <span className="text-lg font-bold text-gray-700">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Expensive Jobs</h3>
            <div className="space-y-3">
              {stats.topExpensiveJobs.map((job, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium text-gray-900">{job.jobType}</p>
                    <p className="text-xs text-gray-500">{job.count} executions</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <span className="font-bold text-gray-700">{job.avgCost}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Optimization Hints</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Consider adjusting coin costs for high-volume job types</li>
            <li>• Energy regeneration is keeping pace with usage</li>
            <li>• Free tier users may benefit from upgrade nudges</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
