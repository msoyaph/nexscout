import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-Hub-Signature-256",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // GET request - Webhook verification
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      // Get verify token from settings (you should configure this per user)
      const VERIFY_TOKEN = 'nexscout_fb_verify_token_2024';

      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('Webhook verified');
        return new Response(challenge, {
          status: 200,
          headers: corsHeaders
        });
      } else {
        return new Response('Forbidden', {
          status: 403,
          headers: corsHeaders
        });
      }
    }

    // POST request - Handle incoming messages
    if (req.method === 'POST') {
      const body = await req.json();

      console.log('Received webhook:', JSON.stringify(body, null, 2));

      if (body.object === 'page') {
        for (const entry of body.entry) {
          for (const event of entry.messaging) {
            if (event.message && event.message.text) {
              await handleMessage(supabase, event);
            }
          }
        }

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
    }

    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders
    });

  } catch (error: any) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});

async function handleMessage(supabase: any, event: any) {
  const senderId = event.sender.id;
  const messageText = event.message.text;
  const recipientId = event.recipient.id; // This is the page ID

  // Find which user owns this page
  const { data: settings } = await supabase
    .from('chatbot_settings')
    .select('user_id, display_name, integrations')
    .eq('is_active', true)
    .contains('integrations', { facebook: { page_id: recipientId } })
    .maybeSingle();

  if (!settings) {
    console.error('No user found for page:', recipientId);
    return;
  }

  const userId = settings.user_id;

  // Get chatbot_id for this user
  const { data: chatbotLink } = await supabase
    .from('chatbot_links')
    .select('chatbot_id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  const chatbotId = chatbotLink?.chatbot_id || 'facebook';

  // Get or create session for this visitor
  const visitorSessionId = `fb_${senderId}`;

  const { data: existingSession } = await supabase
    .from('public_chat_sessions')
    .select('id')
    .eq('chatbot_id', chatbotId)
    .eq('visitor_session_id', visitorSessionId)
    .eq('channel', 'messenger')
    .eq('status', 'active')
    .maybeSingle();

  let sessionId = existingSession?.id;

  if (!sessionId) {
    const { data: newSession } = await supabase
      .from('public_chat_sessions')
      .insert({
        user_id: userId,
        chatbot_id: chatbotId,
        visitor_session_id: visitorSessionId,
        visitor_id: senderId,
        session_slug: `fb_${senderId}_${Date.now()}`,
        channel: 'messenger',
        status: 'active',
        buying_intent_score: 0,
        qualification_score: 0,
        message_count: 0
      })
      .select('id')
      .single();

    sessionId = newSession.id;
  }

  // Save incoming message
  await supabase.from('public_chat_messages').insert({
    session_id: sessionId,
    sender: 'visitor',
    message: messageText,
    external_id: event.message.mid
  });

  // Generate AI response using the full engine
  const aiResponse = await generateAIResponse(supabase, userId, settings, messageText);

  // Save AI response
  await supabase.from('public_chat_messages').insert({
    session_id: sessionId,
    sender: 'ai',
    message: aiResponse.response,
    ai_intent: aiResponse.intent,
    ai_buying_signals: aiResponse.buyingSignals,
    ai_emotion: aiResponse.emotion
  });

  // Send response to Facebook
  await sendFacebookMessage(
    senderId,
    aiResponse.response,
    settings.integrations.facebook.page_access_token
  );

  // Update session scores
  if (aiResponse.buyingSignals && aiResponse.buyingSignals.length > 0) {
    const scoreIncrease = aiResponse.buyingSignals.length * 0.15;
    await supabase.rpc('increment_session_scores', {
      p_session_id: sessionId,
      p_intent_increase: scoreIncrease,
      p_qualification_increase: scoreIncrease * 0.75
    });
  }
}

async function generateAIResponse(supabase: any, userId: string, settings: any, message: string) {
  try {
    console.log('[FB Webhook] Generating response using settings:', {
      userId,
      tone: settings.tone,
      useCustomInstructions: settings.use_custom_instructions,
      overrideIntelligence: settings.instructions_override_intelligence
    });

    // Apply tone from settings
    const tone = settings.tone || 'professional';
    const replyDepth = settings.reply_depth || 'medium';
    const useCustomInstructions = settings.use_custom_instructions || false;
    const overrideIntelligence = settings.instructions_override_intelligence || false;
    const customInstructions = settings.custom_system_instructions || '';

    // Load training data
    const { data: training } = await supabase
      .from('public_chatbot_training_data')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .limit(20);

    // Check for exact training data match
    if (training && training.length > 0) {
      const lower = message.toLowerCase().trim();
      for (const item of training) {
        if (item.question && lower === item.question.toLowerCase().trim()) {
          return {
            response: item.answer,
            intent: item.category || 'training_match',
            buyingSignals: [],
            emotion: 'helpful'
          };
        }
      }
    }

    // Load intelligence data (unless overridden)
    let company = null;
    let products: any[] = [];

    if (!overrideIntelligence) {
      const { data: companyData } = await supabase
        .from('company_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      company = companyData;

      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, short_description, long_description, product_type')
        .eq('user_id', userId)
        .eq('active', true)
        .limit(5);
      products = productsData || [];
    }

    // Detect intent and signals
    const lower = message.toLowerCase();
    let response = '';
    let intent = 'general';
    let buyingSignals: string[] = [];

    // Apply tone personality to responses
    const isFriendly = tone === 'friendly' || tone === 'casual';
    const isTaglish = tone === 'taglish';
    const agentName = settings.display_name || 'your AI assistant';

    if (lower.includes('price') || lower.includes('magkano') || lower.includes('cost') || lower.includes('presyo')) {
      if (isFriendly) {
        response = isTaglish
          ? `Hey! Maganda yang tanong! Meron kami flexible pricing perfect for you. Gusto mo ba ng details or i-schedule natin quick call para ma-discuss better?`
          : `Great question! We have flexible pricing designed just for you. Want me to share details or schedule a quick chat?`;
      } else {
        response = `Thank you for your interest in our pricing. We offer flexible options tailored to your needs. Would you like detailed information or to schedule a consultation?`;
      }
      intent = 'pricing_inquiry';
      buyingSignals = ['price_question'];
    } else if (lower.includes('demo') || lower.includes('schedule') || lower.includes('call') || lower.includes('meeting')) {
      response = isFriendly
        ? `Awesome! Let's set that up! What's your email and when's good for you?`
        : `I'd be pleased to arrange a demonstration. May I have your email address and preferred time?`;
      intent = 'demo_request';
      buyingSignals = ['demo_interest', 'high_intent'];
    } else if (lower.includes('product') || lower.includes('service') || lower.includes('offer') || lower.includes('produkto')) {
      if (products && products.length > 0) {
        response = isFriendly
          ? `Check out what we've got for you!\n\n`
          : `Here are our featured solutions:\n\n`;
        products.forEach((p: any, idx: number) => {
          const desc = p.short_description || p.long_description || 'A great solution';
          response += `${idx + 1}. ${p.name}: ${desc}\n`;
        });
        response += isFriendly
          ? `\nWhich one sounds good to you?`
          : `\nWhich solution would you like to learn more about?`;
      } else {
        response = `${agentName} offers innovative solutions to help your business succeed. What specific needs do you have?`;
      }
      intent = 'product_inquiry';
      buyingSignals = ['product_interest'];
    } else if (lower.includes('company') || lower.includes('about') || lower.includes('kumpanya') || lower.includes('tungkol')) {
      if (company && company.description) {
        const desc = replyDepth === 'short'
          ? company.description.substring(0, 150)
          : company.description.substring(0, 300);
        response = `${agentName} - ${desc}... ${isFriendly ? 'How can I help?' : 'How may I assist you today?'}`;
      } else {
        response = isFriendly
          ? `Hey! We're here to help businesses like yours grow. What do you want to know?`
          : `We're dedicated to helping businesses succeed. What would you like to know?`;
      }
      intent = 'company_inquiry';
    } else if (lower.includes('interested') || lower.includes('gusto') || lower.includes('want') || lower.includes('need')) {
      response = isFriendly
        ? `That's great! Tell me more about what you're looking for!`
        : `Wonderful! I'd be pleased to learn more about your requirements. Could you share more details?`;
      intent = 'interest_expressed';
      buyingSignals = ['interest_signal'];
    } else {
      response = isFriendly
        ? `Hi! Thanks for reaching out! I'm ${agentName}. What can I help you with?`
        : `Hello! Thank you for contacting ${agentName}. How may I assist you today?`;
      intent = 'general_inquiry';
    }

    // Prepend custom instructions reminder if enabled
    if (useCustomInstructions && customInstructions && !overrideIntelligence) {
      console.log('[FB Webhook] Custom instructions active (augment mode)');
    }

    return {
      response,
      intent,
      buyingSignals,
      emotion: 'helpful'
    };
  } catch (error) {
    console.error('[FB Webhook] Error generating AI response:', error);
    const fallbackName = settings.display_name || 'our team';
    return {
      response: `Hi! Thanks for your message. ${fallbackName} is here to help. What can I assist you with?`,
      intent: 'fallback',
      buyingSignals: [],
      emotion: 'helpful'
    };
  }
}

async function sendFacebookMessage(recipientId: string, message: string, accessToken: string) {
  const url = `https://graph.facebook.com/v18.0/me/messages?access_token=${accessToken}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text: message },
      messaging_type: 'RESPONSE'
    })
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Facebook API error:', error);
    throw new Error(`Failed to send Facebook message`);
  }

  return await response.json();
}
