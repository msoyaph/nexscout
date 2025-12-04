/**
 * Data Feeder Engine
 *
 * Handles auto-population of user data from SuperAdmin master data
 * Enables "magic onboarding" experience where companies and products
 * are pre-populated based on industry and company selection
 */

import { supabase } from '../../lib/supabase';

interface AdminCompanySuggestion {
  id: string;
  name: string;
  industry: string;
  short_description: string | null;
  logo_url: string | null;
  tags: string[];
  products_count: number;
  match_score: number;
}

interface SeedResult {
  success: boolean;
  company_id?: string;
  products_seeded?: number;
  variants_seeded?: number;
  error?: string;
}

/**
 * Fuzzy search admin companies by name and/or industry
 * With multi-tenancy priority: team > enterprise > system
 */
export async function fetchAdminSuggestions(
  companyName: string,
  industry?: string,
  websiteUrl?: string
): Promise<AdminCompanySuggestion[]> {
  try {
    let query = supabase
      .from('admin_companies')
      .select(`
        id,
        name,
        industry,
        short_description,
        logo_url,
        tags,
        used_by_count,
        owner_type,
        owner_id
      `)
      .eq('is_active', true);

    // If we have a company name, do fuzzy search
    if (companyName && companyName.length > 2) {
      query = query.or(`name.ilike.%${companyName}%,short_description.ilike.%${companyName}%`);
    }

    // Filter by industry if provided
    if (industry) {
      query = query.eq('industry', industry);
    }

    query = query.order('is_featured', { ascending: false })
      .order('used_by_count', { ascending: false })
      .limit(10);

    const { data, error } = await query;

    if (error) throw error;

    // Calculate match scores
    const suggestions: AdminCompanySuggestion[] = await Promise.all(
      (data || []).map(async (company) => {
        let matchScore = 0;

        // Name similarity
        if (companyName) {
          const nameLower = company.name.toLowerCase();
          const searchLower = companyName.toLowerCase();
          if (nameLower === searchLower) matchScore += 100;
          else if (nameLower.includes(searchLower)) matchScore += 80;
          else if (searchLower.includes(nameLower)) matchScore += 70;
          else matchScore += 40;
        }

        // Industry match
        if (industry && company.industry === industry) {
          matchScore += 50;
        }

        // Popularity bonus
        matchScore += Math.min(company.used_by_count * 2, 20);

        // Priority bonus based on owner_type (team > enterprise > system)
        if (company.owner_type === 'team') {
          matchScore += 200; // Highest priority
        } else if (company.owner_type === 'enterprise') {
          matchScore += 100; // Medium priority
        } else {
          matchScore += 50; // System templates (lowest)
        }

        // Count products for this company
        const { count } = await supabase
          .from('admin_products')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', company.id)
          .eq('is_active', true);

        return {
          id: company.id,
          name: company.name,
          industry: company.industry,
          short_description: company.short_description,
          logo_url: company.logo_url,
          tags: company.tags || [],
          products_count: count || 0,
          match_score: matchScore,
        };
      })
    );

    // Sort by match score
    return suggestions.sort((a, b) => b.match_score - a.match_score);
  } catch (error) {
    console.error('Error fetching admin suggestions:', error);
    return [];
  }
}

/**
 * Seed user data from admin company
 * Copies company profile, products, and variants
 */
