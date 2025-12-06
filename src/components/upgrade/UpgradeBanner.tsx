import React, { useEffect, useState, useRef } from 'react';
import { X, Sparkles } from 'lucide-react';

interface UpgradeBannerProps {
  message: string;
  ctaText?: string;
  onUpgrade: () => void;
  onDismiss?: () => void;
  autoDismiss?: boolean;
  autoDismissDelay?: number;
}

// Smart dismissal tracking - prevents spamming
const DISMISSAL_COOLDOWN = 5 * 60 * 1000; // 5 minutes
const MAX_DISMISSALS_PER_HOUR = 3;
const STORAGE_KEY = 'upgrade_banner_dismissals';

interface DismissalRecord {
  timestamp: number;
  count: number;
}

function getDismissalHistory(): DismissalRecord[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const history: DismissalRecord[] = JSON.parse(stored);
    // Clean old records (older than 1 hour)
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    return history.filter(record => record.timestamp > oneHourAgo);
  } catch {
    return [];
  }
}

function canShowBanner(): boolean {
  const history = getDismissalHistory();
  if (history.length === 0) return true;

  // Check if we've exceeded max dismissals per hour
  const recentDismissals = history.filter(
    record => Date.now() - record.timestamp < 60 * 60 * 1000
  );
  if (recentDismissals.length >= MAX_DISMISSALS_PER_HOUR) {
    return false;
  }

  // Check cooldown - don't show if dismissed recently
  const lastDismissal = history[history.length - 1];
  if (lastDismissal && Date.now() - lastDismissal.timestamp < DISMISSAL_COOLDOWN) {
    return false;
  }

  return true;
}

function recordDismissal() {
  const history = getDismissalHistory();
  history.push({
    timestamp: Date.now(),
    count: history.length + 1,
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function UpgradeBanner({
  message,
  ctaText = 'Upgrade Now',
  onUpgrade,
  onDismiss,
  autoDismiss = true,
  autoDismissDelay = 8000,
}: UpgradeBannerProps) {
  const [visible, setVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const hasCheckedRef = useRef(false);

  // Smart appearance check - only show if not recently dismissed
  useEffect(() => {
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    if (canShowBanner()) {
      setVisible(true);
      // Trigger slide-in animation
      setTimeout(() => setIsAnimating(true), 10);
    }
  }, []);

  useEffect(() => {
    if (autoDismiss && visible) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoDismissDelay);

      return () => clearTimeout(timer);
    }
  }, [autoDismiss, autoDismissDelay, visible]);

  const handleDismiss = () => {
    setIsExiting(true);
    recordDismissal();
    setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, 300); // Wait for exit animation
  };

  const handleUpgrade = () => {
    // Navigate to pricing page
    onUpgrade();
    handleDismiss();
  };

  if (!visible) return null;

  return (
    <div
      className={`
        fixed top-4 right-4 z-50
        max-w-sm w-full
        transition-all duration-300 ease-out
        ${isExiting 
          ? 'opacity-0 translate-x-full' 
          : isAnimating 
            ? 'opacity-100 translate-x-0' 
            : 'opacity-0 translate-x-full'
        }
      `}
    >
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl shadow-2xl border border-blue-400/30 backdrop-blur-sm">
        <div className="px-4 py-3">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 flex-shrink-0 animate-pulse mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-tight mb-2">{message}</p>
              <button
                onClick={handleUpgrade}
                className="
                  bg-white text-blue-600
                  px-4 py-1.5 rounded-full
                  text-sm font-semibold
                  hover:bg-blue-50
                  transition-all duration-200
                  hover:scale-105
                  active:scale-95
                  shadow-sm
                  w-full
                "
              >
                {ctaText}
              </button>
            </div>
            <button
              onClick={handleDismiss}
              className="
                p-1.5 rounded-full
                hover:bg-white/20
                transition-colors
                flex-shrink-0
                -mt-1 -mr-1
              "
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {autoDismiss && (
          <div className="h-1 bg-white/20 overflow-hidden rounded-b-xl">
            <div
              className="h-full bg-white/40"
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
