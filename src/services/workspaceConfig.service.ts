/**
 * WORKSPACE CONFIG SERVICE
 *
 * Multi-tenant AI configuration system
 * Provides complete isolation between workspaces
 * Prevents cross-brand contamination
 */

import { supabase } from '../lib/supabase';
import { WorkspaceConfig, getDefaultWorkspaceConfig } from '../types/WorkspaceConfig';

/**
 * Load complete workspace configuration
 * Returns defaults if none exist
 */
export async function loadWorkspaceConfig(workspaceId: string): Promise<WorkspaceConfig> {
  if (!workspaceId) {
    console.warn('[workspaceConfig] No workspaceId provided, returning defaults');
    return getDefaultWorkspaceConfig('unknown', 'Default Company');
  }

  try {
    const { data, error } = await supabase
      .from('workspace_configs')
      .select('*')
      .eq('workspace_id', workspaceId)
      .maybeSingle();

    if (error) {
      console.error('[workspaceConfig] Error loading config:', error);
      return getDefaultWorkspaceConfig(workspaceId, 'My Company');
    }

    if (!data) {
      console.log('[workspaceConfig] No config found, returning defaults');
      return getDefaultWorkspaceConfig(workspaceId, 'My Company');
    }

    // Map database columns to WorkspaceConfig interface
    return {
      workspaceId: data.workspace_id,
      company: data.company,
      products: data.products,
      toneProfile: data.tone_profile,
      funnels: data.funnels,
      aiBehavior: data.ai_behavior,
      customInstructions: data.custom_instructions,
      aiPitchDeck: data.ai_pitch_deck,
      aiMessages: data.ai_messages,
      pipeline: data.pipeline,
      aiSequences: data.ai_sequences,
      aiSellingPersonas: data.ai_selling_personas,
      businessOpportunity: data.business_opportunity,
      compensation: data.compensation,
      recruitingFlow: data.recruiting_flow,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (err) {
    console.error('[workspaceConfig] Exception loading config:', err);
    return getDefaultWorkspaceConfig(workspaceId, 'My Company');
  }
}

/**
 * Save complete workspace configuration
 */
export async function saveWorkspaceConfig(
  config: WorkspaceConfig
): Promise<{ success: boolean; error?: string }> {
  if (!config.workspaceId) {
    return { success: false, error: 'Missing workspaceId' };
  }

  try {
    const { error } = await supabase.from('workspace_configs').upsert({
      workspace_id: config.workspaceId,
      company: config.company,
      products: config.products,
      tone_profile: config.toneProfile,
      funnels: config.funnels,
      ai_behavior: config.aiBehavior,
      custom_instructions: config.customInstructions,
      ai_pitch_deck: config.aiPitchDeck,
      ai_messages: config.aiMessages,
      pipeline: config.pipeline,
      ai_sequences: config.aiSequences,
      ai_selling_personas: config.aiSellingPersonas,
      business_opportunity: config.businessOpportunity,
      compensation: config.compensation,
      recruiting_flow: config.recruitingFlow,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error('[workspaceConfig] Error saving config:', error);
      return { success: false, error: error.message };
    }

    console.log('[workspaceConfig] Config saved successfully');
    return { success: true };
  } catch (err) {
    console.error('[workspaceConfig] Exception saving config:', err);
    return { success: false, error: String(err) };
  }
}

/**
 * Update specific section of workspace config
 */
export async function updateWorkspaceConfigSection(
  workspaceId: string,
  section: keyof Omit<WorkspaceConfig, 'workspaceId' | 'createdAt' | 'updatedAt'>,
  data: any
): Promise<{ success: boolean; error?: string }> {
  if (!workspaceId) {
    return { success: false, error: 'Missing workspaceId' };
  }

  // Map section names to database columns
  const columnMap: Record<string, string> = {
    company: 'company',
    products: 'products',
    toneProfile: 'tone_profile',
    funnels: 'funnels',
    aiBehavior: 'ai_behavior',
    customInstructions: 'custom_instructions',
    aiPitchDeck: 'ai_pitch_deck',
    aiMessages: 'ai_messages',
    pipeline: 'pipeline',
    aiSequences: 'ai_sequences',
    aiSellingPersonas: 'ai_selling_personas',
    businessOpportunity: 'business_opportunity',
    compensation: 'compensation',
    recruitingFlow: 'recruiting_flow',
  };

  const columnName = columnMap[section];

  if (!columnName) {
    return { success: false, error: `Invalid section: ${section}` };
  }

  try {
    const { error } = await supabase
      .from('workspace_configs')
      .update({
        [columnName]: data,
        updated_at: new Date().toISOString(),
      })
      .eq('workspace_id', workspaceId);

    if (error) {
      console.error(`[workspaceConfig] Error updating ${section}:`, error);
      return { success: false, error: error.message };
    }

    console.log(`[workspaceConfig] Section ${section} updated successfully`);
    return { success: true };
  } catch (err) {
    console.error(`[workspaceConfig] Exception updating ${section}:`, err);
    return { success: false, error: String(err) };
  }
}

/**
 * Get company data from workspace config
 */
export async function getCompanyData(workspaceId: string) {
  const config = await loadWorkspaceConfig(workspaceId);
  return config.company;
}

/**
 * Get products from workspace config
 */
export async function getProducts(workspaceId: string) {
  const config = await loadWorkspaceConfig(workspaceId);
  return config.products.products;
}

/**
 * Get tone profile from workspace config
 */
export async function getToneProfile(workspaceId: string) {
  const config = await loadWorkspaceConfig(workspaceId);
  return config.toneProfile;
}

/**
 * Get AI behavior settings from workspace config
 */
export async function getAIBehavior(workspaceId: string) {
  const config = await loadWorkspaceConfig(workspaceId);
  return config.aiBehavior;
}

/**
 * Get custom instructions from workspace config
 */
export async function getCustomInstructions(workspaceId: string) {
  const config = await loadWorkspaceConfig(workspaceId);
  return config.customInstructions.globalInstructions;
}

/**
 * Get funnel configuration from workspace config
 */
export async function getFunnelConfig(workspaceId: string, funnelName: string = 'recruiting') {
  const config = await loadWorkspaceConfig(workspaceId);
  return config.funnels.funnels[funnelName];
}

/**
 * Get AI messages from workspace config
 */
export async function getAIMessages(workspaceId: string) {
  const config = await loadWorkspaceConfig(workspaceId);
  return config.aiMessages;
}

/**
 * Get business opportunity config
 */
export async function getBusinessOpportunity(workspaceId: string) {
  const config = await loadWorkspaceConfig(workspaceId);
  return config.businessOpportunity;
}

/**
 * Get AI pitch deck
 */
export async function getAIPitchDeck(workspaceId: string) {
  const config = await loadWorkspaceConfig(workspaceId);
  return config.aiPitchDeck;
}

/**
 * Check if workspace has custom configuration
 */
export async function hasCustomConfig(workspaceId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('workspace_configs')
      .select('workspace_id')
      .eq('workspace_id', workspaceId)
      .maybeSingle();

    return !!data;
  } catch (err) {
    console.error('[workspaceConfig] Error checking custom config:', err);
    return false;
  }
}

/**
 * Clone configuration from template
 */
export async function cloneConfigFromTemplate(
  workspaceId: string,
  templateId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Load template config
    const templateConfig = await loadWorkspaceConfig(templateId);

    // Create new config with same settings but different workspace ID
    const newConfig: WorkspaceConfig = {
      ...templateConfig,
      workspaceId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save new config
    return await saveWorkspaceConfig(newConfig);
  } catch (err) {
    console.error('[workspaceConfig] Error cloning from template:', err);
    return { success: false, error: String(err) };
  }
}
