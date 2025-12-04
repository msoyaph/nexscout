/**
 * Lead Dashboard Data Types
 * For displaying sales intelligence and recommendations
 */

export type LeadTemperature = "cold" | "warm" | "hot" | "ready";
export type FunnelStage = "awareness" | "interest" | "evaluation" | "decision" | "closing" | "followUp" | "revival";
export type OfferType = "upsell" | "downsell" | "crossSell" | "stay";

export interface OfferSuggestion {
  type: OfferType;
  message: string;
  fromProduct?: string;
  toProduct?: string;
  fromPrice?: number;
  toPrice?: number;
}

export interface LeadDashboardData {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  messagePreview: string;
  leadTemperature: LeadTemperature;
  leadScore: number;
  funnelStage: FunnelStage;
  lastIntent: string;
  offerSuggestion: OfferSuggestion;
  recommendedNextAction: string;
  buyingSignals: string[];
  messageCount: number;
  updatedAt: string;
  sessionId: string;
  channel: 'web' | 'facebook' | 'whatsapp' | 'telegram';
}

export interface LeadDashboardStats {
  totalLeads: number;
  readyLeads: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  averageScore: number;
  conversionRate: number;
}
