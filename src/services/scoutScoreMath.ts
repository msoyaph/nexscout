import { supabase } from '../lib/supabase';

export interface ScoutScoreResult {
  finalScore: number;
  intentScore: number;
  financialReadiness: number;
  engagementBehavior: number;
  personalityMatch: number;
  vouchScore: number;
  breakdown: {
    painPointIndicators: string[];
    opportunityLanguageCount: number;
    decisionSignals: string[];
    incomeKeywords: number;
    employmentStability: number;
    debtPressure: number;
    avgResponseSpeed: number;
    commentRatio: number;
    likeRatio: number;
    curiosityMarkers: number;
    personalityType: string;
    referralSource: string;
  };
}

export interface NurturePathway {
  nurtureSequence: Array<{ day: number; action: string; content: string }>;
  recommendedTiming: Array<{ step: number; timing: string }>;
  contentAngles: string[];
  nextAction: string;
  nextActionDate: string;
}

export interface SkillGap {
  skillCategory: string;
  gapSeverity: 'low' | 'medium' | 'high' | 'critical';
  detectedPatterns: string[];
  evidence: string[];
  improvementRecommendations: string[];
  trainingModules: string[];
  progressScore: number;
}

export interface ProductivityPlan {
  contactsToMessage: Array<{ name: string; priority: string; reason: string }>;
  followUps: Array<{ name: string; lastContact: string; followUpType: string }>;
  closingAttempts: Array<{ name: string; readinessScore: number; angle: string }>;
  trainingLesson: { title: string; duration: string; topic: string };
  priorityTasks: string[];
  timeBlocks: Array<{ time: string; activity: string }>;
  dailyGoal: string;
}

interface ScoutScoreInput {
  prospectId: string;
  userId: string;
  prospectData: {
    bio?: string;
    posts?: string[];
    comments?: string[];
    recentActivity?: string[];
    employment?: string;
    interests?: string[];
    personality?: string;
    referralSource?: string;
    referralQuality?: 'hot' | 'warm' | 'cold';
    responseSpeed?: number;
    engagementMetrics?: {
      comments: number;
      likes: number;
      shares: number;
    };
  };
  userPersonality?: string;
}

interface NurtureInput {
  prospectId: string;
  userId: string;
  leadTemperature: 'cold' | 'warm' | 'hot';
  emotionalState?: string;
  scoutScore: number;
  pipelinePosition: string;
}

interface SkillGapInput {
  userId: string;
  activityData: {
    closingRate?: number;
    followUpRate?: number;
    avgResponseTime?: number;
    hookEffectiveness?: number;
    emotionalIntelligence?: number;
    messagingTiming?: number;
  };
}

interface ProductivityInput {
  userId: string;
  prospects: any[];
  userGoals?: string;
  availableTime?: number;
}

class ScoutScoreMathService {
  async calculateScoutScore(input: ScoutScoreInput): Promise<ScoutScoreResult> {
    const intentScore = this.calculateIntentScore(input.prospectData);
    const financialReadiness = this.calculateFinancialReadiness(input.prospectData);
    const engagementBehavior = this.calculateEngagementBehavior(input.prospectData);
    const personalityMatch = this.calculatePersonalityMatch(input.userPersonality, input.prospectData.personality);
    const vouchScore = this.calculateVouchScore(input.prospectData.referralSource, input.prospectData.referralQuality);

    const finalScore = Math.round(
      0.40 * intentScore +
      0.25 * financialReadiness +
      0.15 * engagementBehavior +
      0.10 * personalityMatch +
      0.10 * vouchScore
    );

    const clampedScore = Math.max(0, Math.min(100, finalScore));

    const breakdown = this.buildBreakdown(input.prospectData);

    const result: ScoutScoreResult = {
      finalScore: clampedScore,
      intentScore,
      financialReadiness,
      engagementBehavior,
      personalityMatch,
      vouchScore,
      breakdown,
    };

    await supabase.from('scoutscore_calculations').insert({
      prospect_id: input.prospectId,
      user_id: input.userId,
      final_score: clampedScore,
      intent_score: intentScore,
      financial_readiness: financialReadiness,
      engagement_behavior: engagementBehavior,
      personality_match: personalityMatch,
      vouch_score: vouchScore,
      pain_point_indicators: breakdown.painPointIndicators,
      opportunity_language_count: breakdown.opportunityLanguageCount,
      decision_signals: breakdown.decisionSignals,
      income_keywords: breakdown.incomeKeywords,
      employment_stability: breakdown.employmentStability,
      debt_pressure_signals: breakdown.debtPressure,
      avg_response_speed: breakdown.avgResponseSpeed,
      comment_ratio: breakdown.commentRatio,
      like_ratio: breakdown.likeRatio,
      curiosity_markers: breakdown.curiosityMarkers,
      personality_type: breakdown.personalityType,
      referral_source: breakdown.referralSource,
      calculation_breakdown: breakdown,
      updated_at: new Date().toISOString(),
    });

    return result;
  }

