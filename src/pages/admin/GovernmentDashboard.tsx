import { useEffect, useState } from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Activity,
  Zap,
  TrendingUp,
  Eye,
  Scale,
  Building2,
} from 'lucide-react';
import { getSystemHealth, getComplianceScore, runSystemAudit } from '../../government/middleware/governmentMiddleware';
import { departmentCoordinator } from '../../government';
import type { SystemHealth, DepartmentMetrics, AuditReport } from '../../government/types/government';

export default function GovernmentDashboard() {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [complianceScore, setComplianceScore] = useState<number>(0);
  const [departments, setDepartments] = useState<DepartmentMetrics[]>([]);
  const [latestAudit, setLatestAudit] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [health, compliance, deptMetrics] = await Promise.all([
        getSystemHealth(),
        getComplianceScore(),
        departmentCoordinator.getAllDepartmentMetrics(),
      ]);

      setSystemHealth(health);
      setComplianceScore(compliance);
      setDepartments(deptMetrics);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const runAudit = async () => {
    try {
      const audit = await runSystemAudit();
      setLatestAudit(audit);
    } catch (error) {
      console.error('Failed to run audit:', error);
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthBg = (score: number) => {
    if (score >= 90) return 'bg-green-100';
    if (score >= 70) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading Government Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Shield className="w-8 h-8 text-blue-600" />
                NexScout Government Dashboard
              </h1>
              <p className="text-gray-600 mt-2">Constitutional oversight and system governance</p>
            </div>
            <button
              onClick={runAudit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              Run System Audit
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <Activity className="w-8 h-8 text-blue-600" />
              <span className={`text-2xl font-bold ${getHealthColor(systemHealth?.overall_health_score || 0)}`}>
                {systemHealth?.overall_health_score || 0}%
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">System Health</h3>
            <p className="text-xs text-gray-500 mt-1">Overall system status</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <Shield className="w-8 h-8 text-green-600" />
              <span className={`text-2xl font-bold ${getHealthColor(complianceScore)}`}>
                {complianceScore}%
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Compliance Score</h3>
            <p className="text-xs text-gray-500 mt-1">Security & safety rating</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
              <span className="text-2xl font-bold text-gray-900">
                {systemHealth?.active_violations || 0}
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Active Violations</h3>
            <p className="text-xs text-gray-500 mt-1">Constitutional issues</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <Zap className="w-8 h-8 text-purple-600" />
              <span className="text-2xl font-bold text-gray-900">
                {systemHealth?.active_governors || 0}/{systemHealth?.total_governors || 0}
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Active Engines</h3>
            <p className="text-xs text-gray-500 mt-1">Governors online</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Scale className="w-5 h-5 text-blue-600" />
              Branch Health
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">President</span>
                <span className={`font-semibold ${getHealthColor(systemHealth?.branch_health.president || 0)}`}>
                  {systemHealth?.branch_health.president || 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Congress</span>
                <span className={`font-semibold ${getHealthColor(systemHealth?.branch_health.congress || 0)}`}>
                  {systemHealth?.branch_health.congress || 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Supreme Court</span>
                <span className={`font-semibold ${getHealthColor(systemHealth?.branch_health.supreme_court || 0)}`}>
                  {systemHealth?.branch_health.supreme_court || 0}%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              System Load
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Current Load</span>
                <span className="font-semibold text-gray-900">{systemHealth?.system_load || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    (systemHealth?.system_load || 0) > 80 ? 'bg-red-600' : (systemHealth?.system_load || 0) > 60 ? 'bg-yellow-600' : 'bg-green-600'
                  }`}
                  style={{ width: `${systemHealth?.system_load || 0}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">
                {(systemHealth?.system_load || 0) > 80 ? 'High load - surge pricing active' : 'Normal operation'}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              Active Emergencies
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Emergency Events</span>
                <span className="font-semibold text-gray-900">{systemHealth?.active_emergencies || 0}</span>
              </div>
              {(systemHealth?.active_emergencies || 0) === 0 ? (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>No active emergencies</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Emergency protocols active</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Department Status
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Engines</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Healthy</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Degraded</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Failed</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Response</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Success Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {departments.map(dept => (
                  <tr key={dept.department} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900 capitalize">{dept.department}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{dept.total_engines}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        {dept.healthy_engines}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {dept.degraded_engines > 0 ? (
                        <span className="inline-flex items-center gap-1 text-yellow-600">
                          <AlertTriangle className="w-4 h-4" />
                          {dept.degraded_engines}
                        </span>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {dept.failed_engines > 0 ? (
                        <span className="inline-flex items-center gap-1 text-red-600">
                          <AlertTriangle className="w-4 h-4" />
                          {dept.failed_engines}
                        </span>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {dept.avg_response_time_ms}ms
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`font-medium ${getHealthColor(dept.success_rate * 100)}`}>
                        {(dept.success_rate * 100).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {latestAudit && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-purple-600" />
              Latest Audit Report
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Audit ID:</span>
                <span className="font-mono text-sm">{latestAudit.audit_id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Severity:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  latestAudit.severity === 'critical' ? 'bg-red-100 text-red-800' :
                  latestAudit.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {latestAudit.severity.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Findings:</span>
                <span className="font-semibold">{latestAudit.findings.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Violations:</span>
                <span className="font-semibold text-red-600">{latestAudit.violations.length}</span>
              </div>
              {latestAudit.recommendations.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Recommendations:</h4>
                  <ul className="space-y-1">
                    {latestAudit.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-blue-600 mt-0.5">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
