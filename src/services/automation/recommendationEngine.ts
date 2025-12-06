/**
 * Smart Recommendation Engine
 * 
 * Analyzes prospects and recommends best automation actions
 * Calculates success probabilities and ROI
 */

import { AUTOMATION_COSTS } from '../../config/automationCosts';

interface Prospect {
  id: string;
  name: string;
  scout_score: number;
  pipeline_stage: string;
  last_interaction_at: string | null;
  email: string | null;
  phone: string | null;
  pain_points: string[] | null;
  buying_signals: any;
  lead_temperature: string | null;
}

export interface SmartRecommendation {
  action: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  reasoning: string[];
  expectedOutcome: {
    successRate: number;
    replyRate?: number;
    meetingRate?: number;
    closeRate?: number;
    estimatedRevenue: number;
  };
  timing: {
    optimal: Date;
    urgency: 'urgent' | 'soon' | 'flexible';
    bestTimeDescription: string;
  };
  cost: {
    energy: number;
    coins: number;
  };
  roi: number;
  confidence: number; // 0-1
}

export class RecommendationEngine {
  /**
   * Get smart recommendation for a prospect
   */
  static getRecommendation(
    prospect: Prospect,
    userEnergy: number,
    userCoins: number,
    automationHistory: any[] = []
  ): SmartRecommendation | null {
    const daysSinceContact = this.getDaysSinceContact(prospect.last_interaction_at);
    const score = prospect.scout_score;
    const stage = prospect.pipeline_stage;

    // Priority 1: Hot leads going cold (CRITICAL)
    if (score >= 70 && daysSinceContact >= 3) {
      return this.recommendFollowUp(prospect, 'critical', 
        'Hot lead going cold! 3+ days since last contact. Act now to prevent losing this opportunity.');
    }

    // Priority 2: Ready to close (CRITICAL)
    if (stage === 'ready_to_close' && score >= 85) {
      return this.recommendCloseDeal(prospect, 'critical',
        'Prospect is ready! High score + advanced stage = perfect timing to close.');
    }

    // Priority 3: New prospects need scanning (HIGH)
    if (stage === 'new' && !prospect.pain_points) {
      return this.recommendSmartScan(prospect, 'high',
        'New prospect detected. Run Smart Scan to understand their needs and pain points.');
    }

    // Priority 4: Qualified but not nurtured (HIGH)
    if (stage === 'qualified' && daysSinceContact >= 2) {
      return this.recommendNurture(prospect, 'high',
        'Qualified prospect needs nurturing. Create sequence to build trust and interest.');
    }

    // Priority 5: Interested but no meeting (MEDIUM)
    if (stage === 'interested' && score >= 60) {
      return this.recommendBookMeeting(prospect, 'medium',
        'Prospect is interested. Book a meeting to move forward.');
    }

    // Priority 6: Follow-up needed (MEDIUM)
    if (daysSinceContact >= 7 && score >= 50) {
      return this.recommendFollowUp(prospect, 'medium',
        'One week since last contact. Check in to maintain engagement.');
    }

    // Priority 7: Low engagement (LOW)
    if (score < 50 && stage === 'contacted') {
      return this.recommendQualify(prospect, 'low',
        'Low engagement. Qualify to determine if worth pursuing.');
    }

    // No urgent recommendations
    return null;
  }

  /**
   * Get multiple recommendations for batch operations
   */
  static getBulkRecommendations(
    prospects: Prospect[],
    maxRecommendations: number = 5
  ): SmartRecommendation[] {
    const recommendations = prospects
      .map(p => this.getRecommendation(p, 999, 999))
      .filter((r): r is SmartRecommendation => r !== null)
      .sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

    return recommendations.slice(0, maxRecommendations);
  }