  private calculateIntentScore(data: any): number {
    const painPointScore = this.calculatePainPointIndicators(data) * 0.5;
    const opportunityScore = this.calculateOpportunityLanguage(data) * 0.3;
    const decisionScore = this.calculateDecisionSignals(data) * 0.2;

    return painPointScore + opportunityScore + decisionScore;
  }

  private calculatePainPointIndicators(data: any): number {
    const painKeywords = ['income', 'side hustle', 'extra', 'bayarin', 'utang', 'quit job', 'lipat', 'financial', 'money', 'sahod'];
    const allText = [data.bio, ...(data.posts || []), ...(data.comments || [])].join(' ').toLowerCase();

    let matches = 0;
    painKeywords.forEach(keyword => {
      if (allText.includes(keyword)) matches++;
    });

    return Math.min(100, (matches / painKeywords.length) * 100);
  }

  private calculateOpportunityLanguage(data: any): number {
    const opportunityKeywords = ['business', 'invest', 'opportunity', 'negosyo', 'kita', 'passive', 'entrepreneur', 'growth'];
    const allText = [data.bio, ...(data.posts || [])].join(' ').toLowerCase();

    let count = 0;
    opportunityKeywords.forEach(keyword => {
      const regex = new RegExp(keyword, 'gi');
      const matches = allText.match(regex);
      if (matches) count += matches.length;
    });

    return Math.min(100, count * 10);
  }

  private calculateDecisionSignals(data: any): number {
    const decisionKeywords = ['planning', 'thinking about', 'gusto ko', 'balak', 'interested', 'ready', 'seryoso', 'decide'];
    const recentText = (data.recentActivity || []).join(' ').toLowerCase();

    let matches = 0;
    decisionKeywords.forEach(keyword => {
      if (recentText.includes(keyword)) matches++;
    });

    return Math.min(100, (matches / decisionKeywords.length) * 100);
  }

  private calculateFinancialReadiness(data: any): number {
    const incomeWeight = this.detectIncomeKeywords(data) * 0.4;
    const employmentWeight = this.detectEmploymentStability(data) * 0.3;
    const savingsWeight = this.detectSavingsSentiment(data) * 0.2;
    const debtPenalty = this.detectDebtPressure(data) * 0.1;

    const score = incomeWeight + employmentWeight + savingsWeight - debtPenalty;
    return Math.max(0, Math.min(100, score));
  }

  private detectIncomeKeywords(data: any): number {
    const incomeKeywords = ['employed', 'work', 'salary', 'sahod', 'income', 'business owner', 'freelance'];
    const text = [data.bio, data.employment].join(' ').toLowerCase();

    let matches = 0;
    incomeKeywords.forEach(keyword => {
      if (text.includes(keyword)) matches++;
    });

    return Math.min(100, (matches / incomeKeywords.length) * 100);
  }

