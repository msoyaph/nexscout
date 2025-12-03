import { supabase } from '../../lib/supabase';

export type ChatbotProductFlowInput = {
  userId: string;
  channel: 'web' | 'messenger' | 'whatsapp' | 'viber' | 'ig';
  conversationContext: {
    messages: { role: 'user' | 'assistant'; text: string }[];
  };
};

export type ChatbotProductFlowOutput = {
  chosenProductId: string | null;
  intent: 'discovery' | 'problem_detected' | 'ready_to_offer' | 'closing' | 'post_sale';
  messageToUser: string;
  suggestedActions: (
    | 'ask_more'
    | 'offer_product'
    | 'share_link'
    | 'book_call'
    | 'upsell'
    | 'cross_sell'
  )[];
};

type ConversationAnalysis = {
  painType: string | null;
  budgetSensitivity: 'low' | 'medium' | 'high';
  urgencyLevel: 'low' | 'medium' | 'high';
  trustLevel: 'cold' | 'warm' | 'hot';
};

function analyzeConversation(
  messages: { role: string; text: string }[]
): ConversationAnalysis {
  const allText = messages.map((m) => m.text.toLowerCase()).join(' ');

  let painType: string | null = null;
  if (
    allText.includes('sakit') ||
    allText.includes('health') ||
    allText.includes('gamot') ||
    allText.includes('supplement')
  ) {
    painType = 'health';
  } else if (
    allText.includes('income') ||
    allText.includes('kita') ||
    allText.includes('pera') ||
    allText.includes('negosyo')
  ) {
    painType = 'income';
  } else if (
    allText.includes('insurance') ||
    allText.includes('protection') ||
    allText.includes('financial')
  ) {
    painType = 'protection';
  } else if (allText.includes('bahay') || allText.includes('condo') || allText.includes('house')) {
    painType = 'housing';
  }

  const budgetSensitivity: 'low' | 'medium' | 'high' =
    allText.includes('mahal') || allText.includes('afford') || allText.includes('presyo')
      ? 'high'
      : allText.includes('investment') || allText.includes('premium')
      ? 'low'
      : 'medium';

  const urgencyLevel: 'low' | 'medium' | 'high' =
    allText.includes('now') || allText.includes('agad') || allText.includes('asap')
      ? 'high'
      : allText.includes('soon') || allText.includes('plano')
      ? 'medium'
      : 'low';

  const trustLevel: 'cold' | 'warm' | 'hot' =
    messages.length > 5 && allText.includes('interested')
      ? 'hot'
      : messages.length > 2
      ? 'warm'
      : 'cold';

  return { painType, budgetSensitivity, urgencyLevel, trustLevel };
}

async function loadUserProducts(userId: string, channel: string) {
  const { data: chatbotLinks } = await supabase
    .from('product_chatbot_links')
    .select(
      `
      *,
      products (
        id,
        name,
        main_category,
        short_description,
        primary_promise,
        key_benefits,
        ideal_prospect_tags,
        product_url,
        image_url,
        price_min,
        price_max,
        currency
      ),
      product_intel_snapshots!product_intel_snapshots_product_id_fkey (
        competitive_position,
        primary_product_strength_score,
        elevator_pitch,
        comparison_pitch,
        objection_handling_snippets,
        upsell_hooks
      )
    `
    )
    .eq('user_id', userId)
    .eq('enabled', true)
    .contains('enabled_channels', [channel])
    .order('priority', { ascending: false });

  return chatbotLinks || [];
}

function scoreProductMatch(
  product: any,
  analysis: ConversationAnalysis,
  intel: any
): number {
  let score = 0;

  if (analysis.painType) {
    const categoryMap: Record<string, string[]> = {
      health: ['MLM / Network Marketing', 'Health Supplements'],
      income: ['MLM / Network Marketing', 'Online Selling / Physical Products', 'Coaching / Services'],
      protection: ['Insurance / Financial Planning'],
      housing: ['Real Estate'],
    };

    const relevantCategories = categoryMap[analysis.painType] || [];
    if (relevantCategories.some((cat) => product.main_category?.includes(cat))) {
      score += 40;
    }
  }

  if (intel && intel.primary_product_strength_score) {
    score += intel.primary_product_strength_score * 0.3;
  }

  if (product.key_benefits && product.key_benefits.length > 0) {
    score += 10;
  }

  if (product.product_url) {
    score += 10;
  }

  if (analysis.budgetSensitivity === 'high' && product.price_min) {
    score -= 10;
  }

  return Math.min(100, score);
}

