/**
 * EmotionGauge Component
 * Circular gauge visualizing emotional confidence
 */
import React from "react";

interface EmotionGaugeProps {
  confidence: number; // 0–100
  emotionalTone: string;
  dominantSignal: string;
  className?: string;
}

function getColorClasses(score: number) {
  if (score >= 80) {
    return {
      text: "text-green-600",
      border: "border-green-500",
      ring: "ring-green-200",
      bg: "bg-green-50",
    };
  }
  if (score >= 40) {
    return {
      text: "text-yellow-600",
      border: "border-yellow-500",
      ring: "ring-yellow-200",
      bg: "bg-yellow-50",
    };
  }
  return {
    text: "text-red-600",
    border: "border-red-500",
    ring: "ring-red-200",
    bg: "bg-red-50",
  };
}

function getEmotionIcon(emotionalTone: string): string {
  const tone = emotionalTone.toLowerCase();
  if (tone.includes('excited') || tone.includes('hopeful')) return '😊';
  if (tone.includes('anxious') || tone.includes('worried')) return '😰';
  if (tone.includes('skeptical') || tone.includes('doubt')) return '🤔';
  if (tone.includes('confused')) return '😕';
  return '😐';
}

export const EmotionGauge: React.FC<EmotionGaugeProps> = ({
  confidence,
  emotionalTone,
  dominantSignal,
  className,
}) => {
  const clamped = Math.max(0, Math.min(100, confidence));
  const colors = getColorClasses(clamped);
  const emotionIcon = getEmotionIcon(emotionalTone);

  return (
    <div className={`flex items-center gap-4 ${className ?? ""}`}>
      <div className="relative flex-shrink-0">
        <div
          className={`
            relative w-16 h-16 rounded-full border-2 ${colors.border}
            flex items-center justify-center ring-4 ${colors.ring} ${colors.bg}
            transition-all duration-300
          `}
        >
          <span className="text-2xl">{emotionIcon}</span>
          <div className="absolute -bottom-1 -right-1 bg-white rounded-full px-1.5 py-0.5 shadow-sm border border-slate-200">
            <span className={`text-[10px] font-bold ${colors.text}`}>
              {clamped.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>
      <div className="flex flex-col flex-1 min-w-0">
        <span className="text-[10px] uppercase tracking-wide text-slate-500 font-medium mb-1">
          Emotional Tone
        </span>
        <span className="text-sm font-semibold text-slate-900 capitalize mb-1">
          {emotionalTone || "Unknown"}
        </span>
        {dominantSignal && (
          <span className="text-xs text-slate-600 truncate">
            <span className="font-medium text-slate-700">{dominantSignal}</span>
          </span>
        )}
      </div>
    </div>
  );
};


