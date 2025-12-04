import React from 'react';
import { Sparkles, ArrowRight, Clock, TrendingUp } from 'lucide-react';
import { type DynamicOffer } from '../services/dynamicNudgesV4';

interface InChatUpgradeNudgeProps {
  offer: DynamicOffer;
  variant: 'minimal' | 'expanded' | 'urgent';
  onUpgrade: () => void;
  onDismiss: () => void;
}

export function InChatUpgradeNudge({ offer, variant, onUpgrade, onDismiss }: InChatUpgradeNudgeProps) {
  if (variant === 'minimal') {
    return (
      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg p-3 mb-3 text-white shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            <span className="text-sm font-medium">Unlock unlimited AI responses</span>
          </div>
          <button
            onClick={onUpgrade}
            className="bg-white text-blue-600 px-3 py-1 rounded-md text-sm font-semibold hover:bg-blue-50 transition-colors"
          >
            Upgrade
          </button>
        </div>
      </div>
    );
  }

  if (variant === 'urgent') {
    return (
      <div className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-300 rounded-xl p-4 mb-4 shadow-lg animate-shake">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center flex-shrink-0 animate-glow">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm font-bold text-gray-900">Limited Time Offer!</h4>
              <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-semibold">
                {offer.discount}% OFF
              </span>
            </div>
            <p className="text-xs text-gray-700 mb-2">{offer.copyVariant}</p>

            <div className="flex items-center gap-2 mb-3 text-xs text-red-600">
              <Clock className="w-4 h-4" />
              <span className="font-semibold">Expires in {offer.expiresIn} minutes</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onUpgrade}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105"
              >
                Upgrade for ₱{offer.finalPrice.toLocaleString()}
              </button>
              <button
                onClick={onDismiss}
                className="text-gray-400 hover:text-gray-600 text-sm px-2"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-4 mb-4 shadow-md">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h4 className="text-base font-bold text-gray-900 mb-1">
            Ready for more?
          </h4>
          <p className="text-sm text-gray-700 mb-3">{offer.copyVariant}</p>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-white rounded-lg p-2 border border-blue-200">
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp className="w-3 h-3 text-green-600" />
                <span className="text-xs text-gray-600">ROI Estimate</span>
              </div>
              <div className="text-sm font-bold text-green-600">
                ₱{offer.roi_estimate.toLocaleString()}/mo
              </div>
            </div>

            {offer.discount > 0 && (
              <div className="bg-white rounded-lg p-2 border border-green-200">
                <div className="text-xs text-gray-600 mb-1">Special Price</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xs text-gray-400 line-through">
                    ₱{offer.originalPrice}
                  </span>
                  <span className="text-sm font-bold text-green-600">
                    ₱{offer.finalPrice}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onUpgrade}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-1"
            >
              Upgrade Now
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onDismiss}
              className="text-gray-500 hover:text-gray-700 text-sm px-2"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
