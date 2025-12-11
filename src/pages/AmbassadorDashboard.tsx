import { useState, useEffect } from 'react';
import { 
  Copy, QrCode, TrendingUp, Users, Wallet, 
  ExternalLink, Check, Download, DollarSign,
  Gift, Zap, Crown, Share2, BarChart3, ArrowLeft
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import QRCode from 'qrcode';

interface AmbassadorStats {
  tier: 'referral_boss' | 'ambassador';
  referralCode: string;
  landingPageSlug: string | null;
  totalReferrals: number;
  activeReferrals: number;
  totalEarningsPhp: number;
  totalEarningsCoins: number;
  totalEarningsEnergy: number;
  conversionRate: number;
  pendingPayout: number;
}

interface Referral {
  id: string;
  referred_user_name: string;
  signed_up_at: string;
  converted_to_pro_at: string | null;
  status: string;
  first_month_commission: number;
  total_recurring_commission: number;
}

interface AmbassadorDashboardProps {
  onBack?: () => void;
  onNavigate?: (page: string) => void;
}

export default function AmbassadorDashboard({ onBack, onNavigate }: AmbassadorDashboardProps = {}) {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<AmbassadorStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [showQR, setShowQR] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const referralLink = stats?.referralCode 
    ? `${window.location.origin}/signup?ref=${stats.referralCode}`
    : '';

  const landingPageLink = stats?.landingPageSlug
    ? `${window.location.origin}/join/${stats.landingPageSlug}`
    : '';

  useEffect(() => {
    if (user) {
      loadDashboard();
    }
  }, [user]);

  const loadDashboard = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Load ambassador profile
      const { data: ambassador } = await supabase
        .from('ambassador_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (ambassador) {
        setStats({
          tier: ambassador.tier,
          referralCode: ambassador.referral_code,
          landingPageSlug: ambassador.landing_page_slug,
          totalReferrals: ambassador.total_referrals,
          activeReferrals: ambassador.active_referrals,
          totalEarningsPhp: ambassador.total_earnings_php,
          totalEarningsCoins: ambassador.total_earnings_coins,
          totalEarningsEnergy: ambassador.total_earnings_energy,
          conversionRate: ambassador.conversion_rate,
          pendingPayout: 0, // Will calculate from unpaid transactions
        });

        // Generate QR code
        if (ambassador.referral_code) {
          const link = `${window.location.origin}/signup?ref=${ambassador.referral_code}`;
          const qr = await QRCode.toDataURL(link, {
            width: 300,
            margin: 2,
            color: {
              dark: '#1E40AF',
              light: '#FFFFFF'
            }
          });
          setQrCodeUrl(qr);
        }
      }

      // Load referrals
      const { data: referralsData } = await supabase
        .from('referrals')
        .select(`
          id,
          referred_user_id,
          signed_up_at,
          converted_to_pro_at,
          status,
          first_month_commission_amount,
          total_recurring_commission,
          profiles:referred_user_id (
            full_name,
            email
          )
        `)
        .eq('referrer_id', user.id)
        .order('signed_up_at', { ascending: false });

      if (referralsData) {
        setReferrals(referralsData.map((r: any) => ({
          id: r.id,
          referred_user_name: r.profiles?.full_name || r.profiles?.email || 'Unknown',
          signed_up_at: r.signed_up_at,
          converted_to_pro_at: r.converted_to_pro_at,
          status: r.status,
          first_month_commission: r.first_month_commission_amount,
          total_recurring_commission: r.total_recurring_commission,
        })));
      }

      // Load transactions
      const { data: txData } = await supabase
        .from('commission_transactions')
        .select('*')
        .eq('ambassador_id', ambassador?.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (txData) {
        setTransactions(txData);
      }

    } catch (error) {
      console.error('Error loading ambassador dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadQR = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `nexscout-referral-${stats?.referralCode}.png`;
    link.click();
  };

  const handleRequestPayout = async () => {
    // TODO: Implement payout request
    alert('Payout request feature coming soon!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) {
    const isPro = profile?.subscription_tier === 'pro';
    
    // Handle onboarding - create ambassador profile
    const handleJoinNow = async () => {
      if (!user) return;

      try {
        // Generate referral code
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
          code += chars[Math.floor(Math.random() * chars.length)];
        }

        // Try using RPC function first (bypasses schema cache)
        const { data, error } = await supabase.rpc('create_ambassador_profile_direct', {
          p_user_id: user.id,
          p_referral_code: code,
          p_tier: isPro ? 'ambassador' : 'referral_boss'
        });

        if (error) {
          console.error('RPC error:', error);
          throw new Error('Please run ADD_AMBASSADOR_FUNCTION.sql in Supabase SQL Editor first, then try again.');
        }

        if (data && data.error) {
          throw new Error(data.error);
        }

        // Show onboarding page
        setShowOnboarding(true);
      } catch (error: any) {
        console.error('Error creating ambassador profile:', error);
        alert(error.message || 'Failed to join program. Please try again.');
      }
    };

    const handleBack = () => {
      if (onBack) {
        onBack();
      } else {
        window.history.back();
      }
    };

    // Show onboarding success page
    if (showOnboarding) {
      return (
        <div className="min-h-screen bg-[#F0F2F5] p-4">
          <div className="max-w-2xl mx-auto pt-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Success Header */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-center text-white">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-12 h-12 text-green-500" />
                </div>
                <h1 className="text-3xl font-bold mb-2">Welcome Aboard! 🎉</h1>
                <p className="text-lg opacity-90">
                  You're now {isPro ? 'an Ambassador' : 'a Referral Boss'}!
                </p>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="text-center mb-6">
                  <p className="text-gray-700 mb-2">Your ambassador journey starts now.</p>
                  <p className="text-sm text-gray-600">Let's get you set up for success!</p>
                </div>

                {/* Next Steps */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">
                      1
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Get Your Referral Link</p>
                      <p className="text-xs text-gray-600">View your dashboard to access your unique link</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">
                      2
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Share with Your Network</p>
                      <p className="text-xs text-gray-600">Post on social media, send to friends, or share your QR code</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">
                      3
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Start Earning!</p>
                      <p className="text-xs text-gray-600">Track your referrals and watch your earnings grow</p>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={() => {
                    if (onNavigate) {
                      onNavigate('ambassador');
                    } else {
                      window.location.reload();
                    }
                  }}
                  className="w-full bg-[#1877F2] text-white py-3 rounded-lg font-bold hover:bg-[#0C5DBE] transition-colors mb-3"
                >
                  View My Dashboard
                </button>

                <button
                  onClick={() => {
                    if (onNavigate) {
                      onNavigate('wallet');
                    } else {
                      window.location.href = '/wallet';
                    }
                  }}
                  className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                >
                  Go to Wallet
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="min-h-screen bg-[#F0F2F5] p-4">
        {/* Back Button */}
        <div className="max-w-2xl mx-auto mb-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Back</span>
          </button>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Main Card - Facebook Style */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-[#1877F2] rounded-full flex items-center justify-center">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {isPro ? 'Ambassador Program' : 'Referral Boss Program'}
                  </h1>
                  <p className="text-sm text-gray-600">
                    {isPro ? 'Earn cash commissions' : 'Earn coins & energy'}
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Earnings Highlight */}
              <div className="bg-gradient-to-r from-[#1877F2] to-[#0C5DBE] rounded-lg p-5 mb-6 text-white text-center">
                <p className="text-sm font-semibold mb-1">Potential Earnings</p>
                <p className="text-4xl font-bold mb-1">
                  {isPro ? '₱30,000+' : '10,000+'}
                </p>
                <p className="text-sm opacity-90">
                  {isPro ? 'per year in commissions' : 'coins per year'}
                </p>
              </div>

              {/* Benefits List */}
              <div className="space-y-3 mb-6">
                {isPro ? (
                  <>
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <DollarSign className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">50% First Month</p>
                        <p className="text-xs text-gray-600">Earn ₱649.50 per Pro referral</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">15% Recurring</p>
                        <p className="text-xs text-gray-600">Get ₱194.85 every month</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <ExternalLink className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">Personal Page</p>
                        <p className="text-xs text-gray-600">Branded landing page + QR code</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <BarChart3 className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">Live Analytics</p>
                        <p className="text-xs text-gray-600">Track performance real-time</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Gift className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">100 Coins</p>
                        <p className="text-xs text-gray-600">Per signup referral</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Zap className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">50 Energy Bonus</p>
                        <p className="text-xs text-gray-600">When they upgrade to Pro</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Share2 className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">Referral Link</p>
                        <p className="text-xs text-gray-600">Personal link + QR code</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Crown className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">Upgrade Path</p>
                        <p className="text-xs text-gray-600">Become Pro for cash earnings</p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Example Box */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-xs font-semibold text-green-900 mb-2">Example: 10 Referrals</p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Month 1:</span>
                  <span className="font-bold text-gray-900">{isPro ? '₱6,495' : '1,000 coins'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Month 6:</span>
                  <span className="font-bold text-gray-900">{isPro ? '₱11,444' : '2,500 coins'}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-green-200 mt-2 pt-2">
                  <span className="text-gray-600">Year 1:</span>
                  <span className="font-bold text-green-600">{isPro ? '₱30,327' : '10,000 coins'}</span>
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={handleJoinNow}
                className="w-full bg-[#1877F2] text-white py-3 rounded-lg font-bold hover:bg-[#0C5DBE] transition-colors"
              >
                {isPro ? 'Become an Ambassador Now' : 'Join as Referral Boss'}
              </button>

              <p className="text-center text-xs text-gray-500 mt-3">
                {isPro ? 'No fees • No quotas • Start earning today' : 'Free forever • No Pro required'}
              </p>
            </div>
          </div>

          {/* Info Footer */}
          <div className="text-center mt-4 text-xs text-gray-500">
            Questions? Email support@nexscout.com
          </div>
        </div>
      </div>
    );
  }

  const isAmbassador = stats.tier === 'ambassador';

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      {/* Header - Facebook Style */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <button
                onClick={handleBack}
                className="size-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors flex-shrink-0"
                aria-label="Go back"
              >
                <ArrowLeft className="size-5 text-gray-700" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isAmbassador ? 'Ambassador Dashboard' : 'Referral Boss Dashboard'}
                </h1>
                <p className="text-sm text-gray-600">
                  {isAmbassador ? 'Earn 50% + 15% recurring PHP commissions' : 'Earn coins & energy for referrals'}
                </p>
              </div>
            </div>
            {isAmbassador && (
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white">
                <Crown className="w-5 h-5" />
                <span className="font-bold">Pro Ambassador</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        {/* Stats Cards - Facebook Style */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Total Earnings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-600 font-medium">Total Earnings</p>
                {isAmbassador ? (
                  <p className="text-2xl font-bold text-gray-900">
                    ₱{stats.totalEarningsPhp.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </p>
                ) : (
                  <div className="flex gap-2">
                    <span className="text-lg font-bold text-yellow-600">{stats.totalEarningsCoins} 🪙</span>
                    <span className="text-lg font-bold text-blue-600">{stats.totalEarningsEnergy} ⚡</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Total Referrals */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">Total Referrals</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalReferrals}</p>
              </div>
            </div>
          </div>

          {/* Active Pro Users */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">Active Pro</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeReferrals}</p>
              </div>
            </div>
          </div>

          {/* Conversion Rate */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{(stats.conversionRate * 100).toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Referral Link Section - Facebook Style */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Share2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">Your Referral Link</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Referral Link */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Direct Referral Link</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={referralLink}
                  readOnly
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {copiedLink ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Landing Page Link */}
            {landingPageLink && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Personal Landing Page</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={landingPageLink}
                    readOnly
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                  />
                  <button
                    onClick={() => window.open(landingPageLink, '_blank')}
                    className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* QR Code */}
          <div className="mt-4 flex items-center gap-4">
            <button
              onClick={() => setShowQR(!showQR)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <QrCode className="w-4 h-4" />
              <span className="text-sm font-medium">{showQR ? 'Hide' : 'Show'} QR Code</span>
            </button>

            {showQR && qrCodeUrl && (
              <button
                onClick={handleDownloadQR}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">Download QR</span>
              </button>
            )}
          </div>

          {showQR && qrCodeUrl && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg inline-block">
              <img src={qrCodeUrl} alt="Referral QR Code" className="w-64 h-64" />
              <p className="text-xs text-gray-600 text-center mt-2">Scan to sign up via your referral</p>
            </div>
          )}
        </div>

        {/* Upgrade CTA for Referral Boss */}
        {!isAmbassador && (
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                <Crown className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">🚀 Upgrade to Ambassador (Pro Agent)</h3>
                <p className="text-white/90 mb-4">
                  As a Pro Ambassador, you'll earn <strong>PHP commissions</strong> instead of just coins!
                </p>
                
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <p className="text-sm text-white/80 mb-1">Current (Referral Boss)</p>
                    <p className="text-lg font-bold">100 coins + 50 energy</p>
                    <p className="text-xs text-white/70">Per Pro conversion</p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 border-2 border-white/30">
                    <p className="text-sm text-white/80 mb-1">As Ambassador (Pro)</p>
                    <p className="text-lg font-bold">₱649.50 + ₱194.85/month</p>
                    <p className="text-xs text-white/70">Per Pro conversion (50%+15%)</p>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-4">
                  <p className="text-sm font-bold mb-2">💰 Example: With 10 Pro Referrals</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-white/80">As Referral Boss:</p>
                      <p className="font-bold">1,000 coins + 500 energy</p>
                    </div>
                    <div>
                      <p className="text-white/80">As Ambassador:</p>
                      <p className="font-bold">₱6,495 + ₱1,948.50/month!</p>
                      <p className="text-xs text-green-300">= ₱30k/year recurring!</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => window.location.href = '/subscription'}
                  className="w-full md:w-auto px-8 py-3 bg-white text-purple-600 rounded-lg font-bold hover:bg-gray-100 transition-colors"
                >
                  Upgrade to Pro & Become Ambassador →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Referrals List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Your Referrals ({referrals.length})
            </h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {referrals.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p>No referrals yet. Share your link to start earning!</p>
              </div>
            ) : (
              referrals.map((ref) => (
                <div key={ref.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{ref.referred_user_name}</p>
                      <p className="text-xs text-gray-500">
                        Signed up {new Date(ref.signed_up_at).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {/* Status Badge */}
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        ref.status === 'active' ? 'bg-green-100 text-green-700' :
                        ref.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {ref.status === 'active' ? '✅ Pro User' :
                         ref.status === 'pending' ? '⏳ Free User' :
                         '❌ Churned'}
                      </span>

                      {/* Earnings */}
                      {isAmbassador && ref.status === 'active' && (
                        <div className="text-right">
                          <p className="text-sm font-bold text-green-600">
                            ₱{(ref.first_month_commission + ref.total_recurring_commission).toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">earned</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Transactions */}
        {isAmbassador && transactions.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-blue-600" />
                Transaction History
              </h2>
              {stats.totalEarningsPhp >= 500 && (
                <button
                  onClick={handleRequestPayout}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors text-sm"
                >
                  Request Payout (₱{stats.totalEarningsPhp.toFixed(2)})
                </button>
              )}
            </div>
            
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {transactions.map((tx) => (
                <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.transaction_type === 'clawback' ? 'bg-red-100' : 'bg-green-100'
                    }`}>
                      <DollarSign className={`w-5 h-5 ${
                        tx.transaction_type === 'clawback' ? 'text-red-600' : 'text-green-600'
                      }`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{tx.description}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <p className={`text-sm font-bold ${
                    tx.transaction_type === 'clawback' ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {tx.transaction_type === 'clawback' ? '-' : '+'}₱{tx.amount_php.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Minimum Payout Notice */}
        {isAmbassador && stats.totalEarningsPhp < 500 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Gift className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Minimum payout: ₱500
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  You need ₱{(500 - stats.totalEarningsPhp).toFixed(2)} more to request payout.
                  Keep referring to reach the minimum!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

