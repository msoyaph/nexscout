import { useState, useEffect } from 'react';
import {
  TrendingUp, Users, DollarSign, Activity, AlertTriangle,
  Zap, Target, TrendingDown, CheckCircle, XCircle,
  BarChart3, PieChart, LineChart, Sparkles
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface DashboardMetrics {
  dau: number;
  wau: number;
  mau: number;
  newUsers: number;
  activeUsers: number;
  conversionRate: number;
  churnRate: number;
  mrr: number;
  upgradesToday: number;
  churnedToday: number;
}

interface Insight {
  id: string;
  insight_type: string;
  title: string;
  description: string;
  insight_text: string;
  impact_score: number;
  confidence_score: number;
  severity_level: string;
  recommended_actions: string[];
  created_at: string;
}

export default function AnalyticsIntelligenceDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'funnels' | 'cohorts' | 'insights'>('overview');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadMetrics(),
        loadInsights(),
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async () => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Get today's summary
    const { data: todaySummary } = await supabase
      .from('analytics_daily_summary')
      .select('*')
      .eq('date', today)
      .single();

    // Calculate DAU (last 24h active users)
    const { count: dau } = await supabase
      .from('analytics_events')
      .select('user_id', { count: 'exact', head: true })
      .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    // Calculate WAU (last 7 days active users)
    const { count: wau } = await supabase
      .from('analytics_events')
      .select('user_id', { count: 'exact', head: true })
      .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    // Calculate MAU (last 30 days active users)
    const { count: mau } = await supabase
      .from('analytics_events')
      .select('user_id', { count: 'exact', head: true })
      .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    setMetrics({
      dau: dau || 0,
      wau: wau || 0,
      mau: mau || 0,
      newUsers: todaySummary?.new_users || 0,
      activeUsers: todaySummary?.active_users || 0,
      conversionRate: todaySummary?.upgrades || 0,
      churnRate: todaySummary?.cancellations || 0,
      mrr: todaySummary?.revenue_php || 0,
      upgradesToday: todaySummary?.upgrades || 0,
      churnedToday: todaySummary?.cancellations || 0,
    });
  };

  const loadInsights = async () => {
    const { data } = await supabase
      .from('analytics_insights')
      .select('*')
      .eq('acknowledged', false)
      .order('impact_score', { ascending: false })
      .limit(10);

    setInsights(data || []);
  };

  const acknowledgeInsight = async (insightId: string) => {
    await supabase
      .from('analytics_insights')
      .update({ acknowledged: true, acknowledged_at: new Date().toISOString() })
      .eq('id', insightId);

    loadInsights();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getImpactColor = (score: number) => {
    if (score >= 80) return 'text-red-600';
    if (score >= 60) return 'text-orange-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-blue-600';
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
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-purple-600" />
                Analytics Intelligence Engine
              </h1>
              <p className="text-gray-600 mt-1">
                AI-powered insights and predictive analytics
              </p>
            </div>
            <button
              onClick={loadDashboardData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Activity className="w-4 h-4" />
              Refresh Data
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-6 border-b border-gray-200">
            {['overview', 'funnels', 'cohorts', 'insights'].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab as any)}
                className={`px-4 py-2 font-medium capitalize transition-colors ${
                  selectedTab === tab
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <>
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* DAU/MAU */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900">{metrics?.dau || 0}</div>
                <div className="text-sm text-gray-600 mt-1">Daily Active Users</div>
                <div className="text-xs text-gray-500 mt-2">
                  WAU: {metrics?.wau || 0} | MAU: {metrics?.mau || 0}
                </div>
              </div>

              {/* New Users */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900">{metrics?.newUsers || 0}</div>
                <div className="text-sm text-gray-600 mt-1">New Users Today</div>
                <div className="text-xs text-gray-500 mt-2">
                  Active: {metrics?.activeUsers || 0}
                </div>
              </div>

              {/* Conversion Rate */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Target className="w-6 h-6 text-purple-600" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {metrics?.conversionRate || 0}
                </div>
                <div className="text-sm text-gray-600 mt-1">Upgrades Today</div>
                <div className="text-xs text-gray-500 mt-2">
                  Free → Paid Conversions
                </div>
              </div>

              {/* MRR */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-yellow-600" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  ₱{(metrics?.mrr || 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 mt-1">Revenue Today</div>
                <div className="text-xs text-gray-500 mt-2">
                  Monthly Recurring Revenue
                </div>
              </div>
            </div>

            {/* Risk Alerts */}
            {metrics && metrics.churnedToday > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
                <div className="flex items-start gap-4">
                  <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-red-900 text-lg">
                      Churn Alert: {metrics.churnedToday} cancellations today
                    </h3>
                    <p className="text-red-700 mt-1">
                      Check prediction engine for at-risk users and trigger retention campaigns.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Top Insights */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Zap className="w-6 h-6 text-purple-600" />
                  AI-Generated Insights
                </h2>
                <span className="text-sm text-gray-600">
                  {insights.length} actionable insights
                </span>
              </div>

              {insights.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No insights yet. Run analysis to generate insights.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {insights.map((insight) => (
                    <div
                      key={insight.id}
                      className={`border rounded-lg p-5 ${getSeverityColor(insight.severity_level)}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-1 bg-white bg-opacity-50 rounded text-xs font-medium uppercase">
                              {insight.insight_type}
                            </span>
                            <span className={`text-2xl font-bold ${getImpactColor(insight.impact_score)}`}>
                              {insight.impact_score}
                            </span>
                            <span className="text-xs text-gray-600">
                              {Math.round(insight.confidence_score * 100)}% confidence
                            </span>
                          </div>
                          <h3 className="font-bold text-lg">{insight.title}</h3>
                          <p className="text-sm mt-1">{insight.insight_text}</p>
                        </div>
                        <button
                          onClick={() => acknowledgeInsight(insight.id)}
                          className="ml-4 p-2 hover:bg-white hover:bg-opacity-50 rounded-lg transition-colors"
                          title="Acknowledge insight"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      </div>

                      {insight.recommended_actions.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-current border-opacity-20">
                          <div className="text-xs font-semibold mb-2">RECOMMENDED ACTIONS:</div>
                          <ul className="space-y-1">
                            {insight.recommended_actions.map((action, idx) => (
                              <li key={idx} className="text-xs flex items-start gap-2">
                                <span className="text-current">•</span>
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Funnels Tab */}
        {selectedTab === 'funnels' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Funnel Analysis</h2>
            <div className="text-center py-12 text-gray-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Funnel visualizations coming soon...</p>
            </div>
          </div>
        )}

        {/* Cohorts Tab */}
        {selectedTab === 'cohorts' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Cohort Analysis</h2>
            <div className="text-center py-12 text-gray-500">
              <PieChart className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Cohort retention heatmaps coming soon...</p>
            </div>
          </div>
        )}

        {/* Insights Tab */}
        {selectedTab === 'insights' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">All Insights</h2>
            <div className="text-center py-12 text-gray-500">
              <LineChart className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Detailed insights view coming soon...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
