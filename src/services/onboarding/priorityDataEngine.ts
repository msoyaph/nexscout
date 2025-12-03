/**
 * Priority Data Engine
 *
 * Fetches master data with priority ordering:
 * 1. User overrides (highest priority)
 * 2. Team data
 * 3. Enterprise data
 * 4. System global data
 *
 * Used by: Chatbot, Pitch Decks, AI Messages, DeepScan
 */

import { supabase } from '../../lib/supabase';

interface PriorityCompany {
  id: string;
  name: string;
  industry: string;
  short_description: string | null;
  brand_voice: string | null;
  owner_type: 'system' | 'enterprise' | 'team';
  owner_id: string | null;
  priority_score: number;
}

interface PriorityProduct {
  id: string;
  name: string;
  short_description: string | null;
  category: string | null;
  key_benefits: string[];
  pain_points_solved: string[];
  owner_type: 'system' | 'enterprise' | 'team';
  priority_score: number;
}

/**
 * Fetch companies with priority ordering
 */
export async function fetchPriorityCompanies(
  searchQuery: string,
  limit = 10
): Promise<PriorityCompany[]> {
  try {
    const { data, error } = await supabase
      .from('admin_companies')
      .select('*')
      .eq('is_active', true)
      .or(`name.ilike.%${searchQuery}%,short_description.ilike.%${searchQuery}%`)
      .limit(limit * 3); // Fetch more to filter later

    if (error) throw error;

    // Score based on owner_type priority
    const scored = (data || []).map((company: any) => ({
      ...company,
      priority_score:
        company.owner_type === 'team' ? 100 :
        company.owner_type === 'enterprise' ? 80 :
        company.owner_type === 'system' ? 60 : 0,
    }));

    // Sort by priority, then by usage count
    scored.sort((a, b) => {
      if (b.priority_score !== a.priority_score) {
        return b.priority_score - a.priority_score;
      }
      return (b.used_by_user_count || 0) - (a.used_by_user_count || 0);
    });

    return scored.slice(0, limit);
  } catch (error) {
    console.error('Error fetching priority companies:', error);
    return [];
  }
}

/**
 * Fetch products with priority ordering
 */
export async function fetchPriorityProducts(
  companyId: string
): Promise<PriorityProduct[]> {
  try {
    const { data, error } = await supabase
      .from('admin_products')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true);

    if (error) throw error;

    // Score and sort
    const scored = (data || []).map((product: any) => ({
      ...product,
      priority_score:
        product.owner_type === 'team' ? 100 :
        product.owner_type === 'enterprise' ? 80 :
        product.owner_type === 'system' ? 60 : 0,
    }));

    scored.sort((a, b) => b.priority_score - a.priority_score);

    return scored;
  } catch (error) {
    console.error('Error fetching priority products:', error);
    return [];
  }
}

/**
 * Get effective data for user (with overrides)
 * Priority: User Override > Team > Enterprise > System
 */
export async function getEffectiveCompanyData(userId: string) {
  try {
    // 1. Check if user has custom company data
    const { data: userCompany, error: userError } = await supabase
      .from('company_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      throw userError;
    }

    // If user has overridden data, use that
    if (userCompany && userCompany.is_overridden) {
      return {
        source: 'user_override',
        priority: 1000,
        data: userCompany,
      };
    }

    // 2. If linked to admin company, fetch with priority
    if (userCompany?.admin_company_id) {
      const { data: adminCompany, error: adminError } = await supabase
        .from('admin_companies')
        .select('*')
        .eq('id', userCompany.admin_company_id)
        .single();

      if (!adminError && adminCompany) {
        return {
          source: adminCompany.owner_type,
          priority:
            adminCompany.owner_type === 'team' ? 100 :
            adminCompany.owner_type === 'enterprise' ? 80 :
            60,
          data: {
            ...userCompany,
            ...adminCompany, // Merge admin data
          },
        };
      }
    }

    // 3. Return user company if exists (even if not linked)
    if (userCompany) {
      return {
        source: 'user_manual',
        priority: 50,
        data: userCompany,
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting effective company data:', error);
    return null;
  }
}

/**
 * Get effective products for user
 */
export async function getEffectiveProducts(userId: string) {
  try {
    // Fetch all user products
    const { data: userProducts, error } = await supabase
      .from('products')
      .select(`
        *,
        product_variants (*)
      `)
      .eq('user_id', userId)
      .eq('active', true);

    if (error) throw error;

    // For each product, determine priority and merge admin data if not overridden
    const effectiveProducts = await Promise.all(
      (userProducts || []).map(async (product: any) => {
        if (product.is_overridden) {
          return {
            source: 'user_override',
            priority: 1000,
            data: product,
          };
        }

        // Fetch admin product if linked
        if (product.admin_product_id) {
          const { data: adminProduct } = await supabase
            .from('admin_products')
            .select('*')
            .eq('id', product.admin_product_id)
            .single();

          if (adminProduct) {
            return {
              source: adminProduct.owner_type,
              priority:
                adminProduct.owner_type === 'team' ? 100 :
                adminProduct.owner_type === 'enterprise' ? 80 :
                60,
              data: {
                ...product,
                ...adminProduct, // Merge admin data
              },
            };
          }
        }

        return {
          source: 'user_manual',
          priority: 50,
          data: product,
        };
      })
    );

    // Sort by priority
    effectiveProducts.sort((a, b) => b.priority - a.priority);

    return effectiveProducts.map(p => p.data);
  } catch (error) {
    console.error('Error getting effective products:', error);
    return [];
  }
}

/**
 * Get all effective data for building chatbot context
 */
export async function getEffectiveChatbotContext(userId: string) {
  try {
    const [company, products] = await Promise.all([
      getEffectiveCompanyData(userId),
      getEffectiveProducts(userId),
    ]);

    // Fetch services and offerings
    const { data: services } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', userId)
      .eq('product_type', 'service')
      .eq('active', true);

    return {
      company: company?.data || null,
      products: products || [],
      services: services || [],
      dataSource: {
        company: company?.source || 'none',
        companyPriority: company?.priority || 0,
      },
    };
  } catch (error) {
    console.error('Error getting chatbot context:', error);
    return {
      company: null,
      products: [],
      services: [],
      dataSource: { company: 'error', companyPriority: 0 },
    };
  }
}

/**
 * Search across all accessible admin data with priority
 */
export async function searchAdminData(
  query: string,
  type: 'companies' | 'products' | 'services' | 'offerings' = 'companies'
) {
  try {
    const table = `admin_${type}`;

    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('is_active', true)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(20);

    if (error) throw error;

    // Score and sort by priority
    const scored = (data || []).map((item: any) => ({
      ...item,
      priority_score:
        item.owner_type === 'team' ? 100 :
        item.owner_type === 'enterprise' ? 80 :
        60,
      priority_label:
        item.owner_type === 'team' ? 'Team Template' :
        item.owner_type === 'enterprise' ? 'Enterprise Template' :
        'Global Template',
    }));

    scored.sort((a, b) => {
      if (b.priority_score !== a.priority_score) {
        return b.priority_score - a.priority_score;
      }
      return (b.used_by_user_count || 0) - (a.used_by_user_count || 0);
    });

    return scored;
  } catch (error) {
    console.error('Error searching admin data:', error);
    return [];
  }
}
