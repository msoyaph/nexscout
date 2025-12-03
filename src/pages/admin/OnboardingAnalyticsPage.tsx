import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  BarChart3,
  TrendingUp,
  Users,
  Target,
  RefreshCw
} from 'lucide-react';

interface StepCompletion {
  step_id: string;
  sequence_key: string;
  ab_group: string | null;
  day_number: number;
  scenario_id: string;
  users_targeted: number;
  messages_sent: number;
  messages_skipped: number;
  messages_failed: number;
  users_reached: number;
  send_success_rate: number;
}

interface ABTestPerformance {
  sequence_id: string;
  sequence_key: string;
  name: string;
  ab_group: string | null;
  total_users_assigned: number;
  users_engaged: number;
  total_messages_sent: number;
  total_messages_skipped: number;
  total_messages_failed: number;
  engagement_rate: number;
  avg_hours_to_first_message: number;
}

interface FirstWinFunnel {
  user_id: string;
  funnel_stage: string;
}

interface DailyMetrics {
  signup_date: string;
  total_signups: number;
  completed_company_setup: number;
  completed_product_setup: number;
  activated_chatbot: number;
  completed_first_scan: number;
  achieved_first_win: number;
  company_setup_rate: number;
  first_win_rate: number;
}

export default function OnboardingAnalyticsPage() {
  const [stepStats, setStepStats] = useState<StepCompletion[]>([]);
  const [abStats, setAbStats] = useState<ABTestPerformance[]>([]);
  const [funnelData, setFunnelData] = useState<Record<string, number>>({});
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    setLoading(true);

    try {
      const [stepsRes, abRes, funnelRes, dailyRes] = await Promise.all([
        supabase.from('onboarding_step_completion').select('*'),
        supabase.from('onboarding_ab_test_performance').select('*'),
        supabase.from('first_win_funnel').select('funnel_stage'),
        supabase.from('onboarding_daily_metrics').select('*').limit(30)
      ]);

      setStepStats(stepsRes.data || []);
      setAbStats(abRes.data || []);

      const funnelCounts: Record<string, number> = {};
      (funnelRes.data || []).forEach((row: FirstWinFunnel) => {
        funnelCounts[row.funnel_stage] =
          (funnelCounts[row.funnel_stage] || 0) + 1;
      });
      setFunnelData(funnelCounts);

      setDailyMetrics(dailyRes.data || []);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  async function refreshViews() {
    setRefreshing(true);
    try {
      await supabase.rpc('refresh_onboarding_analytics');
      await loadAnalytics();
    } catch (error) {
      console.error('Error refreshing views:', error);
    } finally {
      setRefreshing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const funnelStages = [
    'signup_only',
    'company_setup',
    'product_setup',
    'chatbot_activated',
    'first_scan',
    'first_chat',
    'first_appointment',
    'first_sale'
  ];

  const totalRecentSignups = dailyMetrics.reduce(
    (sum, day) => sum + day.total_signups,
    0
  );
  const avgCompanySetupRate =
    dailyMetrics.reduce((sum, day) => sum + day.company_setup_rate, 0) /
    (dailyMetrics.length || 1);
  const avgFirstWinRate =
    dailyMetrics.reduce((sum, day) => sum + day.first_win_rate, 0) /
    (dailyMetrics.length || 1);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Onboarding Analytics
            </h1>
            <p className="text-gray-600 mt-1">
              Performance metrics for all onboarding sequences
            </p>
          </div>
          <button
            onClick={refreshViews}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
            />
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Recent Signups</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {totalRecentSignups}
                </p>
                <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Setup Rate</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {avgCompanySetupRate.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">Company setup</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Target className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg First Win Rate</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {avgFirstWinRate.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">Activation goal</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Sequences</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {abStats.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Running now</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <BarChart3 className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            First Win Funnel
          </h2>
          <div className="space-y-3">
            {funnelStages.map((stage, index) => {
              const count = funnelData[stage] || 0;
              const maxCount = Math.max(...Object.values(funnelData));
              const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;

              return (
                <div key={stage} className="flex items-center gap-4">
                  <div className="w-40 text-sm font-medium text-gray-700">
                    {stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-8 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-end pr-3 text-white text-sm font-semibold transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    >
                      {count > 0 && count}
                    </div>
                  </div>
                  <div className="w-20 text-right text-sm text-gray-600">
                    {percentage.toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            A/B Test Performance
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sequence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Group
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Engaged
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Engagement Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Time to 1st Msg
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {abStats.map(seq => (
                  <tr key={seq.sequence_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {seq.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          seq.ab_group === 'A'
                            ? 'bg-blue-100 text-blue-800'
                            : seq.ab_group === 'B'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {seq.ab_group || 'Control'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {seq.total_users_assigned}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {seq.users_engaged}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="font-semibold text-gray-900">
                        {seq.engagement_rate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {seq.avg_hours_to_first_message
                        ? `${seq.avg_hours_to_first_message}h`
                        : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Step Completion Rates
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Day
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scenario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sequence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Users Targeted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Messages Sent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Success Rate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stepStats
                  .sort((a, b) => a.day_number - b.day_number)
                  .map(step => (
                    <tr key={step.step_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Day {step.day_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {step.scenario_id.replace(/_/g, ' ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="text-xs">{step.sequence_key}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {step.users_targeted}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {step.messages_sent}
                        {step.messages_skipped > 0 && (
                          <span className="text-yellow-600 ml-1">
                            ({step.messages_skipped} skipped)
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span
                          className={`font-semibold ${
                            step.send_success_rate >= 80
                              ? 'text-green-600'
                              : step.send_success_rate >= 60
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}
                        >
                          {step.send_success_rate}%
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
