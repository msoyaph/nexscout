import { supabase } from '../../lib/supabase';

export interface PainPointInput {
  prospect: any;
  textSamples: string[];
  events: string[];
  industry: 'mlm' | 'insurance' | 'real_estate';
}

export interface PainPoint {
  category: string;
  severity: 'low' | 'medium' | 'high';
  evidence: string;
}

export interface PainPointOutput {
  painPoints: PainPoint[];
  rootCause: string;
  urgencyScore: number;
  emotionalTone: 'stressed' | 'hopeful' | 'overwhelmed' | 'motivated';
  recommendedAngle: 'income' | 'protection' | 'investment' | 'security' | 'lifestyle';
  messageHooks: string[];
  eliteInsights?: string;
}

const PAIN_CATEGORIES = {
  financial_stress: ['utang', 'kulang', 'walang pera', 'gastos', 'budget', 'sweldo', 'hirap', 'bayad'],
  career_issues: ['pagod', 'toxic work', 'low pay', 'burnout', 'resign', 'boss', 'trabaho'],
  family_responsibilities: ['baby', 'anak', 'parents', 'medical', 'asawa', 'pamilya', 'tuition'],
  life_events: ['wedding', 'kasal', 'bagong bahay', 'lipat', 'new job', 'promotion'],
  health_stress: ['hospital', 'checkup', 'medicine', 'sakit', 'ospital', 'gamot'],
};

export async function analyzePainPoints(
  userId: string,
  prospectId: string,
  input: PainPointInput
): Promise<PainPointOutput> {
  const allText = [...input.textSamples, ...input.events].join(' ').toLowerCase();

  const painPoints = extractPainPoints(allText);
  const rootCause = determineRootCause(painPoints);
  const urgencyScore = calculateUrgencyScore(painPoints, allText);
  const emotionalTone = detectEmotionalTone(allText);
  const recommendedAngle = getRecommendedAngle(painPoints, input.industry);
  const messageHooks = generateMessageHooks(painPoints, input.industry, emotionalTone);
  const eliteInsights = generateEliteInsights(painPoints, rootCause, urgencyScore);

  const result: PainPointOutput = {
    painPoints,
    rootCause,
    urgencyScore,
    emotionalTone,
    recommendedAngle,
    messageHooks,
    eliteInsights,
  };

  await supabase.from('ai_pain_point_analysis').insert({
    user_id: userId,
    prospect_id: prospectId,
    pain_points: painPoints,
    root_cause: rootCause,
    urgency_score: urgencyScore,
    emotional_tone: emotionalTone,
    recommended_angle: recommendedAngle,
    message_hooks: messageHooks,
    elite_insights: eliteInsights,
  });

  return result;
}

function extractPainPoints(text: string): PainPoint[] {
  const painPoints: PainPoint[] = [];

  Object.entries(PAIN_CATEGORIES).forEach(([category, keywords]) => {
    const matches: string[] = [];
    const evidenceSnippets: string[] = [];

    keywords.forEach((keyword) => {
      if (text.includes(keyword)) {
        matches.push(keyword);
        const index = text.indexOf(keyword);
        const snippet = text.substring(Math.max(0, index - 20), Math.min(text.length, index + 50));
        evidenceSnippets.push(`...${snippet}...`);
      }
    });

    if (matches.length > 0) {
      const severity = getSeverity(matches.length);
      painPoints.push({
        category: category.replace(/_/g, ' '),
        severity,
        evidence: evidenceSnippets[0] || matches.join(', '),
      });
    }
  });

  return painPoints;
}

function getSeverity(matchCount: number): 'low' | 'medium' | 'high' {
  if (matchCount >= 3) return 'high';
  if (matchCount >= 2) return 'medium';
  return 'low';
}

function determineRootCause(painPoints: PainPoint[]): string {
  if (painPoints.length === 0) return 'No clear pain points detected';

  const highSeverity = painPoints.filter((p) => p.severity === 'high');
  if (highSeverity.length > 0) {
    return `Primary driver: ${highSeverity[0].category} (high severity)`;
  }

  const categories = painPoints.map((p) => p.category);
  if (categories.includes('financial stress') && categories.includes('career issues')) {
    return 'Job dissatisfaction leading to financial strain';
  }

  if (categories.includes('family responsibilities') && categories.includes('financial stress')) {
    return 'Growing family financial pressure';
  }

  return `Main concern: ${painPoints[0].category}`;
}

