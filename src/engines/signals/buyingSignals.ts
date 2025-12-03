/**
 * BUYING SIGNALS DETECTION ENGINE
 *
 * Detects when a user is ready to buy or showing high purchase intent
 * Optimized for Filipino sales conversations
 */

export type BuyingSignal =
  | "priceCheck"          // Asking about price (evaluation)
  | "readyToOrder"        // Ready to buy NOW (hot lead!)
  | "urgency"             // Needs it fast/today
  | "validation"          // Checking legitimacy (trust building)
  | "codInterest"         // Interested in COD (decision)
  | "deliveryCheck"       // Asking about shipping (decision)
  | "promoInterest"       // Looking for deals (price-sensitive)
  | "productComparison"   // Comparing options (evaluation)
  | "quantityInquiry"     // Asking about quantities (closing)
  | "paymentOptions"      // Payment method questions (closing)
  | "none";               // No buying signal detected

export interface BuyingSignalResult {
  signal: BuyingSignal;
  confidence: number;
  temperature: 'cold' | 'warm' | 'hot' | 'readyToBuy';
  suggestedAction: string;
}

/**
 * Detect buying signal from message
 */
export function detectBuyingSignal(message: string): BuyingSignal {
  const m = message.toLowerCase();

  // HIGHEST PRIORITY: Ready to order (HOT LEAD)
  if (/\b(order na|bili na|kuha ako|sige na|go na|ready ako|avail|pabili)\b/.test(m)) {
    return "readyToOrder";
  }

  // Price check (warm lead)
  if (/\b(magkano|price|how much|hm|presyo|cost|pila|rate)\b/.test(m)) {
    return "priceCheck";
  }

  // Urgency (hot signal)
  if (/\b(today|now|agad|rush|urgent|asap|kailangan na|ngayon)\b/.test(m)) {
    return "urgency";
  }

  // COD interest (decision stage)
  if (/\b(cod|cash on delivery|bayad pag dating|payment|pay)\b/.test(m)) {
    return "codInterest";
  }

  // Delivery/shipping check (decision stage)
  if (/\b(shipping|deliver|delivery|padala|hatid|saan|kelan darating)\b/.test(m)) {
    return "deliveryCheck";
  }

  // Quantity inquiry (closing signal)
  if (/\b(ilang|how many|pcs|pieces|pack|bottle|box)\b/.test(m)) {
    return "quantityInquiry";
  }

  // Payment options (closing signal)
  if (/\b(gcash|bank|transfer|payment options|paano bayad|bayad)\b/.test(m)) {
    return "paymentOptions";
  }

  // Validation/trust building (evaluation)
  if (/\b(legit|safe ba|totoo ba|may result|effective ba|works ba|proven|fda|registered)\b/.test(m)) {
    return "validation";
  }

  // Promo interest (price-sensitive)
  if (/\b(promo|discount|sale|offer|deal|murang|cheaper|mas mura)\b/.test(m)) {
    return "promoInterest";
  }

  // Product comparison (evaluation)
  if (/\b(compare|difference|vs|versus|better|best|which one|ano mas)\b/.test(m)) {
    return "productComparison";
  }

  return "none";
}

/**
 * Detect buying signal with full analysis
 */
