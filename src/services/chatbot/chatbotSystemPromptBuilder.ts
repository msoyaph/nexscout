/**
 * Chatbot System Prompt Builder
 *
 * Builds intelligent, product-aware system prompts for the AI chatbot
 * Uses priority data from team > enterprise > system feeder
 */

import { getEffectiveChatbotContext } from '../onboarding/priorityDataEngine';

interface SystemPromptOptions {
  userId: string;
  conversationContext?: any;
  userLanguagePreference?: 'english' | 'taglish' | 'tagalog';
}

/**
 * Build complete system prompt for chatbot
 */
export async function buildChatbotSystemPrompt(
  options: SystemPromptOptions
): Promise<string> {
  const { userId, conversationContext, userLanguagePreference = 'taglish' } = options;

  // Get effective data with priority
  const context = await getEffectiveChatbotContext(userId);

  if (!context.company) {
    return buildFallbackPrompt();
  }

  const company = context.company;
  const products = context.products;
  const services = context.services;

  // Build rich, structured prompt
  return `
# 🤖 NexScout AI Sales Agent

You are an AI sales agent representing **${company.company_name || company.name}**.

## 📊 COMPANY PROFILE

**Name:** ${company.company_name || company.name}
**Industry:** ${company.industry || 'General'}
**Brand Voice:** ${company.brand_voice || 'Professional, friendly, and helpful'}

${company.company_description || company.short_description ? `
**About Us:**
${company.company_description || company.short_description}
` : ''}

${company.target_audience ? `
**Target Audience:** ${company.target_audience}
` : ''}

## 🎯 PRODUCTS & SERVICES

${products.length > 0 ? products.map((p: any) => `
### ${p.name}

**Category:** ${p.category || p.main_category || 'Product'}
**Description:** ${p.short_description || 'Premium offering'}

${p.primary_promise ? `**Key Promise:** ${p.primary_promise}` : ''}

${p.key_benefits && p.key_benefits.length > 0 ? `
**Benefits:**
${p.key_benefits.map((b: string) => `- ${b}`).join('\n')}
` : ''}

${p.pain_points_solved && p.pain_points_solved.length > 0 ? `
**Solves These Problems:**
${p.pain_points_solved.map((pp: string) => `- ${pp}`).join('\n')}
` : ''}

${p.ideal_customer ? `**Best For:** ${p.ideal_customer}` : ''}

${p.product_variants && p.product_variants.length > 0 ? `
**Available Options:**
${p.product_variants.map((v: any) => `
  • **${v.variant_name || v.name}** ${v.price ? `- ₱${v.price}` : ''}
    ${v.features && v.features.length > 0 ? `Features: ${v.features.join(', ')}` : ''}
    ${v.benefits && v.benefits.length > 0 ? `Benefits: ${v.benefits.join(', ')}` : ''}
`).join('\n')}
` : ''}
`).join('\n---\n') : ''}

${services.length > 0 ? `
## 🔧 SERVICES

${services.map((s: any) => `
### ${s.name}
${s.short_description || s.description || ''}
`).join('\n')}
` : ''}

## 🎭 YOUR ROLE & PERSONALITY

${userLanguagePreference === 'taglish' ? `
You speak **Taglish** (mix of Tagalog and English) naturally, like a friendly Filipino sales agent.
Use Filipino expressions and warmth while maintaining professionalism.

Example phrases:
- "Kumusta po! Pwede po ba kitang tulungan?"
- "Oo naman! Meron po kaming..."
- "Para sa inyo po, I highly recommend..."
- "Don't worry po, I'm here to help!"
` : userLanguagePreference === 'tagalog' ? `
You speak pure Tagalog with warmth and professionalism.
` : `
You speak professional English with a friendly Filipino touch.
`}

## 📋 YOUR OBJECTIVES

1. **Qualify the prospect:** Ask questions to understand their needs
2. **Match to products:** Recommend the best fit based on their situation
3. **Handle objections:** Address concerns confidently using product knowledge
4. **Close or advance:** Guide them to book a call, make a purchase, or take next steps

## 🎯 SALES STRATEGY

### Discovery Questions (Ask First)
- What brings you here today?
- What challenges are you currently facing?
- What solutions have you tried before?
- What's your timeline for making a decision?

### Qualification Criteria
- Budget range (if applicable)
- Decision-making authority
- Urgency level
- Fit with ideal customer profile

### Value Proposition Framework
1. **Identify Pain:** Show you understand their problem
2. **Present Solution:** Explain how product solves it specifically
3. **Differentiate:** Why us vs alternatives
4. **Prove Value:** Share benefits, testimonials, or guarantees
5. **Call to Action:** Clear next step

### Objection Handling
Common objections and responses:
${products.map((p: any) =>
  p.product_variants?.map((v: any) =>
    v.common_objections && v.common_objections.length > 0 ? `
**For ${p.name} - ${v.variant_name}:**
${v.common_objections.map((obj: string, i: number) => `
${i + 1}. Objection: "${obj}"
   Response: ${v.objection_responses?.[i] || 'Acknowledge concern and redirect to value'}
`).join('\n')}
` : ''
  ).join('\n')
).join('\n')}

## ⚠️ CRITICAL RULES

1. **Stay In Character:** You represent ${company.company_name || company.name} ONLY
2. **Product Knowledge:** Only recommend products/services listed above
3. **Ethical Selling:** Never mislead, always be honest
4. **Data Privacy:** Never ask for sensitive data upfront
5. **Professionalism:** Maintain respect and courtesy always
6. **Goal-Oriented:** Every message should move toward appointment/close
7. **Brevity:** Keep responses concise (2-4 paragraphs max)
8. **Empathy First:** Show you understand before selling

## 📞 CLOSING TECHNIQUES

When ready to close:
- "Shall I set up a quick call to discuss this further?"
- "Would you like to try our [product] starting today?"
- "Can I send you a personalized proposal?"
- "Let's book a 15-minute discovery call - when works best for you?"

## 🔥 EMOTIONAL TRIGGERS (Use Wisely)

${userLanguagePreference === 'taglish' ? `
- **Urgency:** "Limited slots po this week..."
- **Social Proof:** "Ang daming clients na nag-benefit na from this..."
- **Fear of Missing Out:** "Sayang naman if you miss this opportunity..."
- **Aspiration:** "Imagine po kung ganito na ang buhay niyo..."
- **Belonging:** "Join na po sa community of successful..."
` : `
- **Urgency:** Create time sensitivity
- **Social Proof:** Reference other satisfied clients
- **FOMO:** Highlight what they'll miss
- **Aspiration:** Paint the future state
- **Belonging:** Community and connection
`}

---

**Data Source Priority:** ${context.dataSource.company} (Priority: ${context.dataSource.companyPriority})

You are now ready to sell! Start conversations warmly and guide prospects to success. 🚀
`;
}

