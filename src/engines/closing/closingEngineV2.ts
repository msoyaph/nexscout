/**
 * AI CLOSING ENGINE V2
 *
 * The final orchestrator that brings everything together:
 * - Intent detection
 * - Funnel stage awareness
 * - Buying signal recognition
 * - Objection handling
 * - Strategic closing responses
 *
 * This engine makes the AI actually CLOSE sales like a real Filipino closer.
 */

import type { UserIntent } from "../messaging/intentRouter";
import type { FunnelStage } from "../funnel/funnelEngineV3";
import type { BuyingSignal } from "../signals/buyingSignals";
import { getObjectionResponse } from "../objections/objectionEngine";
import { getFunnelSequence } from "../funnel/funnelSequences";

export interface ClosingContext {
  intent: UserIntent;
  funnelStage: FunnelStage;
  buyingSignal: BuyingSignal;
  productName?: string;
  price?: string | number;
  companyName?: string;
  personaName?: string;
  tone?: "warm" | "professional" | "taglish" | "friendly" | "persuasive" | "casual";
  hasMultipleProducts?: boolean;
  hasCOD?: boolean;
  hasPromo?: boolean;
}

export interface ClosingResponse {
  message: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  nextStep: string;
  shouldEscalate: boolean;
}

/**
 * Build closing response based on full context
 * This is the MAIN function that orchestrates everything
 */
