import React, { useEffect, useState } from 'react';
import { X, TrendingUp, Zap, Target, Clock } from 'lucide-react';
import { type SurgeEvent, type DynamicOffer } from '../services/dynamicNudgesV4';

interface SurgeNudgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  surge: SurgeEvent;
  offer: DynamicOffer;
  onUpgrade: () => void;
}

export function SurgeNudgeModal({ isOpen, onClose, surge, offer, onUpgrade }: SurgeNudgeModalProps) {
  const [timeLeft, setTimeLeft] = useState(offer.expiresIn * 60);

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getIntensityColor = () => {
    switch (surge.intensity) {
      case 'strong': return 'from-red-500 to-orange-500';
      case 'moderate': return 'from-orange-500 to-yellow-500';
      default: return 'from-yellow-500 to-amber-500';
    }
  };

  const getUrgencyStyles = () => {
    switch (offer.urgency) {
      case 'critical': return 'border-red-500 bg-gradient-to-br from-red-50 to-orange-50';
      case 'high': return 'border-orange-500 bg-gradient-to-br from-orange-50 to-yellow-50';
      case 'medium': return 'border-yellow-500 bg-gradient-to-br from-yellow-50 to-amber-50';
      default: return 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div
        className={`bg-white rounded-2xl shadow-2xl max-w-lg w-full border-4 ${getUrgencyStyles()} animate-shake relative overflow-hidden`}
      >
        <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${getIntensityColor()} animate-shimmer`} />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-orange-500 mb-4 animate-glow">
              <Zap className="w-10 h-10 text-white" />
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {surge.intensity === 'strong' ? '🔥🔥🔥' : surge.intensity === 'moderate' ? '🔥🔥' : '🔥'}
              {' '}SURGE DETECTED!
            </h2>

            <p className="text-lg text-gray-700 font-medium">
              {offer.copyVariant}
            </p>
          </div>

          <div className="bg-white/80 rounded-xl p-6 mb-6 border-2 border-gray-200">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-1" />
                <div className="text-sm text-gray-600">Activity Surge</div>
                <div className="text-2xl font-bold text-gray-900">{surge.value}</div>
              </div>

              <div className="text-center">
                <Target className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                <div className="text-sm text-gray-600">ROI Estimate</div>
                <div className="text-2xl font-bold text-green-600">
                  ₱{offer.roi_estimate.toLocaleString()}
                </div>
              </div>
            </div>

            {offer.discount > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600">Original Price</div>
                    <div className="text-lg text-gray-500 line-through">
                      ₱{offer.originalPrice.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-green-700 font-semibold">
                      {offer.discountReason}
                    </div>
                    <div className="text-3xl font-bold text-green-600">
                      ₱{offer.finalPrice.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-center">
                  <span className="inline-flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    Save ₱{(offer.originalPrice - offer.finalPrice).toLocaleString()} ({offer.discount}% OFF)
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-center gap-2 text-red-600">
              <Clock className="w-5 h-5" />
              <span className="text-lg font-bold">
                Offer expires in: {formatTime(timeLeft)}
              </span>
            </div>

            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-500 to-orange-500 animate-countdown"
                style={{ '--countdown-duration': `${offer.expiresIn * 60}s` } as React.CSSProperties}
              />
            </div>
          </div>

          <button
            onClick={onUpgrade}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            Upgrade Now - Lock in Discount
          </button>

          <p className="text-center text-sm text-gray-500 mt-4">
            Cancel anytime • Instant activation
          </p>
        </div>
      </div>
    </div>
  );
}
