import { TrendingUp, Zap, DollarSign, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { SmartRecommendation } from '../../services/automation/recommendationEngine';

interface SmartRecommendationCardProps {
  recommendation: SmartRecommendation;
  onRunAction: () => void;
  onDismiss?: () => void;
}

export default function SmartRecommendationCard({
  recommendation,
  onRunAction,
  onDismiss,
}: SmartRecommendationCardProps) {
  const getPriorityColor = () => {
    switch (recommendation.priority) {
      case 'critical': return 'from-red-500 to-orange-500';
      case 'high': return 'from-orange-500 to-yellow-500';
      case 'medium': return 'from-blue-500 to-indigo-500';
      case 'low': return 'from-gray-400 to-gray-500';
    }
  };

  const getPriorityBadge = () => {
    const badges = {
      critical: { text: '🔴 URGENT', color: 'bg-red-100 text-red-700 border-red-300' },
      high: { text: '🟡 HIGH PRIORITY', color: 'bg-orange-100 text-orange-700 border-orange-300' },
      medium: { text: '🔵 RECOMMENDED', color: 'bg-blue-100 text-blue-700 border-blue-300' },
      low: { text: '⚪ CONSIDER', color: 'bg-gray-100 text-gray-700 border-gray-300' },
    };
    return badges[recommendation.priority];
  };

  const badge = getPriorityBadge();

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-300 p-5 shadow-lg">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getPriorityColor()} flex items-center justify-center`}>
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-600">💡 AI Recommends</p>
            <h3 className="text-lg font-bold text-gray-900">{recommendation.title}</h3>
          </div>
        </div>
        
        <span className={`px-3 py-1 ${badge.color} text-xs font-bold rounded-full border`}>
          {badge.text}
        </span>
      </div>

      {/* Reasoning */}
      <div className="mb-4 space-y-2">
        {recommendation.reasoning.map((reason, idx) => (
          <div key={idx} className="flex items-start gap-2 text-sm">
            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">{idx + 1}</span>
            </div>
            <p className="text-gray-700">{reason}</p>
          </div>
        ))}
      </div>

      {/* Expected Outcome */}
      <div className="bg-white rounded-lg p-4 mb-4 border border-blue-200">
        <p className="text-xs font-semibold text-gray-600 mb-3">Expected Results:</p>
        <div className="grid grid-cols-2 gap-3">
          {recommendation.expectedOutcome.replyRate !== undefined && (
            <div>
              <p className="text-2xl font-bold text-green-600">
                {(recommendation.expectedOutcome.replyRate * 100).toFixed(0)}%
              </p>
              <p className="text-xs text-gray-600">Reply Rate</p>
            </div>
          )}
          {recommendation.expectedOutcome.meetingRate !== undefined && (
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {(recommendation.expectedOutcome.meetingRate * 100).toFixed(0)}%
              </p>
              <p className="text-xs text-gray-600">Meeting Rate</p>
            </div>
          )}
          {recommendation.expectedOutcome.estimatedRevenue > 0 && (
            <div>
              <p className="text-xl font-bold text-purple-600">
                ₱{recommendation.expectedOutcome.estimatedRevenue.toLocaleString()}
              </p>
              <p className="text-xs text-gray-600">Est. Revenue</p>
            </div>
          )}
          {recommendation.roi > 0 && (
            <div>
              <p className="text-xl font-bold text-green-600">
                {recommendation.roi.toFixed(1)}x
              </p>
              <p className="text-xs text-gray-600">ROI</p>
            </div>
          )}
        </div>
      </div>

      {/* Timing */}
      <div className="flex items-center gap-2 mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
        <Clock className="w-4 h-4 text-yellow-600" />
        <div className="flex-1">
          <p className="text-xs font-semibold text-gray-900">Best Timing:</p>
          <p className="text-xs text-gray-600">{recommendation.timing.bestTimeDescription}</p>
        </div>
      </div>

      {/* Cost & Action */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <p className="text-xs text-gray-600 mb-1">Cost:</p>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-sm font-semibold">
              <Zap className="w-4 h-4 text-yellow-600" />
              {recommendation.cost.energy}
            </span>
            <span className="text-gray-400">+</span>
            <span className="flex items-center gap-1 text-sm font-semibold">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500" />
              {recommendation.cost.coins}
            </span>
          </div>
        </div>
        
        <button
          onClick={onRunAction}
          className={`px-6 py-3 bg-gradient-to-r ${getPriorityColor()} text-white rounded-lg font-bold hover:scale-105 transition-all shadow-lg hover:shadow-xl flex items-center gap-2`}
        >
          Run Now
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Confidence Indicator */}
      <div className="mt-3 flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all"
            style={{ width: `${recommendation.confidence * 100}%` }}
          />
        </div>
        <span className="text-xs font-semibold text-gray-600">
          {(recommendation.confidence * 100).toFixed(0)}% confidence
        </span>
      </div>
    </div>
  );
}




