import { useState, useEffect } from 'react';
import { ArrowLeft, Wallet, TrendingUp, Clock, Home, Users, MoreHorizontal, Check, MessageSquare, Crown, Share2, ChevronDown, ChevronUp, Search, Filter, X, Copy } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { walletService, CoinTransaction } from '../services/walletService';
import { supabase } from '../lib/supabase';
import SlideInMenu from '../components/SlideInMenu';
import ActionPopup from '../components/ActionPopup';
import NotificationBadge from '../components/NotificationBadge';
import { useNotificationCounts } from '../hooks/useNotificationCounts';

interface WalletPageProps {
  onBack: () => void;
  onNavigateToPurchase: () => void;
  onNavigate?: (page: string) => void;
  onNavigateToMore?: () => void;
}

export default function WalletPage({ onBack, onNavigateToPurchase, onNavigate, onNavigateToMore }: WalletPageProps) {
  const { profile, user, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showActionPopup, setShowActionPopup] = useState(false);
  const [ambassadorExpanded, setAmbassadorExpanded] = useState(false);
  const [ambassadorData, setAmbassadorData] = useState<any>(null);
  const [copiedReferralLink, setCopiedReferralLink] = useState(false);
  const [customUserId, setCustomUserId] = useState<string>('');
  const [copiedMainReferralLink, setCopiedMainReferralLink] = useState(false);
  
  // Filters
  const [typeFilter, setTypeFilter] = useState<'all' | 'earned' | 'spent' | 'purchased' | 'bonus' | 'ad_reward'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  
  const notificationCounts = useNotificationCounts();

  useEffect(() => {
    loadWalletData();
  }, [profile?.id]);

  // Reload when filters change
  useEffect(() => {
    if (profile?.id) {
      loadWalletData();
    }
  }, [typeFilter, dateFilter]);

  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel('coin_balance_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'coin_transactions',
          filter: `user_id=eq.${profile.id}`,
        },
        () => {
          loadWalletData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  const loadWalletData = async () => {
    if (!profile?.id) return;

    setLoading(true);
    try {
      await refreshProfile();
      
      // Load transactions (safe fallback with filters)
      try {
        const dateRange = getDateRange();
        const transactionData = await walletService.getTransactionHistory(
          profile.id, 
          50, // Load more for filtering
          typeFilter,
          dateRange,
          searchTerm
        );
        setTransactions(transactionData);
      } catch (txError) {
        console.error('Error loading transactions:', txError);
        setTransactions([]);
      }

      // Load ambassador data if exists
      if (user?.id) {
        try {
          const { data: ambassadorProfile } = await supabase
            .from('ambassador_profiles')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();
          
          setAmbassadorData(ambassadorProfile);
        } catch (error) {
          console.error('Error loading ambassador data:', error);
          setAmbassadorData(null);
        }
      }

      // Load custom user ID (chatbot_id) for referral link
      if (user?.id) {
        try {
          // First try to get from chatbot_links table
          const { data: chatbotLink } = await supabase
            .from('chatbot_links')
            .select('chatbot_id, custom_slug')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .maybeSingle();
          
          if (chatbotLink) {
            // For Pro users with custom slug, use custom_slug
            // Otherwise use chatbot_id (short ID like tu5828)
            if (profile?.subscription_tier === 'pro' && chatbotLink.custom_slug) {
              setCustomUserId(chatbotLink.custom_slug);
            } else {
              setCustomUserId(chatbotLink.chatbot_id);
            }
          } else {
            // Fallback: try to get unique_user_id from profiles
            const { data: profileData } = await supabase
              .from('profiles')
              .select('unique_user_id')
              .eq('id', user.id)
              .maybeSingle();
            
            if (profileData?.unique_user_id) {
              setCustomUserId(profileData.unique_user_id);
            }
          }
        } catch (error) {
          console.error('Error loading custom user ID:', error);
        }
      }
    } catch (error) {
      console.error('Error loading wallet data:', error);
      // Don't crash the whole page
    } finally {
      setLoading(false);
    }
  };

  // Removed: handleConvertToEnergy (coin-to-energy conversion deprecated)

  const handleCopyReferralLink = () => {
    if (!ambassadorData?.referral_code) return;
    
    const referralLink = `${window.location.origin}/signup?ref=${ambassadorData.referral_code}`;
    navigator.clipboard.writeText(referralLink);
    setCopiedReferralLink(true);
    setTimeout(() => setCopiedReferralLink(false), 2000);
  };

  const handleCopyMainReferralLink = () => {
    if (!customUserId) return;
    
    const referralLink = `${window.location.origin}/ref/${customUserId}`;
    
    navigator.clipboard.writeText(referralLink);
    setCopiedMainReferralLink(true);
    setTimeout(() => setCopiedMainReferralLink(false), 2000);
  };

  const getDateRange = (): { start: Date; end: Date } | undefined => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (dateFilter) {
      case 'today':
        return { start: today, end: now };
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return { start: weekAgo, end: now };
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return { start: monthAgo, end: now };
      case 'custom':
        if (customDateRange.start && customDateRange.end) {
          return {
            start: new Date(customDateRange.start),
            end: new Date(customDateRange.end),
          };
        }
        return undefined;
      default:
        return undefined;
    }
  };

  const handleTypeFilterChange = (type: typeof typeFilter) => {
    setTypeFilter(type);
    // Auto-reloads via useEffect
  };

  const handleDateFilterChange = (range: typeof dateFilter) => {
    setDateFilter(range);
    // Auto-reloads via useEffect
  };

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    // Manual reload with debounce
    setTimeout(() => {
      if (profile?.id) {
        loadWalletData();
      }
    }, 500);
  };

  const clearFilters = () => {
    setTypeFilter('all');
    setDateFilter('all');
    setSearchTerm('');
    setCustomDateRange({ start: '', end: '' });
    loadWalletData();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'earn': return '💰';
      case 'spend': return '💸';
      case 'bonus': return '🎁';
      case 'purchase': return '🛒';
      case 'ad_reward': return '📺';
      default: return '💵';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'earn': return 'Earned';
      case 'spend': return 'Spent';
      case 'bonus': return 'Bonus';
      case 'purchase': return 'Purchase';
      case 'ad_reward': return 'Ad Reward';
      default: return type;
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleNavigate = (page: string) => {
    if (page === 'home') {
      onBack();
    } else if (page === 'more') {
      if (onNavigateToMore) onNavigateToMore();
      else setMenuOpen(true);
    } else if (onNavigate) {
      onNavigate(page);
    }
    setActiveTab(page);
  };

  // Removed: getTierReward (old referral system, not used anymore)

  return (
    <div className="min-h-screen bg-[#F0F2F5] pb-20">
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 py-3 flex items-center justify-between">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">My Wallet</h1>
          <div className="w-9" />
        </div>
      </div>

      <div className="px-4 py-3 space-y-3">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Balance</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : (profile?.coin_balance || 0).toLocaleString()}
                </p>
              </div>
            </div>
            <button
              onClick={onNavigateToPurchase}
              className="px-4 py-2 bg-[#1877F2] text-white rounded-lg text-sm font-semibold hover:bg-[#166FE5] transition-colors"
            >
              Buy Coins
            </button>
          </div>
          <div className="text-xs text-gray-500 text-center">
            Coins • {profile?.subscription_tier || 'Free'} Plan
          </div>
        </div>

        {/* Referral Link Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Share2 className="w-5 h-5 text-[#1877F2]" />
            <h3 className="font-bold text-gray-900">Your Referral Link</h3>
          </div>
          
          <p className="text-xs text-gray-600 mb-3">
            Share this link to earn {profile?.subscription_tier === 'pro' ? 'commissions' : 'coins & energy'} from referrals
          </p>

          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <code className="flex-1 text-xs font-mono text-gray-900 truncate">
              {customUserId ? `${window.location.origin}/ref/${customUserId}` : 'Loading...'}
            </code>
            <button
              onClick={handleCopyMainReferralLink}
              disabled={!customUserId}
              className="p-2 hover:bg-gray-200 rounded transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Copy link"
            >
              {copiedMainReferralLink ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-gray-600" />
              )}
            </button>
          </div>

          {copiedMainReferralLink && (
            <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
              <Check className="w-3 h-3" />
              Link copied to clipboard!
            </p>
          )}
        </div>

        {/* Ambassador Program Card - Collapsible */}
        <div className="bg-gradient-to-br from-[#1877F2] to-[#0C63D4] rounded-lg shadow-lg text-white overflow-hidden">
          {/* Header - Always Visible */}
          <button
            onClick={() => setAmbassadorExpanded(!ambassadorExpanded)}
            className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold">💰 Ambassador Program</h3>
                <p className="text-sm text-white/90">
                  {profile?.subscription_tier === 'pro' ? 'Earn ₱649.50 + ₱194.85/mo per user!' : 'Earn 100 coins + 50 energy per user!'}
                </p>
              </div>
            </div>
            {ambassadorExpanded ? (
              <ChevronUp className="w-5 h-5 text-white shrink-0" />
            ) : (
              <ChevronDown className="w-5 h-5 text-white shrink-0" />
            )}
          </button>

          {/* Expandable Content */}
          {ambassadorExpanded && (
            <div className="px-5 pb-5 space-y-4 border-t border-white/10">
              {/* Benefits */}
              <div className="space-y-2 pt-4">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <span><strong>Referral Boss (Free):</strong> Earn 100 coins + 50 energy per Pro conversion</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center shrink-0">
                    <Crown className="w-3 h-3 text-yellow-900" />
                  </div>
                  <span><strong>Ambassador (Pro):</strong> Earn ₱649.50 + ₱194.85/month per Pro user!</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <span>Personal landing page + QR code</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <span>Real-time analytics dashboard</span>
                </div>
              </div>

              {/* Example Earnings */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <p className="text-xs text-white/80 mb-2 font-semibold">💡 Example: 10 Pro Referrals</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-white/70">Referral Boss:</p>
                    <p className="font-bold">1,000 coins + 500 energy</p>
                  </div>
                  <div>
                    <p className="text-white/70">Ambassador (Pro):</p>
                    <p className="font-bold text-yellow-300">₱6,495 + ₱1,949/mo!</p>
                    <p className="text-xs text-green-300">≈₱30k/year passive!</p>
                  </div>
                </div>
              </div>

              {/* Referral Link (If Already a Referral Boss/Ambassador) */}
              {ambassadorData?.referral_code && (
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 mb-3">
                  <p className="text-xs text-white/80 mb-2 font-semibold">📱 Your Referral Link</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white/20 px-3 py-2 rounded text-xs font-mono text-white truncate">
                      {window.location.origin}/signup?ref={ambassadorData.referral_code}
                    </code>
                    <button
                      onClick={handleCopyReferralLink}
                      className="p-2 bg-white/20 hover:bg-white/30 rounded transition-colors shrink-0"
                    >
                      {copiedReferralLink ? (
                        <Check className="w-4 h-4 text-green-300" />
                      ) : (
                        <Copy className="w-4 h-4 text-white" />
                      )}
                    </button>
                  </div>
                  {copiedReferralLink && (
                    <p className="text-xs text-green-300 mt-2 animate-fade-in">✅ Link copied! Share it to earn!</p>
                  )}
                </div>
              )}

              <button
                onClick={() => {
                  if (onNavigate) {
                    onNavigate('ambassador');
                  } else {
                    window.location.href = '/ambassador';
                  }
                }}
                className="w-full bg-white text-[#1877F2] py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                {ambassadorData 
                  ? 'View Full Dashboard' 
                  : (profile?.subscription_tier === 'pro' 
                    ? 'Join The Ambassador Referral Program' 
                    : 'Start as Referral Boss')}
              </button>
            </div>
          )}
        </div>

        {/* Recent Activity with Filters */}
        <div className="bg-white rounded-lg shadow-sm">
          {/* Header with Filter Toggle */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-900">Recent Activity</h3>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors text-sm"
              >
                <Filter className="w-4 h-4 text-gray-600" />
                <span className="text-xs font-medium text-gray-700">Filters</span>
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    loadWalletData();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 space-y-3">
              {/* Type Filter */}
              <div>
                <label className="text-xs font-medium text-gray-700 mb-2 block">Transaction Type</label>
                <div className="flex flex-wrap gap-2">
                  {['all', 'earned', 'spent', 'purchased', 'bonus', 'ad_reward'].map((type) => (
                    <button
                      key={type}
                      onClick={() => handleTypeFilterChange(type as typeof typeFilter)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        typeFilter === type
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {type === 'all' ? 'All' :
                       type === 'earned' ? '💰 Earned' :
                       type === 'spent' ? '💸 Spent' :
                       type === 'purchased' ? '🛒 Purchased' :
                       type === 'bonus' ? '🎁 Bonus' :
                       '📺 Ad Reward'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Filter */}
              <div>
                <label className="text-xs font-medium text-gray-700 mb-2 block">Date Range</label>
                <div className="flex flex-wrap gap-2">
                  {['all', 'today', 'week', 'month'].map((range) => (
                    <button
                      key={range}
                      onClick={() => handleDateFilterChange(range as typeof dateFilter)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        dateFilter === range
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {range === 'all' ? 'All Time' :
                       range === 'today' ? 'Today' :
                       range === 'week' ? 'This Week' :
                       'This Month'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {(typeFilter !== 'all' || dateFilter !== 'all' || searchTerm) && (
                <button
                  onClick={clearFilters}
                  className="w-full px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-300 transition-colors"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          )}

          {/* Transaction List */}
          <div className="divide-y divide-gray-100">
            {loading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-3 border-gray-300 border-t-[#1877F2] rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-gray-500">Loading...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-8 text-center">
                <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  {searchTerm || typeFilter !== 'all' || dateFilter !== 'all' 
                    ? 'No transactions match your filters' 
                    : 'No transactions yet'}
                </p>
                {(searchTerm || typeFilter !== 'all' || dateFilter !== 'all') && (
                  <button
                    onClick={clearFilters}
                    className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <>
                {transactions.map((tx) => (
                  <div key={tx.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          tx.amount > 0 ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          <span className="text-lg">{getTypeIcon(tx.transaction_type)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {tx.description || getTypeLabel(tx.transaction_type)}
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-gray-500">{formatDate(tx.created_at)}</p>
                            <span className="text-xs text-gray-400">•</span>
                            <span className={`text-xs font-medium ${
                              tx.amount > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {getTypeLabel(tx.transaction_type)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className={`text-sm font-bold ml-2 flex-shrink-0 ${
                        tx.amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount}
                      </p>
                    </div>
                  </div>
                ))}
                
                {/* Results Count */}
                <div className="px-4 py-2 bg-gray-50 text-center">
                  <p className="text-xs text-gray-500">
                    Showing {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 w-full bg-white/95 backdrop-blur-xl border-t border-[#E5E7EB] z-50 shadow-[0px_-8px_24px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between px-6 h-[72px]">
          <button
            onClick={() => handleNavigate('home')}
            className="flex flex-col items-center gap-1 text-[#6B7280]"
          >
            <Home className="size-6" />
            <span className="text-[10px] font-medium">Home</span>
          </button>
          <button
            onClick={() => handleNavigate('prospects')}
            className="flex flex-col items-center gap-1 text-[#6B7280] relative"
          >
            <div className="relative">
              <Users className="size-6" />
              <NotificationBadge count={notificationCounts.newProspects} />
            </div>
            <span className="text-[10px] font-medium">Prospects</span>
          </button>
          <button
            onClick={() => handleNavigate('chatbot-sessions')}
            className="relative -top-6 bg-[#1877F2] text-white size-14 rounded-full shadow-[0px_8px_24px_rgba(24,119,242,0.4)] flex items-center justify-center border-4 border-white transition-transform active:scale-95"
          >
            <MessageSquare className="size-7" />
            {notificationCounts.newChats > 0 && (
              <div className="absolute -top-1 -right-1 min-w-[20px] h-[20px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1.5 border-2 border-white shadow-sm">
                {notificationCounts.newChats > 99 ? '99+' : notificationCounts.newChats}
              </div>
            )}
          </button>
          <button
            onClick={() => handleNavigate('pipeline')}
            className="flex flex-col items-center gap-1 text-[#6B7280] relative"
          >
            <div className="relative">
              <TrendingUp className="size-6" />
              <NotificationBadge count={notificationCounts.pipelineUpdates} />
            </div>
            <span className="text-[10px] font-medium">Pipeline</span>
          </button>
          <button
            onClick={() => setMenuOpen(true)}
            className="flex flex-col items-center gap-1 text-[#6B7280]"
          >
            <MoreHorizontal className="size-6" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>

        <ActionPopup
          isOpen={showActionPopup}
          onClose={() => setShowActionPopup(false)}
          onNavigateToPitchDeck={() => onNavigate?.('pitch-deck')}
          onNavigateToMessageSequencer={() => onNavigate?.('message-sequencer')}
          onNavigateToRealTimeScan={() => onNavigate?.('real-time-scan')}
          onNavigateToDeepScan={() => onNavigate?.('deep-scan')}
        />
      </nav>

      <SlideInMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={(page) => {
          setMenuOpen(false);
          if (onNavigate) onNavigate(page);
        }}
      />
    </div>
  );
}
