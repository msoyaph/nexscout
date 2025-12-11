/**
 * Coin Transaction Audit Page
 * Super Admin tool to audit and refund illegitimate coin transactions
 */

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { coinRefundService, TransactionAudit } from '../services/coinRefundService';

interface CoinTransactionAuditPageProps {
  onBack: () => void;
  onNavigate: (path: string) => void;
}

export default function CoinTransactionAuditPage({
  onBack,
  onNavigate,
}: CoinTransactionAuditPageProps) {
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [audits, setAudits] = useState<TransactionAudit[]>([]);
  const [loading, setLoading] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [selectedTxIds, setSelectedTxIds] = useState<Set<string>>(new Set());
  const [refundAmount, setRefundAmount] = useState(0);
  const [refundReason, setRefundReason] = useState('Refund for duplicate/illegitimate transactions');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [currentAdminUserId, setCurrentAdminUserId] = useState('');

  useEffect(() => {
    // Get current admin user
    const loadCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentAdminUserId(user.id);
      }
    };
    loadCurrentUser();
  }, []);

  const loadUserByEmail = async () => {
    if (!userEmail) {
      setMessage({ type: 'error', text: 'Please enter user email' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, coin_balance')
        .eq('email', userEmail)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setMessage({ type: 'error', text: 'User not found' });
        setUserId('');
      } else {
        setUserId(data.id);
        setMessage({
          type: 'success',
          text: `Found user: ${data.full_name || data.email} (Balance: ${data.coin_balance || 0} coins)`,
        });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to load user' });
      setUserId('');
    } finally {
      setLoading(false);
    }
  };

  const auditTransactions = async () => {
    if (!userId) {
      setMessage({ type: 'error', text: 'Please load a user first' });
      return;
    }

    setLoading(true);
    setMessage(null);
    setSelectedTxIds(new Set());

    try {
      const results = await coinRefundService.auditUserTransactions(
        userId,
        startDate ? `${startDate}T00:00:00.000Z` : undefined,
        endDate ? `${endDate}T23:59:59.999Z` : undefined
      );

      setAudits(results);

      // Calculate total suspicious/duplicate amount
      const suspiciousTx = results.filter((a) => a.suspicious || a.duplicate);
      const totalSuspicious = suspiciousTx.reduce(
        (sum, tx) => sum + Math.abs(tx.amount),
        0
      );
      setRefundAmount(totalSuspicious);

      setMessage({
        type: 'success',
        text: `Found ${results.length} transactions. ${suspiciousTx.length} suspicious/duplicate transactions. Potential refund: ${totalSuspicious} coins.`,
      });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to audit transactions' });
    } finally {
      setLoading(false);
    }
  };

  const toggleTransactionSelection = (txId: string) => {
    const newSelected = new Set(selectedTxIds);
    if (newSelected.has(txId)) {
      newSelected.delete(txId);
    } else {
      newSelected.add(txId);
    }
    setSelectedTxIds(newSelected);

    // Recalculate refund amount
    const selectedAudits = audits.filter((a) => newSelected.has(a.id));
    const total = selectedAudits.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    setRefundAmount(total);
  };

  const selectAllSuspicious = () => {
    const suspiciousIds = audits
      .filter((a) => a.suspicious || a.duplicate)
      .map((a) => a.id);
    setSelectedTxIds(new Set(suspiciousIds));

    const total = audits
      .filter((a) => a.suspicious || a.duplicate)
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    setRefundAmount(total);
  };

  const processRefund = async () => {
    if (!userId || !currentAdminUserId) {
      setMessage({ type: 'error', text: 'User or admin not loaded' });
      return;
    }

    if (selectedTxIds.size === 0 && refundAmount === 0) {
      setMessage({ type: 'error', text: 'Please select transactions or use bulk refund' });
      return;
    }

    setRefunding(true);
    setMessage(null);

    try {
      let result;

      if (selectedTxIds.size > 0) {
        // Refund selected transactions
        result = await coinRefundService.refundCoins({
          userId,
          transactionIds: Array.from(selectedTxIds),
          reason: refundReason,
          adminUserId: currentAdminUserId,
        });
      } else {
        // Bulk refund all duplicates
        result = await coinRefundService.bulkRefundDuplicates(
          userId,
          currentAdminUserId,
          refundReason
        );
      }

      if (result.success) {
        setMessage({
          type: 'success',
          text: `Successfully refunded ${result.refundedAmount} coins. Transaction ID: ${result.refundTransactionId}`,
        });
        setSelectedTxIds(new Set());
        setRefundAmount(0);
        // Reload audits
        await auditTransactions();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to process refund' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to process refund' });
    } finally {
      setRefunding(false);
    }
  };

  const suspiciousTransactions = audits.filter((a) => a.suspicious || a.duplicate);
  const normalTransactions = audits.filter((a) => !a.suspicious && !a.duplicate);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <button
              onClick={onBack}
              className="text-gray-600 hover:text-gray-900 mb-2 flex items-center gap-2"
            >
              ← Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Coin Transaction Audit</h1>
            <p className="text-gray-600 mt-1">Super Admin Tool - Audit and Refund Illegitimate Transactions</p>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-4 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* User Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Search User</h2>
          <div className="flex gap-4">
            <input
              type="email"
              placeholder="User email address"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && loadUserByEmail()}
            />
            <button
              onClick={loadUserByEmail}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'Load User'}
            </button>
          </div>
          {userId && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                User ID: <code className="bg-blue-100 px-2 py-1 rounded">{userId}</code>
              </p>
            </div>
          )}
        </div>

        {/* Date Range & Audit */}
        {userId && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Audit Transactions</h2>
            <div className="flex gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={auditTransactions}
                  disabled={loading}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Auditing...' : 'Run Audit'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Refund Section */}
        {audits.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Refund Management</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Refund Reason
              </label>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                placeholder="Enter reason for refund..."
              />
            </div>

            <div className="flex gap-4 mb-4">
              <button
                onClick={selectAllSuspicious}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                Select All Suspicious ({suspiciousTransactions.length})
              </button>
              <div className="flex-1 flex items-center justify-end gap-4">
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total Selected Refund:</p>
                  <p className="text-2xl font-bold text-red-600">{refundAmount} coins</p>
                </div>
                <button
                  onClick={processRefund}
                  disabled={refunding || refundAmount === 0}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  {refunding ? 'Processing...' : 'Process Refund'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Suspicious Transactions */}
        {suspiciousTransactions.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border-2 border-red-200 p-6 mb-6">
            <h2 className="text-xl font-semibold text-red-800 mb-4">
              ⚠️ Suspicious/Duplicate Transactions ({suspiciousTransactions.length})
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {suspiciousTransactions.map((audit) => (
                <div
                  key={audit.id}
                  className={`p-4 border rounded-lg ${
                    selectedTxIds.has(audit.id)
                      ? 'border-blue-500 bg-blue-50'
                      : audit.duplicate
                      ? 'border-red-300 bg-red-50'
                      : 'border-yellow-300 bg-yellow-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedTxIds.has(audit.id)}
                        onChange={() => toggleTransactionSelection(audit.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-red-700">
                            {Math.abs(audit.amount)} coins
                          </span>
                          {audit.duplicate && (
                            <span className="px-2 py-0.5 bg-red-200 text-red-800 text-xs font-bold rounded">
                              DUPLICATE
                            </span>
                          )}
                          {audit.suspicious && !audit.duplicate && (
                            <span className="px-2 py-0.5 bg-yellow-200 text-yellow-800 text-xs font-bold rounded">
                              SUSPICIOUS
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 mb-1">{audit.description}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(audit.created_at).toLocaleString()}
                        </p>
                        {audit.relatedTransactions && audit.relatedTransactions.length > 0 && (
                          <p className="text-xs text-red-600 mt-1">
                            Related: {audit.relatedTransactions.length} similar transactions
                          </p>
                        )}
                      </div>
                    </div>
                    <code className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {audit.id.slice(0, 8)}...
                    </code>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Normal Transactions */}
        {normalTransactions.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4">
              Normal Transactions ({normalTransactions.length})
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {normalTransactions.slice(0, 50).map((audit) => (
                <div
                  key={audit.id}
                  className="p-3 border border-gray-200 rounded-lg bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-gray-700">
                        {Math.abs(audit.amount)} coins
                      </span>
                      <p className="text-sm text-gray-600">{audit.description}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(audit.created_at).toLocaleString()}
                      </p>
                    </div>
                    <code className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {audit.id.slice(0, 8)}...
                    </code>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


