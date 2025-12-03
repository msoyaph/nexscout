import { supabase } from '../../lib/supabase';
import type { ExtractedCompanyData } from './companyExtractor';

export interface CompanyProfile {
  id: string;
  companyName: string;
  companySlogan: string | null;
  industry: string;
  description: string | null;
  logoUrl: string | null;
  brandTone: string;
  pitchStyle: string;
  sequenceStyle: string;
  brandColorPrimary: string;
  brandColorSecondary: string;
}

export interface CompanyKnowledge {
  profile: CompanyProfile | null;
  brandKeywords: string[];
  products: any[];
  compensationPlan: any | null;
  valuePropositions: string[];
  objections: any[];
  testimonials: any[];
  toneProfile: any | null;
  companyStory: string;
  targetCustomer: string;
  painPoints: string[];
  benefits: string[];
}

/**
 * Get company profile
 */
export async function getCompanyProfile(userId: string): Promise<CompanyProfile | null> {
  try {
    const { data, error } = await supabase
      .from('company_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      companyName: data.company_name,
      companySlogan: data.company_slogan,
      industry: data.industry,
      description: data.description,
      logoUrl: data.logo_url,
      brandTone: data.brand_tone,
      pitchStyle: data.pitch_style,
      sequenceStyle: data.sequence_style,
      brandColorPrimary: data.brand_color_primary,
      brandColorSecondary: data.brand_color_secondary,
    };
  } catch (error) {
    console.error('Get company profile error:', error);
    return null;
  }
}

/**
 * Get extracted data by type
 */
async function getExtractedDataByType(userId: string, dataType: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('company_extracted_data')
      .select('data_json, confidence, is_verified')
      .eq('user_id', userId)
      .eq('data_type', dataType)
      .order('confidence', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map((row) => ({
      ...row.data_json,
      _confidence: row.confidence,
      _verified: row.is_verified,
    }));
  } catch (error) {
    console.error(`Get ${dataType} error:`, error);
    return [];
  }
}

/**
 * Get full company knowledge base
 */
export async function getCompanyKnowledge(userId: string): Promise<CompanyKnowledge> {
  try {
    const [
      profile,
      brandKeywords,
      products,
      compensationPlan,
      valuePropositions,
      objections,
      testimonials,
      toneProfile,
      companyStory,
      targetCustomer,
      painPoints,
      benefits,
    ] = await Promise.all([
      getCompanyProfile(userId),
      getExtractedDataByType(userId, 'brand_keywords'),
      getExtractedDataByType(userId, 'products'),
      getExtractedDataByType(userId, 'compensation_plan'),
      getExtractedDataByType(userId, 'value_propositions'),
      getExtractedDataByType(userId, 'objections'),
      getExtractedDataByType(userId, 'testimonials'),
      getExtractedDataByType(userId, 'tone_profile'),
      getExtractedDataByType(userId, 'company_story'),
      getExtractedDataByType(userId, 'target_customer'),
      getExtractedDataByType(userId, 'pain_points'),
      getExtractedDataByType(userId, 'benefits'),
    ]);

    return {
      profile,
      brandKeywords: flattenArray(brandKeywords),
      products: products || [],
      compensationPlan: compensationPlan[0] || null,
      valuePropositions: flattenArray(valuePropositions),
      objections: objections || [],
      testimonials: testimonials || [],
      toneProfile: toneProfile[0] || null,
      companyStory: flattenString(companyStory),
      targetCustomer: flattenString(targetCustomer),
      painPoints: flattenArray(painPoints),
      benefits: flattenArray(benefits),
    };
  } catch (error) {
    console.error('Get company knowledge error:', error);
    return {
      profile: null,
      brandKeywords: [],
      products: [],
      compensationPlan: null,
      valuePropositions: [],
      objections: [],
      testimonials: [],
      toneProfile: null,
      companyStory: '',
      targetCustomer: '',
      painPoints: [],
      benefits: [],
    };
  }
}

/**
 * Upsert company profile
 */
export async function upsertCompanyProfile(
  userId: string,
  profile: Partial<CompanyProfile>
): Promise<{ success: boolean; error?: string }> {
  try {
    const updates: any = {
      user_id: userId,
    };

    if (profile.companyName) updates.company_name = profile.companyName;
    if (profile.companySlogan !== undefined) updates.company_slogan = profile.companySlogan;
    if (profile.industry) updates.industry = profile.industry;
    if (profile.description !== undefined) updates.description = profile.description;
    if (profile.logoUrl !== undefined) updates.logo_url = profile.logoUrl;
    if (profile.brandTone) updates.brand_tone = profile.brandTone;
    if (profile.pitchStyle) updates.pitch_style = profile.pitchStyle;
    if (profile.sequenceStyle) updates.sequence_style = profile.sequenceStyle;
    if (profile.brandColorPrimary) updates.brand_color_primary = profile.brandColorPrimary;
    if (profile.brandColorSecondary) updates.brand_color_secondary = profile.brandColorSecondary;

    const { error } = await supabase.from('company_profiles').upsert(updates, {
      onConflict: 'user_id',
    });

    if (error) {
      console.error('Upsert company profile error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Upsert company profile error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get company assets
 */
export async function getCompanyAssets(userId: string) {
  try {
    const { data, error } = await supabase
      .from('company_assets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get company assets error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Get company assets error:', error);
    return [];
  }
}

/**
 * Delete company asset
 */
export async function deleteCompanyAsset(assetId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('company_assets').delete().eq('id', assetId);

    if (error) {
      console.error('Delete company asset error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete company asset error:', error);
    return false;
  }
}

/**
 * Update extracted data
 */
export async function updateExtractedData(
  id: string,
  updates: { data_json?: any; is_verified?: boolean }
): Promise<boolean> {
  try {
    const { error } = await supabase.from('company_extracted_data').update(updates).eq('id', id);

    if (error) {
      console.error('Update extracted data error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Update extracted data error:', error);
    return false;
  }
}

/**
 * Delete extracted data
 */
export async function deleteExtractedData(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('company_extracted_data').delete().eq('id', id);

    if (error) {
      console.error('Delete extracted data error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete extracted data error:', error);
    return false;
  }
}

// Helper functions
function flattenArray(data: any[]): string[] {
  const result: string[] = [];
  data.forEach((item) => {
    if (Array.isArray(item)) {
      result.push(...item.filter((v: any) => typeof v === 'string'));
    } else if (typeof item === 'string') {
      result.push(item);
    } else if (item && typeof item === 'object') {
      Object.values(item).forEach((val) => {
        if (Array.isArray(val)) {
          result.push(...val.filter((v: any) => typeof v === 'string'));
        } else if (typeof val === 'string') {
          result.push(val);
        }
      });
    }
  });
  return [...new Set(result)];
}

function flattenString(data: any[]): string {
  if (!data || data.length === 0) return '';
  const first = data[0];
  if (typeof first === 'string') return first;
  if (first && typeof first === 'object') {
    const values = Object.values(first).filter((v) => typeof v === 'string');
    return values.join(' ');
  }
  return '';
}
