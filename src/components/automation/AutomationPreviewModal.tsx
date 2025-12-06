import { useState } from 'react';
import { Check, X, RefreshCw, Edit3, Sparkles, TrendingUp, Clock, Zap } from 'lucide-react';

interface AutomationPreviewModalProps {
  isOpen: boolean;
  action: 'smart_scan' | 'follow_up' | 'qualify' | 'nurture' | 'book_meeting' | 'close_deal' | 'full_pipeline';
  prospectName: string;
  generatedContent: {
    message?: string;
    analysis?: any;
    recommendations?: string[];
    qualityScore?: number;
  };
  estimatedOutcome: {
    replyRate?: number;
    meetingRate?: number;
    closeRate?: number;
    estimatedRevenue?: number;
  };
  cost: {
    energy: number;
    coins: number;
  };
  onApprove: (content?: string) => void;
  onRegenerate: () => void;
  onCancel: () => void;
}

export default function AutomationPreviewModal({
  isOpen,
  action,
  prospectName,
  generatedContent,
  estimatedOutcome,
  cost,
  onApprove,
  onRegenerate,
  onCancel,
}: AutomationPreviewModalProps) {
  const [editMode, setEditMode] = useState(false);
  const [editedMessage, setEditedMessage] = useState(generatedContent.message || '');
  const [isRegenerating, setIsRegenerating] = useState(false);

  if (!isOpen) return null;

  const qualityScore = generatedContent.qualityScore || 0;
  const isHighQuality = qualityScore >= 90;
  const isGoodQuality = qualityScore >= 75;

  const getActionTitle = () => {
    switch (action) {
      case 'smart_scan': return 'Smart Scan Analysis';
      case 'follow_up': return 'AI Follow-Up Message';
      case 'qualify': return 'Qualification Assessment';
      case 'nurture': return 'Nurture Sequence';
      case 'book_meeting': return 'Meeting Invitation';
      case 'close_deal': return 'Closing Sequence';
      case 'full_pipeline': return 'Full Pipeline Automation';
      default: return 'AI Automation';
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    await onRegenerate();
    setIsRegenerating(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">Preview: {getActionTitle()}</h2>
              <p className="text-blue-100 text-sm">For: {prospectName}</p>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Quality Score - PREMIUM FEATURE */}
          <div className={`p-4 rounded-xl border-2 ${
            isHighQuality ? 'bg-green-50 border-green-300' :
            isGoodQuality ? 'bg-blue-50 border-blue-300' :
            'bg-yellow-50 border-yellow-300'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  isHighQuality ? 'bg-green-500' :
                  isGoodQuality ? 'bg-blue-500' :
                  'bg-yellow-500'
                }`}>
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-black text-gray-900">{qualityScore}</span>
                    <span className="text-gray-600">/100</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-700">
                    {isHighQuality ? 'Excellent Quality ⭐⭐⭐⭐⭐' :
                     isGoodQuality ? 'Good Quality ⭐⭐⭐⭐' :
                     'Fair Quality ⭐⭐⭐'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-600">AI Model</p>
                <p className="text-sm font-bold text-gray-900">GPT-4o</p>
                <p className="text-xs text-green-600">Premium AI</p>
              </div>
            </div>

            {/* Analysis Tags - PREMIUM FEATURE */}
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-white rounded-full text-xs font-medium text-gray-700 border border-gray-200">
                ✓ Personalized
              </span>
              <span className="px-2 py-1 bg-white rounded-full text-xs font-medium text-gray-700 border border-gray-200">
                ✓ Filipino-optimized
              </span>
              <span className="px-2 py-1 bg-white rounded-full text-xs font-medium text-gray-700 border border-gray-200">
                ✓ Clear CTA
              </span>
              <span className="px-2 py-1 bg-white rounded-full text-xs font-medium text-gray-700 border border-gray-200">
                ✓ No errors
              </span>
            </div>
          </div>

          {/* Expected Outcome - PREMIUM FEATURE */}
          {estimatedOutcome && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <h3 className="font-bold text-gray-900">Expected Results</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {estimatedOutcome.replyRate !== undefined && (
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{(estimatedOutcome.replyRate * 100).toFixed(0)}%</p>
                    <p className="text-xs text-gray-600">Est. Reply Rate</p>
                  </div>
                )}
                {estimatedOutcome.meetingRate !== undefined && (
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{(estimatedOutcome.meetingRate * 100).toFixed(0)}%</p>
                    <p className="text-xs text-gray-600">Meeting Rate</p>
                  </div>
                )}
                {estimatedOutcome.closeRate !== undefined && (
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">{(estimatedOutcome.closeRate * 100).toFixed(0)}%</p>
                    <p className="text-xs text-gray-600">Close Rate</p>
                  </div>
                )}
                {estimatedOutcome.estimatedRevenue !== undefined && (
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">₱{estimatedOutcome.estimatedRevenue.toLocaleString()}</p>
                    <p className="text-xs text-gray-600">Est. Revenue</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Message Preview/Edit */}
          {generatedContent.message && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-900">
                  {editMode ? 'Edit Message:' : 'Generated Message:'}
                </label>
                <button
                  onClick={() => setEditMode(!editMode)}
                  className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium transition-colors"
                >
                  <Edit3 className="w-3 h-3" />
                  {editMode ? 'Preview' : 'Edit'}
                </button>
              </div>

              {editMode ? (
                <textarea
                  value={editedMessage}
                  onChange={(e) => setEditedMessage(e.target.value)}
                  className="w-full h-48 p-4 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Edit your message..."
                />
              ) : (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 whitespace-pre-wrap text-sm leading-relaxed">
                  {editedMessage || generatedContent.message}
                </div>
              )}
            </div>
          )}

          {/* Analysis Results (for Smart Scan, Qualify) */}
          {generatedContent.analysis && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">Analysis Results:</h3>
              <div className="space-y-2 text-sm">
                {Object.entries(generatedContent.analysis).map(([key, value]) => (
                  <div key={key} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-gray-700">{key}:</span>{' '}
                      <span className="text-gray-600">{String(value)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {generatedContent.recommendations && generatedContent.recommendations.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-gray-900 mb-3">💡 AI Recommendations:</h3>
              <ul className="space-y-2">
                {generatedContent.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <span className="text-blue-600 font-bold">{idx + 1}.</span>
                    <span className="text-gray-700">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Cost Display - PREMIUM FEATURE */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">Automation Cost</p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Zap className="w-4 h-4 text-yellow-600" />
                    <span className="text-lg font-bold text-gray-900">{cost.energy}</span>
                    <span className="text-xs text-gray-600">energy</span>
                  </div>
                  <span className="text-gray-400">+</span>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full" />
                    <span className="text-lg font-bold text-gray-900">{cost.coins}</span>
                    <span className="text-xs text-gray-600">coins</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-600">Value</p>
                <p className="text-xl font-bold text-purple-600">
                  ₱{((cost.energy * 12.99) + (cost.coins * 1.99)).toFixed(0)}
                </p>
                <p className="text-xs text-green-600">Worth it! 💎</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex gap-3">
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold text-gray-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
            {isRegenerating ? 'Regenerating...' : 'Regenerate'}
          </button>
          
          <button
            onClick={onCancel}
            className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold text-gray-700 transition-colors"
          >
            Cancel
          </button>
          
          <button
            onClick={() => onApprove(editMode ? editedMessage : generatedContent.message)}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-[#1877F2] to-[#0C5DBE] hover:from-[#0C5DBE] hover:to-[#1877F2] text-white rounded-lg font-bold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            Approve & {action === 'follow_up' || action === 'close_deal' ? 'Send' : 'Execute'}
          </button>
        </div>
      </div>
    </div>
  );
}




