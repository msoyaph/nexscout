import { supabase } from '../lib/supabase';
import { MergedCompanyData } from './companyMultiSiteCrawler';

export interface GraphNode {
  id: string;
  type: string;
  label: string;
  properties: any;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationship: string;
  properties?: any;
}

export interface KnowledgeGraphInsights {
  positioning_summary: string;
  top_unique_selling_points: string[];
  objection_map: { [key: string]: string[] };
  benefit_chains: Array<{ pain: string; solution: string; benefit: string }>;
}

export interface CompanyKnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  insights: KnowledgeGraphInsights;
}

export class CompanyKnowledgeGraphBuilder {
  buildKnowledgeGraph(companyData: MergedCompanyData): CompanyKnowledgeGraph {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    const companyNode: GraphNode = {
      id: 'company',
      type: 'company',
      label: companyData.displayName,
      properties: {
        description: companyData.description,
        industry: companyData.industry,
        mission: companyData.mission,
        brandTone: companyData.brandTone,
      },
    };
    nodes.push(companyNode);

    companyData.products.forEach((product, i) => {
      const productNode: GraphNode = {
        id: `product_${i}`,
        type: 'product',
        label: product.name,
        properties: { description: product.description },
      };
      nodes.push(productNode);

      edges.push({
        id: `company_has_product_${i}`,
        source: 'company',
        target: `product_${i}`,
        relationship: 'has_product',
      });
    });

    companyData.services.forEach((service, i) => {
      const serviceNode: GraphNode = {
        id: `service_${i}`,
        type: 'service',
        label: service.name,
        properties: { description: service.description },
      };
      nodes.push(serviceNode);

      edges.push({
        id: `company_offers_service_${i}`,
        source: 'company',
        target: `service_${i}`,
        relationship: 'offers_service',
      });
    });

    companyData.uniqueSellingPoints.forEach((usp, i) => {
      const uspNode: GraphNode = {
        id: `usp_${i}`,
        type: 'benefit',
        label: usp,
        properties: {},
      };
      nodes.push(uspNode);

      edges.push({
        id: `company_offers_benefit_${i}`,
        source: 'company',
        target: `usp_${i}`,
        relationship: 'offers_benefit',
      });
    });

    companyData.painPoints.forEach((pain, i) => {
      const painNode: GraphNode = {
        id: `pain_${i}`,
        type: 'pain_point',
        label: pain,
        properties: {},
      };
      nodes.push(painNode);

      edges.push({
        id: `company_solves_pain_${i}`,
        source: 'company',
        target: `pain_${i}`,
        relationship: 'solves_pain_point',
      });
    });

    companyData.targetAudience.forEach((audience, i) => {
      const audienceNode: GraphNode = {
        id: `audience_${i}`,
        type: 'target_audience',
        label: audience,
        properties: {},
      };
      nodes.push(audienceNode);

      edges.push({
        id: `company_targets_${i}`,
        source: 'company',
        target: `audience_${i}`,
        relationship: 'targets_audience',
      });
    });

    companyData.socialProof.forEach((proof, i) => {
      const proofNode: GraphNode = {
        id: `proof_${i}`,
        type: 'testimonial',
        label: proof.text.slice(0, 50),
        properties: { fullText: proof.text, rating: proof.rating, type: proof.type },
      };
      nodes.push(proofNode);

      edges.push({
        id: `company_has_proof_${i}`,
        source: 'company',
        target: `proof_${i}`,
        relationship: 'has_social_proof',
      });
    });

    companyData.callsToAction.forEach((cta, i) => {
      const ctaNode: GraphNode = {
        id: `cta_${i}`,
        type: 'call_to_action',
        label: cta,
        properties: {},
      };
      nodes.push(ctaNode);

      edges.push({
        id: `company_uses_cta_${i}`,
        source: 'company',
        target: `cta_${i}`,
        relationship: 'uses_cta',
      });
    });

    Object.entries(companyData.channels).forEach(([platform, url], i) => {
      if (url) {
        const channelNode: GraphNode = {
          id: `channel_${platform}`,
          type: 'channel',
          label: platform,
          properties: { url },
        };
        nodes.push(channelNode);

        edges.push({
          id: `company_uses_channel_${platform}`,
          source: 'company',
          target: `channel_${platform}`,
          relationship: 'uses_channel',
        });
      }
    });

    const insights = this.generateInsights(companyData, nodes, edges);

    return { nodes, edges, insights };
  }

