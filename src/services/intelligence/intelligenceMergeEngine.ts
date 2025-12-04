/**
 * Intelligence Merge Engine
 *
 * THE GOLDEN RULE: Merge all intelligence sources with proper priority
 *
 * Priority Hierarchy:
 * 1. User Custom Instructions (highest)
 * 2. User Company/Product Data
 * 3. Team Data Feeds
 * 4. Enterprise Master Feeds
 * 5. Automatic Intelligence (Crawler + SIFE)
 * 6. Default Global Intelligence (safety fallback)
 */

import { supabase } from '../../lib/supabase';
import { customInstructionsEngine, CustomInstructions } from './customInstructionsEngine';

export interface IntelligenceContext {
  userId: string;
  context: string; // 'chatbot_response', 'pitch_generation', 'message_compose'
}

export interface MergedIntelligence {
  // Core Attributes
  tone: string;
  persona: string;
  sellingStyle: string;
  language: string;
  formalityLevel: string;

  // Communication Rules
  forbiddenPhrases: string[];
  requiredPhrases: string[];

  // AI Behavior
  behavior: {
    aggressiveness: string;
    empathyLevel: string;
    questioningStyle: string;
    pressureTactics: string;
    [key: string]: any;
  };

  // Chatbot Settings
  chatbot: {
    greetingStyle: string;
    closingStyle: string;
    objectionHandling: string;
    pace: string;
    [key: string]: any;
  };

  // Content Data
  productData: Record<string, any>;
  companyData: Record<string, any>;

  // Scripts & Templates
  pitchScripts: Record<string, any>;
  messageTemplates: Record<string, any>;

  // ML Hints
  mlHints: {
    suggestedTone?: string;
    suggestedTiming?: string;
    winningPatterns?: any[];
    [key: string]: any;
  };

  // Metadata
  sourceBreakdown: {
    tone: string; // 'custom' | 'team' | 'enterprise' | 'auto' | 'default'
    persona: string;
    productData: string;
    companyData: string;
    [key: string]: string;
  };

  // Quality
  finalSanitized: boolean;
  conflictsDetected: number;
}

export class IntelligenceMergeEngine {
  /**
   * Main merge function - blends all intelligence sources
   */
  async mergeAllIntelligence(context: IntelligenceContext): Promise<MergedIntelligence> {
    const { userId, context: mergeContext } = context;

    console.log('[IntelligenceMerge] Merging intelligence for:', mergeContext);

    // 1. Fetch all intelligence sources
    const [custom, team, enterprise, company, product, mlHints] = await Promise.all([
      this.getCustomInstructions(userId),
      this.getTeamInstructions(userId),
      this.getEnterpriseInstructions(userId),
      this.getCompanyIntelligence(userId),
      this.getProductIntelligence(userId),
      this.getMLHints(userId),
    ]);

    // 2. Merge with proper priority
    const merged = this.performMerge({
      custom,
      team,
      enterprise,
      company,
      product,
      mlHints,
    });

    // 3. Log merge for transparency
    await this.logMerge(userId, mergeContext, merged);

    return merged;
  }

