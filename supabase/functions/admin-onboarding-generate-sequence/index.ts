import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, X-Client-Info, Apikey'
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    const openaiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { analytics } = await req.json();

    if (!analytics) {
      throw new Error('Analytics data required');
    }

    const systemPrompt = `You are a Product-Led Growth sequence designer specializing in Filipino market onboarding.

Create an optimized "onboarding_v3_dynamic" sequence that:
1. Gets users to first win in 72 hours
2. Uses behavioral triggers, not just time delays
3. Includes persona-specific variations
4. Uses Taglish for warmth and clarity
5. Has clear aha moments and reinforcement loops

Output ONLY valid JSON following the onboarding sequence schema. No markdown, no explanations.`;

    const userPrompt = `Based on analytics showing dropoff at these steps: ${JSON.stringify(
      analytics.weakSteps?.slice(0, 5) || []
    )}, create an improved v3 sequence.

Requirements:
- 7 days maximum
- 3-4 scenarios per day
- Mix of email, push, and mentor messages
- Event-based triggers
- Personas: MLM, Insurance, Real Estate, Online Seller
- Target: First sale or appointment within 72 hours
- PLG pattern: aha → action → reinforcement

Return complete JSON:
{
  "sequence_id": "onboarding_v3_dynamic",
  "version": "1.0",
  "name": "Dynamic First Win v3",
  "description": "AI-optimized sequence",
  "ab_group": null,
  "days": [
    {
      "day": 0,
      "scenarios": [
        {
          "id": "scenario_id",
          "trigger": "event_trigger",
          "messages": {
            "email": {"subject": "...", "body": "...", "action_url": "..."},
            "push": {"title": "...", "body": "...", "action_url": "..."},
            "mentor": {"text": "..."}
          }
        }
      ]
    }
  ]
}`;

    const openaiResponse = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 2500,
          temperature: 0.8
        })
      }
    );

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text();
      console.error('OpenAI error:', error);
      throw new Error('AI generation failed');
    }

    const data = await openaiResponse.json();
    let sequence = data.choices[0]?.message?.content || '{}';

    sequence = sequence.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      JSON.parse(sequence);
    } catch {
      sequence = generateFallbackSequence();
    }

    return new Response(JSON.stringify({ sequence }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error: any) {
    console.error('Error generating sequence:', error);

    return new Response(
      JSON.stringify({
        error: error.message,
        sequence: generateFallbackSequence()
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});

function generateFallbackSequence(): string {
  return JSON.stringify(
    {
      sequence_id: 'onboarding_v3_dynamic',
      version: '1.0',
      name: 'Dynamic First Win v3',
      description: 'AI-optimized sequence for 72-hour first win',
      ab_group: null,
      days: [
        {
          day: 0,
          scenarios: [
            {
              id: 'instant_welcome',
              trigger: 'signup_completed',
              messages: {
                mentor: {
                  text: 'Welcome {{firstName}}! Target natin: 1 real result in 72 hours. Kaya mo \'to! 💪'
                },
                push: {
                  title: 'Welcome to NexScout! 🚀',
                  body: 'Let\'s get your first win in 3 days. I\'ll guide you.',
                  action_url: '/onboarding'
                }
              }
            },
            {
              id: 'quick_setup_nudge',
              trigger: 'no_company_data_1h',
              messages: {
                mentor: {
                  text: 'Quick question: Ano\'ng business mo? Type lang — 30 seconds. 💼'
                }
              }
            }
          ]
        },
        {
          day: 1,
          scenarios: [
            {
              id: 'first_product_push',
              trigger: 'product_data_missing_12h',
              messages: {
                push: {
                  title: 'Add your first product!',
                  body: 'Para makapag-start ka TODAY. 1 product lang. ✨',
                  action_url: '/products/add'
                },
                mentor: {
                  text: 'Ready na? Add your first product — description + price lang. Tapos activate chatbot! ��'
                }
              }
            }
          ]
        },
        {
          day: 2,
          scenarios: [
            {
              id: 'first_scan_activation',
              trigger: 'chatbot_active_no_scan',
              messages: {
                email: {
                  subject: 'Scan 3 prospects → Get first inquiry 💬',
                  body: 'Hi {{firstName}}! Your chatbot is ready. Now scan 3 prospects — let\'s see who replies first!',
                  action_url: '/scan/upload'
                },
                mentor: {
                  text: 'Chatbot mo active na! Scan 3 prospects para makita ko sino\'ng hot leads. Go! 🔥'
                }
              }
            }
          ]
        }
      ]
    },
    null,
    2
  );
}
