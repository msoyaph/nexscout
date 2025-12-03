export type ScanState =
  | 'queued'
  | 'initializing'
  | 'ocr_processing'
  | 'parsing_facebook'
  | 'nlp_enrichment'
  | 'taglish_analysis'
  | 'personality_profiling'
  | 'pain_point_detection'
  | 'scoring'
  | 'saving_results'
  | 'completed'
  | 'failed';

export interface ScanPipelineState {
  current_state: ScanState;
  progress_percentage: number;
  message: string;
  started_at: string;
  completed_at?: string;
  error_message?: string;
  metadata?: Record<string, any>;
}

export interface StateTransition {
  from: ScanState;
  to: ScanState;
  progress: number;
  message: string;
  duration_estimate_ms: number;
}

export class ScanPipelineStateMachine {
  private static readonly STATE_DEFINITIONS: Record<
    ScanState,
    { progress: number; message: string; duration_ms: number }
  > = {
    queued: {
      progress: 0,
      message: 'Scan queued, waiting to start...',
      duration_ms: 500,
    },
    initializing: {
      progress: 5,
      message: 'Initializing scan pipeline...',
      duration_ms: 1000,
    },
    ocr_processing: {
      progress: 15,
      message: 'Extracting text from images (OCR)...',
      duration_ms: 5000,
    },
    parsing_facebook: {
      progress: 30,
      message: 'Parsing Facebook screenshot layout...',
      duration_ms: 2000,
    },
    nlp_enrichment: {
      progress: 45,
      message: 'Enriching with NLP analysis...',
      duration_ms: 3000,
    },
    taglish_analysis: {
      progress: 55,
      message: 'Analyzing Taglish/Filipino content...',
      duration_ms: 2000,
    },
    personality_profiling: {
      progress: 65,
      message: 'Building personality profiles...',
      duration_ms: 2500,
    },
    pain_point_detection: {
      progress: 75,
      message: 'Detecting pain points and opportunities...',
      duration_ms: 2000,
    },
    scoring: {
      progress: 85,
      message: 'Scoring prospects with AI...',
      duration_ms: 2500,
    },
    saving_results: {
      progress: 95,
      message: 'Saving scan results...',
      duration_ms: 1500,
    },
    completed: {
      progress: 100,
      message: 'Scan completed successfully!',
      duration_ms: 0,
    },
    failed: {
      progress: 0,
      message: 'Scan failed',
      duration_ms: 0,
    },
  };

  private static readonly VALID_TRANSITIONS: Record<ScanState, ScanState[]> = {
    queued: ['initializing', 'failed'],
    initializing: ['ocr_processing', 'failed'],
    ocr_processing: ['parsing_facebook', 'failed'],
    parsing_facebook: ['nlp_enrichment', 'failed'],
    nlp_enrichment: ['taglish_analysis', 'failed'],
    taglish_analysis: ['personality_profiling', 'failed'],
    personality_profiling: ['pain_point_detection', 'failed'],
    pain_point_detection: ['scoring', 'failed'],
    scoring: ['saving_results', 'failed'],
    saving_results: ['completed', 'failed'],
    completed: [],
    failed: [],
  };

  static createInitialState(): ScanPipelineState {
    return {
      current_state: 'queued',
      progress_percentage: 0,
      message: 'Scan queued, waiting to start...',
      started_at: new Date().toISOString(),
    };
  }

  static transition(
    currentState: ScanPipelineState,
    nextState: ScanState,
    metadata?: Record<string, any>
  ): ScanPipelineState {
    const validTransitions = this.VALID_TRANSITIONS[currentState.current_state];

    if (!validTransitions.includes(nextState)) {
      throw new Error(
        `Invalid transition from ${currentState.current_state} to ${nextState}`
      );
    }

    const stateDefinition = this.STATE_DEFINITIONS[nextState];

    const newState: ScanPipelineState = {
      current_state: nextState,
      progress_percentage: stateDefinition.progress,
      message: stateDefinition.message,
      started_at: currentState.started_at,
      metadata: { ...currentState.metadata, ...metadata },
    };

    if (nextState === 'completed' || nextState === 'failed') {
      newState.completed_at = new Date().toISOString();
    }

    return newState;
  }

  static fail(currentState: ScanPipelineState, errorMessage: string): ScanPipelineState {
    return {
      current_state: 'failed',
      progress_percentage: currentState.progress_percentage,
      message: 'Scan failed',
      started_at: currentState.started_at,
      completed_at: new Date().toISOString(),
      error_message: errorMessage,
      metadata: currentState.metadata,
    };
  }

  static getNextState(currentState: ScanState): ScanState | null {
    const validTransitions = this.VALID_TRANSITIONS[currentState];

    if (validTransitions.length === 0) {
      return null;
    }

    return validTransitions[0];
  }

  static getEstimatedDuration(fromState: ScanState, toState: ScanState): number {
    let totalDuration = 0;
    let current = fromState;

    while (current !== toState) {
      const next = this.getNextState(current);

      if (!next) {
        break;
      }

      totalDuration += this.STATE_DEFINITIONS[current].duration_ms;
      current = next;
    }

    return totalDuration;
  }

  static getTotalEstimatedDuration(): number {
    return Object.values(this.STATE_DEFINITIONS).reduce(
      (sum, def) => sum + def.duration_ms,
      0
    );
  }

  static isTerminalState(state: ScanState): boolean {
    return state === 'completed' || state === 'failed';
  }

  static getStateProgress(state: ScanState): number {
    return this.STATE_DEFINITIONS[state].progress;
  }

  static getStateMessage(state: ScanState): string {
    return this.STATE_DEFINITIONS[state].message;
  }

  static getProgressPercentage(currentState: ScanPipelineState): number {
    return currentState.progress_percentage;
  }

  static getElapsedTime(currentState: ScanPipelineState): number {
    const startTime = new Date(currentState.started_at).getTime();
    const endTime = currentState.completed_at
      ? new Date(currentState.completed_at).getTime()
      : Date.now();

    return endTime - startTime;
  }

  static getRemainingTime(currentState: ScanPipelineState): number {
    if (this.isTerminalState(currentState.current_state)) {
      return 0;
    }

    const totalDuration = this.getTotalEstimatedDuration();
    const elapsed = this.getElapsedTime(currentState);
    const progressRatio = currentState.progress_percentage / 100;

    const estimatedTotal = elapsed / progressRatio;
    const remaining = Math.max(0, estimatedTotal - elapsed);

    return Math.round(remaining);
  }

  static getAllStates(): ScanState[] {
    return Object.keys(this.STATE_DEFINITIONS) as ScanState[];
  }

  static getStateSequence(): ScanState[] {
    return [
      'queued',
      'initializing',
      'ocr_processing',
      'parsing_facebook',
      'nlp_enrichment',
      'taglish_analysis',
      'personality_profiling',
      'pain_point_detection',
      'scoring',
      'saving_results',
      'completed',
    ];
  }

  static validateState(state: string): state is ScanState {
    return state in this.STATE_DEFINITIONS;
  }
}
