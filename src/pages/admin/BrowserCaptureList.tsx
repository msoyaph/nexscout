import { useState, useEffect } from 'react';
import { ArrowLeft, Filter, Search, Calendar, Download } from 'lucide-react';
import {
  fetchBrowserCaptures,
  getCaptureStatistics,
  BrowserCapture,
  CaptureFilters,
} from '../../services/browserCaptureService';

interface BrowserCaptureListProps {
  onBack: () => void;
  onNavigate: (page: string, options?: any) => void;
}

const PLATFORMS = ['facebook', 'instagram', 'linkedin', 'twitter', 'tiktok', 'other'];
const CAPTURE_TYPES = [
  'friends_list',
  'group_members',
  'profile',
  'post',
  'comments',
  'messages',
  'custom',
];

const PLATFORM_COLORS: Record<string, string> = {
  facebook: 'bg-blue-500 text-white',
  instagram: 'bg-pink-500 text-white',
  linkedin: 'bg-blue-700 text-white',
  twitter: 'bg-sky-500 text-white',
  tiktok: 'bg-black text-white',
  other: 'bg-gray-500 text-white',
};

export default function BrowserCaptureList({ onBack, onNavigate }: BrowserCaptureListProps) {
  const [captures, setCaptures] = useState<BrowserCapture[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<CaptureFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statistics, setStatistics] = useState<any>(null);

  const pageSize = 50;

  useEffect(() => {
    loadCaptures();
    loadStatistics();
  }, [page, filters]);

  async function loadCaptures() {
    setLoading(true);
    try {
      const result = await fetchBrowserCaptures(
        { ...filters, searchQuery },
        pageSize,
        page * pageSize
      );
      setCaptures(result.captures);
      setTotal(result.total);
    } catch (error) {
      console.error('Failed to load captures:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadStatistics() {
    try {
      const stats = await getCaptureStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  }

  function handleSearch() {
    setPage(0);
    loadCaptures();
  }

  function togglePlatformFilter(platform: string) {
    setFilters((prev) => {
      const platforms = prev.platform || [];
      const updated = platforms.includes(platform)
        ? platforms.filter((p) => p !== platform)
        : [...platforms, platform];
      return { ...prev, platform: updated.length > 0 ? updated : undefined };
    });
    setPage(0);
  }

  function toggleCaptureTypeFilter(type: string) {
    setFilters((prev) => {
      const types = prev.captureType || [];
      const updated = types.includes(type) ? types.filter((t) => t !== type) : [...types, type];
      return { ...prev, captureType: updated.length > 0 ? updated : undefined };
    });
    setPage(0);
  }

  function setDateRange(days: number) {
    const endDate = new Date().toISOString();
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    setFilters((prev) => ({ ...prev, startDate, endDate }));
    setPage(0);
  }

  function clearFilters() {
    setFilters({});
    setSearchQuery('');
    setPage(0);
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  function truncateText(text: string | null, maxLength: number): string {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity"
        >
          <ArrowLeft className="size-5" />
          <span className="font-semibold">Back to Dashboard</span>
        </button>

        <h1 className="text-3xl font-bold mb-2">Browser Captures</h1>
        <p className="text-blue-100">Chrome Extension data from all users</p>

        {statistics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="text-sm text-blue-100">Total Captures</p>
              <p className="text-2xl font-bold">{statistics.totalCaptures}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="text-sm text-blue-100">Last 24 Hours</p>
              <p className="text-2xl font-bold">{statistics.recentCaptureCount}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="text-sm text-blue-100">Top Platform</p>
              <p className="text-xl font-bold capitalize">
                {Object.keys(statistics.capturesByPlatform).sort(
                  (a, b) => statistics.capturesByPlatform[b] - statistics.capturesByPlatform[a]
                )[0] || 'N/A'}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="text-sm text-blue-100">Top Type</p>
              <p className="text-xl font-bold capitalize">
                {Object.keys(statistics.capturesByType)
                  .sort((a, b) => statistics.capturesByType[b] - statistics.capturesByType[a])[0]
                  ?.replace(/_/g, ' ') || 'N/A'}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by URL or text content..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <Filter className="size-5" />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="border-t border-gray-200 pt-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date Range
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDateRange(1)}
                    className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setDateRange(7)}
                    className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm"
                  >
                    Last 7 Days
                  </button>
                  <button
                    onClick={() => setDateRange(30)}
                    className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm"
                  >
                    Last 30 Days
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Platform
                </label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map((platform) => (
                    <button
                      key={platform}
                      onClick={() => togglePlatformFilter(platform)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filters.platform?.includes(platform)
                          ? PLATFORM_COLORS[platform]
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Capture Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {CAPTURE_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => toggleCaptureTypeFilter(type)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filters.captureType?.includes(type)
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {type.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Platform
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Tags
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Preview
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      Loading captures...
                    </td>
                  </tr>
                ) : captures.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No captures found
                    </td>
                  </tr>
                ) : (
                  captures.map((capture) => (
                    <tr key={capture.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(capture.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div>
                          <p className="font-medium text-gray-900">
                            {capture.profiles?.full_name || 'Unknown'}
                          </p>
                          <p className="text-gray-500 text-xs">{capture.profiles?.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            PLATFORM_COLORS[capture.platform] || PLATFORM_COLORS.other
                          }`}
                        >
                          {capture.platform}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                          {capture.capture_type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {capture.tags.slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                            >
                              {tag.replace(/_/g, ' ')}
                            </span>
                          ))}
                          {capture.tags.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                              +{capture.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {truncateText(capture.text_content, 120)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() =>
                            onNavigate('admin-browser-capture-detail', { captureId: capture.id })
                          }
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, total)} of {total}{' '}
              captures
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={(page + 1) * pageSize >= total}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
