import React, { useState } from 'react';
import { ArrowLeft, Database, Users, Sparkles, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAnalytics } from '../../hooks/useAnalytics';
import { supabase } from '../../lib/supabase';
import TestDataCard from '../../components/admin/TestDataCard';

interface TestDataPageProps {
  onBack: () => void;
  onNavigate: (page: string, options?: any) => void;
}

export default function TestDataPage({ onBack, onNavigate }: TestDataPageProps) {
  const { user } = useAuth();
  const { trackEvent } = useAnalytics();

  const [scanType, setScanType] = useState<string>('paste_text');
  const [scanProspectCount, setScanProspectCount] = useState<number>(10);
  const [prospectCount, setProspectCount] = useState<number>(20);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isWiping, setIsWiping] = useState(false);
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGenerateScan = async () => {
    if (!user) return;

    setIsGenerating(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      trackEvent('test_data_generate_scan', { scanType, count: scanProspectCount });

      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;

      if (!token) throw new Error('Not authenticated');

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-test-data-generate`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          scanType,
          count: scanProspectCount,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate test data');
      }

      setSuccessMessage(
        `Generated ${data.generated} prospects: ${data.hot} hot, ${data.warm} warm, ${data.cold} cold`
      );

      setTimeout(() => {
        onNavigate('scan-results-3', { scanId: data.scanId });
      }, 2000);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to generate scan');
      trackEvent('test_data_generate_failed', { error: error.message });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleWipeTestData = async () => {
    if (!user) return;

    setIsWiping(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      trackEvent('test_data_wipe_started');

      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;

      if (!token) throw new Error('Not authenticated');

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-test-data-wipe`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to wipe test data');
      }

      setSuccessMessage(`Successfully deleted ${data.deleted} test data records`);
      setShowWipeConfirm(false);
      trackEvent('test_data_wiped', { deleted: data.deleted });
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to wipe test data');
      trackEvent('test_data_wipe_failed', { error: error.message });
    } finally {
      setIsWiping(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      <div className="bg-white border-b border-[#E4E6EB] sticky top-0 z-10">
        <div className="max-w-[1200px] mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#F0F2F5] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#050505]" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#050505]">🔥 Test Data Generator v1.0</h1>
            <p className="text-sm text-[#65676B]">Developer-only testing module</p>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 py-6 space-y-4">
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-700">{successMessage}</p>
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TestDataCard
            title="Generate Fake Scan Session"
            description="Create a complete scan with prospects, scores, and insights"
            icon={<Database className="w-6 h-6 text-[#1877F2]" />}
            isLoading={isGenerating}
          >
            <div>
              <label className="block text-sm font-semibold text-[#050505] mb-2">Scan Type</label>
              <select
                value={scanType}
                onChange={(e) => setScanType(e.target.value)}
                className="w-full px-4 py-2 bg-[#F0F2F5] border border-[#E4E6EB] rounded-xl text-[#050505] focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
                disabled={isGenerating}
              >
                <option value="paste_text">Paste Text</option>
                <option value="screenshot">Screenshot</option>
                <option value="csv">CSV Import</option>
                <option value="url">Social URL</option>
                <option value="browser_extension">Browser Extension</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#050505] mb-2">
                Number of Prospects ({scanProspectCount})
              </label>
              <input
                type="range"
                min="5"
                max="100"
                value={scanProspectCount}
                onChange={(e) => setScanProspectCount(parseInt(e.target.value))}
                className="w-full"
                disabled={isGenerating}
              />
              <div className="flex justify-between text-xs text-[#65676B] mt-1">
                <span>5</span>
                <span>50</span>
                <span>100</span>
              </div>
            </div>

            <button
              onClick={handleGenerateScan}
              disabled={isGenerating}
              className="w-full bg-[#1877F2] text-white py-3 rounded-xl font-bold hover:bg-[#166FE5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? 'Generating...' : 'Generate Scan'}
            </button>
          </TestDataCard>

          <TestDataCard
            title="Generate Fake Prospects Only"
            description="Create standalone prospects without a scan session"
            icon={<Users className="w-6 h-6 text-[#1877F2]" />}
          >
            <div>
              <label className="block text-sm font-semibold text-[#050505] mb-2">
                Number of Prospects ({prospectCount})
              </label>
              <input
                type="range"
                min="10"
                max="200"
                value={prospectCount}
                onChange={(e) => setProspectCount(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-[#65676B] mt-1">
                <span>10</span>
                <span>100</span>
                <span>200</span>
              </div>
            </div>

            <button
              className="w-full bg-[#1877F2] text-white py-3 rounded-xl font-bold hover:bg-[#166FE5] transition-colors opacity-50 cursor-not-allowed"
              disabled
            >
              Coming Soon
            </button>
          </TestDataCard>

          <TestDataCard
            title="Generate Full AI Insights"
            description="Create AI-generated pain points, interests, and persona tags"
            icon={<Sparkles className="w-6 h-6 text-[#1877F2]" />}
          >
            <div className="bg-[#F0F2F5] rounded-xl p-4">
              <p className="text-sm text-[#65676B] mb-2">AI Insights include:</p>
              <ul className="text-xs text-[#65676B] space-y-1">
                <li>• Pain points detection</li>
                <li>• Interest classification</li>
                <li>• Life events extraction</li>
                <li>• Persona clustering</li>
                <li>• ScoutScore explanation tags</li>
              </ul>
            </div>

            <button
              className="w-full bg-[#1877F2] text-white py-3 rounded-xl font-bold hover:bg-[#166FE5] transition-colors opacity-50 cursor-not-allowed"
              disabled
            >
              Coming Soon
            </button>
          </TestDataCard>

          <TestDataCard
            title="Destroy All Test Data"
            description="Permanently delete all test scans, prospects, and related data"
            icon={<Trash2 className="w-6 h-6 text-red-600" />}
            isDestructive
            isLoading={isWiping}
          >
            {!showWipeConfirm ? (
              <>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm text-red-700 mb-2 font-semibold">Warning:</p>
                  <p className="text-xs text-red-600">
                    This will permanently delete all test data including scans, prospects, scores, and insights.
                    Real user data will not be affected.
                  </p>
                </div>

                <button
                  onClick={() => setShowWipeConfirm(true)}
                  className="w-full bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-colors"
                  disabled={isWiping}
                >
                  Delete All Test Data
                </button>
              </>
            ) : (
              <>
                <div className="bg-red-100 border-2 border-red-300 rounded-xl p-4">
                  <p className="text-sm text-red-900 font-bold mb-2">Are you absolutely sure?</p>
                  <p className="text-xs text-red-700">
                    This action cannot be undone. All test data will be permanently deleted.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowWipeConfirm(false)}
                    className="flex-1 bg-[#F0F2F5] text-[#050505] py-3 rounded-xl font-bold hover:bg-[#E4E6EB] transition-colors"
                    disabled={isWiping}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleWipeTestData}
                    className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-colors"
                    disabled={isWiping}
                  >
                    {isWiping ? 'Deleting...' : 'Yes, Delete All'}
                  </button>
                </div>
              </>
            )}
          </TestDataCard>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h4 className="text-sm font-bold text-blue-900 mb-2">Developer Notes:</h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• All generated data is tagged with `isTestData: true`</li>
            <li>• Test scans are labeled as "Test Scan – [timestamp]"</li>
            <li>• Uses realistic Filipino names and business scenarios</li>
            <li>• Compatible with Scan Library, Results, and all prospect views</li>
            <li>• ScoutScores follow the same algorithm as real scans</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
