import { useState } from 'react';
import { ArrowLeft, CreditCard, Lock, Crown, Zap, Users, Sparkles, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { SUBSCRIPTION_TIERS, TIER_PRICING } from '../lib/subscriptionTiers';

interface SubscriptionCheckoutPageProps {
  onBack: () => void;
  onSuccess: () => void;
  tier: string;
  billingCycle: 'monthly' | 'annual';
}

export default function SubscriptionCheckoutPage({
  onBack,
  onSuccess,
  tier,
  billingCycle
}: SubscriptionCheckoutPageProps) {
  const { profile } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal'>('card');

  const pricing = TIER_PRICING[tier as keyof typeof TIER_PRICING];

  if (!pricing) {
    return (
      <div className="relative min-h-screen bg-[#F3F4F6] text-[#111827] flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold mb-4">Invalid subscription tier</p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const price = billingCycle === 'monthly' ? pricing.monthly : pricing.annual;
  const monthlyPrice = billingCycle === 'monthly' ? price : Math.floor(price / 12);
  const savings = billingCycle === 'annual' ? pricing.monthly * 12 - pricing.annual : 0;

  const getIcon = () => {
    switch (tier) {
      case SUBSCRIPTION_TIERS.PRO:
        return Crown; // Pro now gets the crown
      case SUBSCRIPTION_TIERS.TEAM:
        return Users;
      default:
        return Sparkles;
    }
  };

  const Icon = getIcon();

  const handleConfirm = async () => {
    if (!profile?.id) return;

    setProcessing(true);

    try {
      // SuperAdmin bypass: Skip payment for SuperAdmin
      const isSuperAdmin = profile.email === 'geoffmax22@gmail.com';
      
      if (!isSuperAdmin) {
        // In production, integrate with actual payment processor (Stripe, PayPal, etc.)
        // For now, simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Get the plan ID from the database
      const { data: planData, error: planError } = await supabase
        .from('subscription_plans')
        .select('id')
        .eq('name', tier)
        .maybeSingle();

      if (planError) throw planError;
      if (!planData) throw new Error('Plan not found');

      // Calculate subscription end date
      // SuperAdmin gets lifetime access (far future date), others get normal period
      const endDate = isSuperAdmin 
        ? new Date('2099-12-31 23:59:59+00')
        : (() => {
            const date = new Date();
            if (billingCycle === 'monthly') {
              date.setMonth(date.getMonth() + 1);
            } else {
              date.setFullYear(date.getFullYear() + 1);
            }
            return date;
          })();

      // Update user's subscription
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          subscription_tier: tier,
          subscription_end_date: endDate.toISOString()
        })
        .eq('id', profile.id);

      if (profileError) throw profileError;

      // Create subscription record
      // Note: user_subscriptions doesn't have amount/currency/payment_status columns
      // Those are stored in payment_history table instead
      const { error: subError } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: profile.id,
          plan_id: planData.id,
          status: 'active',
          billing_cycle: isSuperAdmin ? 'annual' : billingCycle, // Use 'annual' since CHECK constraint doesn't allow 'lifetime'
          current_period_start: new Date().toISOString(),
          current_period_end: endDate.toISOString(),
          cancel_at_period_end: false,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (subError) throw subError;

      // Award first week's coins immediately after subscription payment
      // Subsequent weekly coins will be distributed automatically via weekly distribution service
      if (pricing.weeklyCoins > 0) {
        const { error: coinError } = await supabase.rpc('record_coin_transaction', {
          p_user_id: profile.id,
          p_amount: pricing.weeklyCoins,
          p_type: 'bonus',
          p_description: `Pro subscription: ${pricing.weeklyCoins} coins (first week) - Weekly distribution starts after payment`
        });
        
        if (coinError) {
          console.error('[SubscriptionCheckout] Error awarding first week coins:', coinError);
        } else {
          console.log(`[SubscriptionCheckout] ✅ Awarded ${pricing.weeklyCoins} coins (first week) to Pro subscriber`);
        }
      }

      onSuccess();
    } catch (error) {
      console.error('Error processing subscription:', error);
      alert('Failed to process subscription. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#F3F4F6] text-[#111827] overflow-hidden pb-28">
      <header className="flex items-center justify-between px-6 py-6 sticky top-0 z-10 bg-white shadow-sm">
        <button
          onClick={onBack}
          disabled={processing}
          className="size-10 rounded-full bg-white flex items-center justify-center border border-[#E5E7EB] shadow-sm active:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="size-5 text-[#111827]" />
        </button>
        <h2 className="text-lg font-bold">Checkout</h2>
        <div className="size-10" />
      </header>

      <div className="px-6 pt-4 space-y-6">
        {/* Plan Summary */}
        <div className={`rounded-[24px] p-6 text-white shadow-xl ${
          tier === SUBSCRIPTION_TIERS.PRO
            ? 'bg-gradient-to-br from-purple-600 via-pink-600 to-purple-600'
            : tier === SUBSCRIPTION_TIERS.TEAM
            ? 'bg-gradient-to-br from-green-600 to-emerald-600'
            : 'bg-gradient-to-br from-slate-600 to-slate-500'
        }`}>
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-white/80 text-sm mb-1">You're Subscribing to</p>
              <div className="flex items-baseline gap-2 mb-2">
                <h2 className="text-3xl font-bold">{pricing.displayName}</h2>
                {tier === SUBSCRIPTION_TIERS.PRO && <Crown className="size-6" fill="white" />}
              </div>
              <p className="text-white/90 text-sm">{billingCycle === 'monthly' ? 'Monthly' : 'Annual'} Billing</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
              <Icon className="size-8 text-white" />
            </div>
          </div>

          {pricing.weeklyCoins > 0 && (
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
              <Sparkles className="size-4 text-yellow-300" />
              <span className="text-sm">
                Includes <span className="font-bold">300</span> Coins per month
              </span>
            </div>
          )}
        </div>

        {/* Pricing Details */}
        <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm">
          <h3 className="font-bold text-[#111827] mb-4 flex items-center gap-2">
            <CreditCard className="size-5 text-blue-600" />
            Payment Summary
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[#6B7280] text-sm">{pricing.displayName} Plan</span>
              <span className="font-semibold text-[#111827]">₱{monthlyPrice}/month</span>
            </div>
            {billingCycle === 'annual' && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-[#6B7280] text-sm">Billing Cycle</span>
                  <span className="font-semibold text-[#111827]">Annual (12 months)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-green-600 text-sm font-semibold">You Save</span>
                  <span className="font-bold text-green-600">₱{savings}</span>
                </div>
              </>
            )}
            <div className="border-t border-[#E5E7EB] pt-3 flex justify-between items-center">
              <span className="font-bold text-[#111827]">Total Due Today</span>
              <span className="font-bold text-blue-600 text-2xl">₱{price}</span>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm">
          <h3 className="font-bold text-[#111827] mb-4">Payment Method</h3>
          <div className="space-y-3">
            <button
              onClick={() => setPaymentMethod('card')}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-colors ${
                paymentMethod === 'card'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-[#E5E7EB] hover:border-[#D1D5DB]'
              }`}
            >
              <div className="size-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center text-white">
                <CreditCard className="size-6" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-[#111827]">Credit / Debit Card</p>
                <p className="text-xs text-[#6B7280]">Visa, Mastercard, Amex</p>
              </div>
              <div className={`size-5 rounded-full border-2 flex items-center justify-center ${
                paymentMethod === 'card'
                  ? 'border-blue-600 bg-blue-600'
                  : 'border-[#D1D5DB]'
              }`}>
                {paymentMethod === 'card' && <div className="size-2 rounded-full bg-white" />}
              </div>
            </button>

            <button
              onClick={() => setPaymentMethod('paypal')}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-colors ${
                paymentMethod === 'paypal'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-[#E5E7EB] hover:border-[#D1D5DB]'
              }`}
            >
              <div className="size-12 rounded-xl bg-slate-100 flex items-center justify-center">
                <svg className="size-6" viewBox="0 0 24 24" fill="#00457C">
                  <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.024.146c-.083.518.258.971.774.971h4.386a.82.82 0 0 0 .811-.695l.033-.177.626-3.973.041-.221a.82.82 0 0 1 .811-.695h.511c3.426 0 6.106-1.39 6.89-5.413.329-1.688.158-3.102-.772-4.099-.285-.307-.647-.58-1.092-.791z"/>
                </svg>
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-[#111827]">PayPal</p>
                <p className="text-xs text-[#6B7280]">Fast & secure</p>
              </div>
              <div className={`size-5 rounded-full border-2 flex items-center justify-center ${
                paymentMethod === 'paypal'
                  ? 'border-blue-600 bg-blue-600'
                  : 'border-[#D1D5DB]'
              }`}>
                {paymentMethod === 'paypal' && <div className="size-2 rounded-full bg-white" />}
              </div>
            </button>
          </div>
        </div>

        {/* Security Badge */}
        <div className="bg-green-50 border border-green-200 rounded-[20px] p-4 flex items-start gap-3">
          <div className="size-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <Lock className="size-5 text-green-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-[#111827] text-sm mb-1">Secure Payment</p>
            <p className="text-xs text-[#6B7280]">
              Your payment is encrypted and secure. Cancel anytime.
            </p>
          </div>
        </div>

        {/* What You Get */}
        <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm">
          <h3 className="font-bold text-[#111827] mb-4">What You Get</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="size-5 text-green-600 shrink-0 mt-0.5" />
              <span className="text-sm text-[#6B7280]">
                Instant access to all {pricing.displayName} features
              </span>
            </div>
            {pricing.weeklyCoins > 0 && (
              <div className="flex items-start gap-3">
                <CheckCircle className="size-5 text-green-600 shrink-0 mt-0.5" />
                <span className="text-sm text-[#6B7280]">
                  300 Coins per month automatically added
                </span>
              </div>
            )}
            <div className="flex items-start gap-3">
              <CheckCircle className="size-5 text-green-600 shrink-0 mt-0.5" />
              <span className="text-sm text-[#6B7280]">
                Cancel anytime, no questions asked
              </span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="size-5 text-green-600 shrink-0 mt-0.5" />
              <span className="text-sm text-[#6B7280]">
                Priority customer support
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/95 backdrop-blur-md border-t border-[#E5E7EB] z-20">
        <button
          onClick={handleConfirm}
          disabled={processing}
          className="w-full h-14 bg-blue-600 active:bg-blue-700 text-white rounded-[20px] font-bold text-lg shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processing ? (
            <>
              <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing Payment...
            </>
          ) : (
            <>
              <Lock className="size-5" />
              Confirm & Subscribe • ₱{price}
            </>
          )}
        </button>
        <p className="text-center text-xs text-[#6B7280] mt-3">
          By subscribing, you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
}
