import { Brain, Sparkles, TrendingUp, Zap } from 'lucide-react';

interface SmartnessMeterProps {
  score: number;
  level: string;
  subtitle: string;
}

export default function SmartnessMeter({ score, level, subtitle }: SmartnessMeterProps) {
  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getColor = () => {
    if (score >= 75) return '#10B981';
    if (score >= 50) return '#3B82F6';
    if (score >= 25) return '#F59E0B';
    return '#6B7280';
  };

  const getIcon = () => {
    if (score >= 75) return <Zap className="size-16 text-green-500" fill="currentColor" />;
    if (score >= 50) return <TrendingUp className="size-16 text-blue-500" />;
    if (score >= 25) return <Sparkles className="size-16 text-amber-500" />;
    return <Brain className="size-16 text-gray-500" />;
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-8 shadow-lg border border-blue-200">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">AI Smartness Level</h3>
        <p className="text-sm text-gray-600">{subtitle}</p>
      </div>

      <div className="flex flex-col items-center">
        <div className="relative size-56 mb-6">
          <svg className="transform -rotate-90 size-56">
            <circle
              cx="112"
              cy="112"
              r="90"
              stroke="#E5E7EB"
              strokeWidth="16"
              fill="none"
            />
            <circle
              cx="112"
              cy="112"
              r="90"
              stroke={getColor()}
              strokeWidth="16"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {getIcon()}
            <div className="text-4xl font-bold text-gray-900 mt-2">{score}%</div>
            <div className="text-sm font-medium text-gray-600 mt-1">{level}</div>
          </div>
        </div>

        <div className="w-full bg-white rounded-2xl p-4 shadow-sm">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-2">Scanner Accuracy</p>
            <div className="flex items-center justify-center gap-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`h-2 w-12 rounded-full transition-all duration-300 ${
                    i < Math.ceil(score / 20)
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-3 text-center">
          <div className="text-xs text-gray-500 mb-1">Precision</div>
          <div className="text-lg font-bold text-gray-900">{Math.min(99, score + 1)}%</div>
        </div>
        <div className="bg-white rounded-xl p-3 text-center">
          <div className="text-xs text-gray-500 mb-1">Speed</div>
          <div className="text-lg font-bold text-gray-900">Fast</div>
        </div>
        <div className="bg-white rounded-xl p-3 text-center">
          <div className="text-xs text-gray-500 mb-1">Learning</div>
          <div className="text-lg font-bold text-gray-900">Active</div>
        </div>
      </div>
    </div>
  );
}
