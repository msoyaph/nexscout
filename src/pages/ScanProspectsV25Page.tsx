import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, X, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAnalytics } from '../hooks/useAnalytics';
import { useHeatmapTracker } from '../hooks/useHeatmapTracker';
import { useScanRunner } from '../hooks/useScanRunner';
import { useAISmartness } from '../hooks/useAISmartness';
import { scanningClient } from '../services/ai/scanningClient';
import { supabase } from '../lib/supabase';
import ExtensionUtilityBar from '../components/scan/ExtensionUtilityBar';
import ScanURLCard from '../components/scan/ScanURLCard';
import ScanInputGrid from '../components/scan/ScanInputGrid';
import AISmartnessCompact from '../components/scan/AISmartnessCompact';
import RecentScansList from '../components/scan/RecentScansList';

interface ScanProspectsV25PageProps {
  onBack: () => void;
  onNavigate: (page: string, options?: any) => void;
}

export default function ScanProspectsV25Page({ onBack, onNavigate }: ScanProspectsV25PageProps) {
  const { user, profile } = useAuth();
  const { trackEvent } = useAnalytics();
  useHeatmapTracker({ pageName: 'scan_prospects' });

  const { startNewScan, isLoading: isScanStarting } = useScanRunner();
  const { smartness, refreshSmartness } = useAISmartness();

  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);
  const [showFilesModal, setShowFilesModal] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [pastedText, setPastedText] = useState('');
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    trackEvent('scan_prospects_v25_opened');
    loadRecentScans();
  }, []);

  const loadRecentScans = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('scans')
      .select('id, total_items, hot_leads, created_at, status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3);

    if (data) {
      setRecentScans(
        data.map((scan) => ({
          id: scan.id,
          totalItems: scan.total_items || 0,
          hotLeads: scan.hot_leads || 0,
          createdAt: scan.created_at,
          status: scan.status,
        }))
      );
    }
  };

  const handleDownloadExtension = () => {
    trackEvent('download_extension_clicked');
    window.open('https://chrome.google.com/webstore', '_blank');
  };

  const handleSetupGuide = () => {
    trackEvent('setup_guide_clicked');
    onNavigate('extension-setup');
  };

  const handleScanURL = async (url: string) => {
    if (!user) return;

    try {
      await startNewScan({
        sourceType: 'url',
        url,
        tags: ['social_url'],
      });

      const scanId = localStorage.getItem('nexscout_current_scan');
      if (scanId) {
        onNavigate('scan-processing', { scanId, sourceType: 'url' });
      }
    } catch (error) {
      console.error('Scan URL error:', error);
    }
  };

  const handleScreenshots = () => {
    trackEvent('screenshots_clicked');
    setShowScreenshotModal(true);
  };

  const handleFiles = () => {
    trackEvent('files_clicked');
    fileInputRef.current?.click();
  };

  const handlePasteText = () => {
    trackEvent('paste_text_clicked');
    setShowTextModal(true);
  };

  const handleConnectSocial = () => {
    trackEvent('connect_social_clicked');
    onNavigate('social-connect');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
    setShowFilesModal(true);
  };

  const handleUploadScreenshots = async () => {
    if (selectedFiles.length === 0 || !user) return;

    setUploading(true);
    try {
      await startNewScan({
        sourceType: 'screenshots',
        files: selectedFiles,
        tags: ['screenshots'],
      });

      const scanId = localStorage.getItem('nexscout_current_scan');

      setShowScreenshotModal(false);
      setSelectedFiles([]);
      setUploading(false);

      if (scanId) {
        setTimeout(() => {
          onNavigate('scan-processing', { scanId, sourceType: 'screenshots' });
        }, 100);
      }

      await refreshSmartness();
    } catch (error) {
      console.error('Upload error:', error);
      setUploading(false);
    }
  };

  const handleUploadFiles = async () => {
    if (selectedFiles.length === 0 || !user) return;

    setUploading(true);
    try {
      await startNewScan({
        sourceType: 'files',
        files: selectedFiles,
        tags: ['csv_files'],
      });

      const scanId = localStorage.getItem('nexscout_current_scan');

      setShowFilesModal(false);
      setSelectedFiles([]);
      setUploading(false);

      if (scanId) {
        setTimeout(() => {
          onNavigate('scan-processing', { scanId, sourceType: 'files' });
        }, 100);
      }

      await refreshSmartness();
    } catch (error) {
      console.error('Upload error:', error);
      setUploading(false);
    }
  };

  const handleSaveText = async () => {
    if (!pastedText.trim() || !user) return;

    setUploading(true);
    try {
      await startNewScan({
        sourceType: 'paste_text',
        rawText: pastedText,
        tags: ['pasted_text'],
      });

      const scanId = localStorage.getItem('nexscout_current_scan');

      setShowTextModal(false);
      setPastedText('');
      setUploading(false);

      if (scanId) {
        setTimeout(() => {
          onNavigate('scan-processing', { scanId, sourceType: 'paste_text' });
        }, 100);
      }

      await refreshSmartness();
    } catch (error) {
      console.error('Save text error:', error);
      setUploading(false);
    }
  };

  const handleViewScan = (scanId: string) => {
    trackEvent('recent_scan_clicked', { scanId });
    onNavigate('scan-results-3', { scanId });
  };

  const handleViewAllScans = () => {
    trackEvent('view_all_scans_clicked');
    onNavigate('scan-library');
  };

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
            <h1 className="text-xl font-bold text-[#050505]">Scan Prospects</h1>
            <p className="text-sm text-[#65676B]">Powered by NexScout AI Engine 2.0</p>
          </div>
        </div>
      </div>

      <div className="max-w-[620px] mx-auto px-4 py-4 space-y-4">
        <ExtensionUtilityBar onDownload={handleDownloadExtension} onSetupGuide={handleSetupGuide} />

        <ScanURLCard onScan={handleScanURL} />

        <div className="text-center py-2">
          <span className="text-sm font-semibold text-[#65676B] px-4 bg-[#F0F2F5] rounded-full py-2">
            OR Upload Files / Connect
          </span>
        </div>

        <ScanInputGrid
          onScreenshots={handleScreenshots}
          onFiles={handleFiles}
          onPasteText={handlePasteText}
          onConnectSocial={handleConnectSocial}
        />

        <AISmartnessCompact
          score={smartness.overall}
          precision={smartness.precision}
          speed={smartness.speed}
          learningDepth={smartness.learningDepth}
        />

        <RecentScansList scans={recentScans} onViewScan={handleViewScan} onViewAll={handleViewAllScans} />

        <div className="h-8" />
      </div>

      {showScreenshotModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-[#050505]">Upload Screenshots</h3>
              <button onClick={() => setShowScreenshotModal(false)} className="text-[#65676B] hover:text-[#050505]">
                <X className="w-6 h-6" />
              </button>
            </div>

            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))}
              className="w-full mb-4 text-sm text-[#65676B] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-[#1877F2] file:text-white file:font-semibold hover:file:bg-[#166FE5]"
            />

            {selectedFiles.length > 0 && (
              <p className="text-sm text-[#65676B] mb-4">{selectedFiles.length} file(s) selected</p>
            )}

            <button
              onClick={handleUploadScreenshots}
              disabled={selectedFiles.length === 0 || uploading}
              className="w-full bg-[#1877F2] text-white py-3 rounded-xl font-semibold hover:bg-[#166FE5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Start Scan'
              )}
            </button>
          </div>
        </div>
      )}

      {showFilesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-[#050505]">Upload Files</h3>
              <button onClick={() => setShowFilesModal(false)} className="text-[#65676B] hover:text-[#050505]">
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-sm text-[#65676B] mb-4">
              {selectedFiles.length} file(s) selected: {selectedFiles.map((f) => f.name).join(', ')}
            </p>

            <button
              onClick={handleUploadFiles}
              disabled={uploading}
              className="w-full bg-[#1877F2] text-white py-3 rounded-xl font-semibold hover:bg-[#166FE5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Start Scan'
              )}
            </button>
          </div>
        </div>
      )}

      {showTextModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-[#050505]">Paste Text</h3>
              <button onClick={() => setShowTextModal(false)} className="text-[#65676B] hover:text-[#050505]">
                <X className="w-6 h-6" />
              </button>
            </div>

            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste prospect data, contact lists, or any text containing names and information..."
              className="w-full h-48 px-4 py-3 bg-[#F0F2F5] border border-[#E4E6EB] rounded-xl text-[#050505] placeholder-[#65676B] focus:outline-none focus:ring-2 focus:ring-[#1877F2] resize-none mb-4"
            />

            <button
              onClick={handleSaveText}
              disabled={!pastedText.trim() || uploading}
              className="w-full bg-[#1877F2] text-white py-3 rounded-xl font-semibold hover:bg-[#166FE5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                'Start Scan'
              )}
            </button>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.json,.html,.txt"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
