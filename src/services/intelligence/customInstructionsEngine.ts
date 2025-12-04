/**
 * Custom Instructions Engine
 *
 * Manages user-specific AI behavior overrides.
 * These have the HIGHEST priority in the intelligence hierarchy.
 */

import { supabase } from '../../lib/supabase';

export interface CustomInstructions {
  // Core Settings
  tone?: string;
  persona?: string;
  sellingStyle?: string;

  // Communication Rules
  forbiddenPhrases?: string[];
  requiredPhrases?: string[];
  preferredLanguage?: string;
  formalityLevel?: string;

  // AI Behavior
  aiBehaviorOverrides?: {
    aggressiveness?: string;
    empathyLevel?: string;
    questioningStyle?: string;
    pressureTactics?: string;
    [key: string]: any;
  };

  // Chatbot Specific
  chatbotOverrides?: {
    greetingStyle?: string;
    closingStyle?: string;
    objectionHandling?: string;
    pace?: string;
    [key: string]: any;
  };

  // Content Overrides
  customProductData?: Record<string, any>;
  customCompanyData?: Record<string, any>;
  pitchScriptOverrides?: Record<string, any>;
  messageTemplateOverrides?: Record<string, any>;

  // Priority Rules
  priorityRules?: {
    prioritizeRelationshipOverSpeed?: boolean;
    prioritizeEducationOverSelling?: boolean;
    allowMlOptimization?: boolean;
    [key: string]: any;
  };
}

export class CustomInstructionsEngine {
  /**
   * Get custom instructions for a user
   */
  async getUserInstructions(userId: string): Promise<CustomInstructions | null> {
    const { data, error } = await supabase
      .from('custom_instructions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return this.mapToCustomInstructions(data);
  }

  /**
   * Get team-level instructions (if user is in a team)
   */
  async getTeamInstructions(userId: string): Promise<CustomInstructions | null> {
    // TODO: Get user's team_id
    // For now, return null
    return null;
  }

  /**
   * Get enterprise-level instructions (if user is in an enterprise)
   */
  async getEnterpriseInstructions(userId: string): Promise<CustomInstructions | null> {
    // TODO: Get user's enterprise_id
    // For now, return null
    return null;
  }

  /**
   * Save or update custom instructions
   */
  async saveInstructions(userId: string, instructions: Partial<CustomInstructions>): Promise<void> {
    const dbData = this.mapToDatabase(instructions);

    const { error } = await supabase
      .from('custom_instructions')
      .upsert({
        user_id: userId,
        ...dbData,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (error) {
      console.error('[CustomInstructions] Error saving:', error);
      throw error;
    }

    console.log('[CustomInstructions] Saved for user:', userId);
  }

  /**
   * Check for conflicts between custom instructions and auto intelligence
   */
  async checkConflicts(
    userId: string,
    customInstructions: CustomInstructions,
    autoIntelligence: Record<string, any>
  ): Promise<void> {
    const conflicts: any[] = [];

    // Check for factual errors in custom company data
    if (customInstructions.customCompanyData && autoIntelligence.companyData) {
      const customWebsite = customInstructions.customCompanyData.website;
      const autoWebsite = autoIntelligence.companyData.website;

      if (customWebsite && autoWebsite && customWebsite !== autoWebsite) {
        conflicts.push({
          user_id: userId,
          conflict_type: 'factual_error',
          severity: 'medium',
          description: `Custom website (${customWebsite}) differs from auto-detected (${autoWebsite})`,
          custom_instruction_field: 'custom_company_data.website',
          conflicting_intelligence_source: 'company_crawler',
          suggested_resolution: `Verify which website is correct`,
        });
      }
    }

    // Check for forbidden phrases in auto-generated content
    if (customInstructions.forbiddenPhrases && customInstructions.forbiddenPhrases.length > 0) {
      // This will be checked at generation time
    }

    // Save conflicts
    if (conflicts.length > 0) {
      await supabase.from('custom_instruction_conflicts').insert(conflicts);
      console.log('[CustomInstructions] Found', conflicts.length, 'conflicts');
    }
  }

  /**
   * Track performance of custom instructions
   */
  async trackPerformance(
    userId: string,
    field: string,
    value: string,
    outcome: 'reply' | 'meeting' | 'close'
  ): Promise<void> {
    // Update or create performance record
    const { data: existing } = await supabase
      .from('custom_instruction_performance')
      .select('*')
      .eq('user_id', userId)
      .eq('instruction_field', field)
      .eq('instruction_value', value)
      .maybeSingle();

    if (existing) {
      // Update existing
      const updates: any = {
        total_uses: existing.total_uses + 1,
      };

      if (outcome === 'reply') {
        updates.reply_rate = ((existing.reply_rate * existing.total_uses) + 100) / (existing.total_uses + 1);
      } else if (outcome === 'meeting') {
        updates.meeting_rate = ((existing.meeting_rate * existing.total_uses) + 100) / (existing.total_uses + 1);
      } else if (outcome === 'close') {
        updates.close_rate = ((existing.close_rate * existing.total_uses) + 100) / (existing.total_uses + 1);
      }

      await supabase
        .from('custom_instruction_performance')
        .update(updates)
        .eq('id', existing.id);
    } else {
      // Create new
      await supabase.from('custom_instruction_performance').insert({
        user_id: userId,
        instruction_field: field,
        instruction_value: value,
        total_uses: 1,
        reply_rate: outcome === 'reply' ? 100 : 0,
        meeting_rate: outcome === 'meeting' ? 100 : 0,
        close_rate: outcome === 'close' ? 100 : 0,
      });
    }
  }

  /**
   * Map database row to CustomInstructions interface
   */
  private mapToCustomInstructions(data: any): CustomInstructions {
    return {
      tone: data.tone,
      persona: data.persona,
      sellingStyle: data.selling_style,
      forbiddenPhrases: data.forbidden_phrases || [],
      requiredPhrases: data.required_phrases || [],
      preferredLanguage: data.preferred_language,
      formalityLevel: data.formality_level,
      aiBehaviorOverrides: data.ai_behavior_overrides || {},
      chatbotOverrides: data.chatbot_overrides || {},
      customProductData: data.custom_product_data || {},
      customCompanyData: data.custom_company_data || {},
      pitchScriptOverrides: data.pitch_script_overrides || {},
      messageTemplateOverrides: data.message_template_overrides || {},
      priorityRules: data.priority_rules || {},
    };
  }

  /**
   * Map CustomInstructions to database format
   */
  private mapToDatabase(instructions: Partial<CustomInstructions>): any {
    return {
      tone: instructions.tone,
      persona: instructions.persona,
      selling_style: instructions.sellingStyle,
      forbidden_phrases: instructions.forbiddenPhrases,
      required_phrases: instructions.requiredPhrases,
      preferred_language: instructions.preferredLanguage,
      formality_level: instructions.formalityLevel,
      ai_behavior_overrides: instructions.aiBehaviorOverrides,
      chatbot_overrides: instructions.chatbotOverrides,
      custom_product_data: instructions.customProductData,
      custom_company_data: instructions.customCompanyData,
      pitch_script_overrides: instructions.pitchScriptOverrides,
      message_template_overrides: instructions.messageTemplateOverrides,
      priority_rules: instructions.priorityRules,
    };
  }
}

// Export singleton
export const customInstructionsEngine = new CustomInstructionsEngine();
