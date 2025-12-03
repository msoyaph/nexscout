export interface ScoutScoreV5Result {
  score: number;
  rank: 'hot' | 'warm' | 'cold';
  confidence: number;
  contributingFactors: Array<{
    category: string;
    signal: string;
    points: number;
    weight: number;
  }>;
  breakdown: {
    intentSignals: number;
    painPoints: number;
    lifeEvents: number;
    authorityInfluence: number;
    relationshipStrength: number;
    profileCompleteness: number;
  };
}

export interface ProspectSignals {
  text?: string;
  occupation?: string;
  interests?: string[];
  signals?: string[];
  painPoints?: string[];
  lifeEvents?: string[];
  followers?: number;
  engagement?: number;
  mutualFriends?: number;
  interactions?: number;
  profile?: {
    hasOccupation?: boolean;
    hasLocation?: boolean;
    hasSocialLinks?: boolean;
    hasSkills?: boolean;
  };
}

export function calculateScoutScoreV5(prospect: ProspectSignals): ScoutScoreV5Result {
  const factors: Array<{ category: string; signal: string; points: number; weight: number }> = [];

  const breakdown = {
    intentSignals: 0,
    painPoints: 0,
    lifeEvents: 0,
    authorityInfluence: 0,
    relationshipStrength: 0,
    profileCompleteness: 0,
  };

  const text = (prospect.text || '').toLowerCase();
  const allSignals = [
    ...(prospect.signals || []),
    ...(prospect.interests || []),
  ].map(s => s.toLowerCase());

  breakdown.intentSignals = analyzeIntentSignals(text, allSignals, factors);
  breakdown.painPoints = analyzePainPoints(text, allSignals, factors);
  breakdown.lifeEvents = analyzeLifeEvents(text, allSignals, factors);
  breakdown.authorityInfluence = analyzeAuthorityInfluence(prospect, factors);
  breakdown.relationshipStrength = analyzeRelationshipStrength(prospect, factors);
  breakdown.profileCompleteness = analyzeProfileCompleteness(prospect, factors);

  const totalScore = Math.min(
    breakdown.intentSignals +
    breakdown.painPoints +
    breakdown.lifeEvents +
    breakdown.authorityInfluence +
    breakdown.relationshipStrength +
    breakdown.profileCompleteness,
    100
  );

  const confidence = calculateConfidence(factors, prospect);

  const rank = totalScore >= 70 ? 'hot' : totalScore >= 50 ? 'warm' : 'cold';

  return {
    score: Math.round(totalScore),
    rank,
    confidence,
    contributingFactors: factors,
    breakdown,
  };
}

function analyzeIntentSignals(
  text: string,
  signals: string[],
  factors: Array<any>
): number {
  let score = 0;

  const intentKeywords = [
    { phrase: 'extra income', points: 30, signal: 'Actively seeking extra income' },
    { phrase: 'negosyo', points: 28, signal: 'Business interest (negosyo)' },
    { phrase: 'side hustle', points: 25, signal: 'Looking for side hustle' },
    { phrase: 'passive income', points: 27, signal: 'Interest in passive income' },
    { phrase: 'insurance', points: 25, signal: 'Insurance interest' },
    { phrase: 'vul', points: 22, signal: 'VUL product awareness' },
    { phrase: 'investment', points: 20, signal: 'Investment mindset' },
    { phrase: 'financial freedom', points: 24, signal: 'Financial freedom goal' },
    { phrase: 'ready to start', points: 23, signal: 'Ready to take action' },
    { phrase: 'looking for opportunity', points: 22, signal: 'Opportunity seeking' },
    { phrase: 'online selling', points: 20, signal: 'E-commerce interest' },
    { phrase: 'homebased', points: 18, signal: 'Home-based work interest' },
    { phrase: 'business opportunity', points: 26, signal: 'Business opportunity seeker' },
  ];

  for (const keyword of intentKeywords) {
    if (text.includes(keyword.phrase) || signals.includes(keyword.phrase)) {
      const points = keyword.points;
      score += points;
      factors.push({
        category: 'Intent Signals',
        signal: keyword.signal,
        points,
        weight: 0.3,
      });
    }
  }

  return Math.min(score, 30);
}

function analyzePainPoints(
  text: string,
  signals: string[],
  factors: Array<any>
): number {
  let score = 0;

  const painKeywords = [
    { phrase: 'pagod', points: 20, signal: 'Career fatigue expressed' },
    { phrase: 'salary', points: 15, signal: 'Salary concerns mentioned' },
    { phrase: 'kulang', points: 18, signal: 'Financial insufficiency' },
    { phrase: 'hirap', points: 17, signal: 'Financial difficulty' },
    { phrase: 'budget', points: 14, signal: 'Budget consciousness' },
    { phrase: 'stress', points: 16, signal: 'Work stress indicated' },
    { phrase: 'burnout', points: 19, signal: 'Career burnout' },
    { phrase: 'tired of', points: 15, signal: 'Career dissatisfaction' },
    { phrase: 'quit', points: 17, signal: 'Job change consideration' },
    { phrase: 'resignation', points: 18, signal: 'Considering resignation' },
    { phrase: 'walang pera', points: 20, signal: 'Cash flow problems' },
  ];

  for (const keyword of painKeywords) {
    if (text.includes(keyword.phrase) || signals.includes(keyword.phrase)) {
      const points = keyword.points;
      score += points;
      factors.push({
        category: 'Pain Points',
        signal: keyword.signal,
        points,
        weight: 0.2,
      });
    }
  }

  return Math.min(score, 20);
}

