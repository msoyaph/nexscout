/**
 * AI Pipeline Automation Costs Configuration
 * 
 * Updated: December 3, 2025
 * Change: Increased 2.5x for strategic pricing optimization
 * Rationale: Still 50-75% cheaper than competitors while increasing revenue
 */

export interface AutomationCost {
  energy: number;
  coins: number;
  description: string;
  estimatedDuration: number; // seconds
  aiModel: 'gpt-4o' | 'gpt-3.5-turbo';
}

/**
 * AUTOMATION COSTS (2.5x OPTIMIZED PRICING)
 * 
 * Previous costs were too low (99% margins).
 * New costs capture more value while staying cheapest in market.
 * 
 * Comparison:
 * - Salesforce Smart Scan: ₱840
 * - Our Smart Scan: ₱349 (58% cheaper) ✅
 */
export const AUTOMATION_COSTS: Record<string, AutomationCost> = {
  smart_scan: {
    energy: 25,  // Was: 10 (2.5x increase)
    coins: 15,   // Was: 5 (3x increase)
    description: 'Deep prospect analysis with ScoutScore update',
    estimatedDuration: 15,
    aiModel: 'gpt-4o',
  },
  
  follow_up: {
    energy: 40,  // Was: 15 (2.67x increase)
    coins: 25,   // Was: 8 (3.13x increase)
    description: 'Generate personalized follow-up message',
    estimatedDuration: 12,
    aiModel: 'gpt-4o',
  },
  
  qualify: {
    energy: 55,  // Was: 20 (2.75x increase)
    coins: 35,   // Was: 10 (3.5x increase)
    description: 'AI-powered BANT/SPIN qualification',
    estimatedDuration: 18,
    aiModel: 'gpt-4o',
  },
  
  nurture: {
    energy: 70,  // Was: 25 (2.8x increase)
    coins: 45,   // Was: 12 (3.75x increase)
    description: 'Create 3-7 message nurture sequence',
    estimatedDuration: 25,
    aiModel: 'gpt-4o',
  },
  
  book_meeting: {
    energy: 90,  // Was: 30 (3x increase)
    coins: 55,   // Was: 15 (3.67x increase)
    description: 'Generate meeting invite with calendar link',
    estimatedDuration: 15,
    aiModel: 'gpt-4o',
  },
  
  close_deal: {
    energy: 150, // Was: 50 (3x increase)
    coins: 85,   // Was: 25 (3.4x increase)
    description: 'Initiate AI closing sequence with offer',
    estimatedDuration: 20,
    aiModel: 'gpt-4o',
  },
  
  full_pipeline: {
    energy: 300, // Was: 100 (3x increase)
    coins: 175,  // Was: 50 (3.5x increase)
    description: 'Complete end-to-end pipeline automation',
    estimatedDuration: 60,
    aiModel: 'gpt-4o',
  },
};

/**
 * Get automation cost by type
 */
export function getAutomationCost(jobType: string): AutomationCost {
  return AUTOMATION_COSTS[jobType] || AUTOMATION_COSTS.smart_scan;
}

/**
 * Check if user can afford automation
 */
export function canAffordAutomation(
  jobType: string,
  userEnergy: number,
  userCoins: number
): { canAfford: boolean; missing: { energy: number; coins: number } } {
  const cost = getAutomationCost(jobType);
  
  const missingEnergy = Math.max(0, cost.energy - userEnergy);
  const missingCoins = Math.max(0, cost.coins - userCoins);
  
  return {
    canAfford: missingEnergy === 0 && missingCoins === 0,
    missing: {
      energy: missingEnergy,
      coins: missingCoins,
    },
  };
}

/**
 * Format cost for display
 */
export function formatCost(jobType: string): string {
  const cost = getAutomationCost(jobType);
  return `${cost.energy} energy + ${cost.coins} coins`;
}

/**
 * Calculate total cost for multiple automations
 */
export function calculateBulkCost(jobType: string, count: number): {
  energy: number;
  coins: number;
  formatted: string;
} {
  const cost = getAutomationCost(jobType);
  
  return {
    energy: cost.energy * count,
    coins: cost.coins * count,
    formatted: `${cost.energy * count} energy + ${cost.coins * count} coins`,
  };
}




