import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ChatRequest {
  sessionId: string;
  message: string;
  userId: string;
}

/**
 * Public Chatbot Chat - Custom Instructions Engine
 * 
 * FIXED: Now properly loads custom_system_instructions from chatbot_settings table
 * Priority: Custom Instructions > Company Data > Fallback
 */
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    let openaiKey = Deno.env.get('OPENAI_API_KEY');

    // If not in env, try to get from vault
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!openaiKey) {
      console.log('[PublicChatbot] OpenAI key not in env, checking vault...');
      try {
        const { data: secretData } = await supabase
          .rpc('vault.decrypted_secrets')
          .select('decrypted_secret')
          .eq('name', 'OPENAI_API_KEY')
          .maybeSingle();

        if (secretData?.decrypted_secret) {
          openaiKey = secretData.decrypted_secret;
          console.log('[PublicChatbot] ✅ Found OpenAI key in vault');
        } else {
          console.log('[PublicChatbot] ⚠️ OpenAI key not found in vault either');
        }
      } catch (vaultError) {
        console.log('[PublicChatbot] ⚠️ Could not access vault:', vaultError);
      }
    } else {
      console.log('[PublicChatbot] ✅ Found OpenAI key in environment');
    }

    const { sessionId, message, userId }: ChatRequest = await req.json();

    if (!sessionId || !message || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: sessionId, message, userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[PublicChatbot] ===== NEW MESSAGE =====');
    console.log('[PublicChatbot] User:', userId, 'Session:', sessionId);
    console.log('[PublicChatbot] Message:', message);
    console.log('[PublicChatbot] OpenAI key configured:', !!openaiKey);

    // ========================================
    // STEP 1: LOAD ALL INTELLIGENCE
    // ========================================
    console.log('[PublicChatbot] STEP 1: Loading chatbot settings and intelligence...');

    // Load chatbot settings FIRST (contains custom instructions)
    const { data: settings } = await supabase
      .from('chatbot_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    const useCustomInstructions = settings?.use_custom_instructions || false;
    const overrideIntelligence = settings?.instructions_override_intelligence || false;
    const customInstructions = settings?.custom_system_instructions || '';

    console.log('[PublicChatbot] Chatbot Settings:', {
      useCustomInstructions,
      overrideIntelligence,
      hasCustomInstructions: !!customInstructions,
      customInstructionsLength: customInstructions?.length || 0,
      tone: settings?.tone,
      replyDepth: settings?.reply_depth
    });

    // Load Workspace Config (secondary intelligence layer)
    const { data: workspaceConfig } = await supabase
      .from('workspace_configs')
      .select('*')
      .eq('owner_id', userId)
      .maybeSingle();

    console.log('[PublicChatbot] Workspace Config loaded:', !!workspaceConfig);

    // Load company data
    const { data: company } = await supabase
      .from('company_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    console.log('[PublicChatbot] Company loaded:', company?.company_name || 'None');

    // Load company intelligence
    const { data: intelligence } = await supabase
      .from('company_intelligence_v2')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    console.log('[PublicChatbot] Company Intelligence loaded:', !!intelligence);

    // Load products with full details
    const { data: products } = await supabase
      .from('products')
      .select(`
        id, name, short_description, long_description, product_type,
        features, benefits, use_cases, target_audience, pricing_model,
        unique_selling_points, price, active
      `)
      .eq('user_id', userId)
      .eq('active', true)
      .limit(10);

    console.log('[PublicChatbot] Products loaded:', products?.length || 0);

    // Load training data
    const { data: training } = await supabase
      .from('public_chatbot_training_data')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .limit(20);

    console.log('[PublicChatbot] Training data loaded:', training?.length || 0);

    // Load conversation history
    const { data: chatMessages } = await supabase
      .from('public_chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(10);

    const conversationHistory = chatMessages || [];
    console.log('[PublicChatbot] Conversation history:', conversationHistory.length, 'messages');

    // ========================================
    // STEP 2: BUILD SYSTEM PROMPT
    // ========================================
    console.log('[PublicChatbot] STEP 2: Building System Prompt...');

    let systemPrompt = '';

    // Priority 1: Custom Instructions from Chatbot Settings (if enabled)
    if (useCustomInstructions && customInstructions) {
      console.log('[PublicChatbot] ✅ Using Custom Instructions from chatbot_settings');
      console.log('[PublicChatbot] Instructions length:', customInstructions.length);
      console.log('[PublicChatbot] Override intelligence:', overrideIntelligence);

      systemPrompt = customInstructions;

      // Add workspace config context if available AND not overriding
      if (workspaceConfig && !overrideIntelligence) {
        console.log('[PublicChatbot] Adding workspace context (not overriding)');
        systemPrompt += `\n\n========================================\n`;
        systemPrompt += `WORKSPACE CONTEXT\n`;
        systemPrompt += `========================================\n\n`;

        if (workspaceConfig.company_context) {
          systemPrompt += `Company Context:\n${JSON.stringify(workspaceConfig.company_context, null, 2)}\n\n`;
        }

        if (workspaceConfig.tone_settings) {
          systemPrompt += `Tone Settings:\n${JSON.stringify(workspaceConfig.tone_settings, null, 2)}\n\n`;
        }
      }
    }
    // Priority 2: Build from Company Data
    else if (company) {
      console.log('[PublicChatbot] Building from Company Data');
      systemPrompt = buildCompanyBasedPrompt(company, products || [], intelligence, settings);
    }
    // Fallback
    else {
      console.log('[PublicChatbot] ⚠️ Using fallback prompt (no custom instructions or company data)');
      systemPrompt = `You are a friendly AI sales assistant. Be helpful, professional, and guide visitors toward learning more or booking a consultation.`;
    }

    // Add company context if NOT overriding
    if (!overrideIntelligence && company) {
      systemPrompt += `\n\n========================================\n`;
      systemPrompt += `COMPANY INFORMATION\n`;
      systemPrompt += `========================================\n\n`;
      systemPrompt += `Company: ${company.company_name}\n`;
      if (company.tagline) systemPrompt += `Tagline: ${company.tagline}\n`;
      if (company.industry) systemPrompt += `Industry: ${company.industry}\n`;
      if (company.target_audience) systemPrompt += `Target Audience: ${company.target_audience}\n`;

      // Add products
      if (products && products.length > 0) {
        systemPrompt += `\nProducts & Services:\n`;
        products.forEach((p: any, i: number) => {
          systemPrompt += `\n${i + 1}. ${p.name}\n`;
          systemPrompt += `   ${p.short_description || p.long_description || ''}\n`;
          if (p.price) systemPrompt += `   Price: ₱${p.price}\n`;
          if (p.benefits) {
            const benefits = Array.isArray(p.benefits) ? p.benefits : [p.benefits];
            systemPrompt += `   Benefits: ${benefits.slice(0, 3).join(', ')}\n`;
          }
        });
      }

      // Add company intelligence insights
      if (intelligence) {
        systemPrompt += `\nCompany Intelligence:\n`;
        if (intelligence.value_proposition) {
          systemPrompt += `Value Proposition: ${intelligence.value_proposition}\n`;
        }
        if (intelligence.elevator_pitch) {
          systemPrompt += `Elevator Pitch: ${intelligence.elevator_pitch}\n`;
        }
      }
    }

    // Add behavioral guidelines
    if (!overrideIntelligence) {
      systemPrompt += `\n\n========================================\n`;
      systemPrompt += `BEHAVIORAL GUIDELINES\n`;
      systemPrompt += `========================================\n\n`;
      systemPrompt += `- Keep responses concise (2-4 paragraphs max)\n`;
      systemPrompt += `- Be ${settings?.tone || 'professional'} and helpful\n`;
      systemPrompt += `- Guide toward booking a call or demo\n`;
      systemPrompt += `- Ask qualifying questions to understand needs\n`;
      systemPrompt += `- Never share made-up information\n`;
      systemPrompt += `- Use ${settings?.tone === 'taglish' ? 'Taglish (mix of English and Filipino)' : 'clear, professional language'}\n`;
    }

    console.log('[PublicChatbot] System prompt built. Length:', systemPrompt.length);
    console.log('[PublicChatbot] First 200 chars:', systemPrompt.substring(0, 200));

    // ========================================
    // STEP 3: BUILD CONVERSATION FOR AI
    // ========================================
    console.log('[PublicChatbot] STEP 3: Building conversation...');

    const messages: any[] = [
      { role: 'system', content: systemPrompt }
    ];

    // Add conversation history
    conversationHistory.forEach((msg: any) => {
      messages.push({
        role: msg.sender === 'visitor' ? 'user' : 'assistant',
        content: msg.message
      });
    });

    // Add current message
    messages.push({ role: 'user', content: message });

    console.log('[PublicChatbot] Total messages for AI:', messages.length);

    // ========================================
    // STEP 4: CALL OPENAI API
    // ========================================
    console.log('[PublicChatbot] STEP 4: Calling OpenAI API...');

    let aiResponse = '';

    if (openaiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages,
            temperature: 0.7,
            max_tokens: 800,
          }),
        });

        if (!response.ok) {
          const errorData = await response.text();
          console.error('[PublicChatbot] OpenAI API error:', response.status, errorData);
          throw new Error(`OpenAI API error: ${response.statusText}`);
        }

        const data = await response.json();
        aiResponse = data.choices[0]?.message?.content || 'I apologize, but I encountered an error. Please try again.';

        console.log('[PublicChatbot] ✅ AI response generated');
        console.log('[PublicChatbot] Response length:', aiResponse.length);
        console.log('[PublicChatbot] First 100 chars:', aiResponse.substring(0, 100));
      } catch (error) {
        console.error('[PublicChatbot] OpenAI error:', error);
        aiResponse = generateFallbackResponse(message, customInstructions, company, products || []);
      }
    } else {
      console.warn('[PublicChatbot] ⚠️ No OpenAI key - using fallback');
      aiResponse = generateFallbackResponse(message, customInstructions, company, products || []);
    }

    // ========================================
    // STEP 5: SAVE MESSAGES
    // ========================================
    console.log('[PublicChatbot] STEP 5: Saving messages...');

    // Save visitor message
    await supabase.from('public_chat_messages').insert({
      session_id: sessionId,
      sender: 'visitor',
      message: message,
    });

    // Save AI response
    await supabase.from('public_chat_messages').insert({
      session_id: sessionId,
      sender: 'ai',
      message: aiResponse,
    });

    // Extract contact info from full conversation
    const fullConversation = [
      ...conversationHistory,
      { sender: 'visitor', message: message },
      { sender: 'ai', message: aiResponse },
    ];

    const contactInfo = extractContactInfo(fullConversation);
    const qualificationScore = calculateQualificationScore(fullConversation);
    const buyingIntent = calculateBuyingIntent(fullConversation);
    const emotionalState = detectEmotionalState(fullConversation);

    console.log('[PublicChatbot] Contact Info:', contactInfo);
    console.log('[PublicChatbot] Qualification Score:', qualificationScore);

    // Update session with contact info and analysis
    const sessionUpdate: any = {
      last_message_at: new Date().toISOString(),
      message_count: fullConversation.length,
      qualification_score: qualificationScore / 100,
      buying_intent_score: buyingIntent,
      emotional_state: emotionalState,
    };

    if (contactInfo.name) sessionUpdate.visitor_name = contactInfo.name;
    if (contactInfo.email) sessionUpdate.visitor_email = contactInfo.email;
    if (contactInfo.phone) sessionUpdate.visitor_phone = contactInfo.phone;
    if (contactInfo.company) sessionUpdate.visitor_company = contactInfo.company;

    await supabase
      .from('public_chat_sessions')
      .update(sessionUpdate)
      .eq('id', sessionId);

    console.log('[PublicChatbot] Messages and session updated successfully');

    // ========================================
    // STEP 6: CHECK PROSPECT CREATION
    // ========================================
    console.log('[PublicChatbot] STEP 6: Checking prospect qualification...');

    // Load chatbot settings to get auto_qualify_threshold
    const autoQualifyThreshold = settings?.auto_qualify_threshold || 0.7;
    const autoConvertEnabled = settings?.auto_convert_to_prospect !== false;

    console.log('[PublicChatbot] Auto-qualify threshold:', autoQualifyThreshold * 100, '%');
    console.log('[PublicChatbot] Auto-convert enabled:', autoConvertEnabled);
    console.log('[PublicChatbot] Current score:', qualificationScore, '%');

    if (autoConvertEnabled && qualificationScore >= (autoQualifyThreshold * 100)) {
      console.log('[PublicChatbot] Score meets threshold, creating prospect...');
      checkAndCreateProspect(supabase, userId, sessionId, conversationHistory, message, aiResponse).catch(error => {
        console.error('[PublicChatbot] Prospect creation error:', error);
      });
    } else {
      console.log('[PublicChatbot] Score below threshold or auto-convert disabled, skipping prospect creation');
    }

    console.log('[PublicChatbot] ===== REQUEST COMPLETE =====\n');

    return new Response(
      JSON.stringify({
        success: true,
        response: aiResponse,
        usingOpenAI: !!openaiKey,
        usingCustomInstructions: useCustomInstructions && !!customInstructions,
        customInstructionsLength: customInstructions?.length || 0,
        usingWorkspaceConfig: !!workspaceConfig,
        overridingIntelligence: overrideIntelligence,
        systemPromptLength: systemPrompt.length,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[PublicChatbot] ❌ FATAL ERROR:', error);
    console.error('[PublicChatbot] Error stack:', error.stack);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildCompanyBasedPrompt(
  company: any,
  products: any[],
  intelligence: any | null,
  settings: any | null
): string {
  const companyName = company.company_name || 'our company';
  const tone = settings?.tone || 'professional';

  let prompt = `You are an AI sales assistant for ${companyName}.\n\n`;

  if (intelligence?.elevator_pitch) {
    prompt += `About us: ${intelligence.elevator_pitch}\n\n`;
  } else if (company.long_description) {
    prompt += `About us: ${company.long_description}\n\n`;
  } else if (company.short_description) {
    prompt += `About us: ${company.short_description}\n\n`;
  }

  if (company.industry) {
    prompt += `Industry: ${company.industry}\n`;
  }
  if (company.target_audience) {
    prompt += `Target Audience: ${company.target_audience}\n`;
  }

  prompt += `\nYour role is to help prospects, answer questions, and guide them through our offerings.\n`;
  prompt += `Be ${tone}, helpful, and responsive.\n`;

  return prompt;
}

function generateFallbackResponse(
  userMessage: string,
  customInstructions: string,
  company: any,
  products: any[]
): string {
  console.log('[Fallback] Generating fallback response');
  console.log('[Fallback] Has custom instructions:', !!customInstructions);
  console.log('[Fallback] Custom instructions length:', customInstructions?.length || 0);

  // If custom instructions exist, try to generate a contextual response
  if (customInstructions && customInstructions.length > 100) {
    console.log('[Fallback] Using custom instructions for fallback');

    // Extract key phrases from custom instructions for pattern matching
    const lower = userMessage.toLowerCase();
    const companyName = company?.company_name || 'our company';

    // Try to match intent from custom instructions
    if (lower.includes('product') || lower.includes('sell') || lower.includes('offer')) {
      if (products.length > 0) {
        let response = `Great question! `;
        if (products.length === 1) {
          response += `We offer ${products[0].name}`;
          if (products[0].short_description) {
            response += ` - ${products[0].short_description}`;
          }
          response += `. `;
        } else {
          response += `We offer ${products.length} solutions:\n\n`;
          products.slice(0, 3).forEach((p: any, i: number) => {
            response += `${i + 1}. ${p.name}`;
            if (p.short_description) response += ` - ${p.short_description}`;
            response += `\n`;
          });
        }
        response += `\nWhich one interests you most?`;
        return response;
      }
    }

    if (lower.includes('price') || lower.includes('cost') || lower.includes('magkano')) {
      if (products.length > 0 && products[0].price) {
        return `Our ${products[0].name} is priced at ₱${products[0].price}. This includes great value and benefits! Would you like to know more about what's included?`;
      }
      return `I'd be happy to discuss pricing with you! Our offerings are designed to provide exceptional value. What specific solution are you interested in?`;
    }

    // General contextual response using company info
    return `Thanks for reaching out to ${companyName}! I'm here to help you with any questions about our offerings. What would you like to know more about?`;
  }

  // Standard fallback when no custom instructions
  const lower = userMessage.toLowerCase();
  const companyName = company?.company_name || 'our company';

  if (lower.includes('price') || lower.includes('cost') || lower.includes('magkano')) {
    return `Thanks for asking about pricing! I'd love to provide you with detailed information about ${companyName}. Could you tell me which product or service you're most interested in?`;
  }

  if (lower.includes('product') || lower.includes('service')) {
    if (products.length > 0) {
      let response = `Great question! We offer ${products.length} solution${products.length > 1 ? 's' : ''}:\n\n`;
      products.slice(0, 3).forEach((p: any, i: number) => {
        response += `${i + 1}. ${p.name} - ${p.short_description || 'Perfect for you!'}\n`;
      });
      response += `\nWhich one interests you most?`;
      return response;
    }
    return `We offer comprehensive solutions tailored to your needs. What specific challenge are you looking to solve?`;
  }

  if (lower.includes('demo') || lower.includes('call') || lower.includes('meeting')) {
    return `I'd be happy to set up a demo or call with you! That's the best way to see how ${companyName} can help. What day and time works best for you this week?`;
  }

  return `Thanks for reaching out to ${companyName}! I'm here to help you learn more about what we offer. What would you like to know?`;
}

async function checkAndCreateProspect(
  supabase: any,
  userId: string,
  sessionId: string,
  conversationHistory: any[],
  lastUserMessage: string,
  lastAiMessage: string
): Promise<void> {
  try {
    const fullConversation = [
      ...conversationHistory,
      { sender: 'visitor', message: lastUserMessage },
      { sender: 'ai', message: lastAiMessage },
    ];

    const contactInfo = extractContactInfo(fullConversation);

    if (!contactInfo.email && !contactInfo.phone) {
      console.log('[Prospect Creation] No contact info found');
      return;
    }

    const qualificationScore = calculateQualificationScore(fullConversation);

    if (qualificationScore < 50) {
      console.log('[Prospect Creation] Score too low:', qualificationScore);
      return;
    }

    console.log('[Prospect Creation] Qualified! Score:', qualificationScore);

    const { data: existingProspect } = await supabase
      .from('prospects')
      .select('id')
      .eq('user_id', userId)
      .or(`email.eq.${contactInfo.email},phone.eq.${contactInfo.phone}`)
      .maybeSingle();

    if (existingProspect) {
      console.log('[Prospect Creation] Updating existing prospect');
      await supabase
        .from('prospects')
        .update({
          last_seen_activity_at: new Date().toISOString(),
          metadata: {
            last_chat_session: sessionId,
            qualification_score: qualificationScore,
          },
        })
        .eq('id', existingProspect.id);

      await supabase
        .from('public_chat_sessions')
        .update({ prospect_id: existingProspect.id })
        .eq('id', sessionId);

      return;
    }

    const { data: newProspect } = await supabase
      .from('prospects')
      .insert({
        user_id: userId,
        full_name: contactInfo.name || 'Chat Visitor',
        email: contactInfo.email || null,
        phone: contactInfo.phone || null,
        company: contactInfo.company || null,
        platform: 'web_chat',
        source: 'public_chatbot',
        scout_score: qualificationScore,
        pipeline_stage: qualificationScore >= 70 ? 'qualified' : 'contacted',
        is_unlocked: true,
        unlocked_at: new Date().toISOString(),
        metadata: {
          chat_session_id: sessionId,
          created_from: 'chatbot',
          conversation_length: fullConversation.length,
        },
      })
      .select()
      .single();

    if (newProspect) {
      console.log('[Prospect Creation] Created:', newProspect.id);

      await supabase
        .from('public_chat_sessions')
        .update({ prospect_id: newProspect.id })
        .eq('id', sessionId);

      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'new_prospect',
        title: 'New Lead from Website Chat',
        message: `${contactInfo.name || 'A visitor'} just qualified as a lead through your chatbot`,
        data: {
          prospect_id: newProspect.id,
          source: 'chatbot',
        },
        read: false,
      });
    }
  } catch (error) {
    console.error('[Prospect Creation] Error:', error);
  }
}

function extractContactInfo(messages: any[]): any {
  const contactInfo: any = {};
  const visitorText = messages
    .filter(m => m.sender === 'visitor')
    .map(m => m.message)
    .join(' ');

  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  const emailMatch = visitorText.match(emailPattern);
  if (emailMatch) contactInfo.email = emailMatch[0];

  const phonePattern = /(\+?63|0)?[-.\s]?9\d{2}[-.\s]?\d{3}[-.\s]?\d{4}|\+?\d{10,15}/;
  const phoneMatch = visitorText.match(phonePattern);
  if (phoneMatch) contactInfo.phone = phoneMatch[0].replace(/[-.\s]/g, '');

  const namePattern = /(?:I'm|I am|My name is|This is|Call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i;
  const nameMatch = visitorText.match(namePattern);
  if (nameMatch) contactInfo.name = nameMatch[1].trim();

  const companyPattern = /(?:from|work at|company is|represent)\s+([A-Z][A-Za-z0-9\s&,.-]+)/i;
  const companyMatch = visitorText.match(companyPattern);
  if (companyMatch) contactInfo.company = companyMatch[1].trim();

  return contactInfo;
}

function calculateQualificationScore(messages: any[]): number {
  let score = 0;
  const visitorMessages = messages.filter(m => m.sender === 'visitor');
  const conversationText = visitorMessages.map(m => m.message.toLowerCase()).join(' ');

  if (visitorMessages.length >= 5) score += 20;
  else if (visitorMessages.length >= 3) score += 10;

  if (conversationText.includes('price') || conversationText.includes('cost') || conversationText.includes('magkano')) score += 15;
  if (conversationText.includes('demo') || conversationText.includes('presentation')) score += 20;
  if (conversationText.includes('buy') || conversationText.includes('purchase') || conversationText.includes('bili')) score += 25;
  if (conversationText.includes('interested') || conversationText.includes('want') || conversationText.includes('gusto')) score += 10;
  if (conversationText.includes('schedule') || conversationText.includes('meeting')) score += 20;

  if (conversationText.length > 300) score += 10;
  if (conversationText.includes('?')) score += 5;

  return Math.min(score, 100);
}

function calculateBuyingIntent(messages: any[]): number {
  const visitorMessages = messages.filter(m => m.sender === 'visitor');
  const text = visitorMessages.map(m => m.message.toLowerCase()).join(' ');

  let intent = 0;

  // High intent signals
  if (text.includes('buy') || text.includes('purchase') || text.includes('order')) intent += 30;
  if (text.includes('price') || text.includes('cost') || text.includes('magkano')) intent += 20;
  if (text.includes('when') || text.includes('how soon') || text.includes('kailan')) intent += 15;
  if (text.includes('demo') || text.includes('trial')) intent += 20;

  // Medium intent signals
  if (text.includes('interested') || text.includes('gusto')) intent += 10;
  if (text.includes('tell me more') || text.includes('learn')) intent += 5;

  return Math.min(intent, 100) / 100;
}

function detectEmotionalState(messages: any[]): string {
  const visitorMessages = messages.filter(m => m.sender === 'visitor');
  const text = visitorMessages.map(m => m.message).join(' ').toLowerCase();

  // Positive emotions
  if (text.match(/great|awesome|perfect|excellent|love|amazing|thank you|salamat/i)) {
    return 'Excited';
  }

  // Curious
  if (text.match(/how|what|when|where|why|tell me|paano|ano|kailan/i)) {
    return 'Curious';
  }

  // Concerned/Skeptical
  if (text.match(/but|however|worried|concern|problem|issue|problema/i)) {
    return 'Concerned';
  }

  // Interested
  if (text.match(/interested|want|need|looking for|gusto|kailangan/i)) {
    return 'Interested';
  }

  return 'Neutral';
}
