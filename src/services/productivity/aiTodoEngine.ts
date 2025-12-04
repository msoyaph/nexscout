import { supabase } from '../../lib/supabase';

interface TodoTrigger {
  userId: string;
  prospectId?: string;
  companyId?: string;
  title: string;
  description?: string;
  taskType: 'send_content' | 'create_deck' | 'review_notes' | 'fix_data' | 'upload_material' | 'respond_chat' | 'move_pipeline' | 'scan_data' | 'call_prospect' | 'send_message' | 'schedule_meeting' | 'follow_up';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  source: string;
  dueDate?: Date;
  aiReasoning?: string;
  linkedPage?: string;
  navigationData?: any;
  autoCompleteTrigger?: string;
  progressTotal?: number;
}

export class AITodoEngine {
  static async createTodo(trigger: TodoTrigger) {
    try {
      const { data, error } = await supabase
        .from('todos')
        .insert({
          user_id: trigger.userId,
          prospect_id: trigger.prospectId,
          company_id: trigger.companyId,
          title: trigger.title,
          description: trigger.description,
          task_type: trigger.taskType,
          priority: trigger.priority,
          source: trigger.source,
          due_date: trigger.dueDate?.toISOString().split('T')[0],
          auto_ai_generated: true,
          auto_complete_trigger: trigger.autoCompleteTrigger,
          ai_reasoning: trigger.aiReasoning,
          linked_page: trigger.linkedPage,
          navigation_data: trigger.navigationData,
          progress_total: trigger.progressTotal || 1,
        })
        .select()
        .single();

      if (error) throw error;

      await this.logAITask(trigger.userId, 'todo', data.id, trigger.source, trigger.aiReasoning || '');

      return data;
    } catch (error) {
      console.error('Error creating AI todo:', error);
      throw error;
    }
  }

