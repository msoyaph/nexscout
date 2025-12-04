import React, { useState } from 'react';
import { Lock, Sparkles } from 'lucide-react';

interface FeaturePaywallProps {
  featureName: string;
  description?: string;
  targetTier: 'PRO' | 'TEAM';
  onUpgrade: () => void;
  variant?: 'button' | 'card' | 'inline';
  className?: string;
}

/**
 * Inline feature paywall - blocks UI elements with upgrade prompts
 */
export function FeaturePaywall({
  featureName,
  description,
  targetTier,
  onUpgrade,
  variant = 'button',
  className = '',
}: FeaturePaywallProps) {
  const [isShaking, setIsShaking] = useState(false);

  const tierConfig = {
    PRO: {
      badge: 'PRO',
      color: 'blue',
      gradient: 'from-blue-600 to-blue-500',
    },
    TEAM: {
      badge: 'TEAM',
      color: 'purple',
      gradient: 'from-purple-600 to-purple-500',
    },
  };

  const config = tierConfig[targetTier];

  const handleClick = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
    onUpgrade();
  };

  if (variant === 'button') {
    return (
      <button
        onClick={handleClick}
        className={`
          relative px-4 py-2 rounded-lg
          bg-gray-100 text-gray-400
          border-2 border-dashed border-gray-300
          transition-all duration-200
          hover:bg-gray-200 hover:border-${config.color}-400
          cursor-not-allowed
          ${isShaking ? 'animate-shake' : ''}
          ${className}
        `}
      >
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4" />
          <span className="font-medium">{featureName}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full bg-${config.color}-100 text-${config.color}-700 font-bold`}>
            {config.badge}
          </span>
        </div>

        <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
          }
          .animate-shake {
            animation: shake 0.5s ease-in-out;
          }
        `}</style>
      </button>
    );
  }

  if (variant === 'card') {
    return (
      <div
        onClick={handleClick}
        className={`
          relative p-6 rounded-xl
          bg-gradient-to-br ${config.gradient}
          text-white
          cursor-pointer
          transition-all duration-200
          hover:scale-105
          ${isShaking ? 'animate-shake' : ''}
          ${className}
        `}
      >
        <div className="flex items-start justify-between mb-3">
          <Lock className="w-6 h-6" />
          <span className="text-xs px-2 py-1 rounded-full bg-white/20 font-bold">
            {config.badge} REQUIRED
          </span>
        </div>

        <h3 className="text-lg font-bold mb-1">{featureName}</h3>
        {description && (
          <p className="text-sm text-white/90 mb-4">{description}</p>
        )}

        <button className="w-full bg-white text-gray-900 py-2 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4" />
          Upgrade Now
        </button>

        <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
          }
          .animate-shake {
            animation: shake 0.5s ease-in-out;
          }
        `}</style>
      </div>
    );
  }

  // Inline variant - subtle lock indicator
  return (
    <div
      onClick={handleClick}
      className={`
        inline-flex items-center gap-2
        px-3 py-1 rounded-full
        bg-gray-100 text-gray-600
        text-sm
        cursor-pointer
        transition-all duration-200
        hover:bg-gray-200
        ${isShaking ? 'animate-shake' : ''}
        ${className}
      `}
    >
      <Lock className="w-3 h-3" />
      <span>{featureName}</span>
      <span className={`text-xs px-1.5 py-0.5 rounded-full bg-${config.color}-100 text-${config.color}-700 font-bold`}>
        {config.badge}
      </span>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}

/**
 * Blur overlay for locked content
 */
export function BlurredContent({
  children,
  featureName,
  targetTier,
  onUpgrade,
}: {
  children: React.ReactNode;
  featureName: string;
  targetTier: 'PRO' | 'TEAM';
  onUpgrade: () => void;
}) {
  const config = targetTier === 'PRO'
    ? { badge: 'PRO', gradient: 'from-blue-600 to-blue-500' }
    : { badge: 'TEAM', gradient: 'from-purple-600 to-purple-500' };

  return (
    <div className="relative">
      {/* Blurred content */}
      <div className="filter blur-sm pointer-events-none select-none">
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        <div className="text-center p-6 max-w-sm">
          <Lock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {featureName} Locked
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Upgrade to {config.badge} to unlock this feature
          </p>
          <button
            onClick={onUpgrade}
            className={`
              bg-gradient-to-r ${config.gradient}
              text-white px-6 py-2 rounded-full
              font-semibold text-sm
              hover:scale-105 transition-transform
              flex items-center justify-center gap-2 mx-auto
            `}
          >
            <Sparkles className="w-4 h-4" />
            Upgrade to {config.badge}
          </button>
        </div>
      </div>
    </div>
  );
}
