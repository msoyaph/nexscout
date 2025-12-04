import { supabase } from '../../../lib/supabase';

interface Node {
  id: string;
  type: string;
  label: string;
  properties: Record<string, any>;
  edges: Edge[];
}

interface Edge {
  type: string;
  target: string;
  properties?: Record<string, any>;
}

interface KnowledgeGraph {
  id: string;
  name: string;
  owner_type: string;
  owner_id?: string;
  version: number;
  nodes: Node[];
  edges: Edge[];
  metadata: {
    node_count: number;
    edge_count: number;
    created_at: string;
    entity_types: string[];
  };
}

function createNode(type: string, entity: any): Node {
  return {
    id: entity.id || `${type}_${Date.now()}`,
    type,
    label: entity.name || entity.variant_name || entity.service_name || 'Untitled',
    properties: { ...entity },
    edges: []
  };
}

function createEdge(type: string, target: string, properties?: Record<string, any>): Edge {
  return {
    type,
    target,
    properties
  };
}

export const knowledgeGraphEngine = {
  build(company: any, products: any[] = [], services: any[] = [], variants: any[] = []): KnowledgeGraph {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const companyNode = createNode('company', company);
    nodes.push(companyNode);

    for (const product of products) {
      const productNode = createNode('product', product);

      productNode.edges.push(createEdge('belongs_to', companyNode.id));
      edges.push({ type: 'belongs_to', target: companyNode.id });

      if (product.category) {
        const categoryNode: Node = {
          id: `category_${product.category}`,
          type: 'category',
          label: product.category,
          properties: { name: product.category },
          edges: []
        };

        const existingCategory = nodes.find(n => n.id === categoryNode.id);
        if (!existingCategory) {
          nodes.push(categoryNode);
        }

        productNode.edges.push(createEdge('in_category', categoryNode.id));
        edges.push({ type: 'in_category', target: categoryNode.id });
      }

      const productVariants = variants.filter(v => v.product_id === product.id);
      for (const variant of productVariants) {
        const variantNode = createNode('variant', variant);

        variantNode.edges.push(createEdge('variant_of', productNode.id));
        edges.push({ type: 'variant_of', target: productNode.id });

        if (variant.benefits && Array.isArray(variant.benefits)) {
          for (const benefit of variant.benefits) {
            const benefitNode: Node = {
              id: `benefit_${benefit.toLowerCase().replace(/\s+/g, '_')}`,
              type: 'benefit',
              label: benefit,
              properties: { value: benefit },
              edges: []
            };

            const existingBenefit = nodes.find(n => n.id === benefitNode.id);
            if (!existingBenefit) {
              nodes.push(benefitNode);
            }

            variantNode.edges.push(createEdge('provides_benefit', benefitNode.id));
            edges.push({ type: 'provides_benefit', target: benefitNode.id });
          }
        }

        nodes.push(variantNode);
      }

      if (product.pain_points_solved && Array.isArray(product.pain_points_solved)) {
        for (const painPoint of product.pain_points_solved) {
          const painNode: Node = {
            id: `pain_point_${painPoint.toLowerCase().replace(/\s+/g, '_')}`,
            type: 'pain_point',
            label: painPoint,
            properties: { value: painPoint },
            edges: []
          };

          const existingPain = nodes.find(n => n.id === painNode.id);
          if (!existingPain) {
            nodes.push(painNode);
          }

          productNode.edges.push(createEdge('solves', painNode.id));
          edges.push({ type: 'solves', target: painNode.id });
        }
      }

      if (product.target_personas && Array.isArray(product.target_personas)) {
        for (const persona of product.target_personas) {
          const personaNode: Node = {
            id: `persona_${persona.toLowerCase().replace(/\s+/g, '_')}`,
            type: 'persona',
            label: persona,
            properties: { name: persona },
            edges: []
          };

          const existingPersona = nodes.find(n => n.id === personaNode.id);
          if (!existingPersona) {
            nodes.push(personaNode);
          }

          productNode.edges.push(createEdge('targets', personaNode.id));
          edges.push({ type: 'targets', target: personaNode.id });
        }
      }

      nodes.push(productNode);
    }

    for (const service of services) {
      const serviceNode = createNode('service', service);

      serviceNode.edges.push(createEdge('offered_by', companyNode.id));
      edges.push({ type: 'offered_by', target: companyNode.id });

      if (service.benefits && Array.isArray(service.benefits)) {
        for (const benefit of service.benefits) {
          const benefitNode: Node = {
            id: `benefit_${benefit.toLowerCase().replace(/\s+/g, '_')}`,
            type: 'benefit',
            label: benefit,
            properties: { value: benefit },
            edges: []
          };

          const existingBenefit = nodes.find(n => n.id === benefitNode.id);
          if (!existingBenefit) {
            nodes.push(benefitNode);
          }

          serviceNode.edges.push(createEdge('provides_benefit', benefitNode.id));
          edges.push({ type: 'provides_benefit', target: benefitNode.id });
        }
      }

      nodes.push(serviceNode);
    }

    const entityTypes = [...new Set(nodes.map(n => n.type))];

    return {
      id: company.id || 'graph_' + Date.now(),
      name: company.name || 'Knowledge Graph',
      owner_type: company.owner_type || 'system',
      owner_id: company.owner_id,
      version: 1,
      nodes,
      edges,
      metadata: {
        node_count: nodes.length,
        edge_count: edges.length,
        created_at: new Date().toISOString(),
        entity_types: entityTypes
      }
    };
  },

  async save(graph: KnowledgeGraph): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('knowledge_graph_snapshots')
        .insert({
          owner_type: graph.owner_type,
          owner_id: graph.owner_id,
          version: graph.version,
          graph_data: {
            nodes: graph.nodes,
            edges: graph.edges
          },
          node_count: graph.metadata.node_count,
          edge_count: graph.metadata.edge_count,
          metadata: graph.metadata,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, id: data.id };
    } catch (error) {
      console.error('Error saving knowledge graph:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  async load(ownerId: string, ownerType: string = 'system'): Promise<KnowledgeGraph | null> {
    try {
      const { data, error } = await supabase
        .from('knowledge_graph_snapshots')
        .select('*')
        .eq('owner_type', ownerType)
        .eq('owner_id', ownerId)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        name: data.metadata?.name || 'Knowledge Graph',
        owner_type: data.owner_type,
        owner_id: data.owner_id,
        version: data.version,
        nodes: data.graph_data?.nodes || [],
        edges: data.graph_data?.edges || [],
        metadata: data.metadata
      };
    } catch (error) {
      console.error('Error loading knowledge graph:', error);
      return null;
    }
  },

  async buildAndSave(
    company: any,
    products: any[] = [],
    services: any[] = [],
    variants: any[] = []
  ): Promise<{ success: boolean; graph?: KnowledgeGraph; error?: string }> {
    try {
      const graph = this.build(company, products, services, variants);
      const saveResult = await this.save(graph);

      if (!saveResult.success) {
        return { success: false, error: saveResult.error };
      }

      return { success: true, graph };
    } catch (error) {
      console.error('Error building and saving graph:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  query(graph: KnowledgeGraph, query: { type?: string; properties?: Record<string, any> }): Node[] {
    let results = graph.nodes;

    if (query.type) {
      results = results.filter(node => node.type === query.type);
    }

    if (query.properties) {
      results = results.filter(node => {
        return Object.entries(query.properties).every(([key, value]) => {
          return node.properties[key] === value;
        });
      });
    }

    return results;
  },

  findConnected(graph: KnowledgeGraph, nodeId: string, edgeType?: string): Node[] {
    const node = graph.nodes.find(n => n.id === nodeId);
    if (!node) return [];

    const targetIds = node.edges
      .filter(edge => !edgeType || edge.type === edgeType)
      .map(edge => edge.target);

    return graph.nodes.filter(n => targetIds.includes(n.id));
  },

  getProductsForPersona(graph: KnowledgeGraph, persona: string): Node[] {
    const personaNode = graph.nodes.find(
      n => n.type === 'persona' && n.label.toLowerCase() === persona.toLowerCase()
    );

    if (!personaNode) return [];

    const productIds = graph.edges
      .filter(e => e.type === 'targets' && e.target === personaNode.id)
      .map(e => {
        const edge = graph.nodes.find(n => n.edges.some(ed => ed.target === personaNode.id));
        return edge?.id;
      })
      .filter(Boolean);

    return graph.nodes.filter(n => productIds.includes(n.id));
  },

  getProductsForPainPoint(graph: KnowledgeGraph, painPoint: string): Node[] {
    const painNode = graph.nodes.find(
      n => n.type === 'pain_point' && n.label.toLowerCase().includes(painPoint.toLowerCase())
    );

    if (!painNode) return [];

    const productIds = graph.edges
      .filter(e => e.type === 'solves' && e.target === painNode.id)
      .map(e => {
        const edge = graph.nodes.find(n => n.edges.some(ed => ed.target === painNode.id));
        return edge?.id;
      })
      .filter(Boolean);

    return graph.nodes.filter(n => productIds.includes(n.id));
  },

  generateSummary(graph: KnowledgeGraph): string {
    const productCount = graph.nodes.filter(n => n.type === 'product').length;
    const serviceCount = graph.nodes.filter(n => n.type === 'service').length;
    const variantCount = graph.nodes.filter(n => n.type === 'variant').length;
    const personaCount = graph.nodes.filter(n => n.type === 'persona').length;
    const painPointCount = graph.nodes.filter(n => n.type === 'pain_point').length;

    return `
Knowledge Graph Summary:
- ${productCount} products
- ${serviceCount} services
- ${variantCount} variants
- ${personaCount} target personas
- ${painPointCount} pain points addressed
- ${graph.metadata.node_count} total entities
- ${graph.metadata.edge_count} relationships
    `.trim();
  }
};