  static async createSendContentTodo(userId: string, prospectId: string, prospectName: string, contentType: string) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 1);

    return this.createTodo({
      userId,
      prospectId,
      title: `Send ${contentType} to ${prospectName}`,
      description: `AI detected interest in ${contentType}. Send personalized content to maintain engagement.`,
      taskType: 'send_content',
      priority: 'high',
      source: 'ai',
      dueDate,
      aiReasoning: `Prospect showed interest signals for ${contentType}. Sending within 24h increases engagement by 45%.`,
      linkedPage: 'prospect-detail',
      navigationData: { prospectId, action: 'send_content', contentType },
      autoCompleteTrigger: 'content_sent',
    });
  }

  static async createPitchDeckTodo(userId: string, prospectId: string, prospectName: string) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 2);

    return this.createTodo({
      userId,
      prospectId,
      title: `Create personalized pitch deck for ${prospectName}`,
      description: `Generate AI-powered pitch deck tailored to ${prospectName}'s pain points and interests.`,
      taskType: 'create_deck',
      priority: 'high',
      source: 'ai',
      dueDate,
      aiReasoning: `Prospect reached qualification threshold. Personalized decks increase close rate by 52%.`,
      linkedPage: 'pitch-decks',
      navigationData: { prospectId, action: 'generate_deck' },
      autoCompleteTrigger: 'deck_generated',
    });
  }

  static async createFixCompanyDataTodo(userId: string, missingFields: string[]) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);

    return this.createTodo({
      userId,
      title: `Fix company description (Missing: ${missingFields.join(', ')})`,
      description: `AI detected missing company information: ${missingFields.join(', ')}. Complete your profile for better AI accuracy.`,
      taskType: 'fix_data',
      priority: 'medium',
      source: 'ai',
      dueDate,
      aiReasoning: `Incomplete company data reduces AI accuracy by 30%. Complete profile improves lead quality.`,
      linkedPage: 'about-my-company',
      autoCompleteTrigger: 'company_data_complete',
      progressTotal: missingFields.length,
    });
  }

  static async createUploadMaterialTodo(userId: string, materialType: string) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 5);

    return this.createTodo({
      userId,
      title: `Upload ${materialType} to improve AI accuracy`,
      description: `Add ${materialType} so AI can generate better content and responses.`,
      taskType: 'upload_material',
      priority: 'medium',
      source: 'ai',
      dueDate,
      aiReasoning: `${materialType} will enhance AI personalization and increase conversion rates.`,
      linkedPage: 'about-my-company',
      autoCompleteTrigger: 'material_uploaded',
    });
  }

  static async createRespondChatTodo(userId: string, chatSessionId: string, prospectName: string, urgency: string) {
    const priority = urgency === 'urgent' ? 'urgent' : 'high';
    const dueDate = new Date();
    dueDate.setHours(dueDate.getHours() + (urgency === 'urgent' ? 1 : 6));

    return this.createTodo({
      userId,
      title: `Respond to unread chatbot messages from ${prospectName}`,
      description: `${prospectName} sent messages via AI chatbot. Response needed.`,
      taskType: 'respond_chat',
      priority,
      source: 'chatbot',
      dueDate,
      aiReasoning: `Unread chatbot messages. Quick response maintains engagement and prevents drop-off.`,
      linkedPage: 'chatbot-sessions',
      navigationData: { sessionId: chatSessionId },
      autoCompleteTrigger: 'chat_responded',
    });
  }

  static async createMovePipelineTodo(userId: string, prospectId: string, prospectName: string, currentStage: string, nextStage: string) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 1);

    return this.createTodo({
      userId,
      prospectId,
      title: `Move ${prospectName} from ${currentStage} to ${nextStage}`,
      description: `AI detects ${prospectName} is ready to advance. Review and move to next stage.`,
      taskType: 'move_pipeline',
      priority: 'high',
      source: 'pipeline',
      dueDate,
      aiReasoning: `Prospect behavior indicates readiness for ${nextStage}. Timely progression increases close rate.`,
      linkedPage: 'pipeline',
      navigationData: { prospectId, currentStage, nextStage },
      autoCompleteTrigger: 'stage_moved',
    });
  }

  static async createScanMoreDataTodo(userId: string, currentCount: number, targetCount: number) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    return this.createTodo({
      userId,
      title: `Scan more data to increase accuracy score`,
      description: `Current: ${currentCount} prospects. Target: ${targetCount}+ for optimal AI performance.`,
      taskType: 'scan_data',
      priority: 'low',
      source: 'ai',
      dueDate,
      aiReasoning: `More prospect data improves AI pattern recognition and prediction accuracy by up to 40%.`,
      linkedPage: 'scan-entry',
      progressTotal: targetCount - currentCount,
    });
  }

  static async getUserTodos(userId: string, filters?: {
    completed?: boolean;
    priority?: string;
    type?: string;
    timeframe?: 'today' | 'upcoming' | 'past';
  }) {
    try {
      let query = supabase
        .from('todos')
        .select('*, prospects(full_name, profile_image_url)')
        .eq('user_id', userId)
        .order('priority', { ascending: false })
        .order('due_date', { ascending: true });

      if (filters?.completed !== undefined) {
        query = query.eq('completed', filters.completed);
      }

      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }

      if (filters?.type) {
        query = query.eq('task_type', filters.type);
      }

      if (filters?.timeframe === 'today') {
        const today = new Date().toISOString().split('T')[0];
        query = query.eq('due_date', today);
      } else if (filters?.timeframe === 'upcoming') {
        const today = new Date().toISOString().split('T')[0];
        query = query.gte('due_date', today);
      } else if (filters?.timeframe === 'past') {
        const today = new Date().toISOString().split('T')[0];
        query = query.lt('due_date', today);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching todos:', error);
      return [];
    }
  }

  static async completeTodo(todoId: string, userId: string) {
    try {
      const { error } = await supabase
        .from('todos')
        .update({
          completed: true,
          completed_at: new Date().toISOString(),
          progress_current: supabase.raw('progress_total'),
        })
        .eq('id', todoId)
        .eq('user_id', userId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error completing todo:', error);
      return false;
    }
  }

  static async updateProgress(todoId: string, userId: string, progress: number) {
    try {
      const { error } = await supabase
        .from('todos')
        .update({ progress_current: progress })
        .eq('id', todoId)
        .eq('user_id', userId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error updating todo progress:', error);
      return false;
    }
  }

  private static async logAITask(userId: string, taskType: string, taskId: string, triggerSource: string, aiReasoning: string) {
    try {
      await supabase
        .from('ai_generated_tasks')
        .insert({
          user_id: userId,
          task_type: taskType,
          task_id: taskId,
          trigger_source: triggerSource,
          trigger_event: 'auto_todo_created',
          ai_reasoning: aiReasoning,
          confidence_score: 0.82,
        });
    } catch (error) {
      console.error('Error logging AI task:', error);
    }
  }

  static async getCompletionStats(userId: string, days: number = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('todos')
        .select('completed, priority')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      const total = data?.length || 0;
      const completed = data?.filter(t => t.completed).length || 0;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        total,
        completed,
        pending: total - completed,
        completionRate,
      };
    } catch (error) {
      console.error('Error getting completion stats:', error);
      return { total: 0, completed: 0, pending: 0, completionRate: 0 };
    }
  }
}
