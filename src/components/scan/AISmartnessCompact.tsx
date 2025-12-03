import React from 'react';
import { Brain, TrendingUp, Zap, Target } from 'lucide-react';

interface AISmartnessCompactProps {
  score: number;
  precision: number;
  speed: number;
  learningDepth: number;
}

export default function AISmartnessCompact({ score, precision, speed, learningDepth }: AISmartnessCompactProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 border border-[#E4E6EB]">
      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <svg className="w-16 h-16 transform -rotate-90">
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="#E4E6EB"
              strokeWidth="6"
              fill="none"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="#1877F2"
              strokeWidth="6"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 28}`}
              strokeDashoffset={`${2 * Math.PI * 28 * (1 - score / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-lg font-bold text-[#1877F2]">{score}%</div>
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-4 h-4 text-[#1877F2]" />
            <span className="text-sm font-semibold text-[#050505]">AI Training Progress</span>
          </div>

          <div className="space-y-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Target className="w-3 h-3 text-[#65676B]" />
                  <span className="text-xs text-[#65676B]">Precision</span>
                </div>
                <span className="text-xs font-semibold text-[#050505]">{precision}%</span>
              </div>
              <div className="h-1.5 bg-[#F0F2F5] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1877F2] rounded-full transition-all duration-500"
                  style={{ width: `${precision}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-[#65676B]" />
                  <span className="text-xs text-[#65676B]">Speed</span>
                </div>
                <span className="text-xs font-semibold text-[#050505]">{speed}%</span>
              </div>
              <div className="h-1.5 bg-[#F0F2F5] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1877F2] rounded-full transition-all duration-500"
                  style={{ width: `${speed}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-3 h-3 text-[#65676B]" />
                  <span className="text-xs text-[#65676B]">Learning Depth</span>
                </div>
                <span className="text-xs font-semibold text-[#050505]">{learningDepth}%</span>
              </div>
              <div className="h-1.5 bg-[#F0F2F5] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1877F2] rounded-full transition-all duration-500"
                  style={{ width: `${learningDepth}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
