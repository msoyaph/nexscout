/**
 * AI Legislative Engine
 * Generates law proposals from analytics and feedback
 */

import { supabase } from '../lib/supabase';

export interface LawProposalDraft {
  title: string;
  summary: string;
  details: string;
  impactArea: string;
  suggestedRuleChanges: Record<string, any>;
  simulatedImpact: {
    expectedRevenueDelta?: number;
    expectedChurnDelta?: number;
    affectedTiers?: string[];
    riskLevel: 'low' | 'medium' | 'high';
  };
}

/**
 * Generate law proposals based on analytics and feedback
 */
export async function generateLawProposals(): Promise<LawProposalDraft[]> {
  try {
    const feedback = await analyzeFeedback();
    const health = await analyzeHealth();
    const usage = await analyzeUsage();

    const proposals: LawProposalDraft[] = [];

    if (feedback.highNegativeFeedback) {
      proposals.push(createUXImprovementProposal(feedback));
    }

    if (health.highErrorRate) {
      proposals.push(createStabilityProposal(health));
    }

    if (usage.lowConversion) {
      proposals.push(createPricingAdjustmentProposal(usage));
    }

    if (usage.highChurn) {
      proposals.push(createRetentionProposal(usage));
    }

    for (const proposal of proposals) {
      await saveLawProposal(proposal);
    }

    return proposals;
  } catch (error) {
    console.error('[Legislative] Error generating proposals:', error);
    return [];
  }
}

/**
 * Analyze citizen feedback
 */
async function analyzeFeedback() {
  try {
    const { data: feedback } = await supabase
      .from('citizen_feedback')
      .select('feedback_type, sentiment, source_page')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    const total = feedback?.length || 0;
    const negative = feedback?.filter((f) => f.sentiment === 'negative').length || 0;
    const highNegativeFeedback = total > 10 && negative / total > 0.4;

    const pageIssues = feedback?.reduce((acc: any, f) => {
      if (f.sentiment === 'negative') {
        acc[f.source_page] = (acc[f.source_page] || 0) + 1;
      }
      return acc;
    }, {});

    return {
      highNegativeFeedback,
      total,
      negative,
      pageIssues,
    };
  } catch (error) {
    return {
      highNegativeFeedback: false,
      total: 0,
      negative: 0,
      pageIssues: {},
    };
  }
}

/**
 * Analyze system health
 */
async function analyzeHealth() {
  try {
    const { data: incidents } = await supabase
      .from('crisis_incidents')
      .select('*')
      .eq('status', 'OPEN');

    const { data: events } = await supabase
      .from('orchestrator_events')
      .select('status')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const total = events?.length || 0;
    const failed = events?.filter((e) => e.status === 'FAILED').length || 0;
    const errorRate = total > 0 ? failed / total : 0;

    return {
      highErrorRate: errorRate > 0.1,
      errorRate,
      activeIncidents: incidents?.length || 0,
    };
  } catch (error) {
    return {
      highErrorRate: false,
      errorRate: 0,
      activeIncidents: 0,
    };
  }
}

/**
 * Analyze usage patterns
 */
async function analyzeUsage() {
  try {
    const { data: subscriptions } = await supabase
      .from('user_subscriptions')
      .select('tier, status, created_at');

    const freeUsers = subscriptions?.filter((s) => s.tier === 'free').length || 0;
    const paidUsers = subscriptions?.filter((s) => s.tier !== 'free').length || 0;
    const conversionRate = freeUsers > 0 ? paidUsers / (freeUsers + paidUsers) : 0;

    const canceledCount =
      subscriptions?.filter((s) => s.status === 'canceled').length || 0;
    const churnRate = subscriptions ? canceledCount / subscriptions.length : 0;

    return {
      lowConversion: conversionRate < 0.05,
      highChurn: churnRate > 0.15,
      conversionRate,
      churnRate,
      freeUsers,
      paidUsers,
    };
  } catch (error) {
    return {
      lowConversion: false,
      highChurn: false,
      conversionRate: 0,
      churnRate: 0,
      freeUsers: 0,
      paidUsers: 0,
    };
  }
}

/**
 * Create UX improvement proposal
 */
function createUXImprovementProposal(feedback: any): LawProposalDraft {
  const topIssuePage = Object.keys(feedback.pageIssues)[0];

  return {
    title: 'Improve UX on High-Friction Pages',
    summary: `${feedback.negative} users reported negative experiences, primarily on ${topIssuePage}`,
    details: `Analysis shows significant user friction. Propose UX audit and redesign of affected pages.`,
    impactArea: 'ux',
    suggestedRuleChanges: {
      ux_improvements: {
        target_pages: Object.keys(feedback.pageIssues),
        priority: 'high',
      },
    },
    simulatedImpact: {
      expectedChurnDelta: -5,
      affectedTiers: ['free', 'pro'],
      riskLevel: 'low',
    },
  };
}

