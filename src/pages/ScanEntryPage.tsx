import { useState, useRef } from 'react';
import { ArrowLeft, Upload, FileText, Image as ImageIcon, Facebook, Shield, Menu, Sparkles, Linkedin, Twitter, Instagram, TrendingUp, MessageSquare, FileImage, Link2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSmartScanner } from '../hooks/useSmartScanner';
import { useAnalytics } from '../hooks/useAnalytics';
import SmartnessMeter from '../components/SmartnessMeter';
import UploadTile from '../components/UploadTile';
import ScanManagementModal from '../components/ScanManagementModal';
import { supabase } from '../lib/supabase';
import { scanningEngineV3 } from '../services/scanning/scanningEngineV3';
import { isValidSocialURL, detectPlatform } from '../services/scrapeCreatorsClient';

interface ScanEntryPageProps {
  onBack: () => void;
  onNavigate: (page: string, options?: any) => void;
}

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  preview?: string;
  size: number;
}

export default function ScanEntryPage({ onBack, onNavigate }: ScanEntryPageProps) {
  const { profile, user } = useAuth();
  const { trackEvent } = useAnalytics();
  const {
    smartness,
    recentScans,
    isUploading,
    uploadProgress,
    error,
    uploadScreenshots,
    uploadFiles,
    uploadText,
    refreshRecentScans
  } = useSmartScanner();

  const [selectedFiles, setSelectedFiles] = useState<UploadedFile[]>([]);
  const [showManagementModal, setShowManagementModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [generatingFromBatch, setGeneratingFromBatch] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [isScanningURL, setIsScanningURL] = useState(false);

  const screenshotInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleScreenshotClick = () => {
    trackEvent('scanner_upload_screenshot_clicked');
    screenshotInputRef.current?.click();
  };

  const handleFileClick = () => {
    trackEvent('scanner_upload_file_clicked');
    fileInputRef.current?.click();
  };

  const handleSocialClick = (platform: string) => {
    trackEvent('scanner_social_clicked', { platform });
    if (profile?.subscription_tier === 'free') {
      onNavigate('pricing');
    } else {
      alert(`${platform} integration coming soon!`);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>, type: 'screenshot' | 'file') => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const uploadedFiles: UploadedFile[] = await Promise.all(
      files.map(async (file) => {
        const preview = file.type.startsWith('image/')
          ? await readFileAsDataURL(file)
          : undefined;

        return {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: file.type,
          preview,
          size: file.size
        };
      })
    );

    setSelectedFiles(uploadedFiles);
    trackEvent('scanner_files_selected', { count: files.length, type });

    const result = type === 'screenshot'
      ? await uploadScreenshots(files)
      : await uploadFiles(files);

    if (result) {
      // If there's a scanId, navigate to the scan processing page
      if (result.scanId) {
        onNavigate('scan-processing', { scanId: result.scanId });
        return;
      }

      setSuccessMessage(result.message);
      setSelectedFiles([]);
      setTimeout(() => setSuccessMessage(null), 3000);
      trackEvent('scanner_batch_uploaded', { type, batchId: result.batchId });
    }

    if (event.target) {
      event.target.value = '';
    }
  };

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  };

  const handleGenerateFromBatch = async (batchId: string, type: 'messages' | 'deck' | 'prospects') => {
    if (!user) return;

    setGeneratingFromBatch(batchId);
    trackEvent('scanner_generate_clicked', { batchId, type });

    try {
      const { data: batch } = await supabase
        .from('uploaded_batches')
        .select('*')
        .eq('id', batchId)
        .single();

      if (!batch) throw new Error('Batch not found');

      const itemData = {
        user_id: user.id,
        title: `Generated from ${batch.source_type}`,
        content: JSON.stringify({ batchId, sourceType: batch.source_type }),
        status: 'processing',
        tags: ['processing', batch.source_type],
        category: type === 'messages' ? 'message_sequence' : type === 'deck' ? 'pitch_deck' : 'prospect_list',
        metadata: { generatedFromBatch: batchId }
      };

      await supabase.from('library_items').insert(itemData);

      setSuccessMessage(`${type === 'messages' ? 'Messages' : type === 'deck' ? 'Pitch deck' : 'Prospects'} added to library (Processing)`);
      setTimeout(() => setSuccessMessage(null), 3000);

      setTimeout(() => {
        onNavigate('library');
      }, 1500);
    } catch (err: any) {
      console.error('Generate error:', err);
    } finally {
      setGeneratingFromBatch(null);
    }
  };

  const handleRescan = async (scanId: string) => {
    trackEvent('scanner_rescan_clicked', { scanId });
    alert('Rescan functionality coming soon!');
  };

  const handleDeleteScan = async (scanId: string) => {
    try {
      await supabase.from('uploaded_batches').delete().eq('id', scanId);
      refreshRecentScans();
      trackEvent('scanner_delete_clicked', { scanId });
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleShareScan = (scanId: string) => {
    trackEvent('scanner_share_clicked', { scanId });
    alert('Share functionality coming soon!');
  };

  const handleScanURL = async () => {
    if (!urlInput.trim() || !user) return;

    if (!isValidSocialURL(urlInput)) {
      setSuccessMessage('Please enter a valid social media URL (Facebook, Instagram, Twitter, LinkedIn, or TikTok)');
      setTimeout(() => setSuccessMessage(null), 3000);
      return;
    }

    setIsScanningURL(true);
    trackEvent('scanner_url_scan_started', { url: urlInput, platform: detectPlatform(urlInput) });

    try {
      const result = await scanningEngineV3.initiateScan(user.id, 'social_url', { url: urlInput });

      setSuccessMessage(`Scanning ${detectPlatform(urlInput)} page...`);
      setUrlInput('');

      setTimeout(() => {
        onNavigate('scan-processing', { scanId: result.scanId });
      }, 1000);
    } catch (err: any) {
      console.error('URL scan error:', err);
      setSuccessMessage('Failed to start scan. Please try again.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } finally {
      setIsScanningURL(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-20">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="flex items-center justify-center size-9 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <ArrowLeft className="size-5 text-gray-700" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Scan Prospects</h1>
                <p className="text-xs text-gray-600">Upload data to find hot leads</p>
              </div>
            </div>
            <button
              onClick={() => setShowManagementModal(true)}
              className="flex items-center justify-center size-9 hover:bg-gray-50 rounded-xl transition-colors"
            >
              <Menu className="size-5 text-gray-700" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
            <Sparkles className="size-5 text-green-600 shrink-0" />
            <p className="text-sm font-medium text-green-900">{successMessage}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
            <p className="text-sm font-medium text-red-900">{error}</p>
          </div>
        )}

        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-4 border border-blue-100">
          <div className="flex items-start gap-3">
            <div className="size-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
              <Shield className="size-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-sm">Your Data, Your Control</h3>
              <p className="text-xs text-gray-700 mt-0.5">
                NexScout only analyzes data you share. No hidden access.
              </p>
            </div>
          </div>
        </div>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">Upload Data Sources</h2>

          <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 border-2 border-purple-200 rounded-2xl p-5 mb-4 shadow-sm">
            <div className="flex items-start gap-3 mb-4">
              <div className="size-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0 shadow-md">
                <Link2 className="size-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-base">Scan a Social Media URL</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Paste any profile or post link to instantly extract prospects
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleScanURL()}
                  placeholder="https://facebook.com/profile... or https://linkedin.com/in/..."
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                  disabled={isScanningURL}
                />
                <button
                  onClick={handleScanURL}
                  disabled={!urlInput.trim() || isScanningURL}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 text-white text-sm font-bold rounded-xl hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isScanningURL ? (
                    <span className="flex items-center gap-2">
                      <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Scanning...
                    </span>
                  ) : (
                    'Scan Now'
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-gray-600">Supported:</span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 px-2 py-1 bg-white rounded-lg border border-gray-200">
                      <Facebook className="size-3.5 text-blue-600" />
                      <span className="text-xs font-medium text-gray-700">Facebook</span>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 bg-white rounded-lg border border-gray-200">
                      <Instagram className="size-3.5 text-pink-600" />
                      <span className="text-xs font-medium text-gray-700">Instagram</span>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 bg-white rounded-lg border border-gray-200">
                      <Twitter className="size-3.5 text-sky-500" />
                      <span className="text-xs font-medium text-gray-700">Twitter</span>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 bg-white rounded-lg border border-gray-200">
                      <Linkedin className="size-3.5 text-blue-700" />
                      <span className="text-xs font-medium text-gray-700">LinkedIn</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-gradient-to-b from-gray-50 to-white text-gray-500 font-medium">OR UPLOAD FILES</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleScreenshotClick}
              className="relative p-4 rounded-xl border-2 border-gray-200 bg-white hover:border-blue-500 hover:shadow-lg transition-all text-left group"
            >
              <div className="size-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <ImageIcon className="size-6 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm">Screenshots</h3>
              <p className="text-xs text-gray-600 mt-1">Social media, comments</p>
            </button>

            <button
              onClick={handleFileClick}
              className="relative p-4 rounded-xl border-2 border-gray-200 bg-white hover:border-green-500 hover:shadow-lg transition-all text-left group"
            >
              <div className="size-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Upload className="size-6 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm">Files</h3>
              <p className="text-xs text-gray-600 mt-1">CSV, exports, docs</p>
            </button>
          </div>

          <input
            ref={screenshotInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFileSelect(e, 'screenshot')}
            className="hidden"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt,.json"
            multiple
            onChange={(e) => handleFileSelect(e, 'file')}
            className="hidden"
          />
        </section>

        {isUploading && (
          <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="size-2 bg-blue-600 rounded-full animate-pulse" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-sm">Processing Data...</h3>
                <p className="text-xs text-gray-600">AI is analyzing and extracting insights</p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        <SmartnessMeter
          score={smartness.smartnessScore}
          level={smartness.level}
          subtitle={smartness.subtitle}
        />

        {recentScans.length > 0 && (
          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3">Generate from Recent Scans</h2>
            <div className="space-y-2">
              {recentScans.slice(0, 3).map((scan) => (
                <div key={scan.id} className="bg-white border border-gray-200 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="size-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        <FileImage className="size-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900">{scan.sourceType}</h4>
                        <p className="text-xs text-gray-600">{scan.fileCount} items</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleGenerateFromBatch(scan.id, 'messages')}
                      disabled={generatingFromBatch === scan.id}
                      className="px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-xs font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                      <MessageSquare className="size-3" />
                      Messages
                    </button>
                    <button
                      onClick={() => handleGenerateFromBatch(scan.id, 'deck')}
                      disabled={generatingFromBatch === scan.id}
                      className="px-3 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg text-xs font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                      <FileText className="size-3" />
                      Deck
                    </button>
                    <button
                      onClick={() => handleGenerateFromBatch(scan.id, 'prospects')}
                      disabled={generatingFromBatch === scan.id}
                      className="px-3 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg text-xs font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                      <TrendingUp className="size-3" />
                      Leads
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">Connect Social Media</h2>
          <UploadTile
            icon={Facebook}
            title="Facebook Page"
            description="Auto-pull insights from business page"
            onClick={() => handleSocialClick('Facebook')}
            locked={profile?.subscription_tier === 'free'}
            badge="Pro"
          />
          <div className="grid grid-cols-3 gap-2 mt-2">
            <button
              onClick={() => handleSocialClick('LinkedIn')}
              className="px-3 py-2 border border-gray-200 rounded-lg hover:border-blue-500 transition-all flex flex-col items-center gap-1"
            >
              <Linkedin className="size-5 text-blue-700" />
              <span className="text-xs font-medium text-gray-700">LinkedIn</span>
            </button>
            <button
              onClick={() => handleSocialClick('Twitter')}
              className="px-3 py-2 border border-gray-200 rounded-lg hover:border-blue-500 transition-all flex flex-col items-center gap-1"
            >
              <Twitter className="size-5 text-blue-500" />
              <span className="text-xs font-medium text-gray-700">Twitter</span>
            </button>
            <button
              onClick={() => handleSocialClick('Instagram')}
              className="px-3 py-2 border border-gray-200 rounded-lg hover:border-blue-500 transition-all flex flex-col items-center gap-1"
            >
              <Instagram className="size-5 text-pink-600" />
              <span className="text-xs font-medium text-gray-700">Instagram</span>
            </button>
          </div>
        </section>
      </main>

      <ScanManagementModal
        isOpen={showManagementModal}
        onClose={() => setShowManagementModal(false)}
        scans={recentScans}
        onRescan={handleRescan}
        onDelete={handleDeleteScan}
        onShare={handleShareScan}
        onView={(scanId) => {
          setShowManagementModal(false);
          onNavigate('scan-results', { batchId: scanId });
        }}
      />
    </div>
  );
}
