import { useState, useEffect } from 'react';
import { ArrowLeft, List, Layers, TrendingUp, Flame, Calendar, Image as ImageIcon, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAnalytics } from '../hooks/useAnalytics';
import { getScan, Scan } from '../services/scanning/scanService';
import { formatDistanceToNow } from '../utils/dateUtils';
import SwipeCard from '../components/SwipeCard';
import ProspectResultCard from '../components/ProspectResultCard';
import ProspectDetailTabs from '../components/ProspectDetailTabs';

interface ScanResultsViewerPageProps {
  scanId: string;
  onBack: () => void;
  onNavigate: (page: string, options?: any) => void;
}

export default function ScanResultsViewerPage({ scanId, onBack, onNavigate }: ScanResultsViewerPageProps) {
  const { user } = useAuth();
  const { trackEvent } = useAnalytics();
  const [scan, setScan] = useState<Scan | null>(null);
  const [prospects, setProspects] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'swipe'>('list');
  const [currentSwipeIndex, setCurrentSwipeIndex] = useState(0);
  const [selectedProspect, setSelectedProspect] = useState<SessionProspect | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trackEvent('scan_results_viewed', { scanId });
    loadScanData();
  }, [scanId]);

  const loadScanData = async () => {
    setLoading(true);
    try {
      const scanData = await getScan(scanId);
      setScan(scanData);
      setProspects([]);
    } catch (error) {
      console.error('Load scan data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwipeLeft = () => {
    trackEvent('prospect_swiped_left', { scanId, prospectId: prospects[currentSwipeIndex]?.id });
    if (currentSwipeIndex < prospects.length - 1) {
      setCurrentSwipeIndex(currentSwipeIndex + 1);
    }
  };

  const handleSwipeRight = () => {
    trackEvent('prospect_added_to_pipeline', { scanId, prospectId: prospects[currentSwipeIndex]?.id });
    if (currentSwipeIndex < prospects.length - 1) {
      setCurrentSwipeIndex(currentSwipeIndex + 1);
    }
  };

  const handleSwipeUp = () => {
    const prospect = prospects[currentSwipeIndex];
    trackEvent('prospect_message_from_swipe', { scanId, prospectId: prospect?.id });
    onNavigate('messaging-hub');
  };

  const handleGenerateMessage = (prospect: any) => {
    trackEvent('generate_message_from_scan', { scanId, prospectId: prospect.id });
    onNavigate('messaging-hub');
  };

  const handleGenerateDeck = (prospect: any) => {
    trackEvent('generate_deck_from_scan', { scanId, prospectId: prospect.id });
    onNavigate('ai-pitch-deck');
  };

  const handleAddToPipeline = (prospect: any) => {
    trackEvent('add_to_pipeline_from_scan', { scanId, prospectId: prospect.id });
    onNavigate('pipeline');
  };

  const handleSaveToLibrary = (prospect: any) => {
    trackEvent('save_prospect_from_scan', { scanId, prospectId: prospect.id });
  };

  const handleRescore = (prospect: any) => {
    trackEvent('prospect_rescored', { scanId, prospectId: prospect.id });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="size-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading scan results...</p>
        </div>
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Scan Not Found</h2>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <button
          onClick={() => selectedProspect ? setSelectedProspect(null) : onBack()}
          className="mb-4 flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <ArrowLeft className="size-5" />
          <span className="font-semibold">{selectedProspect ? 'Back to Results' : 'Back'}</span>
        </button>

        <h1 className="text-3xl font-bold mb-2">Scan Results</h1>
        <p className="text-blue-100">{formatDistanceToNow(scan.createdAt)}</p>
      </div>

      {selectedProspect ? (
        <div className="max-w-4xl mx-auto p-6">
          <ProspectDetailTabs
            prospect={{
              name: selectedProspect.prospectName,
              summary: `${selectedProspect.prospectName} was identified with a ScoutScore of ${selectedProspect.scoreSnapshot}/100.`,
              personality: selectedProspect.personalityTraits,
              painPoints: selectedProspect.painPoints,
              suggestedMessages: []
            }}
            onGenerateDeck={() => handleGenerateDeck(selectedProspect)}
            onGenerateMessage={() => handleGenerateMessage(selectedProspect)}
          />
        </div>
      ) : (
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white rounded-3xl p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Scan Summary</h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 rounded-2xl p-4">
                <Calendar className="size-5 text-gray-600 mb-2" />
                <p className="text-xs text-gray-600">Scanned</p>
                <p className="text-lg font-bold text-gray-900">
                  {new Date(scan.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="bg-blue-50 rounded-2xl p-4">
                <ImageIcon className="size-5 text-blue-600 mb-2" />
                <p className="text-xs text-blue-600">Total Items</p>
                <p className="text-lg font-bold text-blue-600">{scan.totalItems}</p>
              </div>
              <div className="bg-orange-50 rounded-2xl p-4">
                <Flame className="size-5 text-orange-600 mb-2" />
                <p className="text-xs text-orange-600">Hot Leads</p>
                <p className="text-lg font-bold text-orange-600">{scan.hotLeads}</p>
              </div>
              <div className="bg-green-50 rounded-2xl p-4">
                <TrendingUp className="size-5 text-green-600 mb-2" />
                <p className="text-xs text-green-600">Total Prospects</p>
                <p className="text-lg font-bold text-green-600">{scan.hotLeads + scan.warmLeads + scan.coldLeads}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sources Used</p>
                <div className="flex items-center gap-2 mt-1">
                  {scan.sources && Object.keys(scan.sources).length > 0 ? (
                    Object.keys(scan.sources).map((source, idx) => (
                      <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                        {source}
                      </span>
                    ))
                  ) : (
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                      Manual Upload
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">
              {prospects.length} Prospects Found
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setViewMode('list');
                  trackEvent('view_mode_changed', { mode: 'list' });
                }}
                className={`px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <List className="size-4" />
                List
              </button>
              <button
                onClick={() => {
                  setViewMode('swipe');
                  trackEvent('view_mode_changed', { mode: 'swipe' });
                }}
                className={`px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                  viewMode === 'swipe'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Layers className="size-4" />
                Swipe
              </button>
            </div>
          </div>

          {viewMode === 'list' ? (
            <div className="grid gap-4 md:grid-cols-2">
              {prospects.map((prospect) => (
                <button
                  key={prospect.id}
                  onClick={() => setSelectedProspect(prospect)}
                  className="text-left"
                >
                  <ProspectResultCard
                    prospect={prospect}
                    onGenerateMessage={() => handleGenerateMessage(prospect)}
                    onGenerateDeck={() => handleGenerateDeck(prospect)}
                    onAddToPipeline={() => handleAddToPipeline(prospect)}
                    onSaveToLibrary={() => handleSaveToLibrary(prospect)}
                    onRescore={() => handleRescore(prospect)}
                  />
                </button>
              ))}
            </div>
          ) : (
            <div className="relative h-[600px]">
              {prospects.length > 0 && currentSwipeIndex < prospects.length ? (
                <div className="relative w-full h-full">
                  {prospects.slice(currentSwipeIndex, currentSwipeIndex + 3).map((prospect, idx) => {
                    const prospectIndex = currentSwipeIndex + idx;
                    return (
                      <SwipeCard
                        key={prospect.id}
                        prospect={{
                          id: prospectIndex,
                          name: prospect.prospectName,
                          image: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?w=400',
                          title: 'Prospect',
                          company: 'Company',
                          score: prospect.scoreSnapshot,
                          platforms: [prospect.sourcePlatform || 'manual'],
                          insights: prospect.painPoints.map(p => ({ text: p, type: prospect.bucketSnapshot })),
                          tags: [prospect.bucketSnapshot.toUpperCase()]
                        }}
                        onSwipeLeft={idx === 0 ? handleSwipeLeft : undefined}
                        onSwipeRight={idx === 0 ? handleSwipeRight : undefined}
                        onSwipeUp={idx === 0 ? handleSwipeUp : undefined}
                        style={{
                          transform: `scale(${1 - idx * 0.05}) translateY(${idx * 20}px)`,
                          opacity: 1 - idx * 0.3
                        }}
                        zIndex={prospects.length - idx}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full bg-white rounded-3xl">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">All Done!</h3>
                    <p className="text-gray-600 mb-6">You've reviewed all prospects</p>
                    <button
                      onClick={() => setViewMode('list')}
                      className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 transition-colors"
                    >
                      View as List
                    </button>
                  </div>
                </div>
              )}

              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-full px-6 py-3 shadow-lg">
                <p className="text-sm font-bold text-gray-900">
                  {currentSwipeIndex + 1} / {prospects.length}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
