/**
 * FUNNEL SEQUENCES UTILITY
 * Quick access to funnel-based auto-responses
 */

import sequences from '../sequences/funnel-sequences.json';
import type { FunnelStage } from './funnelEngineV3';

/**
 * Get random funnel sequence message
 */
export function getFunnelSequence(stage: FunnelStage | string): string {
  const typedSequences = sequences as Record<string, string[]>;
  const arr = typedSequences[stage] || typedSequences["awareness"];

  if (!arr || arr.length === 0) {
    return "Hello po! How can I help you today? 😊";
  }

  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Get all sequences for a stage
 */
export function getAllFunnelSequences(stage: FunnelStage | string): string[] {
  const typedSequences = sequences as Record<string, string[]>;
  return typedSequences[stage] || [];
}

/**
 * Get specific sequence by index
 */
export function getFunnelSequenceByIndex(stage: FunnelStage | string, index: number): string {
  const typedSequences = sequences as Record<string, string[]>;
  const arr = typedSequences[stage] || typedSequences["awareness"];

  if (!arr || arr.length === 0) {
    return "Hello po! How can I help you today? 😊";
  }

  const safeIndex = index % arr.length;
  return arr[safeIndex];
}

/**
 * Get contextual sequence based on attempt number
 * Returns different message each time
 */
export function getContextualSequence(
  stage: FunnelStage | string,
  attemptNumber: number,
  previousMessages: string[] = []
): string {
  const typedSequences = sequences as Record<string, string[]>;
  const arr = typedSequences[stage] || typedSequences["awareness"];

  if (!arr || arr.length === 0) {
    return "Hello po! How can I help you today? 😊";
  }

  // Filter out previously sent messages
  const availableMessages = arr.filter(msg => !previousMessages.includes(msg));

  // If all messages used, cycle through again
  if (availableMessages.length === 0) {
    const index = attemptNumber % arr.length;
    return arr[index];
  }

  // Return first available message
  return availableMessages[0];
}
