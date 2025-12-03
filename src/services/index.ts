// Core AI Services
export { messagingEngine } from './ai/messagingEngine';
export { pitchDeckGenerator } from './ai/pitchDeckGenerator';
export { followUpSequencer } from './ai/followUpSequencer';
export * from './ai/aiProductivityEngine';

// Analytics & Intelligence
export { analyticsEngineV2 } from './intelligence/analyticsEngineV2';
export { funnelEngine } from './intelligence/funnelEngine';
export { abTestingEngine } from './intelligence/abTestingEngine';
export { mlPredictionEngine } from './intelligence/mlPredictionEngine';
export { retentionEngine } from './intelligence/retentionEngine';
export { viralEngine } from './intelligence/viralEngine';

// Admin Analytics
export { funnelAnalytics } from './funnelAnalytics';

// Notifications
export { notificationService } from './notifications/notificationService';

// Wallet & Payments
export { walletService } from './walletService';
export type { CoinTransaction, PaymentHistory, WalletStats } from './walletService';
export { coinTransactionService } from './coinTransactionService';
export type { PendingTransaction } from './coinTransactionService';

// Library Management
export { libraryService } from './libraryService';
export type { PitchDeck as LibraryPitchDeck, MessageSequence, LibraryGroup } from './libraryService';

// Scoring (reference only - use edge function as primary)
export { scoutScoringV2 } from './scoutScoringV2';
export { scoutScoreMath } from './scoutScoreMath';

// Type exports
export type { GenerateMessageParams, GenerateSequenceParams, GenerateDeckParams, SaveToLibraryParams, UsageLimitCheck, ObjectionResponse, BookingScript } from './ai/messagingEngine';
export type { Slide, PitchDeck } from './ai/pitchDeckGenerator';
export type { SequenceStep, FollowUpSequence } from './ai/followUpSequencer';
