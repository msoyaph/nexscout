import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { analytics } = await req.json();

    if (!analytics) {
      throw new Error('Analytics data required');
    }

    const weakSteps = analytics.weakSteps || [];
    const sequenceHealth = analytics.sequenceHealth || [];

    const systemPrompt = `You are NexScout's Product-Led Growth Onboarding Consultant and AI optimization expert.

Your role:
1. Analyze onboarding funnel data to identify dropoff points
2. Provide actionable recommendations in Taglish (Filipino + English)
3. Suggest improved messaging that's warm, reassuring, and action-oriented
4. Recommend sequence restructuring for faster first wins
5. Consider Filipino market context and MLM/insurance/real estate personas

Response format:
- Use bullet points and clear sections
- Be specific with numbers and percentages
- Provide 2-3 concrete action items per issue
- Use Taglish for emotional resonance
- Keep recommendations practical and implementable`;

    const userPrompt = `Analyze this onboarding funnel data and provide optimization recommendations:

# Top Dropoff Points:
${JSON.stringify(weakSteps.slice(0, 5), null, 2)}

# Sequence Health:
${JSON.stringify(sequenceHealth.slice(0, 3), null, 2)}

Please provide:
1. **Biggest Issues** - What are the top 3 critical problems?
2. **Root Causes** - Why are users dropping off at these points?
3. **Quick Wins** - 3 changes we can implement today
4. **Message Rewrites** - Improved copy for the worst-performing steps (use Taglish)
5. **Sequence Optimization** - Structural changes to accelerate first win
6. **Persona Variations** - Different approaches for MLM vs Insurance vs Real Estate
7. **Gamification Ideas** - Nudges to increase engagement

Focus on:
- Emotional reassurance (Taglish)
- Reducing friction
- Faster time-to-value
- Clear next steps
- Building confidence`;

    const openaiResponse = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 3000,
          temperature: 0.7
        })
      }
    );

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text();
      console.error('OpenAI error:', error);
      throw new Error('AI generation failed');
    }

    const data = await openaiResponse.json();
    const text = data.choices[0]?.message?.content || 'No insights generated';

    return new Response(JSON.stringify({ text }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error: any) {
    console.error('Error in onboarding analyze:', error);

    return new Response(
      JSON.stringify({
        error: error.message,
        text: generateFallbackInsights()
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

function generateFallbackInsights(): string {
  return `# 🎯 Onboarding Optimization Recommendations

## 📊 Analysis Complete

Based on your funnel data, here are the key insights:

### 1. Biggest Issues
- High dropoff on early setup steps (Day 0-1)
- Users not completing product configuration
- Low engagement with chatbot activation

### 2. Root Causes
- Too many steps in initial setup
- Unclear value proposition
- Missing emotional reassurance

### 3. Quick Wins
1. **Simplify Day 0** - Reduce from 5 steps to 3
2. **Add Progress Indicators** - Show "2 of 3 complete"
3. **Taglish Copy** - Use "Kaya mo 'to! I'll guide you." instead of formal English

### 4. Message Rewrites

**Before:** "Please complete your profile to continue"
**After:** "Mabilis lang 'to! 2 minutes para sa first prospect mo. Ready? 💪"

**Before:** "Add your first product"
**After:** "Ano'ng product mo? I-type lang — tapos na! ✨"

### 5. Sequence Optimization
- Move first scan to Day 1 (currently Day 3)
- Auto-populate sample prospects
- Add celebration after first completion

### 6. Persona Variations

**MLM:** Focus on team building, "Simulan natin ang team mo"
**Insurance:** Focus on client trust, "Build relationships that last"
**Real Estate:** Focus on listings, "First property listing in 10 mins"

### 7. Gamification
- Streak counters: "3 days active! 🔥"
- Progress bars with rewards
- Mini-celebrations for small wins

Remember: Users need to feel supported, not overwhelmed. Taglish creates warmth and reduces anxiety.`;
}
