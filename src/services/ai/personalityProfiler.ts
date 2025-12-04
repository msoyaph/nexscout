import { supabase } from '../../lib/supabase';

export interface PersonalityInput {
  prospect: any;
  textSamples: string[];
  engagementPatterns: any;
  nlpSignals: any;
}

export interface PersonalityOutput {
  personalityType: 'Connector' | 'Driver' | 'Analyzer' | 'Dreamer' | 'Helper';
  traits: string[];
  communicationStyle: 'short' | 'expressive' | 'formal' | 'casual' | 'emoji-heavy';
  motivationTriggers: string[];
  riskSensitivity: 'low' | 'medium' | 'high';
  bestMessagingStyle: 'friendly' | 'consultative' | 'value-first' | 'direct';
  doNotDo: string[];
  eliteInsights?: string;
}

export async function profilePersonality(
  userId: string,
  prospectId: string,
  input: PersonalityInput
): Promise<PersonalityOutput> {
  const allText = input.textSamples.join(' ').toLowerCase();

  const personalityType = detectPersonalityType(allText, input.nlpSignals);
  const traits = extractTraits(allText, personalityType);
  const communicationStyle = detectCommunicationStyle(allText, input.textSamples);
  const motivationTriggers = identifyMotivationTriggers(allText, personalityType);
  const riskSensitivity = assessRiskSensitivity(allText);
  const bestMessagingStyle = getBestMessagingStyle(personalityType, communicationStyle);
  const doNotDo = getDoNotDoList(personalityType, riskSensitivity);
  const eliteInsights = generateEliteInsights(personalityType, traits, allText);

  const result: PersonalityOutput = {
    personalityType,
    traits,
    communicationStyle,
    motivationTriggers,
    riskSensitivity,
    bestMessagingStyle,
    doNotDo,
    eliteInsights,
  };

  await supabase.from('ai_personality_profiles').insert({
    user_id: userId,
    prospect_id: prospectId,
    personality_type: personalityType,
    traits,
    communication_style: communicationStyle,
    motivation_triggers: motivationTriggers,
    risk_sensitivity: riskSensitivity,
    best_messaging_style: bestMessagingStyle,
    do_not_do: doNotDo,
    elite_insights: eliteInsights,
  });

  return result;
}

function detectPersonalityType(text: string, nlpSignals: any): PersonalityOutput['personalityType'] {
  const indicators = {
    Connector: ['friends', 'people', 'together', 'tayo', 'team', 'share', 'help'],
    Driver: ['goal', 'achieve', 'win', 'results', 'success', 'target', 'kaya'],
    Analyzer: ['think', 'analyze', 'data', 'study', 'research', 'details', 'plan'],
    Dreamer: ['dream', 'vision', 'imagine', 'future', 'pangarap', 'someday'],
    Helper: ['help', 'serve', 'care', 'family', 'others', 'tulong', 'awa'],
  };

  const scores: Record<string, number> = {};
  Object.entries(indicators).forEach(([type, keywords]) => {
    scores[type] = keywords.filter(k => text.includes(k)).length;
  });

  const maxType = Object.entries(scores).reduce((max, [type, score]) =>
    score > max[1] ? [type, score] : max, ['Connector', 0]
  );

  return maxType[0] as PersonalityOutput['personalityType'];
}

function extractTraits(text: string, personalityType: string): string[] {
  const commonTraits = ['optimistic', 'family-oriented', 'ambitious', 'practical', 'hardworking'];
  const traits: string[] = [];

  if (text.includes('family') || text.includes('pamilya') || text.includes('anak')) {
    traits.push('family-oriented');
  }
  if (text.includes('god') || text.includes('diyos') || text.includes('blessed')) {
    traits.push('faith-driven');
  }
  if (text.includes('dream') || text.includes('goal') || text.includes('pangarap')) {
    traits.push('ambitious');
  }
  if (text.includes('work') || text.includes('trabaho') || text.includes('hustle')) {
    traits.push('hardworking');
  }

  if (personalityType === 'Connector') traits.push('sociable', 'relationship-focused');
  if (personalityType === 'Driver') traits.push('goal-oriented', 'competitive');
  if (personalityType === 'Analyzer') traits.push('detail-oriented', 'cautious');
  if (personalityType === 'Dreamer') traits.push('visionary', 'creative');
  if (personalityType === 'Helper') traits.push('empathetic', 'service-minded');

  return [...new Set(traits)].slice(0, 5);
}

