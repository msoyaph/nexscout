import { dataSyncEngine } from './dataSyncEngine';
import { knowledgeGraphEngine } from './knowledgeGraphEngine';
import { autoTaggingEngine } from './autoTaggingEngine';

interface ChatbotPromptOptions {
  userId: string;
  conversationContext?: {
    previousMessages?: string[];
    customerIntent?: string;
    detectedPainPoints?: string[];
  };
  languagePreference?: 'taglish' | 'english' | 'tagalog';
  tone?: 'professional' | 'friendly' | 'enthusiastic';
}

interface ChatbotContext {
  systemPrompt: string;
  companyProfile: any;
  products: any[];
  services: any[];
  knowledgeGraph?: any;
  metadata: {
    dataSource: string;
    hasProducts: boolean;
    hasServices: boolean;
    confidence: 'high' | 'medium' | 'low';
  };
}

function buildLanguageInstructions(language: string): string {
  const languageInstructions = {
    taglish: `
Language: Use TAGLISH (Filipino-English mix) naturally
- Mix Tagalog and English comfortably (e.g., "Kamusta! I'm here to help you find the perfect solution")
- Use Filipino terms where appropriate (e.g., "presyo", "benepisyo", "produkto")
- Keep it conversational and relatable to Filipino speakers
- Use Filipino expressions like "Oo naman!", "Siyempre!", "Talaga?"
`,
    english: `
Language: Use ENGLISH professionally
- Use clear, professional English
- Avoid slang or colloquialisms
- Be articulate and well-spoken
- Use proper grammar and punctuation
`,
    tagalog: `
Language: Use PURE TAGALOG
- Gumamit ng purong Tagalog sa lahat ng sagot
- Iwasan ang paghahalo ng English
- Maging pormal at propesyonal
- Gumamit ng wastong gramatika
`
  };

  return languageInstructions[language as keyof typeof languageInstructions] || languageInstructions.taglish;
}

function buildToneInstructions(tone: string): string {
  const toneInstructions = {
    professional: `
Tone: PROFESSIONAL & CONSULTATIVE
- Act as a trusted advisor and expert
- Use data and facts to support recommendations
- Be confident but not pushy
- Focus on value and ROI
`,
    friendly: `
Tone: FRIENDLY & APPROACHABLE
- Be warm, welcoming, and personable
- Use casual but respectful language
- Show empathy and understanding
- Make the conversation feel natural
`,
    enthusiastic: `
Tone: ENTHUSIASTIC & ENERGETIC
- Show excitement about products and opportunities
- Use positive and motivating language
- Be inspiring and uplifting
- Emphasize transformations and success stories
`
  };

  return toneInstructions[tone as keyof typeof toneInstructions] || toneInstructions.friendly;
}

function buildCompanySection(company: any): string {
  if (!company) {
    return `
You represent a company, but detailed information is not yet available.
Focus on understanding the customer's needs first.
`;
  }

  return `
# COMPANY PROFILE
Company Name: ${company.company_name || company.name}
Industry: ${company.industry || 'General'}
${company.brand_voice ? `Brand Voice: ${company.brand_voice}` : ''}
${company.short_description ? `\nDescription: ${company.short_description}` : ''}
${company.value_proposition ? `\nValue Proposition: ${company.value_proposition}` : ''}
${company.target_market ? `\nTarget Market: ${company.target_market}` : ''}
`;
}

function buildProductsSection(products: any[]): string {
  if (products.length === 0) {
    return `
# PRODUCTS & SERVICES
No products are currently configured.
Focus on understanding what the customer needs.
`;
  }

  let section = `\n# PRODUCTS & SERVICES\nYou can recommend the following products:\n\n`;

  products.forEach((product, index) => {
    section += `${index + 1}. ${product.name || 'Product ' + (index + 1)}\n`;

    if (product.description) {
      section += `   Description: ${product.description.substring(0, 200)}${product.description.length > 200 ? '...' : ''}\n`;
    }

    if (product.price) {
      section += `   Price: ₱${product.price}\n`;
    }

    if (product.category) {
      section += `   Category: ${product.category}\n`;
    }

    if (product.target_personas && product.target_personas.length > 0) {
      section += `   Best For: ${product.target_personas.join(', ')}\n`;
    }

    if (product.pain_points_solved && product.pain_points_solved.length > 0) {
      section += `   Solves: ${product.pain_points_solved.join(', ')}\n`;
    }

    if (product.key_benefits && Array.isArray(product.key_benefits)) {
      section += `   Benefits: ${product.key_benefits.join(', ')}\n`;
    }

    section += '\n';
  });

  return section;
}

