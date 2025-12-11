/**
 * Ad Content Service
 * 
 * Provides different ad templates for video ads
 * Rotates through different ad types to showcase app features
 */

export interface AdContent {
  id: string;
  type: 'features' | 'testimonials' | 'chatbot' | 'industries' | 'fomo';
  title: string;
  headline: string;
  subheadline: string;
  features?: string[];
  testimonial?: {
    name: string;
    role: string;
    quote: string;
    result: string;
  };
  industry?: string;
  cta: string;
  backgroundColor: string;
  textColor: string;
  gradientColors: {
    from: string;
    to: string;
  };
}

const AD_TEMPLATES: AdContent[] = [
  {
    id: 'ad-features-001',
    type: 'features',
    title: 'Features & Benefits',
    headline: 'Stop Losing Leads. Start Closing Deals.',
    subheadline: 'NexScout helps Filipino sales professionals convert more prospects into paying customers.',
    features: [
      'AI-Powered Prospect Scanning',
      'Personalized Message Generation',
      'Smart Pipeline Management',
      'Automated Follow-Up Sequences'
    ],
    cta: 'Start Free Trial →',
    backgroundColor: 'from-blue-600 to-purple-600',
    textColor: 'text-white',
    gradientColors: {
      from: '#2563EB',
      to: '#9333EA'
    }
  },
  {
    id: 'ad-testimonials-001',
    type: 'testimonials',
    title: 'Success Stories',
    headline: 'Real Results from Real Users',
    subheadline: 'Join thousands of Filipino sales professionals growing their business with NexScout',
    testimonial: {
      name: 'Maria Santos',
      role: 'MLM Leader',
      quote: 'NexScout helped me convert 3x more prospects. My monthly income doubled in just 2 months!',
      result: 'Doubled monthly income'
    },
    cta: 'See More Success Stories →',
    backgroundColor: 'from-green-600 to-emerald-600',
    textColor: 'text-white',
    gradientColors: {
      from: '#16A34A',
      to: '#059669'
    }
  },
  {
    id: 'ad-chatbot-001',
    type: 'chatbot',
    title: 'AI Chatbot Advantage',
    headline: '24/7 AI Assistant That Never Sleeps',
    subheadline: 'Your AI chatbot engages visitors, qualifies leads, and converts them - even while you sleep.',
    features: [
      'Automatically responds to inquiries',
      'Qualifies leads with AI scoring',
      'Converts visitors to prospects',
      'Works in Taglish (Tagalog + English)'
    ],
    cta: 'Set Up Your AI Chatbot →',
    backgroundColor: 'from-purple-600 to-pink-600',
    textColor: 'text-white',
    gradientColors: {
      from: '#9333EA',
      to: '#DB2777'
    }
  },
  {
    id: 'ad-industries-001',
    type: 'industries',
    title: 'Multi-Industry Support',
    headline: 'Built for Every Filipino Business',
    subheadline: 'Whether you\'re in MLM, Insurance, Real Estate, E-commerce, or Services - NexScout adapts to your industry.',
    features: [
      'MLM & Network Marketing',
      'Insurance & Financial Services',
      'Real Estate & Property',
      'E-commerce & Retail',
      'Coaching & Consulting'
    ],
    cta: 'See Industry Features →',
    backgroundColor: 'from-orange-600 to-red-600',
    textColor: 'text-white',
    gradientColors: {
      from: '#EA580C',
      to: '#DC2626'
    }
  },
  {
    id: 'ad-fomo-001',
    type: 'fomo',
    title: 'Limited Time Offer',
    headline: '🎉 Special Launch Price - Ending Soon!',
    subheadline: 'Join 1,000+ early users who are already closing more deals. Limited spots available at introductory pricing.',
    features: [
      'First 100 users get lifetime 20% discount',
      'Exclusive early access to new features',
      'Priority customer support',
      'Free setup consultation (worth ₱2,000)'
    ],
    cta: 'Claim Your Spot Now →',
    backgroundColor: 'from-amber-600 to-orange-600',
    textColor: 'text-white',
    gradientColors: {
      from: '#D97706',
      to: '#EA580C'
    }
  },
  // Additional FOMO/Scarcity Ad
  {
    id: 'ad-scarcity-001',
    type: 'fomo',
    title: 'Last Chance',
    headline: '⏰ Only 47 Spots Left at This Price!',
    subheadline: 'Don\'t miss out! Get NexScout at introductory pricing before it goes back to regular rates. Limited availability.',
    features: [
      'Price increases to ₱1,999/month after 100 users',
      'Lock in your rate forever',
      'Join before January 15th',
      'Plus: Free 1-on-1 onboarding session'
    ],
    cta: 'Lock In Your Rate →',
    backgroundColor: 'from-red-600 to-pink-600',
    textColor: 'text-white',
    gradientColors: {
      from: '#DC2626',
      to: '#DB2777'
    }
  }
];

export const adContentService = {
  /**
   * Get a random ad from all templates
   */
  getRandomAd(): AdContent {
    const randomIndex = Math.floor(Math.random() * AD_TEMPLATES.length);
    return AD_TEMPLATES[randomIndex];
  },

  /**
   * Get ad by type
   */
  getAdByType(type: AdContent['type']): AdContent {
    const ads = AD_TEMPLATES.filter(ad => ad.type === type);
    if (ads.length === 0) return AD_TEMPLATES[0];
    const randomIndex = Math.floor(Math.random() * ads.length);
    return ads[randomIndex];
  },

  /**
   * Get all ads
   */
  getAllAds(): AdContent[] {
    return AD_TEMPLATES;
  },

  /**
   * Get ad by ID
   */
  getAdById(id: string): AdContent | null {
    return AD_TEMPLATES.find(ad => ad.id === id) || null;
  },

  /**
   * Get rotating ad (for sequential rotation)
   */
  getRotatingAd(seed?: number): AdContent {
    if (seed !== undefined) {
      return AD_TEMPLATES[seed % AD_TEMPLATES.length];
    }
    // Use current time to rotate ads throughout the day
    const hourOfDay = new Date().getHours();
    return AD_TEMPLATES[hourOfDay % AD_TEMPLATES.length];
  }
};


