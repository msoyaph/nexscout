import { ProspectCandidate } from './extractProspects';
import { energyEngine } from '../energy/energyEngine';

export interface ScoredProspect {
  full_name: string;
  snippet: string;
  score: number;
  bucket: 'hot' | 'warm' | 'cold';
  confidence: number;
  top_factors: string[];
  explanation: string;
  pain_points: string[];
  interests: string[];
  life_events: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  opportunity_type: 'product' | 'business' | 'both';
  urgency_level: 'high' | 'medium' | 'low';
}

const PAIN_POINT_KEYWORDS = [
  'kailangan', 'need', 'hirap', 'struggle', 'kulang', 'lack', 'problema', 'problem',
  'gastos', 'expensive', 'bills', 'utang', 'debt', 'pagod', 'tired', 'stress',
  'worried', 'takot', 'afraid', 'unsure', 'mahirap', 'difficult', 'toxic'
];

const OPPORTUNITY_KEYWORDS = [
  'extra income', 'side hustle', 'business', 'negosyo', 'opportunity', 'investment',
  'passive income', 'online', 'work from home', 'wfh', 'freelance', 'selling',
  'financial', 'financially free', 'retirement', 'savings', 'insurance'
];

const URGENCY_KEYWORDS = [
  'ngayon', 'now', 'asap', 'urgent', 'kailangan talaga', 'really need',
  'soon', 'this year', '2025', 'immediately', 'agad'
];

const POSITIVE_KEYWORDS = [
  'excited', 'ready', 'willing', 'interested', 'curious', 'goal', 'gusto',
  'want', 'looking for', 'planning', 'start', 'new', 'motivated'
];

const LIFE_EVENT_KEYWORDS = [
  'baby', 'wedding', 'graduate', 'ofw', 'new job', 'resign', 'relocat',
  'new house', 'birthday', 'anniversary', 'promotion'
];

export async function scoreProspects(
  prospects: ProspectCandidate[],
  scanId: string,
  userId?: string,
  onProgress?: (processed: number, total: number) => void
): Promise<ScoredProspect[]> {
  // Check energy if userId provided (for AI-powered analysis)
  if (userId && prospects.length > 10) {
    const energyCheck = await energyEngine.canPerformAction(userId, 'ai_prospect_analysis');
    if (!energyCheck.canPerform) {
      throw new Error('Insufficient energy for AI prospect analysis');
    }
    await energyEngine.tryConsumeEnergyOrThrow(userId, 'ai_prospect_analysis');
  }

  const scored: ScoredProspect[] = [];

  for (let i = 0; i < prospects.length; i++) {
    const prospect = prospects[i];
    const scoredProspect = scoreIndividualProspect(prospect);
    scored.push(scoredProspect);

    if (onProgress && i % 5 === 0) {
      onProgress(i + 1, prospects.length);
    }
  }

  if (onProgress) {
    onProgress(prospects.length, prospects.length);
  }

  return scored;
}

function scoreIndividualProspect(prospect: ProspectCandidate): ScoredProspect {
  const snippetLower = prospect.snippet.toLowerCase();
  const contextLower = (prospect.context || '').toLowerCase();
  const fullText = `${snippetLower} ${contextLower}`.toLowerCase();

  let score = 50;
  const factors: string[] = [];
  const painPoints: string[] = [];
  const interests: string[] = [];
  const lifeEvents: string[] = [];

  const painPointMatches = PAIN_POINT_KEYWORDS.filter(kw => fullText.includes(kw));
  if (painPointMatches.length > 0) {
    score += painPointMatches.length * 8;
    painPoints.push(...painPointMatches);
    factors.push(`${painPointMatches.length} pain points detected`);
  }

  const opportunityMatches = OPPORTUNITY_KEYWORDS.filter(kw => fullText.includes(kw));
  if (opportunityMatches.length > 0) {
    score += opportunityMatches.length * 10;
    interests.push(...opportunityMatches);
    factors.push(`${opportunityMatches.length} opportunity signals`);
  }

  const urgencyMatches = URGENCY_KEYWORDS.filter(kw => fullText.includes(kw));
  if (urgencyMatches.length > 0) {
    score += urgencyMatches.length * 12;
    factors.push('High urgency detected');
  }

  const positiveMatches = POSITIVE_KEYWORDS.filter(kw => fullText.includes(kw));
  const sentiment = positiveMatches.length >= 2 ? 'positive' : painPointMatches.length >= 2 ? 'negative' : 'neutral';

  if (sentiment === 'positive') {
    score += 8;
    factors.push('Positive sentiment');
  }

  const lifeEventMatches = LIFE_EVENT_KEYWORDS.filter(kw => fullText.includes(kw));
  if (lifeEventMatches.length > 0) {
    score += lifeEventMatches.length * 7;
    lifeEvents.push(...lifeEventMatches);
    factors.push(`${lifeEventMatches.length} life events`);
  }

  const hasBusinessIntent = fullText.includes('business') || fullText.includes('negosyo') ||
                           fullText.includes('franchise') || fullText.includes('investment');
  const hasProductIntent = fullText.includes('insurance') || fullText.includes('savings') ||
                          fullText.includes('financial') || fullText.includes('plan');

  const opportunityType: 'product' | 'business' | 'both' =
    hasBusinessIntent && hasProductIntent ? 'both' :
    hasBusinessIntent ? 'business' :
    hasProductIntent ? 'product' : 'both';

  if (opportunityType === 'both') {
    score += 10;
    factors.push('Open to products & business');
  }

  const hasMoneyKeywords = fullText.includes('income') || fullText.includes('kita') ||
                          fullText.includes('savings') || fullText.includes('financial');
  if (hasMoneyKeywords) {
    score += 8;
    factors.push('Financial motivation');
  }

  const urgencyLevel: 'high' | 'medium' | 'low' =
    urgencyMatches.length >= 2 ? 'high' :
    urgencyMatches.length >= 1 ? 'medium' : 'low';

  score = Math.min(100, Math.max(0, score));

  const bucket: 'hot' | 'warm' | 'cold' =
    score >= 70 ? 'hot' :
    score >= 50 ? 'warm' : 'cold';

  const confidence = Math.min(95, 60 + (factors.length * 5));

  const explanation = generateExplanation(bucket, factors, score);

  return {
    full_name: prospect.full_name,
    snippet: prospect.snippet,
    score,
    bucket,
    confidence,
    top_factors: factors.slice(0, 5),
    explanation,
    pain_points: painPoints.slice(0, 5),
    interests: interests.slice(0, 5),
    life_events: lifeEvents.slice(0, 3),
    sentiment,
    opportunity_type: opportunityType,
    urgency_level: urgencyLevel,
  };
}

function generateExplanation(bucket: string, factors: string[], score: number): string {
  if (bucket === 'hot') {
    return `High-value prospect (${score}/100). ${factors.join(', ')}. Strong buying intent detected.`;
  } else if (bucket === 'warm') {
    return `Moderate prospect (${score}/100). ${factors.join(', ')}. Shows potential interest.`;
  } else {
    return `Lower priority (${score}/100). Limited signals detected. May need nurturing.`;
  }
}
