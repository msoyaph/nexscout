import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, AlertTriangle, XCircle, Activity, Clock } from 'lucide-react';
import { HealthMonitor } from '../../../government/healthMonitor';
import type { HealthCheckResult } from '../../../government/healthMonitor';
import { supabase } from '../../../lib/supabase';

export default function HealthPage() {
  const [latestCheck, setLatestCheck] = useState<HealthCheckResult | null>(null);
  const [healthHistory, setHealthHistory] = useState<HealthCheckResult[]>([]);
  const [failedJobs, setFailedJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningCheck, setRunningCheck] = useState(false);

  useEffect(() => {
    loadHealthData();
  }, []);

  async function loadHealthData() {
    setLoading(true);
    try {
      const [latest, history, failed] = await Promise.all([
        HealthMonitor.getLatestHealthCheck(),
        HealthMonitor.getHealthHistory(24),
        getFailedJobs(),
      ]);

      setLatestCheck(latest);
      setHealthHistory(history);
      setFailedJobs(failed);
    } catch (error) {
      console.error('Failed to load health data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function getFailedJobs() {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const { data } = await supabase
      .from('orchestrator_events')
      .select('*')
      .eq('status', 'FAILED')
      .gte('created_at', last24Hours.toISOString())
      .order('created_at', { ascending: false })
      .limit(20);

    return data || [];
  }

  async function triggerFullCheck() {
    setRunningCheck(true);
    try {
      const result = await HealthMonitor.runFullHealthCheck();
      setLatestCheck(result);

      const history = await HealthMonitor.getHealthHistory(24);
      setHealthHistory(history);
    } catch (error) {
      console.error('Full health check failed:', error);
    } finally {
      setRunningCheck(false);
    }
  }

  function getHealthIcon(health: string) {
    if (health === 'GREEN') return <CheckCircle className="w-6 h-6 text-green-500" />;
    if (health === 'YELLOW') return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
    return <XCircle className="w-6 h-6 text-red-500" />;
  }

  const healthColor =
    latestCheck?.overallStatus === 'GREEN'
      ? 'bg-green-100 text-green-800 border-green-200'
      : latestCheck?.overallStatus === 'YELLOW'
      ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
      : 'bg-red-100 text-red-800 border-red-200';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-400">Loading health data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Health</h1>
            <p className="text-gray-600 mt-2">Monitor overall system status and performance</p>
          </div>
          <button
            onClick={triggerFullCheck}
            disabled={runningCheck}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${runningCheck ? 'animate-spin' : ''}`} />
            {runningCheck ? 'Running Check...' : 'Full Health Check'}
          </button>
        </div>

        {latestCheck && (
          <>
            <div className={`border-2 rounded-lg p-8 mb-8 ${healthColor}`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Overall System Status</h2>
                  <p className="text-lg">{latestCheck.overallStatus}</p>
                </div>
                {getHealthIcon(latestCheck.overallStatus)}
              </div>

              <div className="flex items-center gap-2 text-sm opacity-75 mb-6">
                <Clock className="w-4 h-4" />
                <span>Last check: {new Date(latestCheck.createdAt).toLocaleString()}</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm opacity-75">DB Latency</p>
                  <p className="text-2xl font-bold">{latestCheck.dbLatencyMs}ms</p>
                </div>
                <div>
                  <p className="text-sm opacity-75">Orchestrator Latency</p>
                  <p className="text-2xl font-bold">{latestCheck.orchestratorLatencyMs}ms</p>
                </div>
                <div>
                  <p className="text-sm opacity-75">Error Rate (24h)</p>
                  <p className="text-2xl font-bold">{latestCheck.errorRate24h}%</p>
                </div>
                <div>
                  <p className="text-sm opacity-75">Blocked Jobs (24h)</p>
                  <p className="text-2xl font-bold">{latestCheck.blockedJobs24h}</p>
                </div>
              </div>

              {latestCheck.notes && latestCheck.notes.length > 0 && (
                <div className="mt-6 pt-6 border-t border-opacity-30">
                  <p className="text-sm font-semibold mb-2">Notes:</p>
                  <ul className="space-y-1">
                    {latestCheck.notes.map((note, idx) => (
                      <li key={idx} className="text-sm opacity-90">• {note}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {healthHistory.length > 0 && (
              <div className="bg-white rounded-lg shadow mb-8 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Health History (Last 24 Checks)</h3>
                <div className="flex items-end gap-1 h-24">
                  {healthHistory.slice(0, 24).reverse().map((check, idx) => {
                    const color =
                      check.overallStatus === 'GREEN'
                        ? 'bg-green-500'
                        : check.overallStatus === 'YELLOW'
                        ? 'bg-yellow-500'
                        : 'bg-red-500';
                    const height = check.errorRate24h === 0 ? '100%' : `${Math.max(10, 100 - check.errorRate24h * 10)}%`;

                    return (
                      <div
                        key={idx}
                        className={`flex-1 ${color} rounded-t transition-all hover:opacity-75 cursor-pointer`}
                        style={{ height }}
                        title={`${check.overallStatus} - ${check.errorRate24h}% error rate - ${new Date(check.createdAt).toLocaleTimeString()}`}
                      />
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-2">Bar height represents system health (taller = healthier)</p>
              </div>
            )}

            {latestCheck.departments.length > 0 && (
              <div className="bg-white rounded-lg shadow mb-8 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Health Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {latestCheck.departments.map((dept) => (
                    <div key={dept.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{dept.name}</h4>
                        {getHealthIcon(dept.health)}
                      </div>
                      <p className="text-xs text-gray-600">{dept.notes}</p>
                      {dept.openIncidents > 0 && (
                        <p className="text-xs text-red-600 mt-2 font-medium">
                          {dept.openIncidents} incidents
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Failed Jobs (Last 24h)
          </h3>
          {failedJobs.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
              <p className="text-gray-600">No failed jobs in the last 24 hours</p>
            </div>
          ) : (
            <div className="space-y-3">
              {failedJobs.map((job) => (
                <div key={job.id} className="flex items-start gap-3 p-3 bg-red-50 rounded border border-red-100">
                  <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{job.job_type}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(job.created_at).toLocaleString()}
                        </p>
                      </div>
                      {job.metadata?.error && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                          Error
                        </span>
                      )}
                    </div>
                    {job.metadata?.error && (
                      <p className="text-xs text-red-700 mt-2 font-mono">
                        {job.metadata.error}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <Activity className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">System Uptime</h3>
              <p className="text-sm text-blue-800">
                All core services are operational. Background jobs are running normally.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
