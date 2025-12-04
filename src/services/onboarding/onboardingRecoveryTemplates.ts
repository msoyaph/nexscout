export interface RecoveryTemplate {
  key: string;
  notification_title: string;
  in_app_message: string;
  push_message: string;
  email_subject: string;
  email_body: string;
  deep_link: string;
}

export const onboardingRecoveryTemplates: Record<string, RecoveryTemplate> = {
  onboarding_no_company_data: {
    key: 'onboarding_no_company_data',
    notification_title: 'Quick step lang — set up your business 💡',
    in_app_message:
      "Hi! Napansin ko na hindi pa natin nalalagay yung basic info ng business mo.\n\nSuper bilis lang nito — and ito yung nag-a-unlock ng mas accurate na AI messages, personalized pitch decks, at higher chance of closing!\n\nLet's do it now? 30 seconds lang 😊",
    push_message:
      'Add your business info — para mas smart yung AI mo. ⚡',
    email_subject:
      'Quick step lang — let's set up your business para mas smart si NexScout 💡',
    email_body: `Hi {{name}},

Napansin ko na hindi pa natin nalalagay yung basic info ng business mo.
Super bilis lang nito — and ito yung nag-a-unlock ng:

✅ Mas accurate na AI messages
✅ Personalized pitch decks
✅ Smarter product suggestions
✅ Higher chance of closing your first deal

Click here to finish it (30 seconds lang):
👉 {{deep_link}}

Tara, let's set you up for your first win.
– NexScout AI Mentor`,
    deep_link: '/onboarding/company-setup'
  },

  onboarding_no_products: {
    key: 'onboarding_no_products',
    notification_title: 'Add your product — para makabenta ka today 🚀',
    in_app_message:
      "Ready ka na magbenta — pero wala pa akong alam tungkol sa product mo.\n\nKonting input lang, and I'll auto-generate smart product pitches, follow-up messages, closing scripts, at marketing angles!\n\nLet's add it now?",
    push_message: 'Add a product para ma-generate ko na ang sales messages mo!',
    email_subject: 'Add your product — para makabenta ka today 🚀',
    email_body: `Hi {{name}},

Ready ka na magbenta — pero wala pa akong alam tungkol sa product mo.
Konting input lang, and I'll auto-generate:

🔥 Smart product pitches
🔥 Follow-up messages
🔥 Closing scripts
🔥 Marketing angles

Tap here to add your product:
👉 {{deep_link}}

Let's close your first sale today.
– Your NexScout AI Coach`,
    deep_link: '/products/add'
  },

  onboarding_no_chatbot: {
    key: 'onboarding_no_chatbot',
    notification_title: 'Activate your AI Chatbot — 24/7 sales agent mo 📲',
    in_app_message:
      "Hindi pa naka-ON yung AI Chatbot mo.\n\nSayang! This feature brings leads + closes deals habang natutulog ka.\n\nOnce activated, it can answer questions, handle objections, book meetings, and collect prospect info.\n\nActivate it now? 10 seconds lang!",
    push_message: 'Activate your 24/7 AI Sales Agent — 10 seconds lang!',
    email_subject: 'Activate your AI Chatbot — 24/7 sales agent mo 📲',
    email_body: `Hi {{name}},

Hindi pa naka-ON yung AI Chatbot mo.
Sayang! This feature brings leads + closes deals habang natutulog ka.

Once activated, it can:
🤖 Answer questions
🤖 Handle objections
🤖 Book meetings
🤖 Collect prospect info

Activate it now (10 seconds):
👉 {{deep_link}}

– Your NexScout AI Coach`,
    deep_link: '/ai-chatbot'
  },

  onboarding_no_first_win: {
    key: 'onboarding_no_first_win',
    notification_title: "Let's get your first WIN — scan 3 prospects 💪",
    in_app_message:
      "Gusto mo bang mahanap agad kung sino ang potential buyers mo?\n\nScan 3 prospects and I'll show you their Buying Intent, Personality Type, Objections, and the Best message to send.\n\nKaya natin 'to 🔥",
    push_message: 'Scan 3 prospects para makita kung sino bibili agad.',
    email_subject: "Let's get your first WIN — scan 3 prospects 💪",
    email_body: `Hi {{name}},

Gusto mo bang mahanap agad kung sino ang potential buyers mo?
Scan 3 prospects and I'll show you:

🎯 Buying Intent
🎯 Personality Type
🎯 Objections
🎯 Best message to send

Click here to scan:
👉 {{deep_link}}

Kaya natin 'to 🔥

– Your NexScout AI Coach`,
    deep_link: '/scan/upload'
  },

  onboarding_user_confused: {
    key: 'onboarding_user_confused',
    notification_title: 'Let me help you — mabilis lang. 🙂',
    in_app_message:
      "Mukhang nalito ka kanina, and that's totally normal.\n\nI'm here to guide you step-by-step. Just click continue and I'll walk you through everything.\n\nNo rush, we'll take it one step at a time 😊",
    push_message: 'Nalito ka kanina? I'll guide you. Tap to continue.',
    email_subject: 'Let me help you — mabilis lang. 🙂',
    email_body: `Hi {{name}},

Mukhang nalito ka kanina, and that's totally normal.
I'm here to guide you step-by-step.

Just click this and I'll walk you through everything:
👉 {{deep_link}}

– Your NexScout AI Mentor`,
    deep_link: '/onboarding/mentor-chat'
  },

  onboarding_stuck: {
    key: 'onboarding_stuck',
    notification_title: "You're so close — konti na lang para kumita ka na 💰",
    in_app_message:
      "Napansin ko na napahinto ka. No worries!\n\nLet's finish your setup — para makapag-close ka na ng first sale mo.\n\nI'll walk with you every step. Ready?",
    push_message: "Balik tayo? Kaya mo 'to. Tap to resume your setup. 💪",
    email_subject: "You're so close — konti na lang para kumita ka na 💰",
    email_body: `Hi {{name}},

Napansin ko na napahinto ka. No worries!
Let's finish your setup — para makapag-close ka na ng first sale mo.

Click to resume:
👉 {{deep_link}}

I'll walk with you.
– NexScout AI Mentor`,
    deep_link: '/onboarding/mentor-chat'
  },

  onboarding_free_high_usage: {
    key: 'onboarding_free_high_usage',
    notification_title: "You're leveling up fast — unlock full power 🚀",
    in_app_message:
      "Grabe — ang dami mong ginagawa inside NexScout!\n\nKung i-unlock mo yung Pro, mas mapapabilis natin yung closing:\n\n✨ Unlimited scanning\n✨ Unlimited AI messages\n✨ Full DeepScan\n✨ Auto follow-ups\n✨ Smart appointment setting\n\nWant to try Pro?",
    push_message:
      'Ang galing mo! Unlock Pro para bumilis lalo progress mo ✨',
    email_subject: "You're leveling up fast — unlock full power 🚀",
    email_body: `Hi {{name}},

Grabe — ang dami mong ginagawa inside NexScout!
Kung i-unlock mo yung Pro, mas mapapabilis natin yung closing:

✨ Unlimited scanning
✨ Unlimited AI messages
✨ Full DeepScan
✨ Auto follow-ups
✨ Smart appointment setting

Try Pro now:
👉 {{upgrade_link}}

– Your NexScout AI Coach`,
    deep_link: '/subscription'
  },

  onboarding_default: {
    key: 'onboarding_default',
    notification_title: 'Continue your setup — first win is near! 🎯',
    in_app_message:
      "Hey! Let's continue your onboarding.\n\nMalapit ka na sa first win mo. I'm here to guide you every step of the way.\n\nReady?",
    push_message: 'Continue your setup — first win is waiting! 🎯',
    email_subject: 'Continue your NexScout setup',
    email_body: `Hi {{name}},

Let's continue your onboarding setup.
You're closer than you think to your first win!

Click to continue:
👉 {{deep_link}}

– NexScout AI Mentor`,
    deep_link: '/onboarding/mentor-chat'
  }
};

export const getTemplate = (
  templateKey: string
): RecoveryTemplate | undefined => {
  return onboardingRecoveryTemplates[templateKey];
};

export const getAllTemplateKeys = (): string[] => {
  return Object.keys(onboardingRecoveryTemplates);
};

export const personalizeTemplate = (
  template: RecoveryTemplate,
  variables: Record<string, string>
): RecoveryTemplate => {
  const personalized = { ...template };

  Object.keys(variables).forEach(key => {
    const placeholder = `{{${key}}}`;
    personalized.email_body = personalized.email_body.replace(
      new RegExp(placeholder, 'g'),
      variables[key]
    );
    personalized.email_subject = personalized.email_subject.replace(
      new RegExp(placeholder, 'g'),
      variables[key]
    );
  });

  return personalized;
};
