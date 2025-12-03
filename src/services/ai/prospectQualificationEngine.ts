import { supabase } from '../../lib/supabase';

export interface QualificationInput {
  prospect: any;
  scoutScore: number;
  bucket: 'hot' | 'warm' | 'cold';
  industry: 'mlm' | 'insurance' | 'real_estate';
  nlp: {
    pain_points: string[];
    interests: string[];
    life_events: string[];
    topics: string[];
    sentiment: string;
    engagement_score: number;
  };
  personality: any;
  activity: {
    recent_events: number;
    days_since_last_post: number;
    message_response_probability: number;
  };
}

export interface QualificationOutput {
  qualificationLabel: 'A+' | 'A' | 'B' | 'C' | 'D';
  qualificationScore: number;
  reasoning: string[];
  recommendedApproach: 'direct' | 'consultative' | 'nurture' | 'soft-touch';
  priorityLevel: 'urgent' | 'high' | 'medium' | 'low';
  pipelineStageSuggested: 'new' | 'qualified' | 'follow_up' | 'nurture' | 'high_value';
  eliteInsights?: string;
}

export async function qualifyProspect(
  userId: string,
  prospectId: string,
  input: QualificationInput
): Promise<QualificationOutput> {
  let score = 0;
  const reasoning: string[] = [];

  score += calculatePainPointScore(input.nlp.pain_points, reasoning);
  score += calculateBusinessInterestScore(input.nlp.interests, input.nlp.topics, reasoning);
  score += calculateFinancialNeedScore(input.nlp.pain_points, reasoning);
  score += calculateLifeEventScore(input.nlp.life_events, input.industry, reasoning);
  score += calculateResponsivenessScore(input.activity, reasoning);
  score += calculatePersonalityAlignmentScore(input.personality, input.industry, reasoning);

  const industryBonus = applyIndustrySpecificQualification(input, reasoning);
  score += industryBonus;

  score = Math.min(100, Math.max(0, score));

  const label = getQualificationLabel(score);
  const approach = getRecommendedApproach(label, input);
  const priority = getPriorityLevel(score, input);
  const stage = getPipelineStage(label, score);
  const insights = generateEliteInsights(input, score);

  const result: QualificationOutput = {
    qualificationLabel: label,
    qualificationScore: score,
    reasoning,
    recommendedApproach: approach,
    priorityLevel: priority,
    pipelineStageSuggested: stage,
    eliteInsights: insights,
  };

  await supabase.from('ai_prospect_qualifications').insert({
    user_id: userId,
    prospect_id: prospectId,
    qualification_label: label,
    qualification_score: score,
    reasoning,
    recommended_approach: approach,
    priority_level: priority,
    pipeline_stage_suggested: stage,
    elite_insights: insights,
  });

  return result;
}

function calculatePainPointScore(painPoints: string[], reasoning: string[]): number {
  const strongPainPoints = [
    'utang', 'kulang', 'walang pera', 'gastos', 'budget', 'sweldo',
    'pagod', 'toxic work', 'low pay', 'burnout', 'stressed', 'problema',
  ];

  let matches = 0;
  painPoints.forEach((point) => {
    const lowerPoint = point.toLowerCase();
    if (strongPainPoints.some((keyword) => lowerPoint.includes(keyword))) {
      matches++;
    }
  });

  const score = Math.min(20, matches * 5);
  if (score > 0) {
    reasoning.push(`${matches} pain point(s) detected: financial/career stress signals`);
  }
  return score;
}

function calculateBusinessInterestScore(
  interests: string[],
  topics: string[],
  reasoning: string[]
): number {
  const businessKeywords = [
    'business', 'negosyo', 'sideline', 'extra income', 'work from home',
    'entrepreneur', 'investment', 'passive income', 'kita', 'raket',
  ];

  let matches = 0;
  [...interests, ...topics].forEach((item) => {
    const lowerItem = item.toLowerCase();
    if (businessKeywords.some((keyword) => lowerItem.includes(keyword))) {
      matches++;
    }
  });

  const score = Math.min(20, matches * 4);
  if (score > 0) {
    reasoning.push(`${matches} business interest signal(s) found`);
  }
  return score;
}

function calculateFinancialNeedScore(painPoints: string[], reasoning: string[]): number {
  const financialStressKeywords = [
    'need money', 'kailangan ng pera', 'hirap', 'debt', 'loan', 'bills',
    'tuition', 'hospital', 'emergency fund', 'savings',
  ];

  let matches = 0;
  painPoints.forEach((point) => {
    const lowerPoint = point.toLowerCase();
    if (financialStressKeywords.some((keyword) => lowerPoint.includes(keyword))) {
      matches++;
    }
  });

  const score = Math.min(20, matches * 7);
  if (score > 0) {
    reasoning.push(`${matches} financial need indicator(s) detected`);
  }
  return score;
}

