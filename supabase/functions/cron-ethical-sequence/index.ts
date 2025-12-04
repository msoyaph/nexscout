import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, X-Client-Info, Apikey'
};

interface ProcessedUser {
  userId: string;
  sequenceDay: number;
  actionsExecuted: number;
  actionsThrottled: number;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting ethical sequence cron job...');

    const { data: incompleteUsers, error: usersError } = await supabase
      .from('onboarding_sequence_state')
      .select('user_id, sequence_day')
      .eq('is_complete', false)
      .lte('sequence_day', 7)
      .limit(100);

    if (usersError) {
      throw usersError;
    }

    if (!incompleteUsers || incompleteUsers.length === 0) {
      console.log('No users to process in sequence');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No users to process',
          processed: []
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    console.log(`Processing ${incompleteUsers.length} users...`);
    const processedUsers: ProcessedUser[] = [];

    for (const user of incompleteUsers) {
      try {
        const { data: completionStatus } = await supabase.rpc(
          'get_onboarding_completion_status',
          { p_user_id: user.user_id }
        );

        const { data: profile } = await supabase
          .from('profiles')
          .select('created_at')
          .eq('id', user.user_id)
          .single();

        if (!profile) continue;

        const hoursSinceSignup =
          (Date.now() - new Date(profile.created_at).getTime()) /
          (1000 * 60 * 60);

        const hoursSinceLastActivity = completionStatus?.last_active
          ? (Date.now() - new Date(completionStatus.last_active).getTime()) /
            (1000 * 60 * 60)
          : 999;

        const userData = {
          has_company_data: completionStatus?.has_company_data || false,
          has_products: completionStatus?.has_products || false,
          chatbot_active: completionStatus?.chatbot_active || false,
          has_scans: completionStatus?.has_scans || false,
          has_sent_messages: completionStatus?.has_sent_messages || false,
          onboarding_complete: false,
          hours_since_signup: hoursSinceSignup,
          hours_since_last_activity: hoursSinceLastActivity,
          scans_last_7_days: 0,
          messages_last_7_days: 0,
          plan: 'free',
          completed_steps_count: [
            completionStatus?.has_company_data,
            completionStatus?.has_products,
            completionStatus?.chatbot_active,
            completionStatus?.has_scans
          ].filter(Boolean).length
        };

        const dayConfig = getSequenceDayConfig(user.sequence_day);
        if (!dayConfig) continue;

        let actionsExecuted = 0;
        let actionsThrottled = 0;

        for (const trigger of dayConfig.triggers) {
          if (trigger.condition(userData)) {
            for (const action of trigger.actions) {
              if (action.delayMinutes && action.delayMinutes > 0) {
                continue;
              }

              const { data: canSend } = await supabase.rpc(
                'can_send_communication',
                {
                  p_user_id: user.user_id,
                  p_channel: action.type,
                  p_check_time: new Date().toISOString()
                }
              );

              if (!canSend) {
                actionsThrottled++;
                await supabase.from('sequence_action_history').insert({
                  user_id: user.user_id,
                  sequence_day: user.sequence_day,
                  action_type: action.type,
                  trigger_reason: action.triggerReason,
                  template_key: action.templateKey,
                  channel_used: action.type,
                  was_throttled: true,
                  throttle_reason: 'Anti-spam throttle'
                });
                continue;
              }

              if (action.type === 'in_app') {
                await supabase.from('mentor_conversations').insert({
                  user_id: user.user_id,
                  role: 'system',
                  message: `Sequence Day ${user.sequence_day}: ${action.templateKey}`,
                  message_type: 'system',
                  metadata: {
                    source: 'ethical_sequence',
                    sequence_day: user.sequence_day,
                    template_key: action.templateKey
                  }
                });
              } else if (action.type === 'push') {
                await supabase.from('notifications').insert({
                  user_id: user.user_id,
                  type: 'onboarding_sequence',
                  title: 'Continue Your Setup',
                  body: `Day ${user.sequence_day} reminder`,
                  action_url: '/onboarding/mentor-chat',
                  priority: 'normal',
                  read: false
                });
              }

              await supabase.rpc('log_communication_sent', {
                p_user_id: user.user_id,
                p_channel: action.type,
                p_template_key: action.templateKey
              });

              await supabase.from('sequence_action_history').insert({
                user_id: user.user_id,
                sequence_day: user.sequence_day,
                action_type: action.type,
                trigger_reason: action.triggerReason,
                template_key: action.templateKey,
                channel_used: action.type,
                was_throttled: false,
                sent_successfully: true
              });

              actionsExecuted++;

              if (action.type !== 'in_app') {
                break;
              }
            }
          }
        }

        processedUsers.push({
          userId: user.user_id,
          sequenceDay: user.sequence_day,
          actionsExecuted,
          actionsThrottled
        });
      } catch (error: any) {
        console.error(`Error processing user ${user.user_id}:`, error);
      }
    }

    console.log('Ethical sequence cron completed:', {
      totalUsers: incompleteUsers.length,
      processedUsers: processedUsers.length
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Ethical sequence cron completed',
        totalUsers: incompleteUsers.length,
        processedUsers
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error: any) {
    console.error('Error in ethical sequence cron:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});

function getSequenceDayConfig(day: number): any {
  const configs = [
    {
      day: 0,
      triggers: [
        {
          condition: (userData: any) => true,
          actions: [
            {
              type: 'in_app',
              templateKey: 'welcome_mentor_intro',
              triggerReason: 'Welcome new user',
              priority: 10
            }
          ]
        }
      ]
    },
    {
      day: 1,
      triggers: [
        {
          condition: (userData: any) =>
            !userData.has_company_data && userData.hours_since_signup >= 4,
          actions: [
            {
              type: 'push',
              templateKey: 'push_onboarding_no_company_data',
              triggerReason: 'No company data 4 hours after signup',
              priority: 8
            },
            {
              type: 'in_app',
              templateKey: 'onboarding_no_company_data',
              triggerReason: 'Guide user to company setup',
              priority: 9
            }
          ]
        }
      ]
    },
    {
      day: 2,
      triggers: [
        {
          condition: (userData: any) =>
            userData.has_products && !userData.chatbot_active,
          actions: [
            {
              type: 'push',
              templateKey: 'push_onboarding_no_chatbot',
              triggerReason: 'Products added, chatbot not activated',
              priority: 8
            }
          ]
        }
      ]
    },
    {
      day: 3,
      triggers: [
        {
          condition: (userData: any) => !userData.has_scans,
          actions: [
            {
              type: 'push',
              templateKey: 'push_onboarding_no_first_scan',
              triggerReason: '48 hours, no first scan',
              priority: 8
            }
          ]
        }
      ]
    },
    {
      day: 4,
      triggers: [
        {
          condition: (userData: any) =>
            userData.hours_since_last_activity >= 48,
          actions: [
            {
              type: 'push',
              templateKey: 'push_onboarding_stuck',
              triggerReason: 'User inactive 48-72 hours',
              priority: 7
            }
          ]
        }
      ]
    },
    {
      day: 5,
      triggers: [
        {
          condition: (userData: any) =>
            userData.scans_last_7_days >= 10 && userData.plan === 'free',
          actions: [
            {
              type: 'push',
              templateKey: 'push_free_high_usage',
              triggerReason: 'High usage free user',
              priority: 8
            }
          ]
        }
      ]
    },
    {
      day: 6,
      triggers: [
        {
          condition: (userData: any) =>
            userData.completed_steps_count >= 1 &&
            userData.completed_steps_count < 4,
          actions: [
            {
              type: 'in_app',
              templateKey: 'onboarding_stuck',
              triggerReason: 'Partial progress',
              priority: 8
            }
          ]
        }
      ]
    },
    {
      day: 7,
      triggers: [
        {
          condition: (userData: any) => !userData.onboarding_complete,
          actions: [
            {
              type: 'push',
              templateKey: 'push_onboarding_stuck',
              triggerReason: '7 days incomplete',
              priority: 7
            }
          ]
        }
      ]
    }
  ];

  return configs.find(c => c.day === day);
}