function selectBestProduct(
  products: any[],
  analysis: ConversationAnalysis
): { product: any; intel: any } | null {
  if (products.length === 0) return null;

  let bestProduct = null;
  let bestScore = 0;

  for (const link of products) {
    const product = link.products;
    const intel = link.product_intel_snapshots?.[0];

    const score = scoreProductMatch(product, analysis, intel);

    if (score > bestScore) {
      bestScore = score;
      bestProduct = { product, intel };
    }
  }

  return bestProduct;
}

function determineIntent(
  analysis: ConversationAnalysis,
  messageCount: number
): ChatbotProductFlowOutput['intent'] {
  if (messageCount <= 2) {
    return 'discovery';
  }

  if (analysis.painType && analysis.trustLevel === 'cold') {
    return 'problem_detected';
  }

  if (analysis.painType && analysis.trustLevel === 'warm') {
    return 'ready_to_offer';
  }

  if (analysis.trustLevel === 'hot') {
    return 'closing';
  }

  return 'discovery';
}

function generateMessage(
  intent: ChatbotProductFlowOutput['intent'],
  product: any | null,
  intel: any | null,
  analysis: ConversationAnalysis
): { message: string; actions: ChatbotProductFlowOutput['suggestedActions'] } {
  if (intent === 'discovery') {
    return {
      message:
        'Hi! Kumusta? May I know kung ano ang iyong pinaghahanap o kung paano kita matutulungan today?',
      actions: ['ask_more'],
    };
  }

  if (intent === 'problem_detected' && product) {
    const pitch = intel?.elevator_pitch || `${product.name} - ${product.short_description || ''}`;
    return {
      message: `Base sa kwento mo, mukhang bagay sayo itong ${product.name}. ${pitch} Gusto mo bang malaman more details?`,
      actions: ['ask_more', 'offer_product'],
    };
  }

  if (intent === 'ready_to_offer' && product) {
    const benefits = product.key_benefits?.slice(0, 3).join(', ') || 'proven benefits';
    const price =
      product.price_min && product.price_max
        ? `${product.currency} ${product.price_min}-${product.price_max}`
        : 'affordable price';

    return {
      message: `Perfect! Ang ${product.name} offers: ${benefits}. Available ito for ${price}. Interested ka ba? May link ako dito or pwede tayo mag-schedule ng quick call.`,
      actions: ['share_link', 'book_call'],
    };
  }

  if (intent === 'closing' && product) {
    return {
      message: `Great decision! Here's how to proceed with ${product.name}. Click this link to get started, or let me know kung may tanong ka pa.`,
      actions: ['share_link', 'book_call'],
    };
  }

  return {
    message: 'Salamat sa interest mo! May specific product ba na gusto mong malaman?',
    actions: ['ask_more'],
  };
}

export async function runChatbotProductFlow(
  input: ChatbotProductFlowInput
): Promise<ChatbotProductFlowOutput> {
  try {
    const { userId, channel, conversationContext } = input;

    const analysis = analyzeConversation(conversationContext.messages);

    const userProducts = await loadUserProducts(userId, channel);

    const bestMatch = selectBestProduct(userProducts, analysis);

    const intent = determineIntent(analysis, conversationContext.messages.length);

    const { message, actions } = generateMessage(
      intent,
      bestMatch?.product,
      bestMatch?.intel,
      analysis
    );

    if (bestMatch && intent === 'ready_to_offer') {
      await supabase.rpc('increment_product_chatbot_stat', {
        p_product_id: bestMatch.product.id,
        p_stat_type: 'offered',
      });
    }

    return {
      chosenProductId: bestMatch?.product?.id || null,
      intent,
      messageToUser: message,
      suggestedActions: actions,
    };
  } catch (error) {
    console.error('Chatbot Product Flow Error:', error);
    return {
      chosenProductId: null,
      intent: 'discovery',
      messageToUser:
        'Hi! Pasensya na, may technical issue. Pero willing akong tumulong. Ano ang hanap mo?',
      suggestedActions: ['ask_more'],
    };
  }
}

export const publicChatbotProductFlowEngine = {
  run: runChatbotProductFlow,
  id: 'publicChatbotProductFlow',
  name: 'Public Chatbot Product Flow Engine',
  description: 'Auto-detects customer needs and offers right products',
};
