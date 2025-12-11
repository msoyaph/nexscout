/**
 * HeatMeter Component
 * Visualizes score with color-coded heat meter
 */
import React from "react";

interface HeatMeterProps {
  score: number; // 0–100
  className?: string;
}

function getColorClasses(score: number) {
  // 🔴 Red = HOT, 🟠 Orange = WARM, 🔵 Sky = COLD
  if (score >= 80) {
    return {
      text: "text-red-600",
      bg: "bg-gradient-to-r from-red-500 to-red-600",
      border: "border-red-500",
    };
  }
  if (score >= 40) {
    return {
      text: "text-orange-600",
      bg: "bg-gradient-to-r from-orange-500 to-orange-600",
      border: "border-orange-500",
    };
  }
  return {
    text: "text-sky-600",
    bg: "bg-gradient-to-r from-sky-500 to-sky-600",
    border: "border-sky-500",
  };
}

function getLabel(score: number): "HOT" | "WARM" | "COLD" {
  if (score >= 80) return "HOT";
  if (score >= 40) return "WARM";
  return "COLD";
}

export const HeatMeter: React.FC<HeatMeterProps> = ({ score, className }) => {
  const clamped = Math.max(0, Math.min(100, score));
  const colors = getColorClasses(clamped);
  const label = getLabel(clamped);

  return (
    <div className={`flex flex-col gap-2 ${className ?? ""}`}>
      <div className="flex justify-between items-center">
        <span className="text-xs text-slate-500 uppercase tracking-wide font-medium">
          Heat Score
        </span>
        <span className={`text-sm font-bold ${colors.text}`}>
          {label} · {clamped.toFixed(0)} / 100
        </span>
      </div>
      <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden shadow-inner">
        <div
          className={`${colors.bg} h-3 rounded-full transition-all duration-500 ease-out shadow-sm`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};


