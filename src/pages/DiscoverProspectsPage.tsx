import { useState } from 'react';
import SlideInMenu from '../components/SlideInMenu';
import ActionPopup from '../components/ActionPopup';
import SettingsPage from './SettingsPage';
import LockedProspectCard from '../components/LockedProspectCard';
import PaywallModal from '../components/PaywallModal';
import SwipeCard from '../components/SwipeCard';
import { useSubscription } from '../hooks/useSubscription';
import { useAuth } from '../contexts/AuthContext';
import { SUBSCRIPTION_TIERS } from '../lib/subscriptionTiers';
import {
  Settings,
  Filter,
  Star,
  Lock,
  Bookmark,
  UserPlus,
  X,
  Home,
  Flame,
  PlusCircle,
  TrendingUp,
  MoreHorizontal,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  MessageSquare
} from 'lucide-react';

interface Prospect {
  id: number;
  name: string;
  image: string;
  title: string;
  company: string;
  score: number;
  platforms: string[];
  insights: Array<{
    text: string;
    type: 'hot' | 'warm' | 'cold';
  }>;
  tags: string[];
  badge: 'Hot Lead' | 'Warm Lead' | 'Good Lead';
  locked: boolean;
}

const prospects: Prospect[] = [
  {
    id: 1,
    name: 'Emma Rodriguez',
    image: 'https://randomuser.me/api/portraits/women/67.jpg',
    title: 'VP of Marketing',
    company: 'TechVentures Inc',
    score: 95,
    platforms: ['linkedin', 'twitter', 'email'],
    insights: [
      { text: 'Opened last 4 emails', type: 'hot' },
      { text: 'Engaged with pricing page 3x', type: 'hot' },
      { text: 'Budget cycle: Q1 2024', type: 'warm' },
    ],
    tags: ['Hot Lead', 'High Intent'],
    badge: 'Hot Lead',
    locked: false,
  },
  {
    id: 2,
    name: 'Michael Chen',
    image: 'https://randomuser.me/api/portraits/men/32.jpg',
    title: 'Director of Sales',
    company: 'GrowthHub Solutions',
    score: 88,
    platforms: ['linkedin', 'facebook'],
    insights: [
      { text: 'Viewed product demo twice', type: 'hot' },
      { text: 'Downloaded whitepaper', type: 'warm' },
      { text: 'Active on LinkedIn weekly', type: 'warm' },
    ],
    tags: ['Warm Lead', 'Decision Maker'],
    badge: 'Warm Lead',
    locked: false,
  },
  {
    id: 3,
    name: 'Sarah Thompson',
    image: 'https://randomuser.me/api/portraits/women/44.jpg',
    title: 'CEO & Founder',
    company: 'StartupLabs',
    score: 92,
    platforms: ['linkedin', 'twitter', 'email'],
    insights: [
      { text: 'Commented on your post', type: 'hot' },
      { text: 'Mutual connection introduced', type: 'hot' },
      { text: 'Looking to scale team', type: 'warm' },
    ],
    tags: ['Hot Lead', 'Warm Introduction'],
    badge: 'Hot Lead',
    locked: false,
  },
  {
    id: 4,
    name: 'David Martinez',
    image: 'https://randomuser.me/api/portraits/men/52.jpg',
    title: 'Head of Operations',
    company: 'Enterprise Corp',
    score: 85,
    platforms: ['linkedin', 'email'],
    insights: [
      { text: 'Opened 2 recent emails', type: 'warm' },
      { text: 'Visited website last week', type: 'warm' },
      { text: 'In target industry', type: 'cold' },
    ],
    tags: ['Warm Lead', 'Enterprise'],
    badge: 'Warm Lead',
    locked: false,
  },
  {
    id: 5,
    name: 'Jennifer Lee',
    image: 'https://randomuser.me/api/portraits/women/28.jpg',
    title: 'Product Manager',
    company: 'Innovation Labs',
    score: 90,
    platforms: ['linkedin', 'twitter'],
    insights: [
      { text: 'Engaged with 3 posts', type: 'hot' },
      { text: 'Requested product info', type: 'hot' },
      { text: 'Budget approved Q4', type: 'warm' },
    ],
    tags: ['Hot Lead', 'High Budget'],
    badge: 'Hot Lead',
    locked: false,
  },
  {
    id: 6,
    name: 'Locked Prospect',
    image: 'https://randomuser.me/api/portraits/men/65.jpg',
    title: 'Senior Executive',
    company: 'Fortune 500',
    score: 98,
    platforms: ['linkedin'],
    insights: [],
    tags: [],
    badge: 'Hot Lead',
    locked: true,
  },
];

