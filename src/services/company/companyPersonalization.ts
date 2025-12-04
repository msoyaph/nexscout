import { getCompanyKnowledge, type CompanyKnowledge } from './companyKnowledgeBase';
import { searchCompanyKnowledge } from './companyVectorStore';

export interface CompanyContext {
  profile: {
    name: string;
    slogan: string;
    industry: string;
    description: string;
  };
  products: string;
  valuePropositions: string;
  compensationPlan: string;
  targetCustomer: string;
  brandKeywords: string;
  toneSettings: {
    tone: string;
    pitchStyle: string;
    sequenceStyle: string;
  };
  testimonials: string;
  objections: string;
  benefits: string;
  painPoints: string;
}

/**
 * Build AI-ready company context for prompt injection
 */
export async function buildCompanyContext(userId: string): Promise<CompanyContext | null> {
  try {
    const knowledge = await getCompanyKnowledge(userId);

    if (!knowledge.profile) {
      return null;
    }

    return {
      profile: {
        name: knowledge.profile.companyName,
        slogan: knowledge.profile.companySlogan || '',
        industry: knowledge.profile.industry,
        description: knowledge.profile.description || '',
      },
      products: formatProducts(knowledge.products),
      valuePropositions: formatArray(knowledge.valuePropositions),
      compensationPlan: formatCompensationPlan(knowledge.compensationPlan),
      targetCustomer: knowledge.targetCustomer || 'General audience',
      brandKeywords: formatArray(knowledge.brandKeywords),
      toneSettings: {
        tone: knowledge.profile.brandTone,
        pitchStyle: knowledge.profile.pitchStyle,
        sequenceStyle: knowledge.profile.sequenceStyle,
      },
      testimonials: formatTestimonials(knowledge.testimonials),
      objections: formatObjections(knowledge.objections),
      benefits: formatArray(knowledge.benefits),
      painPoints: formatArray(knowledge.painPoints),
    };
  } catch (error) {
    console.error('Build company context error:', error);
    return null;
  }
}

/**
 * Get context-aware company information for specific query
 */
export async function getContextualCompanyInfo(
  userId: string,
  query: string,
  limit: number = 3
): Promise<string> {
  try {
    const results = await searchCompanyKnowledge(userId, query, limit);

    if (results.length === 0) {
      return '';
    }

    return results.map((r) => r.text).join('\n\n');
  } catch (error) {
    console.error('Get contextual company info error:', error);
    return '';
  }
}

/**
 * Build full AI prompt with company context
 */
