import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface MissionTemplate {
  title: string;
  description: string;
  mission_type: string;
  icon_name: string;
  color: string;
  reward_coins: number;
  total_required: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { mission_type } = await req.json();

    const missionTemplates: Record<string, MissionTemplate[]> = {
      onboarding: [
        {
          title: 'Welcome to NexScout!',
          description: 'Complete your profile and explore the app',
          mission_type: 'onboarding',
          icon_name: 'Sparkles',
          color: '#1877F2',
          reward_coins: 25,
          total_required: 1,
        },
        {
          title: 'Get Your First Prospect',
          description: 'Scan or add your first prospect to the system',
          mission_type: 'onboarding',
          icon_name: 'UserPlus',
          color: '#14C764',
          reward_coins: 50,
          total_required: 1,
        },
        {
          title: 'Learn App Tips & Hacks',
          description: 'Watch the tutorial video or visit Training Hub',
          mission_type: 'onboarding',
          icon_name: 'GraduationCap',
          color: '#A06BFF',
          reward_coins: 30,
          total_required: 1,
        },
      ],
      daily_challenge: [
        {
          title: 'Daily Scan Challenge',
          description: 'Scan 5 new prospects today using AI scanning',
          mission_type: 'daily_challenge',
          icon_name: 'Search',
          color: '#1877F2',
          reward_coins: 40,
          total_required: 5,
        },
        {
          title: 'Message Master',
          description: 'Send 3 AI-powered messages to prospects',
          mission_type: 'daily_challenge',
          icon_name: 'Mail',
          color: '#1EC8FF',
          reward_coins: 35,
          total_required: 3,
        },
        {
          title: 'Pipeline Builder',
          description: 'Add 2 qualified prospects to your pipeline',
          mission_type: 'daily_challenge',
          icon_name: 'TrendingUp',
          color: '#14C764',
          reward_coins: 45,
          total_required: 2,
        },
        {
          title: 'Follow-Up Hero',
          description: 'Complete 3 follow-up actions with prospects',
          mission_type: 'daily_challenge',
          icon_name: 'CheckCircle',
          color: '#F59E0B',
          reward_coins: 30,
          total_required: 3,
        },
      ],
      learning: [
        {
          title: 'Master AI Scanning',
          description: 'Complete 10 AI scans to understand the system',
          mission_type: 'learning',
          icon_name: 'Scan',
          color: '#1877F2',
          reward_coins: 75,
          total_required: 10,
        },
        {
          title: 'Explore All Features',
          description: 'Visit all major sections: Pipeline, Messages, Library',
          mission_type: 'learning',
          icon_name: 'Compass',
          color: '#A06BFF',
          reward_coins: 50,
          total_required: 5,
        },
      ],
    };

    const templates = mission_type && missionTemplates[mission_type]
      ? missionTemplates[mission_type]
      : [...missionTemplates.onboarding, ...missionTemplates.daily_challenge.slice(0, 2)];

    const missionsToInsert = templates.map((template) => ({
      ...template,
      user_id: user.id,
      current_progress: 0,
      is_completed: false,
      expires_at: mission_type === 'daily_challenge'
        ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        : null,
    }));

    const { data: missions, error: insertError } = await supabase
      .from('missions')
      .insert(missionsToInsert)
      .select();

    if (insertError) {
      throw insertError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        missions,
        count: missions?.length || 0,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error generating missions:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate missions',
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});