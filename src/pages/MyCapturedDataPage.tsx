import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Boxes, Menu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fetchBrowserCaptures, BrowserCapture, CaptureFilters as FilterType } from '../services/browserCaptureService';
import CaptureCard from '../components/capture/CaptureCard';
import CaptureFilters from '../components/capture/CaptureFilters';
import SlideInMenu from '../components/SlideInMenu';

interface MyCapturedDataPageProps {
  onBack: () => void;
  onNavigate: (page: string, options?: any) => void;
}

export default function MyCapturedDataPage({ onBack, onNavigate }: MyCapturedDataPageProps) {
  const { profile } = useAuth();
  const [captures, setCaptures] = useState<BrowserCapture[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterType>({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const pageSize = 20;

  useEffect(() => {
    loadCaptures(true);
  }, [filters]);

  async function loadCaptures(reset = false) {
    if (!profile) return;

    setLoading(true);
    try {
      const currentPage = reset ? 0 : page;
      const result = await fetchBrowserCaptures(
        {
          ...filters,
          userId: profile.id,
          searchQuery: searchQuery || undefined,
          startDate: filters.startDate,
          endDate: filters.endDate,
        },
        pageSize,
        currentPage * pageSize
      );

      if (reset) {
        setCaptures(result.captures);
        setPage(0);
      } else {
        setCaptures((prev) => [...prev, ...result.captures]);
      }

      setHasMore(result.captures.length === pageSize);
    } catch (error) {
      console.error('Failed to load captures:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch() {
    loadCaptures(true);
  }

  function handleFilterChange(newFilters: {
    platforms: string[];
    captureTypes: string[];
    tags: string[];
    dateRange: number | null;
  }) {
    const startDate = newFilters.dateRange
      ? new Date(Date.now() - newFilters.dateRange * 24 * 60 * 60 * 1000).toISOString()
      : undefined;
    const endDate = newFilters.dateRange ? new Date().toISOString() : undefined;

    setFilters({
      platform: newFilters.platforms.length > 0 ? newFilters.platforms : undefined,
      captureType: newFilters.captureTypes.length > 0 ? newFilters.captureTypes : undefined,
      tags: newFilters.tags.length > 0 ? newFilters.tags : undefined,
      startDate,
      endDate,
    });
  }

  function loadMore() {
    setPage((p) => p + 1);
    loadCaptures(false);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <ArrowLeft className="size-5" />
            <span className="font-semibold">Back</span>
          </button>
          <button
            onClick={() => setMenuOpen(true)}
            className="size-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <Menu className="size-6" />
          </button>
        </div>

        <div className="flex items-center gap-3 mb-2">
          <Boxes className="size-8" />
          <h1 className="text-3xl font-bold">My Captured Data</h1>
        </div>
        <p className="text-blue-100">Your personal AI scanned library</p>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search captured content..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold"
            >
              Search
            </button>
            <CaptureFilters
              platforms={filters.platform || []}
              captureTypes={filters.captureType || []}
              tags={filters.tags || []}
              onFilterChange={handleFilterChange}
            />
          </div>
        </div>

        {loading && captures.length === 0 ? (
          <div className="text-center py-12">
            <div className="size-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading your captures...</p>
          </div>
        ) : captures.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Boxes className="size-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Captures Yet</h3>
            <p className="text-gray-600 mb-6">
              Start capturing data from social media using the NexScout Chrome Extension
            </p>
            <button
              onClick={() => onNavigate('scan-prospects-v25')}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold"
            >
              Go to Smart Scanner
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {captures.map((capture) => (
                <CaptureCard
                  key={capture.id}
                  id={capture.id}
                  platform={capture.platform}
                  captureType={capture.capture_type}
                  createdAt={capture.created_at}
                  tags={capture.tags}
                  textContent={capture.text_content}
                  onClick={() => onNavigate('capture-detail', { captureId: capture.id })}
                />
              ))}
            </div>

            {hasMore && (
              <div className="text-center">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="px-8 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <SlideInMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={(page) => {
          setMenuOpen(false);
          onNavigate(page);
        }}
      />
    </div>
  );
}
