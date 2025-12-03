import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ProcessorRequest {
  jobType: 'daily_rescan' | 'followup_check' | 'inactivity_check' | 'streak_reminder' | 'weekly_summary';
  userId?: string;
}

async function processDailyRescan(supabase: any) {
  console.log('[Daily Rescan] Starting daily prospect rescan...');

  const { data: users } = await supabase
    .from('profiles')
    .select('id, subscription_tier')
    .eq('onboarding_completed', true);

  if (!users) return;

  for (const user of users) {
    try {
      const { data: prospects } = await supabase
        .from('prospect_scores')
        .select(`
          prospect_id,
          scout_score,
          bucket,
          prospects!inner(full_name, user_id)
        `)
        .eq('prospects.user_id', user.id)
        .gte('scout_score', 80)
        .eq('bucket', 'hot')
        .order('scout_score', { ascending: false })
        .limit(10);

      if (!prospects || prospects.length === 0) continue;

      const hotProspects = prospects.filter((p: any) => p.bucket === 'hot');

      if (hotProspects.length > 0) {
        await supabase.rpc('create_notification', {
          p_user_id: user.id,
          p_type: 'hot_lead',
          p_title: `🔥 ${hotProspects.length} Hot ${hotProspects.length === 1 ? 'Prospect' : 'Prospects'} Ready`,
          p_message: `Your top prospects today: ${hotProspects.slice(0, 3).map((p: any) => p.prospects.full_name).join(', ')}${hotProspects.length > 3 ? ` and ${hotProspects.length - 3} more` : ''}`,
          p_icon: '🔥',
          p_priority: 'high',
          p_metadata: { prospect_ids: hotProspects.map((p: any) => p.prospect_id) }
        });
      }

      const today = new Date().toISOString().split('T')[0];
      await supabase
        .from('daily_top_prospects')
        .upsert({
          user_id: user.id,
          date: today,
          prospect_ids: prospects.map((p: any) => p.prospect_id),
          hot_count: hotProspects.length,
          total_prospects: prospects.length,
        });

    } catch (error) {
      console.error(`[Daily Rescan] Error for user ${user.id}:`, error);
    }
  }

  console.log('[Daily Rescan] Completed');
}

async function processFollowUpCheck(supabase: any) {
  console.log('[Follow-Up Check] Checking pending follow-ups...');

  const today = new Date().toISOString().split('T')[0];

  const { data: reminders } = await supabase
    .from('follow_up_reminders')
    .select(`
      *,
      prospects!inner(id, full_name, user_id),
      message_sequences(id, title, current_step, total_steps)
    `)
    .eq('status', 'pending')
    .lte('reminder_date', today);

  if (!reminders) return;

  for (const reminder of reminders) {
    try {
      let title = '🕒 Follow-Up Reminder';
      let message = `Time to follow up with ${reminder.prospects.full_name}`;

      if (reminder.sequence_id && reminder.message_sequences) {
        const seq = reminder.message_sequences;
        title = `📨 Sequence Step ${seq.current_step + 1}/${seq.total_steps}`;
        message = `Time to send next message to ${reminder.prospects.full_name} in "${seq.title}"`;
      }

      const notificationId = await supabase.rpc('create_notification', {
        p_user_id: reminder.user_id,
        p_type: reminder.sequence_id ? 'sequence_action' : 'followup_due',
        p_title: title,
        p_message: message,
        p_icon: reminder.sequence_id ? '📨' : '🕒',
        p_prospect_id: reminder.prospect_id,
        p_sequence_id: reminder.sequence_id,
        p_priority: 'high',
        p_metadata: {}
      });

      await supabase
        .from('follow_up_reminders')
        .update({
          status: 'sent',
          notification_id: notificationId,
        })
        .eq('id', reminder.id);

    } catch (error) {
      console.error(`[Follow-Up Check] Error for reminder ${reminder.id}:`, error);
    }
  }

  console.log(`[Follow-Up Check] Processed ${reminders.length} reminders`);
}

async function processInactivityCheck(supabase: any) {
  console.log('[Inactivity Check] Checking for cooling leads...');

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: prospects } = await supabase
    .from('prospects')
    .select(`
      id,
      full_name,
      user_id,
      updated_at,
      prospect_scores!inner(scout_score, bucket)
    `)
    .eq('is_unlocked', true)
    .lt('updated_at', sevenDaysAgo.toISOString())
    .in('prospect_scores.bucket', ['hot', 'warm']);

  if (!prospects) return;

  for (const prospect of prospects) {
    try {
      await supabase.rpc('create_notification', {
        p_user_id: prospect.user_id,
        p_type: 'lead_cooling',
        p_title: '❄️ Lead Cooling Down',
        p_message: `${prospect.full_name} hasn't been contacted in 7+ days. Time to re-engage!`,
        p_icon: '❄️',
        p_prospect_id: prospect.id,
        p_priority: 'normal',
        p_metadata: { days_inactive: Math.floor((Date.now() - new Date(prospect.updated_at).getTime()) / (1000 * 60 * 60 * 24)) }
      });
    } catch (error) {
      console.error(`[Inactivity Check] Error for prospect ${prospect.id}:`, error);
    }
  }

  console.log(`[Inactivity Check] Processed ${prospects.length} cooling leads`);
}

