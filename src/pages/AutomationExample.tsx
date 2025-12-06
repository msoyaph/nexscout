/**
 * AUTOMATION EXAMPLE PAGE
 * 
 * Reference implementation showing how to wire all premium automation features:
 * 1. Preview Before Send
 * 2. Progress Tracking  
 * 3. Success Notifications
 * 4. Smart Recommendations
 * 5. Quota Display
 * 
 * Copy this pattern to integrate automation anywhere in the app
 */

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, Bot, MessageSquare, CheckCircle, Calendar, DollarSign, Zap } from 'lucide-react';

// Hooks & Services
import { useAuth } from '../contexts/AuthContext';
import { useAutomation } from '../hooks/useAutomation';

// Components
import AutomationPreviewModal from '../components/automation/AutomationPreviewModal';
import AutomationProgressModal from '../components/automation/AutomationProgressModal';
import AutomationToastContainer from '../components/automation/AutomationToastContainer';
import SmartRecommendationCard from '../components/automation/SmartRecommendationCard';
import AutomationQuotaDisplay from '../components/AutomationQuotaDisplay';

// Config
import { AUTOMATION_COSTS } from '../config/automationCosts';

interface AutomationExampleProps {
  onBack?: () => void;
}

export default function AutomationExample({ onBack }: AutomationExampleProps) {
  const { prospectId } = useParams<{ prospectId: string }>();
  const { user, profile } = useAuth();
  
  // Use the comprehensive automation hook
  const {
    showPreview,
    showProgress,
    previewData,
    progressData,
    recommendation,
    quotaStatus,
    isRunning,
    runAutomation,
    runRecommended,
    setShowPreview,
    setShowProgress,
    hasQuota,
    quotaRemaining,
  } = useAutomation(prospectId || '', 'John Dela Cruz'); // Replace with actual prospect name

  // Quick Actions
  const quickActions = [
    {
      id: 'smart_scan',
      icon: Bot,
      title: 'Smart Scan',
      description: 'Analyze and optimize pipeline',
      color: 'from-blue-500 to-cyan-500',
      ...AUTOMATION_COSTS.smart_scan,
    },
    {
      id: 'follow_up',
      icon: MessageSquare,
      title: 'Follow-Up',
      description: 'Send smart follow-ups',
      color: 'from-green-500 to-emerald-500',
      ...AUTOMATION_COSTS.follow_up,
    },
    {
      id: 'qualify',
      icon: CheckCircle,
      title: 'Qualify',
      description: 'AI-powered qualification',
      color: 'from-orange-500 to-yellow-500',
      ...AUTOMATION_COSTS.qualify,
    },
    {
      id: 'full_pipeline',
      icon: Zap,
      title: 'Full Automation',
      description: 'Complete pipeline automation',
      color: 'from-purple-500 to-pink-500',
      ...AUTOMATION_COSTS.full_pipeline,
    },
  ];

  const handleRunAction = async (actionId: string) => {
    await runAutomation(actionId);
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] p-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
        
        <h1 className="text-2xl font-bold text-gray-900">AI Pipeline Automation</h1>
        <p className="text-gray-600">Premium automation with 5-star UX</p>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Quota Display */}
        <AutomationQuotaDisplay />

        {/* Smart Recommendation */}
        {recommendation && (
          <SmartRecommendationCard
            recommendation={recommendation}
            onRunAction={runRecommended}
          />
        )}

        {/* Quick Actions Grid */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              const canAfford = true; // Calculate based on user energy/coins
              
              return (
                <button
                  key={action.id}
                  onClick={() => handleRunAction(action.id)}
                  disabled={isRunning}
                  className={`bg-white rounded-xl p-5 border-2 border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed group`}
                >
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  
                  {/* Title & Description */}
                  <h3 className="font-bold text-gray-900 text-left mb-1">{action.title}</h3>
                  <p className="text-xs text-gray-600 text-left mb-3">{action.description}</p>
                  
                  {/* Cost */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <Zap className="w-3 h-3 text-yellow-600" />
                        {action.energy}
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500" />
                        {action.coins}
                      </span>
                    </div>
                    {canAfford ? (
                      <span className="text-green-600 font-semibold">✓ Can afford</span>
                    ) : (
                      <span className="text-red-600 font-semibold">✗ Need more</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="font-bold text-gray-900 mb-4">✨ Premium Automation Features:</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-lg">👀</span>
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900">Preview Before Send</p>
                <p className="text-xs text-gray-600">Review and edit AI output before it goes out</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-lg">⏱️</span>
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900">Real-Time Progress</p>
                <p className="text-xs text-gray-600">See every step as AI works</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-lg">⭐</span>
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900">Quality Scoring</p>
                <p className="text-xs text-gray-600">95+ quality scores guaranteed</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-lg">💡</span>
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900">Smart Recommendations</p>
                <p className="text-xs text-gray-600">AI suggests best actions with ROI</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && previewData && (
        <AutomationPreviewModal
          isOpen={showPreview}
          action={previewData.action || 'follow_up'}
          prospectName={prospectName}
          generatedContent={previewData.content}
          estimatedOutcome={{
            replyRate: 0.34,
            estimatedRevenue: 6800,
          }}
          cost={AUTOMATION_COSTS[previewData.action || 'follow_up']}
          onApprove={previewData.onApprove}
          onRegenerate={async () => {
            // Regenerate logic here
            console.log('Regenerating...');
          }}
          onCancel={() => setShowPreview(false)}
        />
      )}

      {/* Progress Modal */}
      {showProgress && progressData && (
        <AutomationProgressModal
          isOpen={showProgress}
          action={progressData.steps[0]?.name || 'Running'}
          prospectName={prospectName}
          steps={progressData.steps}
          currentStep={progressData.currentStep}
          estimatedTotal={progressData.estimatedTotal}
          onCancel={() => {
            setShowProgress(false);
            setIsRunning(false);
          }}
        />
      )}

      {/* Toast Container (Add to App.tsx root for global use) */}
      <AutomationToastContainer />
    </div>
  );
}




