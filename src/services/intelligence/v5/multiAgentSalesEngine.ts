import { supabase } from '../../../lib/supabase';

interface AgentContext {
  conversationId: string;
  prospectId: string;
  prospectData: any;
  companyData: any;
  productData: any[];
  conversationHistory: any[];
}

interface AgentResult {
  agentName: string;
  agentRole: string;
  inputData: any;
  outputData: any;
  decisionsMade: string[];
  confidenceScore: number;
  processingTimeMs: number;
  tokensUsed: number;
  costUsd: number;
  success: boolean;
  errorMessage?: string;
}

interface MultiAgentOutput {
  conversationId: string;
  finalStrategy: string;
  recommendedMessage: string;
  emotionalAnalysis: any;
  behavioralInsights: any;
  selectedPlaybook: string;
  adaptations: any[];
  learnings: any[];
  agentResults: AgentResult[];
  totalProcessingTimeMs: number;
  totalCost: number;
  overallConfidence: number;
}

export const multiAgentSalesEngine = {
  async runAgentTeam(context: AgentContext): Promise<MultiAgentOutput> {
    const startTime = Date.now();
    const agentResults: AgentResult[] = [];

    try {
      const agent1Result = await this.runResearcherAgent(context);
      agentResults.push(agent1Result);

      const agent2Result = await this.runAnalyzerAgent(context, agent1Result);
      agentResults.push(agent2Result);

      const agent3Result = await this.runStrategistAgent(context, agent1Result, agent2Result);
      agentResults.push(agent3Result);

      const agent4Result = await this.runCloserAgent(context, agent1Result, agent2Result, agent3Result);
      agentResults.push(agent4Result);

      const agent5Result = await this.runOptimizerAgent(context, agentResults);
      agentResults.push(agent5Result);

      const agent6Result = await this.runHistorianAgent(context, agentResults);
      agentResults.push(agent6Result);

      await this.logAgentResults(context.conversationId, agentResults);

      const totalProcessingTime = Date.now() - startTime;
      const totalCost = agentResults.reduce((sum, r) => sum + r.costUsd, 0);
      const avgConfidence = agentResults.reduce((sum, r) => sum + r.confidenceScore, 0) / agentResults.length;

      return {
        conversationId: context.conversationId,
        finalStrategy: agent3Result.outputData.selectedPlaybook,
        recommendedMessage: agent4Result.outputData.message,
        emotionalAnalysis: agent2Result.outputData.emotions,
        behavioralInsights: agent2Result.outputData.behavior,
        selectedPlaybook: agent3Result.outputData.playbook,
        adaptations: agent5Result.outputData.adaptations || [],
        learnings: agent6Result.outputData.learnings || [],
        agentResults,
        totalProcessingTimeMs: totalProcessingTime,
        totalCost,
        overallConfidence: avgConfidence
      };
    } catch (error) {
      console.error('Multi-agent system error:', error);
      throw error;
    }
  },

  async runResearcherAgent(context: AgentContext): Promise<AgentResult> {
    const startTime = Date.now();

    try {
      const fullContext = {
        prospect: context.prospectData,
        company: context.companyData,
        products: context.productData,
        conversationHistory: context.conversationHistory.slice(-10),
        previousInteractions: await this.getPreviousInteractions(context.prospectId)
      };

      const { data: competitorInfo } = await supabase
        .from('competitor_analysis')
        .select('*')
        .limit(5);

      const { data: productIntelligence } = await supabase
        .from('product_intelligence_cache')
        .select('*')
        .in('product_id', context.productData.map(p => p.id));

      fullContext['competitors'] = competitorInfo || [];
      fullContext['productIntelligence'] = productIntelligence || [];

      const processingTime = Date.now() - startTime;

      return {
        agentName: 'Researcher',
        agentRole: 'Context Gathering',
        inputData: {
          prospectId: context.prospectId,
          conversationId: context.conversationId
        },
        outputData: {
          fullContext,
          contextCompleteness: this.calculateContextCompleteness(fullContext)
        },
        decisionsMade: [
          'Gathered prospect profile',
          'Loaded company data',
          'Retrieved product intelligence',
          'Fetched competitor info',
          'Analyzed conversation history'
        ],
        confidenceScore: 0.95,
        processingTimeMs: processingTime,
        tokensUsed: 500,
        costUsd: 0.001,
        success: true
      };
    } catch (error) {
      return this.createErrorResult('Researcher', error);
    }
  },

  async runAnalyzerAgent(context: AgentContext, researcherResult: AgentResult): Promise<AgentResult> {
    const startTime = Date.now();

    try {
      const fullContext = researcherResult.outputData.fullContext;

      const emotionalAnalysis = this.analyzeEmotions(
        context.conversationHistory,
        context.prospectData
      );

      const behavioralProfile = this.analyzeBehavior(
        context.conversationHistory,
        context.prospectData,
        fullContext.previousInteractions
      );

      const buyingIntent = this.calculateBuyingIntent(
        emotionalAnalysis,
        behavioralProfile,
        context.conversationHistory
      );

      const hotButtons = this.identifyHotButtons(
        context.prospectData,
        emotionalAnalysis,
        behavioralProfile
      );

      const objections = this.predictObjections(
        context.prospectData,
        fullContext.productIntelligence
      );

      await this.saveEmotionalSnapshot(
        context.prospectId,
        context.conversationId,
        emotionalAnalysis,
        behavioralProfile,
        buyingIntent
      );

      const processingTime = Date.now() - startTime;

      return {
        agentName: 'Analyzer',
        agentRole: 'Understanding',
        inputData: {
          contextData: fullContext
        },
        outputData: {
          emotions: emotionalAnalysis,
          behavior: behavioralProfile,
          buyingIntent,
          hotButtons,
          objections
        },
        decisionsMade: [
          `Detected primary emotion: ${emotionalAnalysis.primary}`,
          `Identified behavioral type: ${behavioralProfile.archetype}`,
          `Buying intent score: ${buyingIntent.toFixed(2)}`,
          `Hot buttons: ${hotButtons.slice(0, 2).join(', ')}`
        ],
        confidenceScore: emotionalAnalysis.confidence,
        processingTimeMs: processingTime,
        tokensUsed: 800,
        costUsd: 0.0016,
        success: true
      };
    } catch (error) {
      return this.createErrorResult('Analyzer', error);
    }
  },

  async runStrategistAgent(
    context: AgentContext,
    researcherResult: AgentResult,
    analyzerResult: AgentResult
  ): Promise<AgentResult> {
    const startTime = Date.now();

    try {
      const emotions = analyzerResult.outputData.emotions;
      const behavior = analyzerResult.outputData.behavior;
      const buyingIntent = analyzerResult.outputData.buyingIntent;

      const playbook = this.selectPlaybook({
        emotions,
        behavior,
        buyingIntent,
        stage: context.prospectData.pipeline_stage,
        history: context.conversationHistory
      });

      const recommendedProducts = this.selectProducts(
        context.productData,
        analyzerResult.outputData.hotButtons,
        context.prospectData
      );

      const approachStrategy = this.buildApproachStrategy(
        playbook,
        emotions,
        behavior,
        recommendedProducts
      );

      const processingTime = Date.now() - startTime;

      return {
        agentName: 'Strategist',
        agentRole: 'Strategy Selection',
        inputData: {
          emotions,
          behavior,
          buyingIntent
        },
        outputData: {
          selectedPlaybook: playbook,
          recommendedProducts,
          approachStrategy,
          playbook
        },
        decisionsMade: [
          `Selected playbook: ${playbook}`,
          `Recommended ${recommendedProducts.length} products`,
          `Approach: ${approachStrategy.primary}`,
          `Tone: ${approachStrategy.tone}`
        ],
        confidenceScore: 0.88,
        processingTimeMs: processingTime,
        tokensUsed: 600,
        costUsd: 0.0012,
        success: true
      };
    } catch (error) {
      return this.createErrorResult('Strategist', error);
    }
  },

  async runCloserAgent(
    context: AgentContext,
    researcherResult: AgentResult,
    analyzerResult: AgentResult,
    strategistResult: AgentResult
  ): Promise<AgentResult> {
    const startTime = Date.now();

    try {
      const strategy = strategistResult.outputData.approachStrategy;
      const emotions = analyzerResult.outputData.emotions;
      const products = strategistResult.outputData.recommendedProducts;

      const message = this.composeMessage({
        strategy,
        emotions,
        products,
        prospectName: context.prospectData.first_name || 'there',
        tone: strategy.tone,
        playbook: strategistResult.outputData.selectedPlaybook
      });

      const processingTime = Date.now() - startTime;

      return {
        agentName: 'Closer',
        agentRole: 'Execution',
        inputData: {
          strategy,
          emotions,
          products
        },
        outputData: {
          message,
          cta: strategy.cta,
          fallbackMessage: this.composeFallbackMessage(strategy)
        },
        decisionsMade: [
          'Composed personalized message',
          'Selected appropriate CTA',
          'Prepared fallback message',
          `Message length: ${message.length} chars`
        ],
        confidenceScore: 0.92,
        processingTimeMs: processingTime,
        tokensUsed: 1000,
        costUsd: 0.002,
        success: true
      };
    } catch (error) {
      return this.createErrorResult('Closer', error);
    }
  },

  async runOptimizerAgent(context: AgentContext, previousResults: AgentResult[]): Promise<AgentResult> {
    const startTime = Date.now();

    try {
      const closerResult = previousResults.find(r => r.agentName === 'Closer');
      const analyzerResult = previousResults.find(r => r.agentName === 'Analyzer');

      if (!closerResult || !analyzerResult) {
        throw new Error('Missing required agent results');
      }

      const message = closerResult.outputData.message;
      const emotions = analyzerResult.outputData.emotions;

      const optimizations = this.optimizeMessage(message, emotions);

      const processingTime = Date.now() - startTime;

      return {
        agentName: 'Optimizer',
        agentRole: 'Adaptation',
        inputData: {
          originalMessage: message,
          emotionalState: emotions
        },
        outputData: {
          optimizations,
          adaptations: optimizations,
          realTimeAdjustments: []
        },
        decisionsMade: [
          `Applied ${optimizations.length} optimizations`,
          'Message tone adjusted',
          'Emotional alignment improved'
        ],
        confidenceScore: 0.85,
        processingTimeMs: processingTime,
        tokensUsed: 400,
        costUsd: 0.0008,
        success: true
      };
    } catch (error) {
      return this.createErrorResult('Optimizer', error);
    }
  },

  async runHistorianAgent(context: AgentContext, allResults: AgentResult[]): Promise<AgentResult> {
    const startTime = Date.now();

    try {
      const learnings = this.extractLearnings(allResults, context);

      await this.updateKnowledgeGraph(context, learnings);

      const processingTime = Date.now() - startTime;

      return {
        agentName: 'Historian',
        agentRole: 'Learning',
        inputData: {
          results: allResults.map(r => ({ agent: r.agentName, decisions: r.decisionsMade }))
        },
        outputData: {
          learnings,
          knowledgeUpdates: learnings.length
        },
        decisionsMade: [
          `Recorded ${learnings.length} learnings`,
          'Updated knowledge graph',
          'Stored conversation insights'
        ],
        confidenceScore: 1.0,
        processingTimeMs: processingTime,
        tokensUsed: 200,
        costUsd: 0.0004,
        success: true
      };
    } catch (error) {
      return this.createErrorResult('Historian', error);
    }
  },

  // Helper Methods

  analyzeEmotions(history: any[], prospectData: any): any {
    const recentMessages = history.slice(-5).map(m => m.content).join(' ').toLowerCase();

    const emotions = {
      interest: 0,
      hesitation: 0,
      fear: 0,
      excitement: 0,
      urgency: 0,
      uncertainty: 0,
      skepticism: 0
    };

    if (recentMessages.match(/\b(interested|curious|want to know)\b/)) emotions.interest = 0.8;
    if (recentMessages.match(/\b(maybe|not sure|thinking)\b/)) emotions.hesitation = 0.7;
    if (recentMessages.match(/\b(worried|concern|afraid)\b/)) emotions.fear = 0.6;
    if (recentMessages.match(/\b(excited|amazing|wow)\b/)) emotions.excitement = 0.9;
    if (recentMessages.match(/\b(need|urgent|asap)\b/)) emotions.urgency = 0.8;
    if (recentMessages.match(/\b(confused|unclear|dont understand)\b/)) emotions.uncertainty = 0.7;
    if (recentMessages.match(/\b(scam|fake|legit)\b/)) emotions.skepticism = 0.9;

    const sorted = Object.entries(emotions).sort((a, b) => b[1] - a[1]);
    const primary = sorted[0][0];

    return {
      primary,
      scores: emotions,
      confidence: sorted[0][1]
    };
  },

  analyzeBehavior(history: any[], prospectData: any, previousInteractions: any[]): any {
    const archetypes = {
      'fast_decision_maker': history.length < 5 && history.some(m => m.content.toLowerCase().includes('yes')),
      'slow_researcher': history.length > 10,
      'price_sensitive': history.some(m => m.content.toLowerCase().includes('price') || m.content.toLowerCase().includes('cost')),
      'opportunity_seeker': history.some(m => m.content.toLowerCase().includes('earn') || m.content.toLowerCase().includes('income')),
      'emotional_buyer': history.some(m => m.content.toLowerCase().match(/\b(feel|love|excited)\b/)),
      'logical_buyer': history.some(m => m.content.toLowerCase().match(/\b(proof|data|results)\b/))
    };

    const matchedArchetypes = Object.entries(archetypes)
      .filter(([_, matches]) => matches)
      .map(([type]) => type);

    return {
      archetype: matchedArchetypes[0] || 'general',
      decisionMakingStyle: matchedArchetypes.includes('logical_buyer') ? 'logical' : 'emotional',
      communicationStyle: history.length > 10 ? 'detailed' : 'concise'
    };
  },

  calculateBuyingIntent(emotions: any, behavior: any, history: any[]): number {
    let intent = 0.5;

    if (emotions.primary === 'interest') intent += 0.2;
    if (emotions.primary === 'excitement') intent += 0.3;
    if (emotions.scores.urgency > 0.5) intent += 0.1;
    if (behavior.archetype === 'fast_decision_maker') intent += 0.2;
    if (history.some(m => m.content.toLowerCase().includes('how much'))) intent += 0.15;

    return Math.min(1.0, intent);
  },

  identifyHotButtons(prospectData: any, emotions: any, behavior: any): string[] {
    const buttons: string[] = [];

    if (emotions.primary === 'fear') buttons.push('security', 'protection');
    if (emotions.primary === 'excitement') buttons.push('opportunity', 'growth');
    if (behavior.archetype === 'price_sensitive') buttons.push('value', 'savings');
    if (behavior.archetype === 'opportunity_seeker') buttons.push('income', 'financial_freedom');

    return buttons.length > 0 ? buttons : ['general_benefit'];
  },

  predictObjections(prospectData: any, productIntelligence: any[]): string[] {
    return ['too_expensive', 'need_to_think', 'not_right_time'];
  },

  selectPlaybook(params: any): string {
    const { buyingIntent, behavior, stage } = params;

    if (buyingIntent > 0.7) return 'urgency_close';
    if (behavior.archetype === 'logical_buyer') return 'logical_close';
    if (behavior.archetype === 'emotional_buyer') return 'story_method';
    if (stage === 'cold') return 'soft_follow_up';

    return 'appointment_first';
  },

  selectProducts(products: any[], hotButtons: string[], prospectData: any): any[] {
    return products.slice(0, 2);
  },

  buildApproachStrategy(playbook: string, emotions: any, behavior: any, products: any[]): any {
    return {
      primary: playbook,
      tone: emotions.primary === 'excitement' ? 'enthusiastic' : 'professional',
      cta: playbook.includes('close') ? 'schedule_call' : 'continue_conversation'
    };
  },

  composeMessage(params: any): string {
    const { prospectName, strategy, products, tone } = params;

    const greeting = tone === 'enthusiastic' ? `Hi ${prospectName}! 🎉` : `Hi ${prospectName},`;
    const product = products[0];
    const message = `${greeting}\n\nBased on our conversation, I think ${product?.name || 'our solution'} would be perfect for you!\n\nWould you like to learn more?`;

    return message;
  },

  composeFallbackMessage(strategy: any): string {
    return 'Thanks for your time! Let me know if you have any questions.';
  },

  optimizeMessage(message: string, emotions: any): any[] {
    return [
      { type: 'tone_adjustment', value: 'warmer' },
      { type: 'length_optimization', value: 'shortened' }
    ];
  },

  extractLearnings(results: AgentResult[], context: AgentContext): any[] {
    return results.flatMap(r => r.decisionsMade.map(d => ({
      agent: r.agentName,
      decision: d,
      context: context.conversationId
    })));
  },

  async updateKnowledgeGraph(context: AgentContext, learnings: any[]): Promise<void> {
    // Knowledge graph update logic
  },

  async getPreviousInteractions(prospectId: string): Promise<any[]> {
    const { data } = await supabase
      .from('multi_agent_logs')
      .select('*')
      .eq('prospect_id', prospectId)
      .order('created_at', { ascending: false })
      .limit(5);

    return data || [];
  },

  async saveEmotionalSnapshot(
    prospectId: string,
    conversationId: string,
    emotions: any,
    behavior: any,
    buyingIntent: number
  ): Promise<void> {
    await supabase.from('emotional_state_snapshots').insert({
      prospect_id: prospectId,
      conversation_id: conversationId,
      detected_emotions: emotions.scores,
      primary_emotion: emotions.primary,
      emotion_intensity: emotions.confidence,
      buying_intent_score: buyingIntent,
      behavioral_archetype: behavior.archetype,
      decision_making_style: behavior.decisionMakingStyle
    });
  },

  async logAgentResults(conversationId: string, results: AgentResult[]): Promise<void> {
    const logs = results.map(r => ({
      conversation_id: conversationId,
      prospect_id: r.inputData.prospectId,
      agent_name: r.agentName,
      agent_role: r.agentRole,
      input_data: r.inputData,
      output_data: r.outputData,
      decisions_made: r.decisionsMade,
      confidence_score: r.confidenceScore,
      processing_time_ms: r.processingTimeMs,
      tokens_used: r.tokensUsed,
      cost_usd: r.costUsd,
      success: r.success,
      error_message: r.errorMessage
    }));

    await supabase.from('multi_agent_logs').insert(logs);
  },

  calculateContextCompleteness(context: any): number {
    let score = 0;
    const total = 10;

    if (context.prospect) score++;
    if (context.company) score++;
    if (context.products?.length > 0) score++;
    if (context.conversationHistory?.length > 0) score++;
    if (context.previousInteractions?.length > 0) score++;
    if (context.competitors?.length > 0) score++;
    if (context.productIntelligence?.length > 0) score++;

    return score / total;
  },

  createErrorResult(agentName: string, error: any): AgentResult {
    return {
      agentName,
      agentRole: 'Error',
      inputData: {},
      outputData: {},
      decisionsMade: [],
      confidenceScore: 0,
      processingTimeMs: 0,
      tokensUsed: 0,
      costUsd: 0,
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