export async function injectCompanyContext(
  userId: string,
  basePrompt: string,
  prospectContext?: any
): Promise<string> {
  try {
    const companyContext = await buildCompanyContext(userId);

    if (!companyContext) {
      return basePrompt;
    }

    const contextBlock = `
## COMPANY PROFILE
Company: ${companyContext.profile.name}
${companyContext.profile.slogan ? `Slogan: ${companyContext.profile.slogan}` : ''}
Industry: ${companyContext.profile.industry}
Description: ${companyContext.profile.description}

## TARGET CUSTOMER
${companyContext.targetCustomer}

## PRODUCTS & SERVICES
${companyContext.products}

## KEY SELLING POINTS
${companyContext.valuePropositions}

## COMPENSATION PLAN
${companyContext.compensationPlan}

## BENEFITS
${companyContext.benefits}

## PAIN POINTS WE SOLVE
${companyContext.painPoints}

## BRAND KEYWORDS
${companyContext.brandKeywords}

## TONE & STYLE SETTINGS
- Tone: ${companyContext.toneSettings.tone}
- Pitch Style: ${companyContext.toneSettings.pitchStyle}
- Sequence Style: ${companyContext.toneSettings.sequenceStyle}

## TESTIMONIALS
${companyContext.testimonials}

## COMMON OBJECTIONS & REBUTTALS
${companyContext.objections}

---

YOUR JOB:
Use ONLY the company-specific data above to shape all responses. Reference the company's actual products, benefits, compensation plan, and brand voice. Make every response feel authentic to THIS specific company.

${prospectContext ? `\n## PROSPECT CONTEXT\n${JSON.stringify(prospectContext, null, 2)}\n` : ''}

${basePrompt}
`;

    return contextBlock;
  } catch (error) {
    console.error('Inject company context error:', error);
    return basePrompt;
  }
}

/**
 * Get company tone instructions for AI
 */
export function getToneInstructions(
  brandTone: string,
  pitchStyle: string,
  sequenceStyle: string
): string {
  let instructions = '';

  switch (brandTone) {
    case 'professional':
      instructions += 'Use professional, polished language. Be respectful and authoritative.\n';
      break;
    case 'friendly':
      instructions += 'Use warm, approachable language. Be conversational and personable.\n';
      break;
    case 'taglish':
      instructions += 'Mix English and Filipino naturally. Use Taglish style common in Philippines.\n';
      break;
    case 'energetic':
      instructions += 'Use exciting, high-energy language. Show enthusiasm and passion.\n';
      break;
  }

  switch (pitchStyle) {
    case 'inspirational':
      instructions += 'Focus on dreams, possibilities, and transformation. Inspire action.\n';
      break;
    case 'corporate':
      instructions += 'Use business-focused, ROI-driven language. Professional and strategic.\n';
      break;
    case 'fast-paced':
      instructions += 'Keep it brief and punchy. Get to the point quickly.\n';
      break;
    case 'filipino-trust':
      instructions += 'Build trust using Filipino values: family, community, respect.\n';
      break;
    case 'vision-driven':
      instructions += 'Paint a compelling vision of success and lifestyle transformation.\n';
      break;
  }

  switch (sequenceStyle) {
    case 'short-followups':
      instructions += 'Keep follow-ups brief and focused. One clear CTA per message.\n';
      break;
    case 'storytelling':
      instructions += 'Use stories and narratives to engage. Build emotional connection.\n';
      break;
    case 'authority-builder':
      instructions += 'Establish credibility and expertise. Position as trusted advisor.\n';
      break;
    case 'trust-builder':
      instructions += 'Gradually build trust through value and consistency.\n';
      break;
    case 'problem-agitate-solve':
      instructions += 'Identify problem, agitate pain points, present solution (PAS framework).\n';
      break;
  }

  return instructions;
}

// Formatting helpers
function formatProducts(products: any[]): string {
  if (!products || products.length === 0) return 'No products defined yet.';

  return products
    .map((p, i) => {
      let text = `${i + 1}. ${p.name || 'Product'}`;
      if (p.description) text += `\n   ${p.description}`;
      if (p.price) text += `\n   Price: ${p.price}`;
      if (p.features && Array.isArray(p.features)) {
        text += `\n   Features: ${p.features.join(', ')}`;
      }
      return text;
    })
    .join('\n\n');
}

function formatArray(arr: string[]): string {
  if (!arr || arr.length === 0) return 'None defined yet.';
  return arr.map((item, i) => `${i + 1}. ${item}`).join('\n');
}

function formatCompensationPlan(plan: any): string {
  if (!plan) return 'No compensation plan defined yet.';

  let text = '';
  if (plan.structure) text += `Structure: ${plan.structure}\n`;
  if (plan.commissionRates && Array.isArray(plan.commissionRates)) {
    text += `Commission Rates:\n${plan.commissionRates.map((r: string) => `- ${r}`).join('\n')}\n`;
  }
  if (plan.bonuses && Array.isArray(plan.bonuses)) {
    text += `Bonuses:\n${plan.bonuses.map((b: string) => `- ${b}`).join('\n')}\n`;
  }
  if (plan.ranks && Array.isArray(plan.ranks)) {
    text += `Ranks:\n${plan.ranks.map((r: string) => `- ${r}`).join('\n')}`;
  }

  return text || 'Compensation details not extracted.';
}

function formatTestimonials(testimonials: any[]): string {
  if (!testimonials || testimonials.length === 0) return 'No testimonials yet.';

  return testimonials
    .slice(0, 5)
    .map((t, i) => {
      let text = `${i + 1}. "${t.text || ''}"`;
      if (t.author) text += ` - ${t.author}`;
      if (t.result) text += ` (Result: ${t.result})`;
      return text;
    })
    .join('\n\n');
}

function formatObjections(objections: any[]): string {
  if (!objections || objections.length === 0) return 'No objections mapped yet.';

  return objections
    .map((o, i) => {
      let text = `${i + 1}. Objection: "${o.objection || ''}"`;
      if (o.rebuttal) text += `\n   Rebuttal: ${o.rebuttal}`;
      if (o.category) text += `\n   Category: ${o.category}`;
      return text;
    })
    .join('\n\n');
}
