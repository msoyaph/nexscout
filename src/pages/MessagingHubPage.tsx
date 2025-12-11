import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Sparkles, Shield, MessageCircle, Calendar, Lightbulb, RefreshCw, Users as UsersIcon, MessageSquare, Phone, Copy, Check, Home, Users, PlusCircle, TrendingUp, MoreHorizontal, BookOpen, Coins, Save, Settings, X, User, ChevronRight, ChevronLeft, Globe } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { messagingEngine } from '../services/ai/messagingEngine';
import { messagingHubService, type ExtendedIndustry, type MessageVariation } from '../services/messagingHub/messagingHubService';
import { aiOrchestrator } from '../services/ai/AIOrchestrator';
import { coinTransactionService } from '../services/coinTransactionService';
import ActionPopup from '../components/ActionPopup';
import SlideInMenu from '../components/SlideInMenu';
import { useSubscription } from '../hooks/useSubscription';
import AISystemInstructionsModal from '../components/AISystemInstructionsModal';

interface MessagingHubPageProps {
  onNavigateToHome?: () => void;
  onNavigateToProspects?: () => void;
  onNavigateToPipeline?: () => void;
  onNavigateToMore?: () => void;
  onNavigate?: (page: string) => void;
}

interface Prospect {
  id: string;
  full_name: string;
  company_name?: string;
  scout_score?: number;
  lead_temperature?: 'cold' | 'warm' | 'hot';
  pipeline_stage?: string;
  platform?: string;
}

type ToolType = 'objection' | 'booking' | 'coaching' | 'message' | 'revival' | 'referral' | 'social' | 'call';
type AudienceType = 'prospect' | 'general';

