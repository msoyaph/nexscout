import { supabase } from '../lib/supabase';

export interface AmbassadorProfile {
  id: string;
  user_id: string;
  tier: 'referral_boss' | 'ambassador';
  referral_code: string;
  total_referrals: number;
  active_referrals: number;
  total_earnings_php: number;
  total_earnings_coins: number;
  total_earnings_energy: number;
  conversion_rate: number;
  landing_page_slug: string | null;
  status: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_user_id: string;
  referral_code: string;
  signed_up_at: string;
  converted_to_pro_at: string | null;
  status: 'pending' | 'active' | 'churned' | 'refunded';
  first_month_commission_amount: number;
  total_recurring_commission: number;
}

export interface CommissionTransaction {
  id: string;
  ambassador_id: string;
  referral_id: string;
  transaction_type: 'first_month' | 'recurring' | 'bonus' | 'clawback';
  amount_php: number;
  amount_coins: number;
  amount_energy: number;
  description: string;
  created_at: string;
}

export const ambassadorService = {
  /**
   * Create ambassador profile for user
   */
  async createAmbassadorProfile(
    userId: string,
    tier: 'referral_boss' | 'ambassador',
    customSlug?: string
  ): Promise<{ success: boolean; referralCode?: string; error?: string }> {
    try {
      // Check if already an ambassador
      const { data: existing } = await supabase
        .from('ambassador_profiles')
        .select('referral_code')
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        return { success: true, referralCode: existing.referral_code };
      }

      // Validate tier vs subscription
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', userId)
        .single();

      // Ambassadors must be Pro users
      if (tier === 'ambassador' && !['pro', 'team', 'enterprise'].includes(profile?.subscription_tier || '')) {
        return { success: false, error: 'You must be a Pro user to become an Ambassador. Upgrade to Pro first!' };
      }

      // Generate unique referral code
      const referralCode = await this.generateUniqueReferralCode();
      const landingPageSlug = customSlug || null;

      // Create ambassador profile
      const { data, error } = await supabase
        .from('ambassador_profiles')
        .insert({
          user_id: userId,
          tier,
          referral_code: referralCode,
          landing_page_slug: landingPageSlug,
          status: 'active',
          approved_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, referralCode };
    } catch (error) {
      console.error('Error creating ambassador profile:', error);
      return { success: false, error: 'Failed to create ambassador profile' };
    }
  },

  /**
   * Generate unique 8-character referral code
   */
  async generateUniqueReferralCode(): Promise<string> {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    let isUnique = false;

    while (!isUnique) {
      code = '';
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // Check if code already exists
      const { data } = await supabase
        .from('ambassador_profiles')
        .select('id')
        .eq('referral_code', code)
        .maybeSingle();

      if (!data) {
        isUnique = true;
      }
    }

    return code;
  },

  /**
   * Track referral signup
   */
  async trackReferralSignup(
    referredUserId: string,
    referralCode: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Find referrer by code
      const { data: ambassador } = await supabase
        .from('ambassador_profiles')
        .select('user_id')
        .eq('referral_code', referralCode)
        .eq('status', 'active')
        .maybeSingle();

      if (!ambassador) {
        return { success: false, error: 'Invalid referral code' };
      }

      // Create referral record
      const { error } = await supabase
        .from('referrals')
        .insert({
          referrer_id: ambassador.user_id,
          referred_user_id: referredUserId,
          referral_code: referralCode,
          status: 'pending', // Will become 'active' when they upgrade to Pro
        });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error tracking referral:', error);
      return { success: false, error: 'Failed to track referral' };
    }
  },

  /**
   * Track Pro conversion and award commission
   */
  async trackProConversion(userId: string): Promise<void> {
    try {
      // Call the database function to handle commission
      const { error } = await supabase.rpc('track_referral_conversion', {
        p_referred_user_id: userId,
        p_new_tier: 'pro',
      });

      if (error) {
        console.error('Error tracking Pro conversion:', error);
      }
    } catch (error) {
      console.error('Error in trackProConversion:', error);
    }
  },

  /**
   * Get ambassador stats
   */
  async getAmbassadorStats(userId: string): Promise<AmbassadorProfile | null> {
    try {
      const { data, error } = await supabase
        .from('ambassador_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting ambassador stats:', error);
      return null;
    }
  },

  /**
   * Get referrals for ambassador
   */
  async getReferrals(userId: string): Promise<Referral[]> {
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', userId)
        .order('signed_up_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting referrals:', error);
      return [];
    }
  },

  /**
   * Get commission transactions
   */
  async getCommissionTransactions(userId: string, limit: number = 50): Promise<CommissionTransaction[]> {
    try {
      const { data: ambassador } = await supabase
        .from('ambassador_profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!ambassador) return [];

      const { data, error } = await supabase
        .from('commission_transactions')
        .select('*')
        .eq('ambassador_id', ambassador.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  },

  /**
   * Request payout
   */
  async requestPayout(
    userId: string,
    paymentMethod: 'gcash' | 'bank_transfer' | 'paymaya' | 'paypal',
    paymentDetails: Record<string, any>
  ): Promise<{ success: boolean; payoutId?: string; error?: string }> {
    try {
      // Get ambassador profile
      const { data: ambassador } = await supabase
        .from('ambassador_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!ambassador) {
        return { success: false, error: 'Not an ambassador' };
      }

      // Check minimum payout amount
      const minimumPayout = 500; // ₱500
      if (ambassador.total_earnings_php < minimumPayout) {
        return { 
          success: false, 
          error: `Minimum payout is ₱${minimumPayout}. You have ₱${ambassador.total_earnings_php.toFixed(2)}.` 
        };
      }

      // Create payout request
      const periodEnd = new Date();
      const periodStart = new Date();
      periodStart.setMonth(periodStart.getMonth() - 1);

      const { data: payout, error } = await supabase
        .from('ambassador_payouts')
        .insert({
          ambassador_id: ambassador.id,
          user_id: userId,
          period_start: periodStart.toISOString().split('T')[0],
          period_end: periodEnd.toISOString().split('T')[0],
          total_amount: ambassador.total_earnings_php,
          payment_method: paymentMethod,
          payment_details: paymentDetails,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, payoutId: payout.id };
    } catch (error) {
      console.error('Error requesting payout:', error);
      return { success: false, error: 'Failed to request payout' };
    }
  },

  /**
   * Upgrade from Referral Boss to Ambassador
   */
  async upgradeToAmbassador(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Verify user is Pro
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', userId)
        .single();

      if (!['pro', 'team', 'enterprise'].includes(profile?.subscription_tier || '')) {
        return { success: false, error: 'You must upgrade to Pro first!' };
      }

      // Update ambassador tier
      const { error } = await supabase
        .from('ambassador_profiles')
        .update({ tier: 'ambassador' })
        .eq('user_id', userId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error upgrading to ambassador:', error);
      return { success: false, error: 'Failed to upgrade' };
    }
  },

  /**
   * Calculate potential earnings
   */
  calculatePotentialEarnings(referrals: number, tier: 'referral_boss' | 'ambassador'): {
    firstMonth: number;
    monthly: number;
    annual: number;
    currency: 'PHP' | 'coins';
  } {
    if (tier === 'ambassador') {
      const firstMonth = referrals * 649.50; // 50% of ₱1,299
      const monthly = referrals * 194.85; // 15% of ₱1,299
      const annual = firstMonth + (monthly * 11); // First month + 11 recurring

      return {
        firstMonth,
        monthly,
        annual,
        currency: 'PHP',
      };
    } else {
      // Referral Boss (one-time per conversion)
      const coins = referrals * 100;
      const energy = referrals * 50;

      return {
        firstMonth: coins,
        monthly: 0,
        annual: coins,
        currency: 'coins',
      };
    }
  },
};




