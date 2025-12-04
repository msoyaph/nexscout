import { useState } from 'react';
import { Filter, X } from 'lucide-react';

interface CaptureFiltersProps {
  platforms: string[];
  captureTypes: string[];
  tags: string[];
  onFilterChange: (filters: {
    platforms: string[];
    captureTypes: string[];
    tags: string[];
    dateRange: number | null;
  }) => void;
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

export default function CaptureFilters({
  platforms: selectedPlatforms,
  captureTypes: selectedCaptureTypes,
  tags: selectedTags,
  onFilterChange,
}: CaptureFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localPlatforms, setLocalPlatforms] = useState<string[]>(selectedPlatforms);
  const [localCaptureTypes, setLocalCaptureTypes] = useState<string[]>(selectedCaptureTypes);
  const [localTags, setLocalTags] = useState<string[]>(selectedTags);
  const [dateRange, setDateRange] = useState<number | null>(null);

  function togglePlatform(platform: string) {
    const updated = localPlatforms.includes(platform)
      ? localPlatforms.filter((p) => p !== platform)
      : [...localPlatforms, platform];
    setLocalPlatforms(updated);
  }

  function toggleCaptureType(type: string) {
    const updated = localCaptureTypes.includes(type)
      ? localCaptureTypes.filter((t) => t !== type)
      : [...localCaptureTypes, type];
    setLocalCaptureTypes(updated);
  }

  function applyFilters() {
    onFilterChange({
      platforms: localPlatforms,
      captureTypes: localCaptureTypes,
      tags: localTags,
      dateRange,
    });
    setIsOpen(false);
  }

  function clearFilters() {
    setLocalPlatforms([]);
    setLocalCaptureTypes([]);
    setLocalTags([]);
    setDateRange(null);
    onFilterChange({
      platforms: [],
      captureTypes: [],
      tags: [],
      dateRange: null,
    });
  }

  const activeFilterCount =
    localPlatforms.length + localCaptureTypes.length + localTags.length + (dateRange ? 1 : 0);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors relative"
      >
        <Filter className="size-5" />
        <span className="font-medium">Filters</span>
        {activeFilterCount > 0 && (
          <span className="absolute -top-1 -right-1 size-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {activeFilterCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center">
          <div className="bg-white w-full md:max-w-2xl md:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Filters</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="size-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Date Range
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDateRange(1)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      dateRange === 1
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setDateRange(7)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      dateRange === 7
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    7 Days
                  </button>
                  <button
                    onClick={() => setDateRange(30)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      dateRange === 30
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    30 Days
                  </button>
                  <button
                    onClick={() => setDateRange(null)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      dateRange === null
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All Time
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Platform</label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map((platform) => (
                    <button
                      key={platform}
                      onClick={() => togglePlatform(platform)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        localPlatforms.includes(platform)
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
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Capture Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {CAPTURE_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => toggleCaptureType(type)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        localCaptureTypes.includes(type)
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {type.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={clearFilters}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={applyFilters}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
