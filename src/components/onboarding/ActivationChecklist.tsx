/**
 * Activation Checklist - 5 Quick Wins
 *
 * Guides users through first value experiences
 * Shows progress, awards XP, celebrates completion
 */

import { useState, useEffect } from 'react';
import { CheckCircle, Circle, Clock, Zap, Sparkles, ChevronRight } from 'lucide-react';
import { getActivationProgress, completeChecklistItem } from '../../services/onboarding/onboardingEngine';
import { useAuth } from '../../contexts/AuthContext';

interface ActivationChecklistProps {
  onNavigate?: (page: string) => void;
  compact?: boolean;
}

export default function ActivationChecklist({ onNavigate, compact = false }: ActivationChecklistProps) {
  const { user } = useAuth();
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [celebrating, setCelebrating] = useState(false);

  useEffect(() => {
    if (user) {
      loadProgress();
    }
  }, [user]);

  async function loadProgress() {
    if (!user) return;

    setLoading(true);
    const data = await getActivationProgress(user.id);
    setProgress(data);
    setLoading(false);
  }

  async function handleItemClick(item: any) {
    if (item.completed) return;

    // Navigate to relevant page based on action type
    const actionMap: Record<string, string> = {
      chatbot_deploy: 'ai-chatbot',
      lead_capture: 'scan-entry',
      send_message: 'messages',
      run_deepscan: 'scan-entry',
      book_appointment: 'calendar',
    };

    const page = actionMap[item.action_type] || 'home';
    onNavigate?.(page);
  }

  if (loading) {
    return (
      <div className={`${compact ? 'p-4' : 'p-6'} bg-white rounded-2xl border border-gray-200 animate-pulse`}>
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!progress || progress.total === 0) {
    return null;
  }

  const allCompleted = progress.completed === progress.total;

  if (compact) {
    return (
      <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border-2 border-blue-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-900">Your First 5 Wins</h3>
          <span className="text-2xl font-bold text-blue-600">{progress.percentage}%</span>
        </div>
        <div className="h-2 bg-white rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
        <p className="text-sm text-gray-600">
          {progress.completed} of {progress.total} completed
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-lg border-2 border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-6 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Your First 5 Wins</h2>
              <p className="text-white/80 text-sm">Complete these to unlock your full potential</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-white">{progress.percentage}%</div>
            <div className="text-white/80 text-sm">Complete</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-3 bg-white/20 backdrop-blur-sm rounded-full overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-500 shadow-lg"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      </div>

      {/* Checklist Items */}
      <div className="p-6 space-y-3">
        {progress.items.map((item: any, index: number) => {
          const isCompleted = item.completed;
          const estimatedMinutes = Math.ceil(item.estimated_time_seconds / 60);

          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              disabled={isCompleted}
              className={`w-full group relative overflow-hidden rounded-2xl p-5 transition-all ${
                isCompleted
                  ? 'bg-green-50 border-2 border-green-200'
                  : 'bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg hover:scale-[1.02]'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Checkbox */}
                <div className="flex-shrink-0 mt-1">
                  {isCompleted ? (
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-white border-3 border-gray-300 rounded-full flex items-center justify-center group-hover:border-blue-500 transition-colors">
                      <Circle className="w-5 h-5 text-gray-300 group-hover:text-blue-500" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className={`font-bold ${isCompleted ? 'text-green-900 line-through' : 'text-gray-900'}`}>
                      {index + 1}. {item.name}
                    </h3>
                    {!isCompleted && (
                      <span className="flex-shrink-0 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        {item.xp_reward} XP
                      </span>
                    )}
                  </div>
                  <p className={`text-sm mb-2 ${isCompleted ? 'text-green-700' : 'text-gray-600'}`}>
                    {item.description}
                  </p>
                  {!isCompleted && (
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        ~{estimatedMinutes} min
                      </span>
                      <span className="flex items-center gap-1 text-blue-600 font-semibold">
                        Start now
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  )}
                  {isCompleted && (
                    <div className="flex items-center gap-2 text-xs text-green-600 font-semibold">
                      <CheckCircle className="w-3 h-3" />
                      Completed! +{item.xp_reward} XP earned
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      {allCompleted ? (
        <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-t-2 border-green-200">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500 mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-green-900 mb-2">🎉 All Done!</h3>
            <p className="text-green-700 mb-4">
              You've completed your first 5 wins! You're on your way to sales success.
            </p>
            <button
              onClick={() => onNavigate?.('missions')}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors"
            >
              View More Missions
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <p className="text-center text-sm text-gray-600">
            Complete all tasks to unlock advanced features and earn bonus rewards!
          </p>
        </div>
      )}

      {/* Celebration Effect */}
      {celebrating && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="text-8xl animate-ping">🎉</div>
        </div>
      )}
    </div>
  );
}
