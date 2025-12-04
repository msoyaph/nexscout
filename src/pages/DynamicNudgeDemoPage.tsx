import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, TrendingUp, Target } from 'lucide-react';
import { SurgeNudgeModal } from '../components/SurgeNudgeModal';
import { ROICalculatorCard } from '../components/ROICalculatorCard';
import { InChatUpgradeNudge } from '../components/InChatUpgradeNudge';
import { useDynamicNudges } from '../hooks/useDynamicNudges';
import { useUser } from '../hooks/useUser';
import { useSubscription } from '../hooks/useSubscription';

export default function DynamicNudgeDemoPage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { tier } = useSubscription();
  const {
    fingerprint,
    activeSurge,
    activeOffer,
    emotionalState,
    trackMetric,
    checkSurge,
    generateOffer,
    updateEmotionalState,
    clearSurge,
    clearOffer,
    isReady,
  } = useDynamicNudges();

  const [showSurgeModal, setShowSurgeModal] = useState(false);
  const [showInChatNudge, setShowInChatNudge] = useState(false);
  const [nudgeVariant, setNudgeVariant] = useState<'minimal' | 'expanded' | 'urgent'>('expanded');

  const [activityCount, setActivityCount] = useState({
    scans: 0,
    messages: 0,
    energy: 50,
  });

  useEffect(() => {
    if (isReady && !activeOffer) {
      generateOffer(499, 'PRO');
    }
  }, [isReady]);

  const simulateActivity = async (type: 'scans' | 'messages' | 'energy') => {
    const newCount = {
      ...activityCount,
      [type]: activityCount[type] + 5,
    };
    setActivityCount(newCount);

    await trackMetric(`${type}_activity`, newCount[type]);

    const thresholds = {
      scans: 15,
      messages: 20,
      energy: 80,
    };

    const surge = await checkSurge(type, newCount[type], thresholds[type]);
    if (surge) {
      await generateOffer(499, 'PRO', { hasSurge: true });
      setShowSurgeModal(true);
    }
  };

  const handleEmotionChange = async (emotion: string) => {
    updateEmotionalState(emotion as any);
    await generateOffer(499, 'PRO', { emotionalStateOverride: emotion as any });
  };

  const handleUpgrade = () => {
    navigate('/subscription-checkout?tier=PRO');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in to view this page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-4xl mx-auto p-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dynamic Nudge System v4.0
          </h1>
          <p className="text-gray-600 mb-6">
            Experience personalized, emotionally-intelligent upgrade nudges
          </p>

          {isReady && fingerprint && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border-2 border-blue-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">User Profile</h3>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Activity Level:</span>
                    <span className="font-semibold text-blue-600">
                      {fingerprint.patterns.highActivity ? 'High' : 'Normal'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">User Type:</span>
                    <span className="font-semibold text-blue-600">
                      {fingerprint.patterns.powerUser ? 'Power User' : 'Regular'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Conversion Ready:</span>
                    <span className="font-semibold text-green-600">
                      {Math.round(fingerprint.signals.conversionReadiness * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Emotional State</h3>
                <select
                  value={emotionalState}
                  onChange={(e) => handleEmotionChange(e.target.value)}
                  className="w-full px-3 py-2 border border-green-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="excited">Excited</option>
                  <option value="curious">Curious</option>
                  <option value="frustrated">Frustrated</option>
                  <option value="confident">Confident</option>
                  <option value="momentum">Momentum</option>
                  <option value="overwhelmed">Overwhelmed</option>
                  <option value="fearOfMissingOut">FOMO</option>
                  <option value="eager">Eager</option>
                  <option value="hesitant">Hesitant</option>
                  <option value="skeptical">Skeptical</option>
                </select>
                <p className="text-xs text-gray-600 mt-2">
                  Current emotion: <span className="font-semibold">{emotionalState}</span>
                </p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-4 border-2 border-orange-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Activity</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Scans:</span>
                    <span className="font-semibold">{activityCount.scans}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Messages:</span>
                    <span className="font-semibold">{activityCount.messages}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Energy:</span>
                    <span className="font-semibold">{activityCount.energy}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <button
              onClick={() => simulateActivity('scans')}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <Zap className="w-5 h-5" />
              Simulate Scans (+5)
            </button>
            <button
              onClick={() => simulateActivity('messages')}
              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <TrendingUp className="w-5 h-5" />
              Simulate Messages (+5)
            </button>
            <button
              onClick={() => simulateActivity('energy')}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <Target className="w-5 h-5" />
              Simulate Energy Use (+5)
            </button>
          </div>

          {activeSurge && (
            <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg p-4 mb-6">
              <h3 className="font-bold mb-1">Surge Detected!</h3>
              <p className="text-sm">
                {activeSurge.type} surge: {activeSurge.value} (threshold: {activeSurge.threshold})
              </p>
              <p className="text-xs mt-1">Intensity: {activeSurge.intensity}</p>
            </div>
          )}
        </div>

        {user.id && (
          <div className="mb-6">
            <ROICalculatorCard
              userId={user.id}
              currentTier={tier || 'FREE'}
              targetTier="PRO"
              onUpgrade={handleUpgrade}
            />
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">In-Chat Nudge Variants</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nudge Variant:
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setNudgeVariant('minimal')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                  nudgeVariant === 'minimal'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Minimal
              </button>
              <button
                onClick={() => setNudgeVariant('expanded')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                  nudgeVariant === 'expanded'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Expanded
              </button>
              <button
                onClick={() => setNudgeVariant('urgent')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                  nudgeVariant === 'urgent'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Urgent
              </button>
            </div>
          </div>

          <button
            onClick={() => setShowInChatNudge(!showInChatNudge)}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all mb-4"
          >
            {showInChatNudge ? 'Hide' : 'Show'} In-Chat Nudge
          </button>

          {showInChatNudge && activeOffer && (
            <InChatUpgradeNudge
              offer={activeOffer}
              variant={nudgeVariant}
              onUpgrade={handleUpgrade}
              onDismiss={() => setShowInChatNudge(false)}
            />
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Current Offer Details</h2>

          {activeOffer ? (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Original Price:</span>
                <span className="font-semibold">₱{activeOffer.originalPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Final Price:</span>
                <span className="font-semibold text-green-600">
                  ₱{activeOffer.finalPrice.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Discount:</span>
                <span className="font-semibold text-green-600">{activeOffer.discount}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Urgency:</span>
                <span className="font-semibold">{activeOffer.urgency}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Expires In:</span>
                <span className="font-semibold">{activeOffer.expiresIn} minutes</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">ROI Estimate:</span>
                <span className="font-semibold text-green-600">
                  ₱{activeOffer.roi_estimate.toLocaleString()}/mo
                </span>
              </div>
              <div className="border-t pt-3 mt-3">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Message:</span> {activeOffer.copyVariant}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">Loading offer...</p>
          )}
        </div>
      </div>

      {activeSurge && activeOffer && (
        <SurgeNudgeModal
          isOpen={showSurgeModal}
          onClose={() => {
            setShowSurgeModal(false);
            clearSurge();
          }}
          surge={activeSurge}
          offer={activeOffer}
          onUpgrade={handleUpgrade}
        />
      )}
    </div>
  );
}
