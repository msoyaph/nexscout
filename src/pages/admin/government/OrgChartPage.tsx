import { useState } from 'react';
import { Activity, Scale, Shield, Building2, X } from 'lucide-react';

const departments = [
  { id: 'eng', name: 'Engineering', code: 'ENG', color: 'bg-blue-100 text-blue-800', engines: 9 },
  { id: 'uiux', name: 'UI/UX', code: 'UIUX', color: 'bg-purple-100 text-purple-800', engines: 3 },
  { id: 'db', name: 'Database', code: 'DB', color: 'bg-green-100 text-green-800', engines: 4 },
  { id: 'sec', name: 'Security', code: 'SEC', color: 'bg-red-100 text-red-800', engines: 3 },
  { id: 'know', name: 'Knowledge', code: 'KNOW', color: 'bg-yellow-100 text-yellow-800', engines: 8 },
  { id: 'prod', name: 'Productivity', code: 'PROD', color: 'bg-orange-100 text-orange-800', engines: 5 },
  { id: 'comm', name: 'Communication', code: 'COMM', color: 'bg-teal-100 text-teal-800', engines: 9 },
  { id: 'econ', name: 'Economy', code: 'ECON', color: 'bg-emerald-100 text-emerald-800', engines: 5 },
  { id: 'anly', name: 'Analytics', code: 'ANLY', color: 'bg-cyan-100 text-cyan-800', engines: 6 },
];

export default function OrgChartPage() {
  const [selectedItem, setSelectedItem] = useState<any>(null);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Government Organization Chart</h1>
          <p className="text-gray-600 mt-2">Visual representation of NexScout Government structure</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex flex-col items-center">
            <button
              onClick={() =>
                setSelectedItem({
                  type: 'President',
                  name: 'Master Orchestrator',
                  description: 'Central coordinator for all AI operations',
                })
              }
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all"
            >
              <div className="flex items-center gap-3">
                <Activity className="w-6 h-6" />
                <div className="text-left">
                  <div className="font-bold text-lg">President</div>
                  <div className="text-sm opacity-90">Master Orchestrator</div>
                </div>
              </div>
            </button>

            <div className="w-0.5 h-12 bg-gray-300 my-4"></div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl mb-8">
              <button
                onClick={() =>
                  setSelectedItem({
                    type: 'Congress',
                    name: 'Rules Engine',
                    description: 'Defines tiers, permissions, pricing, and rate limits',
                  })
                }
                className="bg-purple-100 p-6 rounded-lg hover:shadow-lg transition-all"
              >
                <div className="flex items-center gap-3">
                  <Scale className="w-8 h-8 text-purple-600" />
                  <div className="text-left">
                    <div className="font-bold text-gray-900">Congress</div>
                    <div className="text-sm text-gray-600">Rules Engine</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() =>
                  setSelectedItem({
                    type: 'President',
                    name: 'Master Orchestrator',
                    description: 'Routes jobs, enforces costs, coordinates departments',
                  })
                }
                className="bg-blue-100 p-6 rounded-lg hover:shadow-lg transition-all"
              >
                <div className="flex items-center gap-3">
                  <Activity className="w-8 h-8 text-blue-600" />
                  <div className="text-left">
                    <div className="font-bold text-gray-900">Orchestrator</div>
                    <div className="text-sm text-gray-600">President</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() =>
                  setSelectedItem({
                    type: 'Supreme Court',
                    name: 'Audit Engine',
                    description: 'Reviews jobs before and after execution for safety',
                  })
                }
                className="bg-red-100 p-6 rounded-lg hover:shadow-lg transition-all"
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-8 h-8 text-red-600" />
                  <div className="text-left">
                    <div className="font-bold text-gray-900">Supreme Court</div>
                    <div className="text-sm text-gray-600">Audit Engine</div>
                  </div>
                </div>
              </button>
            </div>

            <div className="w-0.5 h-12 bg-gray-300"></div>

            <div className="mt-4">
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full">
                  <Building2 className="w-5 h-5 text-gray-600" />
                  <span className="font-semibold text-gray-900">9 Departments</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-5xl">
                {departments.map((dept) => (
                  <button
                    key={dept.id}
                    onClick={() =>
                      setSelectedItem({
                        type: 'Department',
                        ...dept,
                        description: `Manages ${dept.engines} engines`,
                      })
                    }
                    className={`${dept.color} p-4 rounded-lg hover:shadow-lg transition-all`}
                  >
                    <div className="text-left">
                      <div className="font-bold text-sm">{dept.name}</div>
                      <div className="text-xs opacity-75">{dept.code}</div>
                      <div className="text-xs mt-1">{dept.engines} engines</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedItem.name}</h3>
                  <p className="text-sm text-gray-600">{selectedItem.type}</p>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-gray-700 mb-4">{selectedItem.description}</p>
              {selectedItem.engines && (
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">{selectedItem.engines}</span> active engines
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
