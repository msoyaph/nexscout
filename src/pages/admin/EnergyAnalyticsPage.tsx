import { useState, useEffect } from 'react';
import { ArrowLeft, Battery, TrendingUp, Users, Zap, Clock, DollarSign, Activity } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface EnergyAnalyticsPageProps {
  onBack: () => void;
}

interface EnergyStats {
  totalEnergyConsumed: number;
  averagePerUser: number;
  peakHour: string;
  topFeature: string;
  conversionRate: number;
  usersNeedingUpgrade: number;
}

export default function EnergyAnalyticsPage({ onBack }: EnergyAnalyticsPageProps) {
  const [stats, setStats] = useState<EnergyStats>({
    totalEnergyConsumed: 0,
    averagePerUser: 0,
    peakHour: '0',
    topFeature: 'N/A',
    conversionRate: 0,
    usersNeedingUpgrade: 0
  });
  const [loading, setLoading] = useState(true);
  const [featureBreakdown, setFeatureBreakdown] = useState<any[]>([]);
  const [tierBreakdown, setTierBreakdown] = useState<any[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadEnergyStats(),
        loadFeatureBreakdown(),
        loadTierBreakdown()
      ]);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEnergyStats = async () => {
    // Total energy consumed today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: transactions } = await supabase
      .from('energy_transactions')
      .select('energy_change, metadata')
      .eq('event_type', 'action_cost')
      .gte('created_at', today.toISOString());

    const totalConsumed = transactions?.reduce((sum, t) => sum + Math.abs(t.energy_change), 0) || 0;
    const uniqueUsers = new Set(transactions?.map(t => t.metadata?.user_id)).size;

    // Users hitting limits
    const { data: energyData } = await supabase
      .from('user_energy')
      .select('current_energy, max_energy, tier')
      .lte('current_energy', 2);

    const needsUpgrade = energyData?.filter(e => e.tier === 'free').length || 0;

    // Peak hour
    const hourCounts: Record<number, number> = {};
    transactions?.forEach(t => {
      const hour = new Date(t.metadata?.timestamp || Date.now()).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    const peakHour = Object.entries(hourCounts).sort(([,a], [,b]) => b - a)[0]?.[0] || '0';

    setStats({
      totalEnergyConsumed: totalConsumed,
      averagePerUser: uniqueUsers > 0 ? totalConsumed / uniqueUsers : 0,
      peakHour: `${peakHour}:00`,
      topFeature: 'ai_message',
      conversionRate: 0,
      usersNeedingUpgrade: needsUpgrade
    });
  };

  const loadFeatureBreakdown = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: transactions } = await supabase
      .from('energy_transactions')
      .select('energy_change, reason, metadata')
      .eq('event_type', 'action_cost')
      .gte('created_at', today.toISOString());

    const featureCounts: Record<string, { count: number; energy: number }> = {};

    transactions?.forEach(t => {
      const feature = t.metadata?.feature || 'unknown';
      if (!featureCounts[feature]) {
        featureCounts[feature] = { count: 0, energy: 0 };
      }
      featureCounts[feature].count++;
      featureCounts[feature].energy += Math.abs(t.energy_change);
    });

    const breakdown = Object.entries(featureCounts)
      .map(([feature, data]) => ({
        feature,
        count: data.count,
        energy: data.energy
      }))
      .sort((a, b) => b.count - a.count);

    setFeatureBreakdown(breakdown);
  };

  const loadTierBreakdown = async () => {
    const { data: energyData } = await supabase
      .from('user_energy')
      .select('tier, current_energy, max_energy');

    const tierStats: Record<string, { count: number; avgEnergy: number; totalMax: number }> = {};

    energyData?.forEach(e => {
      if (!tierStats[e.tier]) {
        tierStats[e.tier] = { count: 0, avgEnergy: 0, totalMax: 0 };
      }
      tierStats[e.tier].count++;
      tierStats[e.tier].avgEnergy += e.current_energy;
      tierStats[e.tier].totalMax += e.max_energy;
    });

    const breakdown = Object.entries(tierStats).map(([tier, data]) => ({
      tier,
      count: data.count,
      avgEnergy: data.count > 0 ? data.avgEnergy / data.count : 0,
      maxEnergy: data.count > 0 ? data.totalMax / data.count : 0
    }));

    setTierBreakdown(breakdown);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Energy Analytics</h1>
              <p className="text-sm text-gray-600">Monitor AI usage and energy consumption</p>
            </div>
          </div>
          <button
            onClick={loadAnalytics}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Zap className="w-6 h-6" />}
            title="Total Energy Used"
            value={stats.totalEnergyConsumed.toFixed(0)}
            subtitle="Today"
            color="blue"
          />
          <StatCard
            icon={<Users className="w-6 h-6" />}
            title="Avg Per User"
            value={stats.averagePerUser.toFixed(1)}
            subtitle="Energy/user"
            color="green"
          />
          <StatCard
            icon={<Clock className="w-6 h-6" />}
            title="Peak Hour"
            value={stats.peakHour}
            subtitle="Most activity"
            color="purple"
          />
          <StatCard
            icon={<TrendingUp className="w-6 h-6" />}
            title="Need Upgrade"
            value={stats.usersNeedingUpgrade.toString()}
            subtitle="Free users low on energy"
            color="orange"
          />
        </div>

        {/* Feature Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Feature Usage Breakdown</h2>
          <div className="space-y-3">
            {featureBreakdown.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{item.feature}</div>
                    <div className="text-sm text-gray-600">{item.count} uses</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-blue-600">{item.energy} ⚡</div>
                  <div className="text-xs text-gray-500">Total energy</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tier Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Energy by Subscription Tier</h2>
          <div className="space-y-3">
            {tierBreakdown.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    item.tier === 'free' ? 'bg-gray-200' :
                    item.tier === 'pro' ? 'bg-blue-200' :
                    item.tier === 'pro' ? 'bg-purple-200' :
                    'bg-green-200'
                  }`}>
                    <Battery className={`w-5 h-5 ${
                      item.tier === 'free' ? 'text-gray-600' :
                      item.tier === 'pro' ? 'text-blue-600' :
                      item.tier === 'pro' ? 'text-purple-600' :
                      'text-green-600'
                    }`} />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 capitalize">{item.tier}</div>
                    <div className="text-sm text-gray-600">{item.count} users</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">{item.avgEnergy.toFixed(1)} / {item.maxEnergy}</div>
                  <div className="text-xs text-gray-500">Avg energy</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  subtitle,
  color
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600'
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center`}>
          {icon}
        </div>
        <div className="text-sm font-medium text-gray-600">{title}</div>
      </div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500 mt-1">{subtitle}</div>
    </div>
  );
}
