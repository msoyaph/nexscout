import { supabase } from '../../lib/supabase';

export interface GenerateMessageParams {
  userId: string;
  prospectId: string;
  prospectName: string;
  intent: 'recruit' | 'sell' | 'follow_up' | 'reconnect' | 'introduce' | 'book_call';
  tone: 'professional' | 'friendly' | 'casual' | 'direct';
  productName?: string;
}

export interface GenerateSequenceParams {
  userId: string;
  prospectId: string;
  prospectName: string;
  tone: 'professional' | 'friendly' | 'casual' | 'direct';
  sequenceType: 'cold_outreach' | 'follow_up' | 'nurture' | 'reconnect' | 'close';
  totalSteps?: number;
}

export interface GenerateDeckParams {
  userId: string;
  prospectId: string;
  productName: string;
  companyName?: string;
  version: 'basic' | 'elite';
}

export interface SaveToLibraryParams {
  userId: string;
  contentType: 'message' | 'sequence' | 'deck' | 'template' | 'snippet';
  title: string;
  content: any;
  tags?: string[];
}

export interface UsageLimitCheck {
  canUse: boolean;
  currentUsage: number;
  limit: number;
  resetDate: string;
}

export const messagingEngine = {
  async generateMessage(params: GenerateMessageParams) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier, coin_balance, daily_messages_used, last_reset_date')
        .eq('id', params.userId)
        .single();

      if (!profile) throw new Error('Profile not found');

      const tier = profile.subscription_tier || 'free';
      const today = new Date().toISOString().split('T')[0];

      if (tier === 'free') {
        const resetNeeded = profile.last_reset_date !== today;
        const currentUsage = resetNeeded ? 0 : (profile.daily_messages_used || 0);

        if (currentUsage >= 2) {
          return {
            success: false,
            error: 'daily_limit_reached',
            message: 'Free tier allows 2 messages per day. Upgrade to Pro for unlimited messages.',
            requiresUpgrade: true,
          };
        }
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-ai-content`;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prospectId: params.prospectId,
          generationType: 'message',
          tone: params.tone,
          goal: params.intent,
          productName: params.productName,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.error || 'Generation failed',
          requiresUpgrade: response.status === 403,
          insufficientCoins: response.status === 402,
        };
      }

      const result = await response.json();

      await supabase
        .from('generated_messages')
        .insert({
          user_id: params.userId,
          prospect_id: params.prospectId,
          message_text: result.output.message,
          intent: params.intent,
          tone: params.tone,
          model_used: 'gpt-4',
        });

      if (tier === 'free') {
        await supabase
          .from('profiles')
          .update({
            daily_messages_used: profile.daily_messages_used + 1,
            last_reset_date: today,
          })
          .eq('id', params.userId);
      }

      return {
        success: true,
        message: result.output.message,
        generationId: result.generationId,
      };
    } catch (error) {
      console.error('Error generating message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async generateSequence(params: GenerateSequenceParams) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier, coin_balance')
        .eq('id', params.userId)
        .single();

      if (!profile) throw new Error('Profile not found');

      const tier = profile.subscription_tier || 'free';

      if (tier === 'free' || tier === 'pro') {
        return {
          success: false,
          error: 'elite_only',
          message: 'Multi-step sequences are only available for Elite subscribers.',
          requiresUpgrade: true,
        };
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-ai-content`;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prospectId: params.prospectId,
          generationType: 'sequence',
          tone: params.tone,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.error || 'Generation failed',
          insufficientCoins: response.status === 402,
        };
      }

      const result = await response.json();

      const { data: sequence, error: sequenceError } = await supabase
        .from('message_sequences')
        .insert({
          user_id: params.userId,
          prospect_id: params.prospectId,
          title: `Follow-up sequence for ${params.prospectName}`,
          prospect_name: params.prospectName,
          sequence_type: params.sequenceType,
          tone: params.tone,
          total_steps: params.totalSteps || 5,
          status: 'draft',
        })
        .select()
        .single();

      if (sequenceError) throw sequenceError;

      const steps = result.output.sequence.map((step: any, index: number) => ({
        sequence_id: sequence.id,
        step_number: step.step,
        message: step.message,
        subject: step.subject,
        recommended_send_date: new Date(Date.now() + step.day * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
      }));

      await supabase.from('sequence_steps').insert(steps);

      return {
        success: true,
        sequence: {
          ...sequence,
          steps: result.output.sequence,
        },
        generationId: result.generationId,
      };
    } catch (error) {
      console.error('Error generating sequence:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async generateDeck(params: GenerateDeckParams) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier, coin_balance, weekly_presentations_used, last_reset_date')
        .eq('id', params.userId)
        .single();

      if (!profile) throw new Error('Profile not found');

      const tier = profile.subscription_tier || 'free';

      if (params.version === 'elite' && tier !== 'elite') {
        return {
          success: false,
          error: 'elite_only',
          message: 'Advanced pitch decks are only available for Elite subscribers.',
          requiresUpgrade: true,
        };
      }

      if (tier === 'free') {
        const weeklyUsage = profile.weekly_presentations_used || 0;
        if (weeklyUsage >= 1) {
          return {
            success: false,
            error: 'weekly_limit_reached',
            message: 'Free tier allows 1 pitch deck per week. Upgrade to Pro for 5 per week.',
            requiresUpgrade: true,
          };
        }
      } else if (tier === 'pro') {
        const weeklyUsage = profile.weekly_presentations_used || 0;
        if (weeklyUsage >= 5) {
          return {
            success: false,
            error: 'weekly_limit_reached',
            message: 'Pro tier allows 5 pitch decks per week. Upgrade to Elite for unlimited.',
            requiresUpgrade: true,
          };
        }
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-ai-content`;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prospectId: params.prospectId,
          generationType: 'deck',
          productName: params.productName,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.error || 'Generation failed',
          insufficientCoins: response.status === 402,
        };
      }

      const result = await response.json();

      const { data: deck, error: deckError } = await supabase
        .from('pitch_decks')
        .insert({
          user_id: params.userId,
          prospect_id: params.prospectId,
          title: `${params.productName} Pitch`,
          company_name: params.companyName || params.productName,
          slides: result.output.deck,
          version: params.version,
          status: 'completed',
        })
        .select()
        .single();

      if (deckError) throw deckError;

      if (tier === 'free' || tier === 'pro') {
        await supabase
          .from('profiles')
          .update({
            weekly_presentations_used: profile.weekly_presentations_used + 1,
          })
          .eq('id', params.userId);
      }

      return {
        success: true,
        deck: {
          ...deck,
          slides: result.output.deck,
        },
        generationId: result.generationId,
      };
    } catch (error) {
      console.error('Error generating deck:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async saveToLibrary(params: SaveToLibraryParams) {
    try {
      const { data, error } = await supabase
        .from('user_library')
        .insert({
          user_id: params.userId,
          content_type: params.contentType,
          title: params.title,
          content: params.content,
          tags: params.tags || [],
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        libraryItem: data,
      };
    } catch (error) {
      console.error('Error saving to library:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async getLibrary(userId: string, contentType?: string) {
    try {
      let query = supabase
        .from('user_library')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (contentType) {
        query = query.eq('content_type', contentType);
      }

      const { data, error } = await query;

      if (error) throw error;

      return {
        success: true,
        library: data,
      };
    } catch (error) {
      console.error('Error fetching library:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        library: [],
      };
    }
  },

  async checkUsageLimit(
    userId: string,
    usageType: 'message' | 'sequence' | 'deck' | 'deepscan'
  ): Promise<UsageLimitCheck> {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier, daily_messages_used, weekly_presentations_used, last_reset_date')
        .eq('id', userId)
        .single();

      if (!profile) {
        return { canUse: false, currentUsage: 0, limit: 0, resetDate: '' };
      }

      const tier = profile.subscription_tier || 'free';
      const today = new Date().toISOString().split('T')[0];
      const resetNeeded = profile.last_reset_date !== today;

      if (usageType === 'message') {
        if (tier === 'free') {
          const usage = resetNeeded ? 0 : (profile.daily_messages_used || 0);
          return {
            canUse: usage < 2,
            currentUsage: usage,
            limit: 2,
            resetDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          };
        }
        return { canUse: true, currentUsage: 0, limit: -1, resetDate: '' };
      }

      if (usageType === 'deck') {
        if (tier === 'free') {
          const usage = profile.weekly_presentations_used || 0;
          return { canUse: usage < 1, currentUsage: usage, limit: 1, resetDate: '' };
        }
        if (tier === 'pro') {
          const usage = profile.weekly_presentations_used || 0;
          return { canUse: usage < 5, currentUsage: usage, limit: 5, resetDate: '' };
        }
        return { canUse: true, currentUsage: 0, limit: -1, resetDate: '' };
      }

      if (usageType === 'sequence' || usageType === 'deepscan') {
        return {
          canUse: tier === 'elite',
          currentUsage: 0,
          limit: tier === 'elite' ? -1 : 0,
          resetDate: '',
        };
      }

      return { canUse: false, currentUsage: 0, limit: 0, resetDate: '' };
    } catch (error) {
      console.error('Error checking usage limit:', error);
      return { canUse: false, currentUsage: 0, limit: 0, resetDate: '' };
    }
  },
};
