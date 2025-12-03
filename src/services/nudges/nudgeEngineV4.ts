import { supabase } from '../../lib/supabase';
import { OnboardingPersona } from '../onboarding/onboardingPersonaEngine';

interface NudgeContext {
  eventType: string;
  nextStep?: string | null;
  payload?: any;
}

interface NudgeMessage {
  message: string;
  action?: string;
  actionUrl?: string;
  actionLabel?: string;
  tone?: 'encouraging' | 'urgent' | 'celebratory' | 'informative';
}

export async function sendOnboardingNudgeV4(
  userId: string,
  ctx: NudgeContext
): Promise<void> {
  try {
    const { data: personalization } = await supabase
      .from('onboarding_personalization')
      .select('persona, chosen_variant')
      .eq('user_id', userId)
      .maybeSingle();

    const persona: OnboardingPersona =
      (personalization?.persona as OnboardingPersona) || 'power_user_unknown';
    const variant = personalization?.chosen_variant || 'fast_track_90s';

    const nudge = pickAdaptiveNudge(persona, variant, ctx);

    if (!nudge) return;

    await supabase.from('onboarding_nudges').insert({
      user_id: userId,
      message: nudge.message,
      nudge_type: ctx.eventType,
      action_url: nudge.actionUrl || null,
      action_label: nudge.actionLabel || null,
      seen: false,
      dismissed: false,
      created_at: new Date().toISOString()
    });

    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'onboarding_nudge',
      title: getTitleForEvent(ctx.eventType),
      body: nudge.message,
      action_url: nudge.actionUrl || null,
      is_read: false,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error sending adaptive nudge:', error);
  }
}

function pickAdaptiveNudge(
  persona: OnboardingPersona,
  variant: string,
  ctx: NudgeContext
): NudgeMessage | null {
  const personaNudges = getPersonaNudges(persona);
  const nudge = personaNudges[ctx.eventType];

  if (!nudge) {
    return getDefaultNudge(ctx);
  }

  if (ctx.nextStep) {
    nudge.message = `${nudge.message} ${getNextStepPrompt(ctx.nextStep)}`;
  }

  return nudge;
}

