import { supabase } from '../../lib/supabase';
import { AITodoEngine } from './aiTodoEngine';
import { AIReminderEngine } from './aiReminderEngine';
import { AICalendarEngine } from './aiCalendarEngine';

export class DailyBlueprintEngine {
  static async generateDailyBlueprint(userId: string) {
    try {
      const today = new Date();
      const blueprintDate = today.toISOString().split('T')[0];

      const existingBlueprint = await supabase
        .from('productivity_blueprints')
        .select('id')
        .eq('user_id', userId)
        .eq('blueprint_date', blueprintDate)
        .maybeSingle();

      if (existingBlueprint.data) {
        return existingBlueprint.data;
      }

      const [taskSummary, hotLeads, calendarSuggestions, energyPlan, coinPlan, aiInsights] = await Promise.all([
        this.generateTaskSummary(userId),
        this.identifyHotLeads(userId),
        this.generateCalendarSuggestions(userId),
        this.generateEnergyPlan(userId),
        this.generateCoinPlan(userId),
        this.generateAIInsights(userId),
      ]);

      const { data, error } = await supabase
        .from('productivity_blueprints')
        .insert({
          user_id: userId,
          blueprint_date: blueprintDate,
          task_summary: taskSummary,
          hot_leads: hotLeads,
          calendar_suggestions: calendarSuggestions,
          energy_plan: energyPlan,
          coin_plan: coinPlan,
          ai_insights: aiInsights,
        })
        .select()
        .single();

      if (error) throw error;

      await this.sendBlueprintNotification(userId, data.id);

      return data;
    } catch (error) {
      console.error('Error generating daily blueprint:', error);
      throw error;
    }
  }