  // Helper methods
  private static getDaysSinceContact(lastContact: string | null): number {
    if (!lastContact) return 999;
    const diff = Date.now() - new Date(lastContact).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  private static recommendFollowUp(
    prospect: Prospect,
    priority: SmartRecommendation['priority'],
    reasoning: string
  ): SmartRecommendation {
    const baseSuccessRate = 0.34;
    const scoreBonus = (prospect.scout_score - 50) / 100 * 0.2;
    const successRate = Math.min(0.85, baseSuccessRate + scoreBonus);

    return {
      action: 'follow_up',
      priority,
      title: 'Send Follow-Up Message',
      reasoning: [reasoning, `ScoutScore: ${prospect.scout_score}`, `Expected ${(successRate * 100).toFixed(0)}% reply rate`],
      expectedOutcome: {
        successRate,
        replyRate: successRate,
        meetingRate: successRate * 0.35,
        closeRate: successRate * 0.12,
        estimatedRevenue: 6800,
      },
      timing: {
        optimal: this.calculateOptimalTime(),
        urgency: priority === 'critical' ? 'urgent' : 'soon',
        bestTimeDescription: 'Weekday 2-5pm (45% reply rate)',
      },
      cost: AUTOMATION_COSTS.follow_up,
      roi: 4.5,
      confidence: scoreBonus + 0.7,
    };
  }

  private static recommendSmartScan(
    prospect: Prospect,
    priority: SmartRecommendation['priority'],
    reasoning: string
  ): SmartRecommendation {
    return {
      action: 'smart_scan',
      priority,
      title: 'Run Smart Scan Analysis',
      reasoning: [reasoning, 'Deep analysis reveals hidden opportunities', 'Updates ScoutScore accuracy'],
      expectedOutcome: {
        successRate: 0.95,
        estimatedRevenue: 0, // Scan doesn't directly generate revenue
      },
      timing: {
        optimal: new Date(),
        urgency: 'soon',
        bestTimeDescription: 'Run immediately for best insights',
      },
      cost: AUTOMATION_COSTS.smart_scan,
      roi: 3.2,
      confidence: 0.95,
    };
  }

  private static recommendQualify(
    prospect: Prospect,
    priority: SmartRecommendation['priority'],
    reasoning: string
  ): SmartRecommendation {
    return {
      action: 'qualify',
      priority,
      title: 'Qualify Prospect',
      reasoning: [reasoning, 'BANT/SPIN assessment', 'Determine if worth pursuing'],
      expectedOutcome: {
        successRate: 0.88,
        estimatedRevenue: 5000,
      },
      timing: {
        optimal: new Date(),
        urgency: 'flexible',
        bestTimeDescription: 'Anytime - quick assessment',
      },
      cost: AUTOMATION_COSTS.qualify,
      roi: 2.8,
      confidence: 0.75,
    };
  }

  private static recommendNurture(
    prospect: Prospect,
    priority: SmartRecommendation['priority'],
    reasoning: string
  ): SmartRecommendation {
    return {
      action: 'nurture',
      priority,
      title: 'Start Nurture Sequence',
      reasoning: [reasoning, '3-7 message automated sequence', 'Builds trust over time'],
      expectedOutcome: {
        successRate: 0.56,
        replyRate: 0.45,
        meetingRate: 0.18,
        closeRate: 0.08,
        estimatedRevenue: 8500,
      },
      timing: {
        optimal: new Date(),
        urgency: 'soon',
        bestTimeDescription: 'Start today, spreads over 7 days',
      },
      cost: AUTOMATION_COSTS.nurture,
      roi: 3.8,
      confidence: 0.82,
    };
  }

  private static recommendBookMeeting(
    prospect: Prospect,
    priority: SmartRecommendation['priority'],
    reasoning: string
  ): SmartRecommendation {
    return {
      action: 'book_meeting',
      priority,
      title: 'Book a Meeting',
      reasoning: [reasoning, 'Send calendar invite', 'Direct path to close'],
      expectedOutcome: {
        successRate: 0.42,
        meetingRate: 0.42,
        closeRate: 0.25,
        estimatedRevenue: 12500,
      },
      timing: {
        optimal: this.calculateOptimalTime(),
        urgency: 'soon',
        bestTimeDescription: 'Send invite for this week',
      },
      cost: AUTOMATION_COSTS.book_meeting,
      roi: 4.1,
      confidence: 0.78,
    };
  }

  private static recommendCloseDeal(
    prospect: Prospect,
    priority: SmartRecommendation['priority'],
    reasoning: string
  ): SmartRecommendation {
    return {
      action: 'close_deal',
      priority,
      title: 'Close the Deal',
      reasoning: [reasoning, 'Send closing sequence', 'Include offer and urgency'],
      expectedOutcome: {
        successRate: 0.67,
        closeRate: 0.67,
        estimatedRevenue: 15000,
      },
      timing: {
        optimal: this.calculateOptimalTime(),
        urgency: 'urgent',
        bestTimeDescription: 'Strike while hot - today!',
      },
      cost: AUTOMATION_COSTS.close_deal,
      roi: 5.8,
      confidence: 0.85,
    };
  }

  private static calculateOptimalTime(): Date {
    const now = new Date();
    const optimal = new Date(now);
    
    // Set to next weekday 2pm
    optimal.setHours(14, 0, 0, 0);
    
    // If weekend, move to Monday
    if (optimal.getDay() === 0) optimal.setDate(optimal.getDate() + 1);
    if (optimal.getDay() === 6) optimal.setDate(optimal.getDate() + 2);
    
    // If time passed today, move to tomorrow
    if (optimal < now) optimal.setDate(optimal.getDate() + 1);
    
    return optimal;
  }
}




