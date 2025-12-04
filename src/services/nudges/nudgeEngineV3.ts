import { supabase } from '../../lib/supabase';

interface NudgeConfig {
  message: string;
  action: string;
  actionUrl: string;
  actionLabel: string;
}

const ONBOARDING_NUDGES: Record<string, NudgeConfig> = {
  industry_selected: {
    message: "Nice! Now add your product to prepare your AI chatbot.",
    action: "add_product",
    actionUrl: "/products/add",
    actionLabel: "Add Product"
  },
  product_added: {
    message: "Great! Let's set up your AI chatbot next.",
    action: "setup_chatbot",
    actionUrl: "/chatbot/setup",
    actionLabel: "Setup Chatbot"
  },
  company_added: {
    message: "Awesome! Your AI now knows your brand—deploy your chatbot.",
    action: "deploy_chatbot",
    actionUrl: "/chatbot",
    actionLabel: "View Chatbot"
  },
  chatbot_setup: {
    message: "Try talking to your bot! This is your first sales win.",
    action: "test_chatbot",
    actionUrl: "/public-chat",
    actionLabel: "Test Chatbot"
  },
  pipeline_setup: {
    message: "Your sales pipeline is ready! Add your first prospect.",
    action: "add_prospect",
    actionUrl: "/prospects",
    actionLabel: "Add Prospect"
  },
  first_lead_captured: {
    message: "You got a lead! Want me to follow up automatically?",
    action: "auto_followup",
    actionUrl: "/prospects",
    actionLabel: "View Lead"
  },
  first_followup_sent: {
    message: "Follow-up sent! Let's book them on your calendar next.",
    action: "book_appointment",
    actionUrl: "/calendar",
    actionLabel: "Open Calendar"
  },
  wizard_completed: {
    message: "Your AI Sales System is ready! Check out your first 5 wins.",
    action: "view_quick_wins",
    actionUrl: "/missions",
    actionLabel: "View Missions"
  }
};

export const sendOnboardingNudge = async (
  userId: string,
  step: string,
  payload: any = {}
): Promise<void> => {
  const nudge = ONBOARDING_NUDGES[step];

  if (!nudge) {
    console.warn(`No nudge configured for step: ${step}`);
    return;
  }

  try {
    await supabase.from('onboarding_nudges').insert({
      user_id: userId,
      message: nudge.message,
      nudge_type: step,
      action_url: nudge.actionUrl,
      action_label: nudge.actionLabel,
      seen: false,
      dismissed: false,
      acted: false
    });
  } catch (error) {
    console.error('Error sending onboarding nudge:', error);
  }
};

export const getActiveNudges = async (userId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('onboarding_nudges')
      .select('*')
      .eq('user_id', userId)
      .eq('dismissed', false)
      .order('created_at', { ascending: false })
      .limit(3);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error getting active nudges:', error);
    return [];
  }
};

export const markNudgeSeen = async (nudgeId: string): Promise<void> => {
  try {
    await supabase
      .from('onboarding_nudges')
      .update({ seen: true })
      .eq('id', nudgeId);
  } catch (error) {
    console.error('Error marking nudge as seen:', error);
  }
};

export const dismissNudge = async (nudgeId: string): Promise<void> => {
  try {
    await supabase
      .from('onboarding_nudges')
      .update({ dismissed: true })
      .eq('id', nudgeId);
  } catch (error) {
    console.error('Error dismissing nudge:', error);
  }
};

export const markNudgeActed = async (nudgeId: string): Promise<void> => {
  try {
    await supabase
      .from('onboarding_nudges')
      .update({ acted: true, dismissed: true })
      .eq('id', nudgeId);
  } catch (error) {
    console.error('Error marking nudge as acted:', error);
  }
};

export const createInAppNotification = async (
  userId: string,
  message: string,
  type: string = 'onboarding'
): Promise<void> => {
  try {
    await supabase.from('onboarding_nudges').insert({
      user_id: userId,
      message,
      nudge_type: type,
      action_url: null,
      action_label: null,
      seen: false,
      dismissed: false
    });
  } catch (error) {
    console.error('Error creating in-app notification:', error);
  }
};
