import { supabase } from '../../lib/supabase';

export interface PersonNode {
  id: string;
  name: string;
  platform: string;
  platformUrl?: string;
  lastSeen: string;
  interactionCount: number;
  sentiment: number;
  opportunitySignals: string[];
  painPoints: string[];
  clusterId?: string;
  centralityScore?: number;
  influenceScore?: number;
  metadata?: Record<string, any>;
}

export interface RelationshipEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  weight: number;
  type: 'like' | 'comment' | 'reply' | 'mutual' | 'follower' | 'tag' | 'group';
  recencyScore: number;
  firstSeen: string;
  lastSeen: string;
  metadata?: Record<string, any>;
}

export interface SocialGraphResult {
  success: boolean;
  nodes: PersonNode[];
  edges: RelationshipEdge[];
  clusterInsights: string[];
  topInfluencers: string[];
  weakConnections: string[];
  opportunityClusters: string[];
  recommendations: string[];
  statistics: {
    totalNodes: number;
    totalEdges: number;
    clusters: number;
    avgConnections: number;
    networkDensity: number;
  };
}

export interface GraphBuildInput {
  userId: string;
  captureData?: any[];
  scanResults?: any[];
  existingGraph?: boolean;
}

class SocialGraphBuilder {
  private nodes: Map<string, PersonNode> = new Map();
  private edges: Map<string, RelationshipEdge> = new Map();

  async buildSocialGraph(input: GraphBuildInput): Promise<SocialGraphResult> {
    try {
      if (input.existingGraph) {
        await this.loadExistingGraph(input.userId);
      }

      if (input.captureData) {
        await this.processCaptures(input.captureData);
      }

      if (input.scanResults) {
        await this.processScanResults(input.scanResults);
      }

      await this.calculateMetrics();

      const clusters = this.detectCommunities();
      const influencers = this.identifyInfluencers();
      const weakConnections = this.findWeakConnections();
      const opportunityClusters = this.identifyOpportunityClusters();
      const insights = this.generateInsights();
      const recommendations = this.generateRecommendations();

      const result: SocialGraphResult = {
        success: true,
        nodes: Array.from(this.nodes.values()),
        edges: Array.from(this.edges.values()),
        clusterInsights: insights,
        topInfluencers: influencers,
        weakConnections,
        opportunityClusters,
        recommendations,
        statistics: this.calculateStatistics(),
      };

      await this.saveGraph(input.userId, result);

      return result;
    } catch (error) {
      console.error('Social graph building error:', error);
      return {
        success: false,
        nodes: [],
        edges: [],
        clusterInsights: [],
        topInfluencers: [],
        weakConnections: [],
        opportunityClusters: [],
        recommendations: [],
        statistics: {
          totalNodes: 0,
          totalEdges: 0,
          clusters: 0,
          avgConnections: 0,
          networkDensity: 0,
        },
      };
    }
  }

  private async loadExistingGraph(userId: string): Promise<void> {
    const { data: nodes } = await supabase
      .from('social_graph_nodes')
      .select('*')
      .eq('user_id', userId);

    const { data: edges } = await supabase
      .from('social_graph_edges')
      .select('*')
      .eq('user_id', userId);

    if (nodes) {
      nodes.forEach((node) => {
        this.nodes.set(node.id, {
          id: node.id,
          name: node.name,
          platform: node.platform,
          platformUrl: node.platform_url,
          lastSeen: node.last_seen,
          interactionCount: node.interaction_count,
          sentiment: node.sentiment,
          opportunitySignals: node.opportunity_signals || [],
          painPoints: node.pain_points || [],
          clusterId: node.cluster_id,
          centralityScore: node.centrality_score,
          influenceScore: node.influence_score,
          metadata: node.metadata,
        });
      });
    }

    if (edges) {
      edges.forEach((edge) => {
        this.edges.set(edge.id, {
          id: edge.id,
          fromNodeId: edge.from_node_id,
          toNodeId: edge.to_node_id,
          weight: edge.weight,
          type: edge.type,
          recencyScore: edge.recency_score,
          firstSeen: edge.first_seen,
          lastSeen: edge.last_seen,
          metadata: edge.metadata,
        });
      });
    }
  }