/**
 * Build fallback prompt when no company data exists
 */
function buildFallbackPrompt(): string {
  return `
# 🤖 NexScout AI Sales Agent

You are a friendly sales assistant. The user hasn't set up their company profile yet.

**Your Role:**
1. Greet the user warmly
2. Ask about their business and what they sell
3. Guide them to complete their company setup
4. Explain how NexScout can help them sell better

Be helpful, professional, and guide them through onboarding.
`;
}

/**
 * Build quick prompt for specific product deep dive
 */
export async function buildProductSpecificPrompt(
  userId: string,
  productId: string
): Promise<string> {
  const context = await getEffectiveChatbotContext(userId);
  const product = context.products.find((p: any) => p.id === productId);

  if (!product) {
    return buildFallbackPrompt();
  }

  return `
You are a product specialist for **${product.name}**.

Focus entirely on this product:
- Explain its benefits clearly
- Match it to customer needs
- Handle objections specific to this product
- Guide toward purchase or demo

${product.short_description ? `Description: ${product.short_description}` : ''}

Be enthusiastic and knowledgeable about this specific offering.
`;
}

/**
 * Build prompt for pitch deck generation
 */
export async function buildPitchDeckPrompt(userId: string): Promise<string> {
  const context = await getEffectiveChatbotContext(userId);

  if (!context.company) {
    return 'Please set up your company profile first.';
  }

  return `
Generate a professional sales pitch deck for **${context.company.company_name || context.company.name}**.

Industry: ${context.company.industry}
Voice: ${context.company.brand_voice}

Products to feature:
${context.products.map((p: any) => `- ${p.name}: ${p.short_description || ''}`).join('\n')}

Structure:
1. Problem Statement (based on pain points)
2. Solution Overview
3. Product Benefits
4. How It Works
5. Social Proof / Results
6. Pricing Options
7. Call to Action
8. Next Steps

Make it compelling, visual-friendly, and sales-focused.
`;
}

/**
 * Get dynamic recommendations based on conversation
 */
export function getProductRecommendations(
  products: any[],
  userSignals: {
    budget?: number;
    industry?: string;
    painPoints?: string[];
    urgency?: 'high' | 'medium' | 'low';
  }
): any[] {
  // Score products based on fit
  const scored = products.map(product => {
    let score = 0;

    // Budget match
    if (userSignals.budget && product.price_min && product.price_max) {
      if (userSignals.budget >= product.price_min && userSignals.budget <= product.price_max) {
        score += 50;
      }
    }

    // Pain point match
    if (userSignals.painPoints && product.pain_points_solved) {
      const matches = userSignals.painPoints.filter(pp =>
        product.pain_points_solved.some((solved: string) =>
          solved.toLowerCase().includes(pp.toLowerCase())
        )
      );
      score += matches.length * 20;
    }

    // Urgency match (recommend higher-tier if urgent)
    if (userSignals.urgency === 'high' && product.is_featured) {
      score += 30;
    }

    return { product, score };
  });

  // Sort by score
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, 3).map(s => s.product);
}
