/**
 * Quick Onboarding Flow Orchestrator
 *
 * Manages the entire PLO experience:
 * 1. QuickSetup Wizard (3 questions)
 * 2. Magic Loading Animation
 * 3. Welcome Dashboard with Checklist
 */

import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import QuickSetupWizard, { QuickSetupData } from '../../components/onboarding/QuickSetupWizard';
import MagicLoadingAnimation from '../../components/onboarding/MagicLoadingAnimation';
import OnboardingCompletionFlow from '../../components/onboarding/OnboardingCompletionFlow';
import { processQuickSetup, initializeOnboarding } from '../../services/onboarding/onboardingEngine';

interface QuickOnboardingFlowProps {
  onComplete: () => void;
  onNavigate: (page: string) => void;
}

type FlowStage = 'wizard' | 'loading' | 'complete';

export default function QuickOnboardingFlow({ onComplete, onNavigate }: QuickOnboardingFlowProps) {
  const { user } = useAuth();
  const [stage, setStage] = useState<FlowStage>('wizard');
  const [setupData, setSetupData] = useState<QuickSetupData | null>(null);
  const [result, setResult] = useState<any>(null);

  async function handleWizardComplete(data: QuickSetupData) {
    if (!user) return;

    setSetupData(data);
    setStage('loading');

    // Initialize onboarding session
    await initializeOnboarding(user.id, data.industry);

    // Process quick setup (auto-populate data)
    const setupResult = await processQuickSetup(user.id, {
      industry: data.industry,
      companyInput: data.companyInput,
      channels: data.channels,
    });

    setResult(setupResult);

    // Show loading for at least a few seconds for effect
    setTimeout(() => {
      setStage('complete');
    }, 6000);
  }

  function handleLoadingComplete() {
    // This will be called by the loading animation
    setStage('complete');
  }

  async function handleFinalComplete() {
    console.log('[QuickOnboarding] Completing onboarding...');
    
    // Mark onboarding as complete in database
    if (user) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ onboarding_completed: true })
          .eq('id', user.id);
        
        if (error) {
          console.error('[QuickOnboarding] Error marking complete:', error);
        } else {
          console.log('[QuickOnboarding] ✅ Onboarding marked complete');
          // Longer delay to ensure database update is committed and propagated
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (err) {
        console.error('[QuickOnboarding] Error:', err);
      }
    }
    
    // Call onComplete which will trigger profile refresh in App.tsx
    onComplete();
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (stage === 'wizard') {
    return <QuickSetupWizard userId={user.id} onComplete={handleWizardComplete} />;
  }

  if (stage === 'loading' && setupData) {
    return (
      <MagicLoadingAnimation
        companyName={setupData.companyInput}
        productsCount={result?.products_seeded || 0}
        onComplete={handleLoadingComplete}
      />
    );
  }

  if (stage === 'complete' && setupData) {
    return (
      <OnboardingCompletionFlow
        userId={user.id}
        userEmail={user.email || ''}
        companyName={setupData.companyInput}
        industry={setupData.industry}
        companyMatch={setupData.companyMatch}
        onComplete={handleFinalComplete}
      />
    );
  }

  return null;
}

/**
 * Welcome Dashboard
 * Shows after onboarding with activation checklist
 */
function WelcomeDashboard({
  setupData,
  result,
  onNavigate,
  onComplete,
}: {
  setupData: QuickSetupData;
  result: any;
  onNavigate: (page: string) => void;
  onComplete: () => void;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Welcome Header */}
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 mb-6">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 mb-4 animate-bounce">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">🎉 You're All Set!</h1>
            <p className="text-xl text-gray-600">Your AI sales system is ready to go</p>
          </div>

          {/* Setup Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="p-4 bg-blue-50 rounded-2xl border-2 border-blue-200 text-center">
              <div className="text-3xl font-bold text-blue-600">{result?.products_seeded || 0}</div>
              <div className="text-sm text-blue-700 font-semibold">Products Ready</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-2xl border-2 border-purple-200 text-center">
              <div className="text-3xl font-bold text-purple-600">1</div>
              <div className="text-sm text-purple-700 font-semibold">AI Chatbot</div>
            </div>
            <div className="p-4 bg-pink-50 rounded-2xl border-2 border-pink-200 text-center">
              <div className="text-3xl font-bold text-pink-600">{result?.time_to_value_seconds || 0}s</div>
              <div className="text-sm text-pink-700 font-semibold">Setup Time</div>
            </div>
          </div>

          {/* Auto-Population Notice */}
          {result?.auto_populated && (
            <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200 mb-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-green-900 mb-1">✨ Magic Setup Complete!</h3>
                  <p className="text-sm text-green-700">
                    We recognized <strong>{setupData.companyInput}</strong> and auto-configured everything for you.
                    You can customize anything later!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => onNavigate('ai-chatbot')}
              className="p-4 bg-blue-50 hover:bg-blue-100 rounded-xl border-2 border-blue-200 transition-colors text-center"
            >
              <div className="text-2xl mb-1">🤖</div>
              <div className="text-xs font-semibold text-blue-900">AI Chatbot</div>
            </button>
            <button
              onClick={() => onNavigate('products-list')}
              className="p-4 bg-purple-50 hover:bg-purple-100 rounded-xl border-2 border-purple-200 transition-colors text-center"
            >
              <div className="text-2xl mb-1">📦</div>
              <div className="text-xs font-semibold text-purple-900">My Products</div>
            </button>
            <button
              onClick={() => onNavigate('scan-entry')}
              className="p-4 bg-pink-50 hover:bg-pink-100 rounded-xl border-2 border-pink-200 transition-colors text-center"
            >
              <div className="text-2xl mb-1">🎯</div>
              <div className="text-xs font-semibold text-pink-900">Scan Leads</div>
            </button>
            <button
              onClick={() => onNavigate('missions')}
              className="p-4 bg-orange-50 hover:bg-orange-100 rounded-xl border-2 border-orange-200 transition-colors text-center"
            >
              <div className="text-2xl mb-1">🎯</div>
              <div className="text-xs font-semibold text-orange-900">Missions</div>
            </button>
          </div>
        </div>

        {/* Activation Checklist */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Path to First Sale</h2>
          {/* ActivationChecklist component would go here */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <p className="text-gray-600">Complete your first 5 wins to unlock full features</p>
            <button
              onClick={onComplete}
              className="mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg transition-all"
            >
              Start Now
            </button>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="text-center">
          <button
            onClick={onComplete}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
