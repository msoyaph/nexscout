import { useState } from 'react';
import { X, DollarSign, Activity, TrendingDown, AlertCircle, Target, Briefcase, Wrench, MessageCircle } from 'lucide-react';

interface CancelReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CancelReasonData) => void;
  onGoBack: () => void;
  currentTier: string;
}

export interface CancelReasonData {
  reason_primary: string;
  reason_secondary?: string;
  additional_feedback?: string;
  contact_back: boolean;
}

const reasons = [
  { id: 'too_expensive', label: 'Too expensive', icon: DollarSign, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  { id: 'not_using_enough', label: 'Not using the features enough', icon: Activity, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
  { id: 'no_results', label: "Didn't see results", icon: TrendingDown, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  { id: 'hard_to_use', label: 'Hard to use / confusing', icon: AlertCircle, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  { id: 'ai_not_accurate', label: 'Not enough AI accuracy', icon: Target, color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-200' },
  { id: 'changing_business', label: 'Changing business/career', icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  { id: 'missing_features', label: 'Missing features I need', icon: Wrench, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  { id: 'other', label: 'Other', icon: MessageCircle, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' }
];

export default function CancelReasonModal({
  isOpen,
  onClose,
  onSubmit,
  onGoBack,
  currentTier
}: CancelReasonModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [additionalFeedback, setAdditionalFeedback] = useState('');
  const [contactBack, setContactBack] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedReason) return;

    setSubmitting(true);

    const data: CancelReasonData = {
      reason_primary: selectedReason,
      additional_feedback: additionalFeedback || undefined,
      contact_back: contactBack
    };

    await onSubmit(data);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl my-8 animate-fadeIn">
        {/* Header */}
        <div className="relative p-6 pb-4 border-b border-gray-200">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">Why are you canceling?</h2>
          <p className="text-sm text-gray-600">
            This helps us improve your experience. Your answers help shape NexScout.
          </p>
        </div>

        {/* Reasons Grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {reasons.map((reason) => {
              const Icon = reason.icon;
              const isSelected = selectedReason === reason.id;

              return (
                <button
                  key={reason.id}
                  onClick={() => setSelectedReason(reason.id)}
                  className={`p-4 rounded-2xl border-2 transition-all text-left ${
                    isSelected
                      ? `${reason.border} ${reason.bg} shadow-md scale-[1.02]`
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${reason.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${reason.color}`} />
                    </div>
                    <span className={`font-medium ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                      {reason.label}
                    </span>
                    {isSelected && (
                      <div className="ml-auto w-5 h-5 rounded-full bg-[#1877F2] flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Additional Feedback */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tell us what would've helped you stay (optional)
            </label>
            <textarea
              value={additionalFeedback}
              onChange={(e) => setAdditionalFeedback(e.target.value)}
              rows={4}
              placeholder="Any specific features, improvements, or pricing that would make a difference?"
              className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1877F2] focus:border-transparent resize-none"
            />
          </div>

          {/* Contact Back Checkbox */}
          <label className="flex items-start gap-3 p-4 rounded-2xl bg-blue-50 border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors">
            <input
              type="checkbox"
              checked={contactBack}
              onChange={(e) => setContactBack(e.target.checked)}
              className="w-5 h-5 text-[#1877F2] rounded focus:ring-2 focus:ring-[#1877F2] mt-0.5"
            />
            <div>
              <div className="font-medium text-gray-900 text-sm">Contact me if you fix this issue</div>
              <div className="text-xs text-gray-600 mt-1">
                We'll reach out when we've made improvements based on your feedback
              </div>
            </div>
          </label>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onGoBack}
            className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-2xl font-semibold hover:bg-gray-200 transition-colors"
          >
            Go Back
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedReason || submitting}
            className={`flex-1 py-3 px-4 rounded-2xl font-semibold transition-colors ${
              !selectedReason || submitting
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700 shadow-lg'
            }`}
          >
            {submitting ? 'Processing...' : 'Submit Feedback & Cancel Subscription'}
          </button>
        </div>
      </div>
    </div>
  );
}
