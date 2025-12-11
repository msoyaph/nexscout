import { supabase } from '../../lib/supabase';
import { buildChatbotSystemInstruction } from '../ai/systemInstructionBuilder';
import { detectIntent, detectIntentWithConfidence, type UserIntent } from '../../engines/messaging/intentRouter';
import { detectFunnelStage, autoProgressStage, type FunnelStage } from '../../engines/funnel/funnelEngineV3';
import { buildUnifiedSystemPrompt, type PromptBuilderContext } from '../../engines/prompts/unifiedPromptBuilder';
import { detectBuyingSignalWithAnalysis, calculateBuyingIntentScore, type BuyingSignal } from '../../engines/signals/buyingSignals';
import { detectObjectionWithAnalysis, getObjectionRebuttal, type ObjectionType } from '../../engines/objections/objectionHandler';
import { calculateFollowUp, type FollowUpContext } from '../../engines/automation/followUpEngine';
import { buildClosingResponse, type ClosingContext, type ClosingResponse } from '../../engines/closing/closingEngineV2';
import { analyzeLeadTemperature, type LeadTemperature, type LeadSignals } from '../../engines/leads/leadTemperatureModel';
import { suggestOffer, type Product, type UpsellContext, type OfferSuggestion } from '../../engines/upsell/upsellDownsellEngine';
import { ChatbotProspectCreationService, type ContactInfo, type ChatQualificationData } from './chatbotProspectCreation';
import { aiOrchestrator } from '../ai/AIOrchestrator';

interface ChatMessage {
  sender: 'visitor' | 'ai';
  message: string;
}

interface BuyingSignals {
  priceInquiry: boolean;
  demoRequest: boolean;
  interestExpressed: boolean;
  urgencyIndicators: boolean;
}

interface AIEngineResponse {
  response: string;
  intent: string;
  buyingSignals: string[];
  emotion: string;
  confidence: number;
  suggestedAction: string | null;
}

export class PublicChatbotEngine {
  private sessionId: string;
  private userId: string;
  private chatbotSettings: any;
  private conversationHistory: ChatMessage[] = [];
  private companyData: any = null;
  private companyIntelligence: any = null;
  private productsData: any[] = [];
  private trainingData: any[] = [];
  private conversationContext: Map<string, any> = new Map();
  private currentFunnelStage: FunnelStage = 'awareness';
  private sessionIntent: UserIntent | null = null;
  private detectedBuyingSignals: BuyingSignal[] = [];
  private leadTemperature: 'cold' | 'warm' | 'hot' | 'readyToBuy' = 'cold';
  private buyingIntentScore: number = 0;
  private intentsHistory: UserIntent[] = [];
  private leadTemperatureModel: LeadTemperature = 'cold';
  private leadScore: number = 0;
  private currentProductId: string | null = null;
  private lastOfferSuggestion: OfferSuggestion | null = null;
  private sessionStartTime: number = Date.now();

  constructor(sessionId: string, userId: string, settings: any) {
    this.sessionId = sessionId;
    this.userId = userId;
    this.chatbotSettings = settings;
  }

  /**
   * Build workspace-based system instruction for AI
   */
  private async buildSystemInstruction(): Promise<string> {
    try {
      // Check if custom instructions are enabled and should override
      if (this.chatbotSettings?.use_custom_instructions &&
          this.chatbotSettings?.custom_system_instructions) {

        // If override is enabled, use ONLY custom instructions
        if (this.chatbotSettings?.instructions_override_intelligence) {
          console.log('[PublicChatbot] Using custom instructions (override mode)');
          let prompt = this.chatbotSettings.custom_system_instructions;
          
          // Add products and files from attachments
          const attachments = this.chatbotSettings?.integrations?.instructions_attachments || [];
          if (attachments && attachments.length > 0) {
            const products = attachments.filter((a: any) => a.type === 'product');
            const files = attachments.filter((a: any) => 
              (a.type === 'other' || a.type === 'pdf' || a.type === 'document') && 
              (a.fileType === 'brochure' || a.fileType === 'pdf' || a.fileType === 'document')
            );
            
            if (products.length > 0 || files.length > 0) {
              prompt += '\n\n========================================\n';
              if (products.length > 0) {
                prompt += 'PRODUCTS & PRODUCT LINKS (Send when asked)\n';
                prompt += '========================================\n';
                prompt += 'IMPORTANT: When visitors ask about products, share the product information and link them to the product URL.\n\n';
                products.forEach((p: any, i: number) => {
                  prompt += `${i + 1}. PRODUCT: ${p.name || 'Unnamed Product'}\n`;
                  if (p.description) prompt += `   Description: ${p.description}\n`;
                  prompt += `   Link: ${p.productLink || p.url || 'No link available'}\n\n`;
                });
              }
              
              if (files.length > 0) {
                prompt += '========================================\n';
                prompt += 'DOWNLOADABLE FILES & DOCUMENTS (Send when asked)\n';
                prompt += '========================================\n';
                prompt += 'IMPORTANT: When visitors ask for brochures, catalogs, or company files, share the file link from below.\n\n';
                files.forEach((f: any, i: number) => {
                  prompt += `${i + 1}. ${(f.fileType || 'FILE').toUpperCase()}: ${f.displayName || f.name || 'Unnamed File'}\n`;
                  prompt += `   URL: ${f.url}\n\n`;
                });
              }
            }
          }
          
          return prompt;
        }

        // Otherwise, combine workspace + custom instructions
        console.log('[PublicChatbot] Using workspace + custom instructions');
        const workspaceInstruction = await buildChatbotSystemInstruction(
          this.userId,
          'web'
        );

        let combinedPrompt = `${workspaceInstruction}

========================================
CUSTOM INSTRUCTIONS (HIGH PRIORITY)
========================================

${this.chatbotSettings.custom_system_instructions}

IMPORTANT: Follow the custom instructions above while maintaining the company context and safety rules.`;

        // Add products and files from attachments
        const attachments = this.chatbotSettings?.integrations?.instructions_attachments || [];
        if (attachments && attachments.length > 0) {
          const products = attachments.filter((a: any) => a.type === 'product');
          const files = attachments.filter((a: any) => 
            (a.type === 'other' || a.type === 'pdf' || a.type === 'document') && 
            (a.fileType === 'brochure' || a.fileType === 'pdf' || a.fileType === 'document')
          );
          
          if (products.length > 0 || files.length > 0) {
            combinedPrompt += '\n\n========================================\n';
            if (products.length > 0) {
              combinedPrompt += 'PRODUCTS & PRODUCT LINKS\n';
              combinedPrompt += '========================================\n';
              products.forEach((p: any, i: number) => {
                combinedPrompt += `${i + 1}. ${p.name || 'Unnamed Product'}\n`;
                if (p.description) combinedPrompt += `   Description: ${p.description}\n`;
                combinedPrompt += `   Link: ${p.productLink || p.url || ''}\n\n`;
              });
            }
            
            if (files.length > 0) {
              combinedPrompt += '========================================\n';
              combinedPrompt += 'DOWNLOADABLE FILES & DOCUMENTS\n';
              combinedPrompt += '========================================\n';
              files.forEach((f: any, i: number) => {
                combinedPrompt += `${i + 1}. ${(f.fileType || 'FILE').toUpperCase()}: ${f.displayName || f.name || 'Unnamed File'}\n`;
                combinedPrompt += `   URL: ${f.url}\n\n`;
              });
            }
          }
        }

        return combinedPrompt;
      }

      // Default: Use workspace-based instruction builder
      const instruction = await buildChatbotSystemInstruction(
        this.userId,
        'web'
      );
      return instruction;
    } catch (error) {
      console.error('[PublicChatbot] Failed to build system instruction:', error);
      // Fallback to basic instruction
      return this.buildFallbackInstruction();
    }
  }