  private detectEmploymentStability(data: any): number {
    const stableKeywords = ['stable job', 'permanent', 'regular', 'company', 'professional'];
    const text = (data.employment || '').toLowerCase();

    let matches = 0;
    stableKeywords.forEach(keyword => {
      if (text.includes(keyword)) matches++;
    });

    return Math.min(100, (matches / stableKeywords.length) * 100);
  }

  private detectSavingsSentiment(data: any): number {
    const savingsKeywords = ['savings', 'save', 'ipon', 'investment', 'emergency fund'];
    const text = [...(data.posts || []), ...(data.comments || [])].join(' ').toLowerCase();

    let matches = 0;
    savingsKeywords.forEach(keyword => {
      if (text.includes(keyword)) matches++;
    });

    return Math.min(100, (matches / savingsKeywords.length) * 100);
  }

  private detectDebtPressure(data: any): number {
    const debtKeywords = ['utang', 'debt', 'loan', 'hirap', 'struggle', 'walang pera', 'broke'];
    const text = [...(data.posts || []), ...(data.comments || [])].join(' ').toLowerCase();

    let matches = 0;
    debtKeywords.forEach(keyword => {
      if (text.includes(keyword)) matches++;
    });

    return Math.min(100, (matches / debtKeywords.length) * 100);
  }

  private calculateEngagementBehavior(data: any): number {
    const responseSpeed = (data.responseSpeed || 0) / 10;
    const commentRatio = ((data.engagementMetrics?.comments || 0) / 10);
    const likeRatio = ((data.engagementMetrics?.likes || 0) / 20);
    const curiosityMarkers = this.detectCuriosityMarkers(data);

    const score = (responseSpeed + commentRatio + likeRatio + curiosityMarkers) / 4;
    return Math.min(100, score);
  }

  private detectCuriosityMarkers(data: any): number {
    const curiosityKeywords = ['how', 'what', 'paano', 'ano', 'interested', 'tell me more', 'curious', 'learn'];
    const text = [...(data.comments || [])].join(' ').toLowerCase();

    let matches = 0;
    curiosityKeywords.forEach(keyword => {
      if (text.includes(keyword)) matches++;
    });

    return Math.min(100, (matches / curiosityKeywords.length) * 100);
  }

  private calculatePersonalityMatch(userPersonality?: string, prospectPersonality?: string): number {
    if (!userPersonality || !prospectPersonality) return 50;

    const matchMatrix: Record<string, Record<string, number>> = {
      'driver': { 'driver': 100, 'influencer': 80, 'supportive': 60, 'analytical': 50 },
      'influencer': { 'driver': 80, 'influencer': 100, 'supportive': 90, 'analytical': 60 },
      'supportive': { 'driver': 60, 'influencer': 90, 'supportive': 100, 'analytical': 70 },
      'analytical': { 'driver': 50, 'influencer': 60, 'supportive': 70, 'analytical': 100 },
    };

    const userType = userPersonality.toLowerCase();
    const prospectType = prospectPersonality.toLowerCase();

    return matchMatrix[userType]?.[prospectType] || 50;
  }

  private calculateVouchScore(referralSource?: string, referralQuality?: 'hot' | 'warm' | 'cold'): number {
    if (!referralSource) return 0;

    const qualityScores = {
      'hot': 15,
      'warm': 10,
      'cold': 5,
    };

    return qualityScores[referralQuality || 'cold'] * 10;
  }

  private buildBreakdown(data: any): any {
    return {
      painPointIndicators: this.extractPainPoints(data),
      opportunityLanguageCount: this.countOpportunityLanguage(data),
      decisionSignals: this.extractDecisionSignals(data),
      incomeKeywords: this.countIncomeKeywords(data),
      employmentStability: this.detectEmploymentStability(data),
      debtPressure: this.detectDebtPressure(data),
      avgResponseSpeed: data.responseSpeed || 0,
      commentRatio: (data.engagementMetrics?.comments || 0) / 10,
      likeRatio: (data.engagementMetrics?.likes || 0) / 20,
      curiosityMarkers: this.countCuriosityMarkers(data),
      personalityType: data.personality || 'unknown',
      referralSource: data.referralSource || 'none',
    };
  }

