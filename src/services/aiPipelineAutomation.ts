import { supabase } from '../lib/supabase';
import { OperatingModeService } from './operatingModeService';
import { OperatingMode } from '../types/operatingMode';

export interface AIPipelineJob {
  id: string;
  user_id: string;
  prospect_id?: string | null;
  job_type: 'smart_scan' | 'follow_up' | 'qualify' | 'nurture' | 'book_meeting' | 'close_deal' | 'full_pipeline';
  status: 'queued' | 'running' | 'paused' | 'completed' | 'failed' | 'stopped';
  config: any;
  energy_cost: number;
  coin_cost: number;
  results: any;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AIPipelineSettings {
  user_id: string;
  auto_follow_up: boolean;
  auto_qualify: boolean;
  auto_nurture: boolean;
  auto_book_meetings: boolean;
  auto_close_deals: boolean;
  energy_budget_daily: number;
  coin_budget_daily: number;
  aggressive_mode: boolean;
  smart_scan_enabled: boolean;
  working_hours_start: number;
  working_hours_end: number;
  timezone: string;
}

// Energy and Coin Costs for Different AI Operations
export const AI_OPERATION_COSTS = {
  smart_scan: { energy: 10, coins: 5 },
  follow_up: { energy: 15, coins: 8 },
  qualify: { energy: 20, coins: 10 },
  nurture: { energy: 25, coins: 12 },
  book_meeting: { energy: 30, coins: 15 },
  close_deal: { energy: 50, coins: 25 },
  full_pipeline: { energy: 100, coins: 50 }
};

/**
 * AI Pipeline Automation Service
 * Manages autonomous AI operations for prospect pipeline management
 */
export class AIPipelineAutomationService {

  /**
   * Get user's AI pipeline settings
   */
  static async getSettings(userId: string): Promise<AIPipelineSettings | null> {
    try {
      const { data, error } = await supabase
        .from('ai_pipeline_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching AI pipeline settings:', error);
      return null;
    }
  }

