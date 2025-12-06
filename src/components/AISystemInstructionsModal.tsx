/**
 * AI SYSTEM INSTRUCTIONS MODAL
 * 
 * Unified modal for AI System Instructions across all features
 * Reusable component for: Chatbot, Pitch Decks, Messages, Sequences, Followups
 * 
 * Features:
 * - Rich editor with images and files
 * - Override intelligence toggle
 * - Smart mode / Override mode
 * - Help section with examples
 * - Auto-save
 */

import { useState, useEffect } from 'react';
import { Sparkles, X, Save, Power, AlertCircle, Check } from 'lucide-react';
import AIInstructionsRichEditor from './AIInstructionsRichEditor';
import { aiInstructionsService, type AIFeatureType, type RichContent } from '../services/ai/aiInstructionsService';

interface AISystemInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  featureType: AIFeatureType;
  featureName: string; // e.g., "Pitch Deck Generation", "AI Messages"
}

export default function AISystemInstructionsModal({
  isOpen,
  onClose,
  userId,
  featureType,
  featureName
}: AISystemInstructionsModalProps) {
  const [richContent, setRichContent] = useState<RichContent>({
    text: '',
    images: [],
    files: []
  });
  const [useCustomInstructions, setUseCustomInstructions] = useState(false);
  const [overrideIntelligence, setOverrideIntelligence] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && userId) {
      loadSettings();
    }
  }, [isOpen, userId, featureType]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const instructions = await aiInstructionsService.getInstructions(userId, featureType);

      if (instructions) {
        setRichContent(instructions.richContent);
        setUseCustomInstructions(instructions.useCustomInstructions);
        setOverrideIntelligence(instructions.overrideIntelligence);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await aiInstructionsService.saveInstructions(userId, featureType, {
        customInstructions: richContent.text,
        useCustomInstructions,
        overrideIntelligence,
        richContent,
      });

      if (result.success) {
        alert('Settings saved successfully!');
        onClose();
      } else {
        alert(`Failed to save: ${result.error}`);
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6" />
              <div>
                <h2 className="text-xl font-bold">AI System Instructions</h2>
                <p className="text-sm text-white/90">Power user mode for {featureName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading settings...</p>
            </div>
          ) : (
            <>
              {/* Enable Custom Instructions Toggle */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Power className="w-4 h-4 text-purple-600" />
                      Enable Custom Instructions
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Override default AI behavior for {featureName.toLowerCase()}</p>
                  </div>
                  <button
                    onClick={() => setUseCustomInstructions(!useCustomInstructions)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      useCustomInstructions ? 'bg-purple-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        useCustomInstructions ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {useCustomInstructions && (
                  <div className="pt-3 border-t border-purple-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-orange-600" />
                          Override Intelligence
                        </p>
                        <p className="text-xs text-gray-600 mt-1">Replace auto company data with custom instructions</p>
                      </div>
                      <button
                        onClick={() => setOverrideIntelligence(!overrideIntelligence)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          overrideIntelligence ? 'bg-orange-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            overrideIntelligence ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Rich Editor */}
              {useCustomInstructions && (
                <AIInstructionsRichEditor
                  userId={userId}
                  value={richContent}
                  onChange={setRichContent}
                  placeholder={`Write your custom AI instructions for ${featureName.toLowerCase()}...\n\nYou can insert images (product photos, logos, catalogs) and attach files (brochures, PDFs) using the toolbar above.`}
                />
              )}

              {/* Help Section */}
              {useCustomInstructions && (
                <details className="bg-blue-50 border border-blue-200 rounded-xl">
                  <summary className="px-4 py-3 text-sm font-semibold text-blue-700 cursor-pointer hover:bg-blue-100 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    💡 Tips & Examples
                  </summary>
                  <div className="px-4 py-3 border-t border-blue-200 text-xs text-gray-700 space-y-2">
                    <p className="font-semibold text-gray-900">What to include:</p>
                    <ul className="space-y-1 ml-4 list-disc">
                      <li>Company name, industry, and mission</li>
                      <li>Products/services with pricing</li>
                      <li>Target audience description</li>
                      <li>Unique value proposition</li>
                      <li>Key benefits and features</li>
                      <li>Social proof (testimonials, stats)</li>
                      <li>Call-to-action and contact info</li>
                      <li>Tone and style preferences</li>
                      <li>Insert product images for visual context</li>
                      <li>Attach brochures and downloadable materials</li>
                    </ul>
                  </div>
                </details>
              )}

              {/* Mode Indicators */}
              {useCustomInstructions && !overrideIntelligence && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <div className="text-xs text-gray-700">
                      <p className="font-semibold text-green-900 mb-1">Smart Mode Active</p>
                      <p>Custom instructions will be <strong>merged</strong> with your auto-synced company data, products, and brand voice.</p>
                    </div>
                  </div>
                </div>
              )}

              {useCustomInstructions && overrideIntelligence && (
                <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />
                    <div className="text-xs text-gray-700">
                      <p className="font-semibold text-orange-900 mb-1">⚠️ Override Mode Active</p>
                      <p>Your custom instructions will <strong>completely replace</strong> all auto-synced intelligence. The AI will only use what you write here and the media you attach.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Info When Disabled */}
              {!useCustomInstructions && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-center">
                  <Sparkles className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Using Auto Intelligence</h3>
                  <p className="text-xs text-gray-600 mb-4">
                    Your {featureName.toLowerCase()} is generated using automatically synced company data, products, and brand voice.
                  </p>
                  <p className="text-xs text-gray-500">
                    Enable custom instructions above to take full control.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 px-4 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}




