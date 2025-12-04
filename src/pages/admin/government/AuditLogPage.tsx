import { useState, useEffect } from 'react';
import { Search, Filter, AlertTriangle, ChevronRight } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

export default function AuditLogPage() {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [filters, setFilters] = useState({
    tier: 'all',
    jobType: 'all',
    riskRange: 'all',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuditLogs();
  }, [filters]);

  async function loadAuditLogs() {
    setLoading(true);
    try {
      let query = supabase
        .from('audit_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filters.tier !== 'all') {
        query = query.eq('tier', filters.tier);
      }

      if (filters.jobType !== 'all') {
        query = query.eq('job_type', filters.jobType);
      }

      if (filters.riskRange === 'high') {
        query = query.gte('postcheck_risk_score', 50);
      } else if (filters.riskRange === 'low') {
        query = query.lt('postcheck_risk_score', 50);
      }

      const { data } = await query;
      setAuditLogs(data || []);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  }

  function getRiskColor(score: number) {
    if (score >= 75) return 'text-red-600';
    if (score >= 50) return 'text-orange-600';
    if (score >= 25) return 'text-yellow-600';
    return 'text-green-600';
  }

  function getRiskBadge(score: number) {
    if (score >= 75) return 'bg-red-100 text-red-800';
    if (score >= 50) return 'bg-orange-100 text-orange-800';
    if (score >= 25) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Supreme Court Audit Log</h1>
          <p className="text-gray-600 mt-2">Review all job audits and security decisions</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tier</label>
              <select
                value={filters.tier}
                onChange={(e) => setFilters({ ...filters, tier: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Tiers</option>
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="team">Team</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
              <select
                value={filters.jobType}
                onChange={(e) => setFilters({ ...filters, jobType: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Jobs</option>
                <option value="SCAN">SCAN</option>
                <option value="MESSAGE">MESSAGE</option>
                <option value="PITCH_DECK">PITCH_DECK</option>
                <option value="CHATBOT">CHATBOT</option>
                <option value="COMPANY_INTELLIGENCE">COMPANY_INTELLIGENCE</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Risk Level</label>
              <select
                value={filters.riskRange}
                onChange={(e) => setFilters({ ...filters, riskRange: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Levels</option>
                <option value="high">High Risk (50+)</option>
                <option value="low">Low Risk (&lt;50)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Job Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Tier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Risk Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {auditLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedLog(log)}
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">{log.job_type}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full capitalize">
                          {log.tier}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRiskBadge(
                            log.postcheck_risk_score || 0
                          )}`}
                        >
                          {log.postcheck_risk_score || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {log.postcheck_blocked ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                            <AlertTriangle className="w-3 h-3" />
                            Blocked
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            Allowed
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:col-span-1">
            {selectedLog ? (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Audit Details</h3>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Job Type</p>
                    <p className="text-lg font-medium text-gray-900">{selectedLog.job_type}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">User Tier</p>
                    <p className="text-lg font-medium text-gray-900 capitalize">
                      {selectedLog.tier}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Pre-Check</p>
                    <p
                      className={`text-sm font-medium ${
                        selectedLog.precheck_allowed ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {selectedLog.precheck_allowed ? 'Allowed' : 'Blocked'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Risk Score: {selectedLog.precheck_risk_score || 0}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Post-Check</p>
                    <p
                      className={`text-sm font-medium ${
                        selectedLog.postcheck_blocked ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {selectedLog.postcheck_blocked ? 'Blocked' : 'Allowed'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Risk Score: {selectedLog.postcheck_risk_score || 0}
                    </p>
                  </div>

                  {selectedLog.postcheck_reasons &&
                    JSON.parse(selectedLog.postcheck_reasons).length > 0 && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Reasons</p>
                        <div className="space-y-1">
                          {JSON.parse(selectedLog.postcheck_reasons).map(
                            (reason: string, idx: number) => (
                              <p key={idx} className="text-xs bg-red-50 px-2 py-1 rounded text-red-800">
                                {reason}
                              </p>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  <div>
                    <p className="text-sm text-gray-600">Timestamp</p>
                    <p className="text-sm text-gray-700">
                      {new Date(selectedLog.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-500 text-center">Select an audit log to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