  private generateInsights(
    companyData: MergedCompanyData,
    nodes: GraphNode[],
    edges: GraphEdge[]
  ): KnowledgeGraphInsights {
    const positioning_summary = companyData.positioning || companyData.description.slice(0, 200);

    const top_unique_selling_points = companyData.uniqueSellingPoints.slice(0, 5);

    const objection_map: { [key: string]: string[] } = {
      'too_expensive': top_unique_selling_points.filter(usp =>
        usp.toLowerCase().includes('value') ||
        usp.toLowerCase().includes('affordable') ||
        usp.toLowerCase().includes('roi')
      ),
      'not_sure_if_right_fit': companyData.targetAudience,
      'need_more_info': companyData.callsToAction,
    };

    const benefit_chains: Array<{ pain: string; solution: string; benefit: string }> = [];

    companyData.painPoints.slice(0, 3).forEach((pain, i) => {
      benefit_chains.push({
        pain,
        solution: companyData.products[i]?.name || companyData.services[i]?.name || 'Our solution',
        benefit: companyData.uniqueSellingPoints[i] || 'Improved outcomes',
      });
    });

    return {
      positioning_summary,
      top_unique_selling_points,
      objection_map,
      benefit_chains,
    };
  }

  async saveKnowledgeGraph(companyId: string, graph: CompanyKnowledgeGraph): Promise<void> {
    const { data: existing } = await supabase
      .from('company_knowledge_graphs')
      .select('id, graph_version')
      .eq('company_id', companyId)
      .order('graph_version', { ascending: false })
      .limit(1)
      .maybeSingle();

    const version = existing ? (existing.graph_version || 1) + 1 : 1;

    await supabase.from('company_knowledge_graphs').insert({
      company_id: companyId,
      graph_version: version,
      nodes: graph.nodes,
      edges: graph.edges,
      insights: graph.insights,
      positioning_summary: graph.insights.positioning_summary,
      unique_selling_points: graph.insights.top_unique_selling_points,
      objection_map: graph.insights.objection_map,
      benefit_chains: graph.insights.benefit_chains,
      target_audiences: graph.nodes.filter(n => n.type === 'target_audience').map(n => n.label),
      pain_points: graph.nodes.filter(n => n.type === 'pain_point').map(n => n.label),
    });
  }

  async getKnowledgeGraph(companyId: string): Promise<CompanyKnowledgeGraph | null> {
    const { data, error } = await supabase
      .from('company_knowledge_graphs')
      .select('nodes, edges, insights')
      .eq('company_id', companyId)
      .order('graph_version', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;

    return {
      nodes: data.nodes as GraphNode[],
      edges: data.edges as GraphEdge[],
      insights: data.insights as KnowledgeGraphInsights,
    };
  }

  async searchGraph(companyId: string, query: string): Promise<GraphNode[]> {
    const graph = await this.getKnowledgeGraph(companyId);
    if (!graph) return [];

    const queryLower = query.toLowerCase();
    return graph.nodes.filter(
      node =>
        node.label.toLowerCase().includes(queryLower) ||
        JSON.stringify(node.properties).toLowerCase().includes(queryLower)
    );
  }

  getNodesByType(graph: CompanyKnowledgeGraph, type: string): GraphNode[] {
    return graph.nodes.filter(node => node.type === type);
  }

  getConnectedNodes(graph: CompanyKnowledgeGraph, nodeId: string): GraphNode[] {
    const connectedIds = graph.edges
      .filter(edge => edge.source === nodeId || edge.target === nodeId)
      .map(edge => (edge.source === nodeId ? edge.target : edge.source));

    return graph.nodes.filter(node => connectedIds.includes(node.id));
  }
}

export const companyKnowledgeGraphBuilder = new CompanyKnowledgeGraphBuilder();