export function buildClosingResponse(ctx: ClosingContext): ClosingResponse {
  const {
    intent,
    funnelStage,
    buyingSignal,
    productName = "our product",
    price = "Contact us",
    companyName = "our company",
    personaName = "I",
    tone = "taglish",
    hasCOD = true,
    hasPromo = false
  } = ctx;

  let message = '';
  let urgency: 'low' | 'medium' | 'high' | 'critical' = 'low';
  let nextStep = '';
  let shouldEscalate = false;

  // 🔥 1️⃣ CRITICAL PRIORITY: READY TO BUY → Direct close
  if (buyingSignal === "readyToOrder" || intent === "ready_to_buy") {
    urgency = 'critical';
    shouldEscalate = true;
    nextStep = 'collect_order_details';

    message = `Ay perfect po! 😊 Since ready na po kayo, eto po ang fastest way:

👉 1. Tell me your location
👉 2. I'll check ${hasCOD ? 'COD/' : ''}delivery options
👉 3. I'll help you place your order now

Very quick lang po, ${personaName} will guide you step-by-step.`;

    return { message, urgency, nextStep, shouldEscalate };
  }

  // 🔥 2️⃣ HIGH PRIORITY: PRICE CHECK → Value framing + soft close
  if (intent === "price" || buyingSignal === "priceCheck") {
    urgency = 'medium';
    nextStep = 'present_value_and_close';

    message = `Sige po! For **${productName}**, the price is **₱${price}**.

Pero ito po ang maganda — hindi lang po siya regular product.
Marami pong customers ang nag-improve ang **energy, sleep quality, digestion, at daily stamina** after 1–2 weeks.

${hasPromo ? '🔥 Plus may special promo kami ngayon!\n\n' : ''}If you want, I can share po the best option based sa health goals n'yo.
Gusto n'yo po ba ng **quick recommendation**? 😊`;

    return { message, urgency, nextStep, shouldEscalate: false };
  }

  // 🔥 3️⃣ SHIPPING / COD → Conversion shortcut
  if (intent === "shipping_cod" || buyingSignal === "codInterest") {
    urgency = 'high';
    nextStep = 'collect_delivery_details';
    shouldEscalate = true;

    message = hasCOD
      ? `Yes po! ✔️ COD (Cash on Delivery) is available.
Pwede pong sa bahay niyo mismo i-deliver.

Ready po ba kayong i-check ang delivery details so we can proceed? 😊`
      : `For payment po, we accept:
✔️ GCash
✔️ Bank Transfer
✔️ Online checkout

Ready na po ba kayo mag-order? I'll guide you step-by-step 😊`;

    return { message, urgency, nextStep, shouldEscalate };
  }

  // 🔥 4️⃣ QUANTITY INQUIRY → Bundle close
  if (buyingSignal === "quantityInquiry") {
    urgency = 'high';
    nextStep = 'present_bundles_and_close';
    shouldEscalate = true;

    message = `Great question po! Here are your options:

📦 **1 pack** - ₱${price} (perfect to try!)
📦 **3 packs** - Better value (most popular!)
📦 **5 packs** - Best savings (recommended!)

${hasPromo ? '🔥 Plus meron pang promo ngayon!\n\n' : ''}Ilang pack po ang gusto n'yo? I can help you order now 😊`;

    return { message, urgency, nextStep, shouldEscalate };
  }

  // 🔥 5️⃣ PAYMENT OPTIONS → Almost closing
  if (buyingSignal === "paymentOptions") {
    urgency = 'high';
    nextStep = 'explain_payment_and_close';
    shouldEscalate = true;

    message = `Perfect po! We accept:

💳 **GCash** - Instant and secure
🏦 **Bank Transfer** - Any major bank
${hasCOD ? '💵 **COD** - Pay when you receive\n' : ''}🌐 **Online Checkout** - Fast and easy

Which payment method po mas convenient for you? 😊`;

    return { message, urgency, nextStep, shouldEscalate };
  }

  // 🔥 6️⃣ URGENCY SIGNAL → Create immediate action
  if (buyingSignal === "urgency") {
    urgency = 'critical';
    nextStep = 'fast_track_order';
    shouldEscalate = true;

    message = `Noted po! Since you need it urgently, eto po ang fastest way:

⚡ **Same-day delivery** available if you order before 3pm
⚡ Can ship today to Metro Manila and nearby areas
⚡ ${hasCOD ? 'COD available for your convenience\n' : ''}
Ready po ba kayong proceed? I'll prioritize your order! 😊`;

    return { message, urgency, nextStep, shouldEscalate };
  }

  // 🔥 7️⃣ OBJECTIONS → Use Objection Handler Library
  if (intent === "hesitation" || intent === "objection") {
    urgency = 'medium';
    nextStep = 'overcome_objection';

    const objReply = getObjectionResponse("price"); // Default to price objection
    message = `${objReply}

Kung gusto n'yo po, I can help you find **the pinaka-sulit na option** para hindi mabigat sa budget. 😊
Would you like that po?`;

    return { message, urgency, nextStep, shouldEscalate: false };
  }

  // 🔥 8️⃣ EARNING OPPORTUNITY → Business close
  if (intent === "earning_opportunity") {
    urgency = 'high';
    nextStep = 'present_business_package';

    message = `Ay nice po! Marami pong kumikita dito kahit beginners.
For **₱3,500 WonderEarning Package**, you get:

🔹 10 Packs (for personal use or resell)
🔹 30% lifetime discount
🔹 Direct bonuses from sales
🔹 Residual income
🔹 All training & support
🔹 Tools + marketing materials

Gusto n'yo po ba malaman kung **magkano potential income** ninyo weekly? 😊`;

    return { message, urgency, nextStep, shouldEscalate: false };
  }

  // 🔥 9️⃣ DECISION STAGE → Guide into closing
  if (funnelStage === "decision") {
    urgency = 'high';
    nextStep = 'get_decision';
    shouldEscalate = true;

    message = `Sige po! Based sa goals n'yo, eto po ang best next step:

✔ If gusto n'yo **performance & health results** → Order ${productName}
✔ If gusto n'yo **income + personal use** → Get the business package

Which one po mas priority n'yo today? 😊`;

    return { message, urgency, nextStep, shouldEscalate };
  }

  // 🔥 🔟 CLOSING STAGE → Very direct but polite CTA
  if (funnelStage === "closing") {
    urgency = 'critical';
    nextStep = 'process_order';
    shouldEscalate = true;

    message = `Ganda po! Ready na po ba kayo mag-order?

Pwede ko pong i-process now:
${hasCOD ? '👉 COD (Cash on Delivery)\n' : ''}👉 GCash
👉 Bank Transfer
👉 Online checkout

Ano po ang mas convenient para sa inyo? 😊`;

    return { message, urgency, nextStep, shouldEscalate };
  }

  // 🔥 1️⃣1️⃣ FOLLOW-UP → Revival closing
  if (funnelStage === "followUp" || funnelStage === "revival") {
    urgency = 'low';
    nextStep = 'revive_conversation';

    message = `Hello po! 😊 Just checking in.
${hasPromo ? '🔥 May special promo kami ngayon!\n\n' : ''}If gusto n'yo po makita ang **latest offer** or **fastest way to order**, I can guide you anytime.`;

    return { message, urgency, nextStep, shouldEscalate: false };
  }

  // 🔥 1️⃣2️⃣ VALIDATION REQUEST → Build trust then close
  if (buyingSignal === "validation") {
    urgency = 'medium';
    nextStep = 'build_trust';

    message = `Great question po! Yes, we're 100% legit 😊

✅ FDA-registered
✅ Thousands of satisfied customers
✅ 100% satisfaction guarantee
✅ Transparent ingredients
✅ Full customer support

Plus, you can try it risk-free with our money-back guarantee!

Ready na po ba kayong i-try? 😊`;

    return { message, urgency, nextStep, shouldEscalate: false };
  }

  // 🔥 1️⃣3️⃣ PROMO INTEREST → Leverage urgency
  if (buyingSignal === "promoInterest") {
    urgency = 'high';
    nextStep = 'present_promo';

    message = hasPromo
      ? `Yes po! May special promo kami ngayon! 🔥

Buy 2, Get 1 Free!
Or
3-pack bundle with extra discount

Limited time lang po ito. Gusto n'yo po ba i-take advantage? 😊`
      : `Actually po, we have bundle options na mas sulit:

📦 **3 packs** - Save ₱300!
📦 **5 packs** - Save ₱500!

Mas tipid at mas results pa! Gusto n'yo po ba? 😊`;

    return { message, urgency, nextStep, shouldEscalate: false };
  }

  // 🔥 DEFAULT FALLBACK → Use funnel sequence
  urgency = 'low';
  nextStep = 'continue_conversation';
  message = getFunnelSequence(funnelStage);

  return { message, urgency, nextStep, shouldEscalate: false };
}

/**
 * Quick closing message generator
 * For simple use cases
 */
export function getQuickClosing(
  intent: UserIntent,
  productName: string,
  price: string | number
): string {
  const ctx: ClosingContext = {
    intent,
    funnelStage: 'closing',
    buyingSignal: 'readyToOrder',
    productName,
    price,
    tone: 'taglish'
  };

  return buildClosingResponse(ctx).message;
}
