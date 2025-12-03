import { dataSyncEngine } from './dataSyncEngine';
import { knowledgeGraphEngine } from './knowledgeGraphEngine';
import { supabase } from '../../../lib/supabase';

interface DeckGenerationOptions {
  userId: string;
  prospectId?: string;
  prospectData?: any;
  deckType?: 'standard' | 'personalized' | 'product_focused' | 'company_overview';
  includePersonalization?: boolean;
}

interface GeneratedDeck {
  title: string;
  slides: DeckSlide[];
  metadata: {
    generated_at: string;
    data_sources: string[];
    personalization_level: 'high' | 'medium' | 'low' | 'none';
    prospect_id?: string;
  };
}

interface DeckSlide {
  slide_number: number;
  title: string;
  content: any;
  notes?: string;
  layout: 'title' | 'content' | 'two_column' | 'image' | 'quote' | 'call_to_action';
}

function buildTitleSlide(company: any): DeckSlide {
  return {
    slide_number: 1,
    title: company.company_name || company.name || 'Company Presentation',
    content: {
      subtitle: company.tagline || company.short_description || '',
      logo: company.logo_url || null,
      background: company.brand_colors?.primary || '#1e40af'
    },
    layout: 'title'
  };
}

function buildProblemSlide(products: any[]): DeckSlide {
  const allPainPoints = new Set<string>();

  products.forEach(product => {
    if (product.pain_points_solved && Array.isArray(product.pain_points_solved)) {
      product.pain_points_solved.forEach(pp => allPainPoints.add(pp));
    }
  });

  return {
    slide_number: 2,
    title: 'The Problem',
    content: {
      problems: Array.from(allPainPoints).slice(0, 4),
      impact: 'These challenges are costing you time, money, and opportunities.'
    },
    notes: 'Focus on pain points that resonate with the audience',
    layout: 'content'
  };
}

function buildSolutionSlide(company: any, products: any[]): DeckSlide {
  return {
    slide_number: 3,
    title: 'Our Solution',
    content: {
      company_name: company.company_name || company.name,
      value_proposition: company.value_proposition || 'We provide comprehensive solutions to your challenges',
      key_offerings: products.slice(0, 3).map(p => ({
        name: p.name,
        description: p.short_description || p.description?.substring(0, 100)
      }))
    },
    notes: 'Highlight how our offerings directly address the problems mentioned',
    layout: 'content'
  };
}

function buildProductSlides(products: any[], variants: any[]): DeckSlide[] {
  return products.slice(0, 3).map((product, index) => {
    const productVariants = variants.filter(v => v.product_id === product.id);

    return {
      slide_number: 4 + index,
      title: product.name || `Product ${index + 1}`,
      content: {
        description: product.description,
        key_features: product.key_features || [],
        benefits: product.key_benefits || [],
        variants: productVariants.map(v => ({
          name: v.variant_name,
          price: v.price,
          best_for: v.ideal_for
        })),
        social_proof: product.testimonials || []
      },
      notes: `Emphasize unique value and benefits for ${product.target_personas?.join(', ') || 'target audience'}`,
      layout: 'two_column'
    };
  });
}

function buildPricingSlide(products: any[], variants: any[]): DeckSlide {
  const pricingTiers = products.map(product => {
    const productVariants = variants.filter(v => v.product_id === product.id);

    if (productVariants.length > 0) {
      return {
        product_name: product.name,
        options: productVariants.map(v => ({
          name: v.variant_name,
          price: v.price,
          features: v.features || []
        }))
      };
    }

    return {
      product_name: product.name,
      price: product.price,
      features: product.key_features || []
    };
  });

  return {
    slide_number: 7,
    title: 'Investment & Pricing',
    content: {
      tiers: pricingTiers,
      payment_terms: 'Flexible payment options available',
      value_message: 'An investment in your success'
    },
    notes: 'Frame pricing as investment, not cost. Highlight ROI.',
    layout: 'content'
  };
}

function buildSocialProofSlide(products: any[]): DeckSlide {
  const testimonials: any[] = [];
  const stats: any[] = [];

  products.forEach(product => {
    if (product.testimonials && Array.isArray(product.testimonials)) {
      testimonials.push(...product.testimonials);
    }

    if (product.success_metrics) {
      stats.push(...product.success_metrics);
    }
  });

  return {
    slide_number: 8,
    title: 'Success Stories',
    content: {
      testimonials: testimonials.slice(0, 3),
      metrics: stats.slice(0, 4),
      trust_indicators: ['Years in business', 'Happy clients', 'Success rate']
    },
    notes: 'Build credibility with real results and client feedback',
    layout: 'content'
  };
}

function buildCallToActionSlide(company: any): DeckSlide {
  return {
    slide_number: 9,
    title: 'Ready to Get Started?',
    content: {
      main_cta: 'Schedule Your Free Consultation',
      secondary_cta: 'Learn More',
      contact_info: {
        email: company.contact_email || '',
        phone: company.contact_phone || '',
        website: company.website || ''
      },
      urgency_message: 'Limited slots available this month'
    },
    notes: 'Create urgency and make next steps crystal clear',
    layout: 'call_to_action'
  };
}

