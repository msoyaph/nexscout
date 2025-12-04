import { supabase } from '../lib/supabase';
import { MergedCompanyData } from './companyMultiSiteCrawler';
import { CompanyKnowledgeGraph } from './companyKnowledgeGraph';

export interface DeckSlide {
  slideNumber: number;
  title: string;
  content: string[];
  layout: 'title' | 'bullet' | 'image' | 'quote' | 'stats' | 'cta';
  notes?: string;
}

export interface MasterPitchDeck {
  title: string;
  subtitle: string;
  slides: DeckSlide[];
  tone: 'professional' | 'friendly' | 'aggressive';
  generatedAt: string;
}

export class CompanyMasterDeckGenerator {
  generateMasterDeck(
    companyData: MergedCompanyData,
    knowledgeGraph: CompanyKnowledgeGraph,
    tone: 'professional' | 'friendly' | 'aggressive' = 'professional',
    tier: string = 'free'
  ): MasterPitchDeck {
    const slides: DeckSlide[] = [];

    slides.push(this.generateTitleSlide(companyData, tone));

    slides.push(this.generateMissionValuesSlide(companyData));

    slides.push(this.generateMarketProblemSlide(companyData, knowledgeGraph));

    slides.push(this.generateSolutionSlide(companyData));

    slides.push(this.generateProductLineSlide(companyData));

    slides.push(this.generateBenefitsSlide(companyData, knowledgeGraph));

    slides.push(this.generateUSPSlide(companyData, knowledgeGraph));

    slides.push(this.generateSocialProofSlide(companyData));

    slides.push(this.generateTestimonialsSlide(companyData));

    slides.push(this.generateWhyNowSlide(companyData, tone));

    slides.push(this.generateTargetCustomerSlide(companyData));

    slides.push(this.generateOfferSlide(companyData));

    if (tier === 'pro' || tier === 'elite') {
      slides.push(this.generatePricingSlide(companyData));
      slides.push(this.generateCompetitiveAdvantageSlide(companyData, knowledgeGraph));
      slides.push(this.generateRoadmapSlide(companyData));
    }

    slides.push(this.generateCTASlide(companyData, tone));

    if (tier === 'elite') {
      slides.push(this.generateTeamSlide(companyData));
      slides.push(this.generateContactSlide(companyData));
      slides.push(this.generateThankYouSlide(companyData));
    }

    return {
      title: `${companyData.displayName} - Pitch Deck`,
      subtitle: companyData.positioning || companyData.description.slice(0, 100),
      slides,
      tone,
      generatedAt: new Date().toISOString(),
    };
  }

  private generateTitleSlide(data: MergedCompanyData, tone: string): DeckSlide {
    return {
      slideNumber: 1,
      title: data.displayName,
      content: [
        data.positioning || data.description.slice(0, 100),
        tone === 'aggressive' ? 'Transform Your Business Today' : 'Your Partner in Growth',
      ],
      layout: 'title',
    };
  }

  private generateMissionValuesSlide(data: MergedCompanyData): DeckSlide {
    return {
      slideNumber: 2,
      title: 'Our Mission & Values',
      content: [
        `Mission: ${data.mission || 'Empowering businesses to succeed'}`,
        '',
        'Core Values:',
        ...data.values.map(v => `• ${v}`),
      ],
      layout: 'bullet',
    };
  }

  private generateMarketProblemSlide(data: MergedCompanyData, graph: CompanyKnowledgeGraph): DeckSlide {
    const painNodes = graph.nodes.filter(n => n.type === 'pain_point');

    return {
      slideNumber: 3,
      title: 'The Market Problem',
      content: [
        'Businesses today face critical challenges:',
        '',
        ...painNodes.slice(0, 4).map(p => `• ${p.label}`),
        '',
        'These problems cost time, money, and opportunities.',
      ],
      layout: 'bullet',
    };
  }

  private generateSolutionSlide(data: MergedCompanyData): DeckSlide {
    return {
      slideNumber: 4,
      title: 'Our Solution',
      content: [
        data.description,
        '',
        'We provide:',
        ...data.uniqueSellingPoints.slice(0, 3).map(usp => `• ${usp}`),
      ],
      layout: 'bullet',
    };
  }

  private generateProductLineSlide(data: MergedCompanyData): DeckSlide {
    return {
      slideNumber: 5,
      title: 'Products & Services',
      content: [
        ...data.products.slice(0, 5).map(p => `• ${p.name}: ${p.description.slice(0, 80)}`),
        ...data.services.slice(0, 5).map(s => `• ${s.name}: ${s.description.slice(0, 80)}`),
      ],
      layout: 'bullet',
    };
  }

  private generateBenefitsSlide(data: MergedCompanyData, graph: CompanyKnowledgeGraph): DeckSlide {
    const benefitChains = graph.insights.benefit_chains;

    return {
      slideNumber: 6,
      title: 'Key Benefits',
      content: [
        'What you gain:',
        '',
        ...benefitChains.slice(0, 4).map(chain => `• ${chain.benefit}`),
        ...data.uniqueSellingPoints.slice(0, 3).map(usp => `• ${usp}`),
      ],
      layout: 'bullet',
    };
  }

  private generateUSPSlide(data: MergedCompanyData, graph: CompanyKnowledgeGraph): DeckSlide {
    return {
      slideNumber: 7,
      title: 'What Makes Us Different',
      content: [
        'Our Unique Advantages:',
        '',
        ...graph.insights.top_unique_selling_points.map(usp => `• ${usp}`),
        '',
        `Brand Promise: ${data.brandTone} approach with proven results`,
      ],
      layout: 'bullet',
    };
  }

