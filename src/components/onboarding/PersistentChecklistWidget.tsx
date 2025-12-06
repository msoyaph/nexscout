/**
 * Persistent Onboarding Checklist Widget
 * 
 * Floats on pages until onboarding is complete
 * Shows progress and encourages completion
 */

import { useState, useEffect } from 'react';
import { CheckCircle, ChevronDown, ChevronUp, X, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ChecklistItem {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  xp_reward: number;
}

interface ChecklistProgress {
  total: number;
  completed: number;
  percentage: number;
  items: ChecklistItem[];
}

export default function PersistentChecklistWidget() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<ChecklistProgress | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProgress();
      
      // Check if user already completed onboarding
      checkOnboardingComplete();

      // Real-time updates
      const subscription = supabase
        .channel(`checklist:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'user_activation_checklist',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            loadProgress();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  const checkOnboardingComplete = async () => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user?.id)
      .single();

    if (profile?.onboarding_completed) {
      setDismissed(true);
    }
  };

  const loadProgress = async () => {
    setLoading(true);

    try {
      const { data } = await supabase
        .from('user_activation_checklist')
        .select(`
          id,
          completed,
          activation_checklist_items!inner (
            id,
            name,
            description,
            xp_reward
          )
        `)
        .eq('user_id', user?.id);

      if (data) {
        const items: ChecklistItem[] = data.map((item: any) => ({
          id: item.id,
          name: item.activation_checklist_items.name,
          description: item.activation_checklist_items.description,
          completed: item.completed,
          xp_reward: item.activation_checklist_items.xp_reward,
        }));

        const completed = items.filter(i => i.completed).length;
        const total = items.length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        setProgress({
          total,
          completed,
          percentage,
          items
        });

        // Auto-dismiss if 100% complete
        if (percentage >= 100) {
          setTimeout(() => setDismissed(true), 3000);
        }
      }
    } catch (error) {
      console.error('Failed to load checklist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePermanentDismiss = () => {
    setDismissed(true);
    localStorage.setItem('onboarding_widget_dismissed', 'true');
  };

  if (loading || dismissed || !progress) return null;

  // Don't show if 100% complete
  if (progress.percentage >= 100) return null;

  return (
    <div className="fixed bottom-24 left-6 z-40 w-80 animate-slide-in-left">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-blue-200 overflow-hidden">
        {/* Header */}
        <div
          className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-white" />
              <h3 className="font-bold text-white">Getting Started</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePermanentDismiss();
                }}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
              {expanded ? (
                <ChevronUp className="w-4 h-4 text-white" />
              ) : (
                <ChevronDown className="w-4 h-4 text-white" />
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-white/90">
              <span>{progress.completed} of {progress.total} complete</span>
              <span className="font-bold">{progress.percentage}%</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-500"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Checklist Items (Collapsible) */}
        {expanded && (
          <div className="p-4 max-h-96 overflow-y-auto">
            <div className="space-y-2">
              {progress.items.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className={`flex items-start gap-3 p-3 rounded-lg transition-all ${
                    item.completed
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    item.completed
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`}>
                    {item.completed && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${
                      item.completed ? 'text-green-900 line-through' : 'text-gray-900'
                    }`}>
                      {item.name}
                    </p>
                    {!item.completed && (
                      <p className="text-xs text-gray-600 mt-0.5">
                        +{item.xp_reward} XP
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {progress.items.length > 5 && (
              <p className="text-xs text-center text-gray-500 mt-3">
                +{progress.items.length - 5} more items
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