  /**
   * Perform the actual merge with priority rules
   */
  private performMerge(sources: {
    custom: CustomInstructions | null;
    team: CustomInstructions | null;
    enterprise: CustomInstructions | null;
    company: any;
    product: any;
    mlHints: any;
  }): MergedIntelligence {
    const { custom, team, enterprise, company, product, mlHints } = sources;

    // Source tracking
    const sourceBreakdown: Record<string, string> = {};

    // TONE: custom > team > enterprise > ml > default
    let tone = 'neutral-friendly';
    if (custom?.tone) {
      tone = custom.tone;
      sourceBreakdown.tone = 'custom';
    } else if (team?.tone) {
      tone = team.tone;
      sourceBreakdown.tone = 'team';
    } else if (enterprise?.tone) {
      tone = enterprise.tone;
      sourceBreakdown.tone = 'enterprise';
    } else if (mlHints?.suggestedTone) {
      tone = mlHints.suggestedTone;
      sourceBreakdown.tone = 'ml';
    } else {
      sourceBreakdown.tone = 'default';
    }

    // PERSONA: same priority
    let persona = 'consultative';
    if (custom?.persona) {
      persona = custom.persona;
      sourceBreakdown.persona = 'custom';
    } else if (team?.persona) {
      persona = team.persona;
      sourceBreakdown.persona = 'team';
    } else if (enterprise?.persona) {
      persona = enterprise.persona;
      sourceBreakdown.persona = 'enterprise';
    } else {
      sourceBreakdown.persona = 'default';
    }

    // SELLING STYLE: same priority
    let sellingStyle = 'soft_sell';
    if (custom?.sellingStyle) {
      sellingStyle = custom.sellingStyle;
    } else if (team?.sellingStyle) {
      sellingStyle = team.sellingStyle;
    } else if (enterprise?.sellingStyle) {
      sellingStyle = enterprise.sellingStyle;
    }

    // LANGUAGE: custom > team > enterprise > default
    const language = custom?.preferredLanguage || team?.preferredLanguage || enterprise?.preferredLanguage || 'taglish';

    // FORMALITY: custom > team > enterprise > default
    const formalityLevel = custom?.formalityLevel || team?.formalityLevel || 'balanced';

    // FORBIDDEN PHRASES: Merge all levels (union)
    const forbiddenPhrases = [
      ...(custom?.forbiddenPhrases || []),
      ...(team?.forbiddenPhrases || []),
      ...(enterprise?.forbiddenPhrases || []),
    ];

    // REQUIRED PHRASES: Merge all levels (union)
    const requiredPhrases = [
      ...(custom?.requiredPhrases || []),
      ...(team?.requiredPhrases || []),
      ...(enterprise?.requiredPhrases || []),
    ];

    // AI BEHAVIOR: Merge with priority
    const behavior = {
      aggressiveness: 'medium',
      empathyLevel: 'medium',
      questioningStyle: 'balanced',
      pressureTactics: 'none',
      ...enterprise?.aiBehaviorOverrides,
      ...team?.aiBehaviorOverrides,
      ...custom?.aiBehaviorOverrides,
    };

    // CHATBOT: Merge with priority
    const chatbot = {
      greetingStyle: 'warm',
      closingStyle: 'soft',
      objectionHandling: 'empathetic',
      pace: 'conversational',
      ...enterprise?.chatbotOverrides,
      ...team?.chatbotOverrides,
      ...custom?.chatbotOverrides,
    };

    // PRODUCT DATA: custom overrides auto
    const productData = {
      ...product?.autoData,
      ...custom?.customProductData,
    };
    sourceBreakdown.productData = custom?.customProductData ? 'custom' : 'auto';

    // COMPANY DATA: custom overrides auto
    const companyData = {
      ...company?.autoData,
      ...enterprise?.masterCompanyData,
      ...custom?.customCompanyData,
    };
    sourceBreakdown.companyData = custom?.customCompanyData ? 'custom' : enterprise?.masterCompanyData ? 'enterprise' : 'auto';

    // SCRIPTS: custom overrides
    const pitchScripts = {
      ...mlHints?.winningScripts,
      ...custom?.pitchScriptOverrides,
    };

    const messageTemplates = {
      ...mlHints?.winningTemplates,
      ...custom?.messageTemplateOverrides,
    };

    return {
      tone,
      persona,
      sellingStyle,
      language,
      formalityLevel,
      forbiddenPhrases,
      requiredPhrases,
      behavior,
      chatbot,
      productData,
      companyData,
      pitchScripts,
      messageTemplates,
      mlHints: mlHints || {},
      sourceBreakdown,
      finalSanitized: true,
      conflictsDetected: 0,
    };
  }

