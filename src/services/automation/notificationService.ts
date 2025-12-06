/**
 * Automation Notification Service
 * 
 * Handles success/failure notifications for automations
 * Provides next action suggestions
 */

export interface AutomationNotification {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  action?: string; // Automation type that completed
  prospectName?: string;
  results?: any;
  nextActions?: NextAction[];
  duration?: number; // ms to show
}

export interface NextAction {
  label: string;
  action: string;
  cost: { energy: number; coins: number };
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export class AutomationNotificationService {
  /**
   * Create success notification for completed automation
   */
  static createSuccessNotification(
    action: string,
    prospectName: string,
    results: any,
    nextRecommendations?: NextAction[]
  ): AutomationNotification {
    const notifications: Record<string, Omit<AutomationNotification, 'nextActions'>> = {
      smart_scan: {
        type: 'success',
        title: '🎉 Smart Scan Complete!',
        message: `Analyzed ${prospectName} successfully`,
        action,
        prospectName,
        results: {
          scoutScore: results.scoutScore,
          painPoints: results.painPoints?.length || 0,
          buyingSignals: results.buyingSignals?.length || 0,
        },
        duration: 8000,
      },
      
      follow_up: {
        type: 'success',
        title: '🎉 Follow-Up Sent!',
        message: `Message sent to ${prospectName}`,
        action,
        prospectName,
        results: {
          quality: results.qualityScore || 0,
          messageLength: results.message?.length || 0,
          expectedReplyRate: '34%',
        },
        duration: 8000,
      },
      
      qualify: {
        type: 'success',
        title: '✅ Qualification Complete!',
        message: `${prospectName} has been assessed`,
        action,
        prospectName,
        results: {
          qualificationScore: results.score,
          fit: results.fit,
          recommendation: results.recommendation,
        },
        duration: 8000,
      },
      
      nurture: {
        type: 'success',
        title: '🌱 Nurture Sequence Started!',
        message: `${results.messageCount || 3}-message sequence created for ${prospectName}`,
        action,
        prospectName,
        results: {
          messages: results.messageCount || 3,
          daysSpread: results.days || 7,
          firstSendTime: results.firstSend,
        },
        duration: 8000,
      },
      
      book_meeting: {
        type: 'success',
        title: '📅 Meeting Invite Sent!',
        message: `Calendar invitation sent to ${prospectName}`,
        action,
        prospectName,
        results: {
          inviteSent: true,
          calendarLink: results.link,
          suggestedTimes: results.times?.length || 3,
        },
        duration: 8000,
      },
      
      close_deal: {
        type: 'success',
        title: '💰 Closing Sequence Initiated!',
        message: `Sent closing offer to ${prospectName}`,
        action,
        prospectName,
        results: {
          offerSent: true,
          estimatedValue: results.dealValue || 15000,
          closeProbability: results.closeProbability || 0.67,
        },
        duration: 10000,
      },
      
      full_pipeline: {
        type: 'success',
        title: '🎊 Full Automation Complete!',
        message: `${prospectName} advanced through pipeline`,
        action,
        prospectName,
        results: {
          stepsCompleted: results.steps?.length || 7,
          newStage: results.newStage,
          estimatedRevenue: results.revenue || 15000,
        },
        duration: 10000,
      },
    };

    const notification = notifications[action] || notifications.smart_scan;
    
    return {
      ...notification,
      nextActions: nextRecommendations || this.getDefaultNextActions(action),
    };
  }

  /**
   * Create error notification
   */
  static createErrorNotification(
    action: string,
    prospectName: string,
    error: string
  ): AutomationNotification {
    return {
      type: 'error',
      title: '❌ Automation Failed',
      message: `Failed to run ${action} for ${prospectName}`,
      action,
      prospectName,
      results: { error },
      nextActions: [
        {
          label: 'Try Again',
          action: action,
          cost: { energy: 0, coins: 0 }, // Will look up from config
          description: 'Retry the automation',
          priority: 'high',
        },
        {
          label: 'Contact Support',
          action: 'support',
          cost: { energy: 0, coins: 0 },
          description: 'Get help from our team',
          priority: 'medium',
        },
      ],
      duration: 12000,
    };
  }

  /**
   * Get default next actions based on completed automation
   */
  private static getDefaultNextActions(completedAction: string): NextAction[] {
    const actionFlows: Record<string, NextAction[]> = {
      smart_scan: [
        {
          label: 'Send Follow-Up',
          action: 'follow_up',
          cost: { energy: 40, coins: 25 },
          description: 'Reach out based on insights',
          priority: 'high',
        },
        {
          label: 'Qualify Prospect',
          action: 'qualify',
          cost: { energy: 55, coins: 35 },
          description: 'Assess fit and readiness',
          priority: 'medium',
        },
      ],
      
      follow_up: [
        {
          label: 'Qualify',
          action: 'qualify',
          cost: { energy: 55, coins: 35 },
          description: 'If they reply, assess fit',
          priority: 'high',
        },
        {
          label: 'Book Meeting',
          action: 'book_meeting',
          cost: { energy: 90, coins: 55 },
          description: 'If interested, schedule call',
          priority: 'medium',
        },
      ],
      
      qualify: [
        {
          label: 'Start Nurture',
          action: 'nurture',
          cost: { energy: 70, coins: 45 },
          description: 'If qualified, nurture them',
          priority: 'high',
        },
        {
          label: 'Book Meeting',
          action: 'book_meeting',
          cost: { energy: 90, coins: 55 },
          description: 'If hot, schedule immediately',
          priority: 'high',
        },
      ],
      
      nurture: [
        {
          label: 'Book Meeting',
          action: 'book_meeting',
          cost: { energy: 90, coins: 55 },
          description: 'After sequence completes',
          priority: 'high',
        },
      ],
      
      book_meeting: [
        {
          label: 'Close Deal',
          action: 'close_deal',
          cost: { energy: 150, coins: 85 },
          description: 'If meeting goes well',
          priority: 'high',
        },
      ],
      
      close_deal: [
        {
          label: 'Follow-Up',
          action: 'follow_up',
          cost: { energy: 40, coins: 25 },
          description: 'If no immediate response',
          priority: 'medium',
        },
      ],
    };

    return actionFlows[completedAction] || [];
  }
}




