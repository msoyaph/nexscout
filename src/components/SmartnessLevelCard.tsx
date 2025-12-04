import { Brain, Zap, Target } from 'lucide-react';

interface SmartnessLevelCardProps {
  score: number;
  precision?: number;
  speed?: number;
  learningDepth?: number;
}

export default function SmartnessLevelCard({
  score,
  precision = 0,
  speed = 0,
  learningDepth = 0
}: SmartnessLevelCardProps) {
  const getLabel = () => {
    if (score < 40) return 'Training in progress...';
    if (score < 80) return 'Getting Smarter...';
    return 'Expert Mode Unlocked';
  };

  const getGradient = () => {
    if (score < 40) return 'from-yellow-400 to-orange-400';
    if (score < 80) return 'from-orange-400 to-orange-500';
    return 'from-orange-500 to-red-500';
  };

  const circumference = 2 * Math.PI * 70;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-white rounded-3xl p-6 mb-6">
      <h3 className="text-lg font-bold text-gray-900 mb-6 text-center">AI Smartness Level</h3>

      <div className="relative flex items-center justify-center mb-6">
        <svg className="size-48 transform -rotate-90">
          <circle
            cx="96"
            cy="96"
            r="70"
            stroke="#E5E7EB"
            strokeWidth="12"
            fill="none"
          />
          <circle
            cx="96"
            cy="96"
            r="70"
            stroke="url(#gradient)"
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FBBF24" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-5xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
            {score}%
          </div>
          <div className="text-xs text-gray-600 mt-1 font-semibold">
            {getLabel()}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <Target className="size-4 text-blue-600" />
              <span className="text-sm font-semibold text-gray-700">Precision</span>
            </div>
            <span className="text-xs font-bold text-gray-900">{precision}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${precision}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <Zap className="size-4 text-yellow-600" />
              <span className="text-sm font-semibold text-gray-700">Speed</span>
            </div>
            <span className="text-xs font-bold text-gray-900">{speed}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-2 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full transition-all duration-500"
              style={{ width: `${speed}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <Brain className="size-4 text-purple-600" />
              <span className="text-sm font-semibold text-gray-700">Learning Depth</span>
            </div>
            <span className="text-xs font-bold text-gray-900">{learningDepth}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-500"
              style={{ width: `${learningDepth}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