  /**
   * Fallback instruction if workspace config not available
   */
  private buildFallbackInstruction(): string {
    const companyName = this.companyData?.company_name || 'our company';
    const chatbotName = this.chatbotSettings?.display_name || 'AI Assistant';
    const tone = this.chatbotSettings?.tone || 'professional';
    const replyDepth = this.chatbotSettings?.reply_depth || 'medium';

    let instruction = `You are ${chatbotName}, an AI assistant for ${companyName}.

Tone: ${tone}
Reply Length: ${replyDepth}

Your goal is to help prospects, answer questions, and guide them through our offerings.
Be ${tone}, helpful, and responsive.`;

    // Add custom instructions if available
    if (this.chatbotSettings?.use_custom_instructions &&
        this.chatbotSettings?.custom_system_instructions) {
      instruction += `\n\nCUSTOM INSTRUCTIONS:\n${this.chatbotSettings.custom_system_instructions}`;
    }

    return instruction;
  }

  private async loadIntelligence() {
    if (this.companyData) return; // Already loaded

    console.log('[PublicChatbot] Loading intelligence for user:', this.userId);

    try {
      // Load company profile
      console.log('[PublicChatbot] Loading company profile...');
      const { data: company, error: companyError } = await supabase
        .from('company_profiles')
        .select('*')
        .eq('user_id', this.userId)
        .maybeSingle();

      if (companyError) {
        console.error('[PublicChatbot] Company load error:', companyError);
      } else {
        this.companyData = company;
        console.log('[PublicChatbot] Company loaded:', !!company);
      }

      // Load company intelligence (AI-generated insights)
      console.log('[PublicChatbot] Loading company intelligence...');
      const { data: intelligence, error: intelligenceError } = await supabase
        .from('company_intelligence_v2')
        .select('*')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (intelligenceError) {
        console.error('[PublicChatbot] Intelligence load error:', intelligenceError);
      } else {
        this.companyIntelligence = intelligence;
        console.log('[PublicChatbot] Intelligence loaded:', !!intelligence);
      }

      // Load products with full intelligence
      console.log('[PublicChatbot] Loading products...');
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select(`
          id, name, short_description, long_description, product_type,
          features, benefits, use_cases, target_audience, pricing_model,
          unique_selling_points
        `)
        .eq('user_id', this.userId)
        .eq('active', true)
        .limit(10);

      if (productsError) {
        console.error('[PublicChatbot] Products load error:', productsError);
      } else {
        this.productsData = products || [];
        console.log('[PublicChatbot] Products loaded:', this.productsData.length);
      }

      // Load training data
      console.log('[PublicChatbot] Loading training data...');
      const { data: training, error: trainingError } = await supabase
        .from('public_chatbot_training_data')
        .select('*')
        .eq('user_id', this.userId)
        .eq('is_active', true)
        .limit(20);

      if (trainingError) {
        console.error('[PublicChatbot] Training load error:', trainingError);
      } else {
        this.trainingData = training || [];
        console.log('[PublicChatbot] Training data loaded:', this.trainingData.length);
      }

      console.log('[PublicChatbot] Intelligence loaded successfully:', {
        company: !!this.companyData,
        intelligence: !!this.companyIntelligence,
        products: this.productsData.length,
        training: this.trainingData.length
      });
    } catch (error) {
      console.error('[PublicChatbot] Fatal error loading intelligence:', error);
      throw error;
    }
  }

  async processMessage(userMessage: string): Promise<AIEngineResponse> {
    console.log('[PublicChatbot] Processing message:', userMessage);

    try {
      // Check if using custom instructions with override
      const useCustomInstructions = this.chatbotSettings?.use_custom_instructions || false;
      const overrideIntelligence = this.chatbotSettings?.instructions_override_intelligence || false;
      const customInstructions = this.chatbotSettings?.custom_system_instructions || '';

      console.log('[PublicChatbot] Custom instructions mode:', { useCustomInstructions, overrideIntelligence });

      // Load intelligence data
      if (!overrideIntelligence) {
        console.log('[PublicChatbot] Step 1: Loading full intelligence...');
        await this.loadIntelligence();
      } else {
        console.log('[PublicChatbot] Step 1: Override mode - loading minimal data (products only)');
        // In override mode, still load products so they can be referenced
        try {
          const { data: products } = await supabase
            .from('products')
            .select('*')
            .eq('user_id', this.userId)
            .eq('is_active', true);

          this.productsData = products || [];
          console.log('[PublicChatbot] Loaded products:', this.productsData.length);
        } catch (error) {
          console.error('[PublicChatbot] Error loading products:', error);
          this.productsData = [];
        }
      }

      // Add to conversation history
      console.log('[PublicChatbot] Step 2: Adding to conversation history');
      this.conversationHistory.push({
        sender: 'visitor',
        message: userMessage
      });

      // Analyze message with Filipino sales intelligence
      console.log('[PublicChatbot] Step 3: Analyzing message (Filipino Sales Pipeline)');
      const intent = this.detectIntent(userMessage);
      const funnelStage = this.updateFunnelStage(intent);

      // Track intent history
      this.intentsHistory.push(intent);

      // NEW: Advanced buying signals detection
      const buyingSignalAnalysis = detectBuyingSignalWithAnalysis(userMessage);
      this.detectedBuyingSignals.push(buyingSignalAnalysis.signal);
      this.leadTemperature = buyingSignalAnalysis.temperature;

      // Calculate overall buying intent score
      const historyMessages = this.conversationHistory.map(h => h.message);
      this.buyingIntentScore = calculateBuyingIntentScore(this.detectedBuyingSignals, historyMessages);

      // NEW: Lead Temperature Model
      const leadSignals: LeadSignals = {
        intents: this.intentsHistory,
        buyingSignals: this.detectedBuyingSignals,
        funnelStage: this.currentFunnelStage,
        messagesCount: this.conversationHistory.length,
        lastReplyMsAgo: Date.now() - this.sessionStartTime
      };
      const leadAnalysis = analyzeLeadTemperature(leadSignals);
      this.leadTemperatureModel = leadAnalysis.temperature;
      this.leadScore = leadAnalysis.score;

      // NEW: Upsell/Downsell Engine
      const products = this.productsData.map((p: any) => ({
        id: p.id,
        name: p.name,
        price: p.price || 0,
        tier: (p.tier || 'core') as any
      })) as Product[];

      const budgetConcern = intent === 'hesitation' || /mahal|expensive|costly|bitin.*budget/i.test(userMessage);
      const wantsIncome = intent === 'earning_opportunity' || /income|kumita|kita|negosyo/i.test(userMessage);

      let offerSuggestion: OfferSuggestion | null = null;
      if (products.length > 0) {
        const upsellContext: UpsellContext = {
          currentProductId: this.currentProductId || undefined,
          products,
          leadTemperature: this.leadTemperatureModel,
          lastIntent: intent,
          lastBuyingSignal: buyingSignalAnalysis.signal,
          budgetConcern,
          wantsIncome
        };
        offerSuggestion = suggestOffer(upsellContext);
        this.lastOfferSuggestion = offerSuggestion;

        // Update current product if there's a suggestion
        if (offerSuggestion.toProduct) {
          this.currentProductId = offerSuggestion.toProduct.id;
        }
      }

      // NEW: Objection detection
      const objectionAnalysis = detectObjectionWithAnalysis(userMessage, intent);

      // Legacy buying signals (keep for compatibility)
      const buyingSignals = this.detectBuyingSignals(userMessage);
      const emotion = this.detectEmotion(userMessage);
      const urgency = this.detectUrgency(userMessage);

      console.log('[PublicChatbot] Analysis:', {
        intent,
        funnelStage,
        buyingSignal: buyingSignalAnalysis.signal,
        leadTemperature: this.leadTemperature,
        leadTemperatureModel: this.leadTemperatureModel,
        leadScore: this.leadScore,
        buyingIntentScore: this.buyingIntentScore,
        objection: objectionAnalysis.objectionType,
        offerType: offerSuggestion?.type,
        suggestedProduct: offerSuggestion?.toProduct?.name,
        emotion,
        urgency,
        buyingSignals
      });

      // Generate response using NEW unified prompt builder
      console.log('[PublicChatbot] Step 4: Generating response (Intent + Funnel Aware)');
      let response: AIEngineResponse;

      if (useCustomInstructions && overrideIntelligence) {
        // Override mode: Use ONLY custom instructions (legacy flow)
        console.log('[PublicChatbot] Using custom instruction override mode');
        response = await this.generateCustomInstructionResponse(
          userMessage,
          customInstructions,
          overrideIntelligence,
          intent,
          buyingSignals,
          emotion,
          urgency
        );
      } else {
        // NEW: Use Filipino sales pipeline with unified prompt
        console.log('[PublicChatbot] Using NEW Filipino sales pipeline');
        response = await this.generateUnifiedResponse(
          userMessage,
          intent,
          funnelStage,
          buyingSignals,
          emotion,
          urgency
        );
      }
      console.log('[PublicChatbot] Response generated:', response.response.substring(0, 100) + '...');

      // Add AI response to history
      this.conversationHistory.push({
        sender: 'ai',
        message: response.response
      });

      // Update session scores and state
      console.log('[PublicChatbot] Step 5: Updating session scores and conversation state');
      await this.updateSessionScores(buyingSignals, intent, urgency);
      await this.updateConversationState(intent, funnelStage, objectionAnalysis.objectionType);

      // Check if should escalate to human
      const shouldEscalate = this.shouldEscalateToHuman(buyingSignals, urgency);

      if (shouldEscalate) {
        console.log('[PublicChatbot] Step 6: Escalating to human');
        await this.notifyHumanAgent();
      }

      console.log('[PublicChatbot] Processing complete!');
      return response;
    } catch (error) {
      console.error('[PublicChatbot] FATAL ERROR in processMessage:', error);
      console.error('[PublicChatbot] Error stack:', error instanceof Error ? error.stack : 'No stack');
      throw error;
    }
  }

