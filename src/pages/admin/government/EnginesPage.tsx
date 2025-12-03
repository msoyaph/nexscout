import { useState, useEffect } from 'react';
import { Search, Filter } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { EnginesRegistry } from '../../../government/enginesRegistry';
import type { EngineDefinition } from '../../../government/enginesRegistry';

export default function EnginesPage() {
  const [engines, setEngines] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEngines();
  }, []);

  async function loadEngines() {
    setLoading(true);
    try {
      const registeredEngines = Object.values(EnginesRegistry);
      const allEngines: any[] = [];

      registeredEngines.forEach((engine: EngineDefinition) => {
        allEngines.push({
          id: engine.id,
          name: engine.name,
          department: engine.department,
          jobTypes: engine.handles.jobTypes,
          subTypes: engine.handles.subTypes || [],
          modelPreference: engine.modelPreference,
          enabled: true,
          lastSuccess: null,
          errorCount: 0,
          avgDuration: 0,
        });
      });

      const { data: events } = await supabase
        .from('orchestrator_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (events) {
        allEngines.forEach(engine => {
          const engineEvents = events.filter(e =>
            e.metadata?.engine === engine.name || e.job_type?.toLowerCase().includes(engine.name.split('_')[0])
          );

          const successEvents = engineEvents.filter(e => e.status === 'COMPLETED');
          engine.lastSuccess = successEvents[0]?.created_at;
          engine.errorCount = engineEvents.filter(e => e.status === 'FAILED').length;

          if (successEvents.length > 0) {
            const totalDuration = successEvents.reduce((sum, e) => sum + (e.duration || 0), 0);
            engine.avgDuration = Math.round(totalDuration / successEvents.length);
          }
        });
      }

      setEngines(allEngines);
    } catch (error) {
      console.error('Failed to load engines:', error);
    } finally {
      setLoading(false);
    }
  }

  const departments = ['All', ...new Set(Object.values(EnginesRegistry).map(e => e.department))];

  const filteredEngines = engines.filter(engine => {
    const matchesSearch = engine.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === 'All' || engine.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Engines Registry</h1>
          <p className="text-gray-600 mt-2">Monitor and manage all AI engines</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search engines..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {departments.map(dept => (
                  <option key={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Engine Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Job Types
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Model
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Last Success
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Errors (24h)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Avg Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredEngines.map((engine, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{engine.name}</div>
                    <div className="text-xs text-gray-500">{engine.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {engine.department}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-700">
                      {engine.jobTypes.join(', ')}
                      {engine.subTypes.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          Subtypes: {engine.subTypes.join(', ')}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        engine.modelPreference === 'CHEAP'
                          ? 'bg-green-100 text-green-800'
                          : engine.modelPreference === 'STANDARD'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {engine.modelPreference}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {engine.lastSuccess
                      ? new Date(engine.lastSuccess).toLocaleString()
                      : 'Never'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-sm font-medium ${
                        engine.errorCount > 0 ? 'text-red-600' : 'text-gray-500'
                      }`}
                    >
                      {engine.errorCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {engine.avgDuration > 0 ? `${engine.avgDuration}ms` : 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        engine.enabled
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {engine.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