async function processStreakReminder(supabase: any) {
  console.log('[Streak Reminder] Sending streak reminders...');

  const today = new Date().toISOString().split('T')[0];

  const { data: users } = await supabase
    .from('user_streaks')
    .select(`
      *,
      profiles!inner(id, subscription_tier)
    `)
    .neq('last_activity_date', today)
    .gte('current_streak', 3);

  if (!users) return;

  for (const userStreak of users) {
    try {
      await supabase.rpc('create_notification', {
        p_user_id: userStreak.user_id,
        p_type: 'streak_reminder',
        p_title: `⭐ Don't Break Your ${userStreak.current_streak}-Day Streak!`,
        p_message: `Complete 1 action today to maintain your momentum. Your longest streak: ${userStreak.longest_streak} days.`,
        p_icon: '⭐',
        p_priority: 'normal',
        p_metadata: { current_streak: userStreak.current_streak, longest_streak: userStreak.longest_streak }
      });
    } catch (error) {
      console.error(`[Streak Reminder] Error for user ${userStreak.user_id}:`, error);
    }
  }

  console.log(`[Streak Reminder] Sent ${users.length} reminders`);
}

async function processWeeklySummary(supabase: any) {
  console.log('[Weekly Summary] Generating weekly summaries...');

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const { data: users } = await supabase
    .from('profiles')
    .select('id, subscription_tier')
    .eq('onboarding_completed', true);

  if (!users) return;

  for (const user of users) {
    try {
      const [scansResult, messagesResult, decksResult, streakResult] = await Promise.all([
        supabase
          .from('scanning_sessions')
          .select('id, prospects_found')
          .eq('user_id', user.id)
          .gte('created_at', oneWeekAgo.toISOString()),
        supabase
          .from('generated_messages')
          .select('id')
          .eq('user_id', user.id)
          .gte('created_at', oneWeekAgo.toISOString()),
        supabase
          .from('pitch_decks')
          .select('id')
          .eq('user_id', user.id)
          .gte('created_at', oneWeekAgo.toISOString()),
        supabase
          .from('user_streaks')
          .select('current_streak')
          .eq('user_id', user.id)
          .single(),
      ]);

      const totalProspects = scansResult.data?.reduce((sum, s) => sum + (s.prospects_found || 0), 0) || 0;
      const totalMessages = messagesResult.data?.length || 0;
      const totalDecks = decksResult.data?.length || 0;
      const currentStreak = streakResult.data?.current_streak || 0;

      const message = `
This week: ${totalProspects} prospects scanned, ${totalMessages} messages generated, ${totalDecks} pitch decks created.
Current streak: ${currentStreak} days. Keep up the great work! 🚀
      `.trim();

      await supabase.rpc('create_notification', {
        p_user_id: user.id,
        p_type: 'weekly_report',
        p_title: '📊 Your Weekly Summary',
        p_message: message,
        p_icon: '📊',
        p_priority: 'low',
        p_metadata: {
          prospects: totalProspects,
          messages: totalMessages,
          decks: totalDecks,
          streak: currentStreak
        }
      });

    } catch (error) {
      console.error(`[Weekly Summary] Error for user ${user.id}:`, error);
    }
  }

  console.log(`[Weekly Summary] Generated ${users.length} summaries`);
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { jobType, userId }: ProcessorRequest = await req.json();

    const jobId = crypto.randomUUID();
    await supabase.from('background_jobs').insert({
      id: jobId,
      job_type: jobType,
      status: 'running',
      started_at: new Date().toISOString(),
    });

    try {
      switch (jobType) {
        case 'daily_rescan':
          await processDailyRescan(supabase);
          break;
        case 'followup_check':
          await processFollowUpCheck(supabase);
          break;
        case 'inactivity_check':
          await processInactivityCheck(supabase);
          break;
        case 'streak_reminder':
          await processStreakReminder(supabase);
          break;
        case 'weekly_summary':
          await processWeeklySummary(supabase);
          break;
        default:
          throw new Error(`Unknown job type: ${jobType}`);
      }

      await supabase.from('background_jobs').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      }).eq('id', jobId);

      return new Response(
        JSON.stringify({ success: true, jobType }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (jobError) {
      await supabase.from('background_jobs').update({
        status: 'failed',
        error_message: jobError.message,
        completed_at: new Date().toISOString(),
      }).eq('id', jobId);

      throw jobError;
    }

  } catch (error) {
    console.error('Error in notification-processor function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});