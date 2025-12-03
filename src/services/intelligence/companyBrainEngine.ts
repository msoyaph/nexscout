import { supabase } from '../../lib/supabase';
import { getCompanyKnowledge } from '../company/companyKnowledgeBase';
import { getCompanyPerformanceSummary } from './companyLearningEngine';
import { getCompanyEvents } from './aiEventLogger';

export interface CompanyBrain {
  brandIdentity: {
    name: string;
    industry: string;
    tone: string;
    colors: string[];
    keywords: string[];
  };
  winningPatterns: string[];
  failingPatterns: string[];
  optimalTone: Record<string, any>;
  contentStrategies: Record<string, any>;
  objectionFramework: Record<string, any>;
  personaProfile: Record<string, any>;
  salesLikelihoodPredictor: Record<string, any>;
  complianceRules: string[];
  productValueMap: Record<string, any>;
  audienceClusters: string[];
  lastEvolved: string;
  version: number;
}

export async function evolveCompanyBrain(userId: string, companyId?: string): Promise<CompanyBrain> {
  try {
    const [knowledge, performance, events] = await Promise.all([
      getCompanyKnowledge(userId),
      getCompanyPerformanceSummary(userId, companyId),
      getCompanyEvents(userId, { companyId, limit: 1000 }),
    ]);

    const brain: CompanyBrain = {
      brandIdentity: {
        name: knowledge.profile?.companyName || 'Company',
        industry: knowledge.profile?.industry || 'General',
        tone: knowledge.profile?.brandTone || 'professional',
        colors: [
          knowledge.profile?.brandColorPrimary || '#1877F2',
          knowledge.profile?.brandColorSecondary || '#1EC8FF',
        ],
        keywords: knowledge.brandKeywords.slice(0, 20),
      },
      winningPatterns: performance.topPerformingPatterns.map((p) => p.pattern),
      failingPatterns: performance.underperformingPatterns.map((p) => p.pattern),
      optimalTone: {
        formality: knowledge.profile?.brandTone === 'professional' ? 0.8 : 0.5,
        energy: knowledge.profile?.brandTone === 'energetic' ? 0.9 : 0.6,
        empathy: 0.7,
      },
      contentStrategies: {
        preferredLength: analyzePreferredLength(events),
        bestPerformingType: analyzeBestType(events),
        optimalTiming: 'weekday_morning',
      },
      objectionFramework: {
        commonObjections: knowledge.objections.slice(0, 10),
        rebuttals: knowledge.objections.map((o: any) => o.rebuttal).filter(Boolean),
      },
      personaProfile: {
        targetCustomer: knowledge.targetCustomer,
        painPoints: knowledge.painPoints,
        benefits: knowledge.benefits,
      },
      salesLikelihoodPredictor: {
        avgConversionRate: performance.overallReplyRate / 100,
        topIndicators: ['pain_point_match', 'timing', 'personalization'],
      },
      complianceRules: [
        'no_guaranteed_income',
        'no_false_promises',
        'ethical_recruiting',
        'honest_representation',
      ],
      productValueMap: knowledge.products.reduce((map: any, p: any) => {
        map[p.name] = p.description;
        return map;
      }, {}),
      audienceClusters: ['high_intent', 'explorers', 'skeptical', 'warm_leads'],
      lastEvolved: new Date().toISOString(),
      version: 1,
    };

    await saveBrainState(userId, companyId, brain);

    return brain;
  } catch (error) {
    console.error('Evolve company brain error:', error);
    return getDefaultBrain();
  }
}

export async function getCompanyBrain(userId: string, companyId?: string): Promise<CompanyBrain> {
  try {
    let query = supabase
      .from('company_brain_state')
      .select('*')
      .eq('user_id', userId);

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const { data, error } = await query.maybeSingle();

    if (error || !data) {
      return await evolveCompanyBrain(userId, companyId);
    }

    const brain = data.brain_state as CompanyBrain;
    const daysSinceEvolution = Math.floor(
      (Date.now() - new Date(brain.lastEvolved).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceEvolution >= 7) {
      return await evolveCompanyBrain(userId, companyId);
    }

    return brain;
  } catch (error) {
    console.error('Get company brain error:', error);
    return getDefaultBrain();
  }
}

async function saveBrainState(userId: string, companyId: string | undefined, brain: CompanyBrain): Promise<void> {
  try {
    await supabase.from('company_brain_state').upsert({
      user_id: userId,
      company_id: companyId || null,
      brain_state: brain,
      last_evolution: brain.lastEvolved,
    });
  } catch (error) {
    console.error('Save brain state error:', error);
  }
}

function analyzePreferredLength(events: any[]): string {
  const shortEvents = events.filter((e) => e.metadata?.length === 'short').length;
  const longEvents = events.filter((e) => e.metadata?.length === 'long').length;
  return shortEvents > longEvents ? 'short' : 'medium';
}

function analyzeBestType(events: any[]): string {
  const typeCounts: Record<string, number> = {};
  events.forEach((e) => {
    const type = e.contentType;
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });
  return Object.entries(typeCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || 'message';
}

function getDefaultBrain(): CompanyBrain {
  return {
    brandIdentity: {
      name: 'Company',
      industry: 'General',
      tone: 'professional',
      colors: ['#1877F2', '#1EC8FF'],
      keywords: [],
    },
    winningPatterns: [],
    failingPatterns: [],
    optimalTone: { formality: 0.7, energy: 0.6, empathy: 0.7 },
    contentStrategies: {},
    objectionFramework: {},
    personaProfile: {},
    salesLikelihoodPredictor: {},
    complianceRules: [],
    productValueMap: {},
    audienceClusters: [],
    lastEvolved: new Date().toISOString(),
    version: 1,
  };
}
