import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface GenerateRequest {
  prospectId: string;
  generationType: 'message' | 'sequence' | 'deck' | 'objection';
  tone?: 'professional' | 'friendly' | 'casual';
  goal?: 'recruit' | 'sell' | 'book_call' | 'introduce';
  productName?: string;
  objection?: string;
}

function buildMessage(context: any, tone: string, goal: string): string {
  const bucket = context.bucket || 'cold';
  const scoutScore = context.scoutScore || 0;
  const topics = context.topics || [];
  const painPoints = context.painPoints || [];
  const lifeEvents = context.lifeEvents || [];
  const interests = context.interests || [];

  let message = '';

  // WARM OPENER based on context
  if (lifeEvents.includes('new_baby') || lifeEvents.includes('baby')) {
    message += `Hi ${context.name}! Congrats sa new baby mo! 🎉\n\n`;
  } else if (lifeEvents.includes('job_change') || lifeEvents.includes('new_job')) {
    message += `Hi ${context.name}! Congrats sa bagong work mo! 🎉\n\n`;
  } else if (lifeEvents.includes('promotion')) {
    message += `Hi ${context.name}! Nakita ko yung promotion mo - congrats! 🎉\n\n`;
  } else if (bucket === 'hot' && topics.length > 0) {
    message += `Hi ${context.name}! Napansin ko yung recent post mo about ${topics[0]} 👀\n\n`;
  } else if (tone === 'friendly' || tone === 'casual') {
    message += `Hi ${context.name}! Kamusta? 😊\n\n`;
  } else {
    message += `Hi ${context.name}!\n\n`;
  }

  // PERSONALIZED HOOK based on interests, pain points, ScoutScore
  if (goal === 'recruit') {
    if (painPoints.includes('financial_stress') || painPoints.includes('income')) {
      message += `Nakita ko na interested ka sa ${topics[0] || 'ways to grow financially'}. `;
      message += `Baka makatulong 'to sa goals mo this year—may bagong opportunity ako na napaka-aligned sa kung ano yung hinahanap mo.\n\n`;
    } else if (interests.includes('business') || interests.includes('entrepreneurship')) {
      message += `I know passionate ka sa ${topics[0] || 'business'}, and honestly I thought of you kasi perfect fit ka dito. `;
      message += `May something akong nakita na baka makatulong sayo i-level up yung current setup mo.\n\n`;
    } else {
      message += `I've been following your journey sa ${topics[0] || 'what you do'}, and I think you'd be really good sa isang opportunity na meron ako right now.\n\n`;
    }
    message += `Quick question lang—open ka ba to explore something new on the side? No pressure, sharing lang. 😊`;

  } else if (goal === 'sell') {
    if (painPoints.includes('health') || painPoints.includes('wellness')) {
      message += `Napansin ko interested ka sa health and wellness. May product ako na maraming tao ang nag-benefit na—baka makatulong din sayo.\n\n`;
    } else if (painPoints.includes('financial_stress')) {
      message += `I know mahirap mag-manage ng finances nowadays. May solution ako na tumutulong sa maraming tao na gumaan yung stress nila.\n\n`;
    } else {
      message += `Based sa mga post mo about ${topics[0] || 'your interests'}, I think you'd appreciate yung product na 'to. Marami nang naka-try and they love it.\n\n`;
    }
    message += `Gusto mo bang makita kung paano ito tumutulong? Libre lang naman mag-tanong. 😊`;

  } else if (goal === 'book_call') {
    if (bucket === 'hot') {
      message += `I'd love to pick your brain about ${topics[0] || 'your experience'}. Feel like we'd have a really good conversation!\n\n`;
    } else {
      message += `Would love to connect with you and learn more about your journey. I think may mga insights ka na helpful sa akin.\n\n`;
    }
    message += `Free ka ba for a quick 15-minute coffee chat this week? Virtual lang if mas convenient. ☕`;

  } else if (goal === 'introduce') {
    if (interests.length > 0) {
      message += `I've been following your posts about ${interests[0]}, and grabe I really resonate with your perspective.\n\n`;
    } else {
      message += `Came across your profile and thought we might have some things in common.\n\n`;
    }
    message += `Let's connect? I think we'd have a really interesting convo. No agenda—just genuinely curious about your story. 😊`;

  } else {
    message += `Nakita ko yung mga posts mo and I thought of reaching out. I think maganda yung perspective mo sa ${topics[0] || 'things'}.\n\n`;
    message += `Pwede ba tayong mag-connect? I'd love to hear more about what you're up to! 😊`;
  }

  return message;
}

