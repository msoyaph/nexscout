import { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, Calendar, Download, AlertCircle, CheckCircle, Clock, Coins, Crown, Zap, Users, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { TIER_PRICING, SUBSCRIPTION_TIERS } from '../lib/subscriptionTiers';
import TierBadge from '../components/TierBadge';
import SaveOfferModal from '../components/SaveOfferModal';
import CancelReasonModal, { CancelReasonData } from '../components/CancelReasonModal';

interface ManageSubscriptionPageProps {
  onBack: () => void;
  onNavigate?: (page: string) => void;
}

interface Subscription {
  id: string;
  plan_id: string;
  billing_cycle: 'monthly' | 'annual';
  status: string;
  amount: number;
  currency: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

interface PaymentRecord {
  id: string;
  amount: number;
  currency: string;
  payment_method: string;
  payment_status: string;
  created_at: string;
  transaction_id: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  description: string;
  status: string;
  created_at: string;
  billing_period_start: string;
  billing_period_end: string;
}

export default function ManageSubscriptionPage({ onBack, onNavigate }: ManageSubscriptionPageProps) {
  const { profile } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelFlowState, setCancelFlowState] = useState<'idle' | 'save_offer' | 'reason_capture' | 'processing'>('idle');
  const [showSaveOffer, setShowSaveOffer] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);

  // Map elite to pro since elite is discontinued
  const rawTier = profile?.subscription_tier || SUBSCRIPTION_TIERS.STARTER;
  const tier = rawTier; // Elite tier removed, no mapping needed
  const pricing = TIER_PRICING[tier as keyof typeof TIER_PRICING] || TIER_PRICING[SUBSCRIPTION_TIERS.PRO];

  useEffect(() => {
    loadData();
  }, [profile?.id]);

  const loadData = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);

      // Load subscription
      const { data: subData } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', profile.id)
        .eq('status', 'active')
        .maybeSingle();

      if (subData) {
        setSubscription(subData);
      }

      // Load payment history
      const { data: paymentData } = await supabase
        .from('payment_history')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (paymentData) {
        setPayments(paymentData);
      }

      // Load invoices
      const { data: invoiceData } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (invoiceData) {
        setInvoices(invoiceData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startCancelFlow = () => {
    setCancelFlowState('save_offer');
    setShowSaveOffer(true);
    setShowCancelModal(false);
  };

  const handleAcceptOffer = async (offerType: string) => {
    try {
      await supabase.from('subscription_retention_offers').insert({
        user_id: profile?.id,
        subscription_tier: tier,
        offer_type: offerType,
        offer_accepted: true,
        accepted_at: new Date().toISOString()
      });

      let message = '';
      if (offerType === 'extension') {
        message = '7 days of free access added to your account!';
      } else if (offerType === 'discount') {
        message = '50% discount applied to your next billing cycle!';
      } else if (offerType === 'downgrade') {
        message = 'Your plan will be downgraded at the end of this period.';
      }

      alert(message);
      setShowSaveOffer(false);
      setCancelFlowState('idle');
    } catch (error) {
      console.error('Error accepting offer:', error);
      alert('Failed to apply offer. Please try again.');
    }
  };

  const handleContinueToCancel = () => {
    setShowSaveOffer(false);
    setCancelFlowState('reason_capture');
    setShowReasonModal(true);
  };

  const handleSubmitCancelReason = async (data: CancelReasonData) => {
    if (!profile?.id) return;

    try {
      setCancelFlowState('processing');

      await supabase.from('subscription_cancellation_reasons').insert({
        user_id: profile.id,
        subscription_tier: tier,
        reason_primary: data.reason_primary,
        reason_secondary: data.reason_secondary,
        additional_feedback: data.additional_feedback,
        contact_back: data.contact_back,
        usage_scans: 0,
        usage_messages: 0,
        usage_chatbot: 0
      });

      if (subscription?.id) {
        await supabase
          .from('user_subscriptions')
          .update({ cancel_at_period_end: true })
          .eq('id', subscription.id);
      }

      alert('Your subscription will remain active until the end of the billing cycle. We appreciate your feedback!');
      setShowReasonModal(false);
      setCancelFlowState('idle');
      loadData();
    } catch (error) {
      console.error('Error submitting cancellation:', error);
      alert('Failed to cancel subscription. Please try again.');
      setCancelFlowState('reason_capture');
    }
  };

  const handleGoBackFromReason = () => {
    setShowReasonModal(false);
    setCancelFlowState('save_offer');
    setShowSaveOffer(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    return `${currency === 'PHP' ? '₱' : '$'}${amount.toFixed(2)}`;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { color: 'bg-green-100 text-green-700', icon: CheckCircle, text: 'Paid' },
      pending: { color: 'bg-yellow-100 text-yellow-700', icon: Clock, text: 'Pending' },
      failed: { color: 'bg-red-100 text-red-700', icon: XCircle, text: 'Failed' },
      active: { color: 'bg-green-100 text-green-700', icon: CheckCircle, text: 'Active' },
      cancelled: { color: 'bg-slate-100 text-slate-700', icon: XCircle, text: 'Cancelled' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${config.color}`}>
        <Icon className="size-3" />
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isFreeUser = tier === SUBSCRIPTION_TIERS.FREE || tier === SUBSCRIPTION_TIERS.STARTER;

  return (
    <div className="relative min-h-screen bg-[#F3F4F6] text-[#111827] pb-28">
      <header className="bg-white px-6 py-6 shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={onBack}
            className="size-10 rounded-full bg-white flex items-center justify-center border border-[#E5E7EB] shadow-sm active:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="size-5 text-[#111827]" />
          </button>
          <h1 className="text-xl font-bold">Manage Subscription</h1>
          <div className="size-10" />
        </div>
      </header>

      <main className="px-6 pt-6 space-y-6">
        {/* Current Plan */}
        <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm">
          <h2 className="text-lg font-bold mb-4">Current Plan</h2>

          {isFreeUser ? (
            <div className="text-center py-8">
              <div className="size-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Zap className="size-8 text-slate-400" />
              </div>
              <p className="text-[#6B7280] mb-4">You're on the Free plan</p>
              <button
                onClick={() => onNavigate?.('pricing')}
                className="px-6 py-3 bg-blue-600 text-white rounded-[16px] font-semibold shadow-lg hover:bg-blue-700 transition-colors"
              >
                Upgrade Now
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <TierBadge tier={tier} size="md" />
                    {subscription?.cancel_at_period_end && (
                      <span className="text-xs text-red-600 font-semibold">
                        Cancels on {formatDate(subscription.current_period_end)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[#6B7280] mb-3">
                    {pricing.displayName} - {subscription?.billing_cycle === 'monthly' ? 'Monthly' : 'Annual'} billing
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="size-4 text-blue-600" />
                      <span className="text-[#6B7280]">
                        Next billing: <span className="font-semibold text-[#111827]">
                          {subscription?.current_period_end ? formatDate(subscription.current_period_end) : 'N/A'}
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Coins className="size-4 text-[#F59E0B]" />
                      <span className="text-[#6B7280]">
                        Weekly coins: <span className="font-semibold text-[#111827]">
                          {pricing.weeklyCoins} coins
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <CreditCard className="size-4 text-blue-600" />
                      <span className="text-[#6B7280]">
                        Amount: <span className="font-semibold text-[#111827]">
                          {subscription ? formatAmount(subscription.amount, subscription.currency) : 'N/A'}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E5E7EB] flex gap-3">
                <button
                  onClick={() => onNavigate?.('pricing')}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-[16px] font-semibold text-sm hover:bg-blue-700 transition-colors"
                >
                  Change Plan
                </button>
                {!subscription?.cancel_at_period_end && (
                  <button
                    onClick={startCancelFlow}
                    className="flex-1 py-2.5 border-2 border-red-200 text-red-600 rounded-[16px] font-semibold text-sm hover:bg-red-50 transition-colors"
                  >
                    Cancel Subscription
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Coin Balance */}
        <div className="bg-gradient-to-br from-[#FEF3C7] to-[#FDE68A] rounded-[24px] p-6 border border-[#FCD34D] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#92400E] mb-1">Available Coins</p>
              <p className="text-3xl font-bold text-[#111827]">{profile?.coin_balance || 0}</p>
            </div>
            <div className="size-14 rounded-full bg-[#F59E0B] flex items-center justify-center">
              <Coins className="size-7 text-white" />
            </div>
          </div>
          <button
            onClick={() => onNavigate?.('purchase')}
            className="mt-4 w-full py-2.5 bg-[#F59E0B] text-white rounded-[16px] font-semibold text-sm hover:bg-[#D97706] transition-colors"
          >
            Buy More Coins
          </button>
        </div>

        {/* Billing & Payment */}
        <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm">
          <h2 className="text-lg font-bold mb-4">Billing & Payment</h2>

          {/* Payment Method */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-[#111827] mb-3">Payment Method</h3>
            {!isFreeUser ? (
              <div className="flex items-center gap-4 p-4 rounded-[16px] bg-slate-50 border border-slate-200">
                <div className="size-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center text-white">
                  <CreditCard className="size-6" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-[#111827]">Credit Card</p>
                  <p className="text-sm text-[#6B7280]">•••• •••• •••• 4242</p>
                </div>
                <button className="px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  Update
                </button>
              </div>
            ) : (
              <div className="text-center py-6 px-4 bg-slate-50 rounded-[16px] border border-slate-200">
                <div className="size-12 rounded-full bg-slate-200 flex items-center justify-center mx-auto mb-3">
                  <CreditCard className="size-6 text-slate-400" />
                </div>
                <p className="text-sm text-[#6B7280] mb-2">No payment method</p>
                <p className="text-xs text-[#9CA3AF]">Add a payment method when you upgrade</p>
              </div>
            )}
          </div>

          {/* Billing Address */}
          <div className="pt-4 border-t border-[#E5E7EB]">
            <h3 className="text-sm font-semibold text-[#111827] mb-3">Billing Address</h3>
            {!isFreeUser ? (
              <div className="p-4 rounded-[16px] bg-slate-50 border border-slate-200">
                <p className="text-sm text-[#111827] font-medium mb-1">{profile?.full_name || 'User Name'}</p>
                <p className="text-sm text-[#6B7280]">{profile?.company_name || 'Company Name'}</p>
                <p className="text-sm text-[#6B7280]">Manila, Philippines</p>
                <button className="mt-3 text-sm font-semibold text-blue-600 hover:text-blue-700">
                  Edit Address
                </button>
              </div>
            ) : (
              <div className="text-center py-6 px-4 bg-slate-50 rounded-[16px] border border-slate-200">
                <p className="text-sm text-[#6B7280] mb-2">No billing address</p>
                <p className="text-xs text-[#9CA3AF]">Add billing details when you upgrade</p>
              </div>
            )}
          </div>
        </div>

        {/* Payment History */}
        <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm">
          <h2 className="text-lg font-bold mb-4">Payment History</h2>
          {!isFreeUser && payments.length > 0 ? (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 rounded-[16px] bg-slate-50 border border-slate-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-[#111827]">
                        {formatAmount(payment.amount, payment.currency)}
                      </p>
                      {getStatusBadge(payment.payment_status)}
                    </div>
                    <p className="text-xs text-[#6B7280]">
                      {formatDate(payment.created_at)} • {payment.payment_method}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 px-4">
              <div className="size-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <CreditCard className="size-8 text-slate-400" />
              </div>
              <p className="text-sm text-[#6B7280] mb-4">No payment history</p>
              <p className="text-xs text-[#9CA3AF]">
                {isFreeUser
                  ? 'Upgrade to a paid plan to see payment history'
                  : 'Your payment history will appear here'}
              </p>
            </div>
          )}
        </div>

        {/* Invoices */}
        <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm">
          <h2 className="text-lg font-bold mb-4">Invoices</h2>
          {!isFreeUser && invoices.length > 0 ? (
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 rounded-[16px] bg-slate-50 border border-slate-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-[#111827]">{invoice.invoice_number}</p>
                      {getStatusBadge(invoice.status)}
                    </div>
                    <p className="text-sm text-[#6B7280] mb-1">{invoice.description}</p>
                    <p className="text-xs text-[#6B7280]">
                      {formatDate(invoice.created_at)} • {formatAmount(invoice.amount, invoice.currency)}
                    </p>
                  </div>
                  <button className="size-10 rounded-full bg-blue-100 flex items-center justify-center hover:bg-blue-200 transition-colors">
                    <Download className="size-5 text-blue-600" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 px-4">
              <div className="size-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Download className="size-8 text-slate-400" />
              </div>
              <p className="text-sm text-[#6B7280] mb-4">No invoices available</p>
              <p className="text-xs text-[#9CA3AF]">
                {isFreeUser
                  ? 'Upgrade to a paid plan to receive invoices'
                  : 'Your invoices will appear here after payments'}
              </p>
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-[20px] p-4 flex items-start gap-3">
          <div className="size-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <AlertCircle className="size-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-[#111827] text-sm mb-1">Need Help?</p>
            <p className="text-xs text-[#6B7280]">
              Contact our support team if you have questions about your subscription or billing.
            </p>
          </div>
        </div>
      </main>

      {/* Save Offer Modal */}
      <SaveOfferModal
        isOpen={showSaveOffer}
        onClose={() => {
          setShowSaveOffer(false);
          setCancelFlowState('idle');
        }}
        onAcceptOffer={handleAcceptOffer}
        onContinueCancel={handleContinueToCancel}
        currentTier={tier}
      />

      {/* Cancel Reason Modal */}
      <CancelReasonModal
        isOpen={showReasonModal}
        onClose={() => {
          setShowReasonModal(false);
          setCancelFlowState('idle');
        }}
        onSubmit={handleSubmitCancelReason}
        onGoBack={handleGoBackFromReason}
        currentTier={tier}
      />
    </div>
  );
}
