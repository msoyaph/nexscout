import { supabase } from '../lib/supabase';

export interface ReferralStats {
  code: string;
  totalSignups: number;
  totalUpgrades: number;
  totalCoinsEarned: number;
  totalPesosEarned: number;
}

export interface Referral {
  id: string;
  referrerUserId: string;
  referredUserId: string | null;
  referredEmail: string | null;
  status: 'pending' | 'completed' | 'rewarded';
  signupCompletedAt: string | null;
  subscriptionUpgradedAt: string | null;
  createdAt: string;
}

class ReferralService {
  async getReferralStats(userId: string): Promise<ReferralStats | null> {
    try {
      const { data, error } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return {
        code: data.code,
        totalSignups: data.total_signups,
        totalUpgrades: data.total_upgrades,
        totalCoinsEarned: data.total_coins_earned,
        totalPesosEarned: parseFloat(data.total_pesos_earned),
      };
    } catch (error) {
      console.error('Error fetching referral stats:', error);
      throw error;
    }
  }

  async getUserReferrals(userId: string): Promise<Referral[]> {
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map((r) => ({
        id: r.id,
        referrerUserId: r.referrer_user_id,
        referredUserId: r.referred_user_id,
        referredEmail: r.referred_email,
        status: r.status,
        signupCompletedAt: r.signup_completed_at,
        subscriptionUpgradedAt: r.subscription_upgraded_at,
        createdAt: r.created_at,
      }));
    } catch (error) {
      console.error('Error fetching user referrals:', error);
      throw error;
    }
  }

  async validateReferralCode(code: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('referral_codes')
        .select('code')
        .eq('code', code)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return false;
        }
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error('Error validating referral code:', error);
      return false;
    }
  }

  async processSignupReferral(referralCode: string, referredUserId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('process_referral_signup', {
        p_referrer_code: referralCode,
        p_referred_user_id: referredUserId,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error processing signup referral:', error);
      throw error;
    }
  }

  async processUpgradeReferral(referredUserId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('process_referral_upgrade', {
        p_referred_user_id: referredUserId,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error processing upgrade referral:', error);
      throw error;
    }
  }

  storeReferralCode(code: string): void {
    localStorage.setItem('referral_code', code);
  }

  getReferralCode(): string | null {
    return localStorage.getItem('referral_code');
  }

  clearReferralCode(): void {
    localStorage.removeItem('referral_code');
  }
}

export const referralService = new ReferralService();
