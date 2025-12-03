import { supabase } from '../../../lib/supabase';

interface EmotionScores {
  interest: number;
  hesitation: number;
  fear: number;
  excitement: number;
  urgency: number;
  uncertainty: number;
  skepticism: number;
}

interface EmotionalAnalysis {
  prospectId: string;
  conversationId: string;
  messageId?: string;
  primaryEmotion: string;
  emotionScores: EmotionScores;
  emotionIntensity: number;
  buyingIntentScore: number;
  hesitationLevel: number;
  urgencyScore: number;
  skepticismScore: number;
  behavioralArchetype: string;
  decisionMakingStyle: 'emotional' | 'logical' | 'mixed';
}

export const emotionalTrackingEngine = {
  async analyzeMessage(params: {
    prospectId: string;
    conversationId: string;
    messageId?: string;
    messageContent: string;
    conversationHistory: any[];
    prospectData?: any;
  }): Promise<EmotionalAnalysis> {
    const { messageContent, conversationHistory, prospectId, conversationId, messageId } = params;

    const emotionScores = this.detectEmotions(messageContent, conversationHistory);
    const primaryEmotion = this.getPrimaryEmotion(emotionScores);
    const emotionIntensity = emotionScores[primaryEmotion as keyof EmotionScores];

    const behavioralArchetype = this.detectBehavioralArchetype(conversationHistory, emotionScores);
    const decisionMakingStyle = this.detectDecisionMakingStyle(conversationHistory, emotionScores);

    const buyingIntentScore = this.calculateBuyingIntent(
      emotionScores,
      behavioralArchetype,
      conversationHistory
    );

    const analysis: EmotionalAnalysis = {
      prospectId,
      conversationId,
      messageId,
      primaryEmotion,
      emotionScores,
      emotionIntensity,
      buyingIntentScore,
      hesitationLevel: emotionScores.hesitation,
      urgencyScore: emotionScores.urgency,
      skepticismScore: emotionScores.skepticism,
      behavioralArchetype,
      decisionMakingStyle
    };

    await this.saveSnapshot(analysis);

    return analysis;
  },

  detectEmotions(messageContent: string, history: any[]): EmotionScores {
    const text = messageContent.toLowerCase();
    const recentMessages = history.slice(-5).map(m => m.content?.toLowerCase() || '').join(' ');
    const allText = `${text} ${recentMessages}`;

    const emotions: EmotionScores = {
      interest: 0,
      hesitation: 0,
      fear: 0,
      excitement: 0,
      urgency: 0,
      uncertainty: 0,
      skepticism: 0
    };

    const interestPatterns = ['interested', 'curious', 'want to know', 'tell me more', 'sounds good', 'like this'];
    const hesitationPatterns = ['maybe', 'not sure', 'thinking', 'let me think', 'need time', 'hesitant'];
    const fearPatterns = ['worried', 'concern', 'afraid', 'scary', 'risky', 'safe', 'guarantee'];
    const excitementPatterns = ['excited', 'amazing', 'wow', 'great', 'awesome', 'love it', 'perfect'];
    const urgencyPatterns = ['need', 'urgent', 'asap', 'now', 'quickly', 'fast', 'immediately'];
    const uncertaintyPatterns = ['confused', 'unclear', 'dont understand', 'not clear', 'explain', 'what does'];
    const skepticismPatterns = ['scam', 'fake', 'legit', 'trust', 'proof', 'really', 'sure about'];

    emotions.interest = this.calculatePatternMatch(allText, interestPatterns);
    emotions.hesitation = this.calculatePatternMatch(allText, hesitationPatterns);
    emotions.fear = this.calculatePatternMatch(allText, fearPatterns);
    emotions.excitement = this.calculatePatternMatch(allText, excitementPatterns);
    emotions.urgency = this.calculatePatternMatch(allText, urgencyPatterns);
    emotions.uncertainty = this.calculatePatternMatch(allText, uncertaintyPatterns);
    emotions.skepticism = this.calculatePatternMatch(allText, skepticismPatterns);

    return emotions;
  },

  calculatePatternMatch(text: string, patterns: string[]): number {
    let matchCount = 0;
    patterns.forEach(pattern => {
      if (text.includes(pattern)) matchCount++;
    });

    return Math.min(1.0, matchCount / patterns.length * 2);
  },

  getPrimaryEmotion(scores: EmotionScores): string {
    const entries = Object.entries(scores);
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0][0];
  },

  detectBehavioralArchetype(history: any[], emotions: EmotionScores): string {
    const messageCount = history.length;
    const recentText = history.slice(-10).map(m => m.content?.toLowerCase() || '').join(' ');

    if (messageCount < 5 && emotions.excitement > 0.6) return 'fast_decision_maker';
    if (messageCount > 10 && emotions.interest > 0.5) return 'slow_researcher';
    if (recentText.includes('price') || recentText.includes('cost') || recentText.includes('how much')) {
      return 'price_sensitive';
    }
    if (recentText.includes('earn') || recentText.includes('income') || recentText.includes('profit')) {
      return 'opportunity_seeker';
    }
    if (emotions.excitement > 0.7 || emotions.interest > 0.7) return 'emotional_buyer';
    if (recentText.includes('proof') || recentText.includes('data') || recentText.includes('results')) {
      return 'logical_buyer';
    }

    return 'general';
  },

  detectDecisionMakingStyle(history: any[], emotions: EmotionScores): 'emotional' | 'logical' | 'mixed' {
    const recentText = history.slice(-10).map(m => m.content?.toLowerCase() || '').join(' ');

    const emotionalIndicators = ['feel', 'love', 'excited', 'dream', 'imagine', 'family', 'heart'];
    const logicalIndicators = ['proof', 'data', 'results', 'numbers', 'facts', 'statistics', 'evidence'];

    let emotionalScore = 0;
    let logicalScore = 0;

    emotionalIndicators.forEach(word => {
      if (recentText.includes(word)) emotionalScore++;
    });

    logicalIndicators.forEach(word => {
      if (recentText.includes(word)) logicalScore++;
    });

    if (emotionalScore > logicalScore * 1.5) return 'emotional';
    if (logicalScore > emotionalScore * 1.5) return 'logical';
    return 'mixed';
  },

  calculateBuyingIntent(emotions: EmotionScores, archetype: string, history: any[]): number {
    let intent = 0.5;

    if (emotions.interest > 0.6) intent += 0.15;
    if (emotions.excitement > 0.7) intent += 0.25;
    if (emotions.urgency > 0.5) intent += 0.1;
    if (archetype === 'fast_decision_maker') intent += 0.2;
    if (archetype === 'opportunity_seeker') intent += 0.15;

    if (emotions.hesitation > 0.5) intent -= 0.1;
    if (emotions.fear > 0.6) intent -= 0.15;
    if (emotions.skepticism > 0.7) intent -= 0.2;

    const recentText = history.slice(-5).map(m => m.content?.toLowerCase() || '').join(' ');
    if (recentText.includes('how much') || recentText.includes('pricing')) intent += 0.15;
    if (recentText.includes('when can i start') || recentText.includes('sign up')) intent += 0.3;

    return Math.max(0.0, Math.min(1.0, intent));
  },

  async saveSnapshot(analysis: EmotionalAnalysis): Promise<void> {
    await supabase.from('emotional_state_snapshots').insert({
      prospect_id: analysis.prospectId,
      conversation_id: analysis.conversationId,
      message_id: analysis.messageId,
      detected_emotions: analysis.emotionScores,
      primary_emotion: analysis.primaryEmotion,
      emotion_intensity: analysis.emotionIntensity,
      buying_intent_score: analysis.buyingIntentScore,
      hesitation_level: analysis.hesitationLevel,
      urgency_score: analysis.urgencyScore,
      skepticism_score: analysis.skepticismScore,
      behavioral_archetype: analysis.behavioralArchetype,
      decision_making_style: analysis.decisionMakingStyle
    });
  },

  async getEmotionalTrend(prospectId: string, days: number = 7): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data } = await supabase
      .from('emotional_state_snapshots')
      .select('*')
      .eq('prospect_id', prospectId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    return data || [];
  },

  async getLatestEmotionalState(prospectId: string): Promise<EmotionalAnalysis | null> {
    const { data } = await supabase
      .from('emotional_state_snapshots')
      .select('*')
      .eq('prospect_id', prospectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) return null;

    return {
      prospectId: data.prospect_id,
      conversationId: data.conversation_id,
      messageId: data.message_id,
      primaryEmotion: data.primary_emotion,
      emotionScores: data.detected_emotions,
      emotionIntensity: data.emotion_intensity,
      buyingIntentScore: data.buying_intent_score,
      hesitationLevel: data.hesitation_level,
      urgencyScore: data.urgency_score,
      skepticismScore: data.skepticism_score,
      behavioralArchetype: data.behavioral_archetype,
      decisionMakingStyle: data.decision_making_style
    };
  }
};
