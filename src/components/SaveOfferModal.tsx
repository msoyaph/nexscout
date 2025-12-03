import { X, Heart, Gift, TrendingDown, Sparkles } from 'lucide-react';
import { getTierPricing } from '../lib/subscriptionTiers';

interface SaveOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAcceptOffer: (offerType: string) => void;
  onContinueCancel: () => void;
  currentTier: string;
}

export default function SaveOfferModal({
  isOpen,
  onClose,
  onAcceptOffer,
  onContinueCancel,
  currentTier
}: SaveOfferModalProps) {
  if (!isOpen) return null;

  const tierPricing = getTierPricing(currentTier);
  const discount50 = (tierPricing.monthly * 0.5).toFixed(0);

  const benefits = {
    pro: [
      'Unlimited AI Scans',
      'Unlimited AI Messages',
      'DeepScan v2',
      'Multi-Channel Chatbot',
      'Company Intelligence v3',
      '7-Day AI Follow-Up'
    ],
    elite: [
      'Autonomous AI Closer v3',
      'Company Intelligence v6',
      'All Communication Channels',
      'Emotional Persuasion v3',
      '30-Day Follow-Up',
      'Lead Revival Engine'
    ],
    team: [
      'Team Dashboard',
      'Performance Reports',
      'Shared Pipelines',
      'Team Training Assistant',
      '5 seats included',
      'Pooled resources'
    ]
  };

  const currentBenefits = benefits[currentTier as keyof typeof benefits] || benefits.pro;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl animate-fadeIn">
        {/* Header */}
        <div className="relative p-6 pb-4">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Wait—Before You Go...</h2>
            </div>
          </div>

          <p className="text-gray-700 leading-relaxed">
            We noticed you're thinking about canceling. Your progress, AI tools, and leads are all saved. Maybe we can help?
          </p>
        </div>

        {/* Benefits You'll Lose */}
        <div className="px-6 py-4 bg-gradient-to-br from-red-50 to-pink-50 border-y border-red-100">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-red-500" />
            You'll lose access to:
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {currentBenefits.map((benefit, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0"></div>
                <span className="text-sm text-gray-700">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Offers */}
        <div className="p-6 space-y-3">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Gift className="w-5 h-5 text-[#1877F2]" />
            Keep Your {tierPricing.displayName} Benefits
          </h3>

          {/* Free 7-Day Extension */}
          <button
            onClick={() => onAcceptOffer('extension')}
            className="w-full p-4 rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 hover:border-green-300 transition-all text-left group"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-gray-900 mb-1">FREE 7-Day Extension</div>
                <div className="text-sm text-gray-600">No charge, full access</div>
              </div>
              <div className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded-full">
                FREE
              </div>
            </div>
          </button>

          {/* 50% OFF */}
          <button
            onClick={() => onAcceptOffer('discount')}
            className="w-full p-4 rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 hover:border-blue-300 transition-all text-left group"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-gray-900 mb-1">50% OFF Next Month</div>
                <div className="text-sm text-gray-600">Just ₱{discount50} instead of ₱{tierPricing.monthly}</div>
              </div>
              <div className="px-3 py-1 bg-[#1877F2] text-white text-xs font-bold rounded-full">
                SAVE 50%
              </div>
            </div>
          </button>

          {/* Downgrade Option */}
          {currentTier !== 'starter' && (
            <button
              onClick={() => onAcceptOffer('downgrade')}
              className="w-full p-4 rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 hover:border-purple-300 transition-all text-left group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-gray-900 mb-1">Switch to Cheaper Plan</div>
                  <div className="text-sm text-gray-600">
                    {currentTier === 'elite' ? 'Downgrade to Pro' : 'Downgrade to Starter'}
                  </div>
                </div>
                <TrendingDown className="w-5 h-5 text-purple-600" />
              </div>
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 space-y-3">
          <button
            onClick={onContinueCancel}
            className="w-full text-center text-sm text-gray-500 hover:text-gray-700 font-medium py-2 transition-colors"
          >
            Maybe Later → Continue to Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
