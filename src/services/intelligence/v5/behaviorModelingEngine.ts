import { supabase } from '../../../lib/supabase';

interface BehaviorPattern {
  archetype: string;
  communicationStyle: string;
  decisionMakingSpeed: string;
  priceOrientation: string;
  motivationType: string;
  trustLevel: number;
  engagementLevel: number;
}

interface BehaviorCluster {
  id: string;
  clusterName: string;
  archetypes: string[];
  characteristics: string[];
  recommendedApproach: string;
  prospectCount: number;
}

export const behaviorModelingEngine = {
  async analyzeProspectBehavior(params: {
    prospectId: string;
    conversationHistory: any[];
    emotionalData?: any;
    interactionData?: any;
  }): Promise<BehaviorPattern> {
    const { conversationHistory, emotionalData, interactionData } = params;

    const archetype = this.identifyArchetype(conversationHistory, emotionalData);
    const communicationStyle = this.identifyCommunicationStyle(conversationHistory);
    const decisionMakingSpeed = this.identifyDecisionSpeed(conversationHistory);
    const priceOrientation = this.identifyPriceOrientation(conversationHistory);
    const motivationType = this.identifyMotivation(conversationHistory);
    const trustLevel = this.calculateTrustLevel(conversationHistory, emotionalData);
    const engagementLevel = this.calculateEngagementLevel(conversationHistory, interactionData);

    const pattern: BehaviorPattern = {
      archetype,
      communicationStyle,
      decisionMakingSpeed,
      priceOrientation,
      motivationType,
      trustLevel,
      engagementLevel
    };

    return pattern;
  },

  identifyArchetype(history: any[], emotionalData?: any): string {
    const messageCount = history.length;
    const recentText = history.slice(-10).map(m => m.content?.toLowerCase() || '').join(' ');

    const archetypes = {
      fast_decision_maker: 0,
      slow_researcher: 0,
      price_sensitive: 0,
      opportunity_seeker: 0,
      emotional_buyer: 0,
      logical_buyer: 0,
      skeptical_buyer: 0,
      group_buyer: 0
    };

    if (messageCount < 5) archetypes.fast_decision_maker += 0.5;
    if (messageCount > 15) archetypes.slow_researcher += 0.5;

    if (recentText.match(/\b(price|cost|expensive|cheap|afford)\b/g)?.length > 2) {
      archetypes.price_sensitive += 0.7;
    }

    if (recentText.match(/\b(earn|income|profit|money|financial)\b/g)?.length > 2) {
      archetypes.opportunity_seeker += 0.7;
    }

    if (recentText.match(/\b(feel|love|excited|dream|family)\b/g)?.length > 2) {
      archetypes.emotional_buyer += 0.6;
    }

    if (recentText.match(/\b(proof|data|results|facts|evidence)\b/g)?.length > 2) {
      archetypes.logical_buyer += 0.6;
    }

    if (recentText.match(/\b(scam|fake|legit|trust|real)\b/g)?.length > 2) {
      archetypes.skeptical_buyer += 0.8;
    }

    if (recentText.match(/\b(we|us|team|group|together)\b/g)?.length > 3) {
      archetypes.group_buyer += 0.5;
    }

    if (emotionalData?.skepticismScore > 0.7) archetypes.skeptical_buyer += 0.5;
    if (emotionalData?.excitement > 0.7) archetypes.emotional_buyer += 0.4;

    const sorted = Object.entries(archetypes).sort((a, b) => b[1] - a[1]);
    return sorted[0][0];
  },

  identifyCommunicationStyle(history: any[]): string {
    const avgMessageLength = history.reduce((sum, m) => sum + (m.content?.length || 0), 0) / history.length;
    const responseSpeed = this.calculateAvgResponseSpeed(history);

    if (avgMessageLength > 200 && responseSpeed > 60) return 'detailed_thoughtful';
    if (avgMessageLength < 50 && responseSpeed < 30) return 'brief_quick';
    if (avgMessageLength > 100) return 'detailed';
    if (responseSpeed < 30) return 'responsive';

    return 'balanced';
  },

  identifyDecisionSpeed(history: any[]): string {
    const messageCount = history.length;
    const timeSpan = this.calculateConversationTimeSpan(history);

    if (messageCount < 5 && timeSpan < 3600) return 'very_fast';
    if (messageCount < 10 && timeSpan < 86400) return 'fast';
    if (messageCount > 20 || timeSpan > 604800) return 'slow';

    return 'moderate';
  },

  identifyPriceOrientation(history: any[]): string {
    const recentText = history.map(m => m.content?.toLowerCase() || '').join(' ');

    const priceCount = (recentText.match(/\b(price|cost|how much|expensive)\b/g) || []).length;
    const valueCount = (recentText.match(/\b(value|quality|worth|benefit)\b/g) || []).length;

    if (priceCount > valueCount * 2) return 'price_focused';
    if (valueCount > priceCount * 2) return 'value_focused';
    if (priceCount === 0 && valueCount === 0) return 'unconcerned';

    return 'balanced';
  },

  identifyMotivation(history: any[]): string {
    const recentText = history.map(m => m.content?.toLowerCase() || '').join(' ');

    const incomeMotivation = (recentText.match(/\b(earn|income|profit|money)\b/g) || []).length;
    const securityMotivation = (recentText.match(/\b(security|safe|protect|guarantee)\b/g) || []).length;
    const growthMotivation = (recentText.match(/\b(grow|improve|develop|better)\b/g) || []).length;
    const freedomMotivation = (recentText.match(/\b(freedom|independent|flexible|time)\b/g) || []).length;
    const socialMotivation = (recentText.match(/\b(community|team|help|share)\b/g) || []).length;

    const motivations = [
      { type: 'income', score: incomeMotivation },
      { type: 'security', score: securityMotivation },
      { type: 'growth', score: growthMotivation },
      { type: 'freedom', score: freedomMotivation },
      { type: 'social', score: socialMotivation }
    ];

    motivations.sort((a, b) => b.score - a.score);
    return motivations[0].type;
  },

  calculateTrustLevel(history: any[], emotionalData?: any): number {
    let trust = 0.5;

    const recentText = history.slice(-10).map(m => m.content?.toLowerCase() || '').join(' ');

    if (recentText.includes('thank')) trust += 0.1;
    if (recentText.includes('appreciate')) trust += 0.1;
    if (recentText.includes('sounds good')) trust += 0.15;
    if (recentText.includes('i like')) trust += 0.1;

    if (recentText.includes('scam')) trust -= 0.3;
    if (recentText.includes('fake')) trust -= 0.3;
    if (recentText.includes('not sure')) trust -= 0.1;
    if (recentText.includes('worried')) trust -= 0.15;

    if (emotionalData?.skepticismScore > 0.7) trust -= 0.2;
    if (emotionalData?.excitement > 0.7) trust += 0.15;

    return Math.max(0.0, Math.min(1.0, trust));
  },

  calculateEngagementLevel(history: any[], interactionData?: any): number {
    const messageCount = history.length;
    const avgResponseTime = this.calculateAvgResponseSpeed(history);
    const questionCount = history.filter(m => m.content?.includes('?')).length;

    let engagement = 0.5;

    if (messageCount > 15) engagement += 0.2;
    if (messageCount > 30) engagement += 0.1;
    if (avgResponseTime < 300) engagement += 0.15;
    if (questionCount > 5) engagement += 0.1;

    if (interactionData?.clickedLinks) engagement += 0.1;
    if (interactionData?.watchedVideo) engagement += 0.15;
    if (interactionData?.downloadedFile) engagement += 0.2;

    return Math.max(0.0, Math.min(1.0, engagement));
  },

  calculateAvgResponseSpeed(history: any[]): number {
    if (history.length < 2) return 300;

    let totalTime = 0;
    let count = 0;

    for (let i = 1; i < history.length; i++) {
      if (history[i].created_at && history[i - 1].created_at) {
        const diff = new Date(history[i].created_at).getTime() - new Date(history[i - 1].created_at).getTime();
        totalTime += diff / 1000;
        count++;
      }
    }

    return count > 0 ? totalTime / count : 300;
  },

  calculateConversationTimeSpan(history: any[]): number {
    if (history.length < 2) return 0;

    const first = new Date(history[0].created_at).getTime();
    const last = new Date(history[history.length - 1].created_at).getTime();

    return (last - first) / 1000;
  },

  async createBehaviorCluster(params: {
    clusterName: string;
    archetypes: string[];
    characteristics: string[];
    recommendedApproach: string;
    ownerType: string;
    ownerId?: string;
  }): Promise<string> {
    const { data } = await supabase
      .from('behavior_clusters')
      .insert({
        cluster_name: params.clusterName,
        archetype_tags: params.archetypes,
        characteristics: params.characteristics,
        recommended_approach: params.recommendedApproach,
        prospect_count: 0,
        owner_type: params.ownerType,
        owner_id: params.ownerId
      })
      .select()
      .single();

    return data.id;
  },

  async getBehaviorClusters(ownerType: string, ownerId?: string): Promise<BehaviorCluster[]> {
    let query = supabase
      .from('behavior_clusters')
      .select('*')
      .eq('owner_type', ownerType);

    if (ownerId) query = query.eq('owner_id', ownerId);

    const { data } = await query;

    return (data || []).map(c => ({
      id: c.id,
      clusterName: c.cluster_name,
      archetypes: c.archetype_tags || [],
      characteristics: c.characteristics || [],
      recommendedApproach: c.recommended_approach,
      prospectCount: c.prospect_count || 0
    }));
  },

  async assignProspectToCluster(prospectId: string, clusterId: string): Promise<void> {
    await supabase
      .from('behavior_clusters')
      .update({
        prospect_count: supabase.raw('prospect_count + 1')
      })
      .eq('id', clusterId);
  }
};