function buildSequence(context: any, tone: string): Array<{ step: number; day: number; message: string; subject: string }> {
  const topics = context.topics || [];
  const interests = context.interests || [];

  return [
    {
      step: 1,
      day: 0,
      subject: `Quick question, ${context.name}`,
      message: buildMessage(context, tone, 'introduce'),
    },
    {
      step: 2,
      day: 3,
      subject: `Re: Quick question`,
      message: `Hi ${context.name}!\n\nJust following up sa message ko. I know busy ka, pero I think you'd really benefit from this.\n\nPwede ba mag-quick call tayo? 10 minutes lang. 😊`,
    },
    {
      step: 3,
      day: 7,
      subject: `Thought you'd appreciate this`,
      message: `Hey ${context.name}! Kamusta?\n\nI wanted to share something kasi naisip ko na aligned 'to sa ${topics[0] || interests[0] || 'goals mo'}.\n\nMarami na ang nag-benefit—baka interested ka rin?\n\nNo pressure lang, sharing lang! 😊`,
    },
    {
      step: 4,
      day: 10,
      subject: `Last follow-up from me`,
      message: `Hi ${context.name},\n\nAyoko naman mag-spam sa inbox mo, but I genuinely think maka-benefit ka dito.\n\nFree ka ba for a quick 10-minute call this week? Coffee ko na. ☕😊`,
    },
    {
      step: 5,
      day: 14,
      subject: `Closing the loop`,
      message: `${context.name},\n\nOkay last message na 'to—I'll respect your space. 😊\n\nKung sakaling mag-change yung isip mo or curious ka in the future, feel free to reach out anytime.\n\nWishing you all the best sa journey mo! 🙏`,
    },
  ];
}

function buildPitchDeck(productName: string, context: any): Array<{ slide: number; title: string; content: string }> {
  return [
    {
      slide: 1,
      title: 'The Problem',
      content: `Many people today face challenges like:\n${context.painPoints?.slice(0, 3).map((p: string) => `• ${p.replace('_', ' ')}`).join('\n') || '• Financial uncertainty\n• Limited income sources\n• Lack of flexibility'}`,
    },
    {
      slide: 2,
      title: 'Meet ' + productName,
      content: `${productName} is designed to help you overcome these challenges and achieve your goals through a proven system.`,
    },
    {
      slide: 3,
      title: 'Key Benefits',
      content: `• Flexible income opportunity\n• Work on your own schedule\n• Comprehensive training and support\n• Proven track record of success\n• Community of like-minded individuals`,
    },
    {
      slide: 4,
      title: 'Perfect For You',
      content: `Based on your interests in ${context.interests?.slice(0, 2).join(' and ') || 'growth'}, this opportunity aligns perfectly with your goals.`,
    },
    {
      slide: 5,
      title: 'Success Stories',
      content: `Thousands of people just like you have transformed their lives with ${productName}. Real results from real people.`,
    },
    {
      slide: 6,
      title: 'Next Steps',
      content: `Ready to get started?\n\n1. Schedule a call with me\n2. Get access to our starter training\n3. Join our community\n4. Start building your success`,
    },
  ];
}

function handleObjection(objection: string): string {
  const lower = objection.toLowerCase();

  if (lower.includes('no money') || lower.includes('walang pera') || lower.includes('expensive') || lower.includes('mahal')) {
    return `I totally get it—money matters talaga. 😊\n\nActually, marami na rin nag-start na ganyan ang concern, pero they found a way. May flexible payment options naman, and honestly yung potential return is way more than yung initial investment.\n\nPwede ba ipakita ko sayo yung numbers? Para clear ka sa situation. No pressure—gusto ko lang maging transparent. 😊`;
  }

  if (lower.includes('not interested') || lower.includes('no thanks') || lower.includes('wala akong interest')) {
    return `I appreciate your honesty! 🙏\n\nPwede ko ba tanungin—is it the timing na hindi right, or may something specific ba na hindi resonate sayo?\n\nI just want to make sure na hindi ko na-miss yung something na pwede pala makatulong talaga. 😊`;
  }

  if (lower.includes('busy') || lower.includes('no time') || lower.includes('wala akong time') || lower.includes('hectic')) {
    return `I hear you—we're all busy nga eh! 😊\n\nActually, that's one reason why this works. It's designed to fit your schedule, hindi yung ikaw ang mag-adjust. Most people dedicate lang 5-10 hours per week, and pwede mo gawin kahit kailan.\n\nGusto mo ipakita ko sayo kung paano yung iba nag-manage ng time nila? 😊`;
  }

  if (lower.includes('think about it') || lower.includes('later') || lower.includes('isip ko muna') || lower.includes('pag-isipan')) {
    return `Of course! Take your time. 😊\n\nI want you to feel confident sa decision mo. Pwede ko ba mag-share ng quick info na baka makatulong sayo mag-decide?\n\nOr gusto mo ba i-connect kita sa someone who was in the same position before? Para marinig mo yung experience nila? 🤔`;
  }

  if (lower.includes('scam') || lower.includes('legit') || lower.includes('totoo ba')) {
    return `I appreciate na you're being careful—that's smart! 🙏\n\nThis is 100% legit, and I'd be happy to show you proof. May business registration, success stories, and I can even connect you to people who are already benefiting from this.\n\nGusto mo ba makita yung documentation or mag-video call tayo para mas clear? 😊`;
  }

  if (lower.includes('family') || lower.includes('partner') || lower.includes('asawa') || lower.includes('spouse')) {
    return `That's totally fair—important decisions should involve your family. 😊\n\nPwede mo i-share sa kanila yung info, or kung gusto niyo, pwede tayong mag-call together para ma-address ko directly yung questions nila.\n\nI want everyone to feel comfortable and informed. 🙏`;
  }

  return `I appreciate you sharing that with me. 🙏\n\nThis is actually a common concern, and I'd love to address it properly.\n\nPwede ba tayo mag-quick conversation para ma-clarify ko? I think once you see the full picture, it might help. 😊`;
}

