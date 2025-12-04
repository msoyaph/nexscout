/**
 * CUSTOM INSTRUCTION FUSION LAYER (CIFL)
 *
 * The most important component of NexScout.
 * Ensures Custom Instructions don't break Funnel AI, Persona AI, Messaging AI, or MLM logic.
 *
 * Responsibilities:
 * - Merge user overrides with system intelligence
 * - Prevent contradictions
 * - Maintain tone consistency
 * - Control prompt mutation
 * - Ensure funnels remain high-converting
 */

import { supabase } from '../../lib/supabase';

// ========================================
// TYPES & INTERFACES
// ========================================

export interface CustomInstruction {
  id: string;
  instruction_type: 'tone' | 'style' | 'positioning' | 'framework' | 'constraints' | 'banned_words' | 'brand_voice' | 'selling_rules';
  content: string;
  priority: number;
  applies_to: string[];
}

export interface PersonaStyle {
  tone: string;
  style: string;
  language: string;
  role: string;
}

export interface FunnelRules {
  requireShortReplies: boolean;
  requireCTA: boolean;
  requireQualificationQuestions: boolean;
  requireProgressiveDisclosure: boolean;
}

export interface SystemSafeguards {
  constraints: string[];
  banned: string[];
}

export interface FusionOutput {
  tone: string;
  writingStyle: string;
  personaStyle: string;
  funnelRules: string[];
  constraints: string[];
  bannedBehaviors: string[];
  mergedValues: Record<string, any>;
  warnings?: string[];
}

export interface ConflictDetection {
  hasConflicts: boolean;
  conflicts: Array<{
    type: 'contradiction' | 'funnel_conflict' | 'persona_mismatch' | 'tone_conflict';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    recommendation: string;
  }>;
}

// ========================================
// INTELLIGENCE PRIORITY ORDER
// ========================================

export const INTELLIGENCE_PRIORITY = {
  CUSTOM_INSTRUCTIONS: 1,        // HIGHEST
  COMPANY_INTELLIGENCE: 2,
  PRODUCT_INTELLIGENCE: 3,
  TEAM_INTELLIGENCE: 4,
  ENTERPRISE_FEEDS: 5,
  DEEPSCAN_ENGINE: 6,
  PERSONA_SELLING: 7,
  FUNNEL_ENGINE: 8,
  CHATBOT_CLOSING: 9,
  LEAD_REVIVAL: 10,
  UPGRADE_PROBABILITY: 11,
  GLOBAL_INTELLIGENCE: 12        // LOWEST - fallback
};

// ========================================
// CUSTOM INSTRUCTION FUSION LAYER ENGINE
// ========================================

