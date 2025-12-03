import { ExtractedProspect } from './batchExtractor';

export interface ScoredProspect extends ExtractedProspect {
  score: number;
  bucket: 'hot' | 'warm' | 'cold';
  confidence: number;
  top_factors: string[];
  pain_points: string[];
  interests: string[];
  sentiment: string;
  opportunity_type: string;
}

const PAIN_POINT_KEYWORDS = [
  'kailangan', 'need', 'hirap', 'kulang', 'gastos', 'bills', 'utang',
  'pagod', 'stress', 'takot', 'problema', 'issue', 'struggle', 'difficulty'
];

const OPPORTUNITY_KEYWORDS = [
  'extra income', 'side hustle', 'business', 'negosyo', 'opportunity',
  'investment', 'online', 'wfh', 'work from home', 'freelance', 'startup',
  'entrepreneur', 'passive income'
];

const URGENCY_KEYWORDS = [
  'ngayon', 'now', 'asap', 'urgent', 'soon', '2025', 'today',
  'immediately', 'kaagad', 'this month', 'this year'
];

export function scoreProspect(prospect: ExtractedProspect): ScoredProspect {
  const snippetLower = (prospect.snippet + ' ' + prospect.context).toLowerCase();
  let score = 50;
  const factors: string[] = [];
  const painPoints: string[] = [];
  const interests: string[] = [];

  const painMatches = PAIN_POINT_KEYWORDS.filter(kw => snippetLower.includes(kw));
  if (painMatches.length > 0) {
    score += painMatches.length * 8;
    painPoints.push(...painMatches);
    factors.push(`${painMatches.length} pain points`);
  }

  const oppMatches = OPPORTUNITY_KEYWORDS.filter(kw => snippetLower.includes(kw));
  if (oppMatches.length > 0) {
    score += oppMatches.length * 10;
    interests.push(...oppMatches);
    factors.push(`${oppMatches.length} opportunity signals`);
  }

  const urgMatches = URGENCY_KEYWORDS.filter(kw => snippetLower.includes(kw));
  if (urgMatches.length > 0) {
    score += urgMatches.length * 12;
    factors.push('High urgency');
  }

  score = Math.min(100, Math.max(0, score));
  const bucket = score >= 70 ? 'hot' : score >= 50 ? 'warm' : 'cold';

  return {
    ...prospect,
    score,
    bucket,
    confidence: 70 + (factors.length * 5),
    top_factors: factors,
    pain_points: painPoints,
    interests: interests,
    sentiment: 'neutral',
    opportunity_type: 'both',
  };
}

export async function scoreBatch(prospects: ExtractedProspect[]): Promise<ScoredProspect[]> {
  return Promise.all(prospects.map(p => Promise.resolve(scoreProspect(p))));
}

export async function scoreAllBatches(batches: ExtractedProspect[][]): Promise<ScoredProspect[][]> {
  return Promise.all(batches.map(batch => scoreBatch(batch)));
}
