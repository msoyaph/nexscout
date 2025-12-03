import { useState, useEffect } from 'react';
import { Users, Copy, Check, Coins, DollarSign, TrendingUp, Share2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface ReferralStats {
  code: string;
  totalSignups: number;
  totalUpgrades: number;
  totalCoinsEarned: number;
  totalPesosEarned: number;
}

const TIER_EARNINGS = {
  pro: 50,
  elite: 100,
  team: 350,
  enterprise: 10000,
};

export default function ReferralCard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReferralStats();
  }, [user]);

  const loadReferralStats = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let { data, error } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        const codeData = await createReferralCode();
        if (codeData) {
          data = codeData;
        }
      } else if (error) {
        console.error('Error loading referral stats:', error);
      }

      if (data) {
        setStats({
          code: data.code,
          totalSignups: data.total_signups || 0,
          totalUpgrades: data.total_upgrades || 0,
          totalCoinsEarned: data.total_coins_earned || 0,
          totalPesosEarned: parseFloat(data.total_pesos_earned || '0'),
        });
      }
    } catch (error) {
      console.error('Error loading referral stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const createReferralCode = async () => {
    if (!user) return null;

    try {
      const code = generateCode();
      const { data, error } = await supabase
        .from('referral_codes')
        .insert({
          user_id: user.id,
          code: code,
          total_signups: 0,
          total_upgrades: 0,
          total_coins_earned: 0,
          total_pesos_earned: '0',
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating referral code:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error creating referral code:', error);
      return null;
    }
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const getReferralLink = () => {
    if (!stats?.code) return '';
    const baseUrl = 'https://nexscoutai.com';
    return `${baseUrl}/?ref=${stats.code}`;
  };

  const copyReferralLink = async () => {
    const link = getReferralLink();
    if (!link) return;

    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 rounded-2xl p-4 border border-orange-200 shadow-sm">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-orange-200 rounded w-3/4"></div>
          <div className="h-4 bg-orange-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 rounded-2xl p-4 border border-orange-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center shrink-0">
            <Users className="size-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-gray-900">Refer & Earn</h3>
            <p className="text-xs text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 rounded-2xl p-4 border border-orange-200 shadow-sm">
      <div className="flex items-start gap-3 mb-3">
        <div className="size-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center shrink-0">
          <Users className="size-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-gray-900 mb-0.5">Refer & Earn Rewards</h3>
          <p className="text-xs text-gray-600">Share your link and get paid!</p>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 mb-3 border border-orange-200">
        <div className="flex items-center gap-2 mb-2">
          <Share2 className="size-3.5 text-orange-600" />
          <span className="text-xs font-bold text-gray-900">Your Referral Link</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={getReferralLink()}
            readOnly
            className="flex-1 min-w-0 bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 font-mono truncate"
          />
          <button
            onClick={copyReferralLink}
            className="shrink-0 size-8 rounded-lg bg-orange-600 hover:bg-orange-700 flex items-center justify-center transition-colors"
          >
            {copied ? (
              <Check className="size-4 text-white" />
            ) : (
              <Copy className="size-4 text-white" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-1.5">
          Code: <span className="font-bold text-orange-600">{stats.code}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-green-50 rounded-xl p-2.5 border border-green-200">
          <div className="flex items-center gap-1.5 mb-1">
            <Coins className="size-3.5 text-green-600" />
            <span className="text-xs text-green-700 font-semibold">Coins</span>
          </div>
          <p className="text-lg font-bold text-green-700">{stats.totalCoinsEarned}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-2.5 border border-blue-200">
          <div className="flex items-center gap-1.5 mb-1">
            <DollarSign className="size-3.5 text-blue-600" />
            <span className="text-xs text-blue-700 font-semibold">Pesos</span>
          </div>
          <p className="text-lg font-bold text-blue-700">₱{stats.totalPesosEarned.toFixed(0)}</p>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-purple-200 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-lg bg-green-100 flex items-center justify-center">
              <Users className="size-3.5 text-green-600" />
            </div>
            <span className="text-xs font-semibold text-gray-900">Free signup</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-green-600">+100 coins</span>
            <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">
              {stats.totalSignups}
            </span>
          </div>
        </div>

        <div className="h-px bg-gray-200"></div>

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-gray-700 mb-1.5">Referral Rewards - One-Time per Upgrade:</p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-5 rounded bg-blue-100 flex items-center justify-center">
                <TrendingUp className="size-3 text-blue-600" />
              </div>
              <span className="text-xs text-gray-700">Pro</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-blue-600">₱{TIER_EARNINGS.pro}</span>
              <span className="text-xs text-gray-500 ml-1">One-Time</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-5 rounded bg-purple-100 flex items-center justify-center">
                <TrendingUp className="size-3 text-purple-600" />
              </div>
              <span className="text-xs text-gray-700">Elite</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-purple-600">₱{TIER_EARNINGS.elite}</span>
              <span className="text-xs text-gray-500 ml-1">One-Time</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-5 rounded bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="size-3 text-emerald-600" />
              </div>
              <span className="text-xs text-gray-700">Team</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-emerald-600">₱{TIER_EARNINGS.team}</span>
              <span className="text-xs text-gray-500 ml-1">One-Time</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-5 rounded bg-amber-100 flex items-center justify-center">
                <TrendingUp className="size-3 text-amber-600" />
              </div>
              <span className="text-xs text-gray-700">Enterprise</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-amber-600">₱{TIER_EARNINGS.enterprise.toLocaleString()}</span>
              <span className="text-xs text-gray-500 ml-1">One-Time</span>
            </div>
          </div>
        </div>

        <div className="h-px bg-gray-200 mt-2"></div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-gray-600">Total Upgrades</span>
          <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">
            {stats.totalUpgrades}
          </span>
        </div>
      </div>
    </div>
  );
}
