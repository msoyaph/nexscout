import { supabase } from './supabase';

export interface CompanyProfile {
  id: string;
  user_id: string;
  company_name: string;
  company_domain?: string;
  company_description?: string;
  industry?: string;
  company_size?: string;
  founded_year?: number;
  location?: string;
  products?: Array<{ name: string; description: string }>;
  faqs?: Array<{ question: string; answer: string }>;
  value_propositions?: string[];
  target_audience?: string;
  company_logo_url?: string;
  website_content?: string;
  social_media?: { [key: string]: string };
  ai_enriched_at?: string;
  created_at: string;
  updated_at: string;
}

export async function getCompanyProfile(userId: string): Promise<CompanyProfile | null> {
  try {
    const { data, error } = await supabase
      .from('company_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching company profile:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Error in getCompanyProfile:', err);
    return null;
  }
}

export async function updateCompanyProfile(
  userId: string,
  updates: Partial<CompanyProfile>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('company_profiles')
      .update(updates)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating company profile:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error in updateCompanyProfile:', err);
    return false;
  }
}

/**
 * Generates context for AI pitch deck based on company data
 */
export function generatePitchDeckContext(company: CompanyProfile | null): string {
  if (!company) {
    return 'Generate a professional pitch deck for my business.';
  }

  return `Generate a professional pitch deck for ${company.company_name}.

Company Information:
- Name: ${company.company_name}
- Industry: ${company.industry || 'Not specified'}
- Description: ${company.company_description || 'A leading company in the industry'}
- Target Audience: ${company.target_audience || 'Business professionals'}
- Location: ${company.location || 'Global'}

Value Propositions:
${company.value_propositions?.map((vp, idx) => `${idx + 1}. ${vp}`).join('\n') || '- Innovative solutions\n- Customer-first approach'}

Products/Services:
${company.products?.map((p, idx) => `${idx + 1}. ${p.name}: ${p.description}`).join('\n') || '- Core product offerings'}

Key Information:
${company.website_content || 'Professional business solutions'}

Please create a compelling pitch deck that highlights our unique value proposition and showcases our solutions.`;
}

/**
 * Generates context for AI message generation based on company data
 */
export function generateMessageContext(
  company: CompanyProfile | null,
  prospectName: string,
  prospectCompany?: string
): string {
  if (!company) {
    return `Write a professional outreach message to ${prospectName}${prospectCompany ? ` at ${prospectCompany}` : ''}.`;
  }

  return `Write a personalized outreach message to ${prospectName}${prospectCompany ? ` at ${prospectCompany}` : ''}.

My Company Information:
- Name: ${company.company_name}
- Industry: ${company.industry || 'Technology'}
- Description: ${company.company_description || 'A leading company'}

What We Offer:
${company.value_propositions?.slice(0, 3).map((vp, idx) => `${idx + 1}. ${vp}`).join('\n') || '- Innovative solutions'}

Our Products:
${company.products?.slice(0, 2).map(p => `- ${p.name}: ${p.description}`).join('\n') || '- Professional solutions'}

Target Audience:
${company.target_audience || 'Business professionals'}

Please write a warm, professional message that:
1. Introduces ${company.company_name} naturally
2. Highlights how we can help ${prospectName}
3. Includes a clear call-to-action
4. Keeps it concise (under 150 words)
5. Sounds authentic and human, not salesy`;
}

/**
 * Generates FAQ context for chatbots or customer support
 */
export function generateFAQContext(company: CompanyProfile | null): string {
  if (!company || !company.faqs || company.faqs.length === 0) {
    return 'No FAQs available yet.';
  }

  return `Frequently Asked Questions about ${company.company_name}:

${company.faqs.map((faq, idx) => `
Q${idx + 1}: ${faq.question}
A${idx + 1}: ${faq.answer}
`).join('\n')}

Company Description: ${company.company_description || ''}

For more information, visit our website at ${company.company_domain || company.company_name.toLowerCase().replace(/\s+/g, '') + '.com'}`;
}

/**
 * Get company elevator pitch
 */
export function getElevatorPitch(company: CompanyProfile | null): string {
  if (!company) {
    return 'A professional business focused on delivering value to clients.';
  }

  const vp = company.value_propositions?.[0] || 'innovative solutions';
  const target = company.target_audience || 'businesses';

  return `${company.company_name} ${company.industry ? `in the ${company.industry} industry` : ''} provides ${vp} to help ${target} achieve their goals.`;
}
