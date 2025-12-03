import { ScanContext, ScanState, ScanProgressEvent, DraftProspect } from './types';
import { supabase } from '../../lib/supabase';
import { preprocessSource } from './preprocessor';
import { runParser } from './parserAgents';
import { runEnrichment } from './enrichAgents';
import { runDeepIntel } from './deepIntelAgents';
import { recordLearning } from './learningLoop';

export class ScanStateMachine {
  private context: ScanContext;
  private progressCallback?: (event: ScanProgressEvent) => void;

  constructor(
    scanId: string,
    userId: string,
    sourceId: string,
    progressCallback?: (event: ScanProgressEvent) => void
  ) {
    this.context = {
      scanId,
      userId,
      sourceId,
      state: 'IDLE',
    };
    this.progressCallback = progressCallback;
  }

  async run(): Promise<string[]> {
    try {
      await this.transition('PREPROCESSING');
      await this.preprocessing();

      await this.transition('PARSING');
      await this.parsing();

      await this.transition('ENTITY_MATCHING');
      await this.entityMatching();

      await this.transition('ENRICHING');
      await this.enriching();

      await this.transition('DEEP_SCANNING');
      await this.deepScanning();

      await this.transition('ASSEMBLING_INTEL');
      await this.assemblingIntel();

      await this.transition('SAVING');
      await this.saving();

      await this.transition('LEARNING_UPDATE');
      await this.learningUpdate();

      await this.transition('COMPLETE');

      return this.context.finalProspectIds || [];
    } catch (error: any) {
      await this.transition('ERROR', error.message);
      throw error;
    }
  }

  private async transition(state: ScanState, error?: string) {
    this.context.state = state;
    if (error) {
      this.context.error = error;
    }

    await supabase.from('deep_scan_state_machine').upsert({
      scan_id: this.context.scanId,
      user_id: this.context.userId,
      current_state: state,
      context_snapshot: this.context,
      error_message: error || null,
    });

    if (this.progressCallback) {
      this.progressCallback({
        scanId: this.context.scanId,
        userId: this.context.userId,
        state,
        progress: this.calculateProgress(state),
        label: this.getStateLabel(state),
      });
    }
  }

  private calculateProgress(state: ScanState): number {
    const stateOrder: ScanState[] = [
      'IDLE',
      'PREPROCESSING',
      'PARSING',
      'ENTITY_MATCHING',
      'ENRICHING',
      'DEEP_SCANNING',
      'ASSEMBLING_INTEL',
      'SAVING',
      'LEARNING_UPDATE',
      'COMPLETE',
    ];
    const index = stateOrder.indexOf(state);
    return index === -1 ? 0 : (index / (stateOrder.length - 1)) * 100;
  }

  private getStateLabel(state: ScanState): string {
    const labels: Record<ScanState, string> = {
      IDLE: 'Initializing',
      PREPROCESSING: 'Preparing data',
      PARSING: 'Extracting prospects',
      ENTITY_MATCHING: 'Matching entities',
      ENRICHING: 'Enriching data',
      DEEP_SCANNING: 'Running deep intelligence',
      ASSEMBLING_INTEL: 'Assembling intelligence',
      SAVING: 'Saving results',
      LEARNING_UPDATE: 'Updating learning models',
      COMPLETE: 'Complete',
      ERROR: 'Error',
    };
    return labels[state] || state;
  }

  private async preprocessing() {
    const { data: source } = await supabase
      .from('prospect_sources')
      .select('*')
      .eq('id', this.context.sourceId)
      .single();

    if (!source) {
      throw new Error('Source not found');
    }

    const preprocessed = await preprocessSource(
      source,
      this.context.scanId,
      this.context.userId
    );

    this.context = { ...this.context, ...preprocessed };
  }

  private async parsing() {
    const prospects = await runParser(this.context);
    this.context.parsedProspects = prospects;
  }

  private async entityMatching() {
    if (!this.context.parsedProspects) return;
    const enriched = await runEnrichment(
      this.context.userId,
      this.context.parsedProspects
    );
    this.context.normalizedProspects = enriched;
  }

  private async enriching() {
  }

  private async deepScanning() {
    if (!this.context.normalizedProspects) return;

    const prospectIds: string[] = [];

    for (const draft of this.context.normalizedProspects) {
      const { data: entity } = await supabase
        .from('prospect_entities')
        .upsert(
          {
            user_id: this.context.userId,
            display_name: draft.display_name || '',
            first_name: draft.first_name,
            last_name: draft.last_name,
            emails: draft.contact_info?.emails || null,
            phones: draft.contact_info?.phones || null,
            facebook_handle: draft.social_handles?.facebook || null,
            instagram_handle: draft.social_handles?.instagram || null,
            linkedin_handle: draft.social_handles?.linkedin || null,
            tiktok_handle: draft.social_handles?.tiktok || null,
            last_seen_source_id: this.context.sourceId,
          },
          { onConflict: 'user_id,display_name' }
        )
        .select()
        .single();

      if (entity) {
        prospectIds.push(entity.id);

        const contextData = {
          entity,
          source: this.context.rawText?.substring(0, 500),
        };

        const intel = await runDeepIntel(
          this.context.userId,
          entity.id,
          contextData
        );

        await supabase.from('prospect_intel').upsert({
          user_id: this.context.userId,
          prospect_entity_id: entity.id,
          scout_score_v10: intel.scout_score_v10,
          confidence_score: intel.confidence_score,
          personality_profile: intel.personality_profile,
          pain_points: intel.pain_points,
          financial_signals: intel.financial_signals,
          business_interest: intel.business_interest,
          life_events: intel.life_events,
          emotional_state: intel.emotional_state,
          engagement_prediction: intel.engagement_prediction,
          upsell_readiness: intel.upsell_readiness,
          closing_likelihood: intel.closing_likelihood,
          top_opportunities: intel.top_opportunities,
        });
      }
    }

    this.context.finalProspectIds = prospectIds;
  }

  private async assemblingIntel() {
  }

  private async saving() {
    if (!this.context.finalProspectIds) return;

    for (const prospectId of this.context.finalProspectIds) {
      await supabase.from('prospect_history').insert({
        user_id: this.context.userId,
        prospect_entity_id: prospectId,
        event_type: 'discovered',
        event_data: {
          source_id: this.context.sourceId,
          scan_id: this.context.scanId,
        },
      });
    }

    await supabase
      .from('prospect_sources')
      .update({ processed: true })
      .eq('id', this.context.sourceId);
  }

  private async learningUpdate() {
    await recordLearning(
      this.context.userId,
      this.context.scanId,
      this.context.finalProspectIds || []
    );
  }
}
