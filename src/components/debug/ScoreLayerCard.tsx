/**
 * ScoreLayerCard Component
 * Reusable card for displaying version scoring details
 */
import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ScoreLayerCardProps {
  version: string;
  title: string;
  score: number; // 0–100
  summary?: string;
  tags?: string[];
  children?: React.ReactNode;
}

function getBorderColor(score: number): string {
  if (score >= 80) return "border-l-red-500";
  if (score >= 40) return "border-l-orange-500";
  return "border-l-sky-500";
}

function getScoreBadgeColor(score: number): string {
  if (score >= 80) return "bg-red-500 text-white";
  if (score >= 40) return "bg-orange-500 text-white";
  return "bg-sky-500 text-white";
}

export const ScoreLayerCard: React.FC<ScoreLayerCardProps> = ({
  version,
  title,
  score,
  summary,
  tags,
  children,
}) => {
  const [open, setOpen] = useState(false);
  const borderColor = getBorderColor(score);
  const badgeColor = getScoreBadgeColor(score);

  return (
    <div
      className={`border-l-4 ${borderColor} bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col gap-3`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-1 rounded-md font-semibold flex-shrink-0">
            {version.toUpperCase()}
          </span>
          <h3 className="text-sm font-semibold text-slate-900 truncate">{title}</h3>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full ${badgeColor} shadow-sm`}
          >
            {score.toFixed(0)}
          </span>
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
            aria-label={open ? "Collapse" : "Expand"}
          >
            {open ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {summary && (
        <p className="text-xs text-slate-600 leading-relaxed">{summary}</p>
      )}

      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag, idx) => (
            <span
              key={idx}
              className="text-[10px] px-2 py-1 bg-slate-100 text-slate-700 rounded-full font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {open && children && (
        <div className="mt-1 pt-2 border-t border-slate-100 text-xs text-slate-600 space-y-2">
          {children}
        </div>
      )}
    </div>
  );
};


