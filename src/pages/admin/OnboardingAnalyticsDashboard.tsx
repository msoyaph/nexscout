/**
 * Onboarding Analytics Dashboard (Admin Only)
 * 
 * Displays user activation funnel, completion rates, aha moments, and industry breakdowns
 */

import { useState, useEffect } from 'react';
import { ArrowLeft, Users, TrendingUp, Zap, Clock, Award, BarChart3, PieChart } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface FunnelStats {
  total_signups: number;
  wizard_started: number;
  wizard_completed: number;
  first_lead: number;
  first_followup: number;
  quick_win_achieved: number;
}

interface IndustryStats {
  industry: string;
  signups: number;
  completion_rate: number;
  avg_ttv_seconds: number;
  aha_moments_avg: number;
}

interface AhaMomentStats {
  moment_type: string;
  trigger_count: number;
  avg_time_to_trigger_minutes: number;
  xp_awarded_total: number;
}

export default function OnboardingAnalyticsDashboard({ onBack }: { onBack?: () => void }) {
  const [loading, setLoading] = useState(true);
  const [funnelStats, setFunnelStats] = useState<FunnelStats | null>(null);
  const [industryStats, setIndustryStats] = useState<IndustryStats[]>([]);
  const [ahaStats, setAhaStats] = useState<AhaMomentStats[]>([]);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);

    try {
      // Calculate date range
      const startDate = new Date();
      if (timeRange === '7d') startDate.setDate(startDate.getDate() - 7);
      else if (timeRange === '30d') startDate.setDate(startDate.getDate() - 30);
      else startDate.setFullYear(2020); // All time

      // Load funnel stats
      await loadFunnelStats(startDate);
      
      // Load industry breakdown
      await loadIndustryStats(startDate);
      
      // Load aha moment stats
      await loadAhaMomentStats(startDate);

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFunnelStats = async (startDate: Date) => {
    // Get all users who signed up
    const { data: users } = await supabase
      .from('profiles')
      .select('id, created_at')
      .gte('created_at', startDate.toISOString());

    const totalSignups = users?.length || 0;

    // Get wizard starts
    const { data: wizardSessions } = await supabase
      .from('onboarding_sessions')
      .select('user_id')
      .gte('session_start', startDate.toISOString());

    const wizardStarted = wizardSessions?.length || 0;

    // Get wizard completions
    const { data: completed } = await supabase
      .from('onboarding_sessions')
      .select('user_id')
      .eq('completed', true)
      .gte('session_start', startDate.toISOString());

    const wizardCompleted = completed?.length || 0;

    // Get first lead captured
    const { data: firstLeads } = await supabase
      .from('user_aha_moments')
      .select('user_id, aha_moments!inner(trigger_event)')
      .eq('aha_moments.trigger_event', 'lead_captured')
      .gte('achieved_at', startDate.toISOString());

    const firstLead = firstLeads?.length || 0;

    // Get first followup
    const { data: firstFollowups } = await supabase
      .from('user_aha_moments')
      .select('user_id, aha_moments!inner(trigger_event)')
      .eq('aha_moments.trigger_event', 'auto_followup')
      .gte('achieved_at', startDate.toISOString());

    const firstFollowup = firstFollowups?.length || 0;

    // Get quick win achieved
    const { data: quickWins } = await supabase
      .from('onboarding_progress')
      .select('user_id')
      .eq('quick_win', true)
      .gte('created_at', startDate.toISOString());

    const quickWinAchieved = quickWins?.length || 0;

    setFunnelStats({
      total_signups: totalSignups,
      wizard_started: wizardStarted,
      wizard_completed: wizardCompleted,
      first_lead: firstLead,
      first_followup: firstFollowup,
      quick_win_achieved: quickWinAchieved,
    });
  };

  const loadIndustryStats = async (startDate: Date) => {
    const { data: sessions } = await supabase
      .from('onboarding_sessions')
      .select('industry_selected, completed, time_to_completion_seconds, user_id')
      .gte('session_start', startDate.toISOString());

    if (!sessions) {
      setIndustryStats([]);
      return;
    }

    // Group by industry
    const industryGroups: Record<string, any[]> = {};
    sessions.forEach(s => {
      const industry = s.industry_selected || 'unknown';
      if (!industryGroups[industry]) industryGroups[industry] = [];
      industryGroups[industry].push(s);
    });

    // Calculate stats per industry
    const stats: IndustryStats[] = [];
    
    for (const [industry, sessions] of Object.entries(industryGroups)) {
      const signups = sessions.length;
      const completed = sessions.filter(s => s.completed).length;
      const completionRate = Math.round((completed / signups) * 100);
      
      const ttvValues = sessions
        .filter(s => s.time_to_completion_seconds)
        .map(s => s.time_to_completion_seconds);
      const avgTtv = ttvValues.length > 0
        ? Math.round(ttvValues.reduce((a, b) => a + b, 0) / ttvValues.length)
        : 0;

      // Get aha moments count per industry
      const userIds = sessions.map(s => s.user_id);
      const { data: ahaData } = await supabase
        .from('user_aha_moments')
        .select('user_id')
        .in('user_id', userIds);

      const ahaCount = ahaData?.length || 0;
      const ahaAvg = signups > 0 ? parseFloat((ahaCount / signups).toFixed(1)) : 0;

      stats.push({
        industry,
        signups,
        completion_rate: completionRate,
        avg_ttv_seconds: avgTtv,
        aha_moments_avg: ahaAvg
      });
    }

    setIndustryStats(stats.sort((a, b) => b.signups - a.signups));
  };

  const loadAhaMomentStats = async (startDate: Date) => {
    const { data: moments } = await supabase
      .from('user_aha_moments')
      .select(`
        minutes_from_signup,
        xp_awarded,
        aha_moments!inner(trigger_event, name)
      `)
      .gte('achieved_at', startDate.toISOString());

    if (!moments) {
      setAhaStats([]);
      return;
    }

    // Group by moment type
    const momentGroups: Record<string, any[]> = {};
    moments.forEach(m => {
      const type = (m as any).aha_moments.trigger_event || 'unknown';
      if (!momentGroups[type]) momentGroups[type] = [];
      momentGroups[type].push(m);
    });

    const stats: AhaMomentStats[] = [];
    
    for (const [type, events] of Object.entries(momentGroups)) {
      const count = events.length;
      const avgTime = events.length > 0
        ? Math.round(events.reduce((sum, e) => sum + (e.minutes_from_signup || 0), 0) / events.length)
        : 0;
      const totalXp = events.reduce((sum, e) => sum + (e.xp_awarded || 0), 0);

      stats.push({
        moment_type: type,
        trigger_count: count,
        avg_time_to_trigger_minutes: avgTime,
        xp_awarded_total: totalXp
      });
    }

    setAhaStats(stats.sort((a, b) => b.trigger_count - a.trigger_count));
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin">
          <BarChart3 className="w-12 h-12 text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Onboarding Analytics</h1>
                <p className="text-sm text-gray-600">User activation funnel and performance metrics</p>
              </div>
            </div>

            {/* Time Range Selector */}
            <div className="flex gap-2">
              {(['7d', '30d', 'all'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    timeRange === range
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'All Time'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Activation Funnel */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            User Activation Funnel
          </h2>

          {funnelStats && (
            <div className="space-y-4">
              {/* Funnel Visualization */}
              {[
                { label: 'Total Signups', count: funnelStats.total_signups, width: 100, color: 'bg-gray-400' },
                { label: 'Wizard Started', count: funnelStats.wizard_started, width: (funnelStats.wizard_started / funnelStats.total_signups) * 100, color: 'bg-blue-400' },
                { label: 'Wizard Completed', count: funnelStats.wizard_completed, width: (funnelStats.wizard_completed / funnelStats.total_signups) * 100, color: 'bg-blue-500' },
                { label: 'First Lead Captured', count: funnelStats.first_lead, width: (funnelStats.first_lead / funnelStats.total_signups) * 100, color: 'bg-green-500' },
                { label: 'First Followup Sent', count: funnelStats.first_followup, width: (funnelStats.first_followup / funnelStats.total_signups) * 100, color: 'bg-green-600' },
                { label: 'Quick Win Achieved', count: funnelStats.quick_win_achieved, width: (funnelStats.quick_win_achieved / funnelStats.total_signups) * 100, color: 'bg-purple-600' },
              ].map((stage, index) => {
                const conversionRate = funnelStats.total_signups > 0
                  ? Math.round((stage.count / funnelStats.total_signups) * 100)
                  : 0;
                const dropoff = index > 0 && funnelStats.total_signups > 0
                  ? Math.round(((stage.count - (index > 0 ? [funnelStats.wizard_started, funnelStats.wizard_completed, funnelStats.first_lead, funnelStats.first_followup, funnelStats.quick_win_achieved][index - 1] || 0 : 0)) / funnelStats.total_signups) * 100)
                  : 0;

                return (
                  <div key={stage.label} className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700">{stage.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-900">{stage.count} users</span>
                        <span className="text-sm text-gray-600">({conversionRate}%)</span>
                        {dropoff !== 0 && (
                          <span className={`text-xs font-medium ${dropoff < 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {dropoff > 0 ? '+' : ''}{dropoff}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="h-10 bg-gray-100 rounded-lg overflow-hidden">
                      <div
                        className={`h-full ${stage.color} transition-all flex items-center px-4 text-white font-medium text-sm`}
                        style={{ width: `${stage.width}%` }}
                      >
                        {stage.width > 20 && `${conversionRate}%`}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Overall Conversion Rate */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-blue-900">Overall Activation Rate:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {funnelStats.total_signups > 0
                      ? Math.round((funnelStats.quick_win_achieved / funnelStats.total_signups) * 100)
                      : 0}%
                  </span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  {funnelStats.quick_win_achieved} out of {funnelStats.total_signups} signups achieved quick win
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Industry Breakdown */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-purple-600" />
            Industry Activation Differences
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Industry</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Signups</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Completion Rate</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Avg TTV</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Aha Moments</th>
                </tr>
              </thead>
              <tbody>
                {industryStats.map((stat, index) => (
                  <tr key={stat.industry} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900 capitalize">
                        {stat.industry.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="text-center py-3 px-4 text-gray-700">{stat.signups}</td>
                    <td className="text-center py-3 px-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                        stat.completion_rate >= 70
                          ? 'bg-green-100 text-green-700'
                          : stat.completion_rate >= 50
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {stat.completion_rate}%
                      </span>
                    </td>
                    <td className="text-center py-3 px-4 text-gray-700">
                      {formatTime(stat.avg_ttv_seconds)}
                    </td>
                    <td className="text-center py-3 px-4 font-semibold text-purple-600">
                      {stat.aha_moments_avg.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {industryStats.length === 0 && (
              <div className="text-center py-12">
                <PieChart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No industry data yet</p>
              </div>
            )}
          </div>
        </section>

        {/* Aha Moments Stats */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-600" />
            Aha Moments Count
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ahaStats.map((stat) => (
              <div key={stat.moment_type} className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 capitalize text-sm">
                    {stat.moment_type.replace('_', ' ')}
                  </h3>
                  <Zap className="w-4 h-4 text-yellow-600" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Triggered:</span>
                    <span className="text-lg font-bold text-gray-900">{stat.trigger_count}×</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Avg Time:</span>
                    <span className="text-sm font-semibold text-gray-700">
                      {stat.avg_time_to_trigger_minutes < 60
                        ? `${stat.avg_time_to_trigger_minutes}m`
                        : `${Math.round(stat.avg_time_to_trigger_minutes / 60)}h`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Total XP:</span>
                    <span className="text-sm font-semibold text-purple-600">{stat.xp_awarded_total} XP</span>
                  </div>
                </div>
              </div>
            ))}

            {ahaStats.length === 0 && (
              <div className="col-span-full text-center py-12">
                <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No aha moments triggered yet</p>
              </div>
            )}
          </div>
        </section>

        {/* Quick Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step Dropoffs */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">Biggest Dropoff</p>
                <p className="text-2xl font-bold text-gray-900">
                  {funnelStats && funnelStats.total_signups > 0
                    ? Math.round(((funnelStats.total_signups - funnelStats.wizard_started) / funnelStats.total_signups) * 100)
                    : 0}%
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Signup → Wizard Start
            </p>
          </div>

          {/* Quick Win Rate */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">Quick Win Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {funnelStats && funnelStats.wizard_completed > 0
                    ? Math.round((funnelStats.quick_win_achieved / funnelStats.wizard_completed) * 100)
                    : 0}%
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Of completed wizards
            </p>
          </div>

          {/* Avg Aha Moments */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">Avg Aha Moments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {funnelStats && funnelStats.total_signups > 0
                    ? (ahaStats.reduce((sum, s) => sum + s.trigger_count, 0) / funnelStats.total_signups).toFixed(1)
                    : '0.0'}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Per activated user
            </p>
          </div>
        </div>

        {/* Recommendations */}
        {funnelStats && funnelStats.total_signups > 0 && (
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6">
            <h3 className="font-bold text-blue-900 mb-4">📊 Key Insights & Recommendations</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              {((funnelStats.total_signups - funnelStats.wizard_started) / funnelStats.total_signups) > 0.3 && (
                <li>⚠️ <strong>30%+ users not starting wizard</strong> - Consider auto-redirecting to onboarding after signup</li>
              )}
              {funnelStats.wizard_started > 0 && ((funnelStats.wizard_started - funnelStats.wizard_completed) / funnelStats.wizard_started) > 0.2 && (
                <li>⚠️ <strong>20%+ dropoff in wizard</strong> - Simplify questions or add progress incentives</li>
              )}
              {funnelStats.wizard_completed > 0 && (funnelStats.quick_win_achieved / funnelStats.wizard_completed) >= 0.7 && (
                <li>✅ <strong>70%+ quick win rate</strong> - Excellent! Onboarding is effective</li>
              )}
              {industryStats.length > 0 && (
                <li>💡 <strong>Top performing industry:</strong> {industryStats[0].industry.replace('_', ' ')} ({industryStats[0].completion_rate}% completion)</li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

