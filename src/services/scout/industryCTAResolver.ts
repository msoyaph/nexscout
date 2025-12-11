/**
 * Industry CTA Resolver
 * Resolves generic CTA keys to industry-specific CTA templates
 * Ensures no cross-industry leakage
 */
import type { Industry } from '../../config/scout/industryWeights';

export type CTATemplateKey = 
  | 'show_price'
  | 'invite_to_call'
  | 'share_basic_info'
  | 'address_price_concerns'
  | 'schedule_follow_up'
  | 'provide_spouse_info_packet'
  | 'direct_close_offer'
  | 'nurture_sequence'
  | 'reminder'
  | 'build_rapport'
  | 'send_offer'
  | 'send_application_link'
  | 'closing_offer'
  | 'direct_offer';

interface CTATemplate {
  text: string;
  tone: 'casual' | 'professional' | 'warm' | 'urgent';
  channel?: 'messenger' | 'email' | 'sms' | 'whatsapp';
}

const INDUSTRY_CTAS: Record<Industry, Record<CTATemplateKey, CTATemplate>> = {
  mlm: {
    show_price: {
      text: 'Interested to know how much it costs to get started? I can show you the starter package options po!',
      tone: 'warm',
    },
    invite_to_call: {
      text: 'Gusto mo ba ng free 15-min call para i-explain ko sayo yung opportunity?',
      tone: 'casual',
    },
    share_basic_info: {
      text: 'Let me share with you some basic info about this business opportunity. Taglish okay lang po?',
      tone: 'casual',
    },
    address_price_concerns: {
      text: 'Naintindihan ko yung concern mo about the price. May installment option din tayo. Gusto mo i-explain ko?',
      tone: 'warm',
    },
    schedule_follow_up: {
      text: 'When is a good time for you this week? I can follow up then para ma-clarify natin lahat ng questions mo.',
      tone: 'casual',
    },
    provide_spouse_info_packet: {
      text: 'I can prepare an info packet para ma-share mo sa asawa mo. May video din na pwede niya panoorin para ma-understand niya.',
      tone: 'warm',
    },
    direct_close_offer: {
      text: 'Ready to start? Let\'s get you set up today para maka-start ka na this week!',
      tone: 'urgent',
    },
    nurture_sequence: {
      text: 'I\'ll send you some success stories and tips this week. Let\'s see if this resonates with you!',
      tone: 'warm',
    },
    reminder: {
      text: 'Hey! Just checking in - nakapag-isip ka na ba about this opportunity?',
      tone: 'casual',
    },
    build_rapport: {
      text: 'Let\'s get to know each other first! Tell me about your goals and what you\'re looking for.',
      tone: 'warm',
    },
    send_offer: {
      text: 'I\'ll send you the complete offer details now. Check mo and let me know if may questions!',
      tone: 'professional',
    },
    send_application_link: {
      text: 'Here\'s the link to apply and get started. Fill it out and I\'ll guide you through the next steps!',
      tone: 'professional',
    },
    closing_offer: {
      text: 'Final offer - join today and get bonus training materials. Limited slots lang po!',
      tone: 'urgent',
    },
    direct_offer: {
      text: 'Here\'s what I can offer you. Interested to move forward?',
      tone: 'professional',
    },
  },
  insurance: {
    show_price: {
      text: 'I can prepare a personalized quote for you. What coverage amount are you looking for?',
      tone: 'professional',
    },
    invite_to_call: {
      text: 'Free consultation call po - I can assess your needs and recommend the best plan.',
      tone: 'professional',
    },
    share_basic_info: {
      text: 'Let me share some basic information about our insurance products and how they can protect your family.',
      tone: 'professional',
    },
    address_price_concerns: {
      text: 'I understand budget is a concern. We have flexible payment plans - monthly, quarterly, or annual. Which works for you?',
      tone: 'warm',
    },
    schedule_follow_up: {
      text: 'When would be a good time for a follow-up call? I can prepare a detailed proposal for you.',
      tone: 'professional',
    },
    provide_spouse_info_packet: {
      text: 'I can prepare a comprehensive info packet you can share with your spouse. Includes coverage details, benefits, and payment options.',
      tone: 'professional',
    },
    direct_close_offer: {
      text: 'Ready to secure your family\'s future? Let\'s finalize your coverage today.',
      tone: 'professional',
    },
    nurture_sequence: {
      text: 'I\'ll send you valuable information about financial protection this week. No pressure, just education.',
      tone: 'warm',
    },
    reminder: {
      text: 'Following up on your insurance inquiry. Have you had a chance to review the information?',
      tone: 'professional',
    },
    build_rapport: {
      text: 'Let\'s talk about your family\'s protection needs. What are your main concerns?',
      tone: 'warm',
    },
    send_offer: {
      text: 'I\'m sending your personalized insurance proposal now. Please review and let me know if you have questions.',
      tone: 'professional',
    },
    send_application_link: {
      text: 'Here\'s the application link. I\'ll guide you through the process step by step.',
      tone: 'professional',
    },
    closing_offer: {
      text: 'Special offer this month - no medical exam required for coverage up to ₱1M. Apply now!',
      tone: 'urgent',
    },
    direct_offer: {
      text: 'Based on your needs, here\'s my recommendation. Would you like to proceed?',
      tone: 'professional',
    },
  },
  real_estate: {
    show_price: {
      text: 'I can show you properties in your price range. What\'s your budget po?',
      tone: 'professional',
    },
    invite_to_call: {
      text: 'Free property consultation - I can help you find the perfect property. Available for a call?',
      tone: 'professional',
    },
    share_basic_info: {
      text: 'Let me share information about our available properties and investment opportunities.',
      tone: 'professional',
    },
    address_price_concerns: {
      text: 'I understand budget considerations. We offer flexible payment plans - bank financing or in-house. Let\'s discuss your options.',
      tone: 'professional',
    },
    schedule_follow_up: {
      text: 'When can we schedule a property viewing? I can show you the best options based on your criteria.',
      tone: 'professional',
    },
    provide_spouse_info_packet: {
      text: 'I can prepare a property portfolio you can review with your spouse. Includes floor plans, photos, and financing options.',
      tone: 'professional',
    },
    direct_close_offer: {
      text: 'This property is in high demand. Reserve now and secure your investment.',
      tone: 'urgent',
    },
    nurture_sequence: {
      text: 'I\'ll send you new property listings and market updates this week. Stay informed about opportunities.',
      tone: 'professional',
    },
    reminder: {
      text: 'Following up on your property inquiry. Are you still interested in viewing properties?',
      tone: 'professional',
    },
    build_rapport: {
      text: 'Let\'s discuss your property goals. Are you looking for a home or investment?',
      tone: 'warm',
    },
    send_offer: {
      text: 'I\'m sending you the complete property details and pricing now. Check it out!',
      tone: 'professional',
    },
    send_application_link: {
      text: 'Here\'s the reservation form. Secure your unit by submitting this today.',
      tone: 'professional',
    },
    closing_offer: {
      text: 'Limited units available! Reserve this week and get early bird discount.',
      tone: 'urgent',
    },
    direct_offer: {
      text: 'Here are the properties I recommend based on your criteria. Interested to schedule a viewing?',
      tone: 'professional',
    },
  },
  ecommerce: {
    show_price: {
      text: 'Check mo po yung prices - may promo kami ngayon!',
      tone: 'casual',
    },
    invite_to_call: {
      text: 'Gusto mo video call para i-show ko sayo yung products?',
      tone: 'casual',
    },
    share_basic_info: {
      text: 'Here are our best-selling products. Check mo lang po!',
      tone: 'casual',
    },
    address_price_concerns: {
      text: 'May installment option din po via GCash or credit card. Or COD available!',
      tone: 'casual',
    },
    schedule_follow_up: {
      text: 'Check mo muna yung products. I\'ll follow up tomorrow para malaman ko if may gusto ka.',
      tone: 'casual',
    },
    provide_spouse_info_packet: {
      text: 'I\'ll send you product photos and prices para ma-share mo sa partner mo.',
      tone: 'casual',
    },
    direct_close_offer: {
      text: 'Order now via COD or GCash! Delivery in 2-3 days lang.',
      tone: 'urgent',
    },
    nurture_sequence: {
      text: 'I\'ll send you new products and promos this week. Baka may magustuhan ka!',
      tone: 'casual',
    },
    reminder: {
      text: 'Hey! Yung products na pinag-usapan natin, gusto mo pa ba?',
      tone: 'casual',
    },
    build_rapport: {
      text: 'Ano yung type of products na hinahanap mo? I can recommend based on your needs!',
      tone: 'warm',
    },
    send_offer: {
      text: 'Eto yung complete list with prices. Check mo and order lang if interested!',
      tone: 'casual',
    },
    send_application_link: {
      text: 'Eto yung order form. Fill mo lang and I\'ll process your order!',
      tone: 'casual',
    },
    closing_offer: {
      text: 'Last day ng promo! Order today and get free shipping + discount voucher.',
      tone: 'urgent',
    },
    direct_offer: {
      text: 'Here\'s what I have available. Interested to order?',
      tone: 'casual',
    },
  },
  direct_selling: {
    // Use MLM CTAs as they're similar
    show_price: {
      text: 'Interested to know how much it costs to get started? I can show you the starter package options po!',
      tone: 'warm',
    },
    invite_to_call: {
      text: 'Gusto mo ba ng free 15-min call para i-explain ko sayo yung opportunity?',
      tone: 'casual',
    },
    share_basic_info: {
      text: 'Let me share with you some basic info about this business opportunity. Taglish okay lang po?',
      tone: 'casual',
    },
    address_price_concerns: {
      text: 'Naintindihan ko yung concern mo about the price. May installment option din tayo. Gusto mo i-explain ko?',
      tone: 'warm',
    },
    schedule_follow_up: {
      text: 'When is a good time for you this week? I can follow up then para ma-clarify natin lahat ng questions mo.',
      tone: 'casual',
    },
    provide_spouse_info_packet: {
      text: 'I can prepare an info packet para ma-share mo sa asawa mo. May video din na pwede niya panoorin para ma-understand niya.',
      tone: 'warm',
    },
    direct_close_offer: {
      text: 'Ready to start? Let\'s get you set up today para maka-start ka na this week!',
      tone: 'urgent',
    },
    nurture_sequence: {
      text: 'I\'ll send you some success stories and tips this week. Let\'s see if this resonates with you!',
      tone: 'warm',
    },
    reminder: {
      text: 'Hey! Just checking in - nakapag-isip ka na ba about this opportunity?',
      tone: 'casual',
    },
    build_rapport: {
      text: 'Let\'s get to know each other first! Tell me about your goals and what you\'re looking for.',
      tone: 'warm',
    },
    send_offer: {
      text: 'I\'ll send you the complete offer details now. Check mo and let me know if may questions!',
      tone: 'professional',
    },
    send_application_link: {
      text: 'Here\'s the link to apply and get started. Fill it out and I\'ll guide you through the next steps!',
      tone: 'professional',
    },
    closing_offer: {
      text: 'Final offer - join today and get bonus training materials. Limited slots lang po!',
      tone: 'urgent',
    },
    direct_offer: {
      text: 'Here\'s what I can offer you. Interested to move forward?',
      tone: 'professional',
    },
  },
};

/**
 * Resolve a generic CTA key to industry-specific CTA template
 * Returns null if industry is not specified or key doesn't exist
 */
export function resolveIndustryCTA(
  ctaKey: string | null | undefined,
  activeIndustry?: Industry
): CTATemplate | null {
  if (!ctaKey || !activeIndustry) {
    return null;
  }

  const industryCTAs = INDUSTRY_CTAS[activeIndustry];
  if (!industryCTAs) {
    return null;
  }

  return industryCTAs[ctaKey as CTATemplateKey] || null;
}

/**
 * Get all available CTA keys for an industry
 */
export function getIndustryCTAKeys(industry: Industry): CTATemplateKey[] {
  return Object.keys(INDUSTRY_CTAS[industry] || {}) as CTATemplateKey[];
}