async function checkAndDeductCoins(supabase: any, userId: string, amount: number, description: string): Promise<boolean> {
  const { data: profile } = await supabase.from('profiles').select('coin_balance').eq('id', userId).single();
  const currentBalance = profile?.coin_balance || 0;

  if (currentBalance < amount) return false;

  const newBalance = currentBalance - amount;
  await supabase.from('profiles').update({ coin_balance: newBalance }).eq('id', userId);
  await supabase.from('coin_transactions').insert({
    user_id: userId,
    amount: -amount,
    transaction_type: 'spend',
    description,
    balance_after: newBalance,
  });

  return true;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { prospectId, generationType, tone, goal, productName, objection }: GenerateRequest = await req.json();

    // Check coin costs
    const costs = { message: 20, sequence: 50, deck: 75, objection: 15 };
    const cost = costs[generationType] || 20;

    const canAfford = await checkAndDeductCoins(supabase, user.id, cost, `AI ${generationType} generation`);
    if (!canAfford) {
      return new Response(
        JSON.stringify({ error: 'Insufficient coins' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check subscription tier for advanced features
    const { data: profile } = await supabase.from('profiles').select('subscription_tier').eq('id', user.id).single();
    const tier = profile?.subscription_tier || 'free';

    if (generationType === 'sequence' && tier === 'free') {
      return new Response(
        JSON.stringify({ error: 'Sequences are only available for Pro and Elite subscribers' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let output: any;

    if (generationType === 'objection') {
      output = { message: handleObjection(objection || '') };
    } else {
      // Fetch prospect context
      const { data: prospect, error: prospectError } = await supabase
        .from('prospects')
        .select('full_name, metadata')
        .eq('id', prospectId)
        .maybeSingle();

      if (prospectError || !prospect) {
        return new Response(
          JSON.stringify({ error: 'Prospect not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const metadata = prospect.metadata || {};
      const context = {
        name: prospect.full_name,
        topics: metadata.dominant_topics || metadata.tags || ['Business', 'Networking'],
        painPoints: metadata.pain_points || ['Looking for opportunities'],
        lifeEvents: metadata.life_events || [],
        interests: metadata.interests || metadata.tags || ['Business', 'Growth'],
        bucket: metadata.bucket || 'warm',
        scoutScore: metadata.scout_score || 50,
      };

      if (generationType === 'message') {
        output = { message: buildMessage(context, tone || 'friendly', goal || 'introduce') };
      } else if (generationType === 'sequence') {
        const steps = buildSequence(context, tone || 'professional');
        output = {
          sequence: {
            steps,
            totalSteps: steps.length,
            sequenceType: 'follow_up'
          }
        };
      } else if (generationType === 'deck') {
        output = { deck: buildPitchDeck(productName || 'Our Product', context) };
      }
    }

    // Save generation
    const { data: generation, error: saveError } = await supabase
      .from('ai_generations')
      .insert({
        user_id: user.id,
        prospect_id: prospectId,
        generation_type: generationType,
        input_data: { tone, goal, productName, objection },
        prompt_hash: btoa(JSON.stringify({ prospectId, generationType, tone, goal })).substring(0, 32),
        output_text: generationType === 'message' ? output.message : JSON.stringify(output),
        output_data: output,
        model_used: 'rule-based-v1',
        tokens_used: 0,
        cost_usd: 0,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Failed to save generation:', saveError);
    }

    await supabase.from('ai_usage_logs').insert({
      user_id: user.id,
      feature_type: generationType,
      model_used: 'rule-based-v1',
      tokens_used: 0,
      cost_usd: 0,
      success: true,
    });

    return new Response(
      JSON.stringify({ success: true, generationId: generation?.id, output }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-ai-content function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});