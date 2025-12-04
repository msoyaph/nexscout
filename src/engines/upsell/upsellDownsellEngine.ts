import { LeadTemperature } from "../leads/leadTemperatureModel";
import { BuyingSignal } from "../signals/buyingSignals";
import { UserIntent } from "../messaging/intentRouter";

export type ProductTier = "starter" | "core" | "premium" | "bundle" | "business";

export interface Product {
  id: string;
  name: string;
  price: number;
  tier: ProductTier;
}

export interface UpsellContext {
  currentProductId?: string;      // what they are currently considering
  products: Product[];            // all products for this workspace/company
  leadTemperature: LeadTemperature;
  lastIntent: UserIntent;
  lastBuyingSignal: BuyingSignal;
  budgetConcern: boolean;         // detected from message like "mahal", "bitin budget"
  wantsIncome: boolean;           // earning_opportunity or similar
}

export type OfferType = "upsell" | "downsell" | "crossSell" | "stay";

export interface OfferSuggestion {
  type: OfferType;
  fromProduct?: Product;
  toProduct?: Product;
  message: string;
}

function findProductById(products: Product[], id?: string): Product | undefined {
  if (!id) return undefined;
  return products.find((p) => p.id === id);
}

function findCheaperProduct(products: Product[], basePrice: number): Product | undefined {
  const cheaper = products.filter((p) => p.price < basePrice);
  return cheaper.sort((a, b) => b.price - a.price)[0]; // closest cheaper
}

function findBundleOrBusiness(products: Product[], basePrice: number): Product | undefined {
  const ups = products.filter((p) => p.price > basePrice);
  return ups.sort((a, b) => a.price - b.price)[0]; // cheapest upsell
}

function findBusinessProduct(products: Product[]): Product | undefined {
  return products.find((p) => p.tier === "business");
}

export function suggestOffer(ctx: UpsellContext): OfferSuggestion {
  const { products, leadTemperature, lastIntent, lastBuyingSignal, budgetConcern, wantsIncome } =
    ctx;

  const current = findProductById(products, ctx.currentProductId);

  // Fallback current: pick core product
  const effectiveCurrent =
    current || products.find((p) => p.tier === "core") || products[0];

  // 1️⃣ If they clearly want income → business package upsell
  if (wantsIncome) {
    const business = findBusinessProduct(products);
    if (business && business.id !== effectiveCurrent.id) {
      return {
        type: "upsell",
        fromProduct: effectiveCurrent,
        toProduct: business,
        message: `
Since interesado po kayo sa income, the **best option** is actually our *${business.name}*.

✔ Mas sulit kaysa sa regular pack
✔ May products na for personal use
✔ Plus may potential income pa

Gusto n'yo po ba makita kung paano puwedeng kumita from this package? 😊
`
      };
    }
  }

  // 2️⃣ If budget concern or cold lead → downsell to starter / cheaper
  if (budgetConcern || leadTemperature === "cold") {
    const cheaper = findCheaperProduct(products, effectiveCurrent.price);
    if (cheaper) {
      return {
        type: "downsell",
        fromProduct: effectiveCurrent,
        toProduct: cheaper,
        message: `
Totally understand po na may budget considerations.

Kung gusto n'yo po, puwede tayo mag-start sa *${cheaper.name}* (₱${cheaper.price}) muna —
para ma-try n'yo po yung benefits without malaking risk.

If nagustuhan n'yo po ang results, puwede tayo mag-upgrade later. 😊
`
      };
    }
  }

  // 3️⃣ If hot/ready + looking at starter/core → upsell to bundle/premium
  const isHighIntent =
    leadTemperature === "hot" || leadTemperature === "ready" ||
    lastBuyingSignal === "readyToOrder";

  if (isHighIntent && effectiveCurrent) {
    const bundle = findBundleOrBusiness(products, effectiveCurrent.price);
    if (bundle && bundle.price > effectiveCurrent.price) {
      return {
        type: "upsell",
        fromProduct: effectiveCurrent,
        toProduct: bundle,
        message: `
Since decided na po kayo to start, I'd recommend *${bundle.name}* instead of just *${effectiveCurrent.name}*.

✔ Mas tipid per pack
✔ Mas consistent ang results
✔ Hindi po kayo mawawalan agad ng stocks

Gusto n'yo po ba makita difference between **${effectiveCurrent.name} (₱${effectiveCurrent.price})**
and **${bundle.name} (₱${bundle.price})**? 😊
`
      };
    }
  }

  // 4️⃣ Cross-sell idea (ex: health + business)
  if (leadTemperature === "warm" && wantsIncome && effectiveCurrent.tier !== "business") {
    const business = findBusinessProduct(products);
    if (business) {
      return {
        type: "crossSell",
        fromProduct: effectiveCurrent,
        toProduct: business,
        message: `
Ganda po ng choice n'yo sa *${effectiveCurrent.name}* for health. 💪

By the way, if open din po kayo to **extra income**,
we have *${business.name}* where you still get products + potential earnings.

Gusto n'yo po ba ng mabilis na explanation how it works? 🙂
`
      };
    }
  }

  // 5️⃣ Default: stay on current recommendation
  return {
    type: "stay",
    fromProduct: effectiveCurrent,
    message: `
Base sa goals na shinare n'yo, *${effectiveCurrent.name}* is already a good starting point.

Kung okay po sa inyo, I can guide you how to order this now. 😊
`
  };
}
