import { useState } from 'react';
import { X, Sparkles, Loader2, Copy, Check, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { messagingEngine } from '../services/ai/messagingEngine';
import TierBadge from './TierBadge';

interface GenerateSequenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  prospectId: string;
  prospectName: string;
  userId: string;
  userTier: 'free' | 'pro' | 'elite';
}

export default function GenerateSequenceModal({
  isOpen,
  onClose,
  prospectId,
  prospectName,
  userId,
  userTier,
}: GenerateSequenceModalProps) {
  const [tone, setTone] = useState<'professional' | 'friendly' | 'casual' | 'direct'>('professional');
  const [sequenceType, setSequenceType] = useState<'cold_outreach' | 'follow_up' | 'nurture' | 'reconnect' | 'close'>('follow_up');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSequence, setGeneratedSequence] = useState<any>(null);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [copiedSteps, setCopiedSteps] = useState<Set<number>>(new Set());
  const [showAISettings, setShowAISettings] = useState(false);

  if (!isOpen) return null;

  const isPro = userTier === 'pro';

  const handleGenerate = async () => {
    if (!isPro) {
      setError('Multi-step sequences are only available for Pro subscribers.');
      return;
    }

    setIsGenerating(true);
    setError('');
    setGeneratedSequence(null);

    const result = await messagingEngine.generateSequence({
      userId,
      prospectId,
      prospectName,
      tone,
      sequenceType,
      totalSteps: 5,
    });

    setIsGenerating(false);

    if (result.success && result.sequence) {
      setGeneratedSequence(result.sequence);
    } else {
      setError(result.error || 'Failed to generate sequence');
    }
  };

  const handleCopyStep = (stepIndex: number, message: string) => {
    navigator.clipboard.writeText(message);
    setCopiedSteps(new Set(copiedSteps).add(stepIndex));
    setTimeout(() => {
      setCopiedSteps((prev) => {
        const next = new Set(prev);
        next.delete(stepIndex);
        return next;
      });
    }, 2000);
  };

  const renderContent = () => {
    if (!isPro) {
      return (
        <div className="p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Elite Feature</h3>
          <p className="text-gray-600 mb-6">
            Multi-step follow-up sequences are exclusive to Elite subscribers.
            Upgrade to unlock advanced automation and nurture campaigns.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <TierBadge tier="elite" />
              <span className="font-semibold text-gray-900">Elite Benefits</span>
            </div>
            <ul className="text-left text-sm text-gray-700 space-y-1">
              <li>• 4-7 step automated sequences</li>
              <li>• AI-optimized send timing</li>
              <li>• Unlimited sequence generations</li>
              <li>• Advanced personalization</li>
            </ul>
          </div>
          <button
            onClick={() => window.location.href = '/pricing'}
            className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-medium py-4 rounded-2xl hover:shadow-lg transition-all"
          >
            Upgrade to Elite
          </button>
        </div>
      );
    }

    if (!generatedSequence) {
      return (
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Sequence Type</label>
            <div className="grid grid-cols-2 gap-2">
              {(['cold_outreach', 'follow_up', 'nurture', 'reconnect', 'close'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setSequenceType(type)}
                  className={`px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                    sequenceType === type
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Tone</label>
            <div className="grid grid-cols-4 gap-2">
              {(['professional', 'friendly', 'casual', 'direct'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                    tone === t
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium py-4 rounded-2xl hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating Sequence...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Generate 5-Step Sequence (50 coins)</span>
              </>
            )}
          </button>
        </div>
      );
    }

    const steps = generatedSequence.steps || [];
    const step = steps[currentStep];

    return (
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-xs text-gray-500">Day {step.day}</span>
          </div>
          <div className="flex gap-1">
            {steps.map((_: any, index: number) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full transition-all ${
                  index === currentStep ? 'bg-blue-500' : index < currentStep ? 'bg-blue-300' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 mb-6 min-h-[300px]">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">{step.subject}</h4>
            <button
              onClick={() => handleCopyStep(currentStep, step.message)}
              className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
              title="Copy message"
            >
              {copiedSteps.has(currentStep) ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-gray-600" />
              )}
            </button>
          </div>
          <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{step.message}</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="p-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
            disabled={currentStep === steps.length - 1}
            className="p-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors"
          >
            Save & Close
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center">
      <div
        className="bg-white w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-y-auto"
        style={{ animation: 'slideUp 0.3s ease-out' }}
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900">Generate Sequence</h3>
                <TierBadge tier="elite" />
              </div>
              <p className="text-sm text-gray-500">For {prospectName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {renderContent()}
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
