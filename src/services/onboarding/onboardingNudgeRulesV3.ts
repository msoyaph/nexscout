export interface NudgeCondition {
  company_data_complete?: boolean;
  product_data_complete?: boolean;
  chatbot_enabled?: boolean;
  first_scan_done?: boolean;
  onboarding_complete?: boolean;
  hours_since_signup_gte?: number;
  hours_since_signup_lt?: number;
  hours_since_last_activity_gte?: number;
  hours_since_last_activity_lt?: number;
  event_type?: string;
  last_hours_window?: number;
  plan?: string;
  scans_last_7_days_gte?: number;
  messages_last_7_days_gte?: number;
}

export interface NudgeAction {
  type: 'mentor_message' | 'push' | 'email' | 'banner';
  template_key: string;
  delay_minutes?: number;
}

export interface OnboardingNudgeRule {
  id: string;
  segment: string;
  condition: NudgeCondition;
  actions: NudgeAction[];
}

export const onboardingNudgeRulesV3: OnboardingNudgeRule[] = [
  {
    id: 'no_company_data_24h',
    segment: 'new_user',
    condition: {
      company_data_complete: false,
      hours_since_signup_gte: 4,
      hours_since_last_activity_gte: 4
    },
    actions: [
      { type: 'mentor_message', template_key: 'onboarding_no_company_data' },
      {
        type: 'push',
        template_key: 'push_onboarding_no_company_data',
        delay_minutes: 10
      },
      {
        type: 'email',
        template_key: 'onboarding_no_company_data',
        delay_minutes: 60
      }
    ]
  },
  {
    id: 'no_products_after_company',
    segment: 'new_user',
    condition: {
      company_data_complete: true,
      product_data_complete: false,
      hours_since_last_activity_gte: 4
    },
    actions: [
      { type: 'mentor_message', template_key: 'onboarding_no_products' },
      {
        type: 'push',
        template_key: 'push_onboarding_no_products',
        delay_minutes: 20
      }
    ]
  },
  {
    id: 'no_chatbot_after_setup',
    segment: 'activated_but_no_chatbot',
    condition: {
      company_data_complete: true,
      product_data_complete: true,
      chatbot_enabled: false,
      hours_since_last_activity_gte: 8
    },
    actions: [
      { type: 'mentor_message', template_key: 'onboarding_no_chatbot' },
      { type: 'email', template_key: 'onboarding_no_chatbot', delay_minutes: 120 }
    ]
  },
  {
    id: 'no_first_scan',
    segment: 'ready_for_first_win',
    condition: {
      first_scan_done: false,
      hours_since_signup_gte: 12
    },
    actions: [
      { type: 'mentor_message', template_key: 'onboarding_no_first_win' },
      {
        type: 'push',
        template_key: 'push_onboarding_no_first_scan',
        delay_minutes: 30
      }
    ]
  },
  {
    id: 'user_confused_signal',
    segment: 'confused',
    condition: {
      event_type: 'user_clicked_im_confused',
      last_hours_window: 1
    },
    actions: [
      { type: 'mentor_message', template_key: 'onboarding_user_confused' },
      { type: 'email', template_key: 'onboarding_user_confused', delay_minutes: 30 }
    ]
  },
  {
    id: 'stuck_24_48',
    segment: 'stuck',
    condition: {
      hours_since_last_activity_gte: 24,
      hours_since_last_activity_lt: 48,
      onboarding_complete: false
    },
    actions: [
      { type: 'mentor_message', template_key: 'onboarding_stuck' },
      { type: 'push', template_key: 'push_onboarding_stuck', delay_minutes: 5 }
    ]
  },
  {
    id: 'free_high_usage_upgrade',
    segment: 'free_power_user',
    condition: {
      plan: 'free',
      scans_last_7_days_gte: 15,
      messages_last_7_days_gte: 15
    },
    actions: [
      { type: 'mentor_message', template_key: 'onboarding_free_high_usage' },
      { type: 'push', template_key: 'push_free_high_usage', delay_minutes: 10 },
      { type: 'banner', template_key: 'upgrade_banner_pro' }
    ]
  }
];

export const evaluateNudgeCondition = (
  condition: NudgeCondition,
  userData: any
): boolean => {
  for (const [key, expectedValue] of Object.entries(condition)) {
    const actualValue = userData[key];

    if (key.endsWith('_gte') && typeof expectedValue === 'number') {
      const dataKey = key.replace('_gte', '');
      if (userData[dataKey] === undefined || userData[dataKey] < expectedValue) {
        return false;
      }
    } else if (key.endsWith('_lt') && typeof expectedValue === 'number') {
      const dataKey = key.replace('_lt', '');
      if (userData[dataKey] === undefined || userData[dataKey] >= expectedValue) {
        return false;
      }
    } else if (actualValue !== expectedValue) {
      return false;
    }
  }

  return true;
};

export const getMatchingNudgeRules = (
  userData: any
): OnboardingNudgeRule[] => {
  return onboardingNudgeRulesV3.filter(rule =>
    evaluateNudgeCondition(rule.condition, userData)
  );
};
