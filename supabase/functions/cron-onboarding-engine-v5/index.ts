import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, X-Client-Info, Apikey'
};

function interpolate(template: string, vars: Record<string, any>): string {
  return template.replace(/{{\s*([\w.]+)\s*}}/g, (_, key) => {
    const path = key.split('.');
    let value: any = vars;

    for (const p of path) {
      if (value && typeof value === 'object' && p in value) {
        value = value[p];
      } else {
        return '';
      }
    }

    return value == null ? '' : String(value);
  });
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

    console.log('Starting onboarding engine v5 cron...');

    const { data: jobs, error: jobsErr } = await supabase.rpc(
      'get_pending_onboarding_jobs_v2',
      { p_limit: 100 }
    );

    if (jobsErr) {
      throw jobsErr;
    }

    if (!jobs || jobs.length === 0) {
      console.log('No pending jobs to process');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No pending jobs',
          total: 0,
          success: 0,
          failed: 0,
          skipped: 0
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    console.log(`Processing ${jobs.length} jobs...`);

    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    for (const job of jobs) {
      try {
        const { data: canSend } = await supabase.rpc('can_send_communication', {
          p_user_id: job.user_id,
          p_channel: job.channel,
          p_check_time: new Date().toISOString()
        });

        if (!canSend && job.channel !== 'mentor') {
          await supabase.rpc('mark_job_processed_v2', {
            p_job_id: job.id,
            p_status: 'skipped',
            p_error_message: 'Anti-spam throttle'
          });
          skippedCount++;
          continue;
        }

        const { data: message } = await supabase
          .from('onboarding_messages')
          .select('*')
          .eq('id', job.message_id)
          .single();

        if (!message) {
          await supabase.rpc('mark_job_processed_v2', {
            p_job_id: job.id,
            p_status: 'failed',
            p_error_message: 'Message not found'
          });
          failedCount++;
          continue;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('id, email, full_name, first_name, locale')
          .eq('id', job.user_id)
          .single();

        const firstName =
          profile?.first_name ||
          (profile?.full_name ? profile.full_name.split(' ')[0] : 'Ka-Scout');

        const vars = {
          user: profile || {},
          context: job.context || {},
          firstName,
          name: profile?.full_name || firstName,
          deep_link: message.action_url || '/onboarding'
        };

        const renderedBody = interpolate(message.body, vars);
        const renderedTitle = message.title
          ? interpolate(message.title, vars)
          : null;
        const renderedSubject = message.subject
          ? interpolate(message.subject, vars)
          : null;

        if (message.channel === 'email') {
          console.log(
            `Would send email to ${profile?.email}: ${renderedSubject}`
          );
        } else if (message.channel === 'push') {
          await supabase.from('notifications').insert({
            user_id: job.user_id,
            type: 'onboarding_sequence',
            title: renderedTitle || 'NexScout',
            body: renderedBody,
            action_url: message.action_url || '/onboarding',
            priority: 'normal',
            read: false
          });
        } else if (message.channel === 'mentor') {
          await supabase.from('mentor_conversations').insert({
            user_id: job.user_id,
            role: 'assistant',
            message: renderedBody,
            message_type: 'onboarding_sequence',
            metadata: {
              source: 'onboarding_engine_v5',
              message_id: message.id
            }
          });
        }

        await supabase.rpc('mark_job_processed_v2', {
          p_job_id: job.id,
          p_status: 'sent'
        });

        await supabase.from('onboarding_reminder_logs_v2').insert({
          user_id: job.user_id,
          message_id: job.message_id,
          channel: message.channel,
          status: 'sent',
          sent_at: new Date().toISOString()
        });

        if (job.channel !== 'mentor') {
          await supabase.rpc('log_communication_sent', {
            p_user_id: job.user_id,
            p_channel: job.channel,
            p_template_key: message.metadata?.template_key || 'unknown'
          });
        }

        successCount++;
      } catch (error: any) {
        console.error('Error processing job:', job.id, error.message);

        await supabase.rpc('mark_job_processed_v2', {
          p_job_id: job.id,
          p_status: 'failed',
          p_error_message: error.message
        });

        await supabase.from('onboarding_reminder_logs_v2').insert({
          user_id: job.user_id,
          message_id: job.message_id,
          channel: job.channel,
          status: 'failed',
          error_message: error.message
        });

        failedCount++;
      }
    }

    console.log('Onboarding engine v5 cron completed:', {
      total: jobs.length,
      success: successCount,
      failed: failedCount,
      skipped: skippedCount
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Onboarding engine v5 cron completed',
        total: jobs.length,
        successCount,
        failedCount,
        skippedCount
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error: any) {
    console.error('Error in onboarding engine v5 cron:', error);

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
