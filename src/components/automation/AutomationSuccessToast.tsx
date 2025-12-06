import { Check, TrendingUp, ArrowRight, X } from 'lucide-react';
import { NextAction } from '../../services/automation/notificationService';

interface AutomationSuccessToastProps {
  action: string;
  prospectName: string;
  results: any;
  nextActions?: NextAction[];
  onNextAction?: (action: string) => void;
  onDismiss: () => void;
}

export default function AutomationSuccessToast({
  action,
  prospectName,
  results,
  nextActions,
  onNextAction,
  onDismiss,
}: AutomationSuccessToastProps) {
  const getActionEmoji = (actionType: string) => {
    const emojis: Record<string, string> = {
      smart_scan: '🤖',
      follow_up: '🔄',
      qualify: '✓',
      nurture: '🌱',
      book_meeting: '📅',
      close_deal: '💰',
      full_pipeline: '⚡',
    };
    return emojis[actionType] || '✅';
  };

  const getActionTitle = (actionType: string) => {
    const titles: Record<string, string> = {
      smart_scan: 'Smart Scan Complete!',
      follow_up: 'Follow-Up Sent!',
      qualify: 'Qualification Complete!',
      nurture: 'Nurture Sequence Started!',
      book_meeting: 'Meeting Invite Sent!',
      close_deal: 'Closing Sequence Initiated!',
      full_pipeline: 'Full Automation Complete!',
    };
    return titles[actionType] || 'Automation Complete!';
  };

  return (
    <div className="bg-white rounded-xl shadow-2xl border-2 border-green-500 p-5 max-w-md w-full animate-slide-up">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 animate-scale-in">
          <Check className="w-7 h-7 text-white" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            {getActionEmoji(action)} {getActionTitle(action)}
          </h3>
          <p className="text-sm text-gray-600">To: {prospectName}</p>
        </div>
        
        <button
          onClick={onDismiss}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Results Summary */}
      {results && (
        <div className="bg-gray-50 rounded-lg p-3 mb-4 space-y-1">
          {results.quality && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Quality:</span>
              <span className="font-bold text-green-600">{results.quality}/100 ⭐</span>
            </div>
          )}
          {results.scoutScore && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">ScoutScore:</span>
              <span className="font-bold text-blue-600">{results.scoutScore}/100</span>
            </div>
          )}
          {results.expectedReplyRate && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Est. Reply Rate:</span>
              <span className="font-bold text-purple-600">{results.expectedReplyRate}</span>
            </div>
          )}
          {results.estimatedRevenue && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Est. Revenue:</span>
              <span className="font-bold text-green-600">₱{results.estimatedRevenue.toLocaleString()}</span>
            </div>
          )}
        </div>
      )}

      {/* Next Actions */}
      {nextActions && nextActions.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <p className="text-sm font-semibold text-gray-900">💡 Recommended Next Steps:</p>
          </div>
          
          <div className="space-y-2">
            {nextActions.slice(0, 2).map((nextAction, idx) => (
              <button
                key={idx}
                onClick={() => onNextAction?.(nextAction.action)}
                className="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors group"
              >
                <div className="text-left flex-1">
                  <p className="text-sm font-semibold text-gray-900">{nextAction.label}</p>
                  <p className="text-xs text-gray-600">{nextAction.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {nextAction.cost.energy}E + {nextAction.cost.coins}C
                  </span>
                  <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// CSS for animations (add to global styles or tailwind config)
const animations = `
@keyframes slide-up {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes scale-in {
  from {
    transform: scale(0);
  }
  to {
    transform: scale(1);
  }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}

.animate-scale-in {
  animation: scale-in 0.3s ease-out;
}
`;




