/**
 * TimelineBar Component
 * Horizontal bar showing interaction timeline and momentum
 */
import React from "react";
import { TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";

interface TimelineBarProps {
  daysSilent: number;
  timelineStrength: number; // 0–100
  momentum: "warming" | "cooling" | "stable" | "volatile";
  className?: string;
}

function getMomentumIcon(m: TimelineBarProps["momentum"]) {
  switch (m) {
    case "warming":
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    case "cooling":
      return <TrendingDown className="w-4 h-4 text-red-600" />;
    case "volatile":
      return <Activity className="w-4 h-4 text-yellow-600" />;
    case "stable":
    default:
      return <Minus className="w-4 h-4 text-slate-400" />;
  }
}

function getMomentumLabel(m: TimelineBarProps["momentum"]): string {
  switch (m) {
    case "warming":
      return "Warming Up";
    case "cooling":
      return "Cooling Down";
    case "volatile":
      return "Volatile Interest";
    case "stable":
    default:
      return "Stable";
  }
}

function getMomentumColor(m: TimelineBarProps["momentum"]): string {
  switch (m) {
    case "warming":
      return "bg-gradient-to-r from-green-500 to-emerald-600";
    case "cooling":
      return "bg-gradient-to-r from-red-500 to-rose-600";
    case "volatile":
      return "bg-gradient-to-r from-yellow-500 to-amber-600";
    case "stable":
    default:
      return "bg-gradient-to-r from-slate-400 to-slate-500";
  }
}

export const TimelineBar: React.FC<TimelineBarProps> = ({
  daysSilent,
  timelineStrength,
  momentum,
  className,
}) => {
  const clamped = Math.max(0, Math.min(100, timelineStrength));
  const label = getMomentumLabel(momentum);
  const momentumColor = getMomentumColor(momentum);
  const icon = getMomentumIcon(momentum);

  return (
    <div className={`flex flex-col gap-2 ${className ?? ""}`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-500 uppercase tracking-wide font-medium">
          Timeline & Momentum
        </span>
        <span className="text-[11px] text-slate-600 font-medium">
          Silent:{" "}
          <span className={`font-semibold ${daysSilent > 7 ? 'text-red-600' : daysSilent > 3 ? 'text-orange-600' : 'text-slate-700'}`}>
            {daysSilent} day{daysSilent === 1 ? "" : "s"}
          </span>
        </span>
      </div>
      <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden shadow-inner">
        <div
          className={`${momentumColor} h-3 rounded-full transition-all duration-500 ease-out shadow-sm`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs text-slate-700 font-medium">{label}</span>
        <span className="text-[11px] text-slate-500 ml-auto">
          Strength: {clamped.toFixed(0)}%
        </span>
      </div>
    </div>
  );
};