  /**
   * Get custom instructions
   */
  private async getCustomInstructions(userId: string): Promise<CustomInstructions | null> {
    return await customInstructionsEngine.getUserInstructions(userId);
  }

  /**
   * Get team instructions
   */
  private async getTeamInstructions(userId: string): Promise<CustomInstructions | null> {
    return await customInstructionsEngine.getTeamInstructions(userId);
  }

  /**
   * Get enterprise instructions
   */
  private async getEnterpriseInstructions(userId: string): Promise<CustomInstructions | null> {
    return await customInstructionsEngine.getEnterpriseInstructions(userId);
  }

  /**
   * Get company intelligence (auto-crawled data)
   */
  private async getCompanyIntelligence(userId: string): Promise<any> {
    const { data } = await supabase
      .from('company_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    return {
      autoData: data || {},
    };
  }

  /**
   * Get product intelligence
   */
  private async getProductIntelligence(userId: string): Promise<any> {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', userId)
      .limit(10);

    return {
      autoData: {
        products: data || [],
      },
    };
  }

  /**
   * Get ML hints from SIFE and Sales Genome
   */
  private async getMLHints(userId: string): Promise<any> {
    // Get winning patterns from SIFE
    const { data: patterns } = await supabase
      .from('sife_winning_patterns')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('success_rate', { ascending: false })
      .limit(5);

    // Get user intelligence from Sales Genome
    const { data: userIntel } = await supabase
      .from('sife_user_intelligence')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    return {
      winningPatterns: patterns || [],
      suggestedTone: userIntel?.tone_preference,
      winningScripts: {},
      winningTemplates: {},
    };
  }

  /**
   * Log merge for transparency and debugging
   */
  private async logMerge(userId: string, mergeContext: string, merged: MergedIntelligence): Promise<void> {
    await supabase.from('intelligence_merge_log').insert({
      user_id: userId,
      merge_context: mergeContext,
      used_custom_instructions: merged.sourceBreakdown.tone === 'custom',
      used_team_instructions: merged.sourceBreakdown.tone === 'team',
      used_enterprise_instructions: merged.sourceBreakdown.tone === 'enterprise',
      used_company_intelligence: merged.sourceBreakdown.companyData === 'auto',
      used_product_intelligence: merged.sourceBreakdown.productData === 'auto',
      used_ml_hints: merged.sourceBreakdown.tone === 'ml',
      merged_output: merged,
      override_decisions: merged.sourceBreakdown,
    });
  }

  /**
   * Helper: Apply merged intelligence to text content
   */
  applyIntelligenceToText(text: string, intelligence: MergedIntelligence): string {
    let result = text;

    // Remove forbidden phrases
    for (const forbidden of intelligence.forbiddenPhrases) {
      const regex = new RegExp(forbidden, 'gi');
      result = result.replace(regex, '[redacted]');
    }

    // Adjust tone
    if (intelligence.tone === 'professional') {
      result = result.replace(/kumusta/gi, 'Good day');
      result = result.replace(/salamat/gi, 'Thank you');
    } else if (intelligence.tone === 'casual') {
      result = result.replace(/Good day/gi, 'Kumusta');
    }

    return result;
  }

  /**
   * Helper: Check if content follows custom instructions
   */
  validateContent(content: string, intelligence: MergedIntelligence): {
    valid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // Check for forbidden phrases
    for (const forbidden of intelligence.forbiddenPhrases) {
      if (content.toLowerCase().includes(forbidden.toLowerCase())) {
        issues.push(`Contains forbidden phrase: "${forbidden}"`);
      }
    }

    // Check for required phrases
    for (const required of intelligence.requiredPhrases) {
      if (!content.toLowerCase().includes(required.toLowerCase())) {
        issues.push(`Missing required phrase: "${required}"`);
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }
}

// Export singleton
export const intelligenceMergeEngine = new IntelligenceMergeEngine();
