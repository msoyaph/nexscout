import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Filter, Calendar, Flame, Heart, Snowflake, Image as ImageIcon, ChevronRight, MessageSquare, FileText, TrendingUp, ListIcon, Sparkles, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAnalytics } from '../hooks/useAnalytics';
import { getAllScans, Scan } from '../services/scanning/scanService';
import { formatDistanceToNow } from '../utils/dateUtils';
import ScanLibraryCard from '../components/ScanLibraryCard';
import { fixStuckScans } from '../services/scanning/fixStuckScans';

interface ScanLibraryPageProps {
  onBack: () => void;
  onNavigate: (page: string, options?: any) => void;
}

export default function ScanLibraryPage({ onBack, onNavigate }: ScanLibraryPageProps) {
  const { user } = useAuth();
  const { trackEvent } = useAnalytics();
  const [scans, setScans] = useState<Scan[]>([]);
  const [filteredScans, setFilteredScans] = useState<Scan[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'hot' | 'warm' | 'cold'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'prospects' | 'hot'>('recent');
  const [loading, setLoading] = useState(true);
  const [fixing, setFixing] = useState(false);

  useEffect(() => {
    trackEvent('scan_library_opened');
    loadScans();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [scans, searchQuery, filterType, sortBy]);

  const loadScans = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const allScans = await getAllScans(user.id);
      setScans(allScans);
    } catch (error) {
      console.error('Load scans error:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...scans];

    if (filterType !== 'all') {
      filtered = filtered.filter(scan => {
        if (filterType === 'hot') return scan.hotLeads > 0;
        if (filterType === 'warm') return scan.warmLeads > 0;
        if (filterType === 'cold') return scan.coldLeads > 0;
        return true;
      });
    }

    if (searchQuery) {
      filtered = filtered.filter(scan => {
        const query = searchQuery.toLowerCase();
        return (
          scan.id.toLowerCase().includes(query) ||
          new Date(scan.createdAt).toLocaleDateString().includes(query)
        );
      });
    }

    filtered.sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === 'prospects') {
        return (b.hotLeads + b.warmLeads + b.coldLeads) - (a.hotLeads + a.warmLeads + a.coldLeads);
      } else if (sortBy === 'hot') {
        return b.hotLeads - a.hotLeads;
      }
      return 0;
    });

    setFilteredScans(filtered);
  };

  const handleFixStuckScans = async () => {
    if (!user || fixing) return;

    setFixing(true);
    try {
      const fixedCount = await fixStuckScans(user.id);
      if (fixedCount > 0) {
        await loadScans();
        trackEvent('stuck_scans_fixed', { count: fixedCount });
      }
    } catch (error) {
      console.error('Fix stuck scans error:', error);
    } finally {
      setFixing(false);
    }
  };

  const handleScanClick = (scan: Scan) => {
    trackEvent('scan_library_item_clicked', { scanId: scan.id });

    if (scan.status === 'processing') {
      onNavigate('scan-processing', { scanId: scan.id });
    } else if (scan.status === 'completed') {
      onNavigate('scan-results-3', { scanId: scan.id });
    } else {
      onNavigate('scan-results-3', { scanId: scan.id });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <button
          onClick={onBack}
          className="mb-4 flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <ArrowLeft className="size-5" />
          <span className="font-semibold">Back</span>
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Scan Library</h1>
            <p className="text-blue-100">All your scan instances in one place</p>
          </div>
          <button
            onClick={handleFixStuckScans}
            disabled={fixing}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`size-4 ${fixing ? 'animate-spin' : ''}`} />
            <span className="text-sm font-semibold">{fixing ? 'Fixing...' : 'Fix Stuck'}</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search scans by date or ID..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-3 overflow-x-auto">
            <div className="flex items-center gap-2 shrink-0">
              <Filter className="size-4 text-gray-600" />
              <span className="text-sm font-semibold text-gray-700">Filter:</span>
            </div>
            {['all', 'hot', 'warm', 'cold'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type as any)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                  filterType === type
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {type === 'hot' && <Flame className="inline size-4 mr-1" />}
                {type === 'warm' && <Heart className="inline size-4 mr-1" />}
                {type === 'cold' && <Snowflake className="inline size-4 mr-1" />}
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 overflow-x-auto">
            <span className="text-sm font-semibold text-gray-700 shrink-0">Sort by:</span>
            {[
              { id: 'recent', label: 'Most Recent' },
              { id: 'prospects', label: 'Most Prospects' },
              { id: 'hot', label: 'Most Hot Leads' }
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => setSortBy(option.id as any)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                  sortBy === option.id
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="size-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading your scans...</p>
          </div>
        ) : filteredScans.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center">
            <ImageIcon className="size-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Scans Found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || filterType !== 'all'
                ? 'Try adjusting your filters'
                : 'Start your first scan to see it here'}
            </p>
            <button
              onClick={onBack}
              className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Start New Scan
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredScans.map((scan) => (
              <ScanLibraryCard
                key={scan.id}
                session={{
                  id: scan.id,
                  createdAt: scan.createdAt,
                  socialSources: [],
                  filesCount: scan.totalItems,
                  totalProspectsFound: scan.hotLeads + scan.warmLeads + scan.coldLeads,
                  hotCount: scan.hotLeads,
                  smartnessScoreAtScan: 0,
                  status: scan.status
                }}
                onClick={() => handleScanClick(scan)}
              />
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => onNavigate('scan-prospects-v25')}
        className="fixed bottom-6 right-6 size-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-2xl hover:shadow-3xl hover:scale-110 transition-all flex items-center justify-center z-50"
      >
        <Sparkles className="size-7" />
      </button>
    </div>
  );
}
