import { supabase } from '../lib/supabase';

export interface PendingTransaction {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: string;
  description: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  reference_id?: string;
  created_at: string;
}

export const coinTransactionService = {
  /**
   * Create a pending transaction without deducting coins yet
   */
  async createPendingTransaction(
    userId: string,
    amount: number,
    type: 'spend' | 'earn',
    description: string,
    referenceId?: string
  ): Promise<string> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('coin_balance')
      .eq('id', userId)
      .single();

    const currentBalance = profile?.coin_balance || 0;

    if (type === 'spend' && currentBalance < Math.abs(amount)) {
      throw new Error('Insufficient coins. Please purchase more coins to continue.');
    }

    const transactionAmount = type === 'spend' ? -Math.abs(amount) : Math.abs(amount);

    const { data, error } = await supabase
      .from('pending_coin_transactions')
      .insert({
        user_id: userId,
        amount: transactionAmount,
        transaction_type: type,
        description,
        status: 'pending',
        reference_id: referenceId,
      })
      .select()
      .single();

    if (error) throw error;

    return data.id;
  },

  /**
   * Complete a pending transaction and deduct/add coins
   */
  async completePendingTransaction(pendingTransactionId: string): Promise<void> {
    const { data: pendingTx, error: fetchError } = await supabase
      .from('pending_coin_transactions')
      .select('*')
      .eq('id', pendingTransactionId)
      .single();

    if (fetchError) throw fetchError;

    if (pendingTx.status !== 'pending') {
      throw new Error('Transaction is not in pending status');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('coin_balance')
      .eq('id', pendingTx.user_id)
      .single();

    const currentBalance = profile?.coin_balance || 0;
    const newBalance = currentBalance + pendingTx.amount;

    if (newBalance < 0) {
      throw new Error('Insufficient coins');
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ coin_balance: newBalance })
      .eq('id', pendingTx.user_id);

    if (updateError) throw updateError;

    const { error: insertError } = await supabase.from('coin_transactions').insert({
      user_id: pendingTx.user_id,
      amount: pendingTx.amount,
      transaction_type: pendingTx.transaction_type,
      description: pendingTx.description,
      balance_after: newBalance,
      reference_id: pendingTx.reference_id,
    });

    if (insertError) throw insertError;

    await supabase
      .from('pending_coin_transactions')
      .update({ status: 'completed' })
      .eq('id', pendingTransactionId);
  },

  /**
   * Cancel/fail a pending transaction (no coins deducted)
   */
  async failPendingTransaction(pendingTransactionId: string, reason?: string): Promise<void> {
    await supabase
      .from('pending_coin_transactions')
      .update({
        status: 'failed',
        failure_reason: reason,
      })
      .eq('id', pendingTransactionId);
  },

  /**
   * Refund a completed transaction (adds coins back)
   */
  async refundTransaction(userId: string, originalAmount: number, description: string, referenceId?: string): Promise<void> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('coin_balance')
      .eq('id', userId)
      .single();

    const currentBalance = profile?.coin_balance || 0;
    const refundAmount = Math.abs(originalAmount);
    const newBalance = currentBalance + refundAmount;

    await supabase.from('profiles').update({ coin_balance: newBalance }).eq('id', userId);

    await supabase.from('coin_transactions').insert({
      user_id: userId,
      amount: refundAmount,
      transaction_type: 'earn',
      description: `Refund: ${description}`,
      balance_after: newBalance,
      reference_id: referenceId,
    });
  },

  /**
   * Direct coin transaction (immediate deduction/addition) - Use with caution
   */
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

  /**
   * Get all pending transactions for a user
   */
  async getPendingTransactions(userId: string): Promise<PendingTransaction[]> {
    const { data, error } = await supabase
      .from('pending_coin_transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get real-time coin balance from database
   */
  async getCurrentBalance(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from('profiles')
      .select('coin_balance')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data?.coin_balance || 0;
  },

  /**
   * Check if user can afford an action
   */
  async canAfford(userId: string, amount: number): Promise<boolean> {
    const balance = await this.getCurrentBalance(userId);
    return balance >= amount;
  },

  /**
   * Deduct coins immediately (for AI features)
   */
  async deductCoins(
    userId: string,
    amount: number,
    description: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('coin_balance')
      .eq('id', userId)
      .single();

    const currentBalance = profile?.coin_balance || 0;

    if (currentBalance < amount) {
      throw new Error('Insufficient coins. Please purchase more coins to continue.');
    }

    const newBalance = currentBalance - amount;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ coin_balance: newBalance })
      .eq('id', userId);

    if (updateError) throw updateError;

    const { error: insertError } = await supabase.from('coin_transactions').insert({
      user_id: userId,
      amount: -amount,
      transaction_type: 'spend',
      description,
      balance_after: newBalance,
      metadata,
    });

    if (insertError) throw insertError;
  },
};
