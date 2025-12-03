import { useState, useEffect } from 'react';
import { ArrowLeft, TrendingDown, DollarSign, Users, AlertCircle, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface CancellationAnalyticsPageProps {
  onBack: () => void;
}

interface CancellationReason {
  id: string;
  user_id: string;
  subscription_tier: string;
  reason_primary: string;
  additional_feedback: string;
  contact_back: boolean;
  usage_scans: number;
  usage_messages: number;
  company_name: string;
  created_at: string;
}

interface Stats {
  totalCancellations: number;
  thisMonth: number;
  revenueLost: number;
  topReason: string;
  topReasonCount: number;
}

export default function CancellationAnalyticsPage({ onBack }: CancellationAnalyticsPageProps) {
  const [cancellations, setCancellations] = useState<CancellationReason[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalCancellations: 0,
    thisMonth: 0,
    revenueLost: 0,
    topReason: '',
    topReasonCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    loadData();
  }, [timeFilter]);

  const loadData = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('subscription_cancellation_reasons')
        .select('*')
        .order('created_at', { ascending: false });

      if (timeFilter !== 'all') {
        const days = parseInt(timeFilter);
        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - days);
        query = query.gte('created_at', dateFrom.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      setCancellations(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error loading cancellation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: CancellationReason[]) => {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const thisMonthCancellations = data.filter(
      c => new Date(c.created_at) >= thisMonthStart
    );

    const reasonCounts: Record<string, number> = {};
    data.forEach(c => {
      reasonCounts[c.reason_primary] = (reasonCounts[c.reason_primary] || 0) + 1;
    });

    const topReason = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0] || ['N/A', 0];

    const tierPrices: Record<string, number> = {
      pro: 249,
      elite: 499,
      team: 1990,
      enterprise: 4990
    };

    const revenueLost = thisMonthCancellations.reduce((sum, c) => {
      return sum + (tierPrices[c.subscription_tier] || 0);
    }, 0);

    setStats({
      totalCancellations: data.length,
      thisMonth: thisMonthCancellations.length,
      revenueLost,
      topReason: formatReason(topReason[0]),
      topReasonCount: topReason[1]
    });
  };

  const formatReason = (reason: string): string => {
    return reason
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getReasonDistribution = () => {
    const distribution: Record<string, number> = {};
    cancellations.forEach(c => {
      const formatted = formatReason(c.reason_primary);
      distribution[formatted] = (distribution[formatted] || 0) + 1;
    });
    return Object.entries(distribution).sort((a, b) => b[1] - a[1]);
  };

  const getTierDistribution = () => {
    const distribution: Record<string, number> = {};
    cancellations.forEach(c => {
      const tier = c.subscription_tier.charAt(0).toUpperCase() + c.subscription_tier.slice(1);
      distribution[tier] = (distribution[tier] || 0) + 1;
    });
    return Object.entries(distribution).sort((a, b) => b[1] - a[1]);
  };

  const reasonDistribution = getReasonDistribution();
  const tierDistribution = getTierDistribution();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Dashboard</span>
          </button>
          <h1 className="text-xl font-bold text-gray-900">Cancellation Analytics</h1>
          <div className="w-32"></div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Time Filter */}
        <div className="flex gap-2">
          {[
            { value: '7d', label: 'Last 7 Days' },
            { value: '30d', label: 'Last 30 Days' },
            { value: '90d', label: 'Last 90 Days' },
            { value: 'all', label: 'All Time' }
          ].map(filter => (
            <button
              key={filter.value}
              onClick={() => setTimeFilter(filter.value as any)}
              className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
                timeFilter === filter.value
                  ? 'bg-[#1877F2] text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <TrendingDown className="w-8 h-8 text-red-600" />
              <span className="text-2xl font-bold text-gray-900">{stats.thisMonth}</span>
            </div>
            <div className="text-sm text-gray-600">Cancellations This Month</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-orange-600" />
              <span className="text-2xl font-bold text-gray-900">₱{stats.revenueLost.toLocaleString()}</span>
            </div>
            <div className="text-sm text-gray-600">Revenue Lost (Monthly)</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="w-8 h-8 text-purple-600" />
              <span className="text-sm font-bold text-gray-900 truncate">{stats.topReason}</span>
            </div>
            <div className="text-sm text-gray-600">Top Cancel Reason ({stats.topReasonCount}x)</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">{stats.totalCancellations}</span>
            </div>
            <div className="text-sm text-gray-600">Total Cancellations</div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Reason Distribution */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-6">
              <PieChartIcon className="w-5 h-5 text-[#1877F2]" />
              <h3 className="font-bold text-lg text-gray-900">Cancel Reasons</h3>
            </div>
            <div className="space-y-3">
              {reasonDistribution.map(([reason, count], idx) => {
                const percentage = ((count / cancellations.length) * 100).toFixed(1);
                const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-blue-500', 'bg-green-500', 'bg-gray-500'];
                return (
                  <div key={reason}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{reason}</span>
                      <span className="text-sm font-bold text-gray-900">{count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${colors[idx % colors.length]}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tier Distribution */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-[#1877F2]" />
              <h3 className="font-bold text-lg text-gray-900">Cancellations by Tier</h3>
            </div>
            <div className="space-y-3">
              {tierDistribution.map(([tier, count]) => {
                const percentage = ((count / cancellations.length) * 100).toFixed(1);
                const tierColors: Record<string, string> = {
                  Pro: 'bg-blue-500',
                  Elite: 'bg-purple-500',
                  Team: 'bg-green-500',
                  Enterprise: 'bg-amber-500'
                };
                return (
                  <div key={tier}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{tier}</span>
                      <span className="text-sm font-bold text-gray-900">{count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${tierColors[tier] || 'bg-gray-500'}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Detailed Table */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
          <h3 className="font-bold text-lg text-gray-900 mb-4">Recent Cancellations</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Tier</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Reason</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Feedback</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Contact</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Usage</th>
                </tr>
              </thead>
              <tbody>
                {cancellations.slice(0, 20).map(cancellation => (
                  <tr key={cancellation.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(cancellation.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                        {cancellation.subscription_tier}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {formatReason(cancellation.reason_primary)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">
                      {cancellation.additional_feedback || '-'}
                    </td>
                    <td className="py-3 px-4">
                      {cancellation.contact_back ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                          Yes
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">No</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {cancellation.usage_scans}S / {cancellation.usage_messages}M
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
