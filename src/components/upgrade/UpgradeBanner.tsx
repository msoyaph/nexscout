import React, { useEffect, useState } from 'react';
import { X, Sparkles } from 'lucide-react';

interface UpgradeBannerProps {
  message: string;
  ctaText?: string;
  onUpgrade: () => void;
  onDismiss?: () => void;
  autoDismiss?: boolean;
  autoDismissDelay?: number;
}

export function UpgradeBanner({
  message,
  ctaText = 'Upgrade Now',
  onUpgrade,
  onDismiss,
  autoDismiss = true,
  autoDismissDelay = 8000,
}: UpgradeBannerProps) {
  const [visible, setVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    if (autoDismiss) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoDismissDelay);

      return () => clearTimeout(timer);
    }
  }, [autoDismiss, autoDismissDelay]);

  useEffect(() => {
    const animTimer = setTimeout(() => setIsAnimating(false), 300);
    return () => clearTimeout(animTimer);
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  if (!visible) return null;

  return (
    <div
      className={`
        fixed top-4 left-1/2 -translate-x-1/2 z-50
        max-w-2xl w-full mx-4
        transition-all duration-300 ease-out
        ${isAnimating ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0'}
      `}
    >
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl shadow-2xl border border-blue-400/30">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Sparkles className="w-5 h-5 flex-shrink-0 animate-pulse" />
            <span className="text-sm font-medium leading-tight">{message}</span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onUpgrade}
              className="
                bg-white text-blue-600
                px-4 py-1.5 rounded-full
                text-sm font-semibold
                hover:bg-blue-50
                transition-all duration-200
                hover:scale-105
                active:scale-95
                shadow-sm
              "
            >
              {ctaText}
            </button>

            {onDismiss && (
              <button
                onClick={handleDismiss}
                className="
                  p-1 rounded-full
                  hover:bg-white/10
                  transition-colors
                "
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {autoDismiss && (
          <div className="h-1 bg-white/20 overflow-hidden rounded-b-xl">
            <div
              className="h-full bg-white/40 animate-countdown"
              style={{
                animation: `countdown ${autoDismissDelay}ms linear forwards`,
              }}
            />
          </div>
        )}
      </div>

      <style>{`
        @keyframes countdown {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}
