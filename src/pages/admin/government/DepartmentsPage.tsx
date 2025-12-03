import { useState, useEffect } from 'react';
import { RefreshCw, ChevronRight, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { getAllDepartmentStatuses, Departments } from '../../../government/departments';
import type { DepartmentStatus } from '../../../government/types/government';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<DepartmentStatus[]>([]);
  const [selectedDept, setSelectedDept] = useState<DepartmentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningCheck, setRunningCheck] = useState(false);

  useEffect(() => {
    loadDepartments();
  }, []);

  async function loadDepartments() {
    setLoading(true);
    try {
      const statuses = await getAllDepartmentStatuses();
      setDepartments(statuses);
    } catch (error) {
      console.error('Failed to load departments:', error);
    } finally {
      setLoading(false);
    }
  }

  async function runSelfCheck(deptId: string) {
    setRunningCheck(true);
    try {
      const deptMap: any = {
        engineering: Departments.ENGINEERING,
        uiux: Departments.UIUX,
        database: Departments.DATABASE,
        security: Departments.SECURITY,
        knowledge: Departments.KNOWLEDGE,
        productivity: Departments.PRODUCTIVITY,
        communication: Departments.COMMUNICATION,
        economy: Departments.ECONOMY,
        analytics: Departments.ANALYTICS,
      };

      const dept = deptMap[deptId];
      if (dept) {
        const result = await dept.runSelfCheck();
        setSelectedDept(result);
        await loadDepartments();
      }
    } catch (error) {
      console.error('Self-check failed:', error);
    } finally {
      setRunningCheck(false);
    }
  }

  function getHealthIcon(health: string) {
    if (health === 'GREEN') return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (health === 'YELLOW') return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    return <XCircle className="w-5 h-5 text-red-500" />;
  }

  function getHealthBadge(health: string) {
    const colors = {
      GREEN: 'bg-green-100 text-green-800',
      YELLOW: 'bg-yellow-100 text-yellow-800',
      RED: 'bg-red-100 text-red-800',
    };
    return colors[health as keyof typeof colors] || colors.GREEN;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-400">Loading departments...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Departments</h1>
            <p className="text-gray-600 mt-2">Manage and monitor all government departments</p>
          </div>
          <button
            onClick={loadDepartments}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Health
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Engines
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Incidents
                    </th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {departments.map((dept) => (
                    <tr
                      key={dept.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedDept(dept)}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{dept.name}</div>
                          <div className="text-sm text-gray-500">{dept.code}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getHealthBadge(
                            dept.health
                          )}`}
                        >
                          {getHealthIcon(dept.health)}
                          {dept.health}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {dept.activeEngines.length}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-sm ${
                            dept.openIncidents > 0 ? 'text-red-600 font-medium' : 'text-gray-500'
                          }`}
                        >
                          {dept.openIncidents}
                        </span>
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
            {selectedDept ? (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{selectedDept.name}</h3>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Code</p>
                    <p className="text-lg font-medium text-gray-900">{selectedDept.code}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Health Status</p>
                    <span
                      className={`inline-flex items-center gap-2 mt-1 px-3 py-1 rounded-full text-sm font-medium ${getHealthBadge(
                        selectedDept.health
                      )}`}
                    >
                      {getHealthIcon(selectedDept.health)}
                      {selectedDept.health}
                    </span>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Open Incidents</p>
                    <p className="text-lg font-medium text-gray-900">
                      {selectedDept.openIncidents}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">Active Engines</p>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {selectedDept.activeEngines.map((engine, idx) => (
                        <div
                          key={idx}
                          className="text-xs bg-gray-50 px-2 py-1 rounded text-gray-700"
                        >
                          {engine}
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedDept.notes && (
                    <div>
                      <p className="text-sm text-gray-600">Notes</p>
                      <p className="text-sm text-gray-700 mt-1">{selectedDept.notes}</p>
                    </div>
                  )}

                  {selectedDept.lastAuditAt && (
                    <div>
                      <p className="text-sm text-gray-600">Last Audit</p>
                      <p className="text-sm text-gray-700">
                        {new Date(selectedDept.lastAuditAt).toLocaleString()}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => runSelfCheck(selectedDept.id)}
                    disabled={runningCheck}
                    className="w-full mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${runningCheck ? 'animate-spin' : ''}`} />
                    {runningCheck ? 'Running...' : 'Run Self Check'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-500 text-center">
                  Select a department to view details
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
