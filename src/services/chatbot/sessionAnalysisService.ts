/**
 * Chatbot Session Analysis Service
 * 
 * Analyzes chat sessions and provides AI-powered recommendations
 * for user intervention and follow-up strategies
 */

import { supabase } from '../../lib/supabase';
import { messageAnalysisService } from '../omnichannel/messageAnalysisService';

export interface SessionAnalysis {
  leadTemperature: 'hot' | 'warm' | 'cold' | 'curious';
  intent: string;
  buyingSignals: string[];
  objections: string[];
  questions: string[];
  overallSentiment: 'positive' | 'neutral' | 'negative';
  engagementLevel: 'high' | 'medium' | 'low';
  qualificationScore: number; // 0-100
  missingInfo: string[];
  recommendations: AIRecommendation[];
}

export interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  action: 'message' | 'sequence' | 'calendar' | 'manual';
  priority: 'high' | 'medium' | 'low';
  energyCost: number;
  coinCost: number;
  config?: {
    tone?: string;
    goal?: string;
    sequenceType?: string;
    messageCount?: number;
  };
}

export interface ConversionData {
  name?: string;
  email?: string;
  phone?: string;
  qualificationScore: number;
  scoreBreakdown: {
    hasName: boolean;
    hasEmail: boolean;
    hasPhone: boolean;
    hasIntent: boolean;
    hasEngagement: boolean;
    nameScore: number;
    emailScore: number;
    phoneScore: number;
    intentScore: number;
    engagementScore: number;
  };
  missingFields: string[];
  canConvert: boolean;
}

