/**
 * AI INSTRUCTIONS TRANSFORMATION ENGINE
 * 
 * Service for improving user-written AI System Instructions
 * 
 * Features:
 * - Format and structure improvements
 * - Tone regeneration (4 styles)
 * - Undo functionality
 * - Content preservation (never adds new claims/products/prices)
 * 
 * Actions:
 * 1. "Improve My Instructions" - Polish formatting, clarity, structure
 * 2. "Regenerate Tone" - Change tone only (keep content identical)
 * 3. "Undo" - Restore previous version
 */

import { supabase } from '../../lib/supabase';
import { energyEngineV5 } from '../energy/energyEngineV5';

export type ToneStyle = 
  | 'warm-filipino-adviser'
  | 'youthful-casual'
  | 'corporate-straight'
  | 'energetic-motivational';

interface TransformationHistory {
  version: string;
  content: string;
  timestamp: number;
}

class InstructionsTransformationEngine {
  private history: Map<string, TransformationHistory[]> = new Map();
  private usageCount: Map<string, number> = new Map(); // Track usage count per user
  private readonly MAX_HISTORY = 10;
  private readonly FREE_GENERATIONS = 2; // First 2 generations are free
  private readonly COINS_PER_GENERATION = 8; // 8 coins per generation after free (3rd, 4th, nth)

