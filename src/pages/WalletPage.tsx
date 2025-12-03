import { useState, useEffect } from 'react';
import { ArrowLeft, Wallet, Zap, TrendingUp, Clock, Home, Users, MoreHorizontal, Gift, Copy, Check, PlusCircle, MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useEnergy } from '../contexts/EnergyContext';
import { walletService, CoinTransaction } from '../services/walletService';
import { referralService } from '../services/referralService';
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
  const { currentEnergy, maxEnergy, purchaseEnergyWithCoins, refreshEnergy } = useEnergy();
  const [activeTab, setActiveTab] = useState('home');
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [convertingEnergy, setConvertingEnergy] = useState(false);
  const [referralData, setReferralData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [showActionPopup, setShowActionPopup] = useState(false);
  const notificationCounts = useNotificationCounts();

  useEffect(() => {
    loadWalletData();
  }, [profile?.id]);

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
      await refreshEnergy();
      const transactionData = await walletService.getTransactionHistory(profile.id, 10, 'all');
      setTransactions(transactionData);

      if (user?.id) {
        const refData = await referralService.getReferralStats(user.id);
        setReferralData(refData);
      }
    } catch (error) {
      console.error('Error loading wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToEnergy = async (energyAmount: number) => {
    setConvertingEnergy(true);
    try {
      console.log('=== WALLET: Starting energy conversion ===');
      console.log('Amount:', energyAmount);
      console.log('Current Energy:', currentEnergy);
      console.log('Max Energy:', maxEnergy);
      console.log('Coin Balance:', profile?.coin_balance);

      const success = await purchaseEnergyWithCoins(energyAmount);

      console.log('=== WALLET: Conversion result:', success ? 'SUCCESS' : 'FAILED', '===');

      if (success) {
        alert(`✅ Success! Converted to +${energyAmount} energy`);
        await loadWalletData();
      } else {
        alert('❌ Conversion failed.\n\nPlease open browser console (F12) and share the [ENERGY] logs with support.');
      }
    } catch (error) {
      console.error('=== WALLET: Exception during conversion ===', error);
      alert('❌ An error occurred.\n\nPlease open browser console (F12) and share the error logs.');
    } finally {
      setConvertingEnergy(false);
    }
  };

  const handleCopyReferralCode = async () => {
    if (!referralData?.referral_code) return;

    try {
      await navigator.clipboard.writeText(referralData.referral_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying:', error);
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

  const getTierReward = (tier: string): number => {
    const rewards: Record<string, number> = {
      free: 100,
      pro: 50,
      elite: 100,
      team: 350,
      enterprise: 10000
    };
    return rewards[tier] || 100;
  };

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

        {referralData && (
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <Gift className="w-5 h-5 text-green-600" />
              <h3 className="text-sm font-semibold text-gray-900">Referral Rewards</h3>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 mb-3">
              <p className="text-xs text-gray-600 mb-2">Your Referral Code</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white px-3 py-2 rounded text-sm font-mono font-bold text-gray-900">
                  {referralData.referral_code}
                </code>
                <button
                  onClick={handleCopyReferralCode}
                  className="p-2 bg-white rounded hover:bg-gray-50 transition-colors"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-lg font-bold text-gray-900">{referralData.total_referrals || 0}</p>
                <p className="text-xs text-gray-500">Referrals</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-lg font-bold text-green-600">+{referralData.total_earnings || 0}</p>
                <p className="text-xs text-gray-500">Coins Earned</p>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center">
                Earn <span className="font-bold text-green-600">+{getTierReward(profile?.subscription_tier || 'free')}</span> coins per referral
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              <h3 className="text-sm font-semibold text-gray-900">Energy Converter</h3>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Current</p>
              <p className="text-sm font-bold text-gray-900">{currentEnergy} / {maxEnergy}</p>
            </div>
          </div>

          <div className="text-xs text-gray-500 mb-3">
            Rate: 10 coins = 1 energy
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleConvertToEnergy(1)}
              disabled={convertingEnergy || (profile?.coin_balance || 0) < 10 || currentEnergy >= maxEnergy}
              className="bg-gradient-to-br from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 disabled:from-gray-200 disabled:to-gray-300 disabled:cursor-not-allowed text-white rounded-lg p-3 transition-all flex flex-col items-center"
            >
              <Zap className="w-4 h-4 mb-1" />
              <p className="text-xs font-bold">+1</p>
              <p className="text-[10px] opacity-80">10 coins</p>
            </button>
            <button
              onClick={() => handleConvertToEnergy(5)}
              disabled={convertingEnergy || (profile?.coin_balance || 0) < 50 || currentEnergy >= maxEnergy}
              className="bg-gradient-to-br from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 disabled:from-gray-200 disabled:to-gray-300 disabled:cursor-not-allowed text-white rounded-lg p-3 transition-all flex flex-col items-center"
            >
              <Zap className="w-4 h-4 mb-1" />
              <p className="text-xs font-bold">+5</p>
              <p className="text-[10px] opacity-80">50 coins</p>
            </button>
            <button
              onClick={() => handleConvertToEnergy(10)}
              disabled={convertingEnergy || (profile?.coin_balance || 0) < 100 || currentEnergy >= maxEnergy}
              className="bg-gradient-to-br from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 disabled:from-gray-200 disabled:to-gray-300 disabled:cursor-not-allowed text-white rounded-lg p-3 transition-all flex flex-col items-center"
            >
              <Zap className="w-4 h-4 mb-1" />
              <p className="text-xs font-bold">+10</p>
              <p className="text-[10px] opacity-80">100 coins</p>
            </button>
          </div>

          {currentEnergy >= maxEnergy && (
            <p className="text-xs text-center text-gray-500 mt-2">Energy at max capacity</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Recent Activity</h3>
              <Clock className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {loading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-3 border-gray-300 border-t-[#1877F2] rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-gray-500">Loading...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-8 text-center">
                <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No transactions yet</p>
              </div>
            ) : (
              transactions.slice(0, 8).map((tx) => (
                <div key={tx.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        tx.amount > 0 ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        <TrendingUp className={`w-5 h-5 ${
                          tx.amount > 0 ? 'text-green-600' : 'text-red-600 rotate-180'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {tx.description || tx.transaction_type}
                        </p>
                        <p className="text-xs text-gray-500">{formatDate(tx.created_at)}</p>
                      </div>
                    </div>
                    <p className={`text-sm font-bold ml-2 flex-shrink-0 ${
                      tx.amount > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </p>
                  </div>
                </div>
              ))
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