function analyzeLifeEvents(
  text: string,
  signals: string[],
  factors: Array<any>
): number {
  let score = 0;

  const lifeEventKeywords = [
    { phrase: 'married', points: 15, signal: 'Recently married' },
    { phrase: 'newborn', points: 15, signal: 'New parent' },
    { phrase: 'baby', points: 12, signal: 'Has young child' },
    { phrase: 'new job', points: 13, signal: 'New employment' },
    { phrase: 'promoted', points: 12, signal: 'Career advancement' },
    { phrase: 'ofw', points: 14, signal: 'OFW deployment' },
    { phrase: 'abroad', points: 12, signal: 'Working abroad' },
    { phrase: 'returning home', points: 13, signal: 'Returning to Philippines' },
    { phrase: 'graduation', points: 11, signal: 'Recent graduate' },
    { phrase: 'graduate', points: 11, signal: 'Recent graduate' },
    { phrase: 'new house', points: 13, signal: 'Home purchase' },
    { phrase: 'wedding', points: 14, signal: 'Wedding planning' },
  ];

  for (const keyword of lifeEventKeywords) {
    if (text.includes(keyword.phrase) || signals.includes(keyword.phrase)) {
      const points = keyword.points;
      score += points;
      factors.push({
        category: 'Life Events',
        signal: keyword.signal,
        points,
        weight: 0.15,
      });
    }
  }

  return Math.min(score, 15);
}

function analyzeAuthorityInfluence(
  prospect: ProspectSignals,
  factors: Array<any>
): number {
  let score = 0;

  if (prospect.followers) {
    if (prospect.followers >= 10000) {
      score += 15;
      factors.push({
        category: 'Authority',
        signal: `${prospect.followers.toLocaleString()} followers - High influence`,
        points: 15,
        weight: 0.15,
      });
    } else if (prospect.followers >= 5000) {
      score += 12;
      factors.push({
        category: 'Authority',
        signal: `${prospect.followers.toLocaleString()} followers - Medium influence`,
        points: 12,
        weight: 0.15,
      });
    } else if (prospect.followers >= 1000) {
      score += 8;
      factors.push({
        category: 'Authority',
        signal: `${prospect.followers.toLocaleString()} followers - Some influence`,
        points: 8,
        weight: 0.15,
      });
    }
  }

  if (prospect.engagement && prospect.engagement >= 100) {
    const points = Math.min(10, Math.floor(prospect.engagement / 50));
    score += points;
    factors.push({
      category: 'Authority',
      signal: `High engagement (${prospect.engagement} interactions)`,
      points,
      weight: 0.15,
    });
  }

  const occupation = (prospect.occupation || '').toLowerCase();
  const leadershipRoles = ['ceo', 'founder', 'director', 'manager', 'head', 'vp', 'president'];

  if (leadershipRoles.some(role => occupation.includes(role))) {
    score += 12;
    factors.push({
      category: 'Authority',
      signal: 'Leadership position',
      points: 12,
      weight: 0.15,
    });
  }

  return Math.min(score, 15);
}

function analyzeRelationshipStrength(
  prospect: ProspectSignals,
  factors: Array<any>
): number {
  let score = 0;

  if (prospect.mutualFriends) {
    if (prospect.mutualFriends >= 50) {
      score += 10;
      factors.push({
        category: 'Relationship',
        signal: `${prospect.mutualFriends} mutual friends - Strong network`,
        points: 10,
        weight: 0.1,
      });
    } else if (prospect.mutualFriends >= 20) {
      score += 7;
      factors.push({
        category: 'Relationship',
        signal: `${prospect.mutualFriends} mutual friends - Good network`,
        points: 7,
        weight: 0.1,
      });
    } else if (prospect.mutualFriends >= 5) {
      score += 4;
      factors.push({
        category: 'Relationship',
        signal: `${prospect.mutualFriends} mutual friends`,
        points: 4,
        weight: 0.1,
      });
    }
  }

  if (prospect.interactions && prospect.interactions >= 5) {
    const points = Math.min(5, prospect.interactions);
    score += points;
    factors.push({
      category: 'Relationship',
      signal: `${prospect.interactions} past interactions`,
      points,
      weight: 0.1,
    });
  }

  return Math.min(score, 10);
}

function analyzeProfileCompleteness(
  prospect: ProspectSignals,
  factors: Array<any>
): number {
  let score = 0;
  const profile = prospect.profile || {};

  if (profile.hasOccupation) {
    score += 3;
    factors.push({
      category: 'Profile',
      signal: 'Occupation listed',
      points: 3,
      weight: 0.1,
    });
  }

  if (profile.hasLocation) {
    score += 2;
    factors.push({
      category: 'Profile',
      signal: 'Location provided',
      points: 2,
      weight: 0.1,
    });
  }

  if (profile.hasSocialLinks) {
    score += 3;
    factors.push({
      category: 'Profile',
      signal: 'Social links present',
      points: 3,
      weight: 0.1,
    });
  }

  if (profile.hasSkills) {
    score += 2;
    factors.push({
      category: 'Profile',
      signal: 'Skills listed',
      points: 2,
      weight: 0.1,
    });
  }

  return Math.min(score, 10);
}

function calculateConfidence(factors: Array<any>, prospect: ProspectSignals): number {
  let confidence = 0.5;

  if (factors.length >= 5) confidence += 0.2;
  if (factors.length >= 10) confidence += 0.15;

  const hasStrongSignal = factors.some(f => f.points >= 20);
  if (hasStrongSignal) confidence += 0.1;

  if (prospect.profile?.hasOccupation) confidence += 0.05;

  return Math.min(confidence, 1);
}

export function rankProspects(prospects: Array<any>): Array<any> {
  return prospects
    .map(p => ({
      ...p,
      scoutScoreV5: calculateScoutScoreV5(p),
    }))
    .sort((a, b) => b.scoutScoreV5.score - a.scoutScoreV5.score);
}
