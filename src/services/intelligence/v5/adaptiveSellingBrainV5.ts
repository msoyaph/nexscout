import { supabase } from '../../../lib/supabase';

interface LearningSignal {
  signalType: 'success' | 'failure';
  weightType: string;
  weightKey: string;
  entityType: string;
  entityId?: string;
  contextData?: any;
  ownerType: 'user' | 'team' | 'enterprise' | 'system';
  ownerId?: string;
}

interface AdaptiveWeight {
  weightType: string;
  weightKey: string;
  weightValue: number;
  confidenceScore: number;
  successCount: number;
  failureCount: number;
}

export const adaptiveSellingBrainV5 = {
  async recordSuccess(signal: LearningSignal): Promise<void> {
    const { data: existingWeight } = await supabase
      .from('adaptive_learning_weights')
      .select('*')
      .eq('weight_type', signal.weightType)
      .eq('weight_key', signal.weightKey)
      .eq('entity_type', signal.entityType)
      .eq('owner_type', signal.ownerType)
      .maybeSingle();

    if (existingWeight) {
      const newWeightValue = Math.min(1.0, existingWeight.weight_value + 0.05);
      const newConfidence = Math.min(1.0, existingWeight.confidence_score + 0.02);

      await supabase
        .from('adaptive_learning_weights')
        .update({
          weight_value: newWeightValue,
          confidence_score: newConfidence,
          success_count: existingWeight.success_count + 1,
          last_success_at: new Date().toISOString(),
          learning_iteration: existingWeight.learning_iteration + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingWeight.id);
    } else {
      await supabase.from('adaptive_learning_weights').insert({
        weight_type: signal.weightType,
        weight_key: signal.weightKey,
        entity_type: signal.entityType,
        entity_id: signal.entityId,
        weight_value: 0.55,
        confidence_score: 0.6,
        success_count: 1,
        failure_count: 0,
        last_success_at: new Date().toISOString(),
        learning_iteration: 1,
        context_data: signal.contextData || {},
        owner_type: signal.ownerType,
        owner_id: signal.ownerId
      });
    }
  },

  async recordFailure(signal: LearningSignal): Promise<void> {
    const { data: existingWeight } = await supabase
      .from('adaptive_learning_weights')
      .select('*')
      .eq('weight_type', signal.weightType)
      .eq('weight_key', signal.weightKey)
      .eq('entity_type', signal.entityType)
      .eq('owner_type', signal.ownerType)
      .maybeSingle();

    if (existingWeight) {
      const newWeightValue = Math.max(0.0, existingWeight.weight_value - 0.05);
      const newConfidence = Math.max(0.0, existingWeight.confidence_score - 0.02);

      await supabase
        .from('adaptive_learning_weights')
        .update({
          weight_value: newWeightValue,
          confidence_score: newConfidence,
          failure_count: existingWeight.failure_count + 1,
          last_failure_at: new Date().toISOString(),
          learning_iteration: existingWeight.learning_iteration + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingWeight.id);
    } else {
      await supabase.from('adaptive_learning_weights').insert({
        weight_type: signal.weightType,
        weight_key: signal.weightKey,
        entity_type: signal.entityType,
        entity_id: signal.entityId,
        weight_value: 0.45,
        confidence_score: 0.4,
        success_count: 0,
        failure_count: 1,
        last_failure_at: new Date().toISOString(),
        learning_iteration: 1,
        context_data: signal.contextData || {},
        owner_type: signal.ownerType,
        owner_id: signal.ownerId
      });
    }
  },

  async getWeights(params: {
    weightType?: string;
    entityType?: string;
    ownerType?: string;
    ownerId?: string;
  }): Promise<AdaptiveWeight[]> {
    let query = supabase.from('adaptive_learning_weights').select('*');

    if (params.weightType) query = query.eq('weight_type', params.weightType);
    if (params.entityType) query = query.eq('entity_type', params.entityType);
    if (params.ownerType) query = query.eq('owner_type', params.ownerType);
    if (params.ownerId) query = query.eq('owner_id', params.ownerId);

    const { data } = await query.order('confidence_score', { ascending: false });

    return (data || []).map(w => ({
      weightType: w.weight_type,
      weightKey: w.weight_key,
      weightValue: w.weight_value,
      confidenceScore: w.confidence_score,
      successCount: w.success_count,
      failureCount: w.failure_count
    }));
  },

  async getBestPlaybook(prospectData: any, ownerType: string, ownerId?: string): Promise<string> {
    const weights = await this.getWeights({
      weightType: 'playbook_selection',
      entityType: 'prospect',
      ownerType,
      ownerId
    });

    if (weights.length === 0) {
      return 'appointment_first';
    }

    const buyingIntent = prospectData.buying_intent || 0.5;
    const archetype = prospectData.behavioral_archetype || 'general';

    if (buyingIntent > 0.7) {
      const urgencyWeight = weights.find(w => w.weightKey === 'urgency_close');
      if (urgencyWeight && urgencyWeight.confidenceScore > 0.6) {
        return 'urgency_close';
      }
    }

    if (archetype === 'logical_buyer') {
      const logicalWeight = weights.find(w => w.weightKey === 'logical_close');
      if (logicalWeight && logicalWeight.confidenceScore > 0.6) {
        return 'logical_close';
      }
    }

    if (archetype === 'emotional_buyer') {
      const storyWeight = weights.find(w => w.weightKey === 'story_method');
      if (storyWeight && storyWeight.confidenceScore > 0.6) {
        return 'story_method';
      }
    }

    const topWeight = weights.sort((a, b) =>
      (b.weightValue * b.confidenceScore) - (a.weightValue * a.confidenceScore)
    )[0];

    return topWeight?.weightKey || 'appointment_first';
  },

  async getBestProducts(prospectData: any, products: any[], ownerType: string, ownerId?: string): Promise<any[]> {
    const weights = await this.getWeights({
      weightType: 'product_recommendation',
      entityType: 'product',
      ownerType,
      ownerId
    });

    const productScores = products.map(product => {
      const weight = weights.find(w => w.weightKey === product.id);
      const baseScore = weight ? weight.weightValue * weight.confidenceScore : 0.5;

      const emotionMatch = this.calculateEmotionMatch(prospectData, product);
      const archetypeMatch = this.calculateArchetypeMatch(prospectData, product);

      return {
        product,
        score: baseScore * 0.5 + emotionMatch * 0.25 + archetypeMatch * 0.25
      };
    });

    return productScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(ps => ps.product);
  },

  calculateEmotionMatch(prospectData: any, product: any): number {
    const primaryEmotion = prospectData.primary_emotion || 'interest';

    if (primaryEmotion === 'fear' && product.benefits?.includes('security')) return 0.9;
    if (primaryEmotion === 'excitement' && product.benefits?.includes('opportunity')) return 0.9;
    if (primaryEmotion === 'urgency' && product.benefits?.includes('fast_results')) return 0.9;

    return 0.5;
  },

  calculateArchetypeMatch(prospectData: any, product: any): number {
    const archetype = prospectData.behavioral_archetype || 'general';

    if (archetype === 'price_sensitive' && product.price_tier === 'low') return 0.9;
    if (archetype === 'opportunity_seeker' && product.income_potential === 'high') return 0.9;
    if (archetype === 'logical_buyer' && product.has_proof === true) return 0.9;

    return 0.5;
  },

  async runDailyLearningCycle(ownerType: string, ownerId?: string): Promise<void> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { data: recentLogs } = await supabase
      .from('multi_agent_logs')
      .select('*')
      .gte('created_at', yesterday.toISOString());

    const successSignals: LearningSignal[] = [];
    const failureSignals: LearningSignal[] = [];

    (recentLogs || []).forEach(log => {
      if (log.success && log.confidence_score > 0.7) {
        successSignals.push({
          signalType: 'success',
          weightType: 'agent_decision',
          weightKey: `${log.agent_name}_${log.decisions_made[0]}`,
          entityType: 'conversation',
          entityId: log.conversation_id,
          contextData: { agentRole: log.agent_role },
          ownerType,
          ownerId
        });
      } else if (!log.success) {
        failureSignals.push({
          signalType: 'failure',
          weightType: 'agent_decision',
          weightKey: `${log.agent_name}_${log.decisions_made[0]}`,
          entityType: 'conversation',
          entityId: log.conversation_id,
          contextData: { errorMessage: log.error_message },
          ownerType,
          ownerId
        });
      }
    });

    for (const signal of successSignals) {
      await this.recordSuccess(signal);
    }

    for (const signal of failureSignals) {
      await this.recordFailure(signal);
    }

    console.log(`Learning cycle complete: ${successSignals.length} successes, ${failureSignals.length} failures`);
  }
};
