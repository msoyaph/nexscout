/**
 * Messaging Hub Service
 * 
 * Enhanced messaging service for Messaging Hub page with:
 * - ScoutScore integration for prospect targeting
 * - Industry-specific scripts
 * - 5-variation generation per request
 * - Coin deduction (3 coins per generation)
 * - Auto-save to message library
 */

import { supabase } from '../../lib/supabase';
import { coinTransactionService } from '../coinTransactionService';
import { scoutScoreUnified } from '../../engines/scoring/scoutScoreUnified';
import { messagingEngineUnified } from '../../engines/messaging/messagingEngineUnified';
import { aiOrchestrator } from '../ai/AIOrchestrator';

// Extended Industry List
export type ExtendedIndustry = 
  | 'mlm' 
  | 'insurance' 
  | 'real_estate' 
  | 'ecommerce' 
  | 'coaching' 
  | 'clinic' 
  | 'loans' 
  | 'auto' 
  | 'franchise' 
  | 'saas' 
  | 'travel' 
  | 'beauty' 
  | 'online_seller' 
  | 'service' 
  | 'finance' 
  | 'crypto' 
  | 'health_wellness' 
  | 'general';

export type MessageTone = 'friendly' | 'professional' | 'warm' | 'direct' | 'casual';
export type ToolType = 'objection' | 'booking' | 'coaching' | 'message' | 'revival' | 'referral' | 'social' | 'call';

export interface ProspectContext {
  id: string;
  full_name: string;
  company_name?: string;
  scout_score?: number;
  lead_temperature?: 'cold' | 'warm' | 'hot';
  pain_points?: string[];
  interests?: string[];
  industry?: string;
  personality_traits?: any;
  last_interaction_days_ago?: number;
}

export interface MessageVariation {
  id: string;
  approach: string; // e.g., "Direct Value Proposition", "Problem-Solution", "Social Proof"
  content: string;
  tone: MessageTone;
  cta?: string;
  reasoning?: string; // Why this approach was chosen
}

export interface GeneratedMessagesResult {
  success: boolean;
  variations: MessageVariation[];
  prospectContext: ProspectContext;
  scoutScore?: number;
  leadTemperature?: string;
  insights?: string[];
  error?: string;
}

const COST_PER_GENERATION = 3; // 3 coins per generation