function getPersonaNudges(
  persona: OnboardingPersona
): Record<string, NudgeMessage> {
  const nudgeLibrary: Record<OnboardingPersona, Record<string, NudgeMessage>> =
    {
      mlm_newbie: {
        onboarding_init: {
          message:
            "Welcome! Let's get your AI sales assistant live in 90 seconds. No tech skills needed.",
          tone: 'encouraging',
          actionUrl: '/onboarding/adaptive',
          actionLabel: "Let's Start"
        },
        industry_selected: {
          message:
            'Perfect! Now tell us about your main product so your AI can start selling for you.',
          tone: 'encouraging',
          actionUrl: '/onboarding/adaptive',
          actionLabel: 'Add Product'
        },
        product_added: {
          message:
            "Amazing! Your AI now knows what you're selling. Let's get your chatbot live.",
          tone: 'celebratory',
          actionUrl: '/chatbot',
          actionLabel: 'Launch Chatbot'
        },
        chatbot_setup: {
          message:
            "Your AI is ready! Try having a conversation with it. This is your first sales win—see how easy it is.",
          tone: 'celebratory',
          actionUrl: '/public-chat',
          actionLabel: 'Test Chatbot'
        },
        first_lead_captured: {
          message:
            'You got your first lead! Want me to automatically follow up for you? I can handle the scary part.',
          tone: 'celebratory',
          actionUrl: '/prospects',
          actionLabel: 'View Lead'
        },
        first_followup_sent: {
          message:
            "Perfect! Follow-up sent. Now let's book them on your calendar automatically.",
          tone: 'encouraging',
          actionUrl: '/calendar',
          actionLabel: 'Open Calendar'
        }
      },
      mlm_leader: {
        onboarding_init: {
          message:
            "Welcome, leader! Let's set up your team's AI-powered recruiting funnel.",
          tone: 'informative',
          actionUrl: '/onboarding/adaptive',
          actionLabel: 'Start Setup'
        },
        industry_selected: {
          message:
            'Great. First, set up your sales pipeline to track your team and prospects.',
          tone: 'informative',
          actionUrl: '/onboarding/adaptive',
          actionLabel: 'Configure Pipeline'
        },
        pipeline_setup: {
          message:
            'Pipeline ready. Now add your main products so your team can use AI to sell.',
          tone: 'informative',
          actionUrl: '/products/add',
          actionLabel: 'Add Products'
        },
        product_added: {
          message:
            'Good. Deploy your AI chatbot so your downline can share it with prospects.',
          tone: 'informative',
          actionUrl: '/chatbot',
          actionLabel: 'Deploy Chatbot'
        },
        chatbot_setup: {
          message:
            "Your recruiting funnel is live! Share this with your team. They'll love the automation.",
          tone: 'celebratory',
          actionUrl: '/chatbot',
          actionLabel: 'View Chatbot'
        }
      },
      insurance_agent: {
        onboarding_init: {
          message:
            "Let's get your AI policy assistant live. It'll pre-qualify leads while you focus on closings.",
          tone: 'informative',
          actionUrl: '/onboarding/adaptive',
          actionLabel: 'Get Started'
        },
        product_added: {
          message:
            'Great! Now connect your chatbot to Messenger so leads can ask about coverage 24/7.',
          tone: 'encouraging',
          actionUrl: '/chatbot',
          actionLabel: 'Setup Chatbot'
        },
        chatbot_setup: {
          message:
            'Your AI policy advisor is ready! Test it with a common question like "How much is life insurance?"',
          tone: 'encouraging',
          actionUrl: '/public-chat',
          actionLabel: 'Test Now'
        },
        first_lead_captured: {
          message:
            "You got an inquiry! Your AI already pre-qualified them. Here's what they need.",
          tone: 'celebratory',
          actionUrl: '/prospects',
          actionLabel: 'View Lead'
        }
      },
      real_estate_agent: {
        onboarding_init: {
          message:
            "Let's automate your property inquiries. Your AI will qualify buyers/sellers 24/7.",
          tone: 'informative',
          actionUrl: '/onboarding/adaptive',
          actionLabel: 'Start'
        },
        product_added: {
          message:
            'Perfect! Now launch your AI assistant so it can answer property questions instantly.',
          tone: 'encouraging',
          actionUrl: '/chatbot',
          actionLabel: 'Launch Assistant'
        },
        chatbot_setup: {
          message:
            'Your property assistant is live! Try asking it "What properties do you have under $500K?"',
          tone: 'encouraging',
          actionUrl: '/public-chat',
          actionLabel: 'Test It'
        },
        first_lead_captured: {
          message:
            "New property inquiry! Your AI gathered their budget, timeline, and preferences. Here's the summary.",
          tone: 'celebratory',
          actionUrl: '/prospects',
          actionLabel: 'View Inquiry'
        }
      },
      online_seller: {
        onboarding_init: {
          message:
            "Let's set up your AI product recommender. It'll upsell and cross-sell automatically.",
          tone: 'informative',
          actionUrl: '/onboarding/adaptive',
          actionLabel: 'Get Started'
        },
        product_added: {
          message:
            "Great! Upload 3-5 more best-sellers so your AI can create smart bundles and recommendations.",
          tone: 'encouraging',
          actionUrl: '/products',
          actionLabel: 'Add More Products'
        },
        chatbot_setup: {
          message:
            'Your AI product advisor is ready! Customers can now ask "What do you recommend for..." and get instant answers.',
          tone: 'celebratory',
          actionUrl: '/public-chat',
          actionLabel: 'Try It Out'
        },
        first_lead_captured: {
          message:
            'First customer inquiry! Your AI recommended 3 products. Want to send them a bundle deal?',
          tone: 'celebratory',
          actionUrl: '/prospects',
          actionLabel: 'View & Upsell'
        }
      },
      service_provider: {
        onboarding_init: {
          message:
            "Let's automate your consultation booking. Your AI will qualify clients and schedule calls.",
          tone: 'informative',
          actionUrl: '/onboarding/adaptive',
          actionLabel: 'Start'
        },
        product_added: {
          message:
            'Perfect! Now set up your AI assistant to handle service inquiries and booking.',
          tone: 'encouraging',
          actionUrl: '/chatbot',
          actionLabel: 'Setup Assistant'
        },
        chatbot_setup: {
          message:
            'Your booking assistant is live! Try asking it "How much does a consultation cost?"',
          tone: 'encouraging',
          actionUrl: '/public-chat',
          actionLabel: 'Test It'
        },
        first_lead_captured: {
          message:
            'New consultation request! Your AI already qualified them and gathered their needs. Book them now?',
          tone: 'celebratory',
          actionUrl: '/prospects',
          actionLabel: 'View & Book'
        }
      },
      power_user_unknown: {
        onboarding_init: {
          message:
            "Let's get your AI sales system live in under 90 seconds. Ready?",
          tone: 'encouraging',
          actionUrl: '/onboarding/adaptive',
          actionLabel: 'Start'
        },
        product_added: {
          message: 'Great! Now launch your AI chatbot to start capturing leads.',
          tone: 'encouraging',
          actionUrl: '/chatbot',
          actionLabel: 'Launch Chatbot'
        },
        chatbot_setup: {
          message:
            'Your AI is ready! Test it out to see how it handles conversations.',
          tone: 'encouraging',
          actionUrl: '/public-chat',
          actionLabel: 'Test Chatbot'
        },
        first_lead_captured: {
          message:
            'You got a lead! Your AI gathered their info. Want to send an automatic follow-up?',
          tone: 'celebratory',
          actionUrl: '/prospects',
          actionLabel: 'View Lead'
        }
      }
    };

  return nudgeLibrary[persona] || nudgeLibrary.power_user_unknown;
}