function calculateUrgencyScore(painPoints: PainPoint[], text: string): number {
  let score = 0;

  painPoints.forEach((point) => {
    if (point.severity === 'high') score += 30;
    else if (point.severity === 'medium') score += 15;
    else score += 5;
  });

  const urgentKeywords = ['asap', 'now', 'urgent', 'kailangan na', 'immediately', 'agad'];
  urgentKeywords.forEach((keyword) => {
    if (text.includes(keyword)) score += 10;
  });

  return Math.min(100, score);
}

function detectEmotionalTone(text: string): 'stressed' | 'hopeful' | 'overwhelmed' | 'motivated' {
  const stressedKeywords = ['stress', 'pagod', 'hirap', 'grabe', 'ayoko na'];
  const hopefulKeywords = ['sana', 'hope', 'magtiwala', 'kaya natin', 'possible'];
  const overwhelmedKeywords = ['sobra', 'dami', 'hindi ko na kaya', 'burnout', 'too much'];
  const motivatedKeywords = ['goal', 'dream', 'succeed', 'pangarap', 'kaya ko'];

  let stressCount = 0;
  let hopeCount = 0;
  let overwhelmCount = 0;
  let motivateCount = 0;

  stressedKeywords.forEach((k) => { if (text.includes(k)) stressCount++; });
  hopefulKeywords.forEach((k) => { if (text.includes(k)) hopeCount++; });
  overwhelmedKeywords.forEach((k) => { if (text.includes(k)) overwhelmCount++; });
  motivatedKeywords.forEach((k) => { if (text.includes(k)) motivateCount++; });

  const max = Math.max(stressCount, hopeCount, overwhelmCount, motivateCount);

  if (max === overwhelmCount && overwhelmCount > 0) return 'overwhelmed';
  if (max === stressCount && stressCount > 0) return 'stressed';
  if (max === motivateCount && motivateCount > 0) return 'motivated';
  if (max === hopeCount && hopeCount > 0) return 'hopeful';

  return 'stressed';
}

function getRecommendedAngle(
  painPoints: PainPoint[],
  industry: string
): 'income' | 'protection' | 'investment' | 'security' | 'lifestyle' {
  const categories = painPoints.map((p) => p.category);

  if (categories.includes('financial stress')) {
    if (industry === 'mlm') return 'income';
    if (industry === 'insurance') return 'security';
    if (industry === 'real_estate') return 'investment';
  }

  if (categories.includes('family responsibilities')) {
    return industry === 'mlm' ? 'lifestyle' : 'protection';
  }

  if (categories.includes('career issues')) {
    return industry === 'mlm' ? 'income' : 'security';
  }

  return 'income';
}

function generateMessageHooks(
  painPoints: PainPoint[],
  industry: string,
  tone: string
): string[] {
  const hooks: string[] = [];

  if (painPoints.some((p) => p.category === 'financial stress')) {
    if (industry === 'mlm') {
      hooks.push('Paano kung may extra ₱10-20k ka monthly without leaving your current job?');
    } else if (industry === 'insurance') {
      hooks.push('Paano mo proteprotektahan ang family mo kung may mangyari?');
    } else {
      hooks.push('Want to build long-term wealth through smart property investment?');
    }
  }

  if (painPoints.some((p) => p.category === 'career issues')) {
    hooks.push('Tired of toxic work? Build your own income stream.');
  }

  if (tone === 'overwhelmed') {
    hooks.push('Let me simplify this for you — I can help.');
  }

  if (tone === 'motivated') {
    hooks.push('You seem ready to level up. Let\'s make it happen.');
  }

  return hooks.slice(0, 2);
}

function generateEliteInsights(
  painPoints: PainPoint[],
  rootCause: string,
  urgencyScore: number
): string {
  const insights: string[] = [];

  if (urgencyScore >= 70) {
    insights.push('High urgency detected — prospect is actively seeking solutions.');
  }

  if (painPoints.length >= 3) {
    insights.push('Multiple pain points suggest compound stress; lead with empathy.');
  }

  const highSeverity = painPoints.filter((p) => p.severity === 'high');
  if (highSeverity.length >= 2) {
    insights.push('Acute pain in multiple areas — ideal for value-based offer.');
  }

  if (rootCause.includes('financial strain')) {
    insights.push('Financial pain is often the strongest motivator for action.');
  }

  return insights.join(' ');
}
