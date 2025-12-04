import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { GenerateMessagePayload } from '../config/apiConfig';
import { messagingClient } from '../services/ai/messagingClient';
import { useAnalytics } from './useAnalytics';

interface UseProspectActionsReturn {
  generateMessage: (payload: GenerateMessagePayload) => Promise<any>;
  generateDeck: (prospectId: string, context?: any) => Promise<any>;
  generateSequence: (prospectId: string, context?: any) => Promise<any>;
  addToPipeline: (prospectId: string, stage?: string) => Promise<void>;
  rescoreProspect: (prospectId: string) => Promise<void>;
  logAction: (prospectId: string, action: string, metadata?: any) => Promise<void>;
}

export function useProspectActions(): UseProspectActionsReturn {
  const { trackEvent } = useAnalytics();

  const generateMessage = useCallback(async (payload: GenerateMessagePayload) => {
    trackEvent('ai_message_generate_started', {
      prospectId: payload.prospectId,
      messageType: payload.messageType,
      channel: payload.channel,
    });

    try {
      const result = await messagingClient.generateMessage(payload);

      trackEvent('ai_message_generated', {
        prospectId: payload.prospectId,
        success: result.success,
      });

      return result;
    } catch (error: any) {
      trackEvent('ai_message_generate_failed', {
        prospectId: payload.prospectId,
        error: error.message,
      });

      throw error;
    }
  }, [trackEvent]);

  const generateDeck = useCallback(async (prospectId: string, context?: any) => {
    trackEvent('ai_deck_generate_started', { prospectId });

    try {
      return {
        success: true,
        deckId: `deck_${Date.now()}`,
        slides: [
          { title: 'Opening', content: 'Welcome slide' },
          { title: 'Problem', content: 'Problem statement' },
          { title: 'Solution', content: 'Your solution' },
          { title: 'Call to Action', content: 'Next steps' },
        ],
      };
    } catch (error: any) {
      trackEvent('ai_deck_generate_failed', {
        prospectId,
        error: error.message,
      });

      throw error;
    }
  }, [trackEvent]);

  const generateSequence = useCallback(async (prospectId: string, context?: any) => {
    trackEvent('ai_sequence_generate_started', { prospectId });

    try {
      return {
        success: true,
        sequenceId: `seq_${Date.now()}`,
        steps: [
          { day: 1, message: 'First touch message', channel: 'messenger' },
          { day: 3, message: 'Follow-up message', channel: 'messenger' },
          { day: 7, message: 'Value reminder', channel: 'messenger' },
        ],
      };
    } catch (error: any) {
      trackEvent('ai_sequence_generate_failed', {
        prospectId,
        error: error.message,
      });

      throw error;
    }
  }, [trackEvent]);

  const addToPipeline = useCallback(async (prospectId: string, stage: string = 'new') => {
    trackEvent('prospect_added_to_pipeline', { prospectId, stage });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.from('pipeline_prospects').insert({
        user_id: user.id,
        prospect_id: prospectId,
        stage,
        added_at: new Date().toISOString(),
      });

      if (error) throw error;
    } catch (error: any) {
      trackEvent('add_to_pipeline_failed', {
        prospectId,
        error: error.message,
      });

      throw error;
    }
  }, [trackEvent]);

  const rescoreProspect = useCallback(async (prospectId: string) => {
    trackEvent('prospect_rescored', { prospectId });

    try {
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error: any) {
      trackEvent('rescore_failed', {
        prospectId,
        error: error.message,
      });

      throw error;
    }
  }, [trackEvent]);

  const logAction = useCallback(async (
    prospectId: string,
    action: string,
    metadata?: any
  ) => {
    trackEvent('prospect_action_logged', { prospectId, action });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.from('prospect_actions').insert({
        user_id: user.id,
        prospect_id: prospectId,
        action,
        metadata,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Failed to log action:', error);
    }
  }, [trackEvent]);

  return {
    generateMessage,
    generateDeck,
    generateSequence,
    addToPipeline,
    rescoreProspect,
    logAction,
  };
}
