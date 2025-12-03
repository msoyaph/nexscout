import { supabase } from '../../../lib/supabase';

interface ResolvedData {
  company: any | null;
  products: any[];
  services: any[];
  variants: any[];
  metadata: {
    sources: {
      company: 'user' | 'team' | 'enterprise' | 'system' | 'none';
      products: 'user' | 'team' | 'enterprise' | 'system' | 'none';
      services: 'user' | 'team' | 'enterprise' | 'system' | 'none';
    };
    priorities: {
      company: number;
      products: number;
      services: number;
    };
    cache_status: 'hit' | 'miss' | 'partial';
  };
}

interface UserContext {
  userId: string;
  teamId?: string;
  enterpriseId?: string;
}

const PRIORITY_SCORES = {
  user: 300,
  team: 200,
  enterprise: 100,
  system: 50
};

async function loadUserOverrides(userId: string): Promise<{
  company: any | null;
  products: any[];
  services: any[];
}> {
  try {
    const [companyResult, productsResult, servicesResult] = await Promise.all([
      supabase
        .from('company_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(),

      supabase
        .from('admin_products')
        .select('*')
        .eq('owner_type', 'system')
        .eq('owner_id', userId),

      supabase
        .from('admin_services')
        .select('*')
        .eq('owner_type', 'system')
        .eq('owner_id', userId)
    ]);

    return {
      company: companyResult.data,
      products: productsResult.data || [],
      services: servicesResult.data || []
    };
  } catch (error) {
    console.error('Error loading user overrides:', error);
    return { company: null, products: [], services: [] };
  }
}

async function loadTeamData(teamId: string): Promise<{
  company: any | null;
  products: any[];
  services: any[];
}> {
  try {
    const [companyResult, productsResult, servicesResult] = await Promise.all([
      supabase
        .from('admin_companies')
        .select('*')
        .eq('owner_type', 'team')
        .eq('owner_id', teamId)
        .maybeSingle(),

      supabase
        .from('admin_products')
        .select('*')
        .eq('owner_type', 'team')
        .eq('owner_id', teamId),

      supabase
        .from('admin_services')
        .select('*')
        .eq('owner_type', 'team')
        .eq('owner_id', teamId)
    ]);

    return {
      company: companyResult.data,
      products: productsResult.data || [],
      services: servicesResult.data || []
    };
  } catch (error) {
    console.error('Error loading team data:', error);
    return { company: null, products: [], services: [] };
  }
}

async function loadEnterpriseData(enterpriseId: string): Promise<{
  company: any | null;
  products: any[];
  services: any[];
}> {
  try {
    const [companyResult, productsResult, servicesResult] = await Promise.all([
      supabase
        .from('admin_companies')
        .select('*')
        .eq('owner_type', 'enterprise')
        .eq('owner_id', enterpriseId)
        .maybeSingle(),

      supabase
        .from('admin_products')
        .select('*')
        .eq('owner_type', 'enterprise')
        .eq('owner_id', enterpriseId),

      supabase
        .from('admin_services')
        .select('*')
        .eq('owner_type', 'enterprise')
        .eq('owner_id', enterpriseId)
    ]);

    return {
      company: companyResult.data,
      products: productsResult.data || [],
      services: servicesResult.data || []
    };
  } catch (error) {
    console.error('Error loading enterprise data:', error);
    return { company: null, products: [], services: [] };
  }
}

async function loadSystemMasterData(): Promise<{
  company: any | null;
  products: any[];
  services: any[];
}> {
  try {
    const [companyResult, productsResult, servicesResult] = await Promise.all([
      supabase
        .from('admin_companies')
        .select('*')
        .eq('owner_type', 'system')
        .is('owner_id', null)
        .limit(1)
        .maybeSingle(),

      supabase
        .from('admin_products')
        .select('*')
        .eq('owner_type', 'system')
        .is('owner_id', null),

      supabase
        .from('admin_services')
        .select('*')
        .eq('owner_type', 'system')
        .is('owner_id', null)
    ]);

    return {
      company: companyResult.data,
      products: productsResult.data || [],
      services: servicesResult.data || []
    };
  } catch (error) {
    console.error('Error loading system master data:', error);
    return { company: null, products: [], services: [] };
  }
}

async function loadVariantsForProducts(productIds: string[]): Promise<any[]> {
  if (productIds.length === 0) return [];

  try {
    const { data, error } = await supabase
      .from('product_variants')
      .select('*')
      .in('product_id', productIds);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error loading product variants:', error);
    return [];
  }
}

export const dataSyncEngine = {
  async resolveData(context: UserContext): Promise<ResolvedData> {
    const { userId, teamId, enterpriseId } = context;

    const [userData, teamData, enterpriseData, systemData] = await Promise.all([
      loadUserOverrides(userId),
      teamId ? loadTeamData(teamId) : Promise.resolve({ company: null, products: [], services: [] }),
      enterpriseId ? loadEnterpriseData(enterpriseId) : Promise.resolve({ company: null, products: [], services: [] }),
      loadSystemMasterData()
    ]);

    let selectedCompany: any | null = null;
    let companySource: 'user' | 'team' | 'enterprise' | 'system' | 'none' = 'none';
    let companyPriority = 0;

    if (userData.company) {
      selectedCompany = userData.company;
      companySource = 'user';
      companyPriority = PRIORITY_SCORES.user;
    } else if (teamData.company) {
      selectedCompany = teamData.company;
      companySource = 'team';
      companyPriority = PRIORITY_SCORES.team;
    } else if (enterpriseData.company) {
      selectedCompany = enterpriseData.company;
      companySource = 'enterprise';
      companyPriority = PRIORITY_SCORES.enterprise;
    } else if (systemData.company) {
      selectedCompany = systemData.company;
      companySource = 'system';
      companyPriority = PRIORITY_SCORES.system;
    }

    let selectedProducts: any[] = [];
    let productsSource: 'user' | 'team' | 'enterprise' | 'system' | 'none' = 'none';
    let productsPriority = 0;

    if (userData.products.length > 0) {
      selectedProducts = userData.products;
      productsSource = 'user';
      productsPriority = PRIORITY_SCORES.user;
    } else if (teamData.products.length > 0) {
      selectedProducts = teamData.products;
      productsSource = 'team';
      productsPriority = PRIORITY_SCORES.team;
    } else if (enterpriseData.products.length > 0) {
      selectedProducts = enterpriseData.products;
      productsSource = 'enterprise';
      productsPriority = PRIORITY_SCORES.enterprise;
    } else if (systemData.products.length > 0) {
      selectedProducts = systemData.products;
      productsSource = 'system';
      productsPriority = PRIORITY_SCORES.system;
    }

    let selectedServices: any[] = [];
    let servicesSource: 'user' | 'team' | 'enterprise' | 'system' | 'none' = 'none';
    let servicesPriority = 0;

    if (userData.services.length > 0) {
      selectedServices = userData.services;
      servicesSource = 'user';
      servicesPriority = PRIORITY_SCORES.user;
    } else if (teamData.services.length > 0) {
      selectedServices = teamData.services;
      servicesSource = 'team';
      servicesPriority = PRIORITY_SCORES.team;
    } else if (enterpriseData.services.length > 0) {
      selectedServices = enterpriseData.services;
      servicesSource = 'enterprise';
      servicesPriority = PRIORITY_SCORES.enterprise;
    } else if (systemData.services.length > 0) {
      selectedServices = systemData.services;
      servicesSource = 'system';
      servicesPriority = PRIORITY_SCORES.system;
    }

    const productIds = selectedProducts.map(p => p.id);
    const variants = await loadVariantsForProducts(productIds);

    const cacheStatus: 'hit' | 'miss' | 'partial' =
      (selectedCompany && selectedProducts.length > 0) ? 'hit' :
      (selectedCompany || selectedProducts.length > 0) ? 'partial' : 'miss';

    return {
      company: selectedCompany,
      products: selectedProducts,
      services: selectedServices,
      variants,
      metadata: {
        sources: {
          company: companySource,
          products: productsSource,
          services: servicesSource
        },
        priorities: {
          company: companyPriority,
          products: productsPriority,
          services: servicesPriority
        },
        cache_status: cacheStatus
      }
    };
  },

  async resolveDataForUser(userId: string): Promise<ResolvedData> {
    try {
      const { data: teamMembership } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', userId)
        .maybeSingle();

      return this.resolveData({
        userId,
        teamId: teamMembership?.team_id
      });
    } catch (error) {
      console.error('Error resolving data for user:', error);
      return this.resolveData({ userId });
    }
  },

  async getEffectiveCompany(userId: string): Promise<{ data: any | null; source: string; priority: number }> {
    const resolved = await this.resolveDataForUser(userId);

    return {
      data: resolved.company,
      source: resolved.metadata.sources.company,
      priority: resolved.metadata.priorities.company
    };
  },

  async getEffectiveProducts(userId: string): Promise<{ data: any[]; source: string; priority: number }> {
    const resolved = await this.resolveDataForUser(userId);

    return {
      data: resolved.products,
      source: resolved.metadata.sources.products,
      priority: resolved.metadata.priorities.products
    };
  },

  async getEffectiveServices(userId: string): Promise<{ data: any[]; source: string; priority: number }> {
    const resolved = await this.resolveDataForUser(userId);

    return {
      data: resolved.services,
      source: resolved.metadata.sources.services,
      priority: resolved.metadata.priorities.services
    };
  },

  async getFullContext(userId: string): Promise<{
    company: any | null;
    products: any[];
    services: any[];
    variants: any[];
    dataSource: {
      company: string;
      products: string;
      services: string;
    };
  }> {
    const resolved = await this.resolveDataForUser(userId);

    return {
      company: resolved.company,
      products: resolved.products,
      services: resolved.services,
      variants: resolved.variants,
      dataSource: {
        company: resolved.metadata.sources.company,
        products: resolved.metadata.sources.products,
        services: resolved.metadata.sources.services
      }
    };
  },

  async syncUserData(userId: string, data: {
    company?: any;
    products?: any[];
    services?: any[];
  }): Promise<{ success: boolean; error?: string }> {
    try {
      if (data.company) {
        const { error: companyError } = await supabase
          .from('company_profiles')
          .upsert({
            user_id: userId,
            ...data.company,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });

        if (companyError) throw companyError;
      }

      if (data.products && data.products.length > 0) {
        const productsWithOwner = data.products.map(p => ({
          ...p,
          owner_type: 'system' as const,
          owner_id: userId
        }));

        const { error: productsError } = await supabase
          .from('admin_products')
          .upsert(productsWithOwner);

        if (productsError) throw productsError;
      }

      if (data.services && data.services.length > 0) {
        const servicesWithOwner = data.services.map(s => ({
          ...s,
          owner_type: 'system' as const,
          owner_id: userId
        }));

        const { error: servicesError } = await supabase
          .from('admin_services')
          .upsert(servicesWithOwner);

        if (servicesError) throw servicesError;
      }

      return { success: true };
    } catch (error) {
      console.error('Error syncing user data:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  getPriorityLevel(source: 'user' | 'team' | 'enterprise' | 'system'): number {
    return PRIORITY_SCORES[source];
  },

  getSummary(resolved: ResolvedData): string {
    return `
Data Resolution Summary:
- Company: ${resolved.company ? '✓' : '✗'} (Source: ${resolved.metadata.sources.company}, Priority: ${resolved.metadata.priorities.company})
- Products: ${resolved.products.length} (Source: ${resolved.metadata.sources.products}, Priority: ${resolved.metadata.priorities.products})
- Services: ${resolved.services.length} (Source: ${resolved.metadata.sources.services}, Priority: ${resolved.metadata.priorities.services})
- Variants: ${resolved.variants.length}
- Cache Status: ${resolved.metadata.cache_status}
    `.trim();
  }
};