  /**
   * Update AI pipeline settings
   */
  static async updateSettings(userId: string, settings: Partial<AIPipelineSettings>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ai_pipeline_settings')
        .upsert({
          user_id: userId,
          ...settings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating AI pipeline settings:', error);
      return false;
    }
  }

  /**
   * Check if user has enough energy and coins for an operation
   */
  static async checkResourceAvailability(
    userId: string,
    jobType: keyof typeof AI_OPERATION_COSTS
  ): Promise<{ canAfford: boolean; energy: number; coins: number; energyNeeded: number; coinsNeeded: number }> {
    try {
      const costs = AI_OPERATION_COSTS[jobType];

      // Get user's current energy
      const { data: energyData, error: energyError } = await supabase
        .from('user_energy')
        .select('current_energy')
        .eq('user_id', userId)
        .maybeSingle();

      if (energyError) throw energyError;

      // Get user's current coins from profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('coin_balance')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) throw profileError;

      const currentEnergy = energyData?.current_energy || 0;
      const currentCoins = profileData?.coin_balance || 0;

      return {
        canAfford: currentEnergy >= costs.energy && currentCoins >= costs.coins,
        energy: currentEnergy,
        coins: currentCoins,
        energyNeeded: costs.energy,
        coinsNeeded: costs.coins
      };
    } catch (error) {
      console.error('Error checking resource availability:', error);
      return {
        canAfford: false,
        energy: 0,
        coins: 0,
        energyNeeded: AI_OPERATION_COSTS[jobType].energy,
        coinsNeeded: AI_OPERATION_COSTS[jobType].coins
      };
    }
  }

  /**
   * Deduct energy and coins for a job
   */
  static async deductResources(userId: string, energyCost: number, coinCost: number): Promise<boolean> {
    try {
      // Deduct energy
      const { data: energyData, error: energyError } = await supabase
        .from('user_energy')
        .select('current_energy')
        .eq('user_id', userId)
        .maybeSingle();

      if (energyError) throw energyError;

      const newEnergy = Math.max(0, (energyData?.current_energy || 0) - energyCost);

      const { error: updateEnergyError } = await supabase
        .from('user_energy')
        .update({ current_energy: newEnergy, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (updateEnergyError) throw updateEnergyError;

      // Deduct coins
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('coin_balance')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) throw profileError;

      const newCoins = Math.max(0, (profileData?.coin_balance || 0) - coinCost);

      const { error: updateCoinsError } = await supabase
        .from('profiles')
        .update({ coin_balance: newCoins })
        .eq('id', userId);

      if (updateCoinsError) throw updateCoinsError;

      // Log the transaction
      await supabase.from('coin_transactions').insert({
        user_id: userId,
        amount: -coinCost,
        transaction_type: 'debit',
        description: 'AI Pipeline Automation',
        balance_after: newCoins
      });

      return true;
    } catch (error) {
      console.error('Error deducting resources:', error);
      return false;
    }
  }

  /**
   * Create a new AI pipeline job
   */
  static async createJob(
    userId: string,
    jobType: keyof typeof AI_OPERATION_COSTS,
    prospectId?: string,
    config: any = {}
  ): Promise<{ success: boolean; jobId?: string; error?: string }> {
    try {
      // Check if user can afford this operation
      const availability = await this.checkResourceAvailability(userId, jobType);

      if (!availability.canAfford) {
        return {
          success: false,
          error: `Insufficient resources. Need ${availability.energyNeeded} energy and ${availability.coinsNeeded} coins.`
        };
      }

      const costs = AI_OPERATION_COSTS[jobType];

      // Create the job
      const { data, error } = await supabase
        .from('ai_pipeline_jobs')
        .insert({
          user_id: userId,
          prospect_id: prospectId,
          job_type: jobType,
          status: 'queued',
          config: config,
          energy_cost: costs.energy,
          coin_cost: costs.coins,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        jobId: data.id
      };
    } catch (error: any) {
      console.error('Error creating AI job:', error);
      return {
        success: false,
        error: error.message || 'Failed to create AI job'
      };
    }
  }

  /**
   * Start a queued job
   */
  static async startJob(jobId: string): Promise<boolean> {
    try {
      // Get job details
      const { data: job, error: jobError } = await supabase
        .from('ai_pipeline_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (jobError) throw jobError;

      // Check operating mode and settings
      const modeData = await OperatingModeService.getUserMode(job.user_id);
      if (!modeData) {
        throw new Error('Could not fetch user operating mode');
      }

      // Check if automation is allowed based on operating mode
      const settings = await this.getSettings(job.user_id);
      if (!this.isJobAllowedByMode(job.job_type, modeData.mode, modeData.preferences, settings)) {
        console.log(`[AI Pipeline] Job ${jobId} blocked by operating mode ${modeData.mode}`);
        await supabase
          .from('ai_pipeline_jobs')
          .update({
            status: 'stopped',
            error_message: `Job blocked by ${modeData.mode} mode settings`,
            updated_at: new Date().toISOString()
          })
          .eq('id', jobId);
        return false;
      }

      // Deduct resources
      const resourcesDeducted = await this.deductResources(
        job.user_id,
        job.energy_cost,
        job.coin_cost
      );

      if (!resourcesDeducted) {
        throw new Error('Failed to deduct resources');
      }

      // Update job status
      const { error: updateError } = await supabase
        .from('ai_pipeline_jobs')
        .update({
          status: 'running',
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);

      if (updateError) throw updateError;

      // Execute the job based on type
      this.executeJob(jobId, job.job_type, job.config, job.prospect_id);

      return true;
    } catch (error) {
      console.error('Error starting job:', error);
      return false;
    }
  }

  /**
   * Execute a job - calls real AI services
   */
  /**
   * Check if a job type is allowed based on operating mode and settings
   */
  private static isJobAllowedByMode(
    jobType: string,
    mode: OperatingMode,
    preferences: any,
    settings: AIPipelineSettings | null
  ): boolean {
    // Manual mode: Only allow jobs if explicitly enabled in settings
    if (mode === 'manual') {
      return false; // All automation disabled in manual mode
    }

    // Autopilot mode: Allow all jobs based on settings
    if (mode === 'autopilot') {
      if (!settings) return false;

      switch (jobType) {
        case 'smart_scan':
          return settings.smart_scan_enabled;
        case 'follow_up':
          return settings.auto_follow_up;
        case 'qualify':
          return settings.auto_qualify;
        case 'nurture':
          return settings.auto_nurture;
        case 'book_meeting':
          return settings.auto_book_meetings;
        case 'close_deal':
          return settings.auto_close_deals;
        case 'full_pipeline':
          return settings.smart_scan_enabled && settings.auto_follow_up;
        default:
          return false;
      }
    }

    // Hybrid mode: Allow based on preferences and settings
    if (mode === 'hybrid') {
      if (!settings || !preferences.hybrid) return false;

      switch (jobType) {
        case 'smart_scan':
          return settings.smart_scan_enabled;
        case 'follow_up':
          return settings.auto_follow_up;
        case 'qualify':
          return settings.auto_qualify && preferences.hybrid.enable_pipeline_automation;
        case 'nurture':
          return preferences.hybrid.auto_nurture_enabled;
        case 'book_meeting':
          return settings.auto_book_meetings && preferences.hybrid.enable_pipeline_automation;
        case 'close_deal':
          return false; // Hybrid always requires approval for closing
        case 'full_pipeline':
          return preferences.hybrid.enable_pipeline_automation;
        default:
          return false;
      }
    }

    return false;
  }

  private static async executeJob(
    jobId: string,
    jobType: string,
    config: any,
    prospectId?: string
  ): Promise<void> {
    try {
      console.log(`[AI Pipeline] Executing job ${jobId} of type ${jobType}`);

      let results: any = {
        message: `AI ${jobType} completed successfully`,
        timestamp: new Date().toISOString(),
        actions: []
      };

      switch (jobType) {
        case 'smart_scan':
          results = await this.executeSmartScan(prospectId);
          break;
        case 'follow_up':
          results = await this.executeFollowUp(prospectId, config);
          break;
        case 'qualify':
          results = await this.executeQualify(prospectId);
          break;
        case 'nurture':
          results = await this.executeNurture(prospectId, config);
          break;
        case 'book_meeting':
          results = await this.executeBookMeeting(prospectId);
          break;
        case 'close_deal':
          results = await this.executeCloseDeal(prospectId);
          break;
        case 'full_pipeline':
          results = await this.executeFullPipeline(prospectId, config);
          break;
      }

      // Update job as completed
      await supabase
        .from('ai_pipeline_jobs')
        .update({
          status: 'completed',
          results: results,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);

      // Log actions
      if (results.actions && Array.isArray(results.actions)) {
        for (const action of results.actions) {
          await supabase
            .from('ai_pipeline_actions')
            .insert({
              job_id: jobId,
              prospect_id: prospectId,
              action_type: action.type || jobType,
              action_data: action.data || {},
              energy_used: action.energy || 0,
              success: action.success !== false
            });
        }
      }

      console.log(`[AI Pipeline] Job ${jobId} completed successfully`);

    } catch (error: any) {
      console.error(`[AI Pipeline] Error executing job ${jobId}:`, error);

      // Mark job as failed
      await supabase
        .from('ai_pipeline_jobs')
        .update({
          status: 'failed',
          error_message: error.message || 'Unknown error',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);

      // Log failed action
      await supabase
        .from('ai_pipeline_actions')
        .insert({
          job_id: jobId,
          prospect_id: prospectId,
          action_type: jobType,
          action_data: { error: error.message },
          energy_used: 0,
          success: false
        });
    }
  }

  /**
   * Pause a running job
   */
  static async pauseJob(jobId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ai_pipeline_jobs')
        .update({
          status: 'paused',
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error pausing job:', error);
      return false;
    }
  }

  /**
   * Stop a job
   */
  static async stopJob(jobId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ai_pipeline_jobs')
        .update({
          status: 'stopped',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error stopping job:', error);
      return false;
    }
  }

  /**
   * Resume a paused job
   */
  static async resumeJob(jobId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ai_pipeline_jobs')
        .update({
          status: 'running',
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error resuming job:', error);
      return false;
    }
  }

  /**
   * Get all jobs for a user
   */
  static async getUserJobs(userId: string, limit: number = 50): Promise<AIPipelineJob[]> {
    try {
      const { data, error } = await supabase
        .from('ai_pipeline_jobs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user jobs:', error);
      return [];
    }
  }

  /**
   * Get active jobs for a user
   */
  static async getActiveJobs(userId: string): Promise<AIPipelineJob[]> {
    try {
      const { data, error } = await supabase
        .from('ai_pipeline_jobs')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['queued', 'running', 'paused'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching active jobs:', error);
      return [];
    }
  }

  /**
   * Get job actions/logs
   */
  static async getJobActions(jobId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('ai_pipeline_actions')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching job actions:', error);
      return [];
    }
  }

  /**
   * Run smart pipeline scan on all prospects
   */
  static async runSmartPipelineScan(userId: string): Promise<{ success: boolean; jobId?: string; error?: string }> {
    return await this.createJob(userId, 'smart_scan', undefined, {
      scan_all_prospects: true,
      optimize_stages: true,
      generate_insights: true
    });
  }

  /**
   * Run full pipeline automation
   */
  static async runFullPipelineAutomation(userId: string): Promise<{ success: boolean; jobId?: string; error?: string }> {
    return await this.createJob(userId, 'full_pipeline', undefined, {
      follow_up: true,
      qualify: true,
      nurture: true,
      book_meetings: true,
      close_deals: true
    });
  }

  // ========================================================================
  // PRIVATE EXECUTION METHODS - Call Real AI Engines
  // ========================================================================

  /**
   * Execute smart scan on a prospect
   */
  private static async executeSmartScan(prospectId?: string): Promise<any> {
    if (!prospectId) {
      throw new Error('Prospect ID required for smart scan');
    }

    const actions = [];

    // Get prospect data
    const { data: prospect } = await supabase
      .from('prospects')
      .select('*')
      .eq('id', prospectId)
      .single();

    if (!prospect) {
      throw new Error('Prospect not found');
    }

    // Call ScoutScore V5 engine
    const { calculateScoutScoreV5 } = await import('./scoutScoreV5');
    const scoreResult = calculateScoutScoreV5({
      text: prospect.metadata?.bio || '',
      occupation: prospect.metadata?.occupation,
      interests: prospect.metadata?.interests || [],
      signals: prospect.metadata?.signals || [],
      painPoints: prospect.metadata?.pain_points || [],
      followers: prospect.metadata?.followers || 0,
      engagement: prospect.metadata?.engagement_rate || 0,
      mutualFriends: prospect.metadata?.mutual_friends || 0
    });

    // Update prospect with score
    await supabase
      .from('prospects')
      .update({
        metadata: {
          ...prospect.metadata,
          scout_score: scoreResult.score,
          scout_rank: scoreResult.rank,
          scout_confidence: scoreResult.confidence,
          scout_breakdown: scoreResult.breakdown,
          last_scored_at: new Date().toISOString()
        }
      })
      .eq('id', prospectId);

    actions.push({
      type: 'score_calculated',
      data: { score: scoreResult.score, rank: scoreResult.rank },
      success: true,
      energy: 5
    });

    // Auto-move to appropriate pipeline stage based on score
    let newStage = prospect.pipeline_stage;
    if (scoreResult.score >= 80 && scoreResult.rank === 'hot') {
      newStage = 'qualified';
    } else if (scoreResult.score >= 60 && scoreResult.rank === 'warm') {
      newStage = 'discovery';
    }

    if (newStage !== prospect.pipeline_stage) {
      await supabase
        .from('prospects')
        .update({ pipeline_stage: newStage })
        .eq('id', prospectId);

      actions.push({
        type: 'stage_updated',
        data: { from: prospect.pipeline_stage, to: newStage },
        success: true,
        energy: 2
      });
    }

    return {
      score: scoreResult.score,
      rank: scoreResult.rank,
      stage: newStage,
      actions
    };
  }

  /**
   * Execute follow-up sequence
   */
  private static async executeFollowUp(prospectId?: string, config: any = {}): Promise<any> {
    if (!prospectId) {
      throw new Error('Prospect ID required for follow-up');
    }

    const actions = [];

    // Get prospect and user data
    const { data: prospect } = await supabase
      .from('prospects')
      .select('*, profiles!inner(id, full_name, company_profiles(company_name))')
      .eq('id', prospectId)
      .single();

    if (!prospect) {
      throw new Error('Prospect not found');
    }

    // Generate AI follow-up message
    const { generateFollowUpMessage } = await import('./ai/messagingEngine');
    const message = await generateFollowUpMessage({
      prospectName: prospect.full_name,
      prospectData: prospect.metadata,
      stage: prospect.pipeline_stage,
      timing: config.timing || 'next_day'
    });

    // Store generated message (don't auto-send yet - user approves)
    const { data: generatedMessage } = await supabase
      .from('ai_generated_messages')
      .insert({
        user_id: prospect.user_id,
        prospect_id: prospectId,
        message_type: 'follow_up',
        message_content: message.content,
        channel: 'facebook',
        status: 'draft',
        ai_confidence: message.confidence || 0.8,
        metadata: { ...message.metadata, job_type: 'follow_up' }
      })
      .select()
      .single();

    actions.push({
      type: 'message_generated',
      data: {
        messageId: generatedMessage?.id,
        preview: message.content.substring(0, 100),
        confidence: message.confidence
      },
      success: true,
      energy: 8
    });

    // Create notification for user to review
    await supabase.from('notifications').insert({
      user_id: prospect.user_id,
      type: 'ai_message_ready',
      title: 'AI Follow-up Ready',
      message: `Review follow-up message for ${prospect.full_name}`,
      data: {
        prospect_id: prospectId,
        message_id: generatedMessage?.id
      }
    });

    return {
      message_generated: true,
      message_id: generatedMessage?.id,
      requires_approval: true,
      actions
    };
  }

  /**
   * Execute qualification
   */
  private static async executeQualify(prospectId?: string): Promise<any> {
    if (!prospectId) {
      throw new Error('Prospect ID required for qualification');
    }

    const actions = [];

    // Get prospect data
    const { data: prospect } = await supabase
      .from('prospects')
      .select('*')
      .eq('id', prospectId)
      .single();

    if (!prospect) {
      throw new Error('Prospect not found');
    }

    // Simple qualification logic (can be enhanced with AI)
    const qualificationScore = {
      hasContact: prospect.email || prospect.phone ? 25 : 0,
      hasEngagement: (prospect.metadata?.scout_score || 0) > 60 ? 25 : 0,
      hasIntent: (prospect.metadata?.pain_points?.length || 0) > 0 ? 25 : 0,
      isActive: prospect.last_seen_activity_at ? 25 : 0
    };

    const totalScore = Object.values(qualificationScore).reduce((a, b) => a + b, 0);
    const isQualified = totalScore >= 50;

    // Update prospect qualification status
    await supabase
      .from('prospects')
      .update({
        metadata: {
          ...prospect.metadata,
          qualification_score: totalScore,
          qualified: isQualified,
          qualified_at: isQualified ? new Date().toISOString() : null
        },
        pipeline_stage: isQualified ? 'qualified' : prospect.pipeline_stage
      })
      .eq('id', prospectId);

    actions.push({
      type: 'qualification_completed',
      data: { score: totalScore, qualified: isQualified },
      success: true,
      energy: 10
    });

    return {
      qualified: isQualified,
      score: totalScore,
      breakdown: qualificationScore,
      actions
    };
  }

  /**
   * Execute nurture sequence
   */
  private static async executeNurture(prospectId?: string, config: any = {}): Promise<any> {
    if (!prospectId) {
      throw new Error('Prospect ID required for nurture');
    }

    const actions = [];

    // Get prospect data
    const { data: prospect } = await supabase
      .from('prospects')
      .select('*')
      .eq('id', prospectId)
      .single();

    if (!prospect) {
      throw new Error('Prospect not found');
    }

    // Generate nurture sequence (series of messages over time)
    const sequenceLength = config.duration_days || 7;
    const messageCount = Math.min(sequenceLength, 5);

    for (let i = 0; i < messageCount; i++) {
      const dayOffset = Math.floor((i + 1) * (sequenceLength / messageCount));

      // Generate message for this touchpoint
      const { data: message } = await supabase
        .from('ai_generated_messages')
        .insert({
          user_id: prospect.user_id,
          prospect_id: prospectId,
          message_type: 'nurture',
          message_content: `Nurture message ${i + 1} - Day ${dayOffset}`,
          channel: 'facebook',
          status: 'scheduled',
          scheduled_for: new Date(Date.now() + dayOffset * 24 * 60 * 60 * 1000).toISOString(),
          metadata: { sequence_position: i + 1, total_messages: messageCount }
        })
        .select()
        .single();

      actions.push({
        type: 'nurture_message_scheduled',
        data: { messageId: message?.id, dayOffset },
        success: true,
        energy: 5
      });
    }

    return {
      sequence_created: true,
      message_count: messageCount,
      duration_days: sequenceLength,
      actions
    };
  }

  /**
   * Execute meeting booking
   */
  private static async executeBookMeeting(prospectId?: string): Promise<any> {
    if (!prospectId) {
      throw new Error('Prospect ID required for meeting booking');
    }

    const actions = [];

    // Get prospect data
    const { data: prospect } = await supabase
      .from('prospects')
      .select('*')
      .eq('id', prospectId)
      .single();

    if (!prospect) {
      throw new Error('Prospect not found');
    }

    // Find optimal meeting times (next 3 business days, 9am-5pm slots)
    const optimalTimes = [];
    for (let i = 1; i <= 3; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);

      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      optimalTimes.push({
        date: date.toISOString().split('T')[0],
        time: '10:00',
        available: true
      });
    }

    // Generate meeting invite message
    const inviteMessage = `Hi ${prospect.full_name}, I'd love to schedule a quick call to discuss how we can help. Are any of these times convenient for you?\n\n${optimalTimes.map((t, i) => `${i + 1}. ${t.date} at ${t.time}`).join('\n')}`;

    // Store meeting invite
    const { data: message } = await supabase
      .from('ai_generated_messages')
      .insert({
        user_id: prospect.user_id,
        prospect_id: prospectId,
        message_type: 'meeting_invite',
        message_content: inviteMessage,
        channel: 'email',
        status: 'draft',
        metadata: { meeting_times: optimalTimes }
      })
      .select()
      .single();

    actions.push({
      type: 'meeting_invite_created',
      data: { messageId: message?.id, timesOffered: optimalTimes.length },
      success: true,
      energy: 15
    });

    return {
      invite_created: true,
      message_id: message?.id,
      times_offered: optimalTimes,
      actions
    };
  }

  /**
   * Execute deal closing
   */
  private static async executeCloseDeal(prospectId?: string): Promise<any> {
    if (!prospectId) {
      throw new Error('Prospect ID required for closing');
    }

    const actions = [];

    // Get prospect data
    const { data: prospect } = await supabase
      .from('prospects')
      .select('*')
      .eq('id', prospectId)
      .single();

    if (!prospect) {
      throw new Error('Prospect not found');
    }

    // Generate closing proposal
    const proposal = {
      prospect_id: prospectId,
      title: `Proposal for ${prospect.full_name}`,
      summary: 'AI-generated proposal based on prospect needs',
      value_proposition: 'Tailored solution addressing key pain points',
      pricing: { base: 0, total: 0 },
      objections_handled: [],
      next_steps: ['Review proposal', 'Schedule call', 'Close deal']
    };

    // Store proposal
    const { data: saved } = await supabase
      .from('ai_proposals')
      .insert({
        user_id: prospect.user_id,
        prospect_id: prospectId,
        proposal_data: proposal,
        status: 'draft'
      })
      .select()
      .single();

    actions.push({
      type: 'proposal_generated',
      data: { proposalId: saved?.id },
      success: true,
      energy: 25
    });

    return {
      proposal_created: true,
      proposal_id: saved?.id,
      requires_review: true,
      actions
    };
  }

  /**
   * Execute full pipeline automation
   */
  private static async executeFullPipeline(prospectId?: string, config: any = {}): Promise<any> {
    if (!prospectId) {
      throw new Error('Prospect ID required for full pipeline');
    }

    const actions = [];

    // Step 1: Smart scan and scoring
    const scanResult = await this.executeSmartScan(prospectId);
    actions.push(...scanResult.actions);

    // Step 2: Qualify if score is high enough
    if (scanResult.score >= 60) {
      const qualifyResult = await this.executeQualify(prospectId);
      actions.push(...qualifyResult.actions);

      // Step 3: Send follow-up if qualified
      if (qualifyResult.qualified) {
        const followUpResult = await this.executeFollowUp(prospectId, { timing: 'immediate' });
        actions.push(...followUpResult.actions);
      }
    }

    return {
      pipeline_completed: true,
      final_score: scanResult.score,
      final_stage: scanResult.stage,
      actions
    };
  }
}
