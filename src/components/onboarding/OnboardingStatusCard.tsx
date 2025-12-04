import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import { useOnboardingState } from '../../hooks/useOnboardingState';

interface OnboardingStatusCardProps {
  onNavigate?: (page: string) => void;
}

export const OnboardingStatusCard = ({ onNavigate }: OnboardingStatusCardProps) => {
  const { state, loading } = useOnboardingState();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-2 bg-gray-200 rounded"></div>
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!state || state.progress === 100) {
    return null;
  }

  const showRiskAlert = state.risk.level === 'high' || state.risk.level === 'critical';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
        <div className="flex items-center justify-between text-white">
          <div>
            <h3 className="text-lg font-semibold">Complete Your Setup</h3>
            <p className="text-sm text-blue-100">
              {Math.round(state.progress)}% ready to sell with AI
            </p>
          </div>
          <div className="text-2xl font-bold">{Math.round(state.progress)}%</div>
        </div>
        <div className="mt-3 bg-blue-400 rounded-full h-2 overflow-hidden">
          <div
            className="bg-white h-full rounded-full transition-all duration-500"
            style={{ width: `${state.progress}%` }}
          />
        </div>
      </div>

      <div className="p-4 space-y-3">
        {showRiskAlert && state.pendingReminder && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
            <p className="text-sm text-yellow-800">
              You're almost there — finish setup to unlock your AI sales system.
            </p>
            <button
              onClick={() => onNavigate?.('mentor-chat')}
              className="mt-2 text-sm text-yellow-700 hover:text-yellow-900 font-medium flex items-center gap-1"
            >
              Open AI Coach
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {state.steps.map((step, index) => (
          <div
            key={step.id}
            className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
              step.completed
                ? 'bg-green-50 border border-green-200'
                : 'bg-gray-50 border border-gray-200 hover:border-blue-300 cursor-pointer'
            }`}
            onClick={() => !step.completed && onNavigate?.(step.route)}
          >
            <div className="flex-shrink-0">
              {step.completed ? (
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              ) : (
                <Circle className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <p
                className={`font-medium ${
                  step.completed ? 'text-green-700' : 'text-gray-900'
                }`}
              >
                {step.title}
              </p>
              <p className="text-xs text-gray-500">
                {step.completed
                  ? 'Completed'
                  : `~${step.estimatedMinutes} min`}
              </p>
            </div>
            {!step.completed && (
              <ArrowRight className="w-5 h-5 text-gray-400" />
            )}
          </div>
        ))}

        <button
          onClick={() => onNavigate?.('about-my-company')}
          className="w-full mt-3 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
        >
          Continue Setup
          <ArrowRight className="w-5 h-5" />
        </button>

        {state.pendingReminder && (
          <button
            onClick={() => onNavigate?.('mentor-chat')}
            className="w-full mt-2 bg-white text-blue-600 border border-blue-600 py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
          >
            Talk to AI Coach
          </button>
        )}
      </div>
    </div>
  );
};
