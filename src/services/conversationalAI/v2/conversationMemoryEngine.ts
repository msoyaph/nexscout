import { supabase } from '../../../lib/supabase';

export interface ProspectMemory {
  prospectId: string;
  name?: string;
  goals: string[];
  painPoints: string[];
  budgetRange?: string;
  productsLiked: string[];
  objectionsRepeated: string[];
  personalNotes: string[];
  relationshipCloseness: number;
  timeline?: string;
  buyingTemperatureTrend: Array<{ date: string; temp: number }>;
  conversationCount: number;
  lastInteraction: string;
}

export class ConversationMemoryEngine {
  /**
   * Load prospect memory
   */
  async loadMemory(prospectId: string): Promise<ProspectMemory | null> {
    const { data, error } = await supabase
      .from('prospect_conversation_memory')
      .select('*')
      .eq('prospect_id', prospectId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      prospectId: data.prospect_id,
      name: data.name,
      goals: data.goals || [],
      painPoints: data.pain_points || [],
      budgetRange: data.budget_range,
      productsLiked: data.products_liked || [],
      objectionsRepeated: data.objections_repeated || [],
      personalNotes: data.personal_notes || [],
      relationshipCloseness: data.relationship_closeness || 0,
      timeline: data.timeline,
      buyingTemperatureTrend: data.buying_temperature_trend || [],
      conversationCount: data.conversation_count || 0,
      lastInteraction: data.last_interaction,
    };
  }

  /**
   * Update memory from conversation
   */
  async updateMemory(
    userId: string,
    prospectId: string,
    updates: Partial<ProspectMemory>
  ): Promise<void> {
    const existing = await this.loadMemory(prospectId);

    const memoryData = {
      user_id: userId,
      prospect_id: prospectId,
      name: updates.name || existing?.name,
      goals: updates.goals || existing?.goals || [],
      pain_points: updates.painPoints || existing?.painPoints || [],
      budget_range: updates.budgetRange || existing?.budgetRange,
      products_liked: updates.productsLiked || existing?.productsLiked || [],
      objections_repeated: updates.objectionsRepeated || existing?.objectionsRepeated || [],
      personal_notes: updates.personalNotes || existing?.personalNotes || [],
      relationship_closeness: updates.relationshipCloseness ?? existing?.relationshipCloseness ?? 0,
      timeline: updates.timeline || existing?.timeline,
      buying_temperature_trend: updates.buyingTemperatureTrend || existing?.buyingTemperatureTrend || [],
      conversation_count: (existing?.conversationCount || 0) + 1,
      last_interaction: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await supabase
      .from('prospect_conversation_memory')
      .upsert(memoryData, { onConflict: 'prospect_id' });
  }

  /**
   * Extract memory updates from message
   */
  extractMemoryFromMessage(message: string): Partial<ProspectMemory> {
    const updates: Partial<ProspectMemory> = {};

    // Extract goals
    if (message.match(/goal|want to|looking for|trying to/i)) {
      const goalMatch = message.match(/(?:goal|want to|looking for|trying to)\s+([^.!?]+)/i);
      if (goalMatch) {
        updates.goals = [goalMatch[1].trim()];
      }
    }

    // Extract pain points
    if (message.match(/problem|issue|struggling|difficult|hard to/i)) {
      const painMatch = message.match(/(?:problem|issue|struggling|difficult|hard to)\s+([^.!?]+)/i);
      if (painMatch) {
        updates.painPoints = [painMatch[1].trim()];
      }
    }

    // Extract budget
    if (message.match(/budget|afford|spend|invest/i)) {
      const budgetMatch = message.match(/(?:budget|afford|spend|invest).*?(\d+(?:,\d{3})*(?:\.\d{2})?)/i);
      if (budgetMatch) {
        updates.budgetRange = budgetMatch[1];
      }
    }

    // Extract timeline
    if (message.match(/asap|urgent|soon|next week|next month|later this year/i)) {
      const timelineMatch = message.match(/(asap|urgent|soon|next week|next month|later this year)/i);
      if (timelineMatch) {
        updates.timeline = timelineMatch[1];
      }
    }

    return updates;
  }

  /**
   * Build context summary for AI
   */
  buildContextSummary(memory: ProspectMemory | null): string {
    if (!memory) {
      return 'New prospect - no previous conversation history.';
    }

    const parts: string[] = [];

    if (memory.name) {
      parts.push(`Prospect name: ${memory.name}`);
    }

    if (memory.goals.length > 0) {
      parts.push(`Goals: ${memory.goals.join(', ')}`);
    }

    if (memory.painPoints.length > 0) {
      parts.push(`Pain points: ${memory.painPoints.join(', ')}`);
    }

    if (memory.productsLiked.length > 0) {
      parts.push(`Interested in: ${memory.productsLiked.join(', ')}`);
    }

    if (memory.objectionsRepeated.length > 0) {
      parts.push(`Previous objections: ${memory.objectionsRepeated.join(', ')}`);
    }

    if (memory.timeline) {
      parts.push(`Timeline: ${memory.timeline}`);
    }

    if (memory.budgetRange) {
      parts.push(`Budget: ${memory.budgetRange}`);
    }

    parts.push(`Relationship closeness: ${memory.relationshipCloseness}/100`);
    parts.push(`Previous conversations: ${memory.conversationCount}`);

    if (memory.buyingTemperatureTrend.length > 0) {
      const latest = memory.buyingTemperatureTrend[memory.buyingTemperatureTrend.length - 1];
      parts.push(`Current buying temperature: ${latest.temp}/100`);
    }

    return parts.join('\n');
  }
}

export const conversationMemoryEngine = new ConversationMemoryEngine();
