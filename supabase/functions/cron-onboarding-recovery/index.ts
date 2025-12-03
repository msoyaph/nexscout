import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, X-Client-Info, Apikey'
};

interface ExecutionReport {
  total: number;
  success: number;
  failed: number;
  skipped: number;
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

    console.log('Starting onboarding recovery cron job...');

    const report: ExecutionReport = {
      total: 0,
      success: 0,
      failed: 0,
      skipped: 0
    };

    const { data: jobs, error: jobsError } = await supabase.rpc(
      'get_due_reminders'
    );

    if (jobsError) {
      throw jobsError;
    }

    if (!jobs || jobs.length === 0) {
      console.log('No due reminders to process');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No due reminders',
          report
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    report.total = jobs.length;
    console.log(`Processing ${jobs.length} reminders...`);

    for (const job of jobs) {
      try {
        const startTime = Date.now();

        if (job.channel === 'in_app') {
          await supabase.from('mentor_conversations').insert({
            user_id: job.user_id,
            role: 'system',
            message: `Reminder: ${job.template_key}`,
            message_type: 'system',
            metadata: {
              source: 'recovery_cron',
              template_key: job.template_key,
              reminder_id: job.id
            }
          });

          await supabase.from('notifications').insert({
            user_id: job.user_id,
            type: 'onboarding_reminder',
            title: 'Continue Your Setup',
            body: 'Tap to resume your onboarding',
            action_url: '/onboarding/mentor-chat',
            read: false
          });
        } else if (job.channel === 'push') {
          await supabase.from('notifications').insert({
            user_id: job.user_id,
            type: 'onboarding_reminder',
            title: 'NexScout misses you!',
            body: 'Tap to continue your setup',
            action_url: '/onboarding/mentor-chat',
            priority: 'high',
            read: false
          });
        } else if (job.channel === 'email') {
          console.log(
            `Email would be sent to user ${job.user_id} with template ${job.template_key}`
          );
        }

        const executionTime = Date.now() - startTime;

        const { error: markError } = await supabase.rpc('mark_reminder_sent', {
          p_reminder_id: job.id,
          p_success: true,
          p_error_message: null
        });

        if (markError) {
          console.error('Error marking reminder as sent:', markError);
        }

        await supabase
          .from('onboarding_reminder_logs')
          .update({
            execution_time_ms: executionTime
          })
          .eq('reminder_id', job.id);

        report.success++;
      } catch (error: any) {
        console.error('Error processing reminder:', error);

        await supabase.rpc('mark_reminder_sent', {
          p_reminder_id: job.id,
          p_success: false,
          p_error_message: error.message
        });

        report.failed++;
      }
    }

    console.log('Onboarding recovery cron job completed:', report);

    await supabase.from('onboarding_events_v2').insert({
      user_id: '00000000-0000-0000-0000-000000000000',
      event_type: 'recovery_cron_executed',
      event_data: report,
      source: 'cron'
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Onboarding recovery cron completed',
        report
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error: any) {
    console.error('Error in onboarding recovery cron:', error);

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