export const messagingHubService = {
  /**
   * Load AI System Instructions from chatbot_settings (primary knowledge source)
   */
  async loadAISystemInstructions(userId: string): Promise<string> {
    try {
      const { data: chatbotSettings } = await supabase
        .from('chatbot_settings')
        .select('custom_system_instructions, use_custom_instructions, integrations')
        .eq('user_id', userId)
        .maybeSingle();

      if (chatbotSettings?.use_custom_instructions && chatbotSettings.custom_system_instructions) {
        return chatbotSettings.custom_system_instructions;
      }
      return '';
    } catch (error) {
      console.warn('[MessagingHub] Error loading AI System Instructions:', error);
      return '';
    }
  },

  /**
   * Generate 5 message variations for a prospect
   */
  async generateMessageVariations(
    userId: string,
    prospectId: string,
    toolType: ToolType,
    industry: ExtendedIndustry,
    tone: MessageTone
  ): Promise<GeneratedMessagesResult> {
    // Create a unique transaction ID to prevent duplicate deductions
    const transactionId = `msg_gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    let coinsDeducted = false;

    try {
      // 1. Check coin balance - only need 3 coins (we deduct ONCE after all variations succeed)
      const { data: profile } = await supabase
        .from('profiles')
        .select('coin_balance')
        .eq('id', userId)
        .single();

      if (!profile || (profile.coin_balance || 0) < COST_PER_GENERATION) {
        return {
          success: false,
          variations: [],
          prospectContext: { id: prospectId, full_name: '' },
          error: `Insufficient coins. Need ${COST_PER_GENERATION} coins to generate messages.`,
        };
      }

      // IMPORTANT: If edge function doesn't respect skipCoinCheck, it may still deduct coins
      // We'll handle refund/compensation in catch block if generation fails

      // 2. Load prospect context with ScoutScore
      const prospectContext = await this.loadProspectContext(prospectId, userId);
      
      // 3. Calculate ScoutScore if not available
      let scoutScore = prospectContext.scout_score;
      let leadTemperature = prospectContext.lead_temperature;
      
      if (!scoutScore) {
        try {
          const scoreResult = await scoutScoreUnified.calculateScoutScore({
            prospectId,
            userId,
            config: {
              mode: 'unified',
              industry: industry === 'general' ? undefined : industry,
              includeInsights: true,
            },
          });
          
          if (scoreResult.success) {
            scoutScore = scoreResult.score;
            leadTemperature = scoreResult.rating || 'cold';
          }
        } catch (scoreError) {
          console.warn('[MessagingHub] ScoutScore calculation failed:', scoreError);
        }
      }

      // 4. Generate 5 variations using AI (with skipCoinCheck to prevent edge function deductions)
      const variations = await this.generateVariations(
        prospectContext,
        toolType,
        industry,
        tone,
        scoutScore,
        leadTemperature,
        userId, // Pass userId to load AI System Instructions
        transactionId // Pass transaction ID to prevent duplicate deductions
      );

      // 5. Only deduct coins ONCE if we successfully generated at least 1 variation
      if (variations.length === 0) {
        return {
          success: false,
          variations: [],
          prospectContext,
          error: 'Failed to generate message variations. Please try again. No coins were deducted.',
        };
      }

      // Deduct coins ONCE after successful generation (not per variation)
      // NOTE: If edge function deducted coins despite skipCoinCheck, user may have been charged more
      // We only deduct 3 coins here for the full batch of 5 variations
      await coinTransactionService.deductCoins(
        userId,
        COST_PER_GENERATION, // Only 3 coins for the entire generation (all 5 variations)
        `Generated ${variations.length} message variations for ${toolType}`,
        {
          prospect_id: prospectId,
          tool_type: toolType,
          industry,
          tone,
          variations_count: variations.length,
          transaction_id: transactionId, // Track this transaction to prevent duplicates
        }
      );
      coinsDeducted = true;

      // 6. Save all variations to library
      await this.saveVariationsToLibrary(userId, prospectId, toolType, industry, tone, variations, prospectContext);

      // 6. Save all variations to library
      await this.saveVariationsToLibrary(userId, prospectId, toolType, industry, tone, variations, prospectContext);

      return {
        success: true,
        variations,
        prospectContext: {
          ...prospectContext,
          scout_score: scoutScore,
          lead_temperature: leadTemperature as 'cold' | 'warm' | 'hot',
        },
        scoutScore,
        leadTemperature,
        insights: this.generateInsights(prospectContext, scoutScore, leadTemperature),
      };
    } catch (error: any) {
      console.error('[MessagingHub] Error generating messages:', error);
      return {
        success: false,
        variations: [],
        prospectContext: { id: prospectId, full_name: '' },
        error: error.message || 'Failed to generate messages',
      };
    }
  },

  /**
   * Load prospect context from database
   */
  async loadProspectContext(prospectId: string, userId: string): Promise<ProspectContext> {
      // Use select('*') to avoid column name issues
      const { data: prospect, error } = await supabase
        .from('prospects')
        .select('*')
        .eq('id', prospectId)
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      const lastInteractionDays = prospect?.updated_at
        ? Math.floor((Date.now() - new Date(prospect.updated_at).getTime()) / (1000 * 60 * 60 * 24))
        : undefined;

      return {
        id: prospect.id,
        full_name: prospect.full_name || 'Unknown',
        company_name: prospect.company || prospect.metadata?.company || null, // Use 'company' column, not 'company_name'
        scout_score: prospect.scout_score || prospect.metadata?.scout_score,
        lead_temperature: prospect.lead_temperature || prospect.metadata?.bucket || prospect.metadata?.temperature,
        pain_points: prospect.pain_points || prospect.metadata?.pain_points || [],
        interests: prospect.interests || prospect.metadata?.interests || [],
        industry: prospect.industry || prospect.metadata?.industry,
        personality_traits: prospect.personality_traits || prospect.metadata?.personality_traits,
        last_interaction_days_ago: lastInteractionDays,
      };
  },

  /**
   * Generate 5 different message variations using AI
   */
  async generateVariations(
    prospect: ProspectContext,
    toolType: ToolType,
    industry: ExtendedIndustry,
    tone: MessageTone,
    scoutScore?: number,
    leadTemperature?: string,
    userId?: string,
    transactionId?: string // Optional transaction ID to track this batch
  ): Promise<MessageVariation[]> {
    const approaches = this.getApproachesForTool(toolType);
    
    // Load AI System Instructions (primary knowledge source)
    let aiInstructions = '';
    if (userId) {
      aiInstructions = await this.loadAISystemInstructions(userId);
    }
    
    // Build base system prompt once
    const baseSystemPrompt = this.buildSystemPrompt(prospect, toolType, industry, tone, scoutScore, leadTemperature, aiInstructions);
    
    const variations: MessageVariation[] = [];

    // Generate each variation with unique approach and temperature
    for (let i = 0; i < Math.min(approaches.length, 5); i++) {
      const approach = approaches[i];
      try {
        // Build highly specific user prompt with approach details
        const userPrompt = this.buildUserPrompt(
          approach, 
          prospect, 
          toolType, 
          scoutScore, 
          leadTemperature, 
          industry, 
          tone
        );
        
        // Add variation-specific uniqueness instructions
        const uniquenessPrompt = `\n\nCRITICAL: This is Variation ${i + 1} of 5. Make it COMPLETELY UNIQUE from all other variations by using:
- A ${['story-driven', 'question-based', 'benefit-focused', 'problem-solving', 'relationship-building'][i]} opening
- ${['Emotional', 'Logical', 'Social proof', 'Urgency', 'Curiosity'][i]} as the primary persuasion angle
- ${['Short and punchy', 'Detailed and comprehensive', 'Conversational', 'Professional', 'Warm and personal'][i]} message structure`;
        
        const enhancedSystemPrompt = baseSystemPrompt + uniquenessPrompt;
        
        // Use varied temperature per variation for more diversity (0.7 to 0.95)
        // Each variation gets a different base temperature to ensure uniqueness
        const baseTemps = [0.7, 0.8, 0.85, 0.9, 0.95];
        const temperature = baseTemps[i] || (0.75 + (i * 0.05));
        
        const result = await aiOrchestrator.generate({
          messages: [
            { role: 'system', content: enhancedSystemPrompt },
            { role: 'user', content: userPrompt },
          ],
          config: {
            userId: userId || prospect.id,
            action: 'ai_message',
            model: 'gpt-4o',
            temperature: Math.min(0.95, Math.max(0.6, temperature)), // Ensure within valid range
            maxTokens: 500,
            autoSelectModel: true,
            skipCoinCheck: true, // CRITICAL: Coins are deducted ONCE after all variations, not per call
            coinCost: 0, // Indicate no coin deduction needed in edge function
            transactionId: transactionId, // Pass transaction ID to edge function for deduplication
          },
        });

        if (result.success && result.content && result.content.trim().length > 20) {
          // Generate reasoning for why this variation works (non-blocking)
          let reasoning = approach.reasoning; // Default fallback
          try {
            const generatedReasoning = await Promise.race([
              this.generateVariationReasoning(
                approach,
                prospect,
                scoutScore,
                leadTemperature,
                toolType,
                industry,
                tone
              ),
              new Promise<string>((resolve) => setTimeout(() => resolve(approach.reasoning), 2000)) // 2s timeout
            ]);
            reasoning = generatedReasoning || approach.reasoning;
          } catch (error) {
            console.warn(`[MessagingHub] Reasoning generation failed for ${approach.label}, using default`);
          }

          variations.push({
            id: `${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
            approach: approach.label,
            content: result.content.trim(),
            tone,
            reasoning,
          });
        }
      } catch (error) {
        console.error(`[MessagingHub] Error generating variation "${approach.label}":`, error);
      }
    }

    // Ensure we have at least 3 variations even if some failed
    if (variations.length < 3) {
      // Generate fallback variations
      const fallbackContent = this.generateFallbackMessage(prospect, toolType, industry, tone);
      while (variations.length < 5) {
        variations.push({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          approach: `Variation ${variations.length + 1}`,
          content: fallbackContent,
          tone,
        });
      }
    }

    return variations.slice(0, 5); // Ensure exactly 5
  },

  /**
   * Get approach strategies for different tools
   */
  getApproachesForTool(toolType: ToolType): Array<{ label: string; reasoning: string }> {
    const baseApproaches = [
      { label: 'Direct Value Proposition', reasoning: 'Clearly states the value and benefit upfront' },
      { label: 'Problem-Solution Approach', reasoning: 'Identifies pain point and offers solution' },
      { label: 'Social Proof & Testimonials', reasoning: 'Uses credibility and real examples' },
      { label: 'Question-Based Engagement', reasoning: 'Asks thought-provoking questions' },
      { label: 'Storytelling & Narrative', reasoning: 'Uses relatable stories to connect' },
    ];

    // Customize approaches based on tool type
    switch (toolType) {
      case 'objection':
        return [
          { label: 'Empathy-First Response', reasoning: 'Acknowledges concern before addressing it' },
          { label: 'Reframe the Objection', reasoning: 'Turns objection into opportunity' },
          { label: 'Social Proof Counter', reasoning: 'Shows others who overcame same concern' },
          { label: 'Value Over Objection', reasoning: 'Highlights value that outweighs concern' },
          { label: 'Soft Pivot Approach', reasoning: 'Gently redirects to different angle' },
        ];
      case 'booking':
        return [
          { label: 'Low-Pressure Invitation', reasoning: 'Makes meeting feel optional and easy' },
          { label: 'Value-Focused Meeting', reasoning: 'Emphasizes what they\'ll gain' },
          { label: 'Mutual Benefit Frame', reasoning: 'Positions as collaboration, not sales' },
          { label: 'Urgency Without Pressure', reasoning: 'Creates gentle time sensitivity' },
          { label: 'Convenience-First', reasoning: 'Makes scheduling effortless' },
        ];
      case 'revival':
        return [
          { label: 'Warm Reconnection', reasoning: 'Friendly check-in without pressure' },
          { label: 'New Value Offer', reasoning: 'Presents something new to re-engage' },
          { label: 'Curiosity Hook', reasoning: 'Uses intrigue to restart conversation' },
          { label: 'Success Story Share', reasoning: 'Shows progress others made' },
          { label: 'Personalized Update', reasoning: 'Shares relevant news or changes' },
        ];
      default:
        return baseApproaches;
    }
  },

  /**
   * Get detailed approach-specific instructions for each variation
   */
  getApproachInstructions(approachLabel: string, toolType: ToolType): string {
    const instructions: Record<string, string> = {
      'Direct Value Proposition': 'Start with the main benefit immediately. Be clear and upfront about what they\'ll gain. Use concrete benefits, not vague promises. Example opening: "I have something that can help you [specific benefit]..."',
      'Problem-Solution Approach': 'First acknowledge their pain point or challenge. Show deep understanding. Then present your solution as the answer. Example: "I noticed you mentioned [problem]. Here\'s exactly how I can help..."',
      'Social Proof & Testimonials': 'Lead with real examples and results. Use phrases like "Many people like you have..." or "Just last week, someone similar achieved..." Include specific numbers and outcomes.',
      'Question-Based Engagement': 'Start with a thought-provoking question that makes them reflect. Example: "Have you ever wondered how to [achieve goal] without [common obstacle]?" or "What if you could [benefit]?"',
      'Storytelling & Narrative': 'Use a short, relatable story or scenario. Make it personal and emotional. Example: "I remember when I was in your exact situation..." Connect to their experience emotionally.',
      'Empathy-First Response': 'Acknowledge their concern or situation deeply. Show you truly understand their perspective. Then address it with solutions. Example: "I totally get why you\'d feel that way. Many others felt the same, and here\'s what helped..."',
      'Reframe the Objection': 'Turn their concern into a strength or opportunity. Change the perspective completely. Example: "Actually, that\'s exactly why this works so well for people like you..." or "What you see as [objection] is actually [benefit]..."',
      'Social Proof Counter': 'Share specific stories of people who had the exact same concern and how they overcame it. Use names, results, and concrete examples. Show it\'s not only possible but common.',
      'Value Over Objection': 'Focus on what they\'ll gain that far outweighs their concern. Use ROI, benefits, long-term outcomes. Make the value so clear it overshadows the objection. Use numbers if possible.',
      'Soft Pivot Approach': 'Gently redirect to a completely different angle without dismissing their concern. Example: "I hear you, and that\'s valid. Actually, let me share a different perspective you might find interesting..." Make it feel natural.',
      'Low-Pressure Invitation': 'Make the meeting/invitation sound completely optional and effortless. Example: "No pressure at all, but if you\'re curious, I\'d love to share..." Use soft, permission-based language. Remove all sense of obligation.',
      'Value-Focused Meeting': 'Emphasize exactly what they\'ll learn, discover, or gain from the meeting. Be very specific. Example: "In just 15 minutes, you\'ll discover [specific insight/benefit]..." or "I\'ll share [specific value] that could [specific outcome]..."',
      'Mutual Benefit Frame': 'Position the interaction as true collaboration where both parties benefit. Example: "I think we could both benefit from connecting..." or "I believe there\'s value for both of us in..." Make it feel like a partnership, not sales.',
      'Urgency Without Pressure': 'Create gentle time sensitivity that feels helpful, not manipulative. Example: "I have a few slots this week, if you\'re interested..." or "This opportunity is available until [date], just wanted to let you know..." Keep it informational and helpful.',
      'Convenience-First': 'Make scheduling feel completely effortless. Remove all friction and barriers. Example: "Whatever works for you - morning, afternoon, evening, or even weekend..." or "We can do it in 10 minutes, whatever\'s easiest..."',
      'Warm Reconnection': 'Start with a genuine, friendly check-in. Reference something from past interaction if possible. Example: "Hi [Name]! Hope you\'re doing well. I wanted to check in because [reason]..." Show you remember and care.',
      'New Value Offer': 'Present something genuinely new or updated since last contact. Example: "Since we last talked, I\'ve developed [new thing]..." or "I have something new that might interest you - [specific new value]..." Make it exciting but real.',
      'Curiosity Hook': 'Create genuine intrigue and curiosity. Example: "I have some exciting news that might change your mind..." or "Something happened that made me think of you..." or "I discovered something you might find interesting..."',
      'Success Story Share': 'Share specific results others achieved. Use numbers, names, and concrete outcomes. Make it relatable to their situation. Example: "John achieved [result] in just [timeframe] using this approach..."',
      'Personalized Update': 'Share news or updates relevant to what they mentioned. Example: "You mentioned [interest/concern], so I wanted to share [relevant update]..." Show you remember and care about their specific situation.',
    };
    
    return instructions[approachLabel] || `Use the "${approachLabel}" core strategy to craft a compelling, unique message with distinct structure and emotional angle.`;
  },

  /**
   * Build system prompt for AI generation
   * ONLY uses AI System Instructions - NO Company/Product Intelligence
   */
  buildSystemPrompt(
    prospect: ProspectContext,
    toolType: ToolType,
    industry: ExtendedIndustry,
    tone: MessageTone,
    scoutScore?: number,
    leadTemperature?: string,
    aiSystemInstructions?: string
  ): string {
    const industryContext = this.getIndustryContext(industry);
    const toneGuidance = this.getToneGuidance(tone);
    const scoreContext = scoutScore 
      ? `Prospect has a ScoutScore of ${scoutScore}/100 (${leadTemperature || 'unknown'} lead). `
      : '';
    
    // AI System Instructions are the PRIMARY and ONLY knowledge source
    const instructionsSection = aiSystemInstructions && aiSystemInstructions.trim()
      ? `\n\n=== YOUR AI SYSTEM INSTRUCTIONS (PRIMARY KNOWLEDGE SOURCE) ===\n${aiSystemInstructions}\n=== END OF AI SYSTEM INSTRUCTIONS ===\n\n`
      : '\n\nNOTE: No custom AI System Instructions found. Use general best practices.\n\n';
    
    return `You are an expert sales messaging AI for the Filipino market. Your goal is to generate highly personalized, effective messages.

CRITICAL: Your ONLY source of knowledge about the company, products, services, and messaging guidelines is the "AI System Instructions" section below. Do NOT use or reference any company intelligence, product intelligence, or auto-synced data UNLESS it is explicitly mentioned in your AI System Instructions.

${instructionsSection}

CONTEXT:
- Industry: ${industryContext.name}
- Tone: ${toneGuidance}
- ${scoreContext}
- Prospect: ${prospect.full_name}${prospect.company_name ? ` at ${prospect.company_name}` : ''}
${prospect.pain_points?.length ? `- Pain Points: ${prospect.pain_points.join(', ')}` : ''}
${prospect.interests?.length ? `- Interests: ${prospect.interests.join(', ')}` : ''}
${prospect.last_interaction_days_ago ? `- Last contact: ${prospect.last_interaction_days_ago} days ago` : ''}

REQUIREMENTS:
- Write in Taglish (mix of English and Tagalog) or English based on context
- Be authentic, warm, and Filipino-friendly
- Keep messages concise (under 150 words for text, under 300 words for email)
- Use industry-specific language and examples
- Make it personal and specific to this prospect
- Include appropriate call-to-action
- Match the ${tone} tone throughout
- STRICTLY follow the AI System Instructions above for all company/product/service information
- Do NOT invent or assume any company details not in your AI System Instructions
- Each variation MUST be completely unique with different opening, structure, emotional angle, and closing

INDUSTRY GUIDELINES:
${industryContext.guidelines}

IMPORTANT: The user will request 5 variations. Each variation MUST be completely different:
- Different opening hook/line
- Different message structure (story, question, statement, etc.)
- Different emotional angle (empathy, excitement, curiosity, trust, etc.)
- Different persuasion technique (benefits, social proof, urgency, value, etc.)
- Different word choice and phrasing
- Different closing approach

GENERATE messages that feel natural, conversational, and effective for the Filipino market.`;
  },

  /**
   * Build user prompt for specific approach with detailed instructions
   */
  buildUserPrompt(
    approach: { label: string; reasoning: string },
    prospect: ProspectContext,
    toolType: ToolType,
    scoutScore?: number,
    leadTemperature?: string,
    industry?: ExtendedIndustry,
    tone?: MessageTone
  ): string {
    const toolContext = this.getToolContext(toolType);
    
    // Adapt message style based on ScoutScore (integrated into approach instructions)
    const scoreAdaptation = scoutScore 
      ? scoutScore >= 70 
        ? 'HOT LEAD (Score: ' + scoutScore + '/100) - High interest detected. Be confident, direct, and focus on closing. Move quickly to next steps. Use assertive language and clear CTAs.'
        : scoutScore >= 40
        ? 'WARM LEAD (Score: ' + scoutScore + '/100) - Moderate interest. Build rapport, provide value, and gently guide toward action. Balance relationship-building with progress.'
        : 'COLD LEAD (Score: ' + scoutScore + '/100) - Low interest. Be nurturing, educational, and focus on building trust without pressure. Start with value, avoid pushing.'
      : 'Adapt the message based on the prospect\'s engagement level and signals.';
    
    // Industry-specific personalization
    const industryPersonality = industry === 'mlm'
      ? 'Use Filipino entrepreneurial language: "sideline", "extra income", "mag-business". Focus on flexibility and community.'
      : industry === 'insurance'
      ? 'Emphasize protection, security, and family values. Use terms like "proteksyon", "kapamilya", "future planning".'
      : industry === 'real_estate'
      ? 'Focus on investment, stability, and generational wealth. Use terms like "investment", "pamana", "legacy".'
      : 'Use industry-appropriate language and examples.';
    
    // Tone-specific instructions
    const toneInstructions = tone === 'friendly'
      ? 'Write like you\'re talking to a close friend. Use casual language, emojis if appropriate, show genuine care.'
      : tone === 'professional'
      ? 'Maintain professional distance but remain warm. Use proper grammar, avoid slang, be respectful.'
      : tone === 'warm'
      ? 'Show empathy and understanding. Use personal touches, show you care about their situation.'
      : 'Be direct and to the point. No fluff, clear value proposition.';
    
    // Approach-specific detailed instructions
    const approachInstructions = this.getApproachInstructions(approach.label, toolType);
    
    return `Generate a UNIQUE message using the "${approach.label}" approach. This message must be DIFFERENT from other variations.

APPROACH DETAILS:
- Approach Name: "${approach.label}"
- Core Strategy: ${approach.reasoning}
- Specific Tactics: ${approachInstructions}

MESSAGE REQUIREMENTS:
- Message Type: ${toolContext.name}
- ${toolContext.description}
- Score Adaptation: ${scoreAdaptation}
- Industry Style: ${industryPersonality}
- Tone Style: ${toneInstructions}

PROSPECT CONTEXT:
- Name: ${prospect.full_name}
${prospect.company_name ? `- Company: ${prospect.company_name}` : ''}
${scoutScore !== undefined ? `- ScoutScore: ${scoutScore}/100 (${leadTemperature || 'unknown'} lead)` : ''}
${prospect.pain_points?.length ? `- Pain Points: ${prospect.pain_points.join(', ')}` : ''}
${prospect.interests?.length ? `- Interests: ${prospect.interests.join(', ')}` : ''}
${prospect.last_interaction_days_ago !== undefined ? `- Last Contact: ${prospect.last_interaction_days_ago} days ago` : ''}

CRITICAL: Make this message completely UNIQUE. Use a different:
- Opening hook/line
- Message structure
- Emotional angle
- Persuasion technique
- Closing approach

Generate the FULL message content (not just a draft) following EXACTLY the "${approach.label}" approach. Make it personal, specific, and highly effective.`;
  },

  /**
   * Get detailed approach-specific instructions for each variation
   */
  getApproachInstructions(approachLabel: string, toolType: ToolType): string {
    const instructions: Record<string, string> = {
      'Direct Value Proposition': 'Start with the main benefit. Be clear and upfront. Example opening: "I have something that can help you [benefit]..." Use data/numbers if available.',
      'Problem-Solution Approach': 'Identify their pain point first. Show understanding. Then present your solution. Example: "I noticed you mentioned [problem]. Here\'s how I can help..."',
      'Social Proof & Testimonials': 'Lead with real examples. Use phrases like "Many people like you..." or "Just last week, someone similar..." Include specific results.',
      'Question-Based Engagement': 'Start with a thought-provoking question. Make them think. Example: "Have you ever wondered how to [achieve goal] without [common obstacle]?"',
      'Storytelling & Narrative': 'Use a short, relatable story. Make it personal. Example: "I remember when I was in your situation..." Connect to their experience.',
      'Empathy-First Response': 'Acknowledge their concern deeply. Show you understand. Then address it. Example: "I totally get why you\'d feel that way. Here\'s what helped others..."',
      'Reframe the Objection': 'Turn their concern into a strength or opportunity. Example: "Actually, that\'s exactly why this works..." Change the perspective.',
      'Social Proof Counter': 'Share stories of people who had the same concern and succeeded. Use specific examples. Show it\'s possible.',
      'Value Over Objection': 'Focus on what they\'ll gain that\'s bigger than their concern. Use ROI, benefits, outcomes. Make value clear.',
      'Soft Pivot Approach': 'Gently redirect to a different angle. Don\'t force. Example: "I hear you. Actually, let me share a different perspective..."',
      'Low-Pressure Invitation': 'Make it sound optional and easy. Example: "No pressure at all, but if you\'re curious, I\'d love to share..." Use soft language.',
      'Value-Focused Meeting': 'Emphasize what they\'ll learn/gain from the meeting. Be specific. Example: "In just 15 minutes, you\'ll discover..."',
      'Mutual Benefit Frame': 'Position as collaboration. Example: "I think we could both benefit from..." Make it feel like a partnership.',
      'Urgency Without Pressure': 'Create gentle time sensitivity. Example: "I have a few slots this week..." or "This offer is available until..." But keep it soft.',
      'Convenience-First': 'Make scheduling feel effortless. Example: "Whatever works for you - morning, afternoon, or evening..." Remove all friction.',
      'Warm Reconnection': 'Start with a friendly check-in. Reference past interaction. Example: "Hi [Name]! Hope you\'re doing well. I wanted to check in..."',
      'New Value Offer': 'Present something genuinely new. Example: "Since we last talked, I\'ve developed..." or "I have something new that might interest you..."',
      'Curiosity Hook': 'Create intrigue. Example: "I have some exciting news that might change your mind..." or "Something happened that made me think of you..."',
      'Success Story Share': 'Share specific results others achieved. Use numbers and names if possible. Make it relatable.',
      'Personalized Update': 'Share relevant news or changes. Example: "You mentioned [interest], so I wanted to share..." Make it personal.',
    };
    
    return instructions[approachLabel] || 'Use the core approach strategy to craft a compelling, unique message.';
  },

  /**
   * Get industry-specific context
   */
  getIndustryContext(industry: ExtendedIndustry): { name: string; guidelines: string } {
    const contexts: Record<ExtendedIndustry, { name: string; guidelines: string }> = {
      mlm: {
        name: 'MLM / Network Marketing',
        guidelines: '- Focus on income opportunity, side hustle, extra income\n- Use Filipino phrases like "sideline", "extra income", "mag-business"\n- Emphasize low barrier to entry and mentorship\n- Mention team support and community',
      },
      insurance: {
        name: 'Insurance',
        guidelines: '- Focus on protection, security, peace of mind\n- Emphasize family protection (kaka-anak, OFW support)\n- Use Filipino values: family-first, planning ahead\n- Mention affordability and flexible payment',
      },
      real_estate: {
        name: 'Real Estate',
        guidelines: '- Focus on investment, home ownership, future security\n- Emphasize value appreciation and rental income\n- Use terms like "pamana", "investment property"\n- Highlight location benefits and developer reputation',
      },
      ecommerce: {
        name: 'E-commerce / Online Selling',
        guidelines: '- Focus on online business, dropshipping, reselling\n- Emphasize low capital, work-from-home flexibility\n- Use terms like "online store", "COD", "reseller"\n- Highlight product quality and earning potential',
      },
      coaching: {
        name: 'Coaching / Consulting',
        guidelines: '- Focus on personal growth, skills development, transformation\n- Emphasize mentorship, accountability, results\n- Use terms like "mentor", "growth", "breakthrough"\n- Highlight success stories and proven methods',
      },
      clinic: {
        name: 'Medical Clinic / Healthcare',
        guidelines: '- Focus on health, wellness, professional care\n- Emphasize quality service, experienced doctors\n- Use medical terms appropriately\n- Highlight convenience and care quality',
      },
      loans: {
        name: 'Lending / Financial Services',
        guidelines: '- Focus on quick approval, flexible terms, solutions\n- Emphasize ease, convenience, support\n- Use terms like "mabilis na approval", "flexible payment"\n- Highlight trust, security, and transparency',
      },
      auto: {
        name: 'Automotive / Car Sales',
        guidelines: '- Focus on vehicle features, financing options, value\n- Emphasize reliability, warranty, after-sales\n- Use terms like "cash or installment", "trade-in"\n- Highlight fuel efficiency and safety',
      },
      franchise: {
        name: 'Franchise Business',
        guidelines: '- Focus on proven system, support, branding\n- Emphasize low risk, established model\n- Use terms like "proven system", "full support"\n- Highlight ROI and training',
      },
      saas: {
        name: 'Software as a Service',
        guidelines: '- Focus on automation, efficiency, growth\n- Emphasize ROI, time-saving, scalability\n- Use tech terms appropriately\n- Highlight integration and support',
      },
      travel: {
        name: 'Travel & Tourism',
        guidelines: '- Focus on experiences, memories, value packages\n- Emphasize convenience, good deals\n- Use terms like "all-in package", "best price"\n- Highlight destinations and inclusions',
      },
      beauty: {
        name: 'Beauty & Cosmetics',
        guidelines: '- Focus on confidence, quality products, results\n- Emphasize natural ingredients, affordability\n- Use terms like "glow", "natural", "affordable"\n- Highlight before/after results',
      },
      online_seller: {
        name: 'Online Selling',
        guidelines: '- Focus on products, deals, convenience\n- Emphasize COD, fast shipping, quality\n- Use terms like "COD available", "free shipping"\n- Highlight product benefits and reviews',
      },
      service: {
        name: 'Service Provider',
        guidelines: '- Focus on expertise, reliability, results\n- Emphasize professional service, trust\n- Use terms like "professional", "reliable", "quality"\n- Highlight experience and testimonials',
      },
      finance: {
        name: 'Financial Services',
        guidelines: '- Focus on financial growth, security, planning\n- Emphasize expertise, trust, results\n- Use financial terms appropriately\n- Highlight track record and transparency',
      },
      crypto: {
        name: 'Cryptocurrency / Blockchain',
        guidelines: '- Focus on investment opportunity, technology\n- Emphasize education, community, potential\n- Use crypto terms appropriately\n- Highlight security and growth potential',
      },
      health_wellness: {
        name: 'Health & Wellness',
        guidelines: '- Focus on health improvement, lifestyle change\n- Emphasize natural, sustainable, results\n- Use health terms appropriately\n- Highlight transformation stories',
      },
      general: {
        name: 'General Business',
        guidelines: '- Focus on value, solutions, benefits\n- Emphasize relationship, trust, results\n- Use professional yet friendly tone\n- Highlight unique selling points',
      },
    };

    return contexts[industry] || contexts.general;
  },

  /**
   * Get tone guidance
   */
  getToneGuidance(tone: MessageTone): string {
    const guidance: Record<MessageTone, string> = {
      friendly: 'Warm, conversational, like talking to a friend. Use casual language, emojis if appropriate, and show genuine care.',
      professional: 'Polite, business-appropriate, respectful. Use proper grammar, avoid slang, maintain professional distance.',
      warm: 'Personal, caring, empathetic. Show understanding and connection. Use "po" when appropriate for respect.',
      direct: 'Clear, straightforward, no-nonsense. Get to the point quickly, be specific, avoid fluff.',
      casual: 'Relaxed, informal, approachable. Use everyday language, be conversational, feel natural.',
    };
    return guidance[tone] || guidance.friendly;
  },

  /**
   * Get tool-specific context
   */
  getToolContext(toolType: ToolType): { name: string; description: string } {
    const contexts: Record<ToolType, { name: string; description: string }> = {
      objection: {
        name: 'Objection Handler',
        description: 'Address and overcome objections while maintaining relationship. Be empathetic, understanding, and solution-focused.',
      },
      booking: {
        name: 'Book Meeting',
        description: 'Invite prospect to a meeting or call. Make it easy, valuable, and low-pressure. Include time options if possible.',
      },
      coaching: {
        name: 'Elite Coaching Message',
        description: 'Provide strategic guidance and insights. Be helpful, expert, and value-driven. Not salesy.',
      },
      message: {
        name: 'Smart Outreach Message',
        description: 'Initial or follow-up message to engage prospect. Personal, relevant, and includes clear value proposition.',
      },
      revival: {
        name: 'Lead Revival',
        description: 'Re-engage a prospect who hasn\'t responded. Be warm, provide new value, and reignite interest without being pushy.',
      },
      referral: {
        name: 'Referral Request',
        description: 'Ask for referrals or introductions. Make it easy, valuable for both parties, and show appreciation.',
      },
      social: {
        name: 'Social Media Reply',
        description: 'Reply to social media comment or post. Be authentic, engaging, and appropriate for public context.',
      },
      call: {
        name: 'Call Script',
        description: 'Script for phone call. Include opening, key points, questions to ask, and closing. Be conversational not robotic.',
      },
    };
    return contexts[toolType] || contexts.message;
  },

  /**
   * Generate reasoning explanation for why a variation works
   */
  async generateVariationReasoning(
    approach: { label: string; reasoning: string },
    prospect: ProspectContext,
    scoutScore?: number,
    leadTemperature?: string,
    toolType?: ToolType,
    industry?: ExtendedIndustry,
    tone?: MessageTone
  ): Promise<string> {
    try {
      const scoreContext = scoutScore 
        ? `Prospect has ScoutScore ${scoutScore}/100 (${leadTemperature} lead). `
        : '';
      
      const reasoningPrompt = `Explain why the "${approach.label}" approach works for this message:

Approach: ${approach.label}
Core Strategy: ${approach.reasoning}
${scoreContext}${prospect.pain_points?.length ? `Pain Points: ${prospect.pain_points.join(', ')}` : ''}
${industry ? `Industry: ${industry}` : ''}
${tone ? `Tone: ${tone}` : ''}

Provide a brief 1-2 sentence explanation of why this approach is effective for this specific prospect and situation. Be specific and practical.`;

      const result = await aiOrchestrator.generate({
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert sales strategist. Provide concise, practical explanations for why specific messaging approaches work.' 
          },
          { role: 'user', content: reasoningPrompt },
        ],
        config: {
          userId: prospect.id,
          action: 'ai_message',
          model: 'gpt-4o',
          temperature: 0.5,
          maxTokens: 150,
          autoSelectModel: true,
          skipCoinCheck: true, // Reasoning generation doesn't need coin check (included in main generation)
          coinCost: 0,
        },
      });

      if (result.success && result.content) {
        return result.content.trim();
      }
    } catch (error) {
      console.warn('[MessagingHub] Error generating reasoning:', error);
    }
    
    return approach.reasoning; // Fallback to original reasoning
  },

  /**
   * Generate fallback message if AI fails
   */
  generateFallbackMessage(
    prospect: ProspectContext,
    toolType: ToolType,
    industry: ExtendedIndustry,
    tone: MessageTone
  ): string {
    const greeting = tone === 'professional' 
      ? `Hi ${prospect.full_name},`
      : `Hi ${prospect.full_name}!`;

    const industryPhrase = industry === 'mlm' 
      ? 'I have an opportunity that might interest you'
      : industry === 'insurance'
      ? 'I\'d like to share something that could help secure your family\'s future'
      : 'I have something that might be valuable for you';

    return `${greeting}

${industryPhrase}. Would you be open to a quick conversation?

Let me know when works best for you.

Thanks!`;
  },

  /**
   * Save all variations to message library
   */
  async saveVariationsToLibrary(
    userId: string,
    prospectId: string,
    toolType: ToolType,
    industry: ExtendedIndustry,
    tone: MessageTone,
    variations: MessageVariation[],
    prospect: ProspectContext
  ): Promise<void> {
    const savePromises = variations.map((variation, index) =>
      supabase.from('ai_messages_library').insert({
        user_id: userId,
        prospect_id: prospectId,
        prospect_name: prospect.full_name,
        title: `${toolType.charAt(0).toUpperCase() + toolType.slice(1)} - ${variation.approach} - ${prospect.full_name}`,
        message_content: variation.content,
        message_type: toolType,
        language: 'english',
        scenario: industry,
        tone: tone,
        approach: variation.approach,
        variation_number: index + 1,
        is_favorite: false,
        times_used: 0,
        metadata: {
          scout_score: prospect.scout_score,
          lead_temperature: prospect.lead_temperature,
          reasoning: variation.reasoning,
          generated_at: new Date().toISOString(),
        },
      })
    );

    await Promise.all(savePromises);
  },

  /**
   * Generate insights from prospect context and score
   */
  generateInsights(
    prospect: ProspectContext,
    scoutScore?: number,
    leadTemperature?: string
  ): string[] {
    const insights: string[] = [];

    if (scoutScore !== undefined) {
      if (scoutScore >= 70) {
        insights.push('High-scoring prospect - prioritize follow-up');
      } else if (scoutScore >= 40) {
        insights.push('Medium-scoring prospect - nurture relationship');
      } else {
        insights.push('Lower-scoring prospect - focus on value-building');
      }
    }

    if (leadTemperature) {
      if (leadTemperature === 'hot') {
        insights.push('Hot lead - ready for direct close');
      } else if (leadTemperature === 'warm') {
        insights.push('Warm lead - continue nurturing');
      } else {
        insights.push('Cold lead - build rapport first');
      }
    }

    if (prospect.last_interaction_days_ago !== undefined) {
      if (prospect.last_interaction_days_ago > 30) {
        insights.push('Re-engagement needed - use revival approach');
      }
    }

    if (prospect.pain_points?.length) {
      insights.push(`Key pain points: ${prospect.pain_points.slice(0, 2).join(', ')}`);
    }

    return insights;
  },
};