  /**
   * NEW: Generate response using Filipino sales pipeline
   * Intent + Funnel aware with unified prompt builder
   */
  private async generateUnifiedResponse(
    userMessage: string,
    intent: UserIntent,
    funnelStage: FunnelStage,
    buyingSignals: BuyingSignals,
    emotion: string,
    urgency: string
  ): Promise<AIEngineResponse> {
    console.log('[PublicChatbot] Generating unified response...');

    const signals: string[] = [];
    let suggestedAction: string | null = null;

    // Build signals array
    if (buyingSignals.priceInquiry) signals.push('price_inquiry');
    if (buyingSignals.demoRequest) signals.push('demo_request');
    if (buyingSignals.interestExpressed) signals.push('interest_expressed');
    if (buyingSignals.urgencyIndicators) signals.push('urgency_detected');

    // Check for exact training data match first
    const matchedTraining = this.findMatchingTrainingData(userMessage);
    if (matchedTraining) {
      console.log('[PublicChatbot] Using training data exact match');
      return {
        response: matchedTraining.answer,
        intent: intent as string,
        buyingSignals: signals,
        emotion,
        confidence: 0.95,
        suggestedAction: null
      };
    }

    // NEW: Use Closing Engine v2 for high-priority closing situations
    const useClosingEngine = (
      this.leadTemperature === 'hot' ||
      this.leadTemperature === 'readyToBuy' ||
      funnelStage === 'closing' ||
      funnelStage === 'decision' ||
      intent === 'ready_to_buy' ||
      this.buyingIntentScore >= 60
    );

    if (useClosingEngine) {
      console.log('[PublicChatbot] Using Closing Engine v2 for high-priority close');

      const closingContext: ClosingContext = {
        intent,
        funnelStage,
        buyingSignal: this.detectedBuyingSignals[this.detectedBuyingSignals.length - 1] || 'none',
        productName: this.productsData[0]?.name || 'our product',
        price: this.productsData[0]?.price || 'Contact us',
        companyName: this.companyData?.company_name || 'our company',
        personaName: this.chatbotSettings?.display_name || 'I',
        tone: this.chatbotSettings?.tone || 'taglish',
        hasMultipleProducts: this.productsData.length > 1,
        hasCOD: true,
        hasPromo: false
      };

      const closingResult: ClosingResponse = buildClosingResponse(closingContext);

      // Update suggested action from closing engine
      suggestedAction = closingResult.nextStep;
      if (closingResult.shouldEscalate) {
        signals.push('escalate_to_human');
      }

      return {
        response: closingResult.message,
        intent: intent as string,
        buyingSignals: signals,
        emotion,
        confidence: 0.9,
        suggestedAction
      };
    }

    // Check if Override Intelligence is ON
    const overrideIntelligence = this.chatbotSettings?.instructions_override_intelligence || false;
    const useCustomInstructions = this.chatbotSettings?.use_custom_instructions || false;
    const customInstructions = this.chatbotSettings?.custom_system_instructions || '';

    let systemPrompt: string;
    let userPrompt: string;
    let suggestedStrategy: string = 'custom';

    if (useCustomInstructions && overrideIntelligence && customInstructions) {
      // OVERRIDE MODE: Use ONLY custom instructions
      console.log('[PublicChatbot] OVERRIDE MODE: Using ONLY custom instructions');

      // Build minimal context for products and conversation
      let contextInfo = '';

      // Add products and files from attachments (NEW)
      const attachments = this.chatbotSettings?.integrations?.instructions_attachments || [];
      if (attachments && attachments.length > 0) {
        // Extract products
        const products = attachments.filter((a: any) => a.type === 'product');
        if (products.length > 0) {
          contextInfo += '\n\n========================================\n';
          contextInfo += 'PRODUCTS & PRODUCT LINKS (Send when asked)\n';
          contextInfo += '========================================\n';
          contextInfo += 'IMPORTANT: When visitors ask about products, share the product information and link them to the product URL.\n\n';
          products.forEach((p: any, i: number) => {
            contextInfo += `${i + 1}. PRODUCT: ${p.name || 'Unnamed Product'}\n`;
            if (p.description) contextInfo += `   Description: ${p.description}\n`;
            contextInfo += `   Link: ${p.productLink || p.url || 'No link available'}\n\n`;
          });
        }

        // Extract file links (brochures, documents)
        const files = attachments.filter((a: any) => 
          (a.type === 'other' || a.type === 'pdf' || a.type === 'document') && 
          (a.fileType === 'brochure' || a.fileType === 'pdf' || a.fileType === 'document')
        );
        if (files.length > 0) {
          contextInfo += '========================================\n';
          contextInfo += 'DOWNLOADABLE FILES & DOCUMENTS (Send when asked)\n';
          contextInfo += '========================================\n';
          contextInfo += 'IMPORTANT: When visitors ask for brochures, catalogs, or company files, share the file link from below.\n\n';
          files.forEach((f: any, i: number) => {
            contextInfo += `${i + 1}. ${(f.fileType || 'FILE').toUpperCase()}: ${f.displayName || f.name || 'Unnamed File'}\n`;
            contextInfo += `   URL: ${f.url}\n\n`;
          });
        }
      }

      // Add product information from database if available (fallback)
      if (this.productsData && this.productsData.length > 0) {
        contextInfo += '\n=== AVAILABLE PRODUCTS (Database) ===\n';
        this.productsData.forEach((p: any, i: number) => {
          contextInfo += `${i + 1}. ${p.name}`;
          if (p.price) contextInfo += ` - ₱${p.price}`;
          if (p.description) contextInfo += `\n   ${p.description}`;
          contextInfo += '\n';
        });
      }

      // Add conversation history context
      if (this.conversationHistory.length > 1) {
        contextInfo += '\n=== CONVERSATION SO FAR ===\n';
        this.conversationHistory.slice(-5).forEach(h => {
          contextInfo += `${h.sender === 'visitor' ? 'Customer' : 'You'}: ${h.message}\n`;
        });
      }

      // Use ONLY custom instructions + minimal context
      systemPrompt = customInstructions + contextInfo;
      userPrompt = `Customer's new message: ${userMessage}`;

      console.log('[PublicChatbot] System prompt length:', systemPrompt.length);
    } else {
      // NORMAL MODE: Use unified prompt with all intelligence
      console.log('[PublicChatbot] NORMAL MODE: Using unified prompt builder');

      // Build upsell context string if available
      let upsellContext = '';
      if (this.lastOfferSuggestion && this.lastOfferSuggestion.type !== 'stay') {
        upsellContext = `\n\n=== PRODUCT RECOMMENDATION STRATEGY ===
Type: ${this.lastOfferSuggestion.type.toUpperCase()}
${this.lastOfferSuggestion.fromProduct ? `Current consideration: ${this.lastOfferSuggestion.fromProduct.name}` : ''}
${this.lastOfferSuggestion.toProduct ? `Recommended: ${this.lastOfferSuggestion.toProduct.name} (₱${this.lastOfferSuggestion.toProduct.price})` : ''}

SUGGESTION MESSAGE (use naturally in your response):
${this.lastOfferSuggestion.message}

Lead Temperature: ${this.leadTemperatureModel.toUpperCase()} (Score: ${this.leadScore}/100)`;
      }

      // Build unified prompt context
      const promptContext: PromptBuilderContext = {
        channel: 'web',
        userMessage,
        detectedIntent: intent,
        funnelStage,
        leadTemperature: urgency === 'high' ? 'hot' : urgency === 'medium' ? 'warm' : 'cold',
        companyName: this.companyData?.company_name,
        products: this.productsData.map(p => ({
          name: p.name,
          price: p.price || 'Contact us',
          benefits: p.description || p.benefits || 'Great product'
        })),
        tone: this.chatbotSettings?.tone || 'professional',
        customInstructions: (useCustomInstructions && customInstructions ? customInstructions : '') + upsellContext,
        conversationHistory: this.conversationHistory.map(h => ({
          sender: h.sender === 'visitor' ? 'visitor' : 'ai',
          message: h.message
        }))
      };

      // Build unified prompt
      const result = buildUnifiedSystemPrompt(promptContext);
      systemPrompt = result.systemPrompt;
      userPrompt = result.userPrompt;
      suggestedStrategy = result.suggestedStrategy;
    }

    console.log('[PublicChatbot] Using prompt with strategy:', suggestedStrategy);

    // Call AIOrchestrator (centralized AI system with energy tracking, retry logic, etc.)
    try {
      const result = await aiOrchestrator.generate({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        config: {
          userId: this.userId,
          action: 'ai_chatbot_response',
          model: 'gpt-4o-mini',
          temperature: 0.7,
          maxTokens: 500,
          autoSelectModel: true, // Auto-downgrade if low energy
        }
      });

      if (!result.success || !result.content) {
        throw new Error(result.error || 'AI generation failed');
      }

      const aiResponse = result.content;

      // Determine suggested action based on intent + stage
      if (intent === 'ready_to_buy' || funnelStage === 'closing') {
        suggestedAction = 'send_order_link';
        signals.push('hot_lead', 'ready_to_close');
      } else if (intent === 'price' && funnelStage === 'evaluation') {
        suggestedAction = 'send_pricing_offer';
        signals.push('pricing_discussion');
      } else if (intent === 'hesitation') {
        suggestedAction = 'address_objection';
        signals.push('objection_detected');
      } else if (funnelStage === 'decision') {
        suggestedAction = 'push_for_decision';
        signals.push('decision_stage');
      }

      return {
        response: aiResponse,
        intent: intent as string,
        buyingSignals: signals,
        emotion,
        confidence: 0.85,
        suggestedAction
      };
    } catch (error) {
      console.error('[PublicChatbot] Error calling OpenAI:', error);

      // Fallback to legacy intelligent response
      return await this.generateIntelligentResponse(
        userMessage,
        intent as any,
        buyingSignals,
        emotion,
        urgency
      );
    }
  }

