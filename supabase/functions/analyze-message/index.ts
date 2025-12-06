// Supabase Edge Function for AI Message Analysis
// This keeps your OpenAI API key secure on the server-side

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, prospectName, previousMessages } = await req.json();

    if (!message) {
      throw new Error('Message content is required');
    }

    // Get OpenAI API key from environment (secure)
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are an expert sales message analyzer for a Filipino MLM/direct sales platform.

Analyze the prospect's message and provide:
1. Sentiment: positive, neutral, negative, or mixed
2. Sentiment Score: 0.00 (very negative) to 1.00 (very positive)
3. Intent: interested, questioning, objecting, scheduling, buying, declining, neutral
4. Engagement Level: high, medium, or low
5. Buying Signals: Phrases indicating readiness to buy
6. Objections: Concerns or hesitations
7. Questions Asked: List of questions
8. Key Phrases: Important words/phrases
9. ScoutScore Impact: -20 to +20 points
10. Reasoning: Brief explanation

Consider Filipino/Taglish:
- "Magkano?" = "How much?"
- "Pwede ba?" = "Is it possible?"
- "Sige" = "Okay/Yes"
- "Hindi pa sigurado" = "Not sure yet"
- "Interested ako" = "I'm interested"

Respond in JSON format only.`
          },
          {
            role: 'user',
            content: `Analyze this message from ${prospectName || 'a prospect'}:

"${message}"

${previousMessages ? `Previous conversation:\n${previousMessages.join('\n')}` : ''}

Provide analysis in this JSON format:
{
  "sentiment": "positive|neutral|negative|mixed",
  "sentimentScore": 0.75,
  "intent": "interested|questioning|objecting|scheduling|buying|declining|neutral",
  "engagementLevel": "high|medium|low",
  "buyingSignals": ["signal1", "signal2"],
  "objections": ["objection1"],
  "questionsAsked": ["question1"],
  "keyPhrases": ["phrase1", "phrase2"],
  "scoutScoreImpact": 10,
  "reasoning": "Brief explanation"
}`
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await openaiResponse.json();
    const analysis = JSON.parse(data.choices[0].message.content);

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});




