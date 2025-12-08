/**
 * Contact-Based Pricing Configuration
 * Inspired by ManyChat's pricing model, adapted for PHP with psychological pricing
 */

export interface ContactTier {
  maxContacts: number;
  monthlyPrice: number;
  pricePer1KContacts: number;
  annualPrice: number; // 20% discount
  displayName: string;
  badge?: string;
  popular?: boolean;
}

export const CONTACT_PRICING_TIERS: ContactTier[] = [
  {
    maxContacts: 500,
    monthlyPrice: 849,
    pricePer1KContacts: 1698,
    annualPrice: 8147, // 849 * 12 * 0.8
    displayName: 'Starter',
    badge: 'Best for Small'
  },
  {
    maxContacts: 2500,
    monthlyPrice: 1399,
    pricePer1KContacts: 559.6,
    annualPrice: 13430, // 1399 * 12 * 0.8
    displayName: 'Growth',
    badge: 'Most Popular',
    popular: true
  },
  {
    maxContacts: 5000,
    monthlyPrice: 2549,
    pricePer1KContacts: 509.8,
    annualPrice: 24470,
    displayName: 'Business'
  },
  {
    maxContacts: 10000,
    monthlyPrice: 3699,
    pricePer1KContacts: 369.9,
    annualPrice: 35510,
    displayName: 'Professional'
  },
  {
    maxContacts: 15000,
    monthlyPrice: 5399,
    pricePer1KContacts: 359.93,
    annualPrice: 51830,
    displayName: 'Advanced'
  },
  {
    maxContacts: 20000,
    monthlyPrice: 7099,
    pricePer1KContacts: 354.95,
    annualPrice: 68150,
    displayName: 'Enterprise'
  },
  {
    maxContacts: 30000,
    monthlyPrice: 9399,
    pricePer1KContacts: 313.3,
    annualPrice: 90230,
    displayName: 'Enterprise Plus'
  },
  {
    maxContacts: 40000,
    monthlyPrice: 11099,
    pricePer1KContacts: 277.48,
    annualPrice: 106550,
    displayName: 'Scale'
  },
  {
    maxContacts: 50000,
    monthlyPrice: 13399,
    pricePer1KContacts: 267.98,
    annualPrice: 128630,
    displayName: 'Scale Plus'
  },
  {
    maxContacts: 60000,
    monthlyPrice: 15699,
    pricePer1KContacts: 261.65,
    annualPrice: 150710,
    displayName: 'Premium'
  },
  {
    maxContacts: 70000,
    monthlyPrice: 17949,
    pricePer1KContacts: 256.41,
    annualPrice: 172310,
    displayName: 'Premium Plus'
  },
  {
    maxContacts: 80000,
    monthlyPrice: 20199,
    pricePer1KContacts: 252.49,
    annualPrice: 193910,
    displayName: 'Elite'
  },
  {
    maxContacts: 90000,
    monthlyPrice: 22499,
    pricePer1KContacts: 249.99,
    annualPrice: 215990,
    displayName: 'Elite Plus'
  },
  {
    maxContacts: 100000,
    monthlyPrice: 24799,
    pricePer1KContacts: 247.99,
    annualPrice: 238070,
    displayName: 'Ultimate'
  },
  {
    maxContacts: 120000,
    monthlyPrice: 29349,
    pricePer1KContacts: 244.58,
    annualPrice: 281750,
    displayName: 'Ultimate Plus'
  },
  {
    maxContacts: 140000,
    monthlyPrice: 33899,
    pricePer1KContacts: 242.14,
    annualPrice: 325430,
    displayName: 'Platinum'
  },
  {
    maxContacts: 160000,
    monthlyPrice: 38449,
    pricePer1KContacts: 240.31,
    annualPrice: 369110,
    displayName: 'Platinum Plus'
  },
  {
    maxContacts: 180000,
    monthlyPrice: 42999,
    pricePer1KContacts: 238.88,
    annualPrice: 412790,
    displayName: 'Diamond'
  },
  {
    maxContacts: 200000,
    monthlyPrice: 47599,
    pricePer1KContacts: 237.99,
    annualPrice: 456950,
    displayName: 'Diamond Plus'
  },
  {
    maxContacts: 300000,
    monthlyPrice: 70399,
    pricePer1KContacts: 234.66,
    annualPrice: 675830,
    displayName: 'Enterprise Max'
  },
  {
    maxContacts: 400000,
    monthlyPrice: 93199,
    pricePer1KContacts: 232.99,
    annualPrice: 894710,
    displayName: 'Enterprise Max Plus'
  },
  {
    maxContacts: 500000,
    monthlyPrice: 115999,
    pricePer1KContacts: 231.99,
    annualPrice: 1113590,
    displayName: 'Corporate'
  },
  {
    maxContacts: 600000,
    monthlyPrice: 138799,
    pricePer1KContacts: 231.33,
    annualPrice: 1332470,
    displayName: 'Corporate Plus'
  },
  {
    maxContacts: 700000,
    monthlyPrice: 161599,
    pricePer1KContacts: 230.86,
    annualPrice: 1551350,
    displayName: 'Enterprise Elite'
  },
  {
    maxContacts: 800000,
    monthlyPrice: 184399,
    pricePer1KContacts: 230.5,
    annualPrice: 1770230,
    displayName: 'Enterprise Elite Plus'
  },
  {
    maxContacts: 900000,
    monthlyPrice: 207199,
    pricePer1KContacts: 230.22,
    annualPrice: 1989110,
    displayName: 'Enterprise Ultimate'
  },
  {
    maxContacts: 1000000,
    monthlyPrice: 229999,
    pricePer1KContacts: 229.99,
    annualPrice: 2207990,
    displayName: 'Enterprise Ultimate Plus'
  },
  {
    maxContacts: 1200000,
    monthlyPrice: 275599,
    pricePer1KContacts: 229.67,
    annualPrice: 2645750,
    displayName: 'Mega Enterprise'
  },
  {
    maxContacts: 1400000,
    monthlyPrice: 321199,
    pricePer1KContacts: 229.43,
    annualPrice: 3083510,
    displayName: 'Mega Enterprise Plus'
  },
  {
    maxContacts: 1600000,
    monthlyPrice: 366799,
    pricePer1KContacts: 229.25,
    annualPrice: 3521270,
    displayName: 'Global Enterprise'
  },
  {
    maxContacts: 1800000,
    monthlyPrice: 412399,
    pricePer1KContacts: 228.99,
    annualPrice: 3959030,
    displayName: 'Global Enterprise Plus'
  },
  {
    maxContacts: 2000000,
    monthlyPrice: 457999,
    pricePer1KContacts: 228.99,
    annualPrice: 4396790,
    displayName: 'Unlimited'
  },
  {
    maxContacts: 2000001,
    monthlyPrice: 503599,
    pricePer1KContacts: 251.8,
    annualPrice: 4834550,
    displayName: 'Unlimited Plus',
    badge: 'Custom Pricing'
  }
];

