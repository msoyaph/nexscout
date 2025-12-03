export interface TestDataConfig {
  userId: string;
  scanType?: 'paste_text' | 'screenshot' | 'csv' | 'url' | 'browser_extension';
  count: number;
}

export const FILIPINO_NAMES = [
  'Juan Dela Cruz',
  'Maria Santos',
  'Mark Alonzo',
  'Jerome Dizon',
  'Angela Ramos',
  'Jessa Mae Lopez',
  'Cliff Jefferson',
  'Grace Ann Bautista',
  'Rico Mercado',
  'Ana Marie Reyes',
  'Carlo Villanueva',
  'Jenny Rose Garcia',
  'Michael Torres',
  'Kristine Joy Cruz',
  'Robert James Santos',
  'Sarah Jane Gonzales',
  'Dennis Rodriguez',
  'Michelle Anne Perez',
  'Patrick Fernandez',
  'Angelica Mae Rivera',
  'Joshua David Ramirez',
  'Stephanie Nicole Flores',
  'Kevin Paul Morales',
  'Nicole Ashley Gutierrez',
  'Bryan Christopher Mendoza',
];

export const PAIN_POINTS = [
  'kulang sa oras',
  'financial stress',
  'need extra income',
  'career growth',
  'OFW family pressure',
  'high living costs',
  'unstable income',
  'work-life balance',
  'limited opportunities',
  'mounting debts',
  'educational expenses',
  'retirement concerns',
  'health insurance needed',
  'business capital shortage',
  'pandemic impact',
];

export const INTERESTS = [
  'online business',
  'investing',
  'insurance',
  'real estate',
  'affiliate marketing',
  'stock market',
  'passive income',
  'entrepreneurship',
  'financial planning',
  'side hustles',
  'cryptocurrency',
  'e-commerce',
  'networking',
  'digital marketing',
  'wealth building',
];

export const LIFE_EVENTS = [
  'new baby',
  'getting married',
  'bought a house',
  'career change',
  'started business',
  'moved abroad',
  'graduated',
  'promotion',
  'expanded family',
  'relocated',
  'retirement planning',
  'health scare',
];

export const PERSONAS = [
  'Business Minded',
  'Opportunity Seeker',
  'Family Provider',
  'Ambitious Networker',
  'Career Builder',
  'Financial Strategist',
  'Side Hustler',
  'Risk Taker',
  'Conservative Saver',
  'Early Adopter',
];

export const PLATFORMS = ['fb', 'ig', 'li', 'other'];

export const AI_INSIGHTS = [
  'Shows high interest in side hustles and extra income opportunities.',
  'Mentions financial pressure in recent posts and conversations.',
  'Open to exploring new business ventures and investments.',
  'Positive engagement in social posts about entrepreneurship.',
  'Actively seeking ways to improve financial situation.',
  'Demonstrates leadership qualities in group discussions.',
  'Engages frequently with business and finance content.',
  'Has expressed interest in learning about insurance products.',
  'Shows concern about family financial security.',
  'Receptive to new opportunities based on interaction patterns.',
];

export function generateRandomName(): string {
  return FILIPINO_NAMES[Math.floor(Math.random() * FILIPINO_NAMES.length)];
}

export function generateRandomPainPoints(count: number = 3): string[] {
  const shuffled = [...PAIN_POINTS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export function generateRandomInterests(count: number = 4): string[] {
  const shuffled = [...INTERESTS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export function generateRandomLifeEvents(count: number = 1): string[] {
  const shuffled = [...LIFE_EVENTS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export function generateRandomPersona(): string {
  return PERSONAS[Math.floor(Math.random() * PERSONAS.length)];
}

export function generateRandomPlatform(): string {
  return PLATFORMS[Math.floor(Math.random() * PLATFORMS.length)];
}

export function generateRandomInsight(): string {
  return AI_INSIGHTS[Math.floor(Math.random() * AI_INSIGHTS.length)];
}

export function generateScoutScore(): {
  score: number;
  bucket: 'hot' | 'warm' | 'cold';
  explanation: string[];
} {
  const score = Math.floor(Math.random() * 100);
  let bucket: 'hot' | 'warm' | 'cold' = 'cold';

  if (score >= 80) bucket = 'hot';
  else if (score >= 50) bucket = 'warm';

  const explanation = [];

  if (score >= 70) {
    explanation.push('High business interest signals detected');
    explanation.push('Active engagement patterns observed');
  }
  if (score >= 50) {
    explanation.push('Moderate pain points identified');
    explanation.push('Open to opportunities');
  }
  if (score < 50) {
    explanation.push('Limited engagement signals');
    explanation.push('Requires nurturing');
  }

  return { score, bucket, explanation };
}

export function generateTestProspectData() {
  const name = generateRandomName();
  const painPoints = generateRandomPainPoints(Math.floor(Math.random() * 3) + 1);
  const interests = generateRandomInterests(Math.floor(Math.random() * 4) + 2);
  const lifeEvents = Math.random() > 0.5 ? generateRandomLifeEvents(1) : [];
  const persona = generateRandomPersona();
  const platform = generateRandomPlatform();
  const insight = generateRandomInsight();
  const scoreData = generateScoutScore();

  return {
    name,
    platform,
    painPoints,
    interests,
    lifeEvents,
    persona,
    insight,
    score: scoreData.score,
    bucket: scoreData.bucket,
    explanation: scoreData.explanation,
  };
}

export function calculateDistribution(count: number) {
  const hotPercent = 0.15 + Math.random() * 0.1;
  const warmPercent = 0.45 + Math.random() * 0.1;

  const hotCount = Math.floor(count * hotPercent);
  const warmCount = Math.floor(count * warmPercent);
  const coldCount = count - hotCount - warmCount;

  return { hotCount, warmCount, coldCount };
}