function buildSalesStrategySection(): string {
  return `
# SALES STRATEGY

1. DISCOVERY PHASE
   - Ask open-ended questions to understand needs
   - Listen for pain points and challenges
   - Identify their goals and desired outcomes
   - Determine budget and timeline

2. RECOMMENDATION PHASE
   - Match their needs to the right product/service
   - Explain how it solves their specific problem
   - Highlight relevant benefits and features
   - Use social proof and success stories when appropriate

3. OBJECTION HANDLING
   - Listen to concerns without interrupting
   - Acknowledge their feelings
   - Provide clear, honest answers
   - Reframe objections as opportunities

4. CLOSING PHASE
   - Create urgency if appropriate (limited slots, promo periods)
   - Summarize the value proposition
   - Make it easy to say yes (clear next steps)
   - Ask for the commitment confidently

Common Objections:
- "Too expensive" → Focus on ROI, payment plans, or lower-tier options
- "Need to think about it" → Understand what's holding them back specifically
- "Not the right time" → Find out when would be better, stay in touch
- "Already have something similar" → Differentiate, show unique value
`;
}

function buildBehaviorGuidelines(): string {
  return `
# BEHAVIOR GUIDELINES

DO:
✓ Ask clarifying questions before recommending
✓ Personalize your responses based on their situation
✓ Be honest about product limitations
✓ Provide specific examples and scenarios
✓ Build rapport and trust first
✓ Follow up on previous conversation points
✓ Celebrate their goals and aspirations

DON'T:
✗ Make false promises or exaggerated claims
✗ Pressure or manipulate
✗ Ignore red flags or mismatches
✗ Recommend products that don't fit their needs
✗ Be robotic or use templates obviously
✗ Talk too much about features without context
✗ Dismiss their concerns or objections
`;
}