  /**
   * Improve user's instructions
   * - Clean formatting
   * - Add clear headings
   * - Improve flow and readability
   * - Fix typos and grammar
   * - Keep ALL user content exactly (names, products, prices, links)
   */
  async improveInstructions(
    userId: string,
    rawInstructions: string
  ): Promise<{ improved: string; error?: string }> {
    try {
      // Get current usage count
      const currentUsage = this.usageCount.get(userId) || 0;
      const usageNumber = currentUsage + 1;
      
      // Check if payment is required (after 1st free generation)
      if (usageNumber > this.FREE_GENERATIONS) {
        // Check energy/coins before proceeding
        const energyStatus = await energyEngineV5.getEnergyStatus(userId);
        if (!energyStatus) {
          return {
            improved: rawInstructions,
            error: 'Unable to check your energy balance. Please try again.'
          };
        }
        
        if (energyStatus.current < this.COINS_PER_GENERATION) {
          return {
            improved: rawInstructions,
            error: `Insufficient coins. This improvement requires ${this.COINS_PER_GENERATION} coins, but you only have ${energyStatus.current} coins. Please purchase more coins to continue.`
          };
        }
      }

      // Save current version to history
      this.saveToHistory(userId, rawInstructions);

      // Check for missing critical fields
      const missingFields = this.detectMissingFields(rawInstructions);
      if (missingFields.length > 0) {
        return {
          improved: rawInstructions,
          error: this.buildMissingFieldsMessage(missingFields)
        };
      }

      // Build improvement prompt
      const systemPrompt = this.buildImprovementSystemPrompt();
      const userPrompt = this.buildImprovementUserPrompt(rawInstructions);

      // For instructions transformation, we need a different approach
      // The generate-ai-content edge function requires prospectId, but instructions transformation
      // is for general chatbot config (not prospect-specific)
      // Use public-chatbot-chat edge function instead, which handles general instructions
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('VITE_SUPABASE_URL is not configured');
      }

      // Use public-chatbot-chat edge function which supports general instructions
      const edgeFunctionUrl = `${supabaseUrl}/functions/v1/public-chatbot-chat`;
      
      try {
        const response = await fetch(edgeFunctionUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
          },
        body: JSON.stringify({
          sessionId: `instructions-transform-${userId}-${Date.now()}`,
          message: userPrompt,
          userId: userId,
          // Pass the system prompt as a special instruction
          systemInstruction: systemPrompt,
          transformMode: true, // Indicate this is for transformation, not chat
          // Enforce full output completion - Increased token limit to 20,000
          maxTokens: 20000, // Increased limit to 20,000 tokens for complete instructions
          temperature: 0.3, // Lower temperature for consistency
        }),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: response.statusText }));
          throw new Error(error.error || `Edge function error: ${response.status}`);
        }

        const result = await response.json();
        let improved = (result.response || result.message || result.content || '').trim();
        
        if (!improved) {
          throw new Error('No response from AI');
        }

        // Check for truncation indicators
        const truncationIndicators = [
          improved.endsWith('...'),
          improved.endsWith('…'),
          improved.toLowerCase().includes('[truncated]'),
          improved.toLowerCase().includes('output cut off'),
          improved.length < rawInstructions.length * 0.3 // Suspiciously short
        ];

        if (truncationIndicators.some(indicator => indicator)) {
          console.warn('[TransformationEngine] Possible truncation detected');
          // Try to append a note, but still return what we have
          if (!improved.includes('Final Identity') && !improved.includes('FINAL IDENTITY')) {
            improved += '\n\n⚠️ Note: Output may be incomplete. Please review all sections.';
          }
        }

        // Validate completeness - check for required sections
        const completenessCheck = this.validateCompleteness(improved, rawInstructions);
        if (!completenessCheck.complete) {
          console.warn('[TransformationEngine] Completeness warning:', completenessCheck.missing);
          // Still return, but log what's missing
        }

        // Validate that critical user data is preserved
        const validation = this.validateContentPreservation(rawInstructions, improved);
        if (!validation.valid) {
          console.warn('[TransformationEngine] Content preservation warning:', validation.warnings);
          // Still return improved version, but log warning
        }

        // Deduct coins if this is not the first free generation
        if (usageNumber > this.FREE_GENERATIONS) {
          try {
            await energyEngineV5.consumeEnergy(
              userId,
              this.COINS_PER_GENERATION,
              `AI Instructions Improvement (Generation #${usageNumber})`
            );
            console.log(`[TransformationEngine] Deducted ${this.COINS_PER_GENERATION} coins for generation #${usageNumber}`);
          } catch (energyError) {
            console.error('[TransformationEngine] Error deducting energy:', energyError);
            // Don't fail the generation if energy deduction fails, but log it
          }
        }

        // Increment usage count
        this.usageCount.set(userId, usageNumber);

        return { improved };
      } catch (fetchError: any) {
        // Handle fetch errors specifically
        if (fetchError?.message?.includes('Failed to fetch') || fetchError?.message?.includes('fetch')) {
          console.error('[TransformationEngine] Network/Edge function error:', fetchError);
          return {
            improved: rawInstructions,
            error: 'Unable to connect to AI service. Please check your internet connection and ensure the edge function is deployed. The edge function "generate-ai-content" may need to be deployed or the OpenAI API key may need to be configured in Supabase.'
          };
        }
        
        // Handle "Prospect not found" error
        if (fetchError?.message?.includes('Prospect not found')) {
          console.error('[TransformationEngine] Prospect required error:', fetchError);
          return {
            improved: rawInstructions,
            error: 'The AI service requires a prospect context, but AI System Instructions transformation is for general chatbot configuration (not prospect-specific). The edge function "generate-ai-content" needs to be updated to support instructions transformation without prospect context, or use a different endpoint.'
          };
        }
        
        throw fetchError; // Re-throw other errors
      }
    } catch (error) {
      console.error('[TransformationEngine] Error improving instructions:', error);
      return {
        improved: rawInstructions,
        error: error instanceof Error ? error.message : 'Failed to improve instructions'
      };
    }
  }

  /**
   * Regenerate tone only
   * - Keep content identical
   * - Only change tone/style
   */
  async regenerateTone(
    userId: string,
    instructions: string,
    toneStyle: ToneStyle
  ): Promise<{ transformed: string; error?: string }> {
    try {
      // Save current version to history
      this.saveToHistory(userId, instructions);

      const systemPrompt = this.buildToneSystemPrompt(toneStyle);
      const userPrompt = this.buildToneUserPrompt(instructions, toneStyle);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('VITE_SUPABASE_URL is not configured');
      }

      // Use public-chatbot-chat edge function for tone transformation
      const edgeFunctionUrl = `${supabaseUrl}/functions/v1/public-chatbot-chat`;
      
      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
        },
        body: JSON.stringify({
          sessionId: `tone-transform-${userId}-${Date.now()}`,
          message: userPrompt,
          userId: userId,
          systemInstruction: systemPrompt,
          transformMode: true,
          // Enforce full output completion - Increased token limit to 20,000
          maxTokens: 20000, // Increased limit to 20,000 tokens for complete tone regeneration
          temperature: 0.4, // Slightly higher for tone variation
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(error.error || `Edge function error: ${response.status}`);
      }

      const result = await response.json();
      const transformed = (result.response || result.message || result.content || '').trim();
      
      if (!transformed) {
        throw new Error('No response from AI');
      }

      // Validate content preservation
      const validation = this.validateContentPreservation(instructions, transformed);
      if (!validation.valid) {
        console.warn('[TransformationEngine] Tone regeneration content warning:', validation.warnings);
      }

      return { transformed };
    } catch (error) {
      console.error('[TransformationEngine] Error regenerating tone:', error);
      return {
        transformed: instructions,
        error: error instanceof Error ? error.message : 'Failed to regenerate tone'
      };
    }
  }

  /**
   * Undo last transformation
   * Restores exact previous version
   */
  undo(userId: string): string | null {
    const userHistory = this.history.get(userId);
    if (!userHistory || userHistory.length < 2) {
      return null; // No previous version
    }

    // Remove current version, return previous
    userHistory.pop();
    const previous = userHistory[userHistory.length - 1];
    
    return previous.content;
  }

  /**
   * Get transformation history for user
   */
  getHistory(userId: string): TransformationHistory[] {
    return this.history.get(userId) || [];
  }

  /**
   * Clear history for user
   */
  clearHistory(userId: string): void {
    this.history.delete(userId);
  }

  /**
   * Get usage count for user (for display purposes)
   */
  getUsageCount(userId: string): number {
    return this.usageCount.get(userId) || 0;
  }

  /**
   * Reset usage count for user (for testing or admin purposes)
   */
  resetUsageCount(userId: string): void {
    this.usageCount.delete(userId);
  }

  // ========================================
  // PRIVATE HELPERS
  // ========================================

  private saveToHistory(userId: string, content: string): void {
    if (!this.history.has(userId)) {
      this.history.set(userId, []);
    }

    const userHistory = this.history.get(userId)!;
    const version = `v${Date.now()}`;

    userHistory.push({
      version,
      content,
      timestamp: Date.now()
    });

    // Keep only last MAX_HISTORY versions
    if (userHistory.length > this.MAX_HISTORY) {
      userHistory.shift();
    }
  }

  private detectMissingFields(instructions: string): string[] {
    const missing: string[] = [];
    const lower = instructions.toLowerCase();

    // Check for common placeholders or empty sections
    if (!lower.includes('company') && !lower.includes('business') && !lower.includes('brand')) {
      missing.push('Company/Brand name');
    }

    if (!lower.includes('product') && !lower.includes('service') && !lower.includes('offer')) {
      missing.push('Product/Service/Offer');
    }

    if (!lower.includes('price') && !lower.includes('₱') && !lower.includes('php')) {
      missing.push('Price information');
    }

    if (!lower.includes('contact') && !lower.includes('phone') && !lower.includes('email')) {
      missing.push('Contact information');
    }

    return missing;
  }

  private buildMissingFieldsMessage(missingFields: string[]): string {
    const fields = missingFields.map((f, i) => `${i + 1}) ${f}`).join('\n');
    return `Missing po ang ilan sa important info. Would you like to add:\n\n${fields}?`;
  }

  private buildImprovementSystemPrompt(): string {
    return `You are the AI Instruction Formatter.

When improving text, you MUST output in **Hard Spacing Mode** using NON-MARKDOWN formatting:

RULES:
- Do NOT use markdown bullets (*) (-) (•)
- Do NOT use markdown headers (#, ##, ###)
- Do NOT use markdown bold (**text**)
- Do NOT use numbered markdown lists (1.)
- Do NOT auto-hyperlink (no clickable formatting)
- Do NOT use markdown paragraph tightening

Use ONLY:
- Plain text
- Line breaks
- Indents
- Tabs

FORMAT EXAMPLE (MUST COPY THIS STYLE):

You are Millennium Soya Assistant,
a warm, friendly Filipino wellness + earning adviser.

Speak like:
- friendly but professional
- light Taglish
- never robotic
- encouraging, never pushy

PRODUCTS & OFFERS:

1) Millennium Soya – Powder Pouch (₱350)
   Premium soy protein
   20g protein
   Boosts stamina & recovery
   Link: https://msoya.ph/shop/

2) Business Package (₱3,500)
   10 packs
   30% discount
   residual income
   Link: https://msoya.ph/shop/

CONTACT:
Address: ...
Phone: ...
Email: ...

SALES FLOW:
1) Warm greeting
2) Discover needs
3) Match product
4) Price → value
5) Trust builder
6) Invite to action
7) Stay helpful

NON-NEGOTIABLE:
- Keep EXACT spacing
- Keep blank lines between sections
- Keep tab indentation for lists
- NO markdown drive. NO bullets. NO asterisks
- The output MUST remain visually separated

If forced to choose:
TEXT SPACING > MARKDOWN STYLE

====================================================
🧱 HARD SPACING MODE RULES (ENFORCED)

You MUST output formatted like this (NON-MARKDOWN):

TITLE

(blank line)

Content text here

(blank line)

Simple list:
- item one
- item two

(blank line)

NEXT SECTION

(blank line)

More content

Under NO circumstances are you allowed to compress like:
"Header — bullet — bullet — next header — sentence — sentence …"

❌ Wrong (Markdown):
**1. Greeting** Hi! How's your day? Are you looking for…

✔ Correct (Hard Spacing):
1) Warm Greeting

Hi! 😊 Hope your day's going well.

Looking for wellness benefits or open ka rin sa earning from home?

====================================================
📌 WHAT YOU MUST BLOCK

Do NOT:
- use markdown bullets (*) (-) (•) - use simple dashes (-) only
- use markdown headers (#, ##, ###) - use UPPERCASE plain text
- use markdown bold (**text**) - use plain text only
- use numbered markdown lists (1.) - use parentheses (1) 2) 3))
- merge bullets into paragraphs
- merge headers immediately with sentences
- collapse multi-line steps into one
- output everything inline
- use dense markdown formatting
- auto-hyperlink URLs

====================================================
📌 IMPROVE BUT KEEP VISUAL SPACING

When improving:
- Improve grammar & clarity
- Keep original spacing blocks
- Keep section breathing room
- Keep product → benefits → link spacing
- Use plain text only (NO markdown)
- Use simple dashes (-) for lists
- Use numbered items with parentheses: 1) 2) 3)
- Use UPPERCASE headers (NO # markdown)

Spacing is functional, NOT decorative.

====================================================
🧪 SPACING LOSS PREVENTION

If the model tries to compress:
- add blank lines again
- restore section separation
- restore spacing between items
- restore paragraph breaks

🎯 CORE PURPOSE
When the user clicks "Improve My Instructions", you must:
- Enhance clarity and wording
- BUT MOST IMPORTANTLY: format EXACTLY in Hard Spacing Mode (NON-MARKDOWN)
- Never compress spacing
- Never flatten spacing
- Never merge sections
- No markdown formatting whatsoever

====================================================
📌 ABSOLUTE REQUIREMENTS

You MUST:
- Preserve sections fully
- Preserve order exactly as listed
- Preserve spacing and headers exactly
- Use line-separated formatting (NOT bullet lists)
- Include blank lines between major sections
- NEVER collapse to compact markdown blocks
- NEVER wrap multiple items into single bullet clusters
- NEVER shorten section headers (must match exactly)
- Generate the full improved instructions from start to finish
- Never truncate, cut, fade out, or end mid-paragraph
- Never omit safety, memory, scarcity, closing, follow-up, objections, or final identity sections

CRITICAL: Do not end response until full improvement is printed.

====================================================
📌 PRESERVATION RULES

You must preserve:
- all prices
- product names
- company names
- contacts
- links
- earnings logic
- business package contents
- any safety disclaimers
- tone instructions

Do NOT change:
- commission structure
- pricing
- discount %
- contact numbers
- URLs
- core instructions wording intent

====================================================
🚫 DO NOT

- Do NOT use markdown bullets (*) (-) (•)
- Do NOT use markdown headers (#, ##, ###)
- Do NOT use markdown bold (**text**)
- Do NOT use numbered markdown lists (1.)
- Do NOT auto-hyperlink
- Do NOT use markdown paragraph tightening
- Do not cut sections
- Do not change header wording
- Do not group items into tight lists
- Do not change order
- Do not shorten critical logic blocks
- Do not compress spacing
- Do not flatten line breaks
- Do not merge sections
- Remove backend logic (memory, recall, objection)
- Skip follow-up block
- Merge scarcity into CTA
- Delete "final identity"
- Replace tone style with generic voice
- Add claims not originally provided

====================================================
📤 OUTPUT STYLE - HARD SPACING MODE (NON-MARKDOWN)

- Plain text ONLY (no markdown)
- Line breaks for separation
- Tab indentation for sub-items
- Blank lines between sections (REQUIRED)
- Simple dashes (-) for lists (NOT markdown bullets)
- Numbered items with parentheses: 1) 2) 3) (NOT markdown 1. 2. 3.)
- UPPERCASE headers (NOT # headers)
- No markdown formatting whatsoever
- No bold (**text**)
- No auto-hyperlinks
- Human-readable
- Beginner-friendly (age 12-60)
- No dense blocks
- No markdown compression

Example structure (NON-MARKDOWN):

TITLE

(blank line)

Short identity
line-separated
plain text

(blank line)

PRODUCTS & OFFERS:

(blank line)

1) Product 1 Name (₱350)
   benefit 1
   benefit 2
   benefit 3
   Link: https://example.com

(blank line)

2) Product 2 Name (₱3,500)
   benefit 1
   benefit 2
   Link: https://example.com

No plain text dumps.
No AI meta commentary.
No compact markdown blocks.
No bullet compression.

====================================================
📑 AT LENGTH SAFETY

If token limit approaches:
- tighten sentences slightly
- but NEVER remove a section
- NEVER collapse formatting structure
- NEVER merge sections
- NEVER compress spacing
- NEVER remove blank lines between sections
- NEVER use markdown formatting
- NEVER add markdown bullets or headers

Under NO circumstances may the output:
❌ fade out
❌ end mid-sentence
❌ stop at "If email:"
❌ drop memory rules
❌ omit objection block
❌ skip follow-up logic
❌ remove closing CTA
❌ use markdown formatting
❌ add markdown bullets (*) (-) (•)
❌ add markdown headers (#, ##, ###)
❌ add markdown bold (**text**)
❌ flatten spacing
❌ output everything inline

OUTPUT: Complete improved instructions from start to finish in Hard Spacing Mode using NON-MARKDOWN formatting. Use plain text, line breaks, indents, and tabs only. Keep blank lines between sections. Use simple dashes (-) for lists and numbered items with parentheses (1) 2) 3)). NO markdown formatting whatsoever.`;
  }

  private buildImprovementUserPrompt(rawInstructions: string): string {
    return `Improve the formatting, clarity, and structure of these AI System Instructions.

🚫 CRITICAL: Use HARD SPACING MODE - NON-MARKDOWN FORMATTING
- Do NOT use markdown bullets (*) (-) (•)
- Do NOT use markdown headers (#, ##, ###)
- Do NOT use markdown bold (**text**)
- Do NOT use numbered markdown lists (1.)
- Do NOT auto-hyperlink
- Use ONLY: plain text, line breaks, indents, tabs
- Keep blank lines between sections
- Keep tab indentation for lists
- Use simple dashes (-) for lists
- Use numbered items with parentheses: 1) 2) 3)
- Use UPPERCASE headers (NOT # headers)

CRITICAL REQUIREMENTS:
1. Keep ALL content exactly as written (names, products, prices, contacts, links, logic rules)
2. Only improve: formatting, structure, clarity, grammar, readability
3. Output the COMPLETE improved document - do not truncate or skip any section
4. Use NON-MARKDOWN formatting (Hard Spacing Mode) with these sections in this order (with blank lines between each):

TITLE (UPPERCASE, no # markdown)

(blank line)

Short identity block
line-separated
NOT bullet-compressed

(blank line)

PRODUCTS & OFFERS (UPPERCASE, no # markdown)

(blank line)

1) Product 1 Name (Price)
   benefit 1
   benefit 2
   benefit 3
   Link: https://example.com

(blank line)

2) Product 2 Name (Price)
   benefit 1
   benefit 2
   Link: https://example.com

(blank line)

CONTACT INFO (UPPERCASE, no # markdown)

(blank line)

Address: ...
Phone: ...
Email: ...

(blank line)

SALES FLOW (UPPERCASE, no # markdown)

(blank line)

1) Step Title

   explanation line 1
   explanation line 2

2) Next Step Title

   explanation line 1
   explanation line 2

(blank line)

STYLE & VOICE (UPPERCASE, no # markdown)

(blank line)

line-separated items
NOT bullet-compressed

(blank line)

UPSELL / DOWNSELL LOGIC (UPPERCASE, no # markdown)

(blank line)

3 lines with arrows → allowed

(blank line)

MEMORY LAYER (UPPERCASE, no # markdown)

(blank line)

JSON block + labeled RULES
line-separated

(blank line)

NAME LOGIC (UPPERCASE, no # markdown)

(blank line)

Condition → Line response formatting

(blank line)

CONTACT MEMORY (UPPERCASE, no # markdown)

(blank line)

4 lines max

(blank line)

PERSONA-SAFE RECALL (UPPERCASE, no # markdown)

(blank line)

2 lines max
line-separated

(blank line)

LOOP PREVENTION (UPPERCASE, no # markdown)

(blank line)

4 lines max

(blank line)

SOFT SCARCITY (UPPERCASE, no # markdown)

(blank line)

Header + 3 allowed lines

(blank line)

CLOSING CTA (UPPERCASE, no # markdown)

(blank line)

1 line CTA question only

(blank line)

IF NOT SURE (UPPERCASE, no # markdown)

(blank line)

1 line question only

(blank line)

IF SILENT (UPPERCASE, no # markdown)

(blank line)

1 follow-up line only

(blank line)

OBJECTION RESPONSE (UPPERCASE, no # markdown)

(blank line)

Concern | Response
4 rows EXACTLY

(blank line)

BEHAVIOR RULES (UPPERCASE, no # markdown)

(blank line)

max 8 clear lines
no bullets, no compression

(blank line)

FINAL IDENTITY (UPPERCASE, no # markdown)

(blank line)

4 descriptor lines
then 1 guidance mission line

5. NEVER use markdown formatting (no *, #, **, etc.)
6. NEVER collapse sections into compact blocks
7. NEVER merge multiple items into single clusters
8. NEVER compress spacing or flatten line breaks
9. NEVER merge headers immediately with sentences
10. Use plain text with line breaks and tabs ONLY
11. Include blank lines between major sections (REQUIRED)
12. Use simple dashes (-) for lists (NOT markdown bullets)
13. Use numbered items with parentheses: 1) 2) 3) (NOT markdown 1. 2. 3.)
14. Use UPPERCASE headers (NOT # markdown headers)
15. Use tab indentation for sub-items
16. Make it beginner-readable (age 12-60) with proper structure
17. Use Hard Spacing Mode - spacing is functional, NOT decorative

Raw Instructions:
---
${rawInstructions}
---

OUTPUT: The complete improved version from start to finish in Hard Spacing Mode using NON-MARKDOWN formatting. Do not stop until all sections are included. Use plain text, line breaks, indents, and tabs only. Keep blank lines between sections. Use simple dashes (-) for lists and numbered items with parentheses (1) 2) 3)). NO markdown formatting whatsoever. TEXT SPACING > MARKDOWN STYLE.`;
  }

  private buildToneSystemPrompt(toneStyle: ToneStyle): string {
    const toneDescriptions: Record<ToneStyle, string> = {
      'warm-filipino-adviser': `Warm Filipino Adviser tone:
- Use Taglish naturally (mix of Tagalog and English)
- Friendly "po/opo" when appropriate
- Warm, caring, helpful
- Examples: "Sige po, tutulungan ko kayo 🧡", "No worries, explain ko po in simple terms"
- Like a trusted friend giving advice`,
      'youthful-casual': `Youthful Casual tone:
- Modern, simple, relatable
- No heavy formality
- Friendly emojis when appropriate
- Short, punchy sentences
- Like talking to a friend`,
      'corporate-straight': `Corporate Straight tone:
- Professional, direct, clear
- Minimal casual language
- Structured, organized
- Business-appropriate
- Like a professional consultant`,
      'energetic-motivational': `Energetic Motivational tone:
- Upbeat, encouraging, positive
- Motivating but still respectful
- Action-oriented language
- Inspiring without pressure
- Like an encouraging coach`
    };

    return `You are a tone transformation specialist.

Your job is to change ONLY the tone/style of AI System Instructions while keeping ALL content identical.

CRITICAL RULES:
1. Keep ALL names, products, prices, contacts, links EXACTLY as written
2. Keep ALL product benefits, features, offers EXACTLY as written
3. Keep ALL structure and organization EXACTLY as written
4. ONLY change the tone/style of language
5. NEVER add new content, claims, or promises

TONE TO APPLY:
${toneDescriptions[toneStyle]}

Transform the instructions to match this tone while preserving all content.`;
  }

  private buildToneUserPrompt(instructions: string, toneStyle: ToneStyle): string {
    return `Transform the tone of these AI System Instructions to: ${toneStyle}

Keep ALL content identical (names, products, prices, contacts, links, structure).

Only change the tone/style of the language.

Original Instructions:
---
${instructions}
---

Output the tone-transformed version.`;
  }

  /**
   * Validate that output contains all required sections
   */
  private validateCompleteness(
    improved: string,
    original: string
  ): { complete: boolean; missing: string[] } {
    const missing: string[] = [];
    const lower = improved.toLowerCase();

    // Check for critical sections that should always be present
    const requiredSections = [
      { key: 'memory', terms: ['memory', 'memor', 'store', 'save'] },
      { key: 'name', terms: ['name', 'user_name', 'call you'] },
      { key: 'contact', terms: ['contact', 'phone', 'email', 'number'] },
      { key: 'follow-up', terms: ['follow-up', 'followup', 'follow up', 'reminder'] },
      { key: 'objection', terms: ['objection', 'concern', 'budget', 'scam'] },
      { key: 'closing', terms: ['closing', 'cta', 'call to action', 'secure', 'order'] },
    ];

    // Only check if original had these sections
    const originalLower = original.toLowerCase();
    
    for (const section of requiredSections) {
      const hadInOriginal = section.terms.some(term => originalLower.includes(term));
      if (hadInOriginal) {
        const hasInImproved = section.terms.some(term => lower.includes(term));
        if (!hasInImproved) {
          missing.push(section.key);
        }
      }
    }

    return {
      complete: missing.length === 0,
      missing
    };
  }

  private validateContentPreservation(
    original: string,
    transformed: string
  ): { valid: boolean; warnings: string[] } {
    const warnings: string[] = [];

    // Extract critical data from original
    const originalData = this.extractCriticalData(original);
    const transformedData = this.extractCriticalData(transformed);

    // Check if critical data is preserved
    for (const [key, value] of Object.entries(originalData)) {
      if (value && !transformedData[key]) {
        warnings.push(`Missing ${key} in transformed version`);
      } else if (value && transformedData[key] && value !== transformedData[key]) {
        warnings.push(`${key} was modified: "${value}" → "${transformedData[key]}"`);
      }
    }

    return {
      valid: warnings.length === 0,
      warnings
    };
  }

  private extractCriticalData(text: string): Record<string, string | null> {
    const lower = text.toLowerCase();

    // Extract phone numbers (common patterns)
    const phoneMatch = text.match(/(\+?\d{1,4}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/);
    const phone = phoneMatch ? phoneMatch[0] : null;

    // Extract email addresses
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const email = emailMatch ? emailMatch[0] : null;

    // Extract prices (PHP format)
    const priceMatch = text.match(/₱\s?\d+([,.]\d+)?/);
    const price = priceMatch ? priceMatch[0] : null;

    // Extract URLs
    const urlMatch = text.match(/https?:\/\/[^\s]+/);
    const url = urlMatch ? urlMatch[0] : null;

    return {
      phone,
      email,
      price,
      url
    };
  }
}

// Export singleton
export const instructionsTransformationEngine = new InstructionsTransformationEngine();