export class SessionAnalysisService {
  /**
   * Analyze entire chat session
   */
  static async analyzeSession(sessionId: string): Promise<SessionAnalysis> {
    try {
      // Get session to get userId
      const { data: session } = await supabase
        .from('public_chat_sessions')
        .select('user_id')
        .eq('id', sessionId)
        .single();

      // Get all messages
      const { data: messages } = await supabase
        .from('public_chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (!messages || messages.length === 0) {
        return this.getDefaultAnalysis();
      }

      // Analyze visitor messages only
      const visitorMessages = messages.filter(m => m.sender === 'visitor');
      
      // Aggregate analysis
      const buyingSignals: string[] = [];
      const objections: string[] = [];
      const questions: string[] = [];
      let positiveSentimentCount = 0;
      let negativeSentimentCount = 0;
      let totalEngagement = 0;

      // Analyze each message
      for (const msg of visitorMessages) {
        const analysis = await messageAnalysisService.analyzeMessage(msg.message_text, {
          userId: session?.user_id, // Pass userId for AIOrchestrator
        });
        
        buyingSignals.push(...analysis.buyingSignals);
        objections.push(...analysis.objections);
        questions.push(...analysis.questionsAsked);
        
        if (analysis.sentiment === 'positive') positiveSentimentCount++;
        if (analysis.sentiment === 'negative') negativeSentimentCount++;
        
        if (analysis.engagementLevel === 'high') totalEngagement += 3;
        else if (analysis.engagementLevel === 'medium') totalEngagement += 2;
        else totalEngagement += 1;
      }

      // Determine lead temperature
      const leadTemperature = this.calculateLeadTemperature(
        buyingSignals.length,
        objections.length,
        questions.length,
        positiveSentimentCount
      );

      // Determine intent
      const intent = this.determineIntent(buyingSignals, questions, objections);

      // Calculate qualification score
      const qualificationScore = this.calculateQualificationScore({
        buyingSignals: buyingSignals.length,
        questions: questions.length,
        objections: objections.length,
        messageCount: visitorMessages.length,
        sentimentScore: positiveSentimentCount / Math.max(visitorMessages.length, 1),
      });

      // Check missing info
      const missingInfo = this.checkMissingInfo(messages);

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        leadTemperature,
        intent,
        buyingSignals.length,
        objections.length,
        qualificationScore,
        missingInfo
      );

      return {
        leadTemperature,
        intent,
        buyingSignals: [...new Set(buyingSignals)], // Remove duplicates
        objections: [...new Set(objections)],
        questions: [...new Set(questions)],
        overallSentiment: positiveSentimentCount > negativeSentimentCount ? 'positive' : 
                          positiveSentimentCount < negativeSentimentCount ? 'negative' : 'neutral',
        engagementLevel: totalEngagement > messages.length * 2 ? 'high' :
                        totalEngagement > messages.length ? 'medium' : 'low',
        qualificationScore,
        missingInfo,
        recommendations,
      };
    } catch (error) {
      console.error('Error analyzing session:', error);
      return this.getDefaultAnalysis();
    }
  }

  /**
   * Calculate lead temperature
   */
  private static calculateLeadTemperature(
    buyingSignals: number,
    objections: number,
    questions: number,
    positiveSentiment: number
  ): 'hot' | 'warm' | 'cold' | 'curious' {
    if (buyingSignals >= 3 && objections === 0) return 'hot';
    if (buyingSignals >= 1 && positiveSentiment >= 2) return 'warm';
    if (questions >= 3) return 'curious';
    return 'cold';
  }

  /**
   * Determine primary intent
   */
  private static determineIntent(
    buyingSignals: string[],
    questions: string[],
    objections: string[]
  ): string {
    if (buyingSignals.length >= 2) return 'Ready to buy';
    if (questions.length >= 3) return 'Information gathering';
    if (objections.length >= 2) return 'Has concerns';
    if (buyingSignals.length >= 1) return 'Interested';
    return 'Just browsing';
  }

  /**
   * Calculate qualification score
   */
  private static calculateQualificationScore(params: {
    buyingSignals: number;
    questions: number;
    objections: number;
    messageCount: number;
    sentimentScore: number;
  }): number {
    let score = 0;
    
    // Buying signals: +20 per signal
    score += Math.min(params.buyingSignals * 20, 60);
    
    // Questions (curiosity): +10 per question
    score += Math.min(params.questions * 10, 30);
    
    // Message count (engagement): +2 per message
    score += Math.min(params.messageCount * 2, 20);
    
    // Positive sentiment: +0-20
    score += Math.round(params.sentimentScore * 20);
    
    // Objections: -5 per objection
    score -= params.objections * 5;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Check for missing information
   */
  private static checkMissingInfo(messages: any[]): string[] {
    const missing: string[] = [];
    const allText = messages.map(m => m.message_text).join(' ').toLowerCase();
    
    // Check for name
    const hasName = messages.some(m => 
      m.visitor_name || m.message_text?.toLowerCase().includes('my name is')
    );
    if (!hasName) missing.push('name');
    
    // Check for email
    const hasEmail = /[\w.-]+@[\w.-]+\.\w+/.test(allText);
    if (!hasEmail) missing.push('email');
    
    // Check for phone
    const hasPhone = /\+?\d{10,}/.test(allText);
    if (!hasPhone) missing.push('phone');
    
    return missing;
  }

  /**
   * Generate AI recommendations
   */
  private static generateRecommendations(
    leadTemp: string,
    intent: string,
    buyingSignals: number,
    objections: number,
    qualScore: number,
    missingInfo: string[]
  ): AIRecommendation[] {
    const recommendations: AIRecommendation[] = [];

    // HOT LEADS - Urgent action needed
    if (leadTemp === 'hot') {
      recommendations.push({
        id: 'hot-sequence',
        title: 'Send AI Closing Sequence',
        description: 'High buying intent! Send 3-message closing sequence NOW',
        action: 'sequence',
        priority: 'high',
        energyCost: 40,
        coinCost: 25,
        config: {
          tone: 'urgent_persuasive',
          goal: 'close_sale',
          sequenceType: 'closing',
          messageCount: 3,
        },
      });

      recommendations.push({
        id: 'send-calendar',
        title: 'Send Booking Link',
        description: 'Schedule a call to close the deal',
        action: 'calendar',
        priority: 'high',
        energyCost: 0,
        coinCost: 0,
      });
    }

    // WARM LEADS - Nurture with value
    if (leadTemp === 'warm') {
      recommendations.push({
        id: 'warm-sequence',
        title: 'Send Nurture Sequence',
        description: 'Build trust with 5-message value sequence',
        action: 'sequence',
        priority: 'medium',
        energyCost: 40,
        coinCost: 25,
        config: {
          tone: 'friendly_helpful',
          goal: 'build_trust',
          sequenceType: 'nurture',
          messageCount: 5,
        },
      });
    }

    // CURIOUS LEADS - Answer questions
    if (leadTemp === 'curious') {
      recommendations.push({
        id: 'curious-message',
        title: 'Answer Questions with AI',
        description: 'Generate personalized FAQ response',
        action: 'message',
        priority: 'high',
        energyCost: 15,
        coinCost: 10,
        config: {
          tone: 'informative_patient',
          goal: 'educate',
        },
      });
    }

    // COLD LEADS - Re-engagement
    if (leadTemp === 'cold') {
      recommendations.push({
        id: 'cold-sequence',
        title: 'Re-Engagement Sequence',
        description: 'Spark interest with 3-message curiosity sequence',
        action: 'sequence',
        priority: 'low',
        energyCost: 40,
        coinCost: 25,
        config: {
          tone: 'intriguing_casual',
          goal: 'spark_interest',
          sequenceType: 'reengagement',
          messageCount: 3,
        },
      });
    }

    // Has objections - Address concerns
    if (objections > 0) {
      recommendations.push({
        id: 'objection-handler',
        title: 'AI Objection Handler',
        description: `Address ${objections} objection${objections > 1 ? 's' : ''} raised`,
        action: 'message',
        priority: 'high',
        energyCost: 20,
        coinCost: 15,
        config: {
          tone: 'empathetic_solution',
          goal: 'handle_objections',
        },
      });
    }

    // Missing info - Request details
    if (missingInfo.length > 0) {
      recommendations.push({
        id: 'request-info',
        title: 'Request Missing Info',
        description: `Politely ask for: ${missingInfo.join(', ')}`,
        action: 'manual',
        priority: 'medium',
        energyCost: 0,
        coinCost: 0,
      });
    }

    // Always offer booking link
    if (!recommendations.some(r => r.action === 'calendar')) {
      recommendations.push({
        id: 'send-calendar',
        title: 'Send Booking Link',
        description: 'Offer to schedule a discovery call',
        action: 'calendar',
        priority: 'medium',
        energyCost: 0,
        coinCost: 0,
      });
    }

    return recommendations;
  }

  /**
   * Get default analysis (fallback)
   */
  private static getDefaultAnalysis(): SessionAnalysis {
    return {
      leadTemperature: 'cold',
      intent: 'Unknown',
      buyingSignals: [],
      objections: [],
      questions: [],
      overallSentiment: 'neutral',
      engagementLevel: 'low',
      qualificationScore: 0,
      missingInfo: ['name', 'email', 'phone'],
      recommendations: [],
    };
  }

  /**
   * Calculate conversion data for "Convert to Prospect"
   */
  static async calculateConversionData(sessionId: string): Promise<ConversionData> {
    try {
      // Get session and messages
      const { data: session } = await supabase
        .from('public_chat_sessions')
        .select('*, messages:public_chat_messages(*)')
        .eq('id', sessionId)
        .single();

      if (!session) {
        throw new Error('Session not found');
      }

      const messages = session.messages || [];
      const allText = messages.map((m: any) => m.message_text).join(' ');

      // Extract information
      const name = session.visitor_name || this.extractName(allText);
      const email = session.visitor_email || this.extractEmail(allText);
      const phone = this.extractPhone(allText);

      // Calculate qualification scores
      const hasName = !!name;
      const hasEmail = !!email;
      const hasPhone = !!phone;
      const hasIntent = messages.length >= 3; // Engaged in conversation
      const hasEngagement = messages.filter((m: any) => m.sender === 'visitor').length >= 2;

      const nameScore = hasName ? 10 : 0;
      const emailScore = hasEmail ? 15 : 0;
      const phoneScore = hasPhone ? 20 : 0;
      const intentScore = hasIntent ? 15 : 0;
      const engagementScore = hasEngagement ? 20 : 0;

      const qualificationScore = nameScore + emailScore + phoneScore + intentScore + engagementScore;

      const missingFields = [];
      if (!hasName) missingFields.push('name');
      if (!hasEmail) missingFields.push('email');
      if (!hasPhone) missingFields.push('phone');

      return {
        name,
        email,
        phone,
        qualificationScore,
        scoreBreakdown: {
          hasName,
          hasEmail,
          hasPhone,
          hasIntent,
          hasEngagement,
          nameScore,
          emailScore,
          phoneScore,
          intentScore,
          engagementScore,
        },
        missingFields,
        canConvert: qualificationScore >= 25, // Minimum 25 points to convert
      };
    } catch (error) {
      console.error('Error calculating conversion data:', error);
      throw error;
    }
  }

  /**
   * Extract name from text
   */
  private static extractName(text: string): string | undefined {
    const lowerText = text.toLowerCase();
    
    // Look for "my name is", "I'm", "ako si", etc.
    const patterns = [
      /my name is ([a-z\s]+)/i,
      /i'm ([a-z\s]+)/i,
      /ako si ([a-z\s]+)/i,
      /name ko ay ([a-z\s]+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return undefined;
  }

  /**
   * Extract email from text
   */
  private static extractEmail(text: string): string | undefined {
    const emailPattern = /[\w.-]+@[\w.-]+\.\w+/;
    const match = text.match(emailPattern);
    return match ? match[0] : undefined;
  }

  /**
   * Extract phone from text
   */
  private static extractPhone(text: string): string | undefined {
    const phonePatterns = [
      /\+63\s?\d{10}/,
      /09\d{9}/,
      /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/,
    ];

    for (const pattern of phonePatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0];
      }
    }

    return undefined;
  }
}

export const sessionAnalysisService = SessionAnalysisService;