  private async processCaptures(captures: any[]): Promise<void> {
    captures.forEach((capture) => {
      const prospects = capture.prospects || [];

      prospects.forEach((prospect: any) => {
        const nodeId = this.generateNodeId(prospect.fullName, capture.platform);

        if (!this.nodes.has(nodeId)) {
          this.nodes.set(nodeId, {
            id: nodeId,
            name: prospect.fullName,
            platform: capture.platform,
            platformUrl: prospect.platformUrl,
            lastSeen: new Date().toISOString(),
            interactionCount: 1,
            sentiment: 0.5,
            opportunitySignals: prospect.opportunitySignals || [],
            painPoints: prospect.painPointSignals || [],
          });
        } else {
          const node = this.nodes.get(nodeId)!;
          node.interactionCount++;
          node.lastSeen = new Date().toISOString();
          node.opportunitySignals = [
            ...new Set([...node.opportunitySignals, ...(prospect.opportunitySignals || [])]),
          ];
          node.painPoints = [
            ...new Set([...node.painPoints, ...(prospect.painPointSignals || [])]),
          ];
        }

        if (prospect.mutualConnections && prospect.mutualConnections > 0) {
          this.addMutualConnectionEdges(nodeId, prospect.mutualConnections);
        }
      });
    });
  }

  private async processScanResults(scanResults: any[]): Promise<void> {
    scanResults.forEach((result) => {
      const prospects = result.prospects || [];

      prospects.forEach((prospect: any) => {
        const nodeId = this.generateNodeId(prospect.name, 'scan');

        if (!this.nodes.has(nodeId)) {
          this.nodes.set(nodeId, {
            id: nodeId,
            name: prospect.name,
            platform: 'scan',
            lastSeen: new Date().toISOString(),
            interactionCount: 1,
            sentiment: prospect.sentiment || 0.5,
            opportunitySignals: prospect.opportunitySignals || [],
            painPoints: prospect.painPoints || [],
          });
        }
      });
    });
  }

  private addMutualConnectionEdges(nodeId: string, count: number): void {
    const existingNodes = Array.from(this.nodes.keys());
    const randomNodes = existingNodes
      .filter((id) => id !== nodeId)
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(count, 5));

