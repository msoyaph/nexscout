import React, { useEffect, useState } from 'react';
import { Sparkles, TrendingUp, Shield, Users, Zap, Heart } from 'lucide-react';
import { type EmotionalState, getEmotionalNudgeStyle } from '../../utils/adaptiveNudgeEngine';

interface EmotionalNudgeProps {
  emotion: EmotionalState;
  featureName?: string;
  dealsClosedcount?: number;
  onUpgrade: () => void;
  onDismiss?: () => void;
}

/**
 * Emotionally-aware upgrade nudge
 * Adapts messaging and tone based on user's emotional state
 */
export function EmotionalNudge({
  emotion,
  featureName = 'PRO',
  dealsCount = 0,
  onUpgrade,
  onDismiss,
}: EmotionalNudgeProps) {
  const [isVisible, setIsVisible] = useState(true);
  const style = getEmotionalNudgeStyle(emotion);

  useEffect(() => {
    // Track nudge shown
    // TODO: Integrate with analytics
  }, []);

  if (!isVisible) return null;

  // Get icon based on emotion
  const getEmotionIcon = () => {
    switch (emotion) {
      case 'excited':
      case 'momentum':
        return <Zap className="w-5 h-5" />;
      case 'confident':
        return <TrendingUp className="w-5 h-5" />;
      case 'overwhelmed':
      case 'stressed':
        return <Users className="w-5 h-5" />;
      case 'hesitant':
      case 'skeptical':
        return <Shield className="w-5 h-5" />;
      default:
        return <Heart className="w-5 h-5" />;
    }
  };

  // Get color scheme based on urgency
  const getColorScheme = () => {
    switch (style.urgency) {
      case 'high':
        return {
          gradient: 'from-orange-500 to-red-500',
          bg: 'bg-orange-500',
          text: 'text-orange-600',
        };
      case 'medium':
        return {
          gradient: 'from-blue-500 to-indigo-500',
          bg: 'bg-blue-500',
          text: 'text-blue-600',
        };
      case 'low':
        return {
          gradient: 'from-green-500 to-teal-500',
          bg: 'bg-green-500',
          text: 'text-green-600',
        };
    }
  };

  const colors = getColorScheme();

  // Personalize message
  const getMessage = () => {
    let message = style.messageTemplate.replace('{feature}', featureName);
    if (dealsCount > 0) {
      message = message.replace('{deals}', dealsCount.toString());
    }
    return message;
  };

  return (
    <div
      className={`
        fixed bottom-24 left-4 right-4 md:left-auto md:right-4 md:w-96
        z-50 animate-slide-up
      `}
    >
      <div
        className={`
          bg-gradient-to-r ${colors.gradient}
          text-white rounded-2xl shadow-2xl
          p-4 border border-white/20
        `}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            {getEmotionIcon()}
            <span className="text-xs font-semibold uppercase tracking-wide opacity-90">
              {style.tone}
            </span>
          </div>

          {onDismiss && (
            <button
              onClick={() => {
                setIsVisible(false);
                onDismiss();
              }}
              className="text-white/70 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Message */}
        <p className="text-sm leading-relaxed mb-3">{getMessage()}</p>

        {/* CTA Button */}
        <button
          onClick={onUpgrade}
          className={`
            w-full bg-white ${colors.text}
            py-2 px-4 rounded-xl
            font-semibold text-sm
            hover:scale-105 active:scale-95
            transition-all duration-200
            shadow-lg
            flex items-center justify-center gap-2
          `}
        >
          <Sparkles className="w-4 h-4" />
          {style.style === 'roi' ? 'See ROI Calculator' : 'Learn More'}
        </button>

        {/* Urgency indicator */}
        {style.urgency === 'high' && (
          <div className="mt-2 flex items-center justify-center gap-1 text-xs text-white/80">
            <span className="animate-pulse">⏰</span>
            <span>Limited time opportunity</span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}
