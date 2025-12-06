import { useState, useEffect } from 'react';
import {
  Users, DollarSign, TrendingUp, Crown, Search, Filter,
  MoreVertical, Check, X, AlertCircle, ExternalLink,
  Download, Upload, Mail, Ban, CheckCircle, Clock,
  Eye, Edit, UserPlus, Gift, Zap, BarChart3
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Ambassador {
  id: string;
  user_id: string;
  referral_code: string;
  tier: 'referral_boss' | 'ambassador';
  status: 'active' | 'pending' | 'suspended' | 'inactive';
  total_referrals: number;
  active_referrals: number;
  total_earnings_php: number;
  total_earnings_coins: number;
  total_earnings_energy: number;
  conversion_rate: number;
  last_payout_at: string | null;
  created_at: string;
  user_email: string;
  user_name: string;
  subscription_tier: string;
}

interface Stats {
  totalAmbassadors: number;
  totalReferralBosses: number;
  activeAmbassadors: number;
  totalEarningsPaid: number;
  totalReferrals: number;
  avgConversionRate: number;
}

export default function AmbassadorManagement() {
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
  const [filteredAmbassadors, setFilteredAmbassadors] = useState<Ambassador[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalAmbassadors: 0,
    totalReferralBosses: 0,
    activeAmbassadors: 0,
    totalEarningsPaid: 0,
    totalReferrals: 0,
    avgConversionRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | 'ambassador' | 'referral_boss'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'suspended'>('all');
  const [selectedAmbassador, setSelectedAmbassador] = useState<Ambassador | null>(null);
  const [showManualOnboard, setShowManualOnboard] = useState(false);

  // Manual onboard form
  const [onboardEmail, setOnboardEmail] = useState('');
  const [onboardTier, setOnboardTier] = useState<'referral_boss' | 'ambassador'>('referral_boss');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterAmbassadors();
  }, [ambassadors, searchTerm, tierFilter, statusFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load ambassadors with user data
      const { data: ambassadorData, error } = await supabase
        .from('ambassador_profiles')
        .select(`
          *,
          profiles:user_id (
            email,
            full_name,
            subscription_tier
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted = (ambassadorData || []).map((amb: any) => ({
        id: amb.id,
        user_id: amb.user_id,
        referral_code: amb.referral_code,
        tier: amb.tier,
        status: amb.status,
        total_referrals: amb.total_referrals,
        active_referrals: amb.active_referrals,
        total_earnings_php: amb.total_earnings_php || 0,
        total_earnings_coins: amb.total_earnings_coins || 0,
        total_earnings_energy: amb.total_earnings_energy || 0,
        conversion_rate: amb.conversion_rate || 0,
        last_payout_at: amb.last_payout_at,
        created_at: amb.created_at,
        user_email: amb.profiles?.email || 'Unknown',
        user_name: amb.profiles?.full_name || 'Unknown',
        subscription_tier: amb.profiles?.subscription_tier || 'free'
      }));

      setAmbassadors(formatted);

      // Calculate stats
      const totalAmbassadors = formatted.filter((a: Ambassador) => a.tier === 'ambassador').length;
      const totalReferralBosses = formatted.filter((a: Ambassador) => a.tier === 'referral_boss').length;
      const activeAmbassadors = formatted.filter((a: Ambassador) => a.status === 'active').length;
      const totalEarningsPaid = formatted.reduce((sum: number, a: Ambassador) => sum + a.total_earnings_php, 0);
      const totalReferrals = formatted.reduce((sum: number, a: Ambassador) => sum + a.total_referrals, 0);
      const avgConversionRate = formatted.length > 0
        ? formatted.reduce((sum: number, a: Ambassador) => sum + a.conversion_rate, 0) / formatted.length
        : 0;

      setStats({
        totalAmbassadors,
        totalReferralBosses,
        activeAmbassadors,
        totalEarningsPaid,
        totalReferrals,
        avgConversionRate
      });

    } catch (error) {
      console.error('Error loading ambassadors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAmbassadors = () => {
    let filtered = [...ambassadors];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(amb =>
        amb.user_email.toLowerCase().includes(term) ||
        amb.user_name.toLowerCase().includes(term) ||
        amb.referral_code.toLowerCase().includes(term)
      );
    }

    // Tier filter
    if (tierFilter !== 'all') {
      filtered = filtered.filter(amb => amb.tier === tierFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(amb => amb.status === statusFilter);
    }

    setFilteredAmbassadors(filtered);
  };

  const handleManualOnboard = async () => {
    if (!onboardEmail) {
      alert('Please enter an email address');
      return;
    }

    try {
      // Find user by email
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('id, subscription_tier')
        .eq('email', onboardEmail)
        .maybeSingle();

      if (userError || !user) {
        alert('User not found with that email');
        return;
      }

      // Check if already ambassador
      const { data: existing } = await supabase
        .from('ambassador_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        alert('User is already an ambassador/referral boss');
        return;
      }

      // Create ambassador profile
      const referralCode = generateReferralCode();
      const { error: createError } = await supabase
        .from('ambassador_profiles')
        .insert({
          user_id: user.id,
          referral_code: referralCode,
          tier: onboardTier,
          status: 'active',
          total_referrals: 0,
          active_referrals: 0,
          total_earnings_php: 0,
          total_earnings_coins: 0,
          total_earnings_energy: 0,
          conversion_rate: 0
        });

      if (createError) throw createError;

      alert(`Successfully onboarded as ${onboardTier === 'ambassador' ? 'Ambassador' : 'Referral Boss'}!`);
      setShowManualOnboard(false);
      setOnboardEmail('');
      loadData();

    } catch (error) {
      console.error('Error onboarding:', error);
      alert('Failed to onboard user');
    }
  };

  const generateReferralCode = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  };

  const handleUpdateStatus = async (ambassadorId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('ambassador_profiles')
        .update({ status: newStatus })
        .eq('id', ambassadorId);

      if (error) throw error;

      alert(`Status updated to ${newStatus}`);
      loadData();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const getTierBadge = (tier: string) => {
    if (tier === 'ambassador') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold rounded-full">
          <Crown className="w-3 h-3" />
          Ambassador
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">
        <Users className="w-3 h-3" />
        Referral Boss
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 text-green-700 border-green-300',
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      suspended: 'bg-red-100 text-red-700 border-red-300',
      inactive: 'bg-gray-100 text-gray-700 border-gray-300'
    };

    const icons: Record<string, any> = {
      active: CheckCircle,
      pending: Clock,
      suspended: Ban,
      inactive: AlertCircle
    };

    const Icon = icons[status] || AlertCircle;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 border ${styles[status]} text-xs font-medium rounded-full`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Ambassador Management</h1>
          <p className="text-gray-600">Track, manage, and onboard ambassadors & referral bosses</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-purple-600" />
              <span className="text-xs text-gray-600 font-medium">Ambassadors</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalAmbassadors}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-xs text-gray-600 font-medium">Referral Bosses</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalReferralBosses}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-xs text-gray-600 font-medium">Active</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.activeAmbassadors}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span className="text-xs text-gray-600 font-medium">Total Paid</span>
            </div>
            <p className="text-xl font-bold text-gray-900">₱{stats.totalEarningsPaid.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span className="text-xs text-gray-600 font-medium">Total Referrals</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalReferrals}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              <span className="text-xs text-gray-600 font-medium">Avg. Conv. Rate</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.avgConversionRate.toFixed(1)}%</p>
          </div>
        </div>

        {/* Filters & Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by email, name, or referral code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Tier Filter */}
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Tiers</option>
              <option value="ambassador">Ambassadors</option>
              <option value="referral_boss">Referral Bosses</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>

            {/* Manual Onboard Button */}
            <button
              onClick={() => setShowManualOnboard(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Manual Onboard
            </button>

            {/* Export Button */}
            <button
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Ambassadors Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Tier</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Referral Code</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Referrals</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Earnings</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Conv. Rate</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Joined</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAmbassadors.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                      No ambassadors found
                    </td>
                  </tr>
                ) : (
                  filteredAmbassadors.map((amb) => (
                    <tr key={amb.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{amb.user_name}</p>
                          <p className="text-xs text-gray-500">{amb.user_email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">{getTierBadge(amb.tier)}</td>
                      <td className="px-4 py-3">{getStatusBadge(amb.status)}</td>
                      <td className="px-4 py-3">
                        <code className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">{amb.referral_code}</code>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <span className="font-bold text-gray-900">{amb.total_referrals}</span>
                          <span className="text-gray-500"> ({amb.active_referrals} active)</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {amb.tier === 'ambassador' ? (
                          <p className="text-sm font-bold text-green-600">
                            ₱{amb.total_earnings_php.toLocaleString()}
                          </p>
                        ) : (
                          <div className="text-xs">
                            <p className="text-yellow-600 font-semibold">{amb.total_earnings_coins} coins</p>
                            <p className="text-blue-600 font-semibold">{amb.total_earnings_energy} energy</p>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-gray-900">{amb.conversion_rate.toFixed(1)}%</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-gray-500">
                          {new Date(amb.created_at).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="relative inline-block">
                          <button
                            onClick={() => setSelectedAmbassador(amb)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <MoreVertical className="w-4 h-4 text-gray-600" />
                          </button>
                          {selectedAmbassador?.id === amb.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                              <button
                                onClick={() => {
                                  window.open(`/signup?ref=${amb.referral_code}`, '_blank');
                                  setSelectedAmbassador(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                              >
                                <ExternalLink className="w-4 h-4" />
                                View Referral Link
                              </button>
                              <button
                                onClick={() => {
                                  handleUpdateStatus(amb.id, amb.status === 'active' ? 'suspended' : 'active');
                                  setSelectedAmbassador(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                              >
                                {amb.status === 'active' ? (
                                  <>
                                    <Ban className="w-4 h-4" />
                                    Suspend
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-4 h-4" />
                                    Activate
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  // TODO: Send email
                                  alert('Email feature coming soon');
                                  setSelectedAmbassador(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                              >
                                <Mail className="w-4 h-4" />
                                Send Email
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-4 text-center text-sm text-gray-600">
          Showing {filteredAmbassadors.length} of {ambassadors.length} ambassadors
        </div>
      </div>

      {/* Manual Onboard Modal */}
      {showManualOnboard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Manual Onboard</h2>
            <p className="text-sm text-gray-600 mb-6">
              Manually add a user to the ambassador program
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User Email
                </label>
                <input
                  type="email"
                  value={onboardEmail}
                  onChange={(e) => setOnboardEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tier
                </label>
                <select
                  value={onboardTier}
                  onChange={(e) => setOnboardTier(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="referral_boss">Referral Boss (Free)</option>
                  <option value="ambassador">Ambassador (Pro)</option>
                </select>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleManualOnboard}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                >
                  Onboard User
                </button>
                <button
                  onClick={() => {
                    setShowManualOnboard(false);
                    setOnboardEmail('');
                  }}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close dropdown */}
      {selectedAmbassador && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setSelectedAmbassador(null)}
        />
      )}
    </div>
  );
}