function detectCommunicationStyle(text: string, samples: string[]): PersonalityOutput['communicationStyle'] {
  const avgLength = samples.reduce((sum, s) => sum + s.length, 0) / samples.length;
  const emojiCount = (text.match(/😀|😁|😂|🤣|😊|😍|❤️|🔥|💪|🙏/g) || []).length;
  const formalWords = ['po', 'opo', 'sir', 'madam', 'please', 'thank you'];
  const hasFormal = formalWords.some(w => text.includes(w));

  if (emojiCount > 5) return 'emoji-heavy';
  if (hasFormal) return 'formal';
  if (avgLength > 200) return 'expressive';
  if (avgLength < 50) return 'short';
  return 'casual';
}

function identifyMotivationTriggers(text: string, personalityType: string): string[] {
  const triggers: string[] = [];

  if (text.includes('money') || text.includes('pera') || text.includes('income')) {
    triggers.push('financial growth');
  }
  if (text.includes('family') || text.includes('pamilya')) {
    triggers.push('family security');
  }
  if (text.includes('learn') || text.includes('grow') || text.includes('develop')) {
    triggers.push('personal development');
  }
  if (text.includes('freedom') || text.includes('flexible') || text.includes('time')) {
    triggers.push('time freedom');
  }

  if (personalityType === 'Connector') triggers.push('community building');
  if (personalityType === 'Driver') triggers.push('achievement recognition');
  if (personalityType === 'Analyzer') triggers.push('proven systems');
  if (personalityType === 'Dreamer') triggers.push('big vision');
  if (personalityType === 'Helper') triggers.push('helping others');

  return [...new Set(triggers)].slice(0, 4);
}

function assessRiskSensitivity(text: string): 'low' | 'medium' | 'high' {
  const cautionWords = ['risky', 'safe', 'careful', 'sure', 'guarantee', 'ingat'];
  const adventureWords = ['try', 'go', 'kaya', 'challenge', 'explore'];

  const cautionCount = cautionWords.filter(w => text.includes(w)).length;
  const adventureCount = adventureWords.filter(w => text.includes(w)).length;

  if (cautionCount > adventureCount + 2) return 'high';
  if (adventureCount > cautionCount + 2) return 'low';
  return 'medium';
}

function getBestMessagingStyle(
  personalityType: string,
  communicationStyle: string
): PersonalityOutput['bestMessagingStyle'] {
  if (personalityType === 'Driver') return 'direct';
  if (personalityType === 'Analyzer') return 'value-first';
  if (personalityType === 'Connector' || personalityType === 'Helper') return 'friendly';
  return 'consultative';
}

function getDoNotDoList(personalityType: string, riskSensitivity: string): string[] {
  const doNotDo: string[] = [];

  if (personalityType === 'Analyzer' || riskSensitivity === 'high') {
    doNotDo.push('avoid hard pressure tactics');
    doNotDo.push('provide detailed information');
  }
  if (personalityType === 'Connector') {
    doNotDo.push('avoid cold/transactional tone');
  }
  if (personalityType === 'Helper') {
    doNotDo.push('avoid selfish benefit framing');
  }

  doNotDo.push('respect their communication style');

  return doNotDo;
}

function generateEliteInsights(personalityType: string, traits: string[], text: string): string {
  const insights: string[] = [];

  insights.push(`${personalityType} personality: best approached with ${
    personalityType === 'Connector' ? 'relationship-building' :
    personalityType === 'Driver' ? 'results focus' :
    personalityType === 'Analyzer' ? 'logic & proof' :
    personalityType === 'Dreamer' ? 'vision casting' : 'empathy & service'
  }.`);

  if (traits.includes('family-oriented')) {
    insights.push('Lead with family benefit angles.');
  }

  if (traits.includes('ambitious')) {
    insights.push('Ambitious prospects respond to growth & achievement framing.');
  }

  return insights.join(' ');
}
