import { useState } from 'react';
import { X, Search, Filter, Trash2, RefreshCw, Share2, FolderOpen, ChevronRight, MoreVertical, Calendar, Image, FileText, Type, Facebook } from 'lucide-react';
import { formatDistanceToNow } from '../utils/dateUtils';

interface Scan {
  id: string;
  sourceType: string;
  fileCount: number;
  createdAt: string;
  status: string;
  hotLeadsFound: number;
  metadata?: any;
}

interface ScanManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  scans: Scan[];
  onRescan: (scanId: string) => void;
  onDelete: (scanId: string) => void;
  onShare: (scanId: string) => void;
  onView: (scanId: string) => void;
}

export default function ScanManagementModal({
  isOpen,
  onClose,
  scans,
  onRescan,
  onDelete,
  onShare,
  onView
}: ScanManagementModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedScans, setSelectedScans] = useState<Set<string>>(new Set());
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);

  if (!isOpen) return null;

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'screenshot': return <Image className="size-5 text-blue-600" />;
      case 'file': return <FileText className="size-5 text-green-600" />;
      case 'text': return <Type className="size-5 text-purple-600" />;
      case 'fb': return <Facebook className="size-5 text-blue-700" />;
      default: return <FileText className="size-5 text-gray-600" />;
    }
  };

  const getSourceLabel = (sourceType: string) => {
    const labels: Record<string, string> = {
      screenshot: 'Screenshots',
      file: 'Files',
      text: 'Text',
      fb: 'Facebook'
    };
    return labels[sourceType] || 'Unknown';
  };

  const filteredScans = scans.filter(scan => {
    const matchesSearch = scan.metadata?.preview?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || scan.sourceType === filterType;
    return matchesSearch && matchesFilter;
  });

  const toggleSelectScan = (scanId: string) => {
    const newSelected = new Set(selectedScans);
    if (newSelected.has(scanId)) {
      newSelected.delete(scanId);
    } else {
      newSelected.add(scanId);
    }
    setSelectedScans(newSelected);
  };

  const handleBulkDelete = () => {
    if (confirm(`Delete ${selectedScans.size} selected scans?`)) {
      selectedScans.forEach(scanId => onDelete(scanId));
      setSelectedScans(new Set());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-4xl sm:rounded-3xl rounded-t-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Manage Scans</h2>
            <p className="text-sm text-gray-600 mt-1">{scans.length} total scans</p>
          </div>
          <button
            onClick={onClose}
            className="size-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <X className="size-5 text-gray-700" />
          </button>
        </div>

        <div className="p-6 border-b border-gray-200">
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search scans..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 flex items-center gap-2">
              <Filter className="size-4" />
              <span className="text-sm font-medium">Filter</span>
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {['all', 'screenshot', 'file', 'text', 'fb'].map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  filterType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type === 'all' ? 'All' : getSourceLabel(type)}
              </button>
            ))}
          </div>
        </div>

        {selectedScans.size > 0 && (
          <div className="px-6 py-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              {selectedScans.size} selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700"
              >
                Delete Selected
              </button>
              <button
                onClick={() => setSelectedScans(new Set())}
                className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6">
          {filteredScans.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="size-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No scans found</p>
              <p className="text-sm text-gray-500 mt-1">
                {searchQuery ? 'Try adjusting your search' : 'Upload some data to get started'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredScans.map(scan => (
                <div
                  key={scan.id}
                  className={`relative bg-white border-2 rounded-2xl p-4 transition-all ${
                    selectedScans.has(scan.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => toggleSelectScan(scan.id)}
                      className={`size-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors ${
                        selectedScans.has(scan.id)
                          ? 'border-blue-600 bg-blue-600'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {selectedScans.has(scan.id) && (
                        <svg className="size-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>

                    <div className="size-12 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center shrink-0">
                      {getSourceIcon(scan.sourceType)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {getSourceLabel(scan.sourceType)}
                          </h3>
                          <div className="flex items-center gap-3 text-xs text-gray-600 mt-1">
                            <span>{scan.fileCount} items</span>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <Calendar className="size-3" />
                              {formatDistanceToNow(scan.createdAt)}
                            </div>
                          </div>
                        </div>

                        <div className="relative">
                          <button
                            onClick={() => setShowActionMenu(showActionMenu === scan.id ? null : scan.id)}
                            className="size-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                          >
                            <MoreVertical className="size-4 text-gray-600" />
                          </button>

                          {showActionMenu === scan.id && (
                            <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-xl shadow-xl z-10 py-2 w-48">
                              <button
                                onClick={() => {
                                  onView(scan.id);
                                  setShowActionMenu(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3"
                              >
                                <FolderOpen className="size-4" />
                                View Details
                              </button>
                              <button
                                onClick={() => {
                                  onRescan(scan.id);
                                  setShowActionMenu(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3"
                              >
                                <RefreshCw className="size-4" />
                                Rescan Data
                              </button>
                              <button
                                onClick={() => {
                                  onShare(scan.id);
                                  setShowActionMenu(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3"
                              >
                                <Share2 className="size-4" />
                                Share
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('Delete this scan?')) {
                                    onDelete(scan.id);
                                    setShowActionMenu(null);
                                  }
                                }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-3"
                              >
                                <Trash2 className="size-4" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {scan.hotLeadsFound > 0 && (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                          <span>🔥</span>
                          {scan.hotLeadsFound} hot leads found
                        </div>
                      )}

                      <div className="mt-3">
                        <button
                          onClick={() => onView(scan.id)}
                          className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          View Results
                          <ChevronRight className="size-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
