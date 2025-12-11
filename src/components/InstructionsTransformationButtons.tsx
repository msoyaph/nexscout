/**
 * Instructions Transformation Buttons Component
 * 
 * Provides UI buttons for transforming AI System Instructions:
 * - "Improve My Instructions" - Format, clarity, structure
 * - "Regenerate Tone" - Change tone only (4 styles)
 * - "Undo" - Restore previous version
 * 
 * Usage:
 *   <InstructionsTransformationButtons
 *     userId={userId}
 *     currentInstructions={instructions}
 *     onInstructionsChange={setInstructions}
 *   />
 */

import { useState } from 'react';
import { Sparkles, RotateCcw, Wand2, Type } from 'lucide-react';
import { useInstructionsTransformation } from '../hooks/useInstructionsTransformation';
import type { ToneStyle } from '../services/ai/instructionsTransformationEngine';

interface InstructionsTransformationButtonsProps {
  userId: string;
  currentInstructions: string;
  onInstructionsChange: (instructions: string) => void;
  disabled?: boolean;
}

export default function InstructionsTransformationButtons({
  userId,
  currentInstructions,
  onInstructionsChange,
  disabled = false
}: InstructionsTransformationButtonsProps) {
  const {
    improve,
    regenerateTone,
    undo,
    isTransforming,
    error,
    canUndo,
    setCurrent
  } = useInstructionsTransformation(userId);

  const [showToneMenu, setShowToneMenu] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  // Initialize current instructions
  useState(() => {
    if (currentInstructions) {
      setCurrent(currentInstructions);
    }
  });

  const handleImprove = async () => {
    const improved = await improve(currentInstructions);
    if (improved) {
      onInstructionsChange(improved);
      setLastAction('improve');
    }
  };

  const handleRegenerateTone = async (toneStyle: ToneStyle) => {
    const transformed = await regenerateTone(currentInstructions, toneStyle);
    if (transformed) {
      onInstructionsChange(transformed);
      setLastAction(`tone-${toneStyle}`);
      setShowToneMenu(false);
    }
  };

  const handleUndo = () => {
    const previous = undo();
    if (previous) {
      onInstructionsChange(previous);
      setLastAction('undo');
    }
  };

  const toneOptions: { value: ToneStyle; label: string; description: string }[] = [
    {
      value: 'warm-filipino-adviser',
      label: 'Warm Filipino Adviser',
      description: 'Taglish, friendly "po/opo", like a trusted friend'
    },
    {
      value: 'youthful-casual',
      label: 'Youthful Casual',
      description: 'Modern, simple, relatable, like talking to a friend'
    },
    {
      value: 'corporate-straight',
      label: 'Corporate Straight',
      description: 'Professional, direct, business-appropriate'
    },
    {
      value: 'energetic-motivational',
      label: 'Energetic Motivational',
      description: 'Upbeat, encouraging, like an inspiring coach'
    }
  ];

  return (
    <div className="space-y-3">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {/* Improve Button */}
        <button
          onClick={handleImprove}
          disabled={disabled || isTransforming || !currentInstructions.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm"
        >
          <Wand2 className="w-4 h-4" />
          {isTransforming && lastAction === 'improve' ? 'Improving...' : 'Improve My Instructions'}
        </button>

        {/* Regenerate Tone Button */}
        <div className="relative">
          <button
            onClick={() => setShowToneMenu(!showToneMenu)}
            disabled={disabled || isTransforming || !currentInstructions.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:from-orange-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm"
          >
            <Type className="w-4 h-4" />
            {isTransforming && lastAction?.startsWith('tone-') ? 'Regenerating...' : 'Regenerate Tone'}
          </button>

          {/* Tone Menu Dropdown */}
          {showToneMenu && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden">
              {toneOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleRegenerateTone(option.value)}
                  disabled={isTransforming}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium text-sm text-gray-900">{option.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{option.description}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Undo Button */}
        {canUndo && (
          <button
            onClick={handleUndo}
            disabled={disabled || isTransforming}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Undo
          </button>
        )}
      </div>

      {/* Info Message */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
        <div className="flex items-start gap-2">
          <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold mb-1">Transformation Engine</p>
            <ul className="space-y-1 text-blue-600">
              <li>• <strong>Improve:</strong> Formats, organizes, and polishes your instructions</li>
              <li>• <strong>Regenerate Tone:</strong> Changes style only, keeps all content identical</li>
              <li>• <strong>Undo:</strong> Restores your previous version</li>
            </ul>
            <p className="mt-2 text-blue-500">
              ⚠️ All your content (names, products, prices, contacts) is preserved exactly as written.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


