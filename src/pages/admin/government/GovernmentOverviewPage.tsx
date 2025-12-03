import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Shield, Scale, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { getSystemHealth } from '../../../government/departments';

export default function GovernmentOverviewPage() {
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [stats, setStats] = useState({
    totalJobs: 0,
    errorRate: 0,
    activeEngines: 0,
  });
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [blockedJobs, setBlockedJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [health, jobStats, events, blocked] = await Promise.all([
        getSystemHealth(),
        getJobStats(),
        getRecentEvents(),
        getBlockedJobs(),
      ]);

      setSystemHealth(health);
      setStats(jobStats);
      setRecentEvents(events);
      setBlockedJobs(blocked);
    } catch (error) {
      console.error('Failed to load government overview:', error);
    } finally {
      setLoading(false);
    }
  }

  async function getJobStats() {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const { count: totalJobs } = await supabase
      .from('orchestrator_events')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterday.toISOString());

    const { count: errorJobs } = await supabase
      .from('orchestrator_events')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'FAILED')
      .gte('created_at', yesterday.toISOString());

    const errorRate = totalJobs ? ((errorJobs || 0) / totalJobs) * 100 : 0;

    return {
      totalJobs: totalJobs || 0,
      errorRate: Math.round(errorRate * 10) / 10,
      activeEngines: 45,
    };
  }

  async function getRecentEvents() {
    const { data } = await supabase
      .from('orchestrator_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    return data || [];
  }

  async function getBlockedJobs() {
    const { data } = await supabase
      .from('audit_jobs')
      .select('*')
      .eq('postcheck_blocked', true)
      .order('created_at', { ascending: false })
      .limit(5);

    return data || [];
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-400">Loading government overview...</div>
      </div>
    );
  }

  const healthColor =
    systemHealth?.overall === 'GREEN'
      ? 'text-green-500'
      : systemHealth?.overall === 'YELLOW'
      ? 'text-yellow-500'
      : 'text-red-500';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">NexScout Government</h1>
          <p className="text-gray-600 mt-2">Central control and monitoring system</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">System Health</p>
                <p className={`text-2xl font-bold mt-2 ${healthColor}`}>
                  {systemHealth?.overall || 'UNKNOWN'}
                </p>
              </div>
              <Activity className={`w-12 h-12 ${healthColor}`} />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {systemHealth?.healthyCount}/{systemHealth?.departmentCount} departments healthy
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Engines</p>
                <p className="text-2xl font-bold text-blue-600 mt-2">{stats.activeEngines}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-blue-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Across 9 departments</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">AI Jobs (24h)</p>
                <p className="text-2xl font-bold text-purple-600 mt-2">{stats.totalJobs}</p>
              </div>
              <Activity className="w-12 h-12 text-purple-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Yesterday's total</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Error Rate</p>
                <p className="text-2xl font-bold text-orange-600 mt-2">{stats.errorRate}%</p>
              </div>
              <AlertTriangle className="w-12 h-12 text-orange-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Last 24 hours</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Link
            to="/admin/government/departments"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-3 mb-4">
              <Activity className="w-8 h-8 text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">President</h3>
                <p className="text-sm text-gray-600">Master Orchestrator</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-700">Active</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">Coordinating all AI operations</p>
          </Link>

          <Link
            to="/admin/government/economy"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-3 mb-4">
              <Scale className="w-8 h-8 text-purple-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Congress</h3>
                <p className="text-sm text-gray-600">Rules Engine</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-700">Active</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">Managing tiers and permissions</p>
          </Link>

          <Link
            to="/admin/government/audit"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-8 h-8 text-red-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Supreme Court</h3>
                <p className="text-sm text-gray-600">Audit Engine</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-700">Active</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">{blockedJobs.length} jobs blocked today</p>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Orchestrator Events</h3>
            <div className="space-y-3">
              {recentEvents.length === 0 ? (
                <p className="text-sm text-gray-500">No recent events</p>
              ) : (
                recentEvents.map((event) => (
                  <div key={event.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded">
                    <div
                      className={`w-2 h-2 rounded-full mt-2 ${
                        event.status === 'COMPLETED'
                          ? 'bg-green-500'
                          : event.status === 'FAILED'
                          ? 'bg-red-500'
                          : 'bg-yellow-500'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{event.job_type}</p>
                      <p className="text-xs text-gray-500">
                        {event.status} • {new Date(event.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Blocked Jobs (Supreme Court)</h3>
            <div className="space-y-3">
              {blockedJobs.length === 0 ? (
                <p className="text-sm text-gray-500">No blocked jobs</p>
              ) : (
                blockedJobs.map((job) => (
                  <div key={job.id} className="flex items-start gap-3 p-3 bg-red-50 rounded">
                    <AlertTriangle className="w-4 h-4 text-red-600 mt-1" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{job.job_type}</p>
                      <p className="text-xs text-gray-500">
                        Risk Score: {job.postcheck_risk_score} • {new Date(job.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