function personalizeDeck(deck: GeneratedDeck, prospectData: any): GeneratedDeck {
  if (!prospectData) return deck;

  const personalizedSlides = deck.slides.map(slide => {
    if (slide.slide_number === 1) {
      return {
        ...slide,
        content: {
          ...slide.content,
          personalized_greeting: `Prepared for ${prospectData.full_name || prospectData.first_name || 'You'}`
        }
      };
    }

    if (slide.slide_number === 2) {
      if (prospectData.pain_points && Array.isArray(prospectData.pain_points)) {
        return {
          ...slide,
          content: {
            ...slide.content,
            problems: prospectData.pain_points.slice(0, 4),
            personalized: true
          },
          notes: `Specifically addresses ${prospectData.full_name || 'prospect'}'s mentioned challenges`
        };
      }
    }

    if (slide.title.includes('Product') || slide.title.includes('Solution')) {
      if (prospectData.interests || prospectData.preferred_products) {
        return {
          ...slide,
          notes: `${slide.notes || ''} | Prospect showed interest in: ${prospectData.interests || prospectData.preferred_products}`
        };
      }
    }

    return slide;
  });

  return {
    ...deck,
    slides: personalizedSlides,
    metadata: {
      ...deck.metadata,
      personalization_level: 'high',
      prospect_id: prospectData.id
    }
  };
}

export const pitchDeckIntegrationEngine = {
  async generateDeck(options: DeckGenerationOptions): Promise<GeneratedDeck | null> {
    const { userId, prospectId, prospectData, deckType = 'standard', includePersonalization = true } = options;

    const resolved = await dataSyncEngine.resolveDataForUser(userId);

    if (!resolved.company && resolved.products.length === 0) {
      console.error('Cannot generate deck: No company or product data available');
      return null;
    }

    const company = resolved.company || { name: 'Your Company' };
    const products = resolved.products;
    const services = resolved.services;
    const variants = resolved.variants;

    let slides: DeckSlide[] = [];

    slides.push(buildTitleSlide(company));

    if (products.length > 0) {
      slides.push(buildProblemSlide(products));
      slides.push(buildSolutionSlide(company, products));

      const productSlides = buildProductSlides(products, variants);
      slides.push(...productSlides);

      slides.push(buildPricingSlide(products, variants));
      slides.push(buildSocialProofSlide(products));
    } else {
      slides.push({
        slide_number: 2,
        title: 'Our Services',
        content: {
          services: services.map(s => ({
            name: s.service_name,
            description: s.description
          }))
        },
        layout: 'content'
      });
    }

    slides.push(buildCallToActionSlide(company));

    slides.forEach((slide, index) => {
      slide.slide_number = index + 1;
    });

    let deck: GeneratedDeck = {
      title: `${company.company_name || company.name} - Presentation`,
      slides,
      metadata: {
        generated_at: new Date().toISOString(),
        data_sources: [
          resolved.metadata.sources.company,
          resolved.metadata.sources.products,
          resolved.metadata.sources.services
        ],
        personalization_level: 'none'
      }
    };

    if (includePersonalization && (prospectId || prospectData)) {
      let prospect = prospectData;

      if (!prospect && prospectId) {
        const { data } = await supabase
          .from('prospects')
          .select('*')
          .eq('id', prospectId)
          .maybeSingle();

        prospect = data;
      }

      if (prospect) {
        deck = personalizeDeck(deck, prospect);
      }
    }

    return deck;
  },

  async saveDeck(userId: string, deck: GeneratedDeck): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('pitch_decks')
        .insert({
          user_id: userId,
          prospect_id: deck.metadata.prospect_id,
          title: deck.title,
          slides: deck.slides,
          metadata: deck.metadata,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, id: data.id };
    } catch (error) {
      console.error('Error saving pitch deck:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  async generateAndSave(options: DeckGenerationOptions): Promise<{
    success: boolean;
    deck?: GeneratedDeck;
    deckId?: string;
    error?: string;
  }> {
    try {
      const deck = await this.generateDeck(options);

      if (!deck) {
        return { success: false, error: 'Failed to generate deck' };
      }

      const saveResult = await this.saveDeck(options.userId, deck);

      if (!saveResult.success) {
        return { success: false, error: saveResult.error };
      }

      return { success: true, deck, deckId: saveResult.id };
    } catch (error) {
      console.error('Error in generateAndSave:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  async getDeckForProspect(userId: string, prospectId: string): Promise<GeneratedDeck | null> {
    try {
      const { data, error } = await supabase
        .from('pitch_decks')
        .select('*')
        .eq('user_id', userId)
        .eq('prospect_id', prospectId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        title: data.title,
        slides: data.slides,
        metadata: data.metadata
      };
    } catch (error) {
      console.error('Error fetching deck for prospect:', error);
      return null;
    }
  },

  getSlideSummary(deck: GeneratedDeck): string {
    return `
Pitch Deck: ${deck.title}
Total Slides: ${deck.slides.length}
Personalization: ${deck.metadata.personalization_level}
${deck.metadata.prospect_id ? `Prospect ID: ${deck.metadata.prospect_id}` : ''}

Slide Breakdown:
${deck.slides.map(s => `  ${s.slide_number}. ${s.title}`).join('\n')}
    `.trim();
  }
};
