/**
 * Onboarding Services - Unified Exports
 * 
 * Central export point for all onboarding-related services
 */

// Core engine
export {
  initializeOnboarding,
  processQuickSetup,
  getChecklistProgress,
  unlockInitialFeatures,
  shouldShowOnboarding,
  getIndustryTemplates,
} from './onboardingEngine';

// Step processor (wrapper for individual steps)
export {
  processStep,
  getProgress,
  type StepResult,
} from './onboardingStepProcessor';

// Aha moment engine
export {
  checkForAhaMoment,
  ahaMomentTriggers,
  type AhaMomentType,
} from './ahaMomentEngine';

// Nudge engine
export {
  sendOnboardingNudge,
  getActiveNudges,
  dismissNudge,
} from '../nudges/nudgeEngineV3';

