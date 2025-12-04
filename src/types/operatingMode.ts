export type OperatingMode = 'autopilot' | 'manual' | 'hybrid';

export interface ModePreferences {
  autopilot: {
    auto_qualify_threshold: number;
    auto_close_threshold: number;
    max_daily_prospects: number;
    enable_fb_ads_automation: boolean;
  };
  manual: {
    show_ai_suggestions: boolean;
    auto_generate_messages: boolean;
    require_approval_for_send: boolean;
  };
  hybrid: {
    auto_qualify_threshold: number;
    auto_nurture_enabled: boolean;
    require_approval_for_close: boolean;
    enable_pipeline_automation: boolean;
  };
}

export interface ProfileWithMode {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  operating_mode: OperatingMode;
  mode_preferences: ModePreferences;
  created_at: string;
  updated_at: string;
}

export const DEFAULT_MODE_PREFERENCES: ModePreferences = {
  autopilot: {
    auto_qualify_threshold: 50,
    auto_close_threshold: 70,
    max_daily_prospects: 50,
    enable_fb_ads_automation: true,
  },
  manual: {
    show_ai_suggestions: true,
    auto_generate_messages: true,
    require_approval_for_send: true,
  },
  hybrid: {
    auto_qualify_threshold: 60,
    auto_nurture_enabled: true,
    require_approval_for_close: true,
    enable_pipeline_automation: true,
  },
};

export const OPERATING_MODE_DESCRIPTIONS = {
  autopilot: {
    title: 'Full Autopilot',
    description: 'Complete hands-off automation. AI handles everything from prospecting to closing deals.',
    features: [
      'Automatic prospect qualification',
      'AI-driven nurturing sequences',
      'Automated deal closing',
      'Facebook Lead Ads integration',
      'No approval required',
    ],
    icon: 'Zap',
    color: 'text-purple-600',
  },
  manual: {
    title: 'Manual Drive',
    description: 'Full human control with AI assistance. You make all decisions, AI helps with execution.',
    features: [
      'Manual prospecting',
      'AI-generated message suggestions',
      'Human approval for all sends',
      'AI insights and recommendations',
      'Full control over pipeline',
    ],
    icon: 'User',
    color: 'text-blue-600',
  },
  hybrid: {
    title: 'Hybrid Mode',
    description: 'Best of both worlds. AI automates low-risk tasks, you approve high-impact decisions.',
    features: [
      'Automatic nurturing',
      'AI-suggested qualifications',
      'Human approval for closing',
      'Pipeline automation triggers',
      'Balanced AI-human collaboration',
    ],
    icon: 'GitMerge',
    color: 'text-green-600',
  },
};
