import { supabase } from '../../../lib/supabase';
import { emotionalTrackingEngine } from '../v5/emotionalTrackingEngine';
import { behaviorModelingEngine } from '../v5/behaviorModelingEngine';

interface PredictiveSuggestion {
  id: string;
  label: string;
  text: string;
  strategy_tag: string;
  confidence: number;
}

interface Context {
  userId: string;
  prospectId: string;
  conversationId: string;
  lastMessages: any[];
  prospectProfile: any;
  emotionalState?: any;
  pipelineStage?: string;
}

export const predictiveReplyEngineV6 = {
  async getPredictiveReplies(context: Context): Promise<PredictiveSuggestion[]> {
    const { userId, prospectId, conversationId, lastMessages, prospectProfile, pipelineStage } = context;

    let emotionalState = context.emotionalState;
    if (!emotionalState && lastMessages.length > 0) {
      emotionalState = await emotionalTrackingEngine.analyzeMessage({
        prospectId,
        conversationId,
        messageContent: lastMessages[lastMessages.length - 1]?.content || '',
        conversationHistory: lastMessages
      });
    }

    const behaviorPattern = await this.analyzeBehaviorPattern(lastMessages, prospectProfile);

    const suggestions: PredictiveSuggestion[] = [];

    const safeReply = this.generateSafeReply(emotionalState, behaviorPattern, lastMessages);
    if (safeReply) suggestions.push(safeReply);

    const boldReply = this.generateBoldCloserReply(emotionalState, behaviorPattern, lastMessages, pipelineStage);
    if (boldReply) suggestions.push(boldReply);

    const storyReply = this.generateStoryReply(emotionalState, behaviorPattern, prospectProfile);
    if (storyReply) suggestions.push(storyReply);

    for (const suggestion of suggestions) {
      await this.logSuggestion(userId, prospectId, conversationId, suggestion);
    }

    return suggestions;
  },

  async analyzeBehaviorPattern(messages: any[], profile: any): Promise<any> {
    if (messages.length < 3) {
      return { archetype: 'new_contact', communicationStyle: 'unknown' };
    }

    return await behaviorModelingEngine.analyzeProspectBehavior({
      prospectId: profile?.id || '',
      conversationHistory: messages
    });
  },

  generateSafeReply(emotional: any, behavior: any, messages: any[]): PredictiveSuggestion | null {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) return null;

    const prospectName = 'there';
    let safeText = `Hi ${prospectName}! `;

    if (emotional?.primaryEmotion === 'interest') {
      safeText += 'I appreciate your interest! Would you like me to share more details about how this works?';
    } else if (emotional?.primaryEmotion === 'hesitation') {
      safeText += 'I understand you might need more information. What specific questions can I answer for you?';
    } else if (emotional?.primaryEmotion === 'skepticism') {
      safeText += 'I totally understand your concerns. Let me share some proof and testimonials that might help.';
    } else {
      safeText += 'Thanks for your message! How can I best help you today?';
    }

    return {
      id: 'safe_' + Date.now(),
      label: 'Safe Reply',
      text: safeText,
      strategy_tag: 'conservative',
      confidence: 0.85
    };
  },

  generateBoldCloserReply(emotional: any, behavior: any, messages: any[], stage?: string): PredictiveSuggestion | null {
    const buyingIntent = emotional?.buyingIntentScore || 0.5;

    if (buyingIntent < 0.6) return null;

    let boldText = '';

    if (buyingIntent > 0.8) {
      boldText = `I can see you're really interested! Let's get you started today. I have limited slots available this week. When works best for you - morning or afternoon?`;
    } else if (buyingIntent > 0.6) {
      boldText = `Based on what you've shared, I think you'd be a great fit for this. Would you like to schedule a quick 15-minute call to discuss the next steps?`;
    } else {
      boldText = `This could be a game-changer for you. Are you ready to take the next step?`;
    }

    return {
      id: 'bold_' + Date.now(),
      label: 'Bold Closer',
      text: boldText,
      strategy_tag: 'urgency_close',
      confidence: buyingIntent
    };
  },

  generateStoryReply(emotional: any, behavior: any, profile: any): PredictiveSuggestion | null {
    const archetype = behavior?.archetype || 'general';

    let storyText = '';

    if (archetype === 'emotional_buyer' || emotional?.primaryEmotion === 'excitement') {
      storyText = `Let me share a quick story. I had a client similar to you who started 6 months ago. They were hesitant at first, but now they're earning ₱50,000/month while working from home. The best part? They have more time with their family. Would you like to hear more about their journey?`;
    } else if (archetype === 'opportunity_seeker') {
      storyText = `I want to share something exciting. Last month, one of our members earned their first ₱25,000 in just 3 weeks. They started exactly where you are now. The opportunity is still growing. Would you like me to show you how they did it?`;
    } else {
      storyText = `I've seen so many people transform their lives with this. One person I know went from struggling financially to building a sustainable income stream. They now have the freedom they always dreamed of. Would you like to learn how you could do the same?`;
    }

    return {
      id: 'story_' + Date.now(),
      label: 'Story Approach',
      text: storyText,
      strategy_tag: 'story_method',
      confidence: 0.78
    };
  },

  async logSuggestion(userId: string, prospectId: string, conversationId: string, suggestion: PredictiveSuggestion): Promise<void> {
    await supabase.from('predictive_suggestions').insert({
      user_id: userId,
      prospect_id: prospectId,
      conversation_id: conversationId,
      suggestion_text: suggestion.text,
      suggestion_type: suggestion.label,
      strategy_tag: suggestion.strategy_tag,
      confidence_score: suggestion.confidence
    });
  },

  async markSuggestionAccepted(suggestionId: string, edited: boolean): Promise<void> {
    await supabase
      .from('predictive_suggestions')
      .update({
        accepted: true,
        edited,
        sent_at: new Date().toISOString()
      })
      .eq('id', suggestionId);
  },

  async markSuggestionIgnored(suggestionId: string): Promise<void> {
    await supabase
      .from('predictive_suggestions')
      .update({
        accepted: false
      })
      .eq('id', suggestionId);
  },

  async getSuggestionStats(userId: string, days: number = 7): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data } = await supabase
      .from('predictive_suggestions')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString());

    const total = data?.length || 0;
    const accepted = data?.filter(s => s.accepted).length || 0;
    const edited = data?.filter(s => s.edited).length || 0;

    return {
      total,
      accepted,
      acceptanceRate: total > 0 ? accepted / total : 0,
      editedRate: accepted > 0 ? edited / accepted : 0
    };
  }
};
