import { X, Lock, Crown, Sparkles, Zap } from 'lucide-react';
import { TIER_PRICING, SUBSCRIPTION_TIERS } from '../lib/subscriptionTiers';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  feature: string;
  requiredTier: 'pro' | 'elite';
  currentTier: string;
}

export default function PaywallModal({
  isOpen,
  onClose,
  onUpgrade,
  feature,
  requiredTier,
  currentTier
}: PaywallModalProps) {
  if (!isOpen) return null;

  const pricing = TIER_PRICING[requiredTier];
  const isElite = requiredTier === SUBSCRIPTION_TIERS.ELITE;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-[32px] max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 size-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-white transition-colors"
        >
          <X className="size-5 text-slate-700" />
        </button>

        <div className={`relative p-8 ${
          isElite
            ? 'bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600'
            : 'bg-gradient-to-br from-blue-500 to-blue-600'
        }`}>
          <div className="relative">
            <div className="absolute inset-0 bg-white/10 blur-3xl rounded-full" />
            <div className="relative text-center">
              {isElite ? (
                <Crown className="size-16 text-white mx-auto mb-4" fill="white" />
              ) : (
                <Sparkles className="size-16 text-white mx-auto mb-4" />
              )}
              <h2 className="text-2xl font-bold text-white mb-2">
                Unlock {feature}
              </h2>
              <p className="text-white/90 text-sm">
                This feature requires {pricing.displayName} plan
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className={`size-8 rounded-full flex items-center justify-center shrink-0 ${
                isElite ? 'bg-gradient-to-br from-purple-100 to-pink-100' : 'bg-blue-100'
              }`}>
                <Zap className={`size-4 ${isElite ? 'text-purple-600' : 'text-blue-600'}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">
                  {isElite ? 'Elite AI Features' : 'Pro AI Features'}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  {isElite
                    ? 'Advanced AI insights, scores, and multi-step sequences'
                    : 'Unlimited scans, messages, and basic AI insights'}
                </p>
              </div>
            </div>

            {isElite && (
              <>
                <div className="flex items-start gap-3">
                  <div className="size-8 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center shrink-0">
                    <Lock className="size-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">Affordability Score</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Know if prospects can afford your offering
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="size-8 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center shrink-0">
                    <Crown className="size-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">Leadership Potential</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Identify future team leaders and recruiters
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className={`rounded-[20px] p-4 ${
            isElite
              ? 'bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200'
              : 'bg-blue-50 border border-blue-200'
          }`}>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-3xl font-bold text-slate-900">
                {pricing.currency}{pricing.monthly}
              </span>
              <span className="text-sm text-slate-600">/month</span>
            </div>
            <p className="text-xs text-slate-600">
              +{pricing.weeklyCoins} coins per week included
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                onUpgrade();
                onClose();
              }}
              className={`w-full py-4 rounded-[20px] font-bold text-white shadow-lg hover:shadow-xl transition-all ${
                isElite
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              Upgrade to {pricing.displayName}
            </button>

            <button
              onClick={onClose}
              className="w-full py-3 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
