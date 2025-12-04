import { supabase } from '../../lib/supabase';

export interface PipelineInput {
  prospect: any;
  scoutScore: number;
  qualificationLabel: 'A+' | 'A' | 'B' | 'C' | 'D';
  recentMessages: any[];
  responseBehavior: any;
  lifeEvents: string[];
  industry: string;
  lastInteractionDays: number;
}

export interface PipelineOutput {
  recommendedStage: 'qualified' | 'follow_up' | 'nurture' | 'high_value' | 'lost';
  stageReasoning: string[];
  urgencyLevel: 'low' | 'medium' | 'high' | 'urgent';
  nextAction: 'send_message' | 'follow_up' | 'revive' | 'soft_touch' | 'book_call';
  timing: string;
  eliteInsights?: string;
}

export async function sortToPipeline(
  userId: string,
  prospectId: string,
  input: PipelineInput
): Promise<PipelineOutput> {
  const reasoning: string[] = [];

  let stage = determineStage(input, reasoning);
  const urgency = determineUrgency(input, reasoning);
  const nextAction = determineNextAction(stage, input, reasoning);
  const timing = determineTiming(urgency, stage);
  const insights = generateInsights(input, stage);

  const result: PipelineOutput = {
    recommendedStage: stage,
    stageReasoning: reasoning,
    urgencyLevel: urgency,
    nextAction,
    timing,
    eliteInsights: insights,
  };

  await supabase.from('ai_pipeline_recommendations').insert({
    user_id: userId,
    prospect_id: prospectId,
    recommended_stage: stage,
    stage_reasoning: reasoning,
    urgency_level: urgency,
    next_action: nextAction,
    timing,
    elite_insights: insights,
  });

  return result;
}

function determineStage(
  input: PipelineInput,
  reasoning: string[]
): PipelineOutput['recommendedStage'] {
  const { qualificationLabel, lastInteractionDays, lifeEvents, recentMessages } = input;

  if (qualificationLabel === 'A+') {
    reasoning.push('A+ qualification → High-Value pipeline');
    return 'high_value';
  }

  if (qualificationLabel === 'A') {
    reasoning.push('A qualification → Qualified pipeline');
    return 'qualified';
  }

  if (qualificationLabel === 'B') {
    if (recentMessages.length > 0) {
      reasoning.push('B with recent engagement → Follow-up');
      return 'follow_up';
    }
    reasoning.push('B qualification → Follow-up pipeline');
    return 'follow_up';
  }

  if (lastInteractionDays > 14) {
    reasoning.push(`No interaction for ${lastInteractionDays} days → Lost/Cold`);
    return 'lost';
  }

  if (lifeEvents.length > 0) {
    reasoning.push('Life events detected → bump to Nurture');
    return 'nurture';
  }

  reasoning.push('Default to Nurture');
  return 'nurture';
}

function determineUrgency(
  input: PipelineInput,
  reasoning: string[]
): PipelineOutput['urgencyLevel'] {
  const { qualificationLabel, lifeEvents, lastInteractionDays, responseBehavior } = input;

  if (qualificationLabel === 'A+' && lastInteractionDays <= 2) {
    reasoning.push('Hot prospect with recent activity → Urgent');
    return 'urgent';
  }

  if (lifeEvents.some(e => e.includes('baby') || e.includes('wedding') || e.includes('job'))) {
    reasoning.push('Major life event detected → High urgency');
    return 'high';
  }

  if (qualificationLabel === 'A' || qualificationLabel === 'B') {
    return 'medium';
  }

  return 'low';
}

function determineNextAction(
  stage: string,
  input: PipelineInput,
  reasoning: string[]
): PipelineOutput['nextAction'] {
  if (stage === 'high_value') {
    reasoning.push('High-value → Book call immediately');
    return 'book_call';
  }

  if (stage === 'qualified') {
    reasoning.push('Qualified → Send value message');
    return 'send_message';
  }

  if (stage === 'follow_up') {
    if (input.lastInteractionDays <= 7) {
      return 'follow_up';
    }
    return 'revive';
  }

  if (stage === 'lost') {
    reasoning.push('Lost → Revive campaign');
    return 'revive';
  }

  return 'soft_touch';
}

function determineTiming(urgency: string, stage: string): string {
  if (urgency === 'urgent') return 'Within 2 hours';
  if (urgency === 'high') return 'Today';
  if (stage === 'qualified' || stage === 'follow_up') return 'Within 24 hours';
  if (stage === 'nurture') return 'This week';
  return 'When ready';
}

function generateInsights(input: PipelineInput, stage: string): string {
  const insights: string[] = [];

  if (stage === 'high_value') {
    insights.push('High-value prospects convert best with immediate personal attention.');
  }

  if (input.lastInteractionDays > 30) {
    insights.push('Long dormancy requires soft re-engagement approach.');
  }

  if (input.recentMessages.length > 3) {
    insights.push('Active engagement history: build on existing rapport.');
  }

  return insights.join(' ');
}
