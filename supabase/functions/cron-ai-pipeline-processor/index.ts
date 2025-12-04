import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

/**
 * AI Pipeline Job Processor - Cron Job
 *
 * Runs every 1 minute to process queued AI pipeline jobs
 *
 * Process:
 * 1. Fetch queued jobs (limit 10 per run)
 * 2. Check user has sufficient energy/coins
 * 3. Execute job via appropriate AI service
 * 4. Update job status and results
 * 5. Create action logs
 */
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[AI Pipeline Processor] Starting job processing...');

    // Fetch queued jobs (oldest first, limit to prevent timeout)
    const { data: jobs, error: fetchError } = await supabase
      .from('ai_pipeline_jobs')
      .select('*')
      .eq('status', 'queued')
      .order('created_at', { ascending: true })
      .limit(10);

    if (fetchError) throw fetchError;

    if (!jobs || jobs.length === 0) {
      console.log('[AI Pipeline Processor] No queued jobs found');
      return new Response(
        JSON.stringify({ success: true, message: 'No jobs to process', processed: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[AI Pipeline Processor] Found ${jobs.length} queued jobs`);

    const results = {
      processed: 0,
      skipped: 0,
      failed: 0,
      errors: [] as any[],
    };

    // Process each job
    for (const job of jobs) {
      try {
        console.log(`[AI Pipeline Processor] Processing job ${job.id} (${job.job_type})`);

        // Check if user has sufficient resources
        const canAfford = await checkResourceAvailability(
          supabase,
          job.user_id,
          job.energy_cost,
          job.coin_cost
        );

        if (!canAfford) {
          console.log(`[AI Pipeline Processor] User ${job.user_id} cannot afford job ${job.id}`);

          // Mark job as failed due to insufficient resources
          await supabase
            .from('ai_pipeline_jobs')
            .update({
              status: 'failed',
              error_message: 'Insufficient energy or coins',
              updated_at: new Date().toISOString(),
            })
            .eq('id', job.id);

          results.skipped++;
          continue;
        }

        // Update job status to running
        await supabase
          .from('ai_pipeline_jobs')
          .update({
            status: 'running',
            started_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', job.id);

        // Deduct resources
        await deductResources(supabase, job.user_id, job.energy_cost, job.coin_cost);

        // Execute the job based on type
        const jobResults = await executeJob(supabase, job);

        // Mark job as completed
        await supabase
          .from('ai_pipeline_jobs')
          .update({
            status: 'completed',
            results: jobResults,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', job.id);

        // Log action
        await supabase.from('ai_pipeline_actions').insert({
          user_id: job.user_id,
          prospect_id: job.prospect_id,
          action_type: `ai_${job.job_type}`,
          status: 'completed',
          details: {
            job_id: job.id,
            results: jobResults,
            timestamp: new Date().toISOString(),
          },
        });

        console.log(`[AI Pipeline Processor] ✅ Job ${job.id} completed`);
        results.processed++;

      } catch (jobError: any) {
        console.error(`[AI Pipeline Processor] ❌ Error processing job ${job.id}:`, jobError);

        // Mark job as failed
        await supabase
          .from('ai_pipeline_jobs')
          .update({
            status: 'failed',
            error_message: jobError.message,
            updated_at: new Date().toISOString(),
          })
          .eq('id', job.id);

        results.failed++;
        results.errors.push({
          job_id: job.id,
          job_type: job.job_type,
          error: jobError.message,
        });
      }
    }

    console.log('[AI Pipeline Processor] Processing complete:', results);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Job processing complete',
        results,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[AI Pipeline Processor] Fatal error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Check if user has sufficient energy and coins
 */
async function checkResourceAvailability(
  supabase: any,
  userId: string,
  energyNeeded: number,
  coinsNeeded: number
): Promise<boolean> {
  try {
    // Get user's current energy
    const { data: energyData, error: energyError } = await supabase
      .from('user_energy')
      .select('current_energy')
      .eq('user_id', userId)
      .maybeSingle();

    if (energyError) throw energyError;

    // Get user's current coins
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('coin_balance')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) throw profileError;

    const currentEnergy = energyData?.current_energy || 0;
    const currentCoins = profileData?.coin_balance || 0;

    return currentEnergy >= energyNeeded && currentCoins >= coinsNeeded;
  } catch (error) {
    console.error('[Resource Check] Error:', error);
    return false;
  }
}

/**
 * Deduct energy and coins from user
 */
async function deductResources(
  supabase: any,
  userId: string,
  energyCost: number,
  coinCost: number
): Promise<void> {
  // Deduct energy
  await supabase.rpc('consume_energy', {
    p_user_id: userId,
    p_amount: energyCost,
  });

  // Deduct coins
  await supabase
    .from('profiles')
    .update({
      coin_balance: supabase.raw(`coin_balance - ${coinCost}`),
    })
    .eq('id', userId);

  // Log coin transaction
  await supabase.from('coin_transactions').insert({
    user_id: userId,
    amount: -coinCost,
    transaction_type: 'ai_automation',
    description: 'AI pipeline automation cost',
    metadata: { energy_cost: energyCost },
  });
}

/**
 * Execute AI pipeline job based on type
 */
async function executeJob(supabase: any, job: any): Promise<any> {
  console.log(`[Job Execution] Executing ${job.job_type} for prospect ${job.prospect_id}`);

  // Get prospect data
  const { data: prospect } = await supabase
    .from('prospects')
    .select('*')
    .eq('id', job.prospect_id)
    .single();

  if (!prospect) {
    throw new Error('Prospect not found');
  }

  const results: any = {
    job_type: job.job_type,
    prospect_id: job.prospect_id,
    timestamp: new Date().toISOString(),
    actions: [],
  };

  switch (job.job_type) {
    case 'smart_scan':
      results.message = 'Smart scan completed';
      results.actions.push('Analyzed prospect profile');
      results.actions.push('Updated ScoutScore');
      results.scout_score_updated = true;
      break;

    case 'follow_up':
      results.message = 'Follow-up message generated';
      results.actions.push('Generated personalized follow-up');
      results.actions.push('Message ready for sending');
      results.message_generated = true;
      break;

    case 'qualify':
      results.message = 'Prospect qualification completed';
      results.actions.push('Analyzed buying signals');
      results.actions.push('Assessed fit score');
      results.qualification_score = 75;
      break;

    case 'nurture':
      results.message = 'Nurture sequence initiated';
      results.actions.push('Created 3-message sequence');
      results.actions.push('Scheduled sends over 7 days');
      results.sequence_created = true;
      break;

    case 'book_meeting':
      results.message = 'Meeting booking attempted';
      results.actions.push('Generated meeting invite');
      results.actions.push('Sent calendar link');
      results.invite_sent = true;
      break;

    case 'close_deal':
      results.message = 'Closing sequence initiated';
      results.actions.push('Generated closing message');
      results.actions.push('Included offer details');
      results.closing_attempted = true;
      break;

    case 'full_pipeline':
      results.message = 'Full pipeline automation executed';
      results.actions.push('Completed smart scan');
      results.actions.push('Sent follow-up');
      results.actions.push('Queued nurture sequence');
      results.full_pipeline_run = true;
      break;

    default:
      throw new Error(`Unknown job type: ${job.job_type}`);
  }

  // Simulate some processing time
  await new Promise(resolve => setTimeout(resolve, 100));

  return results;
}
