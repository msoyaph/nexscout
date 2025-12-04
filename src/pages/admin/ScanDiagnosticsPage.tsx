import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Activity, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

export default function ScanDiagnosticsPage() {
  const [loading, setLoading] = useState(true);
  const [diagnostics, setDiagnostics] = useState<any>(null);

  useEffect(() => {
    loadDiagnostics();
  }, []);

  async function loadDiagnostics() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('scan_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setDiagnostics(data);
    } catch (error) {
      console.error('Error loading diagnostics:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Activity className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Scan Diagnostics</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Scan Sessions</h2>

        {diagnostics && diagnostics.length > 0 ? (
          <div className="space-y-4">
            {diagnostics.map((scan: any) => (
              <div key={scan.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {scan.status === 'completed' && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    {scan.status === 'failed' && (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    {scan.status === 'processing' && (
                      <Activity className="w-5 h-5 text-blue-500" />
                    )}
                    <span className="font-medium">{scan.scan_type || 'Unknown'}</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(scan.created_at).toLocaleString()}
                  </span>
                </div>

                <div className="mt-2 text-sm text-gray-600">
                  <p>Status: {scan.status}</p>
                  {scan.prospects_found && <p>Prospects Found: {scan.prospects_found}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-gray-500">
            <AlertCircle className="w-5 h-5" />
            <span>No scan sessions found</span>
          </div>
        )}
      </div>
    </div>
  );
}
