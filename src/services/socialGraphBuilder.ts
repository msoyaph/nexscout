import { supabase } from '../lib/supabase';

export interface GraphSummary {
  totalContacts: number;
  totalEdges: number;
  totalInteractions: number;
  averageDegree: number;
  platformBreakdown: Record<string, number>;
  interactionsLast30Days: number;
  prospectsWithSocialContext: number;
}

export interface TopContact {
  id: string;
  fullName: string;
  platform: string;
  relationshipStrength: number;
  totalInteractions: number;
  recentInteractions30d: number;
  lastInteractionAt?: string;
  mutualFriends?: number;
  isProspect: boolean;
}

export interface ContactFeatures {
  contactId: string;
  degree: number;
  totalInteractions: number;
  recentInteractions30d: number;
  recencyScore: number;
  relationshipStrength: number;
  engagementRate: number;
}

export class SocialGraphBuilder {
  static async buildGraphForUser(userId: string): Promise<GraphSummary> {
    console.log(`Building social graph for user ${userId}...`);

    await this.computeContactFeatures(userId);

    const summary = await this.computeGraphMetrics(userId);

    await this.storeGraphMetrics(userId, summary);

    console.log(`Graph built successfully. ${summary.totalContacts} contacts, ${summary.totalEdges} edges.`);

    return summary;
  }