/**
 * Get pricing tier based on number of contacts
 */
export function getTierForContacts(contactCount: number): ContactTier {
  // Find the smallest tier that accommodates the contact count
  for (const tier of CONTACT_PRICING_TIERS) {
    if (contactCount <= tier.maxContacts) {
      return tier;
    }
  }
  // If exceeds all tiers, return the highest tier
  return CONTACT_PRICING_TIERS[CONTACT_PRICING_TIERS.length - 1];
}

/**
 * Calculate price for a specific number of contacts
 */
export function calculatePriceForContacts(contactCount: number, billingCycle: 'monthly' | 'annual' = 'monthly'): number {
  const tier = getTierForContacts(contactCount);
  return billingCycle === 'annual' ? tier.annualPrice : tier.monthlyPrice;
}

/**
 * Get recommended tier based on current contact count
 */
export function getRecommendedTier(currentContacts: number, growthRate: number = 0.2): ContactTier {
  // Project 3 months ahead with growth rate
  const projectedContacts = Math.ceil(currentContacts * (1 + growthRate) ** 3);
  return getTierForContacts(projectedContacts);
}

/**
 * Format price in PHP
 */
export function formatPricePHP(amount: number): string {
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/**
 * Get savings message for annual billing
 */
export function getAnnualSavings(tier: ContactTier): string {
  const monthlyTotal = tier.monthlyPrice * 12;
  const savings = monthlyTotal - tier.annualPrice;
  const savingsPercent = Math.round((savings / monthlyTotal) * 100);
  return `Save ₱${savings.toLocaleString()} (${savingsPercent}% off) with annual billing`;
}