    randomNodes.forEach((targetId) => {
      const edgeId = `${nodeId}_${targetId}`;
      if (!this.edges.has(edgeId)) {
        this.edges.set(edgeId, {
          id: edgeId,
          fromNodeId: nodeId,
          toNodeId: targetId,
          weight: 1,
          type: 'mutual',
          recencyScore: 1.0,
          firstSeen: new Date().toISOString(),
          lastSeen: new Date().toISOString(),
        });
      }
    });
  }

  private async calculateMetrics(): Promise<void> {
    this.calculateCentrality();
    this.calculateInfluence();
    this.calculateRecencyScores();
  }

  private calculateCentrality(): void {
    const degreeMap = new Map<string, number>();

    this.edges.forEach((edge) => {
      degreeMap.set(edge.fromNodeId, (degreeMap.get(edge.fromNodeId) || 0) + 1);
      degreeMap.set(edge.toNodeId, (degreeMap.get(edge.toNodeId) || 0) + 1);
    });

    const maxDegree = Math.max(...Array.from(degreeMap.values()), 1);

    this.nodes.forEach((node, nodeId) => {
      const degree = degreeMap.get(nodeId) || 0;
      node.centralityScore = degree / maxDegree;
    });
  }

  private calculateInfluence(): void {
    const iterations = 10;
    const dampingFactor = 0.85;

    const scores = new Map<string, number>();
    this.nodes.forEach((_, nodeId) => {
      scores.set(nodeId, 1.0);
    });

    for (let i = 0; i < iterations; i++) {
      const newScores = new Map<string, number>();

      this.nodes.forEach((_, nodeId) => {
        let score = (1 - dampingFactor) / this.nodes.size;

        this.edges.forEach((edge) => {
          if (edge.toNodeId === nodeId) {
            const outDegree = Array.from(this.edges.values()).filter(
              (e) => e.fromNodeId === edge.fromNodeId
            ).length;

            if (outDegree > 0) {
              score += dampingFactor * ((scores.get(edge.fromNodeId) || 0) / outDegree);
            }
          }
        });

        newScores.set(nodeId, score);
      });

      scores.clear();
      newScores.forEach((score, nodeId) => scores.set(nodeId, score));
    }

    const maxScore = Math.max(...Array.from(scores.values()), 1);

    this.nodes.forEach((node, nodeId) => {
      node.influenceScore = (scores.get(nodeId) || 0) / maxScore;
    });
  }

  private calculateRecencyScores(): void {
    const now = new Date();

    this.edges.forEach((edge) => {
      const lastSeenDate = new Date(edge.lastSeen);
      const daysDiff = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60 * 60 * 24);
      edge.recencyScore = Math.max(0, 1 - daysDiff / 30);
    });
  }

  private detectCommunities(): string[] {
    const clusters: string[] = [];
    const visited = new Set<string>();
    let clusterId = 0;

    this.nodes.forEach((node, nodeId) => {
      if (!visited.has(nodeId)) {
        const cluster = this.bfsCluster(nodeId, visited);
        cluster.forEach((id) => {
          const n = this.nodes.get(id);
          if (n) n.clusterId = `cluster_${clusterId}`;
        });
        clusters.push(`cluster_${clusterId}`);
        clusterId++;
      }
    });

    return clusters;
  }

  private bfsCluster(startNodeId: string, visited: Set<string>): Set<string> {
    const cluster = new Set<string>();
    const queue: string[] = [startNodeId];

    while (queue.length > 0) {
      const nodeId = queue.shift()!;

      if (visited.has(nodeId)) continue;

      visited.add(nodeId);
      cluster.add(nodeId);

      this.edges.forEach((edge) => {
        if (edge.fromNodeId === nodeId && !visited.has(edge.toNodeId)) {
          queue.push(edge.toNodeId);
        }
        if (edge.toNodeId === nodeId && !visited.has(edge.fromNodeId)) {
          queue.push(edge.fromNodeId);
        }
      });
    }

    return cluster;
  }

  private identifyInfluencers(): string[] {
    const sortedNodes = Array.from(this.nodes.values())
      .filter((node) => node.influenceScore !== undefined)
      .sort((a, b) => (b.influenceScore || 0) - (a.influenceScore || 0))
      .slice(0, 10);

    return sortedNodes.map((node) => node.name);
  }

  private findWeakConnections(): string[] {
    const weakEdges = Array.from(this.edges.values())
      .filter((edge) => edge.weight === 1 && edge.recencyScore > 0.7)
      .slice(0, 10);

    return weakEdges.map((edge) => {
      const fromNode = this.nodes.get(edge.fromNodeId);
      const toNode = this.nodes.get(edge.toNodeId);
      return `${fromNode?.name} ↔ ${toNode?.name}`;
    });
  }

  private identifyOpportunityClusters(): string[] {
    const clusterOpportunities = new Map<string, number>();

    this.nodes.forEach((node) => {
      if (node.clusterId && node.opportunitySignals.length > 0) {
        clusterOpportunities.set(
          node.clusterId,
          (clusterOpportunities.get(node.clusterId) || 0) + node.opportunitySignals.length
        );
      }
    });

    return Array.from(clusterOpportunities.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([clusterId, count]) => `${clusterId}: ${count} opportunities`);
  }

  private generateInsights(): string[] {
    const insights: string[] = [];

    const avgInfluence =
      Array.from(this.nodes.values()).reduce(
        (sum, node) => sum + (node.influenceScore || 0),
        0
      ) / this.nodes.size;

    insights.push(`Network has ${this.nodes.size} people with average influence of ${avgInfluence.toFixed(2)}`);

    const highOpportunityNodes = Array.from(this.nodes.values()).filter(
      (node) => node.opportunitySignals.length > 2
    ).length;

    insights.push(`${highOpportunityNodes} people showing strong opportunity signals`);

    const recentActiveEdges = Array.from(this.edges.values()).filter(
      (edge) => edge.recencyScore > 0.8
    ).length;

    insights.push(`${recentActiveEdges} recent interactions detected in last 7 days`);

    return insights;
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    const highInfluencers = Array.from(this.nodes.values())
      .filter((node) => (node.influenceScore || 0) > 0.7)
      .slice(0, 3);

    if (highInfluencers.length > 0) {
      recommendations.push(
        `Focus on these influencers: ${highInfluencers.map((n) => n.name).join(', ')}`
      );
    }

    const weakTies = Array.from(this.edges.values()).filter(
      (edge) => edge.weight === 1 && edge.recencyScore > 0.6
    );

    if (weakTies.length > 0) {
      recommendations.push(`Strengthen ${weakTies.length} weak connections with follow-up messages`);
    }

    return recommendations;
  }

  private calculateStatistics() {
    const totalNodes = this.nodes.size;
    const totalEdges = this.edges.size;
    const clusters = new Set(
      Array.from(this.nodes.values())
        .map((n) => n.clusterId)
        .filter(Boolean)
    ).size;

    const avgConnections = totalNodes > 0 ? (totalEdges * 2) / totalNodes : 0;
    const maxPossibleEdges = (totalNodes * (totalNodes - 1)) / 2;
    const networkDensity = maxPossibleEdges > 0 ? totalEdges / maxPossibleEdges : 0;

    return {
      totalNodes,
      totalEdges,
      clusters,
      avgConnections,
      networkDensity,
    };
  }

  private async saveGraph(userId: string, result: SocialGraphResult): Promise<void> {
    const nodesToInsert = result.nodes.map((node) => ({
      id: node.id,
      user_id: userId,
      name: node.name,
      platform: node.platform,
      platform_url: node.platformUrl,
      last_seen: node.lastSeen,
      interaction_count: node.interactionCount,
      sentiment: node.sentiment,
      opportunity_signals: node.opportunitySignals,
      pain_points: node.painPoints,
      cluster_id: node.clusterId,
      centrality_score: node.centralityScore,
      influence_score: node.influenceScore,
      metadata: node.metadata,
    }));

    const edgesToInsert = result.edges.map((edge) => ({
      id: edge.id,
      user_id: userId,
      from_node_id: edge.fromNodeId,
      to_node_id: edge.toNodeId,
      weight: edge.weight,
      type: edge.type,
      recency_score: edge.recencyScore,
      first_seen: edge.firstSeen,
      last_seen: edge.lastSeen,
      metadata: edge.metadata,
    }));

    if (nodesToInsert.length > 0) {
      await supabase.from('social_graph_nodes').upsert(nodesToInsert);
    }

    if (edgesToInsert.length > 0) {
      await supabase.from('social_graph_edges').upsert(edgesToInsert);
    }

    await supabase.from('social_graph_insights').insert({
      user_id: userId,
      insights: result.clusterInsights,
      top_influencers: result.topInfluencers,
      weak_connections: result.weakConnections,
      opportunity_clusters: result.opportunityClusters,
      recommendations: result.recommendations,
      statistics: result.statistics,
      created_at: new Date().toISOString(),
    });
  }

  private generateNodeId(name: string, platform: string): string {
    return `${platform}_${name.toLowerCase().replace(/\s+/g, '_')}`;
  }
}

export const socialGraphBuilder = new SocialGraphBuilder();