class CustomInstructionFusionLayerEngine {
  /**
   * Load user's custom instructions
   */
  async loadCustomInstructions(userId: string, appliesTo: string = 'all'): Promise<CustomInstruction[]> {
    const { data, error } = await supabase
      .from('custom_instructions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .or(`applies_to.cs.{${appliesTo}},applies_to.cs.{all}`)
      .order('priority', { ascending: false });

    if (error) {
      console.error('Error loading custom instructions:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Fuse custom instructions with system intelligence
   */
  fuseInstructions(
    customInstructions: CustomInstruction[],
    companyIntel: any,
    productIntel: any,
    personaStyle: PersonaStyle,
    funnelRules: FunnelRules,
    safeguards: SystemSafeguards
  ): FusionOutput {
    const warnings: string[] = [];

    // Extract custom instruction values by type
    const ciMap = this.organizeInstructions(customInstructions);

    // 1. Apply Custom Instructions first (top priority)
    const tone = ciMap.tone || personaStyle.tone;
    const style = ciMap.style || personaStyle.style;
    const positioning = ciMap.positioning || companyIntel?.positioning || 'default';

    // 2. Merge selling rules
    const mergedFunnelRules = this.mergeFunnelRules(ciMap, funnelRules, warnings);

    // 3. Detect contradictions
    const conflicts = this.detectConflicts(ciMap, funnelRules, personaStyle);
    if (conflicts.hasConflicts) {
      warnings.push(...conflicts.conflicts.map(c => c.message));
    }

    // 4. Apply constraints
    const constraints = [...safeguards.constraints];
    if (ciMap.constraints) {
      constraints.push(ciMap.constraints);
    }

    // 5. Banned behaviors
    const bannedBehaviors = [...safeguards.banned];
    if (ciMap.banned_words) {
      bannedBehaviors.push(...ciMap.banned_words.split(',').map(w => w.trim()));
    }

    // 6. Final merged values
    const mergedValues = {
      ...companyIntel,
      ...productIntel,
      persona: personaStyle,
      customOverrides: ciMap
    };

    return {
      tone,
      writingStyle: style,
      personaStyle: personaStyle.style,
      funnelRules: mergedFunnelRules,
      constraints,
      bannedBehaviors,
      mergedValues,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Organize instructions by type
   */
  private organizeInstructions(instructions: CustomInstruction[]): Record<string, string> {
    const map: Record<string, string> = {};
    for (const inst of instructions) {
      map[inst.instruction_type] = inst.content;
    }
    return map;
  }

  /**
   * Merge funnel rules with custom instructions
   */
  private mergeFunnelRules(
    ciMap: Record<string, string>,
    funnelRules: FunnelRules,
    warnings: string[]
  ): string[] {
    const rules: string[] = [];

    if (funnelRules.requireShortReplies) {
      rules.push('Keep messages short and scannable');
    }

    if (funnelRules.requireCTA) {
      rules.push('Always include a clear call-to-action');
    }

    if (funnelRules.requireQualificationQuestions) {
      rules.push('Ask qualification questions to understand prospect needs');
    }

    if (funnelRules.requireProgressiveDisclosure) {
      rules.push('Reveal information progressively, not all at once');
    }

    // Check for CI overrides
    if (ciMap.selling_rules) {
      rules.push(ciMap.selling_rules);
    }

    return rules;
  }

  /**
   * Detect conflicts between custom instructions and system requirements
   */
  detectConflicts(
    ciMap: Record<string, string>,
    funnelRules: FunnelRules,
    personaStyle: PersonaStyle
  ): ConflictDetection {
    const conflicts: ConflictDetection['conflicts'] = [];

    // Check for question contradiction
    if (ciMap.constraints?.toLowerCase().includes('no questions') && funnelRules.requireQualificationQuestions) {
      conflicts.push({
        type: 'funnel_conflict',
        severity: 'high',
        message: 'Custom instructions forbid questions but funnel requires qualification questions',
        recommendation: 'Allow at least one qualifying question or disable funnel requirement'
      });
    }

    // Check for message length contradiction
    if (ciMap.style?.toLowerCase().includes('long') && funnelRules.requireShortReplies) {
      conflicts.push({
        type: 'funnel_conflict',
        severity: 'medium',
        message: 'Custom style requests long messages but funnel requires short replies',
        recommendation: 'Use medium-length messages as a compromise'
      });
    }

    // Check for selling contradiction
    if (ciMap.constraints?.toLowerCase().includes('no selling') && funnelRules.requireCTA) {
      conflicts.push({
        type: 'funnel_conflict',
        severity: 'critical',
        message: 'Custom instructions disable selling but funnel requires CTA',
        recommendation: 'Enable soft CTAs or modify funnel to educational mode'
      });
    }

    // Check for tone mismatch
    if (ciMap.tone && personaStyle.tone) {
      const ciToneLower = ciMap.tone.toLowerCase();
      const personaToneLower = personaStyle.tone.toLowerCase();
      if (!ciToneLower.includes(personaToneLower) && !personaToneLower.includes(ciToneLower)) {
        conflicts.push({
          type: 'tone_conflict',
          severity: 'low',
          message: `Custom tone "${ciMap.tone}" differs from persona tone "${personaStyle.tone}"`,
          recommendation: 'Custom tone will take priority, but may reduce persona effectiveness'
        });
      }
    }

    return {
      hasConflicts: conflicts.length > 0,
      conflicts
    };
  }

  /**
   * Log conflicts to database for user review
   */
  async logConflicts(userId: string, conflicts: ConflictDetection['conflicts'], customInstructionId?: string): Promise<void> {
    for (const conflict of conflicts) {
      await supabase.from('consistency_warnings').insert({
        user_id: userId,
        warning_type: conflict.type,
        severity: conflict.severity,
        warning_message: conflict.message,
        custom_instruction_id: customInstructionId,
        resolution_status: 'unresolved'
      });
    }
  }

  /**
   * Apply fusion layer to generate final prompt
   */
  async applyFusionLayer(
    userId: string,
    context: 'messaging' | 'scoring' | 'chatbot' | 'all',
    basePrompt: string,
    companyIntel?: any,
    productIntel?: any
  ): Promise<{ finalPrompt: string; warnings?: string[] }> {
    // Load custom instructions
    const customInstructions = await this.loadCustomInstructions(userId, context);

    if (customInstructions.length === 0) {
      return { finalPrompt: basePrompt };
    }

    // Default values
    const personaStyle: PersonaStyle = {
      tone: 'friendly',
      style: 'conversational',
      language: 'en',
      role: 'assistant'
    };

    const funnelRules: FunnelRules = {
      requireShortReplies: true,
      requireCTA: true,
      requireQualificationQuestions: true,
      requireProgressiveDisclosure: true
    };

    const safeguards: SystemSafeguards = {
      constraints: ['Be respectful', 'Stay professional', 'Maintain brand voice'],
      banned: ['spam', 'offensive', 'deceptive']
    };

    // Fuse instructions
    const fusion = this.fuseInstructions(
      customInstructions,
      companyIntel,
      productIntel,
      personaStyle,
      funnelRules,
      safeguards
    );

    // Detect and log conflicts
    const conflicts = this.detectConflicts(
      this.organizeInstructions(customInstructions),
      funnelRules,
      personaStyle
    );

    if (conflicts.hasConflicts) {
      await this.logConflicts(userId, conflicts.conflicts, customInstructions[0]?.id);
    }

    // Build final prompt with fusion
    let finalPrompt = basePrompt;

    // Add tone override
    if (fusion.tone !== personaStyle.tone) {
      finalPrompt = `[TONE OVERRIDE: ${fusion.tone}]\n\n${finalPrompt}`;
    }

    // Add style override
    if (fusion.writingStyle !== personaStyle.style) {
      finalPrompt = `[STYLE: ${fusion.writingStyle}]\n\n${finalPrompt}`;
    }

    // Add constraints
    if (fusion.constraints.length > 0) {
      finalPrompt += `\n\nCONSTRAINTS:\n${fusion.constraints.map(c => `- ${c}`).join('\n')}`;
    }

    // Add funnel rules
    if (fusion.funnelRules.length > 0) {
      finalPrompt += `\n\nFUNNEL RULES:\n${fusion.funnelRules.map(r => `- ${r}`).join('\n')}`;
    }

    return {
      finalPrompt,
      warnings: fusion.warnings
    };
  }
}

// Export singleton instance
export const customInstructionFusionLayer = new CustomInstructionFusionLayerEngine();
