import { supabase } from '../lib/supabase';

export interface CoinTransaction {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: 'earn' | 'spend' | 'bonus' | 'purchase' | 'ad_reward';
  description: string;
  balance_after: number;
  reference_id?: string;
  created_at: string;
}

export interface PaymentHistory {
  id: string;
  user_id: string;
  subscription_id?: string;
  amount: number;
  currency: string;
  payment_method: string;
  payment_status: string;
  transaction_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface WalletStats {
  totalBalance: number;
  weeklyEarned: number;
  weeklySpent: number;
  monthlyEarned: number;
  monthlySpent: number;
}

export const walletService = {
  async getCoinBalance(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from('profiles')
      .select('coin_balance')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data?.coin_balance || 0;
  },

  async getTransactionHistory(
    userId: string,
    limit: number = 50,
    filter?: 'all' | 'earned' | 'spent' | 'purchased'
  ): Promise<CoinTransaction[]> {
    let query = supabase
      .from('coin_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (filter === 'earned') {
      query = query.in('transaction_type', ['earn', 'bonus', 'ad_reward']);
    } else if (filter === 'spent') {
      query = query.eq('transaction_type', 'spend');
    } else if (filter === 'purchased') {
      query = query.eq('transaction_type', 'purchase');
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  async getWalletStats(userId: string): Promise<WalletStats> {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const { data: balance } = await supabase
      .from('profiles')
      .select('coin_balance')
      .eq('id', userId)
      .maybeSingle();

    const { data: weeklyTransactions } = await supabase
      .from('coin_transactions')
      .select('amount, transaction_type')
      .eq('user_id', userId)
      .gte('created_at', weekAgo.toISOString());

    const { data: monthlyTransactions } = await supabase
      .from('coin_transactions')
      .select('amount, transaction_type')
      .eq('user_id', userId)
      .gte('created_at', monthAgo.toISOString());

    const weeklyEarned = (weeklyTransactions || [])
      .filter(t => ['earn', 'bonus', 'purchase', 'ad_reward'].includes(t.transaction_type))
      .reduce((sum, t) => sum + t.amount, 0);

    const weeklySpent = Math.abs(
      (weeklyTransactions || [])
        .filter(t => t.transaction_type === 'spend')
        .reduce((sum, t) => sum + t.amount, 0)
    );

    const monthlyEarned = (monthlyTransactions || [])
      .filter(t => ['earn', 'bonus', 'purchase', 'ad_reward'].includes(t.transaction_type))
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlySpent = Math.abs(
      (monthlyTransactions || [])
        .filter(t => t.transaction_type === 'spend')
        .reduce((sum, t) => sum + t.amount, 0)
    );

    return {
      totalBalance: balance?.coin_balance || 0,
      weeklyEarned,
      weeklySpent,
      monthlyEarned,
      monthlySpent,
    };
  },

  async recordTransaction(
    userId: string,
    amount: number,
    type: 'earn' | 'spend' | 'bonus' | 'purchase' | 'ad_reward',
    description: string,
    referenceId?: string
  ): Promise<boolean> {
    const { data, error } = await supabase.rpc('record_coin_transaction', {
      p_user_id: userId,
      p_amount: amount,
      p_type: type,
      p_description: description,
    });

    if (error) throw error;
    return data;
  },

  async canAffordAction(userId: string, cost: number): Promise<boolean> {
    const { data, error } = await supabase.rpc('can_afford_action', {
      p_user_id: userId,
      p_cost: cost,
    });

    if (error) throw error;
    return data;
  },

  async purchaseCoins(
    userId: string,
    coins: number,
    amountPHP: number,
    paymentMethod: string,
    transactionId: string
  ): Promise<{ success: boolean; newBalance: number }> {
    const currentBalance = await this.getCoinBalance(userId);

    const { error: paymentError } = await supabase.from('payment_history').insert({
      user_id: userId,
      amount: amountPHP,
      currency: 'PHP',
      payment_method: paymentMethod,
      payment_status: 'completed',
      transaction_id: transactionId,
      metadata: { coins_purchased: coins },
    });

    if (paymentError) throw paymentError;

    const success = await this.recordTransaction(
      userId,
      coins,
      'purchase',
      `Purchased ${coins} coins for ₱${amountPHP.toFixed(2)}`,
      transactionId
    );

    if (!success) throw new Error('Failed to record coin transaction');

    const newBalance = currentBalance + coins;

    return { success: true, newBalance };
  },

  async getPaymentHistory(
    userId: string,
    limit: number = 20
  ): Promise<PaymentHistory[]> {
    const { data, error } = await supabase
      .from('payment_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async awardDailyBonus(userId: string): Promise<number> {
    const { data, error } = await supabase.rpc('award_daily_bonus', {
      p_user_id: userId,
    });

    if (error) throw error;
    return data || 0;
  },

  formatCurrency(amount: number, currency: string = 'PHP'): string {
    if (currency === 'PHP') {
      return `₱${amount.toFixed(2)}`;
    }
    return `$${amount.toFixed(2)}`;
  },

  getCoinCostForAction(action: string): number {
    const costs: Record<string, number> = {
      reveal_prospect: 10,
      extra_message: 5,
      extra_presentation: 15,
      speed_up_scan: 8,
      ai_pitch_deck: 20,
      ai_message_sequence: 15,
      deep_scan: 25,
      unlock_contact: 10,
    };

    return costs[action] || 0;
  },
};