interface DiscoverProspectsPageProps {
  onNavigateToHome?: () => void;
  onNavigateToPitchDeck?: () => void;
  onNavigateToMessageSequencer?: () => void;
  onNavigateToRealTimeScan?: () => void;
  onNavigateToDeepScan?: () => void;
}

export default function DiscoverProspectsPage({
  onNavigateToHome,
  onNavigateToPitchDeck,
  onNavigateToMessageSequencer,
  onNavigateToRealTimeScan,
  onNavigateToDeepScan
}: DiscoverProspectsPageProps) {
  const { profile } = useAuth();
  const { limits, tier } = useSubscription();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipedCount, setSwipedCount] = useState(0);
  const [selectedProspects, setSelectedProspects] = useState<number[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<string>('discover');
  const [showActionPopup, setShowActionPopup] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const dailyLimit = 5;
  const remainingSwipes = dailyLimit - swipedCount;

  const currentProspect = prospects[currentIndex];

  const handleSwipe = (action: 'skip' | 'save' | 'star' | 'connect') => {
    if (action === 'connect' || action === 'star') {
      setSelectedProspects([...selectedProspects, currentProspect.id]);
    }

    setSwipedCount(prev => prev + 1);

    if (currentIndex < prospects.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleSwipeLeft = () => handleSwipe('skip');
  const handleSwipeRight = () => handleSwipe('connect');
  const handleSwipeUp = () => handleSwipe('star');

  const getInsightColor = (type: string) => {
    if (type === 'hot') return 'bg-green-500';
    if (type === 'warm') return 'bg-amber-500';
    return 'bg-gray-400';
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  if (currentPage === 'settings') {
    return <SettingsPage onBack={() => setCurrentPage('discover')} />;
  }

  return (
    <div className="bg-white min-h-screen text-gray-900 relative overflow-hidden pb-28">
      <header className="px-6 pt-8 pb-4 flex items-center justify-between">
        <button
          onClick={onNavigateToHome}
          className="size-10 rounded-full bg-white flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
        >
          <ArrowLeft className="size-5 text-gray-900" />
        </button>
        <div className="text-center">
          <h1 className="text-lg font-semibold text-gray-900">Discover</h1>
          <p className="text-xs text-nexscout-blue font-medium">
            {remainingSwipes} free swipes left today
          </p>
        </div>
        <button className="size-10 rounded-full bg-white flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow">
          <Filter className="size-5 text-gray-900" />
        </button>
      </header>

      <main className="px-6 pt-4">
        <section className="relative h-[600px]">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute w-[90%] h-[520px] top-8">
              <div className="relative h-full">
                {currentIndex < prospects.length - 2 && (
                  <div className="absolute w-full h-full bg-gray-100 rounded-[28px] shadow-lg transform translate-y-8 scale-95">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/50 rounded-[28px]" />
                  </div>
                )}

                {currentIndex < prospects.length - 1 && (
                  <div className="absolute w-full h-full bg-gray-100 rounded-[28px] shadow-lg transform translate-y-4 scale-[0.97]">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/50 rounded-[28px]" />
                  </div>
                )}

                {currentProspect && (
                  <>
                    {currentIndex === 0 && (
                      <div className="absolute top-4 right-4 flex gap-2 z-20 pointer-events-none">
                        <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-md">
                          Swipe to sort prospects
                        </div>
                      </div>
                    )}

                    <SwipeCard
                      prospect={currentProspect}
                      onSwipeLeft={handleSwipeLeft}
                      onSwipeRight={handleSwipeRight}
                      onSwipeUp={handleSwipeUp}
                      isLocked={currentProspect.locked || currentIndex >= limits.visibleSwipeCards}
                      zIndex={10}
                      lockedContent={
                        <div className="h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-gray-100">
                          <div className="relative mb-6">
                            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-yellow-500 blur-2xl opacity-50 animate-pulse" />
                            <div className="relative size-20 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-2xl">
                              <Lock className="size-10 text-white" strokeWidth={2.5} />
                            </div>
                          </div>
                          <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            {tier === SUBSCRIPTION_TIERS.FREE ? 'Upgrade to See More' : 'Upgrade to Elite'}
                          </h2>
                          <p className="text-sm text-gray-600 text-center mb-6 max-w-xs">
                            {tier === SUBSCRIPTION_TIERS.FREE
                              ? 'Free users can see 1 prospect. Upgrade to Pro for unlimited prospects!'
                              : 'Unlock all prospects with Elite plan'}
                          </p>
                          <button
                            onClick={() => setShowPaywall(true)}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full font-semibold shadow-lg hover:shadow-xl transition-all"
                          >
                            Upgrade Now
                          </button>
                        </div>
                      }
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="fixed bottom-24 left-0 right-0 px-6">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <button
                onClick={handleSwipeLeft}
                disabled={currentProspect?.locked}
                className="size-16 rounded-full bg-red-500/10 flex items-center justify-center shadow-lg hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="size-8 text-red-600" />
              </button>
              <button
                onClick={() => handleSwipe('save')}
                disabled={currentProspect?.locked}
                className="size-16 rounded-full bg-nexscout-blue/10 flex items-center justify-center shadow-lg hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Bookmark className="size-8 text-nexscout-blue" />
              </button>
              <button
                onClick={handleSwipeUp}
                disabled={currentProspect?.locked}
                className="size-16 rounded-full bg-orange-500/10 flex items-center justify-center shadow-lg hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Flame className="size-8 text-orange-500" />
              </button>
              <button
                onClick={handleSwipeRight}
                disabled={currentProspect?.locked}
                className="size-16 rounded-full bg-green-500/10 flex items-center justify-center shadow-lg hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UserPlus className="size-8 text-green-600" />
              </button>
            </div>
            <div className="flex items-center justify-center gap-3 mt-4">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <ArrowLeft className="size-4" />
                <span>Pass</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <ArrowDown className="size-4" />
                <span>Save</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <ArrowUp className="size-4" />
                <span>HOT</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <ArrowRight className="size-4" />
                <span>Pipeline</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 w-full bg-white/95 backdrop-blur-xl border-t border-gray-200 z-50 shadow-lg">
        <div className="flex items-center justify-between px-6 h-[72px]">
          <button onClick={onNavigateToHome} className="flex flex-col items-center gap-1 text-gray-500 hover:text-gray-900 transition-colors">
            <Home className="size-6" />
            <span className="text-[10px] font-medium">Home</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-[#2563EB]">
            <Flame className="size-6" />
            <span className="text-[10px] font-medium">Discover</span>
          </button>
          <button
            onClick={() => onNavigate?.('chatbot-sessions')}
            className="relative -top-6 bg-[#1877F2] text-white size-14 rounded-full shadow-[0px_8px_24px_rgba(24,119,242,0.4)] flex items-center justify-center border-4 border-white transition-transform active:scale-95"
          >
            <MessageSquare className="size-7" />
          </button>
          <button className="flex flex-col items-center gap-1 text-gray-500 hover:text-gray-900 transition-colors">
            <TrendingUp className="size-6" />
            <span className="text-[10px] font-medium">Pipeline</span>
          </button>
          <button
            onClick={() => setMenuOpen(true)}
            className="flex flex-col items-center gap-1 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <MoreHorizontal className="size-6" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
        <ActionPopup
          isOpen={showActionPopup}
          onClose={() => setShowActionPopup(false)}
          onNavigateToPitchDeck={onNavigateToPitchDeck || (() => {})}
          onNavigateToMessageSequencer={onNavigateToMessageSequencer}
          onNavigateToRealTimeScan={onNavigateToRealTimeScan}
          onNavigateToDeepScan={onNavigateToDeepScan}
        />
      </nav>

      <SlideInMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={handleNavigate}
      />

      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        onUpgrade={() => {
          setShowPaywall(false);
          handleNavigate('pricing');
        }}
        feature="Unlimited Prospects"
        requiredTier={tier === SUBSCRIPTION_TIERS.FREE ? 'pro' : 'elite'}
        currentTier={tier}
      />
    </div>
  );
}