  /**
   * Detect intent using Filipino-optimized engine
   */
  private detectIntent(message: string): UserIntent {
    const result = detectIntentWithConfidence(message);
    console.log('[PublicChatbot] Intent detection:', result);
    return result.intent;
  }

  /**
   * Update funnel stage based on detected intent
   */
  private updateFunnelStage(intent: UserIntent): FunnelStage {
    const suggestedStage = detectFunnelStage(intent);
    this.currentFunnelStage = autoProgressStage(this.currentFunnelStage, suggestedStage);
    console.log('[PublicChatbot] Funnel stage updated:', this.currentFunnelStage);
    return this.currentFunnelStage;
  }

  /**
   * LEGACY detectIntent - keeping for backwards compatibility
   */
  private detectIntentLegacy(message: string): string {
    const lower = message.toLowerCase();

    if (lower.includes('price') || lower.includes('magkano') || lower.includes('cost') || lower.includes('how much')) {
      return 'pricing_inquiry';
    }
    if (lower.includes('demo') || lower.includes('schedule') || lower.includes('meeting') || lower.includes('call')) {
      return 'demo_request';
    }
    if (lower.includes('buy') || lower.includes('purchase') || lower.includes('order') || lower.includes('bili')) {
      return 'purchase_intent';
    }
    if (lower.includes('product') || lower.includes('service') || lower.includes('offer') || lower.includes('sell')) {
      return 'product_inquiry';
    }
    if (lower.includes('about') || lower.includes('who are') || lower.includes('company') || lower.includes('business')) {
      return 'company_inquiry';
    }
    if (lower.includes('help') || lower.includes('assist') || lower.includes('tulong') || lower.includes('question')) {
      return 'help_request';
    }
    if (lower.includes('interested') || lower.includes('gusto') || lower.includes('want') || lower.includes('need')) {
      return 'interest_expressed';
    }
    if (lower.includes('not interested') || lower.includes('no thanks') || lower.includes('hindi') || lower.includes('ayaw')) {
      return 'objection';
    }

    return 'general_inquiry';
  }

  private detectBuyingSignals(message: string): BuyingSignals {
    return {
      priceInquiry: /price|cost|magkano|how much|pricing|fee/i.test(message),
      demoRequest: /demo|schedule|meeting|call|appointment/i.test(message),
      interestExpressed: /interested|want|need|gusto|like to/i.test(message),
      urgencyIndicators: /now|today|urgent|asap|kailangan na|soon/i.test(message)
    };
  }

  private detectEmotion(message: string): string {
    if (/excited|great|awesome|amazing|love|perfect/i.test(message)) {
      return 'excited';
    }
    if (/confused|not sure|unclear|understand|hindi ko/i.test(message)) {
      return 'confused';
    }
    if (/frustrated|annoyed|disappointed|problem/i.test(message)) {
      return 'frustrated';
    }
    if (/worried|concerned|anxious|scared|takot/i.test(message)) {
      return 'concerned';
    }

    return 'neutral';
  }

  private detectUrgency(message: string): 'high' | 'medium' | 'low' {
    if (/urgent|asap|now|today|immediately|kailangan na/i.test(message)) {
      return 'high';
    }
    if (/soon|this week|next few days|next week/i.test(message)) {
      return 'medium';
    }

    return 'low';
  }

