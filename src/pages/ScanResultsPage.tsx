import { useState, useEffect } from 'react';
import { ArrowLeft, Flame, ThermometerSun, Snowflake, Lock, Sparkles, ChevronRight } from 'lucide-react';
import { useProspects } from '../hooks/useScanning';
import { useAuth } from '../contexts/AuthContext';
import type { ProspectWithScore } from '../lib/types/scanning';

interface ScanResultsPageProps {
  onBack: () => void;
  onNavigate: (page: string, options?: any) => void;
  result?: any;
}

export default function ScanResultsPage({ onBack, onNavigate, result }: ScanResultsPageProps) {
  const { prospects, fetchTopProspects } = useProspects();
  const { profile } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | 'up' | 'down' | null>(null);

  useEffect(() => {
    fetchTopProspects(20);
  }, [fetchTopProspects]);

  const visibleProspects = prospects.slice(0, 5);
  const currentProspect = visibleProspects[currentIndex];

  const isLocked = (index: number) => {
    // No ads for Pro tier
    if (profile?.subscription_tier === 'pro') return false;
    if (profile?.subscription_tier === 'pro') return index > 9;
    return index > 1;
  };

  const handleSwipe = (direction: 'left' | 'right' | 'up' | 'down') => {
    setSwipeDirection(direction);

    setTimeout(() => {
      if (currentIndex < visibleProspects.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
      setSwipeDirection(null);
    }, 300);
  };

  const getBucketIcon = (bucket?: string) => {
    switch (bucket) {
      case 'hot':
        return <Flame className="size-5" />;
      case 'warm':
        return <ThermometerSun className="size-5" />;
      case 'cold':
        return <Snowflake className="size-5" />;
      default:
        return <Flame className="size-5" />;
    }
  };

  const getBucketColor = (bucket?: string) => {
    switch (bucket) {
      case 'hot':
        return 'from-red-500 to-orange-500';
      case 'warm':
        return 'from-amber-500 to-yellow-500';
      case 'cold':
        return 'from-blue-500 to-cyan-500';
      default:
        return 'from-gray-400 to-gray-500';
    }
  };

  if (!currentProspect) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="size-20 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto animate-pulse">
            <Sparkles className="size-10 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Loading prospects...</h2>
        </div>
      </div>
    );
  }

  const locked = isLocked(currentIndex);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-cyan-50">
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center justify-center size-10 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="size-5 text-gray-700" />
            </button>
            <div className="text-center">
              <h1 className="text-lg font-bold text-gray-900">Top Prospects Found</h1>
              <p className="text-xs text-gray-600">{currentIndex + 1} of {visibleProspects.length}</p>
            </div>
            <div className="size-10" />
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-6 py-8">
        <div className="mb-6 text-center">
          <p className="text-sm text-gray-700">
            Swipe to sort prospects into your pipeline
          </p>
          <div className="flex items-center justify-center gap-8 mt-4 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <div className="size-6 rounded-full bg-gray-100 flex items-center justify-center">←</div>
              <span>Pass</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="size-6 rounded-full bg-green-100 flex items-center justify-center">→</div>
              <span>Pipeline</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="size-6 rounded-full bg-red-100 flex items-center justify-center">↑</div>
              <span>HOT</span>
            </div>
          </div>
        </div>

        <div className="relative h-[500px]">
          {visibleProspects.slice(currentIndex, currentIndex + 4).reverse().map((prospect, stackIndex) => {
            const actualIndex = currentIndex + visibleProspects.length - currentIndex - stackIndex - 1;
            const isTop = stackIndex === visibleProspects.length - currentIndex - 1;
            const isLocked = actualIndex > 1 && profile?.subscription_tier === 'free';

            return (
              <div
                key={prospect.id}
                className={`absolute inset-0 transition-all duration-300 ${
                  isTop && swipeDirection
                    ? swipeDirection === 'left'
                      ? '-translate-x-full opacity-0 -rotate-12'
                      : swipeDirection === 'right'
                      ? 'translate-x-full opacity-0 rotate-12'
                      : swipeDirection === 'up'
                      ? '-translate-y-full opacity-0 scale-95'
                      : 'translate-y-full opacity-0 scale-95'
                    : ''
                }`}
                style={{
                  transform: `translateY(${stackIndex * 8}px) scale(${1 - stackIndex * 0.03}) rotate(${stackIndex * 2}deg)`,
                  zIndex: visibleProspects.length - stackIndex,
                }}
              >
                <div
                  className={`bg-white rounded-[30px] shadow-2xl border-2 ${
                    isLocked ? 'border-amber-300' : 'border-gray-100'
                  } h-full overflow-hidden relative`}
                >
                  {isLocked && (
                    <div className="absolute inset-0 backdrop-blur-md bg-white/60 z-10 flex items-center justify-center">
                      <div className="text-center space-y-4 p-6">
                        <div className="size-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto shadow-lg">
                          <Lock className="size-10 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Unlock this HOT prospect</h3>
                        <p className="text-sm text-gray-600">Use 50 coins or upgrade to Pro/Elite</p>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => onNavigate('unlock-modal', { prospect })}
                            className="px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-full font-bold hover:shadow-lg transition-all"
                          >
                            Unlock for 50 Coins
                          </button>
                          <button
                            onClick={() => onNavigate('pricing')}
                            className="px-6 py-3 bg-gradient-to-r from-[#1877F2] to-[#1EC8FF] text-white rounded-full font-bold hover:shadow-lg transition-all"
                          >
                            Upgrade to Pro/Elite
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="p-6 space-y-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="size-20 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-2xl">
                          {prospect.full_name.charAt(0)}
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-gray-900">{prospect.full_name}</h2>
                          <p className="text-sm text-gray-600">{prospect.username || `@${prospect.full_name.toLowerCase().replace(/\s+/g, '')}`}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                              {prospect.platform}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className={`flex flex-col items-end gap-2 ${isLocked ? 'blur-sm' : ''}`}>
                        <div className={`px-4 py-2 rounded-full bg-gradient-to-r ${getBucketColor(prospect.score?.bucket)} text-white font-bold flex items-center gap-2`}>
                          {getBucketIcon(prospect.score?.bucket)}
                          <span>{prospect.score?.scout_score || 0}</span>
                        </div>
                        <span className="text-xs font-medium text-gray-600 uppercase">
                          {prospect.score?.bucket || 'Unknown'}
                        </span>
                      </div>
                    </div>

                    <div className={`space-y-3 ${isLocked ? 'blur-sm' : ''}`}>
                      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-4 border border-blue-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="size-4 text-[#1877F2]" />
                          <h3 className="font-bold text-gray-900 text-sm">AI Insights</h3>
                        </div>
                        <p className="text-sm text-gray-700">
                          {prospect.score?.explanation_tags.join(' • ') || 'Analyzing prospect...'}
                        </p>
                      </div>

                      {prospect.profile?.dominant_topics && prospect.profile.dominant_topics.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-600 uppercase mb-2">Interests</h4>
                          <div className="flex flex-wrap gap-2">
                            {prospect.profile.dominant_topics.map((topic, i) => (
                              <span
                                key={i}
                                className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-700"
                              >
                                {topic}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {prospect.profile?.pain_points && prospect.profile.pain_points.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-600 uppercase mb-2">Pain Points</h4>
                          <div className="flex flex-wrap gap-2">
                            {prospect.profile.pain_points.map((pain, i) => (
                              <span
                                key={i}
                                className="px-3 py-1 bg-red-50 border border-red-200 rounded-full text-xs font-medium text-red-700"
                              >
                                {pain}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => onNavigate('prospect-detail', { prospect })}
                      disabled={isLocked}
                      className="w-full py-4 bg-gradient-to-r from-[#1877F2] to-[#1EC8FF] text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      View Full Analysis
                      <ChevronRight className="size-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {!locked && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => handleSwipe('left')}
              className="size-16 rounded-full bg-white border-2 border-gray-300 hover:border-gray-400 shadow-lg flex items-center justify-center transition-all hover:scale-110"
            >
              <svg className="size-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <button
              onClick={() => handleSwipe('up')}
              className="size-20 rounded-full bg-gradient-to-br from-red-500 to-orange-500 shadow-lg flex items-center justify-center transition-all hover:scale-110"
            >
              <Flame className="size-10 text-white" />
            </button>

            <button
              onClick={() => handleSwipe('right')}
              className="size-16 rounded-full bg-white border-2 border-green-300 hover:border-green-400 shadow-lg flex items-center justify-center transition-all hover:scale-110"
            >
              <svg className="size-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