  private generateSocialProofSlide(data: MergedCompanyData): DeckSlide {
    return {
      slideNumber: 8,
      title: 'Trusted By Leaders',
      content: [
        `${data.socialProof.length}+ satisfied customers`,
        '',
        'Our clients see real results:',
        ...data.socialProof.slice(0, 3).map(proof => `• ${proof.type}: ${proof.text.slice(0, 80)}`),
      ],
      layout: 'stats',
    };
  }

  private generateTestimonialsSlide(data: MergedCompanyData): DeckSlide {
    const testimonials = data.socialProof.filter(p => p.rating);

    return {
      slideNumber: 9,
      title: 'What Clients Say',
      content: testimonials.length > 0
        ? testimonials.slice(0, 2).map(t => `"${t.text.slice(0, 150)}..." - ${t.rating}/5 stars`)
        : ['Join hundreds of satisfied customers', 'Experience the difference today'],
      layout: 'quote',
    };
  }

  private generateWhyNowSlide(data: MergedCompanyData, tone: string): DeckSlide {
    return {
      slideNumber: 10,
      title: 'Why Act Now?',
      content: [
        tone === 'aggressive'
          ? 'The market waits for no one. Your competitors are already moving.'
          : 'The time for transformation is now.',
        '',
        'Current market conditions favor early adopters',
        'Limited availability for premium partnerships',
        'Special launch pricing expires soon',
      ],
      layout: 'bullet',
    };
  }

  private generateTargetCustomerSlide(data: MergedCompanyData): DeckSlide {
    return {
      slideNumber: 11,
      title: 'Who We Serve',
      content: [
        'Perfect For:',
        '',
        ...data.targetAudience.map(aud => `• ${aud}`),
        '',
        `Industry Focus: ${data.industry || 'Multiple sectors'}`,
      ],
      layout: 'bullet',
    };
  }

  private generateOfferSlide(data: MergedCompanyData): DeckSlide {
    return {
      slideNumber: 12,
      title: 'Our Offer',
      content: [
        'Get Started Today:',
        '',
        ...data.callsToAction.slice(0, 3),
        '',
        'Flexible solutions tailored to your needs',
      ],
      layout: 'bullet',
    };
  }

  private generatePricingSlide(data: MergedCompanyData): DeckSlide {
    return {
      slideNumber: 13,
      title: 'Investment & Pricing',
      content: [
        'Flexible Pricing Models:',
        '',
        '• Starter Package: Essential features',
        '• Professional: Full platform access',
        '• Enterprise: Custom solutions',
        '',
        'All plans include dedicated support',
      ],
      layout: 'bullet',
    };
  }

  private generateCompetitiveAdvantageSlide(data: MergedCompanyData, graph: CompanyKnowledgeGraph): DeckSlide {
    return {
      slideNumber: 14,
      title: 'Competitive Advantages',
      content: [
        'Why Choose Us Over Competitors:',
        '',
        ...graph.insights.top_unique_selling_points.map(usp => `• ${usp}`),
        '',
        'Proven track record of success',
      ],
      layout: 'bullet',
    };
  }

  private generateRoadmapSlide(data: MergedCompanyData): DeckSlide {
    return {
      slideNumber: 15,
      title: 'Roadmap & Vision',
      content: [
        'Our Journey Forward:',
        '',
        '• Q1: Enhanced features & integrations',
        '• Q2: Expanded market presence',
        '• Q3: New product launches',
        '• Q4: Global expansion',
      ],
      layout: 'bullet',
    };
  }

  private generateCTASlide(data: MergedCompanyData, tone: string): DeckSlide {
    return {
      slideNumber: 16,
      title: tone === 'aggressive' ? 'Take Action Now' : "Let's Get Started",
      content: [
        tone === 'aggressive' ? 'Don\'t wait. Your success starts today.' : 'Ready to transform your business?',
        '',
        ...data.callsToAction.slice(0, 2),
        '',
        `Contact: ${data.channels.website || 'Visit our website'}`,
      ],
      layout: 'cta',
    };
  }

  private generateTeamSlide(data: MergedCompanyData): DeckSlide {
    return {
      slideNumber: 17,
      title: 'Our Team',
      content: [
        'Led by industry experts',
        'Decades of combined experience',
        'Passionate about your success',
        '',
        'Your dedicated partners in growth',
      ],
      layout: 'bullet',
    };
  }

  private generateContactSlide(data: MergedCompanyData): DeckSlide {
    return {
      slideNumber: 18,
      title: 'Get In Touch',
      content: [
        `Website: ${data.channels.website || 'Coming soon'}`,
        `Facebook: ${data.channels.facebook || 'Find us on Facebook'}`,
        `LinkedIn: ${data.channels.linkedin || 'Connect on LinkedIn'}`,
        '',
        'We\'re here to help you succeed',
      ],
      layout: 'bullet',
    };
  }

  private generateThankYouSlide(data: MergedCompanyData): DeckSlide {
    return {
      slideNumber: 19,
      title: 'Thank You',
      content: [
        `${data.displayName}`,
        '',
        'Your Success Partner',
        '',
        `${data.positioning || 'Building better futures together'}`,
      ],
      layout: 'title',
    };
  }

  async saveMasterDeck(userId: string, companyId: string, deck: MasterPitchDeck): Promise<string> {
    const { data, error } = await supabase
      .from('pitch_decks')
      .insert({
        user_id: userId,
        title: deck.title,
        subtitle: deck.subtitle,
        slides: deck.slides,
        tone: deck.tone,
        is_master_deck: true,
        company_id: companyId,
        generated_by: 'ai_master',
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }
}

export const companyMasterDeckGenerator = new CompanyMasterDeckGenerator();