/**
 * Create stability proposal
 */
function createStabilityProposal(health: any): LawProposalDraft {
  return {
    title: 'Improve System Stability',
    summary: `Error rate at ${(health.errorRate * 100).toFixed(1)}% with ${health.activeIncidents} active incidents`,
    details: `Propose engine health improvements and fallback enhancements.`,
    impactArea: 'engines',
    suggestedRuleChanges: {
      health_thresholds: {
        max_error_rate: 0.05,
        required_uptime: 0.999,
      },
    },
    simulatedImpact: {
      affectedTiers: ['all'],
      riskLevel: 'medium',
    },
  };
}

/**
 * Create pricing adjustment proposal
 */
function createPricingAdjustmentProposal(usage: any): LawProposalDraft {
  return {
    title: 'Adjust Pricing to Improve Conversion',
    summary: `Conversion rate at ${(usage.conversionRate * 100).toFixed(1)}%, below 5% target`,
    details: `Propose reducing Pro tier price or adding more value to free tier to drive upgrades.`,
    impactArea: 'pricing',
    suggestedRuleChanges: {
      pricing_adjustments: {
        pro_tier_discount: 0.2,
        free_tier_limits_increase: 0.5,
      },
    },
    simulatedImpact: {
      expectedRevenueDelta: 15000,
      affectedTiers: ['free', 'pro'],
      riskLevel: 'high',
    },
  };
}

/**
 * Create retention proposal
 */
function createRetentionProposal(usage: any): LawProposalDraft {
  return {
    title: 'Reduce Churn with Retention Programs',
    summary: `Churn rate at ${(usage.churnRate * 100).toFixed(1)}%, above 15% threshold`,
    details: `Propose loyalty rewards, win-back campaigns, and proactive support.`,
    impactArea: 'gamification',
    suggestedRuleChanges: {
      retention_programs: {
        loyalty_bonus_coins: 500,
        reactivation_discount: 0.3,
      },
    },
    simulatedImpact: {
      expectedChurnDelta: -8,
      affectedTiers: ['pro', 'team'],
      riskLevel: 'low',
    },
  };
}

/**
 * Save law proposal to database
 */
async function saveLawProposal(draft: LawProposalDraft): Promise<void> {
  try {
    await supabase.from('law_proposals').insert({
      title: draft.title,
      summary: draft.summary,
      details: draft.details,
      impact_area: draft.impactArea,
      status: 'draft',
      author_type: 'ai',
      suggested_rule_changes: draft.suggestedRuleChanges as any,
      simulated_impact: draft.simulatedImpact as any,
    });
  } catch (error) {
    console.error('[Legislative] Error saving proposal:', error);
  }
}

/**
 * Apply a law proposal
 */
export async function applyLaw(lawId: string, force: boolean = false): Promise<boolean> {
  try {
    const { data: law } = await supabase
      .from('law_proposals')
      .select('*')
      .eq('id', lawId)
      .maybeSingle();

    if (!law || law.status !== 'approved') {
      console.error('[Legislative] Law not approved or not found');
      return false;
    }

    const { data: votes } = await supabase
      .from('law_votes')
      .select('vote')
      .eq('law_id', lawId);

    const yesVotes = votes?.filter((v) => v.vote === 'yes').length || 0;
    const noVotes = votes?.filter((v) => v.vote === 'no').length || 0;

    if (!force && (yesVotes < 2 || noVotes > 1)) {
      console.error('[Legislative] Not enough votes to apply');
      return false;
    }

    const riskLevel = law.simulated_impact?.riskLevel;
    if (!force && riskLevel === 'high') {
      console.error('[Legislative] High risk law requires force flag');
      return false;
    }

    for (const [ruleKey, ruleValue] of Object.entries(
      law.suggested_rule_changes || {}
    )) {
      const { data: currentRule } = await supabase
        .from('constitution_rules')
        .select('rule_value')
        .eq('rule_key', ruleKey)
        .maybeSingle();

      await supabase.from('law_change_log').insert({
        law_id: lawId,
        rule_key: ruleKey,
        old_value: currentRule?.rule_value || null,
        new_value: ruleValue as any,
        applied_by: 'system',
      });

      await supabase
        .from('constitution_rules')
        .upsert({
          rule_key: ruleKey,
          rule_value: ruleValue as any,
          updated_at: new Date().toISOString(),
        });
    }

    await supabase
      .from('law_proposals')
      .update({ status: 'applied' })
      .eq('id', lawId);

    return true;
  } catch (error) {
    console.error('[Legislative] Error applying law:', error);
    return false;
  }
}