  private async generateIntelligentResponse(
    userMessage: string,
    intent: string,
    buyingSignals: BuyingSignals,
    emotion: string,
    urgency: 'high' | 'medium' | 'low'
  ): Promise<AIEngineResponse> {

    const signals: string[] = [];
    let suggestedAction: string | null = null;
    let response = '';

    // Build signals array
    if (buyingSignals.priceInquiry) signals.push('price_inquiry');
    if (buyingSignals.demoRequest) signals.push('demo_request');
    if (buyingSignals.interestExpressed) signals.push('interest_expressed');
    if (buyingSignals.urgencyIndicators) signals.push('urgency_detected');

    // Get personality/tone settings
    const tone = this.chatbotSettings?.tone || 'professional';
    const replyDepth = this.chatbotSettings?.reply_depth || 'medium';
    const objectionStyle = this.chatbotSettings?.objection_style || 'empathetic';

    const isFriendlyTone = tone === 'friendly' || tone === 'casual';
    const isEmpathetic = emotion === 'confused' || emotion === 'frustrated' || emotion === 'concerned';
    const isTaglish = tone === 'taglish';

    // Check if question matches training data
    const matchedTraining = this.findMatchingTrainingData(userMessage);
    if (matchedTraining) {
      response = matchedTraining.answer;
      console.log('[PublicChatbot] Using training data match');
    } else {
      // Generate intelligent response based on intent and available data
      switch (intent) {
        case 'company_inquiry':
          response = this.generateCompanyResponse(tone, isTaglish);
          break;

        case 'product_inquiry':
          response = this.generateProductResponse(tone, isTaglish, replyDepth);
          signals.push('product_interest');
          break;

        case 'pricing_inquiry':
          response = this.generatePricingResponse(tone, isTaglish, urgency);
          signals.push('price_question');
          suggestedAction = 'send_pricing_sheet';
          break;

        case 'demo_request':
          response = `I'd be happy to set up a demo for you! ${urgency === 'high' ? 'I can arrange something as soon as today or tomorrow. ' : ''}Our team will show you exactly how everything works and answer all your questions. What's your email address, and when would be a good time for you?`;
          signals.push('demo_interest', 'high_intent');
          suggestedAction = 'schedule_demo';
          break;

        case 'purchase_intent':
          response = `That's wonderful! I'm excited to help you get started. To ensure a smooth process, I'll connect you with our team who can assist with the purchase. Before that, may I have your name and email? Also, which product or service are you most interested in?`;
          signals.push('purchase_ready', 'high_intent', 'hot_lead');
          suggestedAction = 'escalate_to_sales';
          break;

        case 'interest_expressed':
          response = isEmpathetic
            ? `I really appreciate your interest! I want to make sure I can provide you with the best information. Could you tell me a bit more about what specifically caught your attention? That way, I can tailor my responses to your needs.`
            : `That's great to hear! I'd love to learn more about what you're looking for so I can help you find the perfect solution. What aspects are you most interested in?`;
          signals.push('interest_signal');
          suggestedAction = 'qualify_lead';
          break;

        case 'help_request':
          response = `I'm here to help! I can assist you with information about ${this.companyData?.company_name || 'our company'}, our products and services, pricing, features, scheduling demos, or answer any questions you have. What would you like to know more about?`;
          break;

        case 'objection':
          response = this.generateObjectionResponse(objectionStyle, isTaglish);
          signals.push('objection_raised');
          suggestedAction = 'handle_objection';
          break;

        default:
          response = `Thanks for reaching out! ${this.chatbotSettings?.display_name || 'I am'} here to help. `;
          if (this.companyData) {
            response += `At ${this.companyData.company_name}, we are dedicated to helping you succeed. `;
          }
          response += `Could you tell me more about what you are looking for? I can provide information about our products, pricing, features, or schedule a demo for you.`;
          break;
      }
    }

    return {
      response,
      intent,
      buyingSignals: signals,
      emotion,
      confidence: signals.length > 0 ? 0.85 : 0.7,
      suggestedAction
    };
  }

  private findMatchingTrainingData(userMessage: string): any | null {
    if (!this.trainingData || this.trainingData.length === 0) return null;

    const lowerMessage = userMessage.toLowerCase();

    // Try exact match first
    for (const item of this.trainingData) {
      if (item.question.toLowerCase() === lowerMessage) {
        return item;
      }
    }

    // Try keyword match
    for (const item of this.trainingData) {
      const keywords = item.question.toLowerCase().split(' ').filter((w: string) => w.length > 3);
      const matchCount = keywords.filter((k: string) => lowerMessage.includes(k)).length;
      if (matchCount >= 2) {
        return item;
      }
    }

    return null;
  }