  private static async generateTaskSummary(userId: string) {
    const today = new Date().toISOString().split('T')[0];

    const [todos, reminders, events] = await Promise.all([
      AITodoEngine.getUserTodos(userId, { completed: false, timeframe: 'today' }),
      AIReminderEngine.getUserReminders(userId, { completed: false }),
      AICalendarEngine.getEventsForDay(userId, new Date()),
    ]);

    const stats = await AITodoEngine.getCompletionStats(userId, 7);

    return {
      total_tasks: todos.length,
      total_reminders: reminders.length,
      total_events: events.length,
      completion_rate_7d: stats.completionRate,
      urgent_tasks: todos.filter(t => t.priority === 'urgent').length,
      high_priority_tasks: todos.filter(t => t.priority === 'high').length,
      tasks_by_type: this.groupByType(todos),
      top_priorities: todos.slice(0, 5).map(t => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        type: t.task_type,
      })),
    };
  }

  private static async identifyHotLeads(userId: string) {
    const { data: prospects, error } = await supabase
      .from('prospects')
      .select('id, full_name, metadata, last_interaction_at, pipeline_stage')
      .eq('user_id', userId)
      .eq('is_unlocked', true);

    if (error) throw error;

    const hotLeads = (prospects || [])
      .filter(p => {
        const score = p.metadata?.scout_score || 0;
        const daysSinceInteraction = p.last_interaction_at
          ? Math.floor((Date.now() - new Date(p.last_interaction_at).getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        return score >= 75 && daysSinceInteraction <= 7;
      })
      .sort((a, b) => (b.metadata?.scout_score || 0) - (a.metadata?.scout_score || 0))
      .slice(0, 10)
      .map(p => ({
        id: p.id,
        name: p.full_name,
        score: p.metadata?.scout_score || 0,
        stage: p.pipeline_stage,
        days_since_contact: p.last_interaction_at
          ? Math.floor((Date.now() - new Date(p.last_interaction_at).getTime()) / (1000 * 60 * 60 * 24))
          : 999,
        recommended_action: this.getRecommendedAction(p),
      }));

    return hotLeads;
  }

  private static getRecommendedAction(prospect: any): string {
    const score = prospect.metadata?.scout_score || 0;
    const stage = prospect.pipeline_stage;

    if (score >= 90) return 'Schedule closing call';
    if (score >= 80 && stage === 'contacted') return 'Move to presentation';
    if (score >= 75 && stage === 'discover') return 'Initial contact';
    return 'Follow up';
  }

  private static async generateCalendarSuggestions(userId: string) {
    const prospects = await this.identifyHotLeads(userId);

    const suggestions = prospects.slice(0, 5).map((lead, index) => {
      const suggestedTime = new Date();
      suggestedTime.setDate(suggestedTime.getDate() + index + 1);
      suggestedTime.setHours(10 + index, 0, 0, 0);

      return {
        prospect_id: lead.id,
        prospect_name: lead.name,
        event_type: 'meeting',
        suggested_time: suggestedTime.toISOString(),
        reason: `High score (${lead.score}) + ${lead.recommended_action}`,
        auto_create: false,
      };
    });

    return suggestions;
  }

  private static async generateEnergyPlan(userId: string) {
    const { data: userEnergy } = await supabase
      .from('user_energy')
      .select('current_energy, max_energy')
      .eq('user_id', userId)
      .single();

    const todayTasks = await AITodoEngine.getUserTodos(userId, { completed: false, timeframe: 'today' });

    const estimatedUsage = todayTasks.length * 15;

    return {
      current: userEnergy?.current_energy || 0,
      max: userEnergy?.max_energy || 100,
      estimated_usage_today: estimatedUsage,
      will_need_refill: estimatedUsage > (userEnergy?.current_energy || 0),
      suggested_refill_time: '2:00 PM',
      efficiency_tips: [
        'Batch similar tasks to save energy',
        'Use AI Smart Scanner for bulk operations',
        'Upgrade to Pro for 50% more energy',
      ],
    };
  }

  private static async generateCoinPlan(userId: string) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('coin_balance, subscription_tier')
      .eq('id', userId)
      .single();

    const todayTasks = await AITodoEngine.getUserTodos(userId, { completed: false, timeframe: 'today' });

    const estimatedEarnings = todayTasks.filter(t => t.auto_ai_generated).length * 10;

    return {
      current_balance: profile?.coin_balance || 0,
      estimated_earnings_today: estimatedEarnings,
      suggested_spending: 'Save for premium AI features',
      opportunities: [
        { action: 'Complete 5 AI tasks', reward: 50 },
        { action: 'Scan 10 prospects', reward: 100 },
        { action: 'Close a deal', reward: 500 },
      ],
    };
  }

  private static async generateAIInsights(userId: string) {
    const [todos, reminders, prospects] = await Promise.all([
      AITodoEngine.getUserTodos(userId, { completed: false }),
      AIReminderEngine.getUserReminders(userId, { completed: false }),
      supabase.from('prospects').select('id, metadata').eq('user_id', userId).eq('is_unlocked', true),
    ]);

    const insights = [];

    if (todos.length > 10) {
      insights.push('You have many pending tasks. Consider prioritizing or delegating.');
    }

    if (reminders.length > 15) {
      insights.push('High reminder count. Focus on completing top priorities first.');
    }

    const hotProspects = (prospects.data || []).filter(p => (p.metadata?.scout_score || 0) >= 80).length;
    if (hotProspects > 5) {
      insights.push(`You have ${hotProspects} hot leads. Schedule follow-ups today!`);
    }

    const stats = await AITodoEngine.getCompletionStats(userId, 7);
    if (stats.completionRate < 50) {
      insights.push('Completion rate is low. Break tasks into smaller steps.');
    } else if (stats.completionRate > 80) {
      insights.push('Great productivity! Keep up the momentum.');
    }

    return insights.join(' ');
  }

  private static groupByType(todos: any[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    for (const todo of todos) {
      grouped[todo.task_type] = (grouped[todo.task_type] || 0) + 1;
    }
    return grouped;
  }

  private static async sendBlueprintNotification(userId: string, blueprintId: string) {
    try {
      await supabase
        .from('notification_queue')
        .insert({
          user_id: userId,
          notification_type: 'ai_task',
          title: '🌅 Your Daily Productivity Blueprint is Ready',
          message: 'Check your personalized plan for today',
          channels: ['push'],
          priority: 'medium',
          linked_item_type: 'productivity_blueprint',
          linked_item_id: blueprintId,
        });
    } catch (error) {
      console.error('Error sending blueprint notification:', error);
    }
  }

  static async getTodayBlueprint(userId: string) {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('productivity_blueprints')
        .select('*')
        .eq('user_id', userId)
        .eq('blueprint_date', today)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        return await this.generateDailyBlueprint(userId);
      }

      if (!data.viewed) {
        await supabase
          .from('productivity_blueprints')
          .update({ viewed: true })
          .eq('id', data.id);
      }

      return data;
    } catch (error) {
      console.error('Error getting today blueprint:', error);
      return null;
    }
  }
}