export function detectBuyingSignalWithAnalysis(message: string): BuyingSignalResult {
  const signal = detectBuyingSignal(message);
  const m = message.toLowerCase();

  let confidence = 0.7;
  let temperature: 'cold' | 'warm' | 'hot' | 'readyToBuy' = 'cold';
  let suggestedAction = '';

  switch (signal) {
    case "readyToOrder":
      confidence = 0.95;
      temperature = 'readyToBuy';
      suggestedAction = 'send_order_instructions_immediately';
      break;

    case "urgency":
      confidence = 0.9;
      temperature = 'hot';
      suggestedAction = 'emphasize_fast_delivery_and_close';
      break;

    case "quantityInquiry":
      confidence = 0.85;
      temperature = 'hot';
      suggestedAction = 'offer_bundle_deals_and_close';
      break;

    case "paymentOptions":
      confidence = 0.85;
      temperature = 'hot';
      suggestedAction = 'explain_payment_and_close';
      break;

    case "priceCheck":
      confidence = 0.8;
      temperature = 'warm';
      suggestedAction = 'present_value_and_bundles';
      break;

    case "codInterest":
      confidence = 0.8;
      temperature = 'warm';
      suggestedAction = 'confirm_cod_available_and_close';
      break;

    case "deliveryCheck":
      confidence = 0.75;
      temperature = 'warm';
      suggestedAction = 'explain_shipping_and_move_to_order';
      break;

    case "validation":
      confidence = 0.7;
      temperature = 'warm';
      suggestedAction = 'provide_social_proof_and_guarantees';
      break;

    case "promoInterest":
      confidence = 0.75;
      temperature = 'warm';
      suggestedAction = 'present_bundle_savings';
      break;

    case "productComparison":
      confidence = 0.7;
      temperature = 'warm';
      suggestedAction = 'highlight_unique_benefits';
      break;

    default:
      confidence = 0.5;
      temperature = 'cold';
      suggestedAction = 'qualify_needs_and_educate';
  }

  // Boost confidence if message is long and detailed
  if (message.length > 50) {
    confidence = Math.min(confidence + 0.05, 1.0);
  }

  // Boost if multiple signals
  const signals = [
    /magkano/.test(m),
    /order/.test(m),
    /cod/.test(m),
    /delivery/.test(m),
    /promo/.test(m)
  ].filter(Boolean).length;

  if (signals > 1) {
    temperature = temperature === 'cold' ? 'warm' : temperature === 'warm' ? 'hot' : temperature;
  }

  return {
    signal,
    confidence,
    temperature,
    suggestedAction
  };
}

/**
 * Get all buying signals in a message
 */
export function detectMultipleBuyingSignals(message: string): BuyingSignal[] {
  const signals: BuyingSignal[] = [];
  const m = message.toLowerCase();

  if (/\b(order na|bili na|ready ako)\b/.test(m)) signals.push("readyToOrder");
  if (/\b(magkano|price|how much)\b/.test(m)) signals.push("priceCheck");
  if (/\b(today|now|agad|urgent)\b/.test(m)) signals.push("urgency");
  if (/\b(cod|cash on delivery)\b/.test(m)) signals.push("codInterest");
  if (/\b(shipping|deliver|padala)\b/.test(m)) signals.push("deliveryCheck");
  if (/\b(ilang|how many|pack)\b/.test(m)) signals.push("quantityInquiry");
  if (/\b(gcash|bank|payment)\b/.test(m)) signals.push("paymentOptions");
  if (/\b(legit|safe ba|totoo ba)\b/.test(m)) signals.push("validation");
  if (/\b(promo|discount|sale)\b/.test(m)) signals.push("promoInterest");
  if (/\b(compare|difference|vs)\b/.test(m)) signals.push("productComparison");

  return signals.length > 0 ? signals : ["none"];
}

/**
 * Calculate overall buying intent score (0-100)
 */
export function calculateBuyingIntentScore(
  signals: BuyingSignal[],
  messageHistory: string[]
): number {
  let score = 0;

  // Score per signal
  const signalScores: Record<BuyingSignal, number> = {
    readyToOrder: 40,
    urgency: 30,
    quantityInquiry: 25,
    paymentOptions: 25,
    codInterest: 20,
    deliveryCheck: 15,
    priceCheck: 15,
    validation: 10,
    promoInterest: 10,
    productComparison: 10,
    none: 0
  };

  // Add scores for detected signals
  for (const signal of signals) {
    score += signalScores[signal] || 0;
  }

  // Boost score based on conversation history
  const historyText = messageHistory.join(' ').toLowerCase();
  if (/order|bili/.test(historyText)) score += 5;
  if (/magkano|price/.test(historyText)) score += 5;
  if (/interested|gusto/.test(historyText)) score += 5;

  // Cap at 100
  return Math.min(score, 100);
}

/**
 * Get human-readable signal description
 */
export function getBuyingSignalDescription(signal: BuyingSignal): string {
  const descriptions: Record<BuyingSignal, string> = {
    priceCheck: "Asking about price - evaluation stage",
    readyToOrder: "READY TO BUY NOW - hot lead!",
    urgency: "Needs it fast - high intent",
    validation: "Checking legitimacy - trust building",
    codInterest: "Interested in COD - decision stage",
    deliveryCheck: "Asking about shipping - decision stage",
    promoInterest: "Looking for deals - price-sensitive",
    productComparison: "Comparing options - evaluation",
    quantityInquiry: "Asking about quantities - closing signal",
    paymentOptions: "Payment questions - closing signal",
    none: "No buying signal detected"
  };

  return descriptions[signal] || signal;
}
