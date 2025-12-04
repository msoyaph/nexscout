import { supabase } from '../../lib/supabase';

interface Prospect {
  id: string;
  full_name: string;
  metadata: any;
  last_seen_activity_at: string;
  next_follow_up: string;
  pipeline_stage: string;
  temperature: string;
}

export async function generateAITasksForUser(userId: string) {
  try {
    const { data: prospects, error } = await supabase
      .from('prospects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const tasks: any[] = [];

    for (const prospect of prospects || []) {
      const prospectTasks = analyzeProspectForTasks(prospect);
      tasks.push(...prospectTasks);
    }

    if (tasks.length > 0) {
      const { error: insertError } = await supabase
        .from('ai_tasks')
        .insert(tasks.map(task => ({ ...task, user_id: userId })));

      if (insertError) throw insertError;
    }

    return { success: true, tasksGenerated: tasks.length };
  } catch (error) {
    console.error('Error generating AI tasks:', error);
    return { success: false, error };
  }
}

function analyzeProspectForTasks(prospect: Prospect): any[] {
  const tasks: any[] = [];
  const now = new Date();
  const lastContact = prospect.last_seen_activity_at ? new Date(prospect.last_seen_activity_at) : null;
  const nextFollowUp = prospect.next_follow_up ? new Date(prospect.next_follow_up) : null;
  const scoutScore = prospect.metadata?.scout_score || 0;

  if (nextFollowUp && nextFollowUp <= new Date(now.getTime() + 24 * 60 * 60 * 1000)) {
    tasks.push({
      prospect_id: prospect.id,
      title: `Follow up with ${prospect.full_name}`,
      description: `Scheduled follow-up is due soon. Check their latest activity and reach out.`,
      task_type: 'ai_suggested',
      priority: scoutScore >= 80 ? 'high' : 'medium',
      status: 'pending',
      due_time: nextFollowUp,
      ai_reasoning: `Next follow-up date is approaching. High-priority prospect based on ScoutScore ${scoutScore}.`,
      metadata: {
        prospect_name: prospect.full_name,
        scout_score: scoutScore,
        pipeline_stage: prospect.pipeline_stage
      }
    });
  }

  if (lastContact && (now.getTime() - lastContact.getTime()) > 3 * 24 * 60 * 60 * 1000) {
    if (scoutScore >= 70 && prospect.temperature === 'hot') {
      tasks.push({
        prospect_id: prospect.id,
        title: `Urgent: Re-engage ${prospect.full_name}`,
        description: `High-value prospect hasn't been contacted in ${Math.floor((now.getTime() - lastContact.getTime()) / (24 * 60 * 60 * 1000))} days.`,
        task_type: 'ai_generated',
        priority: 'high',
        status: 'pending',
        due_time: new Date(now.getTime() + 2 * 60 * 60 * 1000),
        ai_reasoning: `Hot prospect (Score: ${scoutScore}) going cold. Immediate action required.`,
        metadata: {
          prospect_name: prospect.full_name,
          scout_score: scoutScore,
          days_since_contact: Math.floor((now.getTime() - lastContact.getTime()) / (24 * 60 * 60 * 1000))
        }
      });
    }
  }

  if (prospect.pipeline_stage === 'engage' && scoutScore >= 85) {
    tasks.push({
      prospect_id: prospect.id,
      title: `Schedule demo with ${prospect.full_name}`,
      description: `High score prospect in engagement stage. Time to move to closing.`,
      task_type: 'ai_suggested',
      priority: 'high',
      status: 'pending',
      due_time: new Date(now.getTime() + 4 * 60 * 60 * 1000),
      ai_reasoning: `Prospect shows strong engagement (Score: ${scoutScore}). Perfect timing for demo.`,
      metadata: {
        prospect_name: prospect.full_name,
        scout_score: scoutScore,
        pipeline_stage: prospect.pipeline_stage
      }
    });
  }

  return tasks;
}

export async function generateAIAlertsForUser(userId: string) {
  try {
    const { data: prospects, error } = await supabase
      .from('prospects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const existingAlerts = await supabase
      .from('ai_alerts')
      .select('prospect_id')
      .eq('user_id', userId)
      .eq('is_dismissed', false);

    const existingProspectIds = new Set(
      (existingAlerts.data || []).map((a: any) => a.prospect_id)
    );

    const alerts: any[] = [];

    for (const prospect of prospects || []) {
      if (existingProspectIds.has(prospect.id)) continue;

      const prospectAlerts = analyzeProspectForAlerts(prospect);
      alerts.push(...prospectAlerts);
    }

    if (alerts.length > 0) {
      const { error: insertError } = await supabase
        .from('ai_alerts')
        .insert(alerts.map(alert => ({ ...alert, user_id: userId })));

      if (insertError) throw insertError;
    }

    return { success: true, alertsGenerated: alerts.length };
  } catch (error) {
    console.error('Error generating AI alerts:', error);
    return { success: false, error };
  }
}

function analyzeProspectForAlerts(prospect: Prospect): any[] {
  const alerts: any[] = [];
  const now = new Date();
  const lastContact = prospect.last_seen_activity_at ? new Date(prospect.last_seen_activity_at) : null;
  const scoutScore = prospect.metadata?.scout_score || 0;
  const engagementScore = prospect.metadata?.engagement_score || 0;

  if (lastContact && (now.getTime() - lastContact.getTime()) > 2 * 24 * 60 * 60 * 1000) {
    if (scoutScore >= 80) {
      const daysSince = Math.floor((now.getTime() - lastContact.getTime()) / (24 * 60 * 60 * 1000));
      alerts.push({
        prospect_id: prospect.id,
        alert_type: 'cold_prospect',
        priority: 'urgent',
        title: `${prospect.full_name} (Score ${scoutScore}) hasn't been contacted in ${daysSince} days`,
        message: 'High-value prospect going cold. Reach out today to re-engage.',
        action_required: `Send follow-up message to ${prospect.full_name}`,
        ai_confidence: 0.92,
        metadata: {
          prospect_name: prospect.full_name,
          scout_score: scoutScore,
          days_since_contact: daysSince
        },
        expires_at: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      });
    }
  }

  if (scoutScore >= 90 && prospect.pipeline_stage === 'engage') {
    alerts.push({
      prospect_id: prospect.id,
      alert_type: 'hot_prospect',
      priority: 'high',
      title: `${prospect.full_name} is ready to close`,
      message: 'All buying signals present. Move to closing stage and send proposal.',
      action_required: 'Send contract or proposal',
      ai_confidence: 0.88,
      metadata: {
        prospect_name: prospect.full_name,
        scout_score: scoutScore,
        pipeline_stage: prospect.pipeline_stage
      },
      expires_at: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    });
  }

  const bestTimeToContact = prospect.metadata?.best_contact_time;
  if (bestTimeToContact && engagementScore >= 75) {
    alerts.push({
      prospect_id: prospect.id,
      alert_type: 'timing_suggestion',
      priority: 'medium',
      title: `AI Suggestion: Message ${prospect.full_name} ${bestTimeToContact}`,
      message: `Based on activity patterns, they're most responsive during ${bestTimeToContact}.`,
      action_required: `Schedule message for ${bestTimeToContact}`,
      ai_confidence: 0.85,
      metadata: {
        prospect_name: prospect.full_name,
        best_contact_time: bestTimeToContact,
        engagement_score: engagementScore
      },
      expires_at: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
    });
  }

  return alerts;
}

export async function dismissAlert(alertId: string) {
  try {
    const { error } = await supabase
      .from('ai_alerts')
      .update({ is_dismissed: true })
      .eq('id', alertId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error dismissing alert:', error);
    return { success: false, error };
  }
}

export async function markAlertAsRead(alertId: string) {
  try {
    const { error } = await supabase
      .from('ai_alerts')
      .update({ is_read: true })
      .eq('id', alertId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error marking alert as read:', error);
    return { success: false, error };
  }
}

export async function completeTask(taskId: string) {
  try {
    const { error } = await supabase
      .from('ai_tasks')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error completing task:', error);
    return { success: false, error };
  }
}

export async function dismissTask(taskId: string) {
  try {
    const { error } = await supabase
      .from('ai_tasks')
      .update({
        status: 'dismissed',
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error dismissing task:', error);
    return { success: false, error };
  }
}