  private extractPainPoints(data: any): string[] {
    const painKeywords = ['income', 'side hustle', 'bayarin', 'utang'];
    const allText = [data.bio, ...(data.posts || [])].join(' ').toLowerCase();
    return painKeywords.filter(keyword => allText.includes(keyword));
  }

  private countOpportunityLanguage(data: any): number {
    const opportunityKeywords = ['business', 'invest', 'opportunity', 'negosyo'];
    const allText = [data.bio, ...(data.posts || [])].join(' ').toLowerCase();
    let count = 0;
    opportunityKeywords.forEach(keyword => {
      const matches = allText.match(new RegExp(keyword, 'gi'));
      if (matches) count += matches.length;
    });
    return count;
  }

  private extractDecisionSignals(data: any): string[] {
    const decisionKeywords = ['planning', 'thinking', 'interested', 'ready'];
    const recentText = (data.recentActivity || []).join(' ').toLowerCase();
    return decisionKeywords.filter(keyword => recentText.includes(keyword));
  }

  private countIncomeKeywords(data: any): number {
    const incomeKeywords = ['employed', 'work', 'salary', 'income'];
    const text = [data.bio, data.employment].join(' ').toLowerCase();
    return incomeKeywords.filter(keyword => text.includes(keyword)).length;
  }

  private countCuriosityMarkers(data: any): number {
    const curiosityKeywords = ['how', 'what', 'paano', 'interested'];
    const text = [...(data.comments || [])].join(' ').toLowerCase();
    return curiosityKeywords.filter(keyword => text.includes(keyword)).length;
  }

  async generateNurturePathway(input: NurtureInput): Promise<NurturePathway> {
    const sequence = this.buildNurtureSequence(input);
    const timing = this.buildRecommendedTiming(input);
    const angles = this.buildContentAngles(input);
    const nextAction = this.determineNextAction(input);
    const nextDate = this.calculateNextActionDate(input);

    const pathway: NurturePathway = {
      nurtureSequence: sequence,
      recommendedTiming: timing,
      contentAngles: angles,
      nextAction,
      nextActionDate: nextDate,
    };

    await supabase.from('lead_nurture_pathways').insert({
      prospect_id: input.prospectId,
      user_id: input.userId,
      lead_temperature: input.leadTemperature,
      emotional_state: input.emotionalState,
      scout_score: input.scoutScore,
      pipeline_position: input.pipelinePosition,
      nurture_sequence: sequence,
      recommended_timing: timing,
      content_angles: angles,
      next_action: nextAction,
      next_action_date: nextDate,
    });

    return pathway;
  }

  private buildNurtureSequence(input: NurtureInput): Array<{ day: number; action: string; content: string }> {
    if (input.leadTemperature === 'hot' && input.scoutScore >= 80) {
      return [
        { day: 0, action: 'Direct pitch', content: 'Present opportunity immediately' },
        { day: 1, action: 'Follow-up', content: 'Answer questions and address concerns' },
        { day: 2, action: 'Close', content: 'Guide to commitment' },
      ];
    } else if (input.leadTemperature === 'warm' && input.scoutScore >= 60) {
      return [
        { day: 0, action: 'Value touch', content: 'Share success story' },
        { day: 2, action: 'Educational content', content: 'Explain benefits' },
        { day: 5, action: 'Soft pitch', content: 'Introduce opportunity' },
        { day: 7, action: 'Follow-up', content: 'Check interest level' },
      ];
    } else {
      return [
        { day: 0, action: 'Warm introduction', content: 'Build rapport' },
        { day: 3, action: 'Value content', content: 'Share helpful tips' },
        { day: 7, action: 'Story share', content: 'Personal transformation story' },
        { day: 14, action: 'Educational post', content: 'Industry insights' },
        { day: 21, action: 'Soft inquiry', content: 'Check if timing is right' },
      ];
    }
  }