  private static async computeContactFeatures(userId: string): Promise<void> {
    const { data: contacts } = await supabase
      .from('social_contacts')
      .select('id')
      .eq('user_id', userId);

    if (!contacts) return;

    for (const contact of contacts) {
      const features = await this.calculateContactFeatures(userId, contact.id);

      const { data: existing } = await supabase
        .from('social_contact_features')
        .select('id')
        .eq('contact_id', contact.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('social_contact_features')
          .update({
            degree: features.degree,
            total_interactions: features.totalInteractions,
            recent_interactions_30d: features.recentInteractions30d,
            recency_score: features.recencyScore,
            relationship_strength: features.relationshipStrength,
            engagement_rate: features.engagementRate,
            last_computed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        await supabase.from('social_contact_features').insert({
          contact_id: contact.id,
          user_id: userId,
          degree: features.degree,
          total_interactions: features.totalInteractions,
          recent_interactions_30d: features.recentInteractions30d,
          recency_score: features.recencyScore,
          relationship_strength: features.relationshipStrength,
          engagement_rate: features.engagementRate,
        });
      }
    }
  }

  private static async calculateContactFeatures(userId: string, contactId: string): Promise<ContactFeatures> {
    const { count: degreeCount } = await supabase
      .from('social_edges')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .or(`from_contact_id.eq.${contactId},to_contact_id.eq.${contactId}`);

    const degree = degreeCount || 0;

    const { data: interactions } = await supabase
      .from('social_interactions')
      .select('occurred_at, engagement_score')
      .eq('user_id', userId)
      .eq('contact_id', contactId);

    const totalInteractions = interactions?.length || 0;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentInteractions30d =
      interactions?.filter(i => new Date(i.occurred_at) >= thirtyDaysAgo).length || 0;

    const recencyScore = this.calculateRecencyScore(interactions || []);

    const relationshipStrength = this.calculateRelationshipStrength(
      degree,
      totalInteractions,
      recentInteractions30d,
      recencyScore
    );

    const engagementRate = totalInteractions > 0 ? (recentInteractions30d / totalInteractions) * 100 : 0;

    return {
      contactId,
      degree,
      totalInteractions,
      recentInteractions30d,
      recencyScore,
      relationshipStrength,
      engagementRate,
    };
  }

  private static calculateRecencyScore(interactions: any[]): number {
    if (interactions.length === 0) return 0;

    const now = Date.now();
    let weightedSum = 0;
    let totalWeight = 0;

    for (const interaction of interactions) {
      const occurredAt = new Date(interaction.occurred_at).getTime();
      const daysSince = (now - occurredAt) / (1000 * 60 * 60 * 24);

      const weight = Math.exp(-daysSince / 30);

      weightedSum += weight * (interaction.engagement_score || 5);
      totalWeight += weight;
    }

    return totalWeight > 0 ? Math.min((weightedSum / totalWeight) * 10, 100) : 0;
  }

  private static calculateRelationshipStrength(
    degree: number,
    totalInteractions: number,
    recentInteractions: number,
    recencyScore: number
  ): number {
    const degreeScore = Math.min((degree / 10) * 20, 20);
    const totalInteractionsScore = Math.min((totalInteractions / 20) * 30, 30);
    const recentInteractionsScore = Math.min((recentInteractions / 5) * 30, 30);
    const recencyWeight = Math.min(recencyScore * 0.2, 20);

    return Math.min(degreeScore + totalInteractionsScore + recentInteractionsScore + recencyWeight, 100);
  }

  private static async computeGraphMetrics(userId: string): Promise<GraphSummary> {
    const { count: totalContacts } = await supabase
      .from('social_contacts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { count: totalEdges } = await supabase
      .from('social_edges')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { count: totalInteractions } = await supabase
      .from('social_interactions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { data: contacts } = await supabase
      .from('social_contacts')
      .select('platform, last_interaction_at, is_prospect')
      .eq('user_id', userId);

    const platformBreakdown: Record<string, number> = {};
    let interactionsLast30Days = 0;
    let prospectsWithSocialContext = 0;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    for (const contact of contacts || []) {
      platformBreakdown[contact.platform] = (platformBreakdown[contact.platform] || 0) + 1;

      if (contact.last_interaction_at && new Date(contact.last_interaction_at) >= thirtyDaysAgo) {
        interactionsLast30Days++;
      }

      if (contact.is_prospect) {
        prospectsWithSocialContext++;
      }
    }

    const averageDegree = totalContacts && totalEdges ? (totalEdges * 2) / totalContacts : 0;

    return {
      totalContacts: totalContacts || 0,
      totalEdges: totalEdges || 0,
      totalInteractions: totalInteractions || 0,
      averageDegree,
      platformBreakdown,
      interactionsLast30Days,
      prospectsWithSocialContext,
    };
  }

  private static async storeGraphMetrics(userId: string, summary: GraphSummary): Promise<void> {
    const { data: existing } = await supabase
      .from('social_graph_metrics')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('social_graph_metrics')
        .update({
          total_contacts: summary.totalContacts,
          total_edges: summary.totalEdges,
          total_interactions: summary.totalInteractions,
          contacts_with_recent_interaction_30d: summary.interactionsLast30Days,
          prospects_with_social_context: summary.prospectsWithSocialContext,
          average_degree: summary.averageDegree,
          platform_breakdown: summary.platformBreakdown,
          last_built_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      await supabase.from('social_graph_metrics').insert({
        user_id: userId,
        total_contacts: summary.totalContacts,
        total_edges: summary.totalEdges,
        total_interactions: summary.totalInteractions,
        contacts_with_recent_interaction_30d: summary.interactionsLast30Days,
        prospects_with_social_context: summary.prospectsWithSocialContext,
        average_degree: summary.averageDegree,
        platform_breakdown: summary.platformBreakdown,
        last_built_at: new Date().toISOString(),
      });
    }
  }

  static async getGraphSummary(userId: string): Promise<GraphSummary | null> {
    const { data } = await supabase
      .from('social_graph_metrics')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!data) return null;

    return {
      totalContacts: data.total_contacts,
      totalEdges: data.total_edges,
      totalInteractions: data.total_interactions,
      averageDegree: data.average_degree,
      platformBreakdown: data.platform_breakdown,
      interactionsLast30Days: data.contacts_with_recent_interaction_30d,
      prospectsWithSocialContext: data.prospects_with_social_context,
    };
  }

  static async getTopContacts(userId: string, limit: number = 10): Promise<TopContact[]> {
    const { data: features } = await supabase
      .from('social_contact_features')
      .select('contact_id, relationship_strength, total_interactions, recent_interactions_30d')
      .eq('user_id', userId)
      .order('relationship_strength', { ascending: false })
      .limit(limit);

    if (!features) return [];

    const topContacts: TopContact[] = [];

    for (const feature of features) {
      const { data: contact } = await supabase
        .from('social_contacts')
        .select('id, full_name, platform, last_interaction_at, mutual_friends_estimate, is_prospect')
        .eq('id', feature.contact_id)
        .single();

      if (contact) {
        topContacts.push({
          id: contact.id,
          fullName: contact.full_name,
          platform: contact.platform,
          relationshipStrength: feature.relationship_strength,
          totalInteractions: feature.total_interactions,
          recentInteractions30d: feature.recent_interactions_30d,
          lastInteractionAt: contact.last_interaction_at,
          mutualFriends: contact.mutual_friends_estimate,
          isProspect: contact.is_prospect,
        });
      }
    }

    return topContacts;
  }

  static async enrichProspectFromSocialGraph(userId: string, prospectId: string): Promise<void> {
    const { data: prospect } = await supabase
      .from('scan_processed_items')
      .select('name, metadata')
      .eq('id', prospectId)
      .single();

    if (!prospect) return;

    const { data: contact } = await supabase
      .from('social_contacts')
      .select('id')
      .eq('user_id', userId)
      .eq('full_name', prospect.name)
      .maybeSingle();

    if (contact) {
      await supabase
        .from('social_contacts')
        .update({ is_prospect: true, prospect_id: prospectId })
        .eq('id', contact.id);

      const { data: features } = await supabase
        .from('social_contact_features')
        .select('*')
        .eq('contact_id', contact.id)
        .maybeSingle();

      if (features) {
        await supabase
          .from('scan_processed_items')
          .update({
            metadata: {
              ...prospect.metadata,
              social_relationship_score: features.relationship_strength,
              social_trust_signal: features.recency_score,
              total_interactions: features.total_interactions,
              recent_interactions_30d: features.recent_interactions_30d,
            },
          })
          .eq('id', prospectId);
      }
    }
  }
}
