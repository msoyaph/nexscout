/**
 * React Hook for AI Instructions Transformation
 * 
 * Provides easy-to-use hooks for transforming AI System Instructions
 * 
 * Usage:
 *   const { improve, regenerateTone, undo, history } = useInstructionsTransformation(userId);
 *   
 *   const result = await improve(rawInstructions);
 *   const toneResult = await regenerateTone(instructions, 'warm-filipino-adviser');
 *   const previous = undo();
 */

import { useState, useCallback } from 'react';
import { instructionsTransformationEngine, type ToneStyle } from '../services/ai/instructionsTransformationEngine';

interface TransformationState {
  current: string;
  isTransforming: boolean;
  error: string | null;
  canUndo: boolean;
}

export function useInstructionsTransformation(userId: string) {
  const [state, setState] = useState<TransformationState>({
    current: '',
    isTransforming: false,
    error: null,
    canUndo: false
  });

  /**
   * Improve instructions (formatting, clarity, structure)
   */
  const improve = useCallback(async (rawInstructions: string): Promise<string | null> => {
    setState(prev => ({ ...prev, isTransforming: true, error: null }));

    try {
      const result = await instructionsTransformationEngine.improveInstructions(
        userId,
        rawInstructions
      );

      if (result.error) {
        setState(prev => ({
          ...prev,
          isTransforming: false,
          error: result.error || 'Failed to improve instructions'
        }));
        return null;
      }

      const history = instructionsTransformationEngine.getHistory(userId);
      setState(prev => ({
        ...prev,
        current: result.improved,
        isTransforming: false,
        canUndo: history.length > 1,
        error: null
      }));

      return result.improved;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({
        ...prev,
        isTransforming: false,
        error: errorMessage
      }));
      return null;
    }
  }, [userId]);

  /**
   * Regenerate tone only
   */
  const regenerateTone = useCallback(async (
    instructions: string,
    toneStyle: ToneStyle
  ): Promise<string | null> => {
    setState(prev => ({ ...prev, isTransforming: true, error: null }));

    try {
      const result = await instructionsTransformationEngine.regenerateTone(
        userId,
        instructions,
        toneStyle
      );

      if (result.error) {
        setState(prev => ({
          ...prev,
          isTransforming: false,
          error: result.error || 'Failed to regenerate tone'
        }));
        return null;
      }

      const history = instructionsTransformationEngine.getHistory(userId);
      setState(prev => ({
        ...prev,
        current: result.transformed,
        isTransforming: false,
        canUndo: history.length > 1,
        error: null
      }));

      return result.transformed;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({
        ...prev,
        isTransforming: false,
        error: errorMessage
      }));
      return null;
    }
  }, [userId]);

  /**
   * Undo last transformation
   */
  const undo = useCallback((): string | null => {
    const previous = instructionsTransformationEngine.undo(userId);
    
    if (previous) {
      const history = instructionsTransformationEngine.getHistory(userId);
      setState(prev => ({
        ...prev,
        current: previous,
        canUndo: history.length > 1,
        error: null
      }));
      return previous;
    }

    setState(prev => ({
      ...prev,
      error: 'No previous version to restore',
      canUndo: false
    }));
    return null;
  }, [userId]);

  /**
   * Get transformation history
   */
  const getHistory = useCallback(() => {
    return instructionsTransformationEngine.getHistory(userId);
  }, [userId]);

  /**
   * Clear history
   */
  const clearHistory = useCallback(() => {
    instructionsTransformationEngine.clearHistory(userId);
    setState(prev => ({
      ...prev,
      current: '',
      canUndo: false
    }));
  }, [userId]);

  /**
   * Set current instructions (for initialization)
   */
  const setCurrent = useCallback((instructions: string) => {
    setState(prev => ({
      ...prev,
      current: instructions,
      canUndo: instructionsTransformationEngine.getHistory(userId).length > 1
    }));
  }, [userId]);

  return {
    // State
    current: state.current,
    isTransforming: state.isTransforming,
    error: state.error,
    canUndo: state.canUndo,

    // Actions
    improve,
    regenerateTone,
    undo,
    getHistory,
    clearHistory,
    setCurrent
  };
}


