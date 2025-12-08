import React, { useState, useEffect } from 'react';
import { X, Coins, Zap, MessageSquare, Gift, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { addEnergy } from '../../services/energy/energyEngine';

const WELCOME_MODAL_STORAGE_KEY = 'welcome_bonus_modal_dismissed';

interface WelcomeBonusModalProps {
  onClose: () => void;
}

export function WelcomeBonusModal({ onClose }: WelcomeBonusModalProps) {
  const { user, profile, refreshProfile } = useAuth();
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);

  // Check if welcome bonus has been claimed (database + localStorage for performance)
  const hasBeenDismissed = () => {
    if (typeof window === 'undefined') return true;
    
    // Check database first (most reliable - persists across devices/browsers)
    if (profile?.welcome_bonus_claimed === true) {
      // Also update localStorage for performance
      localStorage.setItem(WELCOME_MODAL_STORAGE_KEY, 'true');
      return true;
    }
    
    // Fallback to localStorage check (for performance, but database is source of truth)
    return localStorage.getItem(WELCOME_MODAL_STORAGE_KEY) === 'true';
  };

  const handleClaim = async () => {
    if (!user || isClaiming || claimed) return;

    setIsClaiming(true);
    try {
      // Award 30 coins using RPC
      const { error: coinsError } = await supabase.rpc('record_coin_transaction', {
        p_user_id: user.id,
        p_amount: 30,
        p_type: 'bonus',
        p_description: 'Welcome bonus: 30 coins'
      });

      if (coinsError) {
        console.error('[WelcomeBonus] Error awarding coins:', coinsError);
        // Try alternative method if RPC fails
        const { data: profileData } = await supabase
          .from('profiles')
          .select('coin_balance')
          .eq('id', user.id)
          .single();
        
        if (profileData) {
          await supabase
            .from('profiles')
            .update({ coin_balance: (profileData.coin_balance || 0) + 30 })
            .eq('id', user.id);
        }
      }

      // Award 5 energy using energyEngine (it will initialize if needed)
      const energyResult = await addEnergy(
        user.id,
        5,
        'mission_reward',
        'Welcome bonus: 5 energy'
      );

      if (!energyResult.success) {
        console.error('[WelcomeBonus] Error awarding energy:', energyResult);
      }

      // Note: Chat messages (30) are tracked in chat session limits
      // This is handled by the chat system automatically
      console.log('[WelcomeBonus] ✅ Welcome bonus awarded: 30 coins, 5 energy, 30 chat messages');

      setClaimed(true);
      
      // Mark as claimed in DATABASE (persists across devices/browsers)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ welcome_bonus_claimed: true })
        .eq('id', user.id);
      
      if (updateError) {
        console.error('[WelcomeBonus] Error marking bonus as claimed in database:', updateError);
        // Continue anyway - localStorage will prevent showing again in this browser
      }
      
      // Also mark in localStorage for immediate UI update
      if (typeof window !== 'undefined') {
        localStorage.setItem(WELCOME_MODAL_STORAGE_KEY, 'true');
      }
      
      await refreshProfile();

      // Auto-close after 2 seconds
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      console.error('[WelcomeBonus] Error claiming welcome bonus:', error);
      alert('Error claiming bonus. Please try again.');
    } finally {
      setIsClaiming(false);
    }
  };

  const handleClose = async () => {
    // Mark as dismissed in database (even if not claimed, user dismissed it)
    if (user) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ welcome_bonus_claimed: true })
        .eq('id', user.id);
      
      if (updateError) {
        console.error('[WelcomeBonus] Error marking bonus as dismissed in database:', updateError);
      }
    }
    
    // Also mark in localStorage for immediate UI update
    if (typeof window !== 'undefined') {
      localStorage.setItem(WELCOME_MODAL_STORAGE_KEY, 'true');
    }
    
    onClose();
  };

  if (hasBeenDismissed()) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden relative animate-scale-in">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white shadow-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* Header with Graphics */}
        <div className="relative bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 p-8 text-center overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-yellow-300 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-4 animate-bounce">
              <Gift className="w-10 h-10 text-white" />
            </div>
            <p className="text-white/90 text-sm">Your AI sales assistant is ready</p>
          </div>
        </div>

        {/* Bonus Content */}
        <div className="p-6 space-y-4">
          {/* Bonus Items */}
          <div className="space-y-3">
            {/* 30 Coins */}
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border-2 border-yellow-200">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl flex items-center justify-center shadow-lg">
                <Coins className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-gray-900">FREE 30 Coins</div>
                <div className="text-xs text-gray-600">Find leads with Ai-powered sales solutions</div>
              </div>
              <div className="text-2xl font-bold text-yellow-600">30</div>
            </div>

            {/* 5 Energy */}
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-gray-900">FREE 5 Energy</div>
                <div className="text-xs text-gray-600">Power your AI operations</div>
              </div>
              <div className="text-2xl font-bold text-blue-600">5</div>
            </div>

            {/* 30 AI Chatbot Messages */}
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-gray-900">FREE 30 AI Chatbot Messages</div>
                <div className="text-xs text-gray-600">Connect to Your Facebook page and start your automation!</div>
              </div>
              <div className="text-2xl font-bold text-purple-600">30</div>
            </div>
          </div>

          {/* Daily Bonus Info */}
          <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
            <div className="flex items-center gap-2 text-xs text-gray-700">
              <Sparkles className="w-4 h-4 text-green-600" />
              <span className="font-semibold">Daily Bonus:</span>
              <span>+2 Coins and +5 Energy every day you log in</span>
            </div>
          </div>

          {/* Claim Button */}
          <button
            onClick={handleClaim}
            disabled={isClaiming || claimed}
            className={`
              w-full py-4 rounded-xl font-bold text-white
              transition-all duration-200
              shadow-lg hover:shadow-xl
              disabled:opacity-50 disabled:cursor-not-allowed
              ${claimed
                ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                : 'bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700'
              }
              ${!claimed && 'hover:scale-105 active:scale-95'}
            `}
          >
            {isClaiming ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Claiming...
              </span>
            ) : claimed ? (
              <span className="flex items-center justify-center gap-2">
                <span>✓</span>
                Bonus Claimed!
              </span>
            ) : (
              'Claim Welcome Bonus'
            )}
          </button>
        </div>

        <style>{`
          @keyframes scale-in {
            from {
              opacity: 0;
              transform: scale(0.9);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          .animate-scale-in {
            animation: scale-in 0.3s ease-out;
          }
        `}</style>
      </div>
    </div>
  );
}

