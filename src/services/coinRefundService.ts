/**
 * Coin Refund Service
 * Handles refunding coins for illegitimate transactions
 */

import { supabase } from '../lib/supabase';

export interface RefundRequest {
  userId: string;
  transactionIds?: string[]; // Specific transactions to refund
  amount?: number; // Total amount to refund (if transactionIds not provided)
  reason: string;
  adminUserId: string; // Who authorized the refund
}

export interface RefundResult {
  success: boolean;
  refundedAmount: number;
  refundTransactionId?: string;
  error?: string;
}

export interface TransactionAudit {
  id: string;
  user_id: string;
  amount: number;
  description: string;
  created_at: string;
  transaction_type: string;
  balance_after?: number;
  suspicious: boolean;
  duplicate?: boolean;
  relatedTransactions?: string[];
}

export const coinRefundService = {
  /**
   * Refund coins to a user
   */
  async refundCoins(request: RefundRequest): Promise<RefundResult> {
    try {
      // Get current balance
      const { data: profile } = await supabase
        .from('profiles')
        .select('coin_balance, email, full_name')
        .eq('id', request.userId)
        .single();

      if (!profile) {
        return {
          success: false,
          refundedAmount: 0,
          error: 'User profile not found',
        };
      }

      let refundAmount = 0;

      // If specific transaction IDs provided, calculate refund from those
      if (request.transactionIds && request.transactionIds.length > 0) {
        const { data: transactions, error: txError } = await supabase
          .from('coin_transactions')
          .select('amount, id, description')
          .in('id', request.transactionIds)
          .eq('user_id', request.userId)
          .eq('transaction_type', 'spend');

        if (txError) throw txError;

        if (!transactions || transactions.length === 0) {
          return {
            success: false,
            refundedAmount: 0,
            error: 'No matching transactions found to refund',
          };
        }

        // Calculate total refund (absolute value of negative amounts)
        refundAmount = Math.abs(
          transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0)
        );
      } else if (request.amount) {
        refundAmount = request.amount;
      } else {
        return {
          success: false,
          refundedAmount: 0,
          error: 'Either transactionIds or amount must be provided',
        };
      }

      if (refundAmount <= 0) {
        return {
          success: false,
          refundedAmount: 0,
          error: 'Invalid refund amount',
        };
      }

      // Update user balance
      const newBalance = (profile.coin_balance || 0) + refundAmount;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ coin_balance: newBalance })
        .eq('id', request.userId);

      if (updateError) throw updateError;

      // Create refund transaction record
      const { data: refundTx, error: insertError } = await supabase
        .from('coin_transactions')
        .insert({
          user_id: request.userId,
          amount: refundAmount,
          transaction_type: 'refund',
          description: `Refund: ${request.reason}`,
          balance_after: newBalance,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Log refund activity (optional: create an admin_actions table)
      console.log(`[Refund] Admin ${request.adminUserId} refunded ${refundAmount} coins to user ${request.userId}. Reason: ${request.reason}`);

      return {
        success: true,
        refundedAmount: refundAmount,
        refundTransactionId: refundTx.id,
      };
    } catch (error: any) {
      console.error('[CoinRefundService] Error refunding coins:', error);
      return {
        success: false,
        refundedAmount: 0,
        error: error.message || 'Failed to refund coins',
      };
    }
  },

  /**
   * Audit transactions for a user to find duplicates or suspicious activity
   */
  async auditUserTransactions(
    userId: string,
    startDate?: string,
    endDate?: string
  ): Promise<TransactionAudit[]> {
    try {
      let query = supabase
        .from('coin_transactions')
        .select('*')
        .eq('user_id', userId)
        .eq('transaction_type', 'spend')
        .order('created_at', { ascending: false });

      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data: transactions, error } = await query;

      if (error) throw error;

      if (!transactions || transactions.length === 0) {
        return [];
      }

      // Detect duplicates and suspicious patterns
      const auditResults: TransactionAudit[] = transactions.map((tx) => {
        const audit: TransactionAudit = {
          id: tx.id,
          user_id: tx.user_id,
          amount: tx.amount,
          description: tx.description,
          created_at: tx.created_at,
          transaction_type: tx.transaction_type,
          balance_after: tx.balance_after,
          suspicious: false,
          duplicate: false,
          relatedTransactions: [],
        };

        // Check for duplicates: same description, same amount, within 1 minute
        const duplicateTx = transactions.find(
          (other) =>
            other.id !== tx.id &&
            other.description === tx.description &&
            other.amount === tx.amount &&
            Math.abs(
              new Date(other.created_at).getTime() -
                new Date(tx.created_at).getTime()
            ) < 60000 // Within 1 minute
        );

        if (duplicateTx) {
          audit.duplicate = true;
          audit.suspicious = true;
          audit.relatedTransactions?.push(duplicateTx.id);
        }

        // Check for suspicious patterns:
        // 1. Multiple -20 coin deductions in short time (edge function bug)
        // 2. Multiple -3 coin deductions with same description (duplicate service call)
        const similarTx = transactions.filter(
          (other) =>
            other.id !== tx.id &&
            other.description === tx.description &&
            other.amount === tx.amount &&
            Math.abs(
              new Date(other.created_at).getTime() -
                new Date(tx.created_at).getTime()
            ) < 120000 // Within 2 minutes
        );

        if (similarTx.length > 0) {
          audit.suspicious = true;
          audit.relatedTransactions?.push(...similarTx.map((t) => t.id));
        }

        return audit;
      });

      return auditResults;
    } catch (error: any) {
      console.error('[CoinRefundService] Error auditing transactions:', error);
      throw error;
    }
  },

  /**
   * Find all duplicate transactions for a user in a time period
   */
  async findDuplicateTransactions(
    userId: string,
    timeWindowMinutes: number = 2
  ): Promise<Map<string, TransactionAudit[]>> {
    const audits = await this.auditUserTransactions(userId);
    const duplicates = new Map<string, TransactionAudit[]>();

    audits.forEach((audit) => {
      if (audit.duplicate || (audit.relatedTransactions && audit.relatedTransactions.length > 0)) {
        const key = `${audit.description}_${audit.amount}_${new Date(audit.created_at).toISOString().slice(0, 16)}`;
        
        if (!duplicates.has(key)) {
          duplicates.set(key, [audit]);
        } else {
          duplicates.get(key)!.push(audit);
        }

        // Add related transactions
        if (audit.relatedTransactions) {
          audit.relatedTransactions.forEach((relatedId) => {
            const related = audits.find((a) => a.id === relatedId);
            if (related && !duplicates.get(key)!.some((a) => a.id === related.id)) {
              duplicates.get(key)!.push(related);
            }
          });
        }
      }
    });

    return duplicates;
  },

  /**
   * Bulk refund for a user based on audit results
   */
  async bulkRefundDuplicates(
    userId: string,
    adminUserId: string,
    reason: string = 'Refund for duplicate/illegitimate transactions'
  ): Promise<RefundResult> {
    try {
      const duplicates = await this.findDuplicateTransactions(userId);

      if (duplicates.size === 0) {
        return {
          success: false,
          refundedAmount: 0,
          error: 'No duplicate transactions found',
        };
      }

      // Calculate total refund (keep first transaction, refund duplicates)
      let totalRefund = 0;
      const transactionIdsToRefund: string[] = [];

      duplicates.forEach((group) => {
        // Sort by created_at to keep the first one
        const sorted = [...group].sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        // Keep first, refund the rest
        for (let i = 1; i < sorted.length; i++) {
          transactionIdsToRefund.push(sorted[i].id);
          totalRefund += Math.abs(sorted[i].amount);
        }
      });

      if (totalRefund === 0) {
        return {
          success: false,
          refundedAmount: 0,
          error: 'No transactions to refund',
        };
      }

      return await this.refundCoins({
        userId,
        transactionIds: transactionIdsToRefund,
        reason: `${reason} (${transactionIdsToRefund.length} duplicate transactions)`,
        adminUserId,
      });
    } catch (error: any) {
      console.error('[CoinRefundService] Error bulk refunding:', error);
      return {
        success: false,
        refundedAmount: 0,
        error: error.message || 'Failed to process bulk refund',
      };
    }
  },
};