export async function seedUserFromAdminCompany(
  userId: string,
  adminCompanyId: string
): Promise<SeedResult> {
  try {
    // 1. Get admin company data
    const { data: adminCompany, error: companyError } = await supabase
      .from('admin_companies')
      .select('*')
      .eq('id', adminCompanyId)
      .single();

    if (companyError) throw companyError;
    if (!adminCompany) throw new Error('Admin company not found');

    // 2. Create or update user company profile
    const companyData = {
      user_id: userId,
      admin_company_id: adminCompanyId,
      company_name: adminCompany.name,
      industry: adminCompany.industry,
      company_description: adminCompany.short_description || '',
      target_audience: adminCompany.target_market || '',
      company_logo_url: adminCompany.logo_url || null,
      website: adminCompany.website_url || null,
      social_media: {
        facebook: adminCompany.facebook_url,
        instagram: adminCompany.instagram_url,
      },
      data_source: 'admin_seed',
      is_overridden: false,
      last_synced_at: new Date().toISOString(),
    };

    const { data: userCompany, error: createCompanyError } = await supabase
      .from('company_profiles')
      .upsert(companyData, { onConflict: 'user_id' })
      .select()
      .single();

    if (createCompanyError) throw createCompanyError;

    // 3. Get admin products for this company
    const { data: adminProducts, error: productsError } = await supabase
      .from('admin_products')
      .select('*')
      .eq('company_id', adminCompanyId)
      .eq('is_active', true);

    if (productsError) throw productsError;

    let productsSeeded = 0;
    let variantsSeeded = 0;

    // 4. Seed each product
    for (const adminProduct of adminProducts || []) {
      const productData = {
        user_id: userId,
        admin_product_id: adminProduct.id,
        name: adminProduct.name,
        product_type: adminProduct.product_type || 'product',
        main_category: adminProduct.main_category || 'other',
        short_description: adminProduct.short_description || '',
        primary_promise: adminProduct.primary_promise || '',
        key_benefits: adminProduct.key_benefits || [],
        ideal_prospect_tags: [], // Will be populated by user
        currency: adminProduct.currency || 'PHP',
        price_min: adminProduct.price_min || null,
        price_max: adminProduct.price_max || null,
        product_url: adminProduct.product_url || null,
        sales_page_url: adminProduct.sales_page_url || null,
        image_url: adminProduct.image_url || null,
        video_url: adminProduct.video_url || null,
        active: true,
        data_source: 'admin_seed',
        is_overridden: false,
        last_synced_at: new Date().toISOString(),
      };

      const { data: userProduct, error: createProductError } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single();

      if (createProductError) {
        console.error('Error creating product:', createProductError);
        continue;
      }

      productsSeeded++;

      // 5. Get and seed product variants
      const { data: adminVariants, error: variantsError } = await supabase
        .from('admin_product_variants')
        .select('*')
        .eq('product_id', adminProduct.id)
        .eq('is_active', true);

      if (!variantsError && adminVariants && adminVariants.length > 0) {
        for (const adminVariant of adminVariants) {
          const variantData = {
            product_id: userProduct.id,
            admin_variant_id: adminVariant.id,
            name: adminVariant.variant_name,
            sku: adminVariant.sku || null,
            price_override: adminVariant.price || null,
            attributes: adminVariant.attributes || {},
            sort_order: adminVariant.sort_order || 0,
            status: 'active',
            data_source: 'admin_seed',
            is_overridden: false,
            last_synced_at: new Date().toISOString(),
          };

          const { error: createVariantError } = await supabase
            .from('product_variants')
            .insert(variantData);

          if (!createVariantError) {
            variantsSeeded++;
          }
        }
      }
    }

    // 6. Update usage count for admin company
    await supabase.rpc('increment', {
      table_name: 'admin_companies',
      row_id: adminCompanyId,
      column_name: 'used_by_count',
    }).catch(() => {
      // Fallback if RPC doesn't exist
      supabase
        .from('admin_companies')
        .update({ used_by_count: (adminCompany.used_by_count || 0) + 1 })
        .eq('id', adminCompanyId)
        .then(() => {});
    });

    return {
      success: true,
      company_id: userCompany.id,
      products_seeded: productsSeeded,
      variants_seeded: variantsSeeded,
    };
  } catch (error: any) {
    console.error('Error seeding user from admin company:', error);
    return {
      success: false,
      error: error.message || 'Failed to seed user data',
    };
  }
}

/**
 * Factory reset user data from admin master
 * Deletes user overrides and re-seeds from admin
 */
export async function factoryResetUserData(
  userId: string,
  entityType: 'company' | 'product' | 'variant',
  entityId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (entityType === 'company') {
      // Get the admin company ID
      const { data: company, error: fetchError } = await supabase
        .from('company_profiles')
        .select('admin_company_id')
        .eq('id', entityId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !company?.admin_company_id) {
        throw new Error('Cannot reset: no admin company linked');
      }

      // Re-seed from admin
      await seedUserFromAdminCompany(userId, company.admin_company_id);

      return { success: true };
    } else if (entityType === 'product') {
      // Get admin product ID
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('admin_product_id')
        .eq('id', entityId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !product?.admin_product_id) {
        throw new Error('Cannot reset: no admin product linked');
      }

      // Get fresh admin data
      const { data: adminProduct, error: adminError } = await supabase
        .from('admin_products')
        .select('*')
        .eq('id', product.admin_product_id)
        .single();

      if (adminError || !adminProduct) {
        throw new Error('Admin product not found');
      }

      // Update user product with admin data
      const { error: updateError } = await supabase
        .from('products')
        .update({
          name: adminProduct.name,
          short_description: adminProduct.short_description,
          primary_promise: adminProduct.primary_promise,
          key_benefits: adminProduct.key_benefits,
          price_min: adminProduct.price_min,
          price_max: adminProduct.price_max,
          is_overridden: false,
          last_synced_at: new Date().toISOString(),
        })
        .eq('id', entityId)
        .eq('user_id', userId);

      if (updateError) throw updateError;

      return { success: true };
    }

    return { success: false, error: 'Invalid entity type' };
  } catch (error: any) {
    console.error('Error resetting user data:', error);
    return {
      success: false,
      error: error.message || 'Failed to reset data',
    };
  }
}

/**
 * Sync usage statistics for admin data
 * Updates used_by_count fields
 */
export async function syncUsageStats(): Promise<void> {
  try {
    // This would typically run as a scheduled job
    // For now, counts are updated inline during seeding
    console.log('Usage stats synced');
  } catch (error) {
    console.error('Error syncing usage stats:', error);
  }
}

/**
 * Get onboarding preview data
 * Shows what will be populated for user
 */
export async function getOnboardingPreview(adminCompanyId: string) {
  try {
    const { data: company, error: companyError } = await supabase
      .from('admin_companies')
      .select('*')
      .eq('id', adminCompanyId)
      .single();

    if (companyError) throw companyError;

    const { data: products, error: productsError } = await supabase
      .from('admin_products')
      .select(`
        *,
        admin_product_variants (*)
      `)
      .eq('company_id', adminCompanyId)
      .eq('is_active', true);

    if (productsError) throw productsError;

    return {
      company,
      products: products || [],
      total_products: products?.length || 0,
      total_variants: products?.reduce((sum, p: any) => sum + (p.admin_product_variants?.length || 0), 0) || 0,
    };
  } catch (error) {
    console.error('Error getting onboarding preview:', error);
    return null;
  }
}