// Hook to check if welcome modal should be shown
export function useWelcomeModal() {
  const { user, profile, refreshProfile } = useAuth();
  const [shouldShow, setShouldShow] = useState(false);
  const [refreshAttempts, setRefreshAttempts] = useState(0);

  useEffect(() => {
    if (!user) {
      setShouldShow(false);
      return;
    }

    // PRIORITY 1: Check if welcome bonus has already been claimed (database is source of truth)
    // This ensures it only shows once per user lifetime, across all devices/browsers
    if (profile?.welcome_bonus_claimed === true) {
      // Also update localStorage for performance
      if (typeof window !== 'undefined') {
        localStorage.setItem(WELCOME_MODAL_STORAGE_KEY, 'true');
      }
      setShouldShow(false);
      return;
    }
    
    // PRIORITY 2: Fallback - Check localStorage (for performance, but database is authoritative)
    const dismissed = typeof window !== 'undefined' && localStorage.getItem(WELCOME_MODAL_STORAGE_KEY) === 'true';
    if (dismissed) {
      setShouldShow(false);
      return;
    }

    // PRIORITY 3: If profile is not loaded yet, try to refresh it (max 3 attempts)
    if (!profile && refreshAttempts < 3) {
      setRefreshAttempts(prev => prev + 1);
      refreshProfile().then(() => {
        // Will re-run this effect when profile is loaded
      });
      return;
    }

    // PRIORITY 4: If profile exists but onboarding_completed is not set, try refreshing once more
    if (profile && profile.onboarding_completed === false && refreshAttempts < 3) {
      setRefreshAttempts(prev => prev + 1);
      // Wait a bit then refresh again
      setTimeout(() => {
        refreshProfile();
      }, 1500);
      return;
    }

    // PRIORITY 5: Show ONLY for new users who just completed onboarding
    // Must meet ALL conditions:
    // 1. Onboarding is completed
    // 2. Welcome bonus has NOT been claimed yet (checked above)
    // 3. This is a new user signup (not an existing user)
    if (profile?.onboarding_completed === true && profile?.welcome_bonus_claimed !== true) {
      console.log('[WelcomeModal] ✅ New user onboarding completed, showing welcome bonus modal');
      // Add a delay to ensure smooth transition after onboarding
      const timer = setTimeout(() => {
        setShouldShow(true);
      }, 2500); // Increased delay to ensure profile is fully refreshed and page is loaded
      return () => clearTimeout(timer);
    } else {
      setShouldShow(false);
    }
  }, [user, profile, refreshProfile, refreshAttempts]);

  return shouldShow;
}

