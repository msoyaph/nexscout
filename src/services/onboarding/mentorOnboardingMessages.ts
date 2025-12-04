export const mentorOnboardingMessages = {
  onboarding_no_company_data: {
    role: 'assistant',
    content:
      "Hi {{name}} 👋\n\nNapansin ko na hindi pa natin nalalagay yung basic info ng business mo. Mabilis lang 'to — kapag na-set up natin, mas magiging matalinong sumagot si NexScout para sa mga prospects mo.\n\nTap mo lang yung button na **\"Set up my business\"** sa baba, sasamahan kita step-by-step. 🙂"
  },
  onboarding_no_products: {
    role: 'assistant',
    content:
      "Hey {{name}}! 🚀\n\nGame na tayo magbenta, pero wala pa akong alam sa product mo. Kung ma-add natin kahit 1–2 products lang, makakagawa na ako ng **scripts, follow-ups, at pitches** for you.\n\nClick mo lang **\"Add my first product\"** tapos pili ka kung physical, digital, o service yung binibenta mo."
  },
  onboarding_no_chatbot: {
    role: 'assistant',
    content:
      "Good news, {{name}}! Pwede mo nang i-on yung **AI Chatbot** mo – parang 24/7 sales agent na hindi napapagod. 😄\n\nPag in-activate mo 'to, kaya niya sumagot sa FAQs, mag-handle ng objections, at mag-book ng meetings para sa'yo.\n\nTap mo lang **\"Turn ON my chatbot\"** para i-connect sa page or website mo."
  },
  onboarding_no_first_win: {
    role: 'assistant',
    content:
      "Let's get your **first WIN**, {{name}} 💪\n\nScan tayo ng at least 3 prospects. Iche-check ko kung sino ang:\n• Pinaka-ready bumili\n• Ano personality nila\n• Ano possible objections nila\n\nReady? Tap mo lang **\"Scan my first 3 prospects\"**."
  },
  onboarding_user_confused: {
    role: 'assistant',
    content:
      "Mukhang medyo nakalito kanina — okay lang 'yan, normal yan. 😊\n\nGusto mo ba ng **guided tour**? I'll walk you through: setup → scanner → chatbot → first sale.\n\nPili ka:\n1️⃣ \"Walk me through, step-by-step\"  \n2️⃣ \"Skip to: AI Chatbot\"  \n3️⃣ \"Skip to: Prospect Scanning\""
  },
  onboarding_stuck: {
    role: 'assistant',
    content:
      "Hi {{name}}, napansin kong napahinto ka sa onboarding. Malapit na malapit ka na — konting steps na lang, ready nang kumita si NexScout para sa'yo. 💰\n\nGusto mo bang ipakita ko kung ano na lang kulang? I'll highlight the **next best action** for you."
  },
  onboarding_free_high_usage: {
    role: 'assistant',
    content:
      "Ang lupet mo, {{name}}! 🔥\n\nNakikita ko na consistent ka gumamit ng NexScout. Kung i-unlock mo yung **Pro**, magagawa na natin:\n\n• Unlimited scanning  \n• Unlimited AI messages  \n• Full DeepScan  \n• Auto follow-ups & appointments\n\nGusto mo bang makita kung magkano potential ROI mo kung mag-Pro ka?"
  }
};

export const getMentorMessage = (
  templateKey: string,
  variables: Record<string, string> = {}
): string => {
  const template = mentorOnboardingMessages[templateKey as keyof typeof mentorOnboardingMessages];
  if (!template) return '';

  let message = template.content;
  Object.keys(variables).forEach(key => {
    const placeholder = `{{${key}}}`;
    message = message.replace(new RegExp(placeholder, 'g'), variables[key]);
  });

  return message;
};
