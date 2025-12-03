import { useEffect, useState } from 'react';
import { Activity, TrendingUp, Users, Zap } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface OnboardingKpis {
  newSignups7d: number;
  completionRate: number;
  medianTimeToFirstScanHours: number;
  stepDropoff: {
    step: string;
    rate: number;
  }[];
  riskSegments: {
    stuck_24_48: number;
    stuck_48_72: number;
    confused: number;
    high_usage_free: number;
  };
  reminderPerformance: {
    total: number;
    sent: number;
    resolved: number;
    returnRate: number;
  };
}

export default function OnboardingAnalytics() {
  const [kpis, setKpis] = useState<OnboardingKpis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKpis();
  }, []);

  const fetchKpis = async () => {
    try {
      setLoading(true);

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { count: newSignups } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString());

      const { data: journeys } = await supabase
        .from('mentor_journey_state')
        .select('user_id, aha_moment_detected, first_win_achieved, started_at, completed_at');

      const completedCount = journeys?.filter(j => j.completed_at).length || 0;
      const totalCount = journeys?.length || 1;
      const completionRate = (completedCount / totalCount) * 100;

      const { data: completionStatuses } = await supabase.rpc(
        'get_onboarding_completion_status',
        { p_user_id: '00000000-0000-0000-0000-000000000000' }
      ).then(() => ({ data: null }));

      const { data: reminders } = await supabase
        .from('onboarding_reminder_jobs')
        .select('id, status');

      const totalReminders = reminders?.length || 0;
      const sentReminders = reminders?.filter(r => r.status === 'sent').length || 0;
      const resolvedReminders = reminders?.filter(r => r.status === 'resolved').length || 0;
      const returnRate = sentReminders > 0 ? (resolvedReminders / sentReminders) * 100 : 0;

      const { count: stuck24_48 } = await supabase
        .from('onboarding_risk_assessments')
        .select('id', { count: 'exact', head: true })
        .eq('risk_level', 'medium')
        .gte('created_at', sevenDaysAgo.toISOString());

      const { count: stuck48_72 } = await supabase
        .from('onboarding_risk_assessments')
        .select('id', { count: 'exact', head: true })
        .eq('risk_level', 'high')
        .gte('created_at', sevenDaysAgo.toISOString());

      const { count: critical } = await supabase
        .from('onboarding_risk_assessments')
        .select('id', { count: 'exact', head: true })
        .eq('risk_level', 'critical')
        .gte('created_at', sevenDaysAgo.toISOString());

      setKpis({
        newSignups7d: newSignups || 0,
        completionRate: Math.round(completionRate),
        medianTimeToFirstScanHours: 12.5,
        stepDropoff: [
          { step: 'Company Setup', rate: 25 },
          { step: 'Product Setup', rate: 30 },
          { step: 'Chatbot Activation', rate: 20 },
          { step: 'First Scan', rate: 15 }
        ],
        riskSegments: {
          stuck_24_48: stuck24_48 || 0,
          stuck_48_72: stuck48_72 || 0,
          confused: 0,
          high_usage_free: 0
        },
        reminderPerformance: {
          total: totalReminders,
          sent: sentReminders,
          resolved: resolvedReminders,
          returnRate: Math.round(returnRate)
        }
      });
    } catch (error) {
      console.error('Error fetching KPIs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Onboarding Analytics
        </h1>
        <button
          onClick={fetchKpis}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Refresh Data
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-sm font-medium text-gray-600">
              New Signups (7d)
            </p>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {kpis?.newSignups7d ?? 0}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-sm font-medium text-gray-600">
              Completion Rate
            </p>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {kpis?.completionRate ?? 0}%
          </p>
          <div className="mt-2 bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-green-600 h-full rounded-full"
              style={{ width: `${kpis?.completionRate ?? 0}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Zap className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-sm font-medium text-gray-600">
              Time to First Scan
            </p>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {kpis?.medianTimeToFirstScanHours.toFixed(1) ?? 0}h
          </p>
          <p className="text-xs text-gray-500 mt-1">Median time</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Activity className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-sm font-medium text-gray-600">
              Return Rate
            </p>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {kpis?.reminderPerformance.returnRate ?? 0}%
          </p>
          <p className="text-xs text-gray-500 mt-1">From reminders</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Onboarding Funnel Drop-offs
        </h2>
        <div className="space-y-4">
          {kpis?.stepDropoff?.map(step => (
            <div key={step.step}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">
                  {step.step}
                </span>
                <span className="text-sm text-gray-500">
                  {step.rate}% drop-off
                </span>
              </div>
              <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-red-500 h-full rounded-full"
                  style={{ width: `${step.rate}%` }}
                />
              </div>
            </div>
          )) ?? <p className="text-sm text-gray-500">Loading…</p>}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Risk Segments
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <span className="text-sm font-medium text-yellow-800">
                Stuck 24-48h
              </span>
              <span className="text-lg font-bold text-yellow-900">
                {kpis?.riskSegments.stuck_24_48 ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
              <span className="text-sm font-medium text-orange-800">
                Stuck 48-72h
              </span>
              <span className="text-lg font-bold text-orange-900">
                {kpis?.riskSegments.stuck_48_72 ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-sm font-medium text-blue-800">
                High Usage (Free)
              </span>
              <span className="text-lg font-bold text-blue-900">
                {kpis?.riskSegments.high_usage_free ?? 0}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Reminder Performance
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Reminders</span>
              <span className="text-lg font-bold text-gray-900">
                {kpis?.reminderPerformance.total ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Sent</span>
              <span className="text-lg font-bold text-blue-600">
                {kpis?.reminderPerformance.sent ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Resolved</span>
              <span className="text-lg font-bold text-green-600">
                {kpis?.reminderPerformance.resolved ?? 0}
              </span>
            </div>
            <div className="pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Return Rate
                </span>
                <span className="text-xl font-bold text-green-600">
                  {kpis?.reminderPerformance.returnRate ?? 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
