import { DeepIntelResult } from '../types';
import { supabase } from '../../../lib/supabase';

export async function runDeepIntel(
  userId: string,
  prospectId: string,
  contextData: any
): Promise<DeepIntelResult> {
  const prompt = buildDeepIntelPrompt(contextData);

  const { data: energyData } = await supabase
    .from('user_energy')
    .select('energy')
    .eq('user_id', userId)
    .single();

  const currentEnergy = energyData?.energy || 0;

  let aiOutput: any = null;
  let model = 'gpt-4o-mini';

  if (currentEnergy >= 10) {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-ai-content`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            user_id: userId,
            prompt,
            model: 'gpt-4o',
            mode: 'deep_intel',
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        aiOutput = result.output;
        model = 'gpt-4o';
      }
    } catch (error) {
      console.error('Error running deep intel with gpt-4o:', error);
    }
  }

  if (!aiOutput) {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-ai-content`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            user_id: userId,
            prompt,
            model: 'gpt-4o-mini',
            mode: 'deep_intel',
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        aiOutput = result.output;
        model = 'gpt-4o-mini';
      }
    } catch (error) {
      console.error('Error running deep intel with gpt-4o-mini:', error);
    }
  }

  const parsed = parseAIOutput(aiOutput);

  await supabase.from('ai_agent_results').insert({
    user_id: userId,
    prospect_entity_id: prospectId,
    agent_name: 'deep_intel_v10',
    agent_version: '1.0',
    model_used: model,
    raw_output: aiOutput,
    structured_output: parsed,
  });

  return {
    scout_score_v10: parsed.scout_score_v10 || 50,
    confidence_score: parsed.confidence_score || 0.5,
    personality_profile: parsed.personality_profile || {},
    pain_points: parsed.pain_points || [],
    financial_signals: parsed.financial_signals || {},
    business_interest: parsed.business_interest || {},
    life_events: parsed.life_events || [],
    emotional_state: parsed.emotional_state || {},
    engagement_prediction: parsed.engagement_prediction || {},
    upsell_readiness: parsed.upsell_readiness || {},
    closing_likelihood: parsed.closing_likelihood || {},
    top_opportunities: parsed.top_opportunities || [],
    raw_ai_output: aiOutput,
  };
}

function buildDeepIntelPrompt(contextData: any): string {
  return `You are an expert sales intelligence analyst. Analyze the following prospect data and provide a comprehensive intelligence report.

Context Data:
${JSON.stringify(contextData, null, 2)}

Provide your analysis in the following JSON format:
{
  "scout_score_v10": <number 0-100>,
  "confidence_score": <number 0-1>,
  "personality_profile": {
    "type": "<personality type>",
    "traits": ["<trait1>", "<trait2>"],
    "communication_style": "<style>"
  },
  "pain_points": [
    {
      "category": "<category>",
      "description": "<description>",
      "severity": "<high|medium|low>"
    }
  ],
  "financial_signals": {
    "buying_power": "<high|medium|low>",
    "budget_indicators": ["<indicator1>", "<indicator2>"],
    "spending_patterns": "<pattern>"
  },
  "business_interest": {
    "industry": "<industry>",
    "role": "<role>",
    "interests": ["<interest1>", "<interest2>"]
  },
  "life_events": [
    {
      "event": "<event>",
      "timing": "<timing>",
      "impact": "<impact>"
    }
  ],
  "emotional_state": {
    "primary_emotion": "<emotion>",
    "motivation_level": "<high|medium|low>",
    "readiness": "<ready|warming|cold>"
  },
  "engagement_prediction": {
    "channel": "<preferred channel>",
    "timing": "<best timing>",
    "approach": "<recommended approach>"
  },
  "upsell_readiness": {
    "score": <number 0-100>,
    "indicators": ["<indicator1>", "<indicator2>"]
  },
  "closing_likelihood": {
    "score": <number 0-100>,
    "timeframe": "<timeframe>",
    "blockers": ["<blocker1>", "<blocker2>"]
  },
  "top_opportunities": [
    {
      "opportunity": "<opportunity>",
      "priority": "<high|medium|low>",
      "action": "<recommended action>"
    }
  ]
}`;
}

function parseAIOutput(output: any): any {
  if (!output) {
    return {
      scout_score_v10: 50,
      confidence_score: 0.5,
      personality_profile: {},
      pain_points: [],
      financial_signals: {},
      business_interest: {},
      life_events: [],
      emotional_state: {},
      engagement_prediction: {},
      upsell_readiness: {},
      closing_likelihood: {},
      top_opportunities: [],
    };
  }

  if (typeof output === 'string') {
    try {
      return JSON.parse(output);
    } catch (e) {
      return {
        scout_score_v10: 50,
        confidence_score: 0.5,
        personality_profile: {},
        pain_points: [],
        financial_signals: {},
        business_interest: {},
        life_events: [],
        emotional_state: {},
        engagement_prediction: {},
        upsell_readiness: {},
        closing_likelihood: {},
        top_opportunities: [],
      };
    }
  }

  return output;
}
