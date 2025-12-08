/**
 * Pay As You Grow Pricing Configuration
 * Pro tier with base 300 limit + optional overage blocks
 */

export interface OverageBlock {
  blockNumber: number;
  contactRange: { start: number; end: number };
  price: number;
  cumulativeTotal: number;
}

export interface PayAsYouGrowPricing {
  basePrice: number;
  includedContacts: number;
  blocks: OverageBlock[];
}

export const PRO_TIER_PAY_AS_YOU_GROW: PayAsYouGrowPricing = {
  basePrice: 1299, // ₱1,299/month
  includedContacts: 300,
  blocks: []
};

// Generate overage blocks (decreasing by ₱10, minimum ₱0)
function generateOverageBlocks(): OverageBlock[] {
  const blocks: OverageBlock[] = [];
  let cumulativeTotal = PRO_TIER_PAY_AS_YOU_GROW.basePrice;
  
  // Generate blocks until price reaches ₱0
  for (let blockNum = 1; blockNum <= 100; blockNum++) {
    const price = Math.max(0, 499 - (blockNum - 1) * 10); // Starts at ₱499, decreases by ₱10
    const startContact = 300 + (blockNum - 1) * 300 + 1;
    const endContact = 300 + blockNum * 300;
    
    cumulativeTotal += price;
    
    blocks.push({
      blockNumber: blockNum,
      contactRange: { start: startContact, end: endContact },
      price,
      cumulativeTotal
    });
    
    // Stop generating if price is already ₱0
    if (price === 0) break;
  }
  
  return blocks;
}

// Initialize blocks
PRO_TIER_PAY_AS_YOU_GROW.blocks = generateOverageBlocks();

/**
 * Get price for a specific number of contacts
 */
export function getPriceForContacts(contactCount: number): {
  basePrice: number;
  overagePrice: number;
  totalPrice: number;
  blocksUsed: number;
  contactsIncluded: number;
  contactsOverage: number;
} {
  const { basePrice, includedContacts, blocks } = PRO_TIER_PAY_AS_YOU_GROW;
  
  if (contactCount <= includedContacts) {
    return {
      basePrice,
      overagePrice: 0,
      totalPrice: basePrice,
      blocksUsed: 0,
      contactsIncluded: contactCount,
      contactsOverage: 0
    };
  }
  
  const overageContacts = contactCount - includedContacts;
  const blocksNeeded = Math.ceil(overageContacts / 300);
  
  let overagePrice = 0;
  let contactsOverage = 0;
  
  for (let i = 0; i < Math.min(blocksNeeded, blocks.length); i++) {
    const block = blocks[i];
    if (i === blocksNeeded - 1) {
      // Last block - may be partial
      const contactsInThisBlock = Math.min(300, overageContacts - (i * 300));
      overagePrice += block.price;
      contactsOverage += contactsInThisBlock;
    } else {
      // Full block
      overagePrice += block.price;
      contactsOverage += 300;
    }
  }
  
  // If more blocks needed than defined, remaining are free
  if (blocksNeeded > blocks.length) {
    contactsOverage = overageContacts;
    // Price already calculated from defined blocks
  }
  
  return {
    basePrice,
    overagePrice,
    totalPrice: basePrice + overagePrice,
    blocksUsed: blocksNeeded,
    contactsIncluded: includedContacts,
    contactsOverage
  };
}

/**
 * Get next block price (for UI display)
 */
export function getNextBlockPrice(currentContacts: number): {
  nextBlockPrice: number;
  nextBlockRange: { start: number; end: number };
  isFree: boolean;
} {
  const { includedContacts, blocks } = PRO_TIER_PAY_AS_YOU_GROW;
  
  if (currentContacts < includedContacts) {
    const overageNeeded = includedContacts - currentContacts;
    return {
      nextBlockPrice: 0,
      nextBlockRange: { start: currentContacts + 1, end: includedContacts },
      isFree: true
    };
  }
  
  const overageContacts = currentContacts - includedContacts;
  const currentBlock = Math.floor(overageContacts / 300);
  const nextBlockIndex = currentBlock;
  
  if (nextBlockIndex >= blocks.length) {
    return {
      nextBlockPrice: 0,
      nextBlockRange: { 
        start: currentContacts + 1, 
        end: currentContacts + 300 
      },
      isFree: true
    };
  }
  
  const nextBlock = blocks[nextBlockIndex];
  return {
    nextBlockPrice: nextBlock.price,
    nextBlockRange: nextBlock.contactRange,
    isFree: nextBlock.price === 0
  };
}

/**
 * Get total price at 2,000,000 contacts
 */
export function getPriceAt2MContacts(): number {
  return getPriceForContacts(2000000).totalPrice;
}

/**
 * Format price in PHP
 */
export function formatPricePHP(amount: number): string {
  return `₱${amount.toLocaleString('en-PH', { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
  })}`;
}

/**
 * Get savings message vs Team tier
 */
export function getSavingsVsTeam(contactCount: number): string {
  const proPrice = getPriceForContacts(contactCount).totalPrice;
  const teamPrice = 6499; // Team tier price
  
  if (proPrice < teamPrice) {
    const savings = teamPrice - proPrice;
    return `Save ${formatPricePHP(savings)} vs Team tier`;
  }
  
  return 'Consider upgrading to Team tier for better value';
}

/**
 * Check if user should consider Team tier
 */
export function shouldConsiderTeam(contactCount: number): boolean {
  const proPrice = getPriceForContacts(contactCount).totalPrice;
  const teamPrice = 6499;
  const teamLimit = 1500; // 5 users × 300
  
  // Suggest Team if:
  // 1. Pro price is close to Team price (within 20%)
  // 2. User is approaching Team's limit
  return (proPrice >= teamPrice * 0.8) || (contactCount >= teamLimit * 0.9);
}

