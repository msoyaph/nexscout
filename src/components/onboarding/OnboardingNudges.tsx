/**
 * Onboarding Nudges Display Components
 * 
 * Shows contextual nudges as:
 * - Floating bubbles (bottom-right)
 * - Top banners (full-width)
 * - Inline cards (embedded in pages)
 */

import { useState, useEffect } from 'react';
import { X, ArrowRight, Sparkles, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Nudge {
  id: string;
  message: string;
  nudge_type: string;
  action_url: string;
  action_label: string;
  seen: boolean;
  dismissed: boolean;
  created_at: string;
}

/**
 * Floating Nudge Bubble (Bottom-Right Corner)
 */
export function FloatingNudgeBubble() {
  const { user } = useAuth();
  const [nudge, setNudge] = useState<Nudge | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (user) {
      loadActiveNudge();
      
      // Real-time subscription for new nudges
      const subscription = supabase
        .channel(`nudges:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'onboarding_nudges',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('[Nudge] New nudge received:', payload.new);
            setNudge(payload.new as Nudge);
            setVisible(true);
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  const loadActiveNudge = async () => {
    const { data } = await supabase
      .from('onboarding_nudges')
      .select('*')
      .eq('user_id', user?.id)
      .eq('dismissed', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setNudge(data);
      setVisible(true);

      // Mark as seen
      await supabase
        .from('onboarding_nudges')
        .update({ seen: true })
        .eq('id', data.id);
    }
  };

  const handleDismiss = async () => {
    if (!nudge) return;

    setVisible(false);
    
    await supabase
      .from('onboarding_nudges')
      .update({ dismissed: true })
      .eq('id', nudge.id);

    setTimeout(() => setNudge(null), 300);
  };

  const handleAction = () => {
    if (nudge?.action_url) {
      window.location.href = nudge.action_url;
    }
  };

  if (!visible || !nudge) return null;

  return (
    <div className="fixed bottom-24 right-6 z-40 animate-slide-in-right">
      <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-2xl shadow-2xl p-4 max-w-sm relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl animate-pulse"></div>
        </div>

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="relative">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium leading-relaxed">
                {nudge.message}
              </p>
            </div>
          </div>

          {/* Action Button */}
          {nudge.action_label && (
            <button
              onClick={handleAction}
              className="w-full mt-2 py-2 px-4 bg-white text-blue-600 rounded-lg font-semibold text-sm hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
            >
              {nudge.action_label}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Top Banner Nudge (Full-Width)
 */
export function TopBannerNudge() {
  const { user } = useAuth();
  const [nudge, setNudge] = useState<Nudge | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (user) {
      loadHighPriorityNudge();
    }
  }, [user]);

  const loadHighPriorityNudge = async () => {
    // Get most recent unseen nudge
    const { data } = await supabase
      .from('onboarding_nudges')
      .select('*')
      .eq('user_id', user?.id)
      .eq('dismissed', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setNudge(data);
      setVisible(true);

      // Mark as seen
      await supabase
        .from('onboarding_nudges')
        .update({ seen: true })
        .eq('id', data.id);
    }
  };

  const handleDismiss = async () => {
    if (!nudge) return;

    setVisible(false);
    
    await supabase
      .from('onboarding_nudges')
      .update({ dismissed: true })
      .eq('id', nudge.id);
  };

  const handleAction = () => {
    if (nudge?.action_url) {
      window.location.href = nudge.action_url;
    }
  };

  if (!visible || !nudge) return null;

  return (
    <div className="fixed top-16 left-0 right-0 z-30 animate-slide-down">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl shadow-lg p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <Sparkles className="w-5 h-5 flex-shrink-0" />
              <p className="font-medium">{nudge.message}</p>
            </div>

            <div className="flex items-center gap-2">
              {nudge.action_label && (
                <button
                  onClick={handleAction}
                  className="px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold text-sm hover:bg-blue-50 transition-colors flex items-center gap-2"
                >
                  {nudge.action_label}
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={handleDismiss}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Inline Nudge Card (Embedded in Pages)
 */
export function InlineNudgeCard({ nudgeType }: { nudgeType?: string }) {
  const { user } = useAuth();
  const [nudges, setNudges] = useState<Nudge[]>([]);

  useEffect(() => {
    if (user) {
      loadNudges();
    }
  }, [user, nudgeType]);

  const loadNudges = async () => {
    let query = supabase
      .from('onboarding_nudges')
      .select('*')
      .eq('user_id', user?.id)
      .eq('dismissed', false)
      .order('created_at', { ascending: false })
      .limit(3);

    if (nudgeType) {
      query = query.eq('nudge_type', nudgeType);
    }

    const { data } = await query;
    setNudges(data || []);
  };

  const handleDismiss = async (nudgeId: string) => {
    await supabase
      .from('onboarding_nudges')
      .update({ dismissed: true })
      .eq('id', nudgeId);

    setNudges(prev => prev.filter(n => n.id !== nudgeId));
  };

  const handleAction = (actionUrl: string) => {
    window.location.href = actionUrl;
  };

  if (nudges.length === 0) return null;

  return (
    <div className="space-y-3">
      {nudges.map((nudge) => (
        <div
          key={nudge.id}
          className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 mb-2">
                {nudge.message}
              </p>

              <div className="flex items-center gap-2">
                {nudge.action_label && (
                  <button
                    onClick={() => handleAction(nudge.action_url)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    {nudge.action_label}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
                
                <button
                  onClick={() => handleDismiss(nudge.id)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Nudge Toast (Bottom-Center, Auto-Dismiss)
 */
export function NudgeToast() {
  const { user } = useAuth();
  const [nudges, setNudges] = useState<Nudge[]>([]);

  useEffect(() => {
    if (user) {
      // Subscribe to new nudges
      const subscription = supabase
        .channel(`nudge-toast:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'onboarding_nudges',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newNudge = payload.new as Nudge;
            setNudges(prev => [newNudge, ...prev].slice(0, 3)); // Max 3 toasts

            // Auto-dismiss after 10 seconds
            setTimeout(() => {
              setNudges(prev => prev.filter(n => n.id !== newNudge.id));
            }, 10000);
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  const handleDismiss = (id: string) => {
    setNudges(prev => prev.filter(n => n.id !== id));
    
    supabase
      .from('onboarding_nudges')
      .update({ dismissed: true })
      .eq('id', id)
      .then(() => {});
  };

  return (
    <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 space-y-2">
      {nudges.map((nudge) => (
        <div
          key={nudge.id}
          className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 min-w-[300px] max-w-md animate-slide-up"
        >
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{nudge.message}</p>
            </div>
            <button
              onClick={() => handleDismiss(nudge.id)}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

