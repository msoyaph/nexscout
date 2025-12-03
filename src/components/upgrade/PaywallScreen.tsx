import React from 'react';
import { Check, Sparkles, Lock, ArrowLeft } from 'lucide-react';

interface PaywallScreenProps {
  title: string;
  message: string;
  benefits: string[];
  ctaText: string;
  targetTier: 'PRO' | 'TEAM';
  onUpgrade: () => void;
  onBack?: () => void;
}

export function PaywallScreen({
  title,
  message,
  benefits,
  ctaText,
  targetTier,
  onUpgrade,
  onBack,
}: PaywallScreenProps) {
  const tierConfig = {
    PRO: {
      gradient: 'from-blue-600 via-blue-500 to-indigo-500',
      accentGradient: 'from-blue-100 to-indigo-100',
      iconBg: 'bg-blue-600',
      buttonBg: 'bg-blue-600 hover:bg-blue-700',
      price: '₱1,299',
    },
    TEAM: {
      gradient: 'from-purple-600 via-purple-500 to-pink-500',
      accentGradient: 'from-purple-100 to-pink-100',
      iconBg: 'bg-purple-600',
      buttonBg: 'bg-purple-600 hover:bg-purple-700',
      price: '₱4,990',
    },
  };

  const config = tierConfig[targetTier];

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex flex-col">
      {/* Header */}
      <div className={`bg-gradient-to-r ${config.gradient} text-white py-6 px-4 shadow-lg`}>
        <div className="max-w-2xl mx-auto">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-white/90 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm">Back</span>
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-white/20 rounded-full blur"></div>
              <Lock className="w-10 h-10 relative" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{title}</h1>
              <p className="text-sm text-white/90 mt-1">
                {targetTier === 'PRO' ? 'Available with PRO' : 'Team Feature'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 pb-24">
        <div className="max-w-2xl mx-auto">
          {/* Message Card */}
          <div className={`bg-gradient-to-br ${config.accentGradient} rounded-2xl p-6 mb-6 shadow-sm`}>
            <p className="text-gray-800 leading-relaxed">{message}</p>
          </div>

          {/* Benefits */}
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className={`w-5 h-5 ${config.iconBg} text-white p-1 rounded`} />
              <h2 className="text-lg font-semibold text-gray-900">
                What You'll Unlock
              </h2>
            </div>

            <div className="space-y-3">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 animate-slide-in"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div className={`${config.iconBg} rounded-full p-1 flex-shrink-0 mt-0.5`}>
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Starting at</p>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold text-gray-900">{config.price}</span>
                <span className="text-gray-600">/month</span>
              </div>
              {targetTier === 'TEAM' && (
                <p className="text-xs text-gray-500 mt-2">Includes 5 seats</p>
              )}
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={onUpgrade}
            className={`
              w-full ${config.buttonBg}
              text-white py-4 rounded-xl
              font-semibold text-lg
              transition-all duration-200
              hover:scale-105 active:scale-95
              shadow-lg hover:shadow-xl
              flex items-center justify-center gap-2
            `}
          >
            <Sparkles className="w-5 h-5" />
            {ctaText}
          </button>

          {/* Trust Signals */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-xs text-gray-500">
              ✓ Cancel anytime • No hidden fees • Start immediately
            </p>
            <p className="text-xs text-gray-500">
              Join hundreds of closers upgrading their sales game
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.4s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}
