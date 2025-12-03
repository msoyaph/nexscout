import { supabase } from '../../lib/supabase';

export async function autoSetupChatbot(userId: string): Promise<{ success: boolean; chatbotId?: string }> {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    const { data: company } = await supabase
      .from('company_profiles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const defaultSystemPrompt = `You are a friendly AI sales assistant for ${company?.company_name || 'our company'}.
Your goal is to help customers learn about our products and services in a warm, conversational way.

Key Guidelines:
- Be friendly and professional
- Ask qualifying questions to understand their needs
- Highlight product benefits relevant to their situation
- Build rapport before trying to close
- Use Filipino/English (Taglish) when appropriate
- Always capture lead information (name, contact) before ending conversation

Company Info:
${company?.company_description || 'We offer quality products and services to help our customers succeed.'}

Industry: ${company?.industry || profile?.industry || 'General'}`;

    const chatSlug = `chat-${userId.substring(0, 8)}-${Date.now()}`;

    const { data: chatbot, error } = await supabase
      .from('public_chatbots')
      .insert({
        user_id: userId,
        company_id: company?.id || null,
        chatbot_name: `${company?.company_name || 'My'} AI Assistant`,
        system_prompt: defaultSystemPrompt,
        welcome_message: `Hi! I'm your AI assistant. How can I help you today?`,
        chat_slug: chatSlug,
        is_active: true,
        conversation_starters: [
          "Tell me about your products",
          "How does this work?",
          "What are the benefits?",
          "How much does it cost?"
        ]
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, chatbotId: chatbot.id };
  } catch (error) {
    console.error('Error auto-setting up chatbot:', error);
    return { success: false };
  }
}

export async function autoSetupPipeline(userId: string): Promise<{ success: boolean }> {
  try {
    const defaultStages = [
      { name: 'New Lead', order: 1, color: '#3B82F6' },
      { name: 'Contacted', order: 2, color: '#8B5CF6' },
      { name: 'Qualified', order: 3, color: '#10B981' },
      { name: 'Proposal Sent', order: 4, color: '#F59E0B' },
      { name: 'Negotiating', order: 5, color: '#EF4444' },
      { name: 'Closed Won', order: 6, color: '#059669' },
      { name: 'Closed Lost', order: 7, color: '#6B7280' }
    ];

    for (const stage of defaultStages) {
      await supabase
        .from('pipeline_stages')
        .upsert({
          user_id: userId,
          stage_name: stage.name,
          stage_order: stage.order,
          stage_color: stage.color
        }, {
          onConflict: 'user_id,stage_name'
        });
    }

    return { success: true };
  } catch (error) {
    console.error('Error auto-setting up pipeline:', error);
    return { success: false };
  }
}

export async function autoGenerateMissions(userId: string): Promise<{ success: boolean }> {
  try {
    const onboardingMissions = [
      {
        title: 'Add Your First Product',
        description: 'Tell us about what you sell so we can help you sell better',
        mission_type: 'onboarding',
        xp_reward: 100,
        coin_reward: 50,
        action_required: 'add_product',
        is_active: true
      },
      {
        title: 'Test Your AI Chatbot',
        description: 'Have a conversation with your AI assistant',
        mission_type: 'onboarding',
        xp_reward: 150,
        coin_reward: 75,
        action_required: 'test_chatbot',
        is_active: true
      },
      {
        title: 'Capture Your First Lead',
        description: 'Get your first lead through the chatbot or manual entry',
        mission_type: 'onboarding',
        xp_reward: 200,
        coin_reward: 100,
        action_required: 'capture_lead',
        is_active: true
      },
      {
        title: 'Send Your First Follow-up',
        description: 'Reach out to a prospect with a follow-up message',
        mission_type: 'onboarding',
        xp_reward: 200,
        coin_reward: 100,
        action_required: 'send_followup',
        is_active: true
      },
      {
        title: 'Book Your First Appointment',
        description: 'Schedule a meeting or call with a prospect',
        mission_type: 'onboarding',
        xp_reward: 300,
        coin_reward: 150,
        action_required: 'book_appointment',
        is_active: true
      }
    ];

    for (const mission of onboardingMissions) {
      await supabase
        .from('missions')
        .insert({
          user_id: userId,
          ...mission
        })
        .catch(() => {});
    }

    return { success: true };
  } catch (error) {
    console.error('Error auto-generating missions:', error);
    return { success: false };
  }
}
