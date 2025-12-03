import React, { useEffect, useState } from 'react';
import { X, Check, Sparkles } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  benefits: string[];
  ctaText: string;
  targetTier: 'PRO' | 'TEAM';
  onClose: () => void;
  onUpgrade: () => void;
  dismissible?: boolean;
}

export function UpgradeModal({
  isOpen,
  title,
  message,
  benefits,
  ctaText,
  targetTier,
  onClose,
  onUpgrade,
  dismissible = true,
}: UpgradeModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (dismissible && e.target === e.currentTarget) {
      onClose();
    }
  };

  const tierColors = {
    PRO: {
      gradient: 'from-blue-600 to-blue-500',
      text: 'text-blue-600',
      bg: 'bg-blue-600',
      hover: 'hover:bg-blue-700',
    },
    TEAM: {
      gradient: 'from-purple-600 to-purple-500',
      text: 'text-purple-600',
      bg: 'bg-purple-600',
      hover: 'hover:bg-purple-700',
    },
  };

  const colors = tierColors[targetTier];

  return (
    <div
      className={`
        fixed inset-0 bg-black/50 backdrop-blur-sm
        flex items-center justify-center p-4 z-50
        transition-opacity duration-300
        ${isAnimating ? 'opacity-100' : 'opacity-0'}
      `}
      onClick={handleBackdropClick}
    >
      <div
        className={`
          bg-white rounded-2xl w-full max-w-md shadow-2xl
          transform transition-all duration-300
          ${isAnimating ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}
        `}
      >
        {/* Header */}
        <div className={`bg-gradient-to-r ${colors.gradient} text-white p-6 rounded-t-2xl relative`}>
          {dismissible && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-6 h-6" />
            <h2 className="text-xl font-bold">{title}</h2>
          </div>
          <p className="text-blue-100 text-sm">{message}</p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Benefits */}
          <div className="space-y-2">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex items-start gap-2 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={`${colors.bg} rounded-full p-0.5 flex-shrink-0 mt-0.5`}>
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm text-gray-700">{benefit}</span>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <button
            onClick={onUpgrade}
            className={`
              w-full ${colors.bg} ${colors.hover}
              text-white py-3 rounded-xl
              font-semibold text-base
              transition-all duration-200
              hover:scale-105 active:scale-95
              shadow-lg hover:shadow-xl
              flex items-center justify-center gap-2
            `}
          >
            <Sparkles className="w-5 h-5" />
            {ctaText}
          </button>

          {/* Dismiss link */}
          {dismissible && (
            <button
              onClick={onClose}
              className="w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors py-2"
            >
              Maybe Later
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
