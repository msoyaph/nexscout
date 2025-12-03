import { Brain, Sparkles, TrendingUp, Zap } from 'lucide-react';

interface SmartnessBadgeProps {
  score: number;
  size?: 'small' | 'medium' | 'large';
}

export default function SmartnessBadge({ score, size = 'medium' }: SmartnessBadgeProps) {
  const getColor = () => {
    if (score >= 75) return 'from-green-500 to-emerald-600';
    if (score >= 50) return 'from-blue-500 to-blue-600';
    if (score >= 25) return 'from-amber-500 to-orange-600';
    return 'from-gray-400 to-gray-500';
  };

  const getIcon = () => {
    if (score >= 75) return <Zap className={getSizeClass()} fill="currentColor" />;
    if (score >= 50) return <TrendingUp className={getSizeClass()} />;
    if (score >= 25) return <Sparkles className={getSizeClass()} />;
    return <Brain className={getSizeClass()} />;
  };

  const getSizeClass = () => {
    switch (size) {
      case 'small': return 'size-3';
      case 'large': return 'size-6';
      default: return 'size-4';
    }
  };

  const getPaddingClass = () => {
    switch (size) {
      case 'small': return 'px-2 py-1 text-xs';
      case 'large': return 'px-4 py-2 text-base';
      default: return 'px-3 py-1.5 text-sm';
    }
  };

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${getColor()} text-white font-bold ${getPaddingClass()}`}>
      {getIcon()}
      <span>AI {score}%</span>
    </div>
  );
}