  /**
   * Update conversation state in database
   * Tracks intent, funnel stage, buying signals, temperature
   */
  private async updateConversationState(
    intent: UserIntent,
    funnelStage: FunnelStage,
    objectionType: ObjectionType
  ) {
    try {
      // Prepare buying signals array
      const signalsArray = Array.from(new Set(this.detectedBuyingSignals.map(s => s.toString())));
      const intentsArray = Array.from(new Set(this.intentsHistory.map(i => i.toString())));

      // Update public_chat_sessions with conversation state
      await supabase
        .from('public_chat_sessions')
        .update({
          current_intent: intent,
          current_funnel_stage: funnelStage,
          lead_temperature: this.leadTemperatureModel,
          lead_score: this.leadScore,
          current_product_id: this.currentProductId,
          suggested_product_id: this.lastOfferSuggestion?.toProduct?.id || null,
          offer_type: this.lastOfferSuggestion?.type || null,
          buying_signals_history: signalsArray,
          intents_history: intentsArray,
          buying_signals_detected: signalsArray,
          conversation_state: {
            intent_history: this.intentsHistory,
            buying_signals: this.detectedBuyingSignals,
            buying_intent_score: this.buyingIntentScore,
            lead_temperature: this.leadTemperatureModel,
            lead_score: this.leadScore,
            last_objection: objectionType,
            message_count: this.conversationHistory.length,
            offer_suggestion: this.lastOfferSuggestion ? {
              type: this.lastOfferSuggestion.type,
              from: this.lastOfferSuggestion.fromProduct?.name,
              to: this.lastOfferSuggestion.toProduct?.name
            } : null,
            updated_at: new Date().toISOString()
          },
          last_intent_update: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', this.sessionId);

      console.log('[PublicChatbot] Conversation state updated:', {
        intent,
        stage: funnelStage,
        temperature: this.leadTemperatureModel,
        score: this.leadScore,
        buyingIntentScore: this.buyingIntentScore,
        offerType: this.lastOfferSuggestion?.type
      });
    } catch (error) {
      console.error('[PublicChatbot] Error updating conversation state:', error);
    }
  }

  private async updateSessionScores(
    buyingSignals: BuyingSignals,
    intent: string,
    urgency: 'high' | 'medium' | 'low'
  ) {
    let scoreIncrease = 0;

    if (buyingSignals.priceInquiry) scoreIncrease += 0.15;
    if (buyingSignals.demoRequest) scoreIncrease += 0.25;
    if (buyingSignals.interestExpressed) scoreIncrease += 0.20;
    if (buyingSignals.urgencyIndicators) scoreIncrease += 0.15;

    if (intent === 'purchase_intent' || intent === 'ready_to_buy') scoreIncrease += 0.30;
    if (urgency === 'high') scoreIncrease += 0.10;

    // Boost score based on new buying intent score
    if (this.buyingIntentScore > 50) scoreIncrease += 0.15;
    if (this.buyingIntentScore > 75) scoreIncrease += 0.25;

    if (scoreIncrease > 0) {
      const { data: currentSession } = await supabase
        .from('public_chat_sessions')
        .select('buying_intent_score, qualification_score, prospect_id, status')
        .eq('id', this.sessionId)
        .maybeSingle();

      if (currentSession) {
        const newQualificationScore = Math.min(1, (currentSession.qualification_score || 0) + (scoreIncrease * 0.75));
        
        await supabase
          .from('public_chat_sessions')
          .update({
            buying_intent_score: Math.min(1, (currentSession.buying_intent_score || 0) + scoreIncrease),
            qualification_score: newQualificationScore,
            emotional_state: this.detectEmotion(this.conversationHistory[this.conversationHistory.length - 2]?.message || ''),
            updated_at: new Date().toISOString()
          })
          .eq('id', this.sessionId);

        // Check for auto-conversion if not already converted
        if (!currentSession.prospect_id && currentSession.status !== 'converted') {
          await this.checkAutoConversion(newQualificationScore);
        }
      }
    }
  }

  /**
   * Check if session should be auto-converted based on qualification score threshold
   */
  private async checkAutoConversion(qualificationScore: number): Promise<void> {
    try {
      // Get chatbot settings for auto-conversion
      const { data: settings } = await supabase
        .from('chatbot_settings')
        .select('auto_convert_to_prospect, auto_qualify_threshold')
        .eq('user_id', this.userId)
        .eq('is_active', true)
        .maybeSingle();

      if (!settings) {
        console.log('[PublicChatbot] No chatbot settings found for auto-conversion check');
        return;
      }

      // Check if auto-convert is enabled
      if (!settings.auto_convert_to_prospect) {
        console.log('[PublicChatbot] Auto-convert to prospect is disabled');
        return;
      }

      // Get threshold (default to 0.25 = 25% if not set)
      const threshold = settings.auto_qualify_threshold ?? 0.25;

      // Check if qualification score meets threshold
      if (qualificationScore >= threshold) {
        console.log(`[PublicChatbot] Qualification score ${qualificationScore} meets threshold ${threshold}, attempting auto-conversion`);
        
        // Get session to verify we have contact info
        const { data: session } = await supabase
          .from('public_chat_sessions')
          .select('visitor_name, visitor_email, visitor_phone, prospect_id, status')
          .eq('id', this.sessionId)
          .maybeSingle();

        if (!session) {
          console.error('[PublicChatbot] Session not found for auto-conversion');
          return;
        }

        // Verify not already converted
        if (session.prospect_id || session.status === 'converted') {
          console.log('[PublicChatbot] Session already converted, skipping');
          return;
        }

        // Verify we have at least name or email/phone for conversion
        if (!session.visitor_name && !session.visitor_email && !session.visitor_phone) {
          console.log('[PublicChatbot] Insufficient contact info for auto-conversion');
          return;
        }

        // Call RPC function to auto-qualify and convert
        const { data: prospectId, error } = await supabase.rpc('auto_qualify_session', {
          p_session_id: this.sessionId
        });

        if (error) {
          console.error('[PublicChatbot] Error in auto_qualify_session RPC:', error);
          return;
        }

        if (prospectId) {
          console.log(`[PublicChatbot] ✅ Successfully auto-converted session to prospect: ${prospectId}`);
          
          // Optionally send notification
          try {
            await supabase.from('notifications').insert({
              user_id: this.userId,
              type: 'prospect_created',
              title: 'New Prospect Created',
              message: `A visitor has been automatically converted to a prospect from chat session.`,
              data: { session_id: this.sessionId, prospect_id: prospectId, source: 'auto_conversion' }
            });
          } catch (notifError) {
            console.error('[PublicChatbot] Failed to create notification:', notifError);
          }
        } else {
          console.log('[PublicChatbot] Auto-qualify session returned null (not qualified)');
        }
      } else {
        console.log(`[PublicChatbot] Qualification score ${qualificationScore} below threshold ${threshold}`);
      }
    } catch (error) {
      console.error('[PublicChatbot] Error checking auto-conversion:', error);
    }
  }

  private shouldEscalateToHuman(buyingSignals: BuyingSignals, urgency: string): boolean {
    const signalCount = Object.values(buyingSignals).filter(Boolean).length;
    return signalCount >= 2 && urgency === 'high';
  }

  private async notifyHumanAgent() {
    try {
      await supabase.from('notifications').insert({
        user_id: this.userId,
        type: 'high_intent_visitor',
        title: 'Hot Lead Alert!',
        message: `A visitor in chat session ${this.sessionId} is showing high buying intent and urgency. Consider taking over the conversation.`,
        data: { session_id: this.sessionId, source: 'public_chatbot' }
      });
    } catch (error) {
      console.error('Failed to create notification:', error);
    }
  }

  // === SMART RESPONSE GENERATORS ===

  private generateCompanyResponse(tone: string, isTaglish: boolean): string {
    const companyName = this.companyData?.company_name || this.chatbotSettings?.display_name || 'our company';
    const tagline = this.companyData?.tagline || '';
    const description = this.companyData?.description || '';
    const mission = this.companyData?.mission || '';
    const vision = this.companyData?.vision || '';
    const industry = this.companyData?.industry || '';

    // Use company intelligence if available
    const intelligenceSummary = this.companyIntelligence?.value_proposition ||
      this.companyIntelligence?.elevator_pitch || '';

    let response = '';

    if (isTaglish) {
      response = `Ako si ${this.chatbotSettings?.display_name || 'AI Assistant'} from ${companyName}! `;
      if (tagline) response += `${tagline}. `;
      if (intelligenceSummary) {
        response += intelligenceSummary + ' ';
      } else if (description) {
        response += description + ' ';
      }
      if (industry) response += `Specialist kami sa ${industry}. `;
      response += 'Ano po ang gusto ninyong malaman?';
    } else if (tone === 'friendly' || tone === 'casual') {
      response = `Hey! I'm ${this.chatbotSettings?.display_name || 'your AI assistant'} from ${companyName}. `;
      if (tagline) response += `${tagline}! `;
      if (intelligenceSummary) {
        response += intelligenceSummary + ' ';
      } else if (description) {
        response += description + ' ';
      }
      if (mission) response += `Our mission? ${mission} `;
      response += 'What would you like to know?';
    } else if (tone === 'persuasive') {
      response = `Welcome! At ${companyName}, we're transforming how businesses succeed. `;
      if (intelligenceSummary) {
        response += intelligenceSummary + ' ';
      } else if (vision) {
        response += `Our vision: ${vision}. `;
      }
      if (description) response += description + ' ';
      response += 'Let me show you how we can help you achieve your goals.';
    } else {
      // Professional tone
      response = `Thank you for your interest in ${companyName}. `;
      if (tagline) response += `${tagline}. `;
      if (intelligenceSummary) {
        response += intelligenceSummary + ' ';
      } else if (description) {
        response += description + ' ';
      }
      if (industry) response += `We specialize in ${industry}. `;
      response += 'How may I assist you today?';
    }

    return response;
  }

  private generateProductResponse(tone: string, isTaglish: boolean, replyDepth: string): string {
    let response = '';

    if (this.productsData.length === 0) {
      if (isTaglish) {
        return 'May mga products at services kami na perfect para sa inyo! Ano po specifically ang hinahanap ninyo para makapag-recommend ako ng best fit?';
      }
      return tone === 'friendly'
        ? `I'd love to tell you about what we offer! We have solutions designed specifically for your needs. What kind of solution are you looking for?`
        : `We offer comprehensive solutions tailored to your specific requirements. Could you share more about what you're looking for so I can provide the most relevant information?`;
    }

    if (isTaglish) {
      response = `Meron kaming ${this.productsData.length} products/services na maganda:\n\n`;
      this.productsData.slice(0, replyDepth === 'long' ? 5 : 3).forEach((product: any, idx: number) => {
        response += `${idx + 1}. **${product.name}**`;
        if (replyDepth === 'short') {
          response += ` - ${product.short_description || 'Great solution for you!'}\n`;
        } else {
          const desc = product.long_description || product.short_description || '';
          response += `\n   ${desc}\n`;
          if (replyDepth === 'long' && product.benefits) {
            response += `   Benefits: ${Array.isArray(product.benefits) ? product.benefits.join(', ') : product.benefits}\n`;
          }
        }
      });
      response += `\nAlin ang interesting sa inyo?`;
    } else if (tone === 'friendly' || tone === 'casual') {
      response = `Great question! Here's what we've got:\n\n`;
      this.productsData.slice(0, replyDepth === 'long' ? 5 : 3).forEach((product: any, idx: number) => {
        response += `${idx + 1}. **${product.name}**\n`;
        response += `   ${product.short_description || product.long_description || 'An awesome solution!'}\n`;
        if (replyDepth === 'long' && product.unique_selling_points) {
          response += `   💡 Why it's special: ${Array.isArray(product.unique_selling_points) ? product.unique_selling_points.join(', ') : product.unique_selling_points}\n`;
        }
      });
      response += `\nWhich one catches your eye? 😊`;
    } else if (tone === 'persuasive') {
      response = `Let me show you our game-changing solutions:\n\n`;
      this.productsData.slice(0, replyDepth === 'long' ? 5 : 3).forEach((product: any, idx: number) => {
        response += `${idx + 1}. **${product.name}**\n`;
        response += `   ${product.long_description || product.short_description || 'Transform your business with this solution.'}\n`;
        if (product.benefits && replyDepth !== 'short') {
          response += `   ✨ Key benefits: ${Array.isArray(product.benefits) ? product.benefits.join(', ') : product.benefits}\n`;
        }
      });
      response += `\nReady to see which solution will drive your success?`;
    } else {
      // Professional
      response = `We offer the following solutions:\n\n`;
      this.productsData.slice(0, replyDepth === 'long' ? 5 : 3).forEach((product: any, idx: number) => {
        response += `${idx + 1}. **${product.name}**\n`;
        response += `   ${product.short_description || product.long_description || 'Comprehensive solution'}\n`;
        if (replyDepth === 'long' && product.use_cases) {
          response += `   Use cases: ${Array.isArray(product.use_cases) ? product.use_cases.join(', ') : product.use_cases}\n`;
        }
      });
      response += `\nWhich product would you like to learn more about?`;
    }

    return response;
  }

  private generatePricingResponse(tone: string, isTaglish: boolean, urgency: string): string {
    const urgencyContext = urgency === 'high' ? true : false;

    if (isTaglish) {
      return urgencyContext
        ? `Salamat sa tanong! Alam ko important ang pricing. May flexible plans kami na swak sa budget ninyo. Kailangan ninyo agad? Pwede nating pag-usapan ngayon - prefer ninyo ba na i-send ko yung pricing details or mag-schedule tayo ng quick call?`
        : `Good question! May iba't ibang pricing options kami na flexible para sa different needs. Gusto ninyong makita yung detailed pricing o mas prefer ninyo na mag-usap tayo para i-explain ko yung best fit para sa inyo?`;
    }

    if (tone === 'friendly' || tone === 'casual') {
      return urgencyContext
        ? `Great question! I know pricing is super important. We've got flexible plans for every budget. ${urgency === 'high' ? 'Since you need this ASAP, ' : ''}Want me to send you our pricing sheet right now, or would you prefer a quick 10-minute call where I can help you pick the perfect plan?`
        : `Good question! We have pricing options for every budget and need. I can either send you a detailed breakdown, or we can hop on a quick call and I'll help you find exactly what fits. What works better for you?`;
    }

    if (tone === 'persuasive') {
      return urgencyContext
        ? `Excellent question - shows you're serious about this! Our pricing is designed to deliver incredible ROI. ${urgency === 'high' ? 'I can get you started today. ' : ''}Let me show you our plans and help you see the value you'll get. Quick call or detailed proposal - your choice?`
        : `Smart question! Our pricing is structured to maximize your investment value. Each tier is designed to scale with your growth. Let's discuss which plan will give you the best returns - interested in a detailed analysis or prefer to see the options first?`;
    }

    // Professional
    return urgencyContext
      ? `Thank you for your inquiry. We offer flexible pricing structures designed to accommodate various business needs and budgets. ${urgency === 'high' ? 'Given your timeline, I can expedite the process. ' : ''}Would you prefer a comprehensive pricing document or a consultation to discuss the most suitable options for your requirements?`
      : `I appreciate your interest in our pricing. We provide transparent, value-driven pricing models with multiple tiers. I can either share our detailed pricing guide or schedule a consultation to help you identify the optimal plan. Which would you prefer?`;
  }

  private generateObjectionResponse(objectionStyle: string, isTaglish: boolean): string {
    if (isTaglish) {
      if (objectionStyle === 'direct') {
        return `Okay lang po yun! Salamat sa time ninyo. Baka may specific concern kayo na pwede kong i-address? Or hindi pa talaga time ngayon - understandable. I'm here lang if you change your mind!`;
      }
      return `Naiintindihan ko po. Pwede ba malaman kung ano yung nag-hold back? Baka may specific na concerns tayo na pwede nating i-solve, o baka hindi pa talaga perfect timing. Either way, nandito lang ako if you need anything!`;
    }

    switch (objectionStyle) {
      case 'direct':
        return `No worries at all! I appreciate you being upfront. Is there something specific I could address, or is now just not the right time? Either way, feel free to reach out if anything changes!`;

      case 'consultative':
        return `I completely understand, and I appreciate your honesty. Before you go - is there a particular concern or challenge I could help address? Sometimes it's just a timing thing, but if there's something we can solve together, I'd love to help. No pressure either way!`;

      case 'educational':
        return `That's totally fair! Can I ask - what would need to change for this to be a good fit? Understanding your perspective helps me provide better information, whether now or in the future. And of course, no pressure at all!`;

      default: // empathetic
        return `I completely understand, and I respect that. Can I ask what's making you hesitant? Sometimes there's a specific concern I can address, or maybe the timing just isn't right - both are totally fine. I'm here if you change your mind or have questions later!`;
    }
  }

  // === CUSTOM INSTRUCTIONS MODE ===

  private async generateCustomInstructionResponse(
    userMessage: string,
    customInstructions: string,
    overrideIntelligence: boolean,
    intent: string,
    buyingSignals: BuyingSignals,
    emotion: string,
    urgency: 'high' | 'medium' | 'low'
  ): Promise<AIEngineResponse> {

    const signals: string[] = [];
    let suggestedAction: string | null = null;

    // Build signals array
    if (buyingSignals.priceInquiry) signals.push('price_inquiry');
    if (buyingSignals.demoRequest) signals.push('demo_request');
    if (buyingSignals.interestExpressed) signals.push('interest_expressed');
    if (buyingSignals.urgencyIndicators) signals.push('urgency_detected');

    // Build context for custom instructions
    let contextPrompt = `${customInstructions}\n\n`;

    // Add company/product data if NOT overriding
    if (!overrideIntelligence) {
      if (this.companyData) {
        contextPrompt += `\n\nCompany Context:\n`;
        if (this.companyData.company_name) contextPrompt += `Company: ${this.companyData.company_name}\n`;
        if (this.companyData.tagline) contextPrompt += `Tagline: ${this.companyData.tagline}\n`;
        if (this.companyData.industry) contextPrompt += `Industry: ${this.companyData.industry}\n`;
      }

      if (this.productsData.length > 0) {
        contextPrompt += `\n\nAvailable Products:\n`;
        this.productsData.forEach((p: any) => {
          contextPrompt += `- ${p.name}: ${p.short_description || p.long_description || ''}\n`;
        });
      }
    }

    // Add conversation context
    contextPrompt += `\n\nCurrent Conversation:\n`;
    this.conversationHistory.slice(-4).forEach((msg) => {
      contextPrompt += `${msg.sender === 'visitor' ? 'Visitor' : 'AI'}: ${msg.message}\n`;
    });

    // Add visitor insights
    contextPrompt += `\n\nVisitor Insights:\n`;
    contextPrompt += `- Intent: ${intent}\n`;
    contextPrompt += `- Emotion: ${emotion}\n`;
    contextPrompt += `- Urgency: ${urgency}\n`;
    contextPrompt += `- Buying Signals: ${signals.join(', ') || 'none yet'}\n`;

    contextPrompt += `\n\nVisitor's Latest Message: "${userMessage}"\n\n`;
    contextPrompt += `Generate an appropriate response based on your instructions above.`;

    // CALL THE EDGE FUNCTION WITH OPENAI
    let response = '';

    try {
      console.log('[PublicChatbot] Calling edge function for AI response...');

      const edgeFunctionResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-chatbot-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            sessionId: this.sessionId,
            message: userMessage,
            userId: this.userId,
          }),
        }
      );

