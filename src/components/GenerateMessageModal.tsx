import { useState } from 'react';
import { X, Sparkles, Loader2, Copy, Check, Save } from 'lucide-react';
import { messagingEngine } from '../services/ai/messagingEngine';

interface GenerateMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  prospectId: string;
  prospectName: string;
  userId: string;
  onSuccess?: (message: string) => void;
}

export default function GenerateMessageModal({
  isOpen,
  onClose,
  prospectId,
  prospectName,
  userId,
  onSuccess,
}: GenerateMessageModalProps) {
  const [tone, setTone] = useState<'professional' | 'friendly' | 'casual' | 'direct'>('friendly');
  const [intent, setIntent] = useState<'recruit' | 'sell' | 'follow_up' | 'reconnect' | 'introduce' | 'book_call'>('introduce');
  const [productName, setProductName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError('');
    setGeneratedMessage('');

    try {
      const result = await messagingEngine.generateMessage({
        userId,
        prospectId,
        prospectName,
        intent,
        tone,
        productName: productName || undefined,
      });

      setIsGenerating(false);

      if (result.success && result.message) {
        setGeneratedMessage(result.message);
        onSuccess?.(result.message);
      } else {
        console.error('Generation result:', result);
        setError(result.error || 'Failed to generate message');
      }
    } catch (err) {
      console.error('Generation error:', err);
      setIsGenerating(false);
      setError(err instanceof Error ? err.message : 'Failed to generate message');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    const result = await messagingEngine.saveToLibrary({
      userId,
      contentType: 'message',
      title: `Message for ${prospectName}`,
      content: { message: generatedMessage, tone, intent },
      tags: [tone, intent],
    });

    if (result.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center">
      <div
        className="bg-white w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-y-auto"
        style={{ animation: 'slideUp 0.3s ease-out' }}
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Generate AI Message</h3>
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

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <p className="text-sm text-red-800">{error}</p>
              {error.includes('Upgrade') && (
                <button
                  onClick={() => window.location.href = '/pricing'}
                  className="mt-2 text-sm font-medium text-red-600 hover:text-red-700"
                >
                  View Plans →
                </button>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Tone</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Goal</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(['recruit', 'sell', 'follow_up', 'reconnect', 'introduce', 'book_call'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setIntent(g)}
                  className={`px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                    intent === g
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {g.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </button>
              ))}
            </div>
          </div>

          {(intent === 'sell' || intent === 'recruit') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product/Opportunity Name (Optional)
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g., My Product, My Business"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {!generatedMessage ? (
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium py-4 rounded-2xl hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Generate Message (20 coins)</span>
                </>
              )}
            </button>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Generated Message</span>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                      title="Save to library"
                    >
                      {saved ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Save className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                    <button
                      onClick={handleCopy}
                      className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                      title="Copy message"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{generatedMessage}</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setGeneratedMessage('');
                    setError('');
                  }}
                  className="flex-1 px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Generate New
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
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
