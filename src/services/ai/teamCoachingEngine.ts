import { supabase } from '../../lib/supabase';

export interface CoachingInput {
  teamMember: any;
  performance: {
    scans: number;
    messages: number;
    meetingsSet: number;
    closingRate: number;
    activityDays: number;
  };
  prospectQuality: any[];
  teamGoals: any;
  industry: 'mlm' | 'insurance' | 'real_estate';
}

export interface CoachingOutput {
  performanceSummary: string;
  strengths: string[];
  weaknesses: string[];
  priorityCoachingFocus: 'mindset' | 'activity' | 'technique' | 'follow_up';
  stepByStepTrainingPlan: string[];
  recommendedKPIs: string[];
  teamLeaderActionScript: string;
  nextReviewIn: string;
}

export async function generateCoaching(
  teamOwnerId: string,
  teamMemberId: string,
  input: CoachingInput
): Promise<CoachingOutput> {
  const summary = generatePerformanceSummary(input.performance);
  const strengths = identifyStrengths(input.performance);
  const weaknesses = identifyWeaknesses(input.performance, input.industry);
  const focus = determinePriorityFocus(weaknesses);
  const trainingPlan = createTrainingPlan(focus, weaknesses, input.industry);
  const kpis = recommendKPIs(input.industry, weaknesses);
  const script = generateLeaderScript(input.teamMember, strengths, focus, input.industry);
  const nextReview = determineNextReview(input.performance.activityDays);

  const result: CoachingOutput = {
    performanceSummary: summary,
    strengths,
    weaknesses,
    priorityCoachingFocus: focus,
    stepByStepTrainingPlan: trainingPlan,
    recommendedKPIs: kpis,
    teamLeaderActionScript: script,
    nextReviewIn: nextReview,
  };

  await supabase.from('ai_team_coaching_insights').insert({
    team_owner_id: teamOwnerId,
    team_member_id: teamMemberId,
    performance_summary: summary,
    strengths,
    weaknesses,
    priority_coaching_focus: focus,
    training_plan: trainingPlan,
    recommended_kpis: kpis,
    team_leader_action_script: script,
    next_review_date: new Date(Date.now() + parseInt(nextReview) * 24 * 60 * 60 * 1000),
  });

  return result;
}

function generatePerformanceSummary(performance: CoachingInput['performance']): string {
  const { scans, messages, meetingsSet, closingRate, activityDays } = performance;

  if (scans >= 20 && messages >= 10 && closingRate >= 0.2) {
    return `Strong performer: ${scans} scans, ${messages} messages, ${(closingRate * 100).toFixed(0)}% closing rate.`;
  }

  if (scans < 10) {
    return `Low activity: Only ${scans} scans this period. Needs activation.`;
  }

  if (closingRate < 0.1) {
    return `Active but low conversion: ${scans} scans but ${(closingRate * 100).toFixed(0)}% closing rate.`;
  }

  return `Moderate performance: ${scans} scans, ${messages} messages, ${meetingsSet} meetings.`;
}

function identifyStrengths(performance: CoachingInput['performance']): string[] {
  const strengths: string[] = [];

  if (performance.scans >= 20) strengths.push('High prospecting activity');
  if (performance.messages >= 15) strengths.push('Consistent messaging');
  if (performance.meetingsSet >= 5) strengths.push('Good meeting conversion');
  if (performance.closingRate >= 0.15) strengths.push('Strong closing ability');
  if (performance.activityDays >= 20) strengths.push('Excellent consistency');

  return strengths.length > 0 ? strengths : ['Shows up regularly'];
}

function identifyWeaknesses(
  performance: CoachingInput['performance'],
  industry: string
): string[] {
  const weaknesses: string[] = [];

  if (performance.scans < 10) weaknesses.push('Not enough scanning');
  if (performance.messages < 5) weaknesses.push('Weak messaging frequency');
  if (performance.meetingsSet < 2) weaknesses.push('Low meeting booking');
  if (performance.closingRate < 0.1) weaknesses.push('Low closing rate');
  if (performance.activityDays < 10) weaknesses.push('Inconsistent activity');

  return weaknesses;
}

function determinePriorityFocus(weaknesses: string[]): CoachingOutput['priorityCoachingFocus'] {
  if (weaknesses.includes('Inconsistent activity')) return 'mindset';
  if (weaknesses.includes('Not enough scanning')) return 'activity';
  if (weaknesses.includes('Low closing rate')) return 'technique';
  return 'follow_up';
}

function createTrainingPlan(
  focus: string,
  weaknesses: string[],
  industry: string
): string[] {
  const plans: Record<string, string[]> = {
    mindset: [
      'Set clear daily goals (e.g., 3 scans per day)',
      'Create accountability system with daily check-ins',
      'Celebrate small wins to build momentum',
    ],
    activity: [
      'Block 1 hour daily for prospecting',
      'Use NexScout scanner to find 5 prospects daily',
      'Aim for 15-20 scans per week minimum',
    ],
    technique: [
      'Review successful scripts and templates',
      'Practice objection handling scenarios',
      'Role-play closing techniques',
    ],
    follow_up: [
      'Set reminders for all follow-ups',
      'Use AI message templates for consistency',
      'Follow up within 24 hours of first contact',
    ],
  };

  return plans[focus] || plans.activity;
}

function recommendKPIs(industry: string, weaknesses: string[]): string[] {
  const kpis: string[] = ['Daily scans: 3-5', 'Weekly messages: 10-15'];

  if (industry === 'mlm') {
    kpis.push('Weekly meetings: 3-5', 'Monthly recruits: 2-3');
  } else if (industry === 'insurance') {
    kpis.push('Protection calls: 5/week', 'Policies closed: 2/month');
  } else {
    kpis.push('Property tours: 3/week', 'Qualified leads: 10/month');
  }

  if (weaknesses.includes('Low closing rate')) {
    kpis.push('Follow-up rate: 80%+');
  }

  return kpis;
}

function generateLeaderScript(
  teamMember: any,
  strengths: string[],
  focus: string,
  industry: string
): string {
  const name = teamMember.name || 'Team';

  let script = `Hi ${name}! 👋\n\n`;

  if (strengths.length > 0) {
    script += `First, I want to recognize your ${strengths[0].toLowerCase()}! Keep it up! 💪\n\n`;
  }

  script += `To help you grow even more, let's focus on ${focus} this week.\n\n`;

  if (focus === 'activity') {
    script += `Challenge: Scan at least 3 new prospects daily. You got this! 🎯`;
  } else if (focus === 'technique') {
    script += `Let's practice your pitch together. I'll help you refine your approach. 📞`;
  } else if (focus === 'mindset') {
    script += `Remember why you started. Small daily actions lead to big results! 🌟`;
  } else {
    script += `Let's improve your follow-up game. Consistent follow-up = more closes! 📈`;
  }

  return script;
}

function determineNextReview(activityDays: number): string {
  if (activityDays < 5) return '3 days';
  if (activityDays < 15) return '7 days';
  return '14 days';
}
