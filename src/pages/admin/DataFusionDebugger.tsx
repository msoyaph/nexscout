import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Users, Layers, TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { matchIdentityDetailed } from '../../services/identityMatch';

export default function DataFusionDebugger() {
  const navigate = useNavigate();
  const [scans, setScans] = useState<any[]>([]);
  const [selectedScan, setSelectedScan] = useState<string>('');
  const [fusionData, setFusionData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRecentScans();
  }, []);

  useEffect(() => {
    if (selectedScan) {
      loadFusionData(selectedScan);
    }
  }, [selectedScan]);

  const loadRecentScans = async () => {
    const { data } = await supabase
      .from('scans')
      .select('id, status, created_at, total_items, sources')
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) setScans(data);
  };

  const loadFusionData = async (scanId: string) => {
    setLoading(true);
    try {
      const { data: items } = await supabase
        .from('scan_processed_items')
        .select('*')
        .eq('scan_id', scanId);

      const { data: results } = await supabase
        .from('scan_results')
        .select('*')
        .eq('scan_id', scanId)
        .single();

      setFusionData({
        items: items || [],
        results: results || {},
        scanId,
      });
    } catch (error) {
      console.error('Error loading fusion data:', error);
    }
    setLoading(false);
  };

  const analyzeIdentityMatches = () => {
    if (!fusionData?.items) return [];

    const prospects = fusionData.items.filter((i: any) => i.type === 'prospect' || i.type === 'fused_prospect');
    const matches: any[] = [];

    for (let i = 0; i < prospects.length; i++) {
      for (let j = i + 1; j < prospects.length; j++) {
        const match = matchIdentityDetailed(prospects[i], prospects[j]);
        if (match.score >= 0.6) {
          matches.push({
            prospect1: prospects[i],
            prospect2: prospects[j],
            match,
          });
        }
      }
    }

    return matches.sort((a, b) => b.match.score - a.match.score);
  };

  const identityMatches = selectedScan ? analyzeIdentityMatches() : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="mb-6 flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Layers className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Data Fusion Debugger</h1>
              <p className="text-slate-600">Inspect identity matching and data merging</p>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select Scan to Debug
            </label>
            <select
              value={selectedScan}
              onChange={(e) => setSelectedScan(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Choose a scan...</option>
              {scans.map((scan) => (
                <option key={scan.id} value={scan.id}>
                  {new Date(scan.created_at).toLocaleString()} - {scan.total_items || 0} items - {scan.status}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading && (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading fusion data...</p>
          </div>
        )}

        {!loading && fusionData && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
                <Users className="w-8 h-8 mb-3 opacity-80" />
                <div className="text-3xl font-bold mb-1">{fusionData.items.length}</div>
                <div className="text-blue-100">Total Items</div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white">
                <CheckCircle2 className="w-8 h-8 mb-3 opacity-80" />
                <div className="text-3xl font-bold mb-1">
                  {fusionData.items.filter((i: any) => i.type === 'fused_prospect').length}
                </div>
                <div className="text-green-100">Fused Prospects</div>
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg p-6 text-white">
                <TrendingUp className="w-8 h-8 mb-3 opacity-80" />
                <div className="text-3xl font-bold mb-1">{identityMatches.length}</div>
                <div className="text-orange-100">Identity Matches</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Search className="w-6 h-6 text-purple-600" />
                Identity Match Analysis
              </h2>

              {identityMatches.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 text-lg">No potential matches found</p>
                  <p className="text-slate-400 text-sm mt-2">All prospects appear to be unique</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {identityMatches.map((match, idx) => (
                    <div
                      key={idx}
                      className="border border-slate-200 rounded-xl p-6 hover:border-purple-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="font-semibold text-slate-900 mb-1">{match.prospect1.name}</div>
                          <div className="text-sm text-slate-600">Source: {match.prospect1.metadata?.source || 'unknown'}</div>
                        </div>

                        <div className="px-6 py-2 mx-4">
                          <div className="text-center">
                            <div className={`text-2xl font-bold ${
                              match.match.confidence === 'high' ? 'text-green-600' :
                              match.match.confidence === 'medium' ? 'text-yellow-600' :
                              'text-orange-600'
                            }`}>
                              {Math.round(match.match.score * 100)}%
                            </div>
                            <div className="text-xs text-slate-500 uppercase tracking-wide">
                              {match.match.confidence}
                            </div>
                          </div>
                        </div>

                        <div className="flex-1 text-right">
                          <div className="font-semibold text-slate-900 mb-1">{match.prospect2.name}</div>
                          <div className="text-sm text-slate-600">Source: {match.prospect2.metadata?.source || 'unknown'}</div>
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-lg p-4">
                        <div className="text-sm text-slate-700">
                          <span className="font-medium">Match Method:</span> {match.match.method}
                        </div>
                        <div className="text-sm text-slate-600 mt-1">{match.match.details}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Raw Source Inspector</h2>

              <div className="space-y-4">
                {fusionData.items.slice(0, 10).map((item: any, idx: number) => (
                  <div key={idx} className="border border-slate-200 rounded-xl p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="font-semibold text-lg text-slate-900">{item.name}</div>
                        <div className="text-sm text-slate-600 mt-1">
                          Type: {item.type} | Score: {item.score}
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        item.score >= 70 ? 'bg-red-100 text-red-700' :
                        item.score >= 50 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {item.score >= 70 ? 'HOT' : item.score >= 50 ? 'WARM' : 'COLD'}
                      </div>
                    </div>

                    {item.metadata && (
                      <div className="bg-slate-50 rounded-lg p-4">
                        <pre className="text-xs text-slate-700 overflow-auto max-h-48">
                          {JSON.stringify(item.metadata, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