      if (!edgeFunctionResponse.ok) {
        throw new Error(`Edge function error: ${edgeFunctionResponse.statusText}`);
      }

      const edgeData = await edgeFunctionResponse.json();

      if (edgeData.success && edgeData.response) {
        response = edgeData.response;
        console.log('[PublicChatbot] ✅ Got AI response from edge function');
        console.log('[PublicChatbot] Using OpenAI:', edgeData.usingOpenAI);
        console.log('[PublicChatbot] Using custom instructions:', edgeData.usingCustomInstructions);
      } else {
        throw new Error('Invalid edge function response');
      }
    } catch (error) {
      console.error('[PublicChatbot] Error calling edge function:', error);
      console.log('[PublicChatbot] Falling back to training data or template response');

      // FALLBACK: Check training data first
      const matchedTraining = this.findMatchingTrainingData(userMessage);
      if (matchedTraining) {
        response = matchedTraining.answer;
      } else {
        // Generate based on custom instructions and context
        response = this.generateCustomBasedResponse(userMessage, customInstructions, intent, emotion);
      }
    }

    // Determine suggested actions
    if (intent === 'demo_request') {
      suggestedAction = 'schedule_demo';
      signals.push('high_intent');
    } else if (intent === 'purchase_intent') {
      suggestedAction = 'escalate_to_sales';
      signals.push('hot_lead');
    } else if (intent === 'pricing_inquiry') {
      suggestedAction = 'send_pricing_sheet';
    }

    return {
      response,
      intent,
      buyingSignals: signals,
      emotion,
      confidence: 0.85,
      suggestedAction
    };
  }

  private generateCustomBasedResponse(
    userMessage: string,
    customInstructions: string,
    intent: string,
    emotion: string
  ): string {
    // Extract key info from custom instructions
    const hasCompanyName = /company|business|we are/i.test(customInstructions);
    const hasProducts = /product|service|offer|solution/i.test(customInstructions);
    const hasPricing = /price|cost|\$|₱/i.test(customInstructions);
    const hasContact = /email|phone|contact|call/i.test(customInstructions);

    // Generate contextual response based on intent and available info
    switch (intent) {
      case 'company_inquiry':
        return hasCompanyName
          ? `Based on the information I have, ${customInstructions.split('\n')[0]}. What specific aspect would you like to know more about?`
          : `I'd be happy to tell you about our company. What specifically would you like to know?`;

      case 'product_inquiry':
        return hasProducts
          ? `Great question! ${customInstructions.includes('product') ? 'Let me tell you about our products and services.' : 'I can help you learn about what we offer.'} What are you most interested in?`
          : `I'd love to share information about our products and services. What kind of solution are you looking for?`;

      case 'pricing_inquiry':
        return hasPricing
          ? `Thanks for asking about pricing! ${emotion === 'excited' ? "I'm excited to share our pricing with you. " : ""}Based on our offerings, I can provide you with detailed pricing information. Would you like me to break down the options?`
          : `I can help you with pricing information. Let me get you the details you need. What specific product or service are you interested in pricing for?`;

      case 'demo_request':
        if (hasContact) {
          const hasBookingLink = customInstructions.includes('calendly') || customInstructions.includes('booking');
          return hasBookingLink
            ? `Perfect! I'd love to schedule a demo for you. Let me share our booking link with you.`
            : `Perfect! I'd love to schedule a demo for you. What's the best way to reach you - email or phone?`;
        }
        return `I'd be happy to set up a demo! What's your email address, and when would work best for you?`;

      case 'help_request':
        return `I'm here to help! I can assist you with information about our company, products, pricing, scheduling demos, or answer any questions you have. What would be most helpful for you?`;

      default:
        return `Thanks for reaching out! I'm here to help answer your questions and provide information. What can I help you with today?`;
    }
  }

  /**
   * Check if conversation qualifies for prospect creation
   */
  async checkAndCreateProspect(): Promise<string | null> {
    try {
      // Extract contact info from conversation
      const contactInfo = ChatbotProspectCreationService.extractContactInfo(
        this.conversationHistory
      );

      // Build qualification data
      const qualificationData: ChatQualificationData = {
        buyingIntentScore: this.buyingIntentScore,
        leadTemperature: this.leadTemperature,
        conversationLength: this.conversationHistory.length,
        hasContactInfo: !!(contactInfo.email || contactInfo.phone),
        detectedSignals: this.detectedBuyingSignals.map(s => s.type),
        intents: this.intentsHistory,
        sessionDuration: Date.now() - this.sessionStartTime,
      };

      // Check if qualified
      const isQualified = ChatbotProspectCreationService.isQualifiedLead(
        qualificationData,
        contactInfo
      );

      if (!isQualified) {
        console.log('[PublicChatbot] Session not qualified for prospect creation');
        return null;
      }

      // Check if prospect already exists
      const existingProspectId = await ChatbotProspectCreationService.findExistingProspect(
        this.userId,
        contactInfo
      );

      if (existingProspectId) {
        console.log('[PublicChatbot] Updating existing prospect:', existingProspectId);
        await ChatbotProspectCreationService.updateProspectFromChat(
          existingProspectId,
          qualificationData,
          this.sessionId
        );
        return existingProspectId;
      }

      // Create new prospect
      const conversationSummary = this.generateConversationSummary();
      const prospectId = await ChatbotProspectCreationService.createProspectFromChat(
        this.userId,
        this.sessionId,
        contactInfo,
        qualificationData,
        conversationSummary
      );

      if (prospectId) {
        console.log('[PublicChatbot] Created prospect:', prospectId);
      }

      return prospectId;
    } catch (error) {
      console.error('[PublicChatbot] Error checking/creating prospect:', error);
      return null;
    }
  }

  /**
   * Generate conversation summary
   */
  private generateConversationSummary(): string {
    const visitorMessages = this.conversationHistory
      .filter(m => m.sender === 'visitor')
      .map(m => m.message);

    if (visitorMessages.length === 0) return '';

    // Create a brief summary
    const firstMessage = visitorMessages[0];
    const lastMessage = visitorMessages[visitorMessages.length - 1];

    let summary = `Chat started with: "${firstMessage.substring(0, 100)}"`;

    if (visitorMessages.length > 1) {
      summary += ` | Last message: "${lastMessage.substring(0, 100)}"`;
    }

    if (this.detectedBuyingSignals.length > 0) {
      summary += ` | Buying signals: ${this.detectedBuyingSignals.map(s => s.type).join(', ')}`;
    }

    return summary;
  }

  /**
   * Get current qualification status
   */
  getQualificationStatus(): ChatQualificationData {
    return {
      buyingIntentScore: this.buyingIntentScore,
      leadTemperature: this.leadTemperature,
      conversationLength: this.conversationHistory.length,
      hasContactInfo: false, // Will be determined by extractContactInfo
      detectedSignals: this.detectedBuyingSignals.map(s => s.type),
      intents: this.intentsHistory,
      sessionDuration: Date.now() - this.sessionStartTime,
    };
  }
}