  private buildRecommendedTiming(input: NurtureInput): Array<{ step: number; timing: string }> {
    return [
      { step: 1, timing: 'Morning 9-11am' },
      { step: 2, timing: 'Lunch 12-1pm' },
      { step: 3, timing: 'Evening 7-9pm' },
    ];
  }

  private buildContentAngles(input: NurtureInput): string[] {
    if (input.scoutScore >= 80) {
      return ['Direct opportunity presentation', 'Financial freedom angle', 'Time leverage'];
    } else if (input.scoutScore >= 60) {
      return ['Success stories', 'Industry education', 'Problem-solution focus'];
    }
    return ['Value-first content', 'Relationship building', 'Educational resources'];
  }

  private determineNextAction(input: NurtureInput): string {
    if (input.leadTemperature === 'hot') return 'Schedule call or meeting';
    if (input.leadTemperature === 'warm') return 'Send educational content';
    return 'Build rapport with value touch';
  }

  private calculateNextActionDate(input: NurtureInput): string {
    const now = new Date();
    if (input.leadTemperature === 'hot') {
      now.setHours(now.getHours() + 2);
    } else if (input.leadTemperature === 'warm') {
      now.setDate(now.getDate() + 1);
    } else {
      now.setDate(now.getDate() + 3);
    }
    return now.toISOString();
  }

  async detectSkillGaps(input: SkillGapInput): Promise<SkillGap[]> {
    const gaps: SkillGap[] = [];

    if ((input.activityData.closingRate || 0) < 0.2) {
      gaps.push({
        skillCategory: 'Closing',
        gapSeverity: 'high',
        detectedPatterns: ['Low closing rate', 'Hesitation at commitment stage'],
        evidence: [`Closing rate: ${((input.activityData.closingRate || 0) * 100).toFixed(0)}%`],
        improvementRecommendations: ['Practice assumptive close', 'Study objection handling', 'Roleplay closing scenarios'],
        trainingModules: ['Closing Techniques 101', 'Assumptive Close Framework', 'Objection Handling Mastery'],
        progressScore: 0,
      });
    }

    if ((input.activityData.followUpRate || 0) < 0.5) {
      gaps.push({
        skillCategory: 'Follow-Up',
        gapSeverity: 'medium',
        detectedPatterns: ['Inconsistent follow-ups', 'Low follow-up rate'],
        evidence: [`Follow-up rate: ${((input.activityData.followUpRate || 0) * 100).toFixed(0)}%`],
        improvementRecommendations: ['Set follow-up reminders', 'Use automated sequences', 'Track follow-up cadence'],
        trainingModules: ['Follow-Up Mastery', 'Persistence Without Pressure'],
        progressScore: 0,
      });
    }

    if ((input.activityData.avgResponseTime || 0) > 3600) {
      gaps.push({
        skillCategory: 'Response Speed',
        gapSeverity: 'medium',
        detectedPatterns: ['Slow response times', 'Delayed replies'],
        evidence: [`Avg response time: ${Math.round((input.activityData.avgResponseTime || 0) / 60)} minutes`],
        improvementRecommendations: ['Set notification alerts', 'Block time for responses', 'Use quick reply templates'],
        trainingModules: ['Speed and Efficiency', 'Time Management for Sales'],
        progressScore: 0,
      });
    }

    if ((input.activityData.hookEffectiveness || 0) < 0.3) {
      gaps.push({
        skillCategory: 'Message Hooks',
        gapSeverity: 'high',
        detectedPatterns: ['Low engagement on opening messages', 'Weak hooks'],
        evidence: [`Hook effectiveness: ${((input.activityData.hookEffectiveness || 0) * 100).toFixed(0)}%`],
        improvementRecommendations: ['Study viral hooks', 'Test multiple openers', 'Personalize each message'],
        trainingModules: ['Hook Writing Mastery', 'Personalization Frameworks'],
        progressScore: 0,
      });
    }

    for (const gap of gaps) {
      await supabase.from('agent_skill_gaps').insert({
        user_id: input.userId,
        skill_category: gap.skillCategory,
        gap_severity: gap.gapSeverity,
        detected_patterns: gap.detectedPatterns,
        evidence: gap.evidence,
        improvement_recommendations: gap.improvementRecommendations,
        training_modules: gap.trainingModules,
        progress_score: gap.progressScore,
      });
    }

    return gaps;
  }

