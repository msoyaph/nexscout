import { useState } from 'react';
import { ArrowLeft, CreditCard, Lock, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { walletService } from '../services/walletService';

interface CheckoutPageProps {
  onBack: () => void;
  onConfirmPurchase: () => void;
  packageData: {
    coins: number;
    price: number;
    bonus?: number;
  };
}

export default function CheckoutPage({ onBack, onConfirmPurchase, packageData }: CheckoutPageProps) {
  const { profile, refreshProfile } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'card' | 'gcash' | 'paymaya'>('card');

  const handleConfirm = async () => {
    if (!profile?.id) {
      setError('Please log in to complete purchase');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const totalCoins = packageData.coins + (packageData.bonus || 0);

      await new Promise(resolve => setTimeout(resolve, 2000));

      const result = await walletService.purchaseCoins(
        profile.id,
        totalCoins,
        packageData.price,
        selectedPaymentMethod,
        transactionId
      );

      if (result.success) {
        await refreshProfile();
        onConfirmPurchase();
      } else {
        setError('Payment failed. Please try again.');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('An error occurred during payment. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const totalCoins = packageData.coins + (packageData.bonus || 0);

  return (
    <div className="relative min-h-screen bg-[#F8F9FA] text-slate-900 overflow-hidden pb-28">
      <header className="flex items-center justify-between px-6 py-6 sticky top-0 z-10 bg-[#F8F9FA]/90 backdrop-blur-sm">
        <button
          onClick={onBack}
          disabled={processing}
          className="flex items-center justify-center size-10 rounded-full bg-white border border-slate-100 shadow-sm active:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="size-6 text-slate-600" />
        </button>
        <h2 className="text-lg font-semibold font-heading">Checkout</h2>
        <div className="size-10" />
      </header>

      <div className="px-6 pt-4 space-y-6">
        <div className="bg-gradient-to-br from-blue-600 to-blue-500 rounded-3xl p-6 text-white shadow-xl">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-blue-100 text-sm mb-1">You're Purchasing</p>
              <div className="flex items-baseline gap-2">
                <h2 className="text-4xl font-bold">{totalCoins.toLocaleString()}</h2>
                <span className="text-blue-100 text-lg">Coins</span>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
              <Sparkles className="size-8 text-yellow-300" />
            </div>
          </div>

          {packageData.bonus && (
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
              <Sparkles className="size-4 text-yellow-300" />
              <span className="text-sm">
                Includes <span className="font-bold">{packageData.bonus}</span> bonus coins
              </span>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <CreditCard className="size-5 text-blue-600" />
            Payment Summary
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 text-sm">Base Coins</span>
              <span className="font-semibold text-slate-900">{packageData.coins.toLocaleString()}</span>
            </div>
            {packageData.bonus && (
              <div className="flex justify-between items-center">
                <span className="text-slate-600 text-sm">Bonus Coins</span>
                <span className="font-semibold text-green-600">+{packageData.bonus}</span>
              </div>
            )}
            <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
              <span className="font-bold text-slate-900">Total Coins</span>
              <span className="font-bold text-blue-600 text-lg">{totalCoins.toLocaleString()}</span>
            </div>
            <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
              <span className="font-bold text-slate-900">Amount to Pay</span>
              <span className="font-bold text-slate-900 text-2xl">₱{packageData.price.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4">Payment Method</h3>
          <div className="space-y-3">
            <button
              onClick={() => setSelectedPaymentMethod('card')}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-colors ${
                selectedPaymentMethod === 'card'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="size-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center text-white">
                <CreditCard className="size-6" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-slate-900">Credit / Debit Card</p>
                <p className="text-xs text-slate-500">Visa, Mastercard, Amex</p>
              </div>
              {selectedPaymentMethod === 'card' && (
                <div className="size-5 rounded-full border-2 border-blue-600 bg-blue-600 flex items-center justify-center">
                  <div className="size-2 rounded-full bg-white" />
                </div>
              )}
            </button>

            <button
              onClick={() => setSelectedPaymentMethod('gcash')}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-colors ${
                selectedPaymentMethod === 'gcash'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="size-12 rounded-xl bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                G
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-slate-900">GCash</p>
                <p className="text-xs text-slate-500">Fast & secure</p>
              </div>
              {selectedPaymentMethod === 'gcash' && (
                <div className="size-5 rounded-full border-2 border-blue-600 bg-blue-600 flex items-center justify-center">
                  <div className="size-2 rounded-full bg-white" />
                </div>
              )}
            </button>

            <button
              onClick={() => setSelectedPaymentMethod('paymaya')}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-colors ${
                selectedPaymentMethod === 'paymaya'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="size-12 rounded-xl bg-green-500 flex items-center justify-center text-white font-bold text-sm">
                PM
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-slate-900">PayMaya</p>
                <p className="text-xs text-slate-500">Fast & secure</p>
              </div>
              {selectedPaymentMethod === 'paymaya' && (
                <div className="size-5 rounded-full border-2 border-blue-600 bg-blue-600 flex items-center justify-center">
                  <div className="size-2 rounded-full bg-white" />
                </div>
              )}
            </button>
          </div>
        </div>

        <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-start gap-3">
          <div className="size-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <Lock className="size-5 text-green-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-slate-900 text-sm mb-1">Secure Payment</p>
            <p className="text-xs text-slate-600">
              Your payment information is encrypted and secure. We never store your card details.
            </p>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-5 bg-white/90 backdrop-blur-md border-t border-slate-100 z-20">
        {error && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center">
            {error}
          </div>
        )}
        <button
          onClick={handleConfirm}
          disabled={processing}
          className="w-full h-14 bg-blue-600 active:bg-blue-700 text-white rounded-2xl font-semibold text-lg shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processing ? (
            <>
              <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing Payment...
            </>
          ) : (
            <>
              <Lock className="size-5" />
              Confirm Purchase • ₱{packageData.price.toFixed(2)}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