export const chatbotIntegrationEngine = {
  async buildPrompt(options: ChatbotPromptOptions): Promise<ChatbotContext> {
    const {
      userId,
      conversationContext,
      languagePreference = 'taglish',
      tone = 'friendly'
    } = options;

    const resolved = await dataSyncEngine.resolveDataForUser(userId);

    if (!resolved.company && resolved.products.length === 0) {
      const fallbackPrompt = this.buildFallbackPrompt(languagePreference, tone);
      return {
        systemPrompt: fallbackPrompt,
        companyProfile: null,
        products: [],
        services: [],
        metadata: {
          dataSource: 'none',
          hasProducts: false,
          hasServices: false,
          confidence: 'low'
        }
      };
    }

    let knowledgeGraph = null;
    if (resolved.company) {
      try {
        knowledgeGraph = await knowledgeGraphEngine.load(
          resolved.company.id,
          resolved.metadata.sources.company
        );

        if (!knowledgeGraph) {
          knowledgeGraph = knowledgeGraphEngine.build(
            resolved.company,
            resolved.products,
            resolved.services,
            resolved.variants
          );
        }
      } catch (error) {
        console.error('Error loading/building knowledge graph:', error);
      }
    }

    const systemPrompt = `
${buildLanguageInstructions(languagePreference)}
${buildToneInstructions(tone)}

# 🤖 NEXSCOUT AI SALES AGENT

You are an AI sales agent powered by NexScout.
${buildCompanySection(resolved.company)}
${buildProductsSection(resolved.products)}
${buildSalesStrategySection()}
${buildBehaviorGuidelines()}

${conversationContext?.customerIntent ? `\n# CUSTOMER INTENT\nThe customer seems interested in: ${conversationContext.customerIntent}\n` : ''}
${conversationContext?.detectedPainPoints && conversationContext.detectedPainPoints.length > 0 ? `\n# DETECTED PAIN POINTS\n${conversationContext.detectedPainPoints.join(', ')}\n` : ''}

Remember: Your goal is to help them find the right solution, not just make a sale.
Build trust, understand their needs, and recommend genuinely helpful products.
`.trim();

    const confidence: 'high' | 'medium' | 'low' =
      (resolved.company && resolved.products.length >= 3) ? 'high' :
      (resolved.company || resolved.products.length > 0) ? 'medium' : 'low';

    return {
      systemPrompt,
      companyProfile: resolved.company,
      products: resolved.products,
      services: resolved.services,
      knowledgeGraph,
      metadata: {
        dataSource: resolved.metadata.sources.company,
        hasProducts: resolved.products.length > 0,
        hasServices: resolved.services.length > 0,
        confidence
      }
    };
  },

  buildFallbackPrompt(language: string = 'taglish', tone: string = 'friendly'): string {
    return `
${buildLanguageInstructions(language)}
${buildToneInstructions(tone)}

# 🤖 NEXSCOUT AI SALES AGENT

You are an AI sales agent powered by NexScout.

However, the company profile and product information are not yet fully configured.

Your role right now:
1. Introduce yourself warmly
2. Explain that you're here to help them find the perfect solution
3. Ask questions to understand their needs, goals, and challenges
4. Take detailed notes of what they're looking for
5. Let them know that a human agent will follow up with specific recommendations

Be friendly, professional, and gather as much useful information as possible.
This information will help provide them with the best possible service.
    `.trim();
  },

  async updatePromptWithContext(
    userId: string,
    conversationHistory: { role: string; content: string }[]
  ): Promise<string> {
    const detectedIntent = this.detectIntent(conversationHistory);
    const detectedPainPoints = this.extractPainPoints(conversationHistory);

    const context = await this.buildPrompt({
      userId,
      conversationContext: {
        previousMessages: conversationHistory.slice(-5).map(m => m.content),
        customerIntent: detectedIntent,
        detectedPainPoints
      }
    });

    return context.systemPrompt;
  },

  detectIntent(messages: { role: string; content: string }[]): string {
    const recentMessages = messages.slice(-3).map(m => m.content.toLowerCase()).join(' ');

    if (recentMessages.includes('price') || recentMessages.includes('presyo') || recentMessages.includes('cost')) {
      return 'pricing_inquiry';
    }

    if (recentMessages.includes('how') || recentMessages.includes('paano') || recentMessages.includes('work')) {
      return 'product_information';
    }

    if (recentMessages.includes('buy') || recentMessages.includes('bili') || recentMessages.includes('order')) {
      return 'ready_to_purchase';
    }

    if (recentMessages.includes('compare') || recentMessages.includes('difference') || recentMessages.includes('vs')) {
      return 'comparison';
    }

    if (recentMessages.includes('problem') || recentMessages.includes('issue') || recentMessages.includes('help')) {
      return 'problem_solving';
    }

    return 'exploration';
  },

  extractPainPoints(messages: { role: string; content: string }[]): string[] {
    const painPoints: string[] = [];
    const text = messages.map(m => m.content.toLowerCase()).join(' ');

    const patterns = [
      { pain: 'lack_of_time', keywords: ['busy', 'no time', 'walang oras', 'hectic'] },
      { pain: 'financial_constraints', keywords: ['expensive', 'mahal', 'afford', 'budget'] },
      { pain: 'complexity', keywords: ['complicated', 'confusing', 'mahirap intindihin', 'difficult'] },
      { pain: 'health_issues', keywords: ['sakit', 'health', 'pain', 'kalusugan'] },
      { pain: 'stress', keywords: ['stress', 'anxiety', 'worried', 'nag-aalala'] },
      { pain: 'income_needs', keywords: ['earn', 'income', 'kita', 'pera', 'kumita'] }
    ];

    patterns.forEach(({ pain, keywords }) => {
      if (keywords.some(keyword => text.includes(keyword))) {
        painPoints.push(pain);
      }
    });

    return painPoints;
  },

  async getProductRecommendations(userId: string, painPoints: string[]): Promise<any[]> {
    const resolved = await dataSyncEngine.resolveDataForUser(userId);

    if (resolved.products.length === 0) return [];

    const scored = resolved.products.map(product => {
      let score = 0;

      if (product.pain_points_solved && Array.isArray(product.pain_points_solved)) {
        const matches = painPoints.filter(pp =>
          product.pain_points_solved.some((solved: string) =>
            solved.toLowerCase().includes(pp.toLowerCase()) ||
            pp.toLowerCase().includes(solved.toLowerCase())
          )
        );
        score += matches.length * 20;
      }

      return { product, score };
    });

    scored.sort((a, b) => b.score - a.score);

    return scored.filter(s => s.score > 0).map(s => s.product);
  }
};