  async generateProductivityPlan(input: ProductivityInput): Promise<ProductivityPlan> {
    const topProspects = this.selectTopProspects(input.prospects, 3);
    const followUps = this.selectFollowUps(input.prospects, 2);
    const closingAttempts = this.selectClosingAttempts(input.prospects, 1);
    const lesson = this.selectTrainingLesson(input.userId);
    const tasks = this.generatePriorityTasks(input);
    const timeBlocks = this.generateTimeBlocks(input);
    const goal = this.generateDailyGoal(input);

    const plan: ProductivityPlan = {
      contactsToMessage: topProspects,
      followUps,
      closingAttempts,
      trainingLesson: lesson,
      priorityTasks: tasks,
      timeBlocks,
      dailyGoal: goal,
    };

    await supabase.from('daily_productivity_plans').upsert({
      user_id: input.userId,
      plan_date: new Date().toISOString().split('T')[0],
      contacts_to_message: topProspects,
      follow_ups: followUps,
      closing_attempts: closingAttempts,
      training_lesson: lesson,
      priority_tasks: tasks,
      time_blocks: timeBlocks,
      daily_goal: goal,
    }, { onConflict: 'user_id,plan_date' });

    return plan;
  }

  private selectTopProspects(prospects: any[], count: number): Array<{ name: string; priority: string; reason: string }> {
    return prospects.slice(0, count).map(p => ({
      name: p.name || 'Prospect',
      priority: 'High',
      reason: 'High ScoutScore and recent engagement',
    }));
  }

  private selectFollowUps(prospects: any[], count: number): Array<{ name: string; lastContact: string; followUpType: string }> {
    return prospects.slice(0, count).map(p => ({
      name: p.name || 'Prospect',
      lastContact: '3 days ago',
      followUpType: 'Value touch',
    }));
  }

  private selectClosingAttempts(prospects: any[], count: number): Array<{ name: string; readinessScore: number; angle: string }> {
    return prospects.slice(0, count).map(p => ({
      name: p.name || 'Prospect',
      readinessScore: 85,
      angle: 'Financial freedom angle',
    }));
  }

  private selectTrainingLesson(userId: string): { title: string; duration: string; topic: string } {
    return {
      title: 'Objection Handling Framework',
      duration: '10 minutes',
      topic: 'Converting objections into opportunities',
    };
  }

  private generatePriorityTasks(input: ProductivityInput): string[] {
    return [
      'Review and respond to all pending messages',
      'Update pipeline status for hot leads',
      'Complete daily training lesson',
      'Schedule follow-up calls',
    ];
  }

  private generateTimeBlocks(input: ProductivityInput): Array<{ time: string; activity: string }> {
    return [
      { time: '9:00-10:00 AM', activity: 'New prospect outreach' },
      { time: '12:00-1:00 PM', activity: 'Follow-up messages' },
      { time: '3:00-3:30 PM', activity: 'Training lesson' },
      { time: '7:00-8:00 PM', activity: 'Closing attempts' },
    ];
  }

  private generateDailyGoal(input: ProductivityInput): string {
    return 'Connect with 3 new prospects, complete 2 follow-ups, and attempt 1 close';
  }
}

export const scoutScoreMath = new ScoutScoreMathService();