function calculateLifeEventScore(
  lifeEvents: string[],
  industry: string,
  reasoning: string[]
): number {
  const relevantEvents: Record<string, string[]> = {
    mlm: ['new job', 'resigned', 'career change', 'new baby', 'married'],
    insurance: ['new baby', 'married', 'bought house', 'breadwinner', 'family'],
    real_estate: ['new job', 'promotion', 'married', 'stable income', 'investment'],
  };

  const industryEvents = relevantEvents[industry] || [];
  let matches = 0;

  lifeEvents.forEach((event) => {
    const lowerEvent = event.toLowerCase();
    if (industryEvents.some((keyword) => lowerEvent.includes(keyword))) {
      matches++;
    }
  });

  const score = Math.min(15, matches * 8);
  if (score > 0) {
    reasoning.push(`${matches} relevant life event(s): ${industry}-related triggers`);
  }
  return score;
}

function calculateResponsivenessScore(
  activity: { recent_events: number; days_since_last_post: number; message_response_probability: number },
  reasoning: string[]
): number {
  let score = 0;

  if (activity.recent_events >= 5) score += 5;
  if (activity.days_since_last_post <= 3) score += 5;
  score += activity.message_response_probability * 5;

  score = Math.min(15, score);

  if (score >= 10) {
    reasoning.push('High engagement & responsiveness detected');
  } else if (score >= 5) {
    reasoning.push('Moderate engagement detected');
  }

  return score;
}

function calculatePersonalityAlignmentScore(personality: any, industry: string, reasoning: string[]): number {
  if (!personality || !personality.type) return 0;

  const alignmentMap: Record<string, string[]> = {
    mlm: ['Connector', 'Dreamer', 'Helper'],
    insurance: ['Helper', 'Analyzer', 'Driver'],
    real_estate: ['Driver', 'Analyzer', 'Dreamer'],
  };

  const idealTypes = alignmentMap[industry] || [];
  const isAligned = idealTypes.includes(personality.type);

  if (isAligned) {
    reasoning.push(`Personality (${personality.type}) aligns with ${industry}`);
    return 10;
  }

  return 5;
}

function applyIndustrySpecificQualification(input: QualificationInput, reasoning: string[]): number {
  const { industry, nlp } = input;
  let bonus = 0;

  if (industry === 'mlm') {
    const mlmKeywords = ['sideline', 'extra income', 'work from home', 'flexible'];
    const matches = nlmKeywords.filter((k) =>
      [...nlp.interests, ...nlp.topics].some((item) => item.toLowerCase().includes(k))
    );
    bonus = matches.length * 3;
    if (bonus > 0) reasoning.push('MLM-specific signals detected');
  }

  if (industry === 'insurance') {
    const insuranceKeywords = ['kids', 'baby', 'family', 'breadwinner', 'security', 'protection'];
    const matches = insuranceKeywords.filter((k) =>
      [...nlp.life_events, ...nlp.pain_points].some((item) => item.toLowerCase().includes(k))
    );
    bonus = matches.length * 3;
    if (bonus > 0) reasoning.push('Insurance-specific needs detected');
  }

  if (industry === 'real_estate') {
    const realEstateKeywords = ['investment', 'property', 'stable income', 'long-term'];
    const matches = realEstateKeywords.filter((k) =>
      [...nlp.interests, ...nlp.topics].some((item) => item.toLowerCase().includes(k))
    );
    bonus = matches.length * 3;
    if (bonus > 0) reasoning.push('Real estate investment signals found');
  }

  return Math.min(10, bonus);
}

function getQualificationLabel(score: number): 'A+' | 'A' | 'B' | 'C' | 'D' {
  if (score >= 85) return 'A+';
  if (score >= 70) return 'A';
  if (score >= 50) return 'B';
  if (score >= 30) return 'C';
  return 'D';
}

function getRecommendedApproach(
  label: string,
  input: QualificationInput
): 'direct' | 'consultative' | 'nurture' | 'soft-touch' {
  if (label === 'A+' || label === 'A') return 'direct';
  if (label === 'B') return 'consultative';
  if (label === 'C') return 'nurture';
  return 'soft-touch';
}

function getPriorityLevel(score: number, input: QualificationInput): 'urgent' | 'high' | 'medium' | 'low' {
  if (score >= 85 && input.activity.days_since_last_post <= 2) return 'urgent';
  if (score >= 70) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
}

function getPipelineStage(
  label: string,
  score: number
): 'new' | 'qualified' | 'follow_up' | 'nurture' | 'high_value' {
  if (label === 'A+') return 'high_value';
  if (label === 'A') return 'qualified';
  if (label === 'B') return 'follow_up';
  return 'nurture';
}

function generateEliteInsights(input: QualificationInput, score: number): string {
  const insights: string[] = [];

  if (score >= 80) {
    insights.push('Hot prospect: Multiple conversion signals aligned.');
  }

  if (input.nlp.pain_points.length >= 3) {
    insights.push('Deep pain point density suggests urgent need.');
  }

  if (input.nlp.sentiment === 'stressed' || input.nlp.sentiment === 'overwhelmed') {
    insights.push('Emotional vulnerability: Lead with empathy and solution.');
  }

  if (input.activity.message_response_probability > 0.7) {
    insights.push('High response likelihood: Act fast to capitalize on engagement window.');
  }

  return insights.join(' ');
}
