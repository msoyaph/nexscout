import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Loader2, FileText, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAnalytics } from '../hooks/useAnalytics';
import { useHeatmapTracker } from '../hooks/useHeatmapTracker';
import { useScanReadiness } from '../hooks/useScanReadiness';
import { supabase } from '../lib/supabase';
import ScanReadinessCard from '../components/scan/ScanReadinessCard';
import PipelineVisualizerV3 from '../components/results/PipelineVisualizerV3';

interface PasteTextScanPageProps {
  onBack: () => void;
  onNavigate: (page: string, options?: any) => void;
}

export default function PasteTextScanPage({ onBack, onNavigate }: PasteTextScanPageProps) {
  const { user } = useAuth();
  const { trackEvent } = useAnalytics();
  useHeatmapTracker({ pageName: 'paste_text_scan' });

  const {
    ready,
    loading: checkingReadiness,
    envIssues,
    serviceIssues,
    dbIssues,
    thirdPartyIssues,
    refresh,
  } = useScanReadiness();

  const [pastedText, setPastedText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [scanId, setScanId] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const pollScanStatus = async (id: string) => {
    const poll = async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        const token = session?.session?.access_token;

        if (!token) return;

        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scan-status-check?scanId=${id}`;
        const response = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setScanStatus(data);

          if (data.status === 'completed' || data.step === 'completed' || data.step === 'COMPLETED' || data.progress >= 100) {
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }

            setIsScanning(false);
            trackEvent('paste_text_scan_completed', {
              scanId: id,
              totalProspects: data.totalProspects,
            });

            console.log('Scan complete! Redirecting to results...', { scanId: id, status: data.status, step: data.step });

            setTimeout(() => {
              onNavigate('scan-results-3', { scanId: id });
            }, 1500);
          } else if (data.status === 'failed' || data.step === 'failed') {
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            setIsScanning(false);
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    poll();
    pollingIntervalRef.current = setInterval(poll, 2000);
  };

  const handleStartScan = async () => {
    if (!pastedText.trim() || !user || !ready) return;

    setError(null);
    setIsScanning(true);
    setScanStatus(null);

    try {
      trackEvent('paste_text_scan_started', {
        textLength: pastedText.length,
      });

      const { startTextScan } = await import('../services/scanner/scannerClient');
      const result = await startTextScan(pastedText, user.id);

      if (!result.success || !result.scanId) {
        throw new Error(result.error || 'Failed to start scan');
      }

      setScanId(result.scanId);
      pollScanStatus(result.scanId);
    } catch (err: any) {
      setError(err.message || 'Failed to start scan');
      setIsScanning(false);
      trackEvent('paste_text_scan_failed', { error: err.message });
    }
  };

  const wordCount = pastedText.trim().split(/\s+/).filter(Boolean).length;
  const charCount = pastedText.length;

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      <div className="bg-white border-b border-[#E4E6EB] sticky top-0 z-10">
        <div className="max-w-[620px] mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#F0F2F5] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#050505]" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#050505]">Paste Text Scan</h1>
            <p className="text-sm text-[#65676B]">Extract prospects from copied text</p>
          </div>
        </div>
      </div>

      <div className="max-w-[620px] mx-auto px-4 py-4 space-y-4">
        <ScanReadinessCard
          ready={ready}
          loading={checkingReadiness}
          envIssues={envIssues}
          serviceIssues={serviceIssues}
          dbIssues={dbIssues}
          thirdPartyIssues={thirdPartyIssues}
          onRefresh={refresh}
        />

        {isScanning && scanStatus && (
          <div className="bg-white rounded-2xl shadow-sm border border-[#E4E6EB] p-6">
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="w-6 h-6 text-[#1877F2] animate-spin" />
              <div>
                <h3 className="text-lg font-bold text-[#050505]">Processing Your Scan</h3>
                <p className="text-sm text-[#65676B]">Please wait while we analyze your prospects...</p>
              </div>
            </div>

            <PipelineVisualizerV3 currentStep={scanStatus.step || 'EXTRACTING_TEXT'} />

            <div className="mt-4 p-4 bg-[#F0F2F5] rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-[#050505]">Progress</span>
                <span className="text-sm font-bold text-[#1877F2]">{scanStatus.progress}%</span>
              </div>
              <div className="h-2 bg-white rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1877F2] rounded-full transition-all duration-300"
                  style={{ width: `${scanStatus.progress}%` }}
                />
              </div>
              {scanStatus.message && (
                <p className="text-xs text-[#65676B] mt-2">{scanStatus.message}</p>
              )}
            </div>

            {scanStatus.totalProspects > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-red-600">{scanStatus.hotCount}</div>
                  <div className="text-xs text-red-700">Hot</div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{scanStatus.warmCount}</div>
                  <div className="text-xs text-yellow-700">Warm</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-blue-600">{scanStatus.coldCount}</div>
                  <div className="text-xs text-blue-700">Cold</div>
                </div>
              </div>
            )}

            {(scanStatus.status === 'completed' || scanStatus.step === 'completed' || scanStatus.step === 'COMPLETED' || scanStatus.progress >= 100) && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <div>
                  <p className="text-sm font-bold text-green-900">Scan Complete!</p>
                  <p className="text-xs text-green-700">Redirecting to results...</p>
                </div>
              </div>
            )}
          </div>
        )}

        {ready && !isScanning && (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-[#E4E6EB] p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#F0F2F5] rounded-full flex items-center justify-center">
                  <FileText className="w-5 h-5 text-[#1877F2]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#050505]">Paste Your Data</h3>
                  <p className="text-sm text-[#65676B]">
                    Copy and paste names, contact info, or any text with prospect data
                  </p>
                </div>
              </div>

              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste your prospect list here...&#10;&#10;Examples:&#10;• Facebook friends list&#10;• Contact names and details&#10;• Messenger conversation exports&#10;• Any text containing names and information"
                className="w-full h-64 px-4 py-3 bg-[#F0F2F5] border border-[#E4E6EB] rounded-xl text-[#050505] placeholder-[#65676B] focus:outline-none focus:ring-2 focus:ring-[#1877F2] resize-none font-mono text-sm"
                disabled={isScanning}
              />

              <div className="flex items-center justify-between mt-3">
                <div className="text-xs text-[#65676B]">
                  {wordCount > 0 && (
                    <span>
                      {wordCount} words • {charCount} characters
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setPastedText('')}
                  className="text-xs font-semibold text-[#65676B] hover:text-[#1877F2] transition-colors"
                  disabled={!pastedText || isScanning}
                >
                  Clear
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h4 className="text-sm font-bold text-blue-900 mb-2">Tips for best results:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Include full names for better matching</li>
                <li>• Add context like interests, location, or occupation</li>
                <li>• Paste at least 10-20 names for meaningful insights</li>
                <li>• The AI will automatically detect and extract prospect information</li>
              </ul>
            </div>

            <button
              onClick={handleStartScan}
              disabled={!pastedText.trim() || isScanning}
              className="w-full bg-[#1877F2] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#166FE5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
              data-analytics-id="paste-text-scan-start"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Starting Scan...
                </>
              ) : (
                'Scan Now'
              )}
            </button>
          </>
        )}

        <div className="h-8" />
      </div>
    </div>
  );
}
