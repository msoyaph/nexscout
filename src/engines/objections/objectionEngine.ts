/**
 * OBJECTION ENGINE - Utility for Closing Engine
 * Quick access to objection responses
 */

import handlers from '../sequences/objection-handlers.json';

export type ObjectionType =
  | "price"
  | "hesitation"
  | "needsMoreInfo"
  | "tooExpensive"
  | "decisionDelay"
  | "skepticism"
  | "competition"
  | "timing";

/**
 * Get random objection response
 */
export function getObjectionResponse(type: ObjectionType | string): string {
  const typedHandlers = handlers as Record<string, string[]>;
  const list = typedHandlers[type] || typedHandlers["price"];

  if (!list || list.length === 0) {
    return "I understand your concern po. Let me help address that for you 😊";
  }

  return list[Math.floor(Math.random() * list.length)];
}

/**
 * Get all objection responses for a type
 */
export function getAllObjectionResponses(type: ObjectionType | string): string[] {
  const typedHandlers = handlers as Record<string, string[]>;
  return typedHandlers[type] || [];
}

/**
 * Get specific objection response by index
 */
export function getObjectionResponseByIndex(type: ObjectionType | string, index: number): string {
  const typedHandlers = handlers as Record<string, string[]>;
  const list = typedHandlers[type] || typedHandlers["price"];

  if (!list || list.length === 0) {
    return "I understand your concern po. Let me help address that for you 😊";
  }

  const safeIndex = index % list.length;
  return list[safeIndex];
}