function getDefaultNudge(ctx: NudgeContext): NudgeMessage | null {
  const defaultNudges: Record<string, NudgeMessage> = {
    signup_complete: {
      message:
        'Welcome to NexScout! Your AI sales system is almost ready. Add your product to get started.',
      tone: 'encouraging',
      actionUrl: '/onboarding/adaptive',
      actionLabel: 'Get Started'
    },
    wizard_completed: {
      message:
        "You're all set! Your AI sales system is live. Start adding prospects or test your chatbot.",
      tone: 'celebratory',
      actionUrl: '/prospects',
      actionLabel: 'Add Prospect'
    }
  };

  return defaultNudges[ctx.eventType] || null;
}

function getNextStepPrompt(nextStepId: string): string {
  const prompts: Record<string, string> = {
    product_added: 'Add your product now to continue.',
    chatbot_setup: 'Launch your chatbot next.',
    pipeline_setup: 'Set up your pipeline to organize leads.',
    first_lead_captured: 'Capture your first lead to see AI in action.',
    first_scan_started: 'Scan your contacts to find hot prospects.',
    enable_daily_missions: 'Start daily missions to build the habit.'
  };

  return prompts[nextStepId] || 'Take the next step to unlock more.';
}

function getTitleForEvent(eventType: string): string {
  const titles: Record<string, string> = {
    onboarding_init: 'Welcome to NexScout!',
    industry_selected: 'Nice Choice!',
    product_added: 'Product Added!',
    company_added: 'Company Profile Ready!',
    chatbot_setup: 'Chatbot Deployed!',
    pipeline_setup: 'Pipeline Configured!',
    first_lead_captured: 'First Lead Captured!',
    first_followup_sent: 'Follow-up Sent!',
    wizard_completed: "You're Ready to Sell!",
    default: 'Next Step with NexScout'
  };

  return titles[eventType] || titles.default;
}

function humanizeStep(stepId: string): string {
  const map: Record<string, string> = {
    product_added: 'Add your product',
    company_added: 'Add company info',
    chatbot_setup: 'Launch your AI chatbot',
    pipeline_setup: 'Set up sales pipeline',
    first_lead_captured: 'Capture your first lead',
    first_followup_sent: 'Send first follow-up',
    enable_daily_missions: 'Enable daily missions',
    team_recruiting_flow_setup: 'Set up recruiting funnel',
    product_catalog_upload: 'Upload product catalog',
    first_scan_started: 'Scan your first contact'
  };

  return map[stepId] || stepId;
}