export default function MessagingHubPage({
  onNavigateToHome,
  onNavigateToProspects,
  onNavigateToPipeline,
  onNavigateToMore,
  onNavigate,
}: MessagingHubPageProps) {
  const { user } = useAuth();
  const { tier } = useSubscription();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTool, setSelectedTool] = useState<ToolType>('objection');
  const [audienceType, setAudienceType] = useState<AudienceType>('prospect');
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [params, setParams] = useState<any>({
    objectionType: 'no_time',
    industry: 'mlm' as ExtendedIndustry,
    tone: 'friendly' as const,
    messageType: 'first_outreach',
    userGoal: 'recruit',
    lastInteractionDays: 30,
    context: 'warm_friend',
    rewardType: 'none',
    commentText: '',
    postType: 'personal',
    socialGoal: 'relationship_building',
    callGoal: 'book_meeting',
  });
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{
    variations: MessageVariation[];
    prospectContext: any;
    scoutScore?: number;
    leadTemperature?: string;
    insights?: string[];
  } | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [showActionPopup, setShowActionPopup] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coinBalance, setCoinBalance] = useState(0);
  const [activeTab, setActiveTab] = useState<'generate' | 'library'>('generate');
  const [savedMessage, setSavedMessage] = useState(false);
  const [savedVariationIds, setSavedVariationIds] = useState<Set<string>>(new Set());
  const [showAISettings, setShowAISettings] = useState(false);
  const [loadingProspects, setLoadingProspects] = useState(false);

  useEffect(() => {
    if (user) {
      loadProspects(false); // Load silently on mount
      loadCoinBalance();
    }
  }, [user]);

  // Automatically load prospects when entering step 2
  useEffect(() => {
    if (currentStep === 2 && user && !loadingProspects) {
      // Always reload prospects when entering step 2 to ensure fresh data
      loadProspects(true);
    }
  }, [currentStep, user]);

  // Reload prospects when switching to "Select Prospect" option
  useEffect(() => {
    if (currentStep === 2 && audienceType === 'prospect' && user && !loadingProspects) {
      loadProspects(true);
    }
  }, [audienceType, currentStep, user]);

  const loadCoinBalance = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('coin_balance')
      .eq('id', user.id)
      .single();

    if (data) {
      setCoinBalance(data.coin_balance || 0);
    }
  };

  const loadProspects = async (showLoading = true) => {
    if (!user) return;

    if (showLoading) {
      setLoadingProspects(true);
    }

    try {
      // Clear any previous errors
      if (currentStep !== 2 || audienceType !== 'prospect') {
        setError(null);
      }

      // Use select('*') to get all columns and handle missing ones gracefully
      const { data, error } = await supabase
        .from('prospects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('[MessagingHub] Error loading prospects:', error);
        console.error('[MessagingHub] Error details:', JSON.stringify(error, null, 2));
        setProspects([]);
        
        // Only show error if user is actively on step 2 trying to select a prospect
        if (currentStep === 2 && audienceType === 'prospect') {
          setError('Failed to load prospects. Please try again or use General Audience.');
        }
        return;
      }

      const formatted = (data || []).map((p: any) => ({
        id: p.id,
        full_name: p.full_name || 'Unknown',
        company_name: p.company || p.metadata?.company || null, // Use 'company' column, not 'company_name'
        scout_score: p.scout_score || p.metadata?.scout_score || 0,
        lead_temperature: p.lead_temperature || p.metadata?.bucket || p.metadata?.temperature || 'cold',
        pipeline_stage: p.pipeline_stage || 'discover',
        platform: p.platform || 'unknown',
      }));

      setProspects(formatted);
      
      // Clear error if prospects loaded successfully
      if (currentStep === 2 && audienceType === 'prospect') {
        setError(null);
      }
    } catch (err: any) {
      console.error('[MessagingHub] Error in loadProspects:', err);
      setProspects([]);
      
      // Only show error if user is actively on step 2 trying to select a prospect
      if (currentStep === 2 && audienceType === 'prospect') {
        setError('Failed to load prospects. Please try again or use General Audience.');
      }
    } finally {
      if (showLoading) {
        setLoadingProspects(false);
      }
    }
  };

  const filteredProspects = prospects.filter(
    (p) => {
      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;
      
      return (
        p.full_name.toLowerCase().includes(query) ||
        (p.company_name && p.company_name.toLowerCase().includes(query)) ||
        (p.platform && p.platform.toLowerCase().includes(query)) ||
        (p.pipeline_stage && p.pipeline_stage.toLowerCase().includes(query))
      );
    }
  );

  // Generate 5 message variations for general audience
  const generateGeneralAudienceMessages = async (
    userId: string,
    toolType: ToolType,
    industry: ExtendedIndustry,
    tone: MessageTone
  ): Promise<MessageVariation[]> => {
    const approaches = messagingHubService.getApproachesForTool(toolType);
    const industryContext = messagingHubService.getIndustryContext(industry);
    const toneGuidance = messagingHubService.getToneGuidance(tone);
    const toolContext = messagingHubService.getToolContext(toolType);

    // Load AI System Instructions (primary knowledge source)
    const aiInstructions = await messagingHubService.loadAISystemInstructions(userId);
    const instructionsSection = aiInstructions && aiInstructions.trim()
      ? `\n\n=== YOUR AI SYSTEM INSTRUCTIONS (PRIMARY KNOWLEDGE SOURCE) ===\n${aiInstructions}\n=== END OF AI SYSTEM INSTRUCTIONS ===\n\n`
      : '\n\nNOTE: No custom AI System Instructions found. Use general best practices.\n\n';

    const variations: MessageVariation[] = [];

    for (let i = 0; i < approaches.length; i++) {
      const approach = approaches[i];
      try {
        const approachInstructions = messagingHubService.getApproachInstructions(approach.label, toolType);
        
        // Add variation-specific uniqueness instructions
        const variationStyles = [
          { opening: 'story-driven', angle: 'Emotional', structure: 'Short and punchy' },
          { opening: 'question-based', angle: 'Logical', structure: 'Detailed and comprehensive' },
          { opening: 'benefit-focused', angle: 'Social proof', structure: 'Conversational' },
          { opening: 'problem-solving', angle: 'Urgency', structure: 'Professional' },
          { opening: 'relationship-building', angle: 'Curiosity', structure: 'Warm and personal' },
        ];
        
        const variationStyle = variationStyles[i] || variationStyles[0];
        
        const baseSystemPrompt = `You are an expert ${industryContext.name} sales copywriter specializing in ${toolContext.name}.

CRITICAL: Your ONLY source of knowledge about the company, products, services, and messaging guidelines is the "AI System Instructions" section below. Do NOT use or reference any company intelligence, product intelligence, or auto-synced data UNLESS it is explicitly mentioned in your AI System Instructions.

${instructionsSection}

${industryContext.guidelines}

${toneGuidance}

CRITICAL UNIQUENESS REQUIREMENTS:
This is Variation ${i + 1} of 5. Make it COMPLETELY DIFFERENT from all other variations by using:
- A ${variationStyle.opening} opening approach
- ${variationStyle.angle} as the primary persuasion angle
- ${variationStyle.structure} message structure
- Different word choice, phrasing, and emotional tone
- Different call-to-action style

You MUST create a UNIQUE message that is COMPLETELY DIFFERENT from other variations.`;

        const userPrompt = `Create a UNIQUE ${toolContext.name.toLowerCase()} using the "${approach.label}" approach for the ${industryContext.name} industry.

APPROACH DETAILS:
- Approach: "${approach.label}"
- Strategy: ${approach.reasoning}
- Specific Tactics: ${approachInstructions}

MESSAGE REQUIREMENTS:
- Make this message COMPLETELY DIFFERENT from other variations
- Use a different opening hook/line
- Use a different message structure
- Use a different emotional angle
- Use a different persuasion technique
- Use a different closing approach
- Tone: ${tone} (${toneGuidance})
- Industry: ${industryContext.name}
- Target: General audience (not a specific person)
- Style: Natural, conversational, Filipino-friendly
- Length: Concise but compelling (under 150 words)

CRITICAL: This must be UNIQUE. Use:
- Different emotional triggers
- Different message flow
- Different word choice
- Different structure
- Different call-to-action style

Generate the FULL message content (not a draft). Make it feel human, authentic, and effective. Do not use placeholders like [Name] or [Company].`;

        // Use varied temperature per variation (0.7 to 0.95)
        // Each variation gets a different base temperature to ensure uniqueness
        const baseTemps = [0.7, 0.8, 0.85, 0.9, 0.95];
        const temperature = baseTemps[i] || (0.75 + (i * 0.05));

        const result = await aiOrchestrator.generate({
          messages: [
            { role: 'system', content: baseSystemPrompt },
            { role: 'user', content: userPrompt },
          ],
          config: {
            userId,
            action: 'ai_message',
            model: 'gpt-4o',
            temperature: Math.min(0.95, Math.max(0.6, temperature)),
            maxTokens: 500,
            autoSelectModel: true,
            skipCoinCheck: true, // CRITICAL: Coins are deducted ONCE after all variations, not per call
            coinCost: 0, // Indicate no coin deduction needed in edge function
            transactionId: `gen_aud_${Date.now()}`, // Transaction ID for this batch
          },
        });

        if (result.success && result.content && result.content.trim().length > 20) {
          const cta = toolType === 'booking' 
            ? 'Schedule a call' 
            : toolType === 'coaching'
            ? 'Start your journey'
            : toolType === 'revival'
            ? 'Let\'s reconnect'
            : toolType === 'objection'
            ? 'Let me know your thoughts'
            : toolType === 'call'
            ? 'Book a call'
            : 'Learn more';

          // Generate reasoning for why this variation works
          const reasoning = await messagingHubService.generateVariationReasoning(
            approach,
            { id: '', full_name: 'General Audience' } as any,
            undefined,
            undefined,
            toolType,
            industry,
            tone
          ).catch(() => approach.reasoning); // Fallback to original if fails

          variations.push({
            id: `gen-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
            approach: approach.label,
            reasoning: reasoning || approach.reasoning,
            content: result.content.trim(),
            cta,
            tone,
          });
        }
      } catch (err) {
        console.error(`[MessagingHub] Error generating variation ${approach.label}:`, err);
      }
    }

    // If we couldn't generate all 5, create fallback variations using the service method
    if (variations.length < 5) {
      try {
        const fallbackContent = messagingHubService.generateFallbackMessage(
          { id: '', full_name: 'General Audience' } as any,
          toolType,
          industry,
          tone
        );

        while (variations.length < 5) {
          const approach = approaches[variations.length] || { label: `Variation ${variations.length + 1}`, reasoning: 'Standard approach' };
          variations.push({
            id: `fallback-${Date.now()}-${variations.length}`,
            approach: approach.label,
            reasoning: approach.reasoning || 'Standard messaging approach',
            content: fallbackContent,
            cta: toolType === 'booking' ? 'Schedule a call' : 'Learn more',
            tone,
          });
        }
      } catch (fallbackErr) {
        console.error('[MessagingHub] Error creating fallback variations:', fallbackErr);
      }
    }

    return variations.slice(0, 5);
  };

  const handleGenerate = async () => {
    if (!user) return;

    // Validation
    if (audienceType === 'prospect' && !selectedProspect && selectedTool !== 'referral' && selectedTool !== 'social') {
      setError('Please select a prospect or choose General Audience');
      setCurrentStep(2); // Go back to step 2
      return;
    }

    if (coinBalance < 3) {
      setError('Insufficient coins. You need 3 coins to generate messages.');
      return;
    }

    setGenerating(true);
    setError(null);
    setResult(null);

    try {
      // Use new messaging hub service for prospect-based tools
      if (audienceType === 'prospect' && selectedProspect && ['objection', 'booking', 'coaching', 'message', 'revival', 'call'].includes(selectedTool)) {
        const result = await messagingHubService.generateMessageVariations(
          user.id,
          selectedProspect.id,
          selectedTool as any,
          params.industry as ExtendedIndustry,
          params.tone as any
        );

        if (!result.success) {
          setError(result.error || 'Failed to generate messages');
          return;
        }

        setResult({
          variations: result.variations,
          prospectContext: result.prospectContext,
          scoutScore: result.scoutScore,
          leadTemperature: result.leadTemperature,
          insights: result.insights,
        });

        await loadCoinBalance();
      } else if (audienceType === 'general' || selectedTool === 'referral' || selectedTool === 'social') {
        // Generate 5 variations for general audience
        const variations = await generateGeneralAudienceMessages(
          user.id,
          selectedTool,
          params.industry as ExtendedIndustry,
          params.tone as any
        );

        if (variations.length === 0) {
          setError('Failed to generate messages. Please try again.');
          setGenerating(false);
          return;
        }

        // Deduct coins ONCE after successful generation (not per variation)
        // Create transaction ID to prevent duplicate deductions
        const transactionId = `gen_msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await coinTransactionService.deductCoins(
          user.id,
          3,
          `Generated ${variations.length} message variations for general audience (${selectedTool})`,
          {
            tool_type: selectedTool,
            industry: params.industry,
            tone: params.tone,
            audience_type: 'general',
            variations_count: variations.length,
            transaction_id: transactionId,
          }
        );

        setResult({
          variations,
          prospectContext: null,
          scoutScore: undefined,
          leadTemperature: undefined,
          insights: [`Generated for ${params.industry} industry with ${params.tone} tone`],
        });

        await loadCoinBalance();
      } else {
        throw new Error('Unable to generate messages. Please select a prospect or choose General Audience.');
      }

      // Move to step 4 after generation
      setCurrentStep(4);
    } catch (err: any) {
      console.error('[MessagingHub] Generation error:', err);
      setError(err.message || 'Failed to generate messages. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveVariationToLibrary = async (variation: MessageVariation) => {
    if (!user || !selectedProspect) return;

    try {
      const { error } = await supabase.from('ai_messages_library').insert({
        user_id: user.id,
        prospect_id: selectedProspect.id,
        message_type: selectedTool,
        industry: params.industry,
        tone: params.tone,
        message_content: variation.content,
        cta: variation.cta,
        approach: variation.approach,
        reasoning: variation.reasoning,
        scout_score: result?.scoutScore,
        lead_temperature: result?.leadTemperature,
      });

      if (error) throw error;

      setSavedVariationIds(prev => new Set(prev).add(variation.id));
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 2000);
    } catch (err: any) {
      console.error('[MessagingHub] Error saving variation:', err);
      setError('Failed to save message to library');
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleRegenerate = () => {
    setResult(null);
    setCurrentStep(4);
    handleGenerate();
  };

  const handleNext = () => {
    if (currentStep < 4) {
      // Validation before moving to next step
      if (currentStep === 1 && !selectedTool) {
        setError('Please select a message type');
        return;
      }
      if (currentStep === 2 && audienceType === 'prospect' && !selectedProspect && selectedTool !== 'referral' && selectedTool !== 'social') {
        setError('Please select a prospect or choose General Audience');
        return;
      }
      if (currentStep === 3 && !params.industry) {
        setError('Please select an industry');
        return;
      }
      
      setError(null);
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setError(null);
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStartOver = () => {
    setCurrentStep(1);
    setSelectedTool('objection');
    setAudienceType('prospect');
    setSelectedProspect(null);
    setSearchQuery('');
    setResult(null);
    setError(null);
  };

  const toolsGrid = [
    { id: 'objection', label: 'Objection Handler', icon: Shield, color: 'green' },
    { id: 'booking', label: 'Book Meeting', icon: Calendar, color: 'blue' },
    { id: 'coaching', label: 'Elite Coaching', icon: Lightbulb, color: 'purple' },
    { id: 'message', label: 'Smart Message', icon: MessageCircle, color: 'orange' },
    { id: 'revival', label: 'Lead Revival', icon: RefreshCw, color: 'red' },
    { id: 'referral', label: 'Referral Request', icon: UsersIcon, color: 'indigo' },
    { id: 'social', label: 'Social Reply', icon: MessageSquare, color: 'pink' },
    { id: 'call', label: 'Call Script', icon: Phone, color: 'teal' },
  ];

  const steps = [
    { number: 1, title: 'Message Type', icon: MessageCircle },
    { number: 2, title: 'Audience', icon: Users },
    { number: 3, title: 'Settings', icon: Settings },
    { number: 4, title: 'Results', icon: Sparkles },
  ];

  return (
    <div className="bg-white min-h-screen text-gray-900 relative overflow-hidden pb-24">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-[500px] bg-gradient-to-br from-green-100 via-blue-50 to-purple-50 blur-[120px] rounded-full pointer-events-none" />

      <header className="relative z-10 px-6 pt-6 pb-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => {
              if (onNavigateToHome) {
                onNavigateToHome();
              } else if (onNavigate) {
                onNavigate('home');
              }
            }}
            className="flex items-center justify-center w-11 h-11 rounded-xl bg-white shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
          <h1 className="text-base font-bold text-gray-900">Messaging Hub</h1>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAISettings(true)}
              className="p-2 hover:bg-purple-50 hover:border-purple-500 border-2 border-gray-200 rounded-lg transition-all"
              title="AI System Instructions"
            >
              <Settings className="w-5 h-5 text-purple-600" />
            </button>
            <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-full border border-yellow-200">
              <Coins className="w-5 h-5 text-yellow-600" />
              <span className="text-sm font-bold text-yellow-900">{coinBalance.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              const Icon = step.icon;
              
              return (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isActive
                          ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white scale-110 shadow-lg'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <div className={`text-xs font-semibold ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                        Step {step.number}
                      </div>
                      <div className={`text-xs mt-0.5 ${isActive ? 'text-gray-900 font-semibold' : 'text-gray-500'} hidden sm:block`}>
                        {step.title}
                      </div>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-2 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </header>

      <div className="px-6 py-6 space-y-6 relative z-10 pb-32">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Step 1: Type of Message */}
        {currentStep === 1 && (
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-lg">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Select Message Type</h2>
            <div className="grid grid-cols-2 gap-3">
              {toolsGrid.map((tool) => {
                const Icon = tool.icon;
                const isSelected = selectedTool === tool.id;
                return (
                  <button
                    key={tool.id}
                    onClick={() => {
                      setSelectedTool(tool.id as ToolType);
                      setError(null);
                    }}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'bg-blue-50 border-blue-500 shadow-sm'
                        : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mb-2 mx-auto ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
                    <div className={`text-xs font-semibold text-center ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                      {tool.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Select Prospect or General Audience */}
        {currentStep === 2 && (
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-lg">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Select Audience</h2>
            
            {/* Audience Type Toggle */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => {
                  setAudienceType('prospect');
                  setSelectedProspect(null);
                  setError(null);
                  // Trigger prospect loading when switching to prospect mode
                  if (user) {
                    loadProspects(true);
                  }
                }}
                className={`p-4 rounded-xl border-2 transition-all ${
                  audienceType === 'prospect'
                    ? 'bg-blue-50 border-blue-500 shadow-sm'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <Users className={`w-6 h-6 mb-2 mx-auto ${audienceType === 'prospect' ? 'text-blue-600' : 'text-gray-400'}`} />
                <div className={`text-sm font-semibold text-center ${audienceType === 'prospect' ? 'text-blue-900' : 'text-gray-700'}`}>
                  Select Prospect
                </div>
              </button>
              <button
                onClick={() => {
                  setAudienceType('general');
                  setSelectedProspect(null);
                  setError(null);
                }}
                className={`p-4 rounded-xl border-2 transition-all ${
                  audienceType === 'general'
                    ? 'bg-blue-50 border-blue-500 shadow-sm'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <Globe className={`w-6 h-6 mb-2 mx-auto ${audienceType === 'general' ? 'text-blue-600' : 'text-gray-400'}`} />
                <div className={`text-sm font-semibold text-center ${audienceType === 'general' ? 'text-blue-900' : 'text-gray-700'}`}>
                  General Audience
                </div>
              </button>
            </div>

            {/* Prospect Selection (only if prospect type selected) */}
            {audienceType === 'prospect' && (
              <>
                <div className="relative mb-4">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search prospects by name, company, platform..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    disabled={loadingProspects}
                  />
                  {searchQuery && !loadingProspects && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                </div>

                {selectedProspect && (
                  <div className="mb-4 p-3 bg-blue-50 border-2 border-blue-500 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-sm text-gray-900">{selectedProspect.full_name}</div>
                        {selectedProspect.company_name && (
                          <div className="text-xs text-gray-600 mt-0.5">{selectedProspect.company_name}</div>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {selectedProspect.scout_score !== undefined && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              selectedProspect.scout_score >= 70 
                                ? 'bg-green-100 text-green-700'
                                : selectedProspect.scout_score >= 40
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              Score: {selectedProspect.scout_score}
                            </span>
                          )}
                          {selectedProspect.lead_temperature && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              selectedProspect.lead_temperature === 'hot'
                                ? 'bg-red-100 text-red-700'
                                : selectedProspect.lead_temperature === 'warm'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {selectedProspect.lead_temperature.toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedProspect(null);
                          setSearchQuery('');
                        }}
                        className="ml-2 p-1 hover:bg-blue-100 rounded-full transition-colors"
                      >
                        <X className="w-4 h-4 text-blue-600" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {loadingProspects ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <p>Loading prospects...</p>
                    </div>
                  ) : filteredProspects.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      {searchQuery ? (
                        <>
                          <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                          <p>No prospects found matching "{searchQuery}"</p>
                          <button
                            onClick={() => setSearchQuery('')}
                            className="text-blue-600 hover:text-blue-700 text-xs mt-2"
                          >
                            Clear search
                          </button>
                        </>
                      ) : (
                        <>
                          <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                          <p>No prospects found</p>
                          <p className="text-xs mt-1">Add prospects to generate personalized messages</p>
                          <button
                            onClick={() => {
                              loadProspects(true);
                            }}
                            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
                          >
                            Retry Loading
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    filteredProspects.map((prospect) => (
                      <button
                        key={prospect.id}
                        onClick={() => {
                          setSelectedProspect(prospect);
                          setSearchQuery('');
                        }}
                        className={`w-full p-3 rounded-xl border-2 text-left transition-all hover:shadow-sm ${
                          selectedProspect?.id === prospect.id
                            ? 'bg-blue-50 border-blue-500 shadow-sm'
                            : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-gray-900 truncate">{prospect.full_name}</div>
                            {prospect.company_name && (
                              <div className="text-xs text-gray-600 mt-0.5 truncate">{prospect.company_name}</div>
                            )}
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              {prospect.scout_score !== undefined && (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  prospect.scout_score >= 70 
                                    ? 'bg-green-100 text-green-700'
                                    : prospect.scout_score >= 40
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {prospect.scout_score}
                                </span>
                              )}
                              {prospect.lead_temperature && (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  prospect.lead_temperature === 'hot'
                                    ? 'bg-red-100 text-red-700'
                                    : prospect.lead_temperature === 'warm'
                                    ? 'bg-orange-100 text-orange-700'
                                    : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {prospect.lead_temperature}
                                </span>
                              )}
                            </div>
                          </div>
                          {selectedProspect?.id === prospect.id && (
                            <Check className="w-5 h-5 text-blue-600 flex-shrink-0 ml-2" />
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>

                {filteredProspects.length > 10 && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Showing {filteredProspects.length} prospect{filteredProspects.length !== 1 ? 's' : ''}
                  </p>
                )}
              </>
            )}

            {audienceType === 'general' && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                <Globe className="w-12 h-12 mx-auto mb-3 text-blue-600" />
                <p className="text-sm font-semibold text-gray-900 mb-1">General Audience Selected</p>
                <p className="text-xs text-gray-600">Messages will be generated for a general audience, not specific to any prospect.</p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Industry and Tone */}
        {currentStep === 3 && (
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-lg">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Configure Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Industry</label>
                <select
                  value={params.industry}
                  onChange={(e) => setParams({ ...params, industry: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="mlm">MLM / Network Marketing</option>
                  <option value="insurance">Insurance</option>
                  <option value="real_estate">Real Estate</option>
                  <option value="ecommerce">E-commerce</option>
                  <option value="coaching">Coaching / Consulting</option>
                  <option value="clinic">Medical Clinic</option>
                  <option value="loans">Loans / Financial Services</option>
                  <option value="auto">Automotive</option>
                  <option value="franchise">Franchise</option>
                  <option value="saas">SaaS / Software</option>
                  <option value="travel">Travel & Tourism</option>
                  <option value="beauty">Beauty & Cosmetics</option>
                  <option value="online_seller">Online Seller</option>
                  <option value="service">Service Provider</option>
                  <option value="finance">Finance / Investment</option>
                  <option value="crypto">Cryptocurrency</option>
                  <option value="health_wellness">Health & Wellness</option>
                  <option value="general">General</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Tone</label>
                <select
                  value={params.tone}
                  onChange={(e) => setParams({ ...params, tone: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="friendly">Friendly</option>
                  <option value="professional">Professional</option>
                  <option value="warm">Warm</option>
                  <option value="direct">Direct</option>
                </select>
              </div>
            </div>
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-xs text-blue-900">
                <strong>Cost:</strong> 3 coins per generation (5 message variations)
              </p>
            </div>
          </div>
        )}

        {/* Step 4: Generate Results */}
        {currentStep === 4 && (
          <div className="space-y-4">
            {!result || generating ? (
              <div className="bg-white rounded-3xl p-12 border border-gray-200 shadow-lg text-center">
                {generating ? (
                  <>
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Generating Messages...</h3>
                    <p className="text-sm text-gray-600">Creating 5 personalized variations for you</p>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Ready to Generate</h3>
                    <p className="text-sm text-gray-600 mb-6">Click the button below to generate 5 message variations</p>
                    <button
                      onClick={handleGenerate}
                      disabled={coinBalance < 3}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Generate Messages (3 coins)
                    </button>
                    {coinBalance < 3 && (
                      <p className="text-xs text-red-600 mt-2">Insufficient coins. You need 3 coins to generate.</p>
                    )}
                  </>
                )}
              </div>
            ) : (
              <>
                {/* Prospect Intelligence Header */}
                {(result.scoutScore !== undefined || result.insights) && selectedProspect && (
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-gray-900">Prospect Intelligence</h4>
                      {result.scoutScore !== undefined && (
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                          result.scoutScore >= 70
                            ? 'bg-green-100 text-green-700'
                            : result.scoutScore >= 40
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          Score: {result.scoutScore}
                        </span>
                      )}
                    </div>
                    {result.leadTemperature && (
                      <p className="text-sm text-gray-700 mb-2">
                        <strong>Temperature:</strong> {result.leadTemperature}
                      </p>
                    )}
                    {result.insights && result.insights.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-semibold text-gray-900 mb-1">Insights:</p>
                        <ul className="text-xs text-gray-700 space-y-1">
                          {result.insights.map((insight, idx) => (
                            <li key={idx}>• {insight}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Results Header */}
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-gray-900">
                      5 Message Variations ({result.variations.length} generated)
                    </h3>
                    <button
                      onClick={handleRegenerate}
                      disabled={generating || coinBalance < 3}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                      Regenerate
                    </button>
                  </div>
                  <p className="text-xs text-gray-600">3 coins deducted</p>
                </div>

                {/* Message Variations */}
                <div className="space-y-4">
                  {result.variations.map((variation, idx) => (
                    <div key={idx} className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-bold text-gray-900 mb-1">Variation {idx + 1}</h4>
                          <p className="text-xs text-gray-600 mb-2">{variation.approach}</p>
                          {variation.reasoning && (
                            <p className="text-xs text-gray-500 italic">"{variation.reasoning}"</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">{variation.content}</p>
                        {variation.cta && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs font-semibold text-gray-700 mb-1">Call to Action:</p>
                            <p className="text-sm text-blue-600 font-medium">{variation.cta}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopy(variation.content)}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                        >
                          {copiedText === variation.content ? (
                            <>
                              <Check className="w-4 h-4" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              Copy
                            </>
                          )}
                        </button>
                        {selectedProspect && (
                          <button
                            onClick={() => handleSaveVariationToLibrary(variation)}
                            disabled={savedVariationIds.has(variation.id)}
                            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {savedVariationIds.has(variation.id) ? (
                              <>
                                <Check className="w-4 h-4" />
                                Saved
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4" />
                                Save to Library
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        {currentStep < 4 && (
          <div className="flex items-center justify-between gap-4 pt-4 border-t border-gray-200">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </button>
            <button
              onClick={currentStep === 3 ? handleGenerate : handleNext}
              disabled={
                (currentStep === 1 && !selectedTool) ||
                (currentStep === 2 && audienceType === 'prospect' && !selectedProspect && selectedTool !== 'referral' && selectedTool !== 'social') ||
                (currentStep === 3 && coinBalance < 3)
              }
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {currentStep === 3 ? (
                <>
                  Generate (3 coins)
                  <Sparkles className="w-5 h-5" />
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        )}

        {/* Step 4 Actions */}
        {currentStep === 4 && result && !generating && (
          <div className="flex items-center justify-center gap-4 pt-4 border-t border-gray-200">
            <button
              onClick={handleStartOver}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Start Over
            </button>
          </div>
        )}
      </div>

      {/* AI System Instructions Modal */}
      {showAISettings && user && (
        <AISystemInstructionsModal
          isOpen={showAISettings}
          onClose={() => setShowAISettings(false)}
          userId={user.id}
          featureType="ai_messages"
          featureName="AI Messages"
        />
      )}

      {/* Action Popup */}
      <ActionPopup isOpen={showActionPopup} onClose={() => setShowActionPopup(false)} />
      
      {/* Slide In Menu */}
      <SlideInMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={(page) => {
          setMenuOpen(false);
          onNavigate?.(page);
        }}
      />
    </div>
  );
}
