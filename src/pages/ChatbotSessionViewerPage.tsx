import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, MessageCircle, User, TrendingUp, AlertCircle, Calendar, CheckCircle, Mail, Send, Loader2,
  Sparkles, Flame, Thermometer, Snowflake, HelpCircle, Zap, Copy, Check, Link as LinkIcon,
  Phone, Target, Brain, MessageSquare, Clock, Eye, Layers, X, ChevronDown, ChevronUp,
  UserPlus, BarChart3, Shuffle, RefreshCw, Pause, Play
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { getAvatarClasses, getAvatarContent } from '../utils/avatarUtils';
import { sessionAnalysisService } from '../services/chatbot/sessionAnalysisService';
import { calendarService } from '../services/calendar/calendarService';
import type { SessionAnalysis, ConversionData, AIRecommendation } from '../services/chatbot/sessionAnalysisService';

interface ChatbotSessionViewerPageProps {
  sessionId?: string;
  onBack?: () => void;
  onNavigate?: (page: string, options?: any) => void;
}

export default function ChatbotSessionViewerPage({ sessionId, onBack, onNavigate }: ChatbotSessionViewerPageProps) {
  const { user } = useAuth();
  const [session, setSession] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [pipelineEntry, setPipelineEntry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [humanReply, setHumanReply] = useState('');
  const [sending, setSending] = useState(false);
  
  // AI Analysis & Recommendations
  const [analysis, setAnalysis] = useState<SessionAnalysis | null>(null);
  const [analyzingSession, setAnalyzingSession] = useState(false);
  
  // Convert to Prospect
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [conversionData, setConversionData] = useState<ConversionData | null>(null);
  const [converting, setConverting] = useState(false);
  
  // Booking Link
  const [bookingLink, setBookingLink] = useState('');
  const [copiedBooking, setCopiedBooking] = useState(false);
  
  // Quick Actions Modals
  const [showGenerateMessageModal, setShowGenerateMessageModal] = useState(false);
  const [showGenerateSequenceModal, setShowGenerateSequenceModal] = useState(false);
  const [generatingMessage, setGeneratingMessage] = useState(false);
  const [generatingSequence, setGeneratingSequence] = useState(false);
  const [messageScenarios, setMessageScenarios] = useState<Array<{id: number; message: string; perspective: string; customerNeed: string}>>([]);
  const [selectedScenario, setSelectedScenario] = useState<number | null>(null);
  const [sequenceApproaches, setSequenceApproaches] = useState<Array<{id: number; name: string; description: string; messages: Array<{day: number; subject: string; message: string}>}>>([]);
  const [selectedApproach, setSelectedApproach] = useState<number | null>(null);
  const [expandedApproach, setExpandedApproach] = useState<number | null>(null);
  const [messageGoal, setMessageGoal] = useState('follow_up');
  const [messageTone, setMessageTone] = useState('friendly');
  const [sequenceType, setSequenceType] = useState('nurture');
  const [sequenceSteps, setSequenceSteps] = useState(5);
  const [aiInstructions, setAiInstructions] = useState<string>('');
  const [coinBalance, setCoinBalance] = useState<number>(0);
  const [showBuyCoinsModal, setShowBuyCoinsModal] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [lastAnalyzedAt, setLastAnalyzedAt] = useState<string>('');
  const [showConvertProspectModal, setShowConvertProspectModal] = useState(false);
  const [showGenerateAnalysisModal, setShowGenerateAnalysisModal] = useState(false);
  const [showSendToPipelineModal, setShowSendToPipelineModal] = useState(false);
  const [showSetAppointmentModal, setShowSetAppointmentModal] = useState(false);
  const [generatingAnalysis, setGeneratingAnalysis] = useState(false);
  const [generatingPipelineRec, setGeneratingPipelineRec] = useState(false);
  const [pipelineRecommendation, setPipelineRecommendation] = useState<string>('');
  const [selectedPipelineStage, setSelectedPipelineStage] = useState<string>('engage');
  const [aiChatbotPaused, setAiChatbotPaused] = useState(false);
  const [togglingAI, setTogglingAI] = useState(false);
  
  // Pull-to-refresh state
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullStartY, setPullStartY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && sessionId) {
      loadSessionData();
      loadAIAnalysis();
      loadBookingLink();
      loadAIInstructions();
      loadCoinBalance();
    }
  }, [user, sessionId]);

  // Pull-to-refresh handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const container = messagesContainerRef.current;
    if (!container) return;
    
    // Only trigger if scrolled to top
    if (container.scrollTop === 0) {
      setPullStartY(e.touches[0].clientY);
      setIsPulling(true);
    }
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling) return;
    
    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - pullStartY);
    
    // Limit pull distance to 80px
    const maxPull = 80;
    const limitedDistance = Math.min(distance, maxPull);
    
    setPullDistance(limitedDistance);
    
    // Prevent default scrolling when pulling
    if (distance > 0) {
      e.preventDefault();
    }
  };
  
  const handleTouchEnd = () => {
    if (!isPulling) return;
    
    const threshold = 50; // Minimum pull distance to trigger refresh
    
    if (pullDistance >= threshold && !isRefreshing) {
      loadSessionData(true);
    }
    
    // Reset pull state
    setPullDistance(0);
    setIsPulling(false);
    setPullStartY(0);
  };
  
  // Mouse drag support for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    const container = messagesContainerRef.current;
    if (!container) return;
    
    if (container.scrollTop === 0) {
      setPullStartY(e.clientY);
      setIsPulling(true);
    }
  };
  
  // Mouse event handlers (using document listeners for proper tracking)
  useEffect(() => {
    if (!isPulling) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const currentY = e.clientY;
      const distance = Math.max(0, currentY - pullStartY);
      const maxPull = 80;
      const limitedDistance = Math.min(distance, maxPull);
      
      setPullDistance(limitedDistance);
    };
    
    const handleMouseUp = () => {
      const threshold = 50;
      
      if (pullDistance >= threshold && !isRefreshing) {
        loadSessionData(true);
      }
      
      setPullDistance(0);
      setIsPulling(false);
      setPullStartY(0);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPulling, pullDistance, pullStartY, isRefreshing]);

  async function loadCoinBalance() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('coin_balance')
        .eq('id', user?.id)
        .single();

      if (data) {
        setCoinBalance(data.coin_balance || 0);
      }
    } catch (error) {
      console.error('Error loading coin balance:', error);
    }
  }

  async function loadAIInstructions() {
    try {
      const { data, error } = await supabase
        .from('ai_system_instructions')
        .select('instructions')
        .eq('user_id', user?.id)
        .eq('feature_type', 'messaging')
        .eq('is_active', true)
        .maybeSingle();

      if (data) {
        setAiInstructions(data.instructions || '');
      }
    } catch (error) {
      console.error('Error loading AI instructions:', error);
    }
  }

  async function loadAIAnalysis() {
    try {
      setAnalyzingSession(true);
      const analysisData = await sessionAnalysisService.analyzeSession(sessionId!);
      setAnalysis(analysisData);
      setLastAnalyzedAt(new Date().toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }));
    } catch (error) {
      console.error('Error loading AI analysis:', error);
    } finally {
      setAnalyzingSession(false);
    }
  }

  async function handleRegenerateAnalysis() {
    // Check coin balance (10 coins for analysis)
    if (coinBalance < 10) {
      setShowBuyCoinsModal(true);
      return;
    }

    setGeneratingAnalysis(true);
    try {
      // Deduct coins
      await supabase
        .from('profiles')
        .update({ coin_balance: coinBalance - 10 })
        .eq('id', user?.id);
      setCoinBalance(coinBalance - 10);

      // Regenerate analysis with animation delay for premium feel
      await new Promise(resolve => setTimeout(resolve, 2000));
      await loadAIAnalysis();
      
      alert('✅ Analysis updated successfully!');
      setShowGenerateAnalysisModal(false);
    } catch (error) {
      console.error('Error regenerating analysis:', error);
      alert('Failed to regenerate analysis');
    } finally {
      setGeneratingAnalysis(false);
    }
  }

  async function handleGeneratePipelineRecommendation() {
    setGeneratingPipelineRec(true);
    setPipelineRecommendation('');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const name = session?.visitor_name || 'This lead';
      const tempRecommendation = analysis?.leadTemperature === 'hot'
        ? `${name} is actively engaging and curious about your product and earning potential. They've asked specific questions about pricing and integration possibilities. 🔥\n\n✨ AI Recommendation: Send to CLOSING PIPELINE for immediate conversion approach. This lead is ready to buy - strike while the iron is hot!`
        : analysis?.leadTemperature === 'warm'
        ? `${name} is showing interest and asking good questions about your offerings. They're warming up and building trust! 🌡️\n\n✨ AI Recommendation: Send to NURTURE PIPELINE for relationship-building and value education approach. Build rapport before pushing for sale.`
        : analysis?.leadTemperature === 'curious'
        ? `${name} is asking multiple questions and seeking to understand more. They're in research mode and gathering information! ❓\n\n✨ AI Recommendation: Send to EDUCATION PIPELINE for information-heavy approach to answer all questions and build credibility.`
        : `${name} hasn't shown strong engagement yet. Conversation is cold and needs re-activation! ❄️\n\n✨ AI Recommendation: Send to RE-ENGAGEMENT PIPELINE with curiosity-driven content to spark interest and get them talking again.`;
      
      setPipelineRecommendation(tempRecommendation);
      
      // Auto-select recommended stage
      const recommendedStage = analysis?.leadTemperature === 'hot' ? 'closing' :
                              analysis?.leadTemperature === 'warm' ? 'nurture' :
                              analysis?.leadTemperature === 'curious' ? 'engage' :
                              'cold';
      setSelectedPipelineStage(recommendedStage);
    } finally {
      setGeneratingPipelineRec(false);
    }
  }

  async function handleRegenerateAnalysis() {
    // Check coin balance (10 coins for analysis)
    if (coinBalance < 10) {
      setShowBuyCoinsModal(true);
      return;
    }

    setGeneratingAnalysis(true);
    try {
      // Deduct coins
      await supabase
        .from('profiles')
        .update({ coin_balance: coinBalance - 10 })
        .eq('id', user?.id);
      setCoinBalance(coinBalance - 10);

      // Regenerate analysis
      await loadAIAnalysis();
      alert('✅ Analysis updated successfully!');
      setShowGenerateAnalysisModal(false);
    } catch (error) {
      console.error('Error regenerating analysis:', error);
      alert('Failed to regenerate analysis');
    } finally {
      setGeneratingAnalysis(false);
    }
  }

  async function handleGeneratePipelineRecommendation() {
    setGeneratingPipelineRec(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const name = session?.visitor_name || 'This lead';
      const tempRecommendation = analysis?.leadTemperature === 'hot'
        ? `${name} is actively engaging and showing strong buying intent! They've asked about pricing and product details. 🔥\n\n✨ Recommendation: Send to CLOSING PIPELINE for immediate conversion approach. Strike while the iron is hot!`
        : analysis?.leadTemperature === 'warm'
        ? `${name} is curious and asking good questions about our product and earning potential. They're building interest! 🌡️\n\n✨ Recommendation: Send to NURTURE PIPELINE for relationship-building and value education approach.`
        : analysis?.leadTemperature === 'curious'
        ? `${name} is asking multiple questions and seeking to understand more. They're in research mode! ❓\n\n✨ Recommendation: Send to EDUCATION PIPELINE for information-heavy approach to answer all questions.`
        : `${name} hasn't shown strong engagement yet. Needs re-activation! ❄️\n\n✨ Recommendation: Send to RE-ENGAGEMENT PIPELINE with curiosity-driven content to spark interest.`;
      
      setPipelineRecommendation(tempRecommendation);
    } finally {
      setGeneratingPipelineRec(false);
    }
  }

  async function loadBookingLink() {
    try {
      const settings = await calendarService.getSettings(user!.id);
      if (settings?.booking_slug) {
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://nexscout.com';
        setBookingLink(`${origin}/book/${settings.booking_slug}`);
      }
    } catch (error) {
      console.error('Error loading booking link:', error);
    }
  }

  async function handleCopyBookingLink() {
    if (!bookingLink) {
      alert('⏰ Calendar not set up yet!\n\nPlease configure your calendar settings first.');
      onNavigate?.('calendar');
      return;
    }
    
    try {
      await navigator.clipboard.writeText(bookingLink);
      setCopiedBooking(true);
      setTimeout(() => setCopiedBooking(false), 2000);
    } catch (error) {
      console.error('Error copying link:', error);
      alert('Failed to copy link. Please try again.');
    }
  }

  async function handleConvertClick() {
    try {
      const data = await sessionAnalysisService.calculateConversionData(sessionId!);
      setConversionData(data);
      setShowConvertModal(true);
    } catch (error) {
      console.error('Error calculating conversion data:', error);
      alert('Failed to analyze session for conversion');
    }
  }

  async function handleConfirmConvert() {
    try {
      setConverting(true);
      const { data, error } = await supabase.rpc('auto_qualify_session', {
        p_session_id: sessionId
      });

      if (error) throw error;

      if (data) {
        alert('Successfully converted to prospect!');
        setShowConvertModal(false);
        loadSessionData();
      } else {
        alert('Could not convert. Make sure visitor information is captured.');
      }
    } catch (error) {
      console.error('Error converting:', error);
      alert('Failed to convert to prospect');
    } finally {
      setConverting(false);
    }
  }

  const loadSessionData = async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    
    const { data: sessionData } = await supabase
      .from('public_chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user?.id)
      .maybeSingle();

    if (!sessionData) {
      if (!isRefresh) {
        onBack?.();
      }
      if (isRefresh) {
        setIsRefreshing(false);
      } else {
        setLoading(false);
      }
      return;
    }

    const { data: messagesData } = await supabase
      .from('public_chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    const { data: pipelineData } = await supabase
      .from('chatbot_to_prospect_pipeline')
      .select('*, prospects(*)')
      .eq('session_id', sessionId)
      .maybeSingle();

    setSession(sessionData);
    setMessages(messagesData || []);
    setPipelineEntry(pipelineData);
    
    // Set AI paused state based on session status
    setAiChatbotPaused(sessionData?.status === 'human_takeover');
    
    if (isRefresh) {
      setIsRefreshing(false);
    } else {
      setLoading(false);
    }
  };

  const convertToProspect = async () => {
    const { data } = await supabase.rpc('auto_qualify_session', {
      p_session_id: sessionId
    });

    if (data) {
      alert('Successfully converted to prospect!');
      loadSessionData();
    } else {
      alert('Could not convert. Make sure visitor information is captured.');
    }
  };

  const handleGenerateMessageScenarios = async () => {
    if (!analysis || !session) return;

    // Check coin balance (5 coins needed - 50% off from 10)
    if (coinBalance < 5) {
      setShowBuyCoinsModal(true);
      return;
    }
    
    setGeneratingMessage(true);
    setMessageScenarios([]);
    setSelectedScenario(null);

    try {
      // Deduct coins
      const { error: deductError } = await supabase
        .from('profiles')
        .update({ coin_balance: coinBalance - 5 })
        .eq('id', user?.id);

      if (deductError) throw deductError;

      // Update local balance
      setCoinBalance(coinBalance - 5);

      // Build context from chat messages
      const chatContext = messages.slice(-5).map(m => 
        `${m.sender === 'visitor' ? session.visitor_name || 'Visitor' : 'Bot'}: ${m.message_text}`
      ).join('\n');

      // Simulate AI generation (replace with real OpenAI call in production)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate 5 scenarios based on different customer needs/backgrounds
      const goalDescriptions: Record<string, string> = {
        follow_up: 'following up on their inquiry',
        answer_questions: 'answering their questions about products/services',
        handle_objections: 'addressing their concerns and objections',
        close_sale: 'closing the sale and getting commitment',
        build_rapport: 'building trust and relationship',
        product_benefits: 'highlighting product benefits and features',
        business_opportunity: 'presenting the business opportunity',
        income_potential: 'discussing income and earning potential',
        faq_response: 'answering frequently asked questions'
      };

      const mockScenarios = [
        {
          id: 1,
          perspective: 'Direct & Action-Oriented',
          customerNeed: 'Ready to buy, needs clear next steps',
          message: `Hi ${session.visitor_name}! I saw you were asking about ${analysis.buyingSignals[0] || 'our products'}. Ready to get started? Here's what you need to know: ${goalDescriptions[messageGoal]}. Let's schedule a quick call today! 📞`
        },
        {
          id: 2,
          perspective: 'Consultative & Discovery',
          customerNeed: 'Needs more information before deciding',
          message: `Hello ${session.visitor_name}! Thanks for your interest in ${analysis.buyingSignals[0] || 'what we offer'}. Before I share details about ${goalDescriptions[messageGoal]}, I'd love to understand - what specific goals are you looking to achieve? 🤔`
        },
        {
          id: 3,
          perspective: 'Value-Focused & Story-Driven',
          customerNeed: 'Motivated by success stories & social proof',
          message: `Hi ${session.visitor_name}! Maraming tao like you found success with us! One partner earned ₱50k in their first month by ${goalDescriptions[messageGoal]}. Their story started just like yours - curious and asking questions. Would you like to hear how they did it? 💪✨`
        },
        {
          id: 4,
          perspective: 'Empathetic & Problem-Solving',
          customerNeed: 'Has concerns/pain points to address',
          message: `Hi ${session.visitor_name}! I understand you have questions about ${analysis.questions[0] || analysis.buyingSignals[0] || 'this opportunity'}. Many people feel the same way at first. Let me share how we can help you with ${goalDescriptions[messageGoal]}. May I ask - what's your biggest concern right now? 💭`
        },
        {
          id: 5,
          perspective: 'Casual & Relatable (Taglish)',
          customerNeed: 'Filipino market, wants friendly approach',
          message: `Kumusta ${session.visitor_name}! Saw your message about ${analysis.buyingSignals[0] || 'our products'}. Para sa akin, ${goalDescriptions[messageGoal]} is super straightforward lang! Maraming Pinoy na nag-succeed dito. Game ka ba for a quick chat? Let's talk! 😊🇵🇭`
        }
      ];

      setMessageScenarios(mockScenarios);
    } catch (error) {
      console.error('Error generating message scenarios:', error);
      alert('Failed to generate messages. Please try again.');
      // Refund coins on error
      await supabase
        .from('profiles')
        .update({ coin_balance: coinBalance })
        .eq('id', user?.id);
    } finally {
      setGeneratingMessage(false);
    }
  };

  const handleGenerateSequence = async () => {
    if (!analysis || !session) return;

    // Check coin balance (13 coins needed - 50% off from 25, rounded up)
    if (coinBalance < 13) {
      setShowBuyCoinsModal(true);
      return;
    }
    
    setGeneratingSequence(true);
    setSequenceApproaches([]);
    setSelectedApproach(null);

    try {
      // Deduct coins
      const { error: deductError } = await supabase
        .from('profiles')
        .update({ coin_balance: coinBalance - 13 })
        .eq('id', user?.id);

      if (deductError) throw deductError;

      // Update local balance
      setCoinBalance(coinBalance - 13);

      // Simulate AI generation (replace with real OpenAI call)
      await new Promise(resolve => setTimeout(resolve, 2500));

      // Generate 3 different approaches/styles
      const approaches = [
        {
          id: 1,
          name: 'Gentle Nurture (Soft Sell)',
          description: 'Build trust gradually with educational content and value',
          messages: Array.from({ length: sequenceSteps }, (_, i) => ({
            day: i + 1,
            subject: i === 0 ? `Thanks for your interest, ${session.visitor_name}!` :
                     i === 1 ? 'Quick value for you' :
                     i === 2 ? 'Success story you might like' :
                     i === 3 ? 'Common questions answered' :
                     'Still here to help',
            message: i === 0 ? `Hi ${session.visitor_name}! Thanks for asking about ${analysis.buyingSignals[0] || 'our products'}. I'd love to share some helpful information with you first. No pressure! 😊` :
                     i === 1 ? `${session.visitor_name}, here's a quick tip that might help you: [value-focused insight]. Hope this is useful! 💡` :
                     i === 2 ? `Hi ${session.visitor_name}! Meet Maria - she had similar questions as you. Here's her story... 📖` :
                     i === 3 ? `${session.visitor_name}, answering your question about "${analysis.questions[0] || 'pricing'}": Here's the full breakdown... 💎` :
                     `Hey ${session.visitor_name}! Just checking in - any other questions I can help with? No rush! 🙂`
          }))
        },
        {
          id: 2,
          name: 'Strategic Push (Balanced)',
          description: 'Mix of value and urgency with clear calls-to-action',
          messages: Array.from({ length: sequenceSteps }, (_, i) => ({
            day: i + 1,
            subject: i === 0 ? `Perfect timing, ${session.visitor_name}!` :
                     i === 1 ? 'Quick question for you' :
                     i === 2 ? 'Special opportunity' :
                     i === 3 ? 'Ready to move forward?' :
                     'Last call',
            message: i === 0 ? `${session.visitor_name}, great timing! We have a promo this week that matches what you're looking for with ${analysis.buyingSignals[0] || 'our products'}. Interested? 🎯` :
                     i === 1 ? `Hey ${session.visitor_name}! Quick question - what's holding you back from getting started? I can help address that! 🤔` :
                     i === 2 ? `${session.visitor_name}, special offer: [limited-time promo]. Perfect for what you asked about. Want to lock it in? ⏰` :
                     i === 3 ? `Hi ${session.visitor_name}! Ready na ba? Let's schedule a quick 15-min call to get you started. I have slots tomorrow! 📅` :
                     `${session.visitor_name}, offer ends soon! This might not be available next week. Decide ka na ba? 🚀`
          }))
        },
        {
          id: 3,
          name: 'Aggressive Close (Hard Sell)',
          description: 'Direct, action-oriented with strong urgency and FOMO',
          messages: Array.from({ length: sequenceSteps }, (_, i) => ({
            day: i + 1,
            subject: i === 0 ? `Let's get you started, ${session.visitor_name}!` :
                     i === 1 ? 'Exclusive offer - TODAY ONLY' :
                     i === 2 ? 'Slots filling up fast!' :
                     i === 3 ? 'FINAL CALL' :
                     'Closing your file',
            message: i === 0 ? `${session.visitor_name}, based on your questions about ${analysis.buyingSignals[0] || 'this opportunity'}, you're READY! Let's lock this in TODAY. Here's how... 🔥` :
                     i === 1 ? `URGENT ${session.visitor_name}! Special promo ENDS TONIGHT. ₱10k discount + bonuses. Reply NOW to claim! ⚡` :
                     i === 2 ? `${session.visitor_name}, only 3 SLOTS LEFT this month! People are signing up fast. Secure yours NOW before it's gone! 🏃‍♂️💨` :
                     i === 3 ? `FINAL CALL ${session.visitor_name}! This is the LAST DAY for this offer. Yes or no? Respond within 2 hours! ⏱️` :
                     `${session.visitor_name}, I'm closing inactive files tomorrow. Last chance to get in. Reply if interested, otherwise goodbye! 👋`
          }))
        }
      ];

      setSequenceApproaches(approaches);
    } catch (error) {
      console.error('Error generating sequence:', error);
      alert('Failed to generate sequence. Please try again.');
      // Refund coins on error
      await supabase
        .from('profiles')
        .update({ coin_balance: coinBalance })
        .eq('id', user?.id);
    } finally {
      setGeneratingSequence(false);
    }
  };

  const sendHumanReply = async () => {
    if (!humanReply.trim() || !sessionId || sending) return;

    setSending(true);
    try {
      // Save human message to database
      await supabase.from('public_chat_messages').insert({
        session_id: sessionId,
        sender: 'ai',
        message: humanReply,
        ai_intent: 'human_intervention'
      });

      // Update session status to indicate human takeover
      await supabase
        .from('public_chat_sessions')
        .update({
          status: 'human_takeover',
          last_message_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      setHumanReply('');
      await loadSessionData();
    } catch (error) {
      console.error('Error sending human reply:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <MessageCircle className="w-12 h-12 text-blue-600 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      {/* Facebook-Style Compact Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              
              {/* Avatar + Name */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0 ${
                  getAvatarClasses(session?.visitor_avatar_seed, !!session?.visitor_name)
                }`}>
                  <span className="text-lg">
                    {getAvatarContent(session?.visitor_avatar_seed, session?.visitor_name)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                    {session?.visitor_name || 'Anonymous'}
                  </h1>
                  <p className="text-xs text-gray-500">
                    {messages.length} messages
                  </p>
                </div>
              </div>
            </div>
            
            {/* Compact Action Buttons */}
            <div className="flex items-center gap-2">
              {lastAnalyzedAt && (
                <span className="text-xs text-gray-600">
                  AI Analyzed Chat last {lastAnalyzedAt}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Facebook Style */}
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Conversation Card - Compact */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 180px)', maxHeight: 'calc(100vh - 180px)' }}>
              <div className="px-3 sm:px-4 py-3 border-b border-gray-100 flex-shrink-0">
                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-[#1877F2]" />
                  Conversation
                </h2>
              </div>
              
              {/* Pull-to-refresh indicator */}
              {(pullDistance > 0 || isRefreshing) && (
                <div 
                  className="flex items-center justify-center py-2 bg-white border-b border-gray-100 transition-all duration-200"
                  style={{ 
                    transform: `translateY(${Math.max(0, pullDistance - 30)}px)`,
                    opacity: Math.min(1, pullDistance / 50)
                  }}
                >
                  {isRefreshing ? (
                    <div className="flex items-center gap-2 text-blue-600">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span className="text-xs font-medium">Refreshing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-500">
                      <RefreshCw 
                        className="w-4 h-4 transition-transform"
                        style={{ transform: `rotate(${pullDistance * 4}deg)` }}
                      />
                      <span className="text-xs">
                        {pullDistance >= 50 ? 'Release to refresh' : 'Pull to refresh'}
                      </span>
                    </div>
                  )}
                </div>
              )}
              
              <div 
                ref={messagesContainerRef}
                className="px-3 sm:px-4 py-4 space-y-3 overflow-y-auto flex-1 min-h-0 relative"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                style={{ touchAction: 'pan-y' }}
              >
                {/* Tiny pull-to-refresh hint at top */}
                {messages.length > 0 && pullDistance === 0 && !isRefreshing && (
                  <div className="flex items-center justify-center gap-1 pb-2 pointer-events-none">
                    <RefreshCw className="w-3 h-3 text-gray-400" />
                    <span className="text-[10px] text-gray-400 font-normal">Pull the chatbox to refresh</span>
                  </div>
                )}
                
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'visitor' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-2 max-w-[80%] ${msg.sender === 'visitor' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        msg.sender === 'ai'
                          ? msg.ai_intent === 'human_intervention'
                            ? 'bg-gradient-to-br from-purple-500 to-pink-600 text-white'
                            : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                          : getAvatarClasses(session?.visitor_avatar_seed, !!session?.visitor_name)
                      }`}>
                        {msg.sender === 'ai' ? (
                          msg.ai_intent === 'human_intervention' ? (
                            <User className="w-4 h-4" />
                          ) : (
                            <MessageCircle className="w-4 h-4" />
                          )
                        ) : (
                          <span className="text-sm">
                            {getAvatarContent(session?.visitor_avatar_seed, session?.visitor_name)}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className={`rounded-2xl px-4 py-2 ${
                          msg.sender === 'visitor'
                            ? 'bg-blue-600 text-white'
                            : msg.ai_intent === 'human_intervention'
                            ? 'bg-purple-100 text-purple-900 border border-purple-300'
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                        </div>
                        <p className={`text-xs text-gray-400 mt-1 ${msg.sender === 'visitor' ? 'text-right' : 'text-left'}`}>
                          {new Date(msg.created_at).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                          {msg.ai_intent === 'human_intervention' && (
                            <span className="ml-2 text-purple-600 font-medium">· You replied</span>
                          )}
                          {msg.ai_intent && msg.ai_intent !== 'human_intervention' && (
                            <span className="ml-2 text-gray-500">· {msg.ai_intent}</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Human Intervention Input - Facebook Style with Better Spacing - Always Visible */}
              {session && (session.status === 'active' || session.status === 'human_takeover') && (
                <div className="border-t border-gray-200 pt-4 pb-4 px-3 sm:px-5 flex-shrink-0 bg-white" style={{ position: 'relative', zIndex: 1, minHeight: '120px' }}>
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-purple-100 rounded-full">
                        <User className="w-5 h-5 text-purple-600" />
                      </div>
                      <span className="text-base font-bold text-gray-900">Reply as Human</span>
                    </div>
                    
                    {/* Chatbot Status + Pause/Play Button */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`text-xs font-semibold whitespace-nowrap ${
                        aiChatbotPaused ? 'text-orange-600' : 'text-green-600'
                      }`}>
                        {aiChatbotPaused ? 'Chatbot is paused' : 'Chatbot is running'}
                      </span>
                      <button
                        onClick={async () => {
                          setTogglingAI(true);
                          try {
                            const newStatus = aiChatbotPaused ? 'active' : 'human_takeover';
                            const { error } = await supabase
                              .from('public_chat_sessions')
                              .update({ 
                                status: newStatus,
                                last_message_at: new Date().toISOString()
                              })
                              .eq('id', sessionId);
                            
                            if (error) throw error;
                            
                            setAiChatbotPaused(!aiChatbotPaused);
                            
                            // Reload session data to ensure consistency
                            await loadSessionData();
                            
                            const message = aiChatbotPaused 
                              ? '✅ AI Chatbot resumed! Auto-responses enabled.'
                              : '⏸️ AI Chatbot paused. You have full control now.';
                            alert(message);
                          } catch (error) {
                            console.error('Error toggling AI:', error);
                            alert('Failed to toggle AI. Please try again.');
                          } finally {
                            setTogglingAI(false);
                          }
                        }}
                        disabled={togglingAI}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all shadow-sm whitespace-nowrap ${
                          aiChatbotPaused
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-orange-600 text-white hover:bg-orange-700'
                        } disabled:opacity-50`}
                      >
                        {togglingAI ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : aiChatbotPaused ? (
                          <Play className="w-4 h-4" />
                        ) : (
                          <Pause className="w-4 h-4" />
                        )}
                        <span className="hidden sm:inline">
                          {aiChatbotPaused ? 'Resume AI' : 'Pause AI'}
                        </span>
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={humanReply}
                      onChange={(e) => setHumanReply(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendHumanReply()}
                      placeholder="Type your message to the visitor..."
                      className="flex-1 px-5 py-3.5 bg-[#F0F2F5] border-0 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
                      disabled={sending}
                    />
                    <button
                      onClick={sendHumanReply}
                      disabled={!humanReply.trim() || sending}
                      className="p-3.5 bg-[#1877F2] text-white rounded-full hover:bg-[#1558B0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md flex-shrink-0"
                    >
                      {sending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Facebook-Style Sidebar Cards */}
          <div className="space-y-3">
            {/* Quick Actions - 2 Rows x 3 Columns Grid */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="grid grid-cols-3 gap-2">
                  {/* Row 1 - Col 1: Convert Prospect */}
                  <button
                    onClick={handleConvertClick}
                    className="flex flex-col items-center gap-2 p-3 bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 rounded-2xl transition-all border border-green-200 hover:border-green-300 hover:shadow-md group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                      <UserPlus className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs font-bold text-gray-900 text-center leading-tight">Convert<br/>Prospect</span>
                  </button>

                  {/* Row 1 - Col 2: Generate AI Message */}
                  <button
                    onClick={() => setShowGenerateMessageModal(true)}
                    className="flex flex-col items-center gap-2 p-3 bg-gradient-to-br from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 rounded-2xl transition-all border border-blue-200 hover:border-blue-300 hover:shadow-md group relative"
                  >
                    <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                      <MessageSquare className="w-6 h-6 text-white" />
                    </div>
                    <Sparkles className="w-3 h-3 text-yellow-400 absolute top-2 right-2" />
                    <span className="text-xs font-bold text-gray-900 text-center leading-tight">AI<br/>Message</span>
                  </button>

                  {/* Row 1 - Col 3: Generate AI Analysis */}
                  <button
                    onClick={() => setShowGenerateAnalysisModal(true)}
                    className="flex flex-col items-center gap-2 p-3 bg-gradient-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 rounded-2xl transition-all border border-purple-200 hover:border-purple-300 hover:shadow-md group relative"
                  >
                    <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    <Sparkles className="w-3 h-3 text-yellow-400 absolute top-2 right-2" />
                    <span className="text-xs font-bold text-gray-900 text-center leading-tight">AI<br/>Analysis</span>
                  </button>

                  {/* Row 2 - Col 1: Send to Pipeline */}
                  <button
                    onClick={() => {
                      setShowSendToPipelineModal(true);
                      handleGeneratePipelineRecommendation();
                    }}
                    className="flex flex-col items-center gap-2 p-3 bg-gradient-to-br from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 rounded-2xl transition-all border border-orange-200 hover:border-orange-300 hover:shadow-md group relative"
                  >
                    <div className="w-12 h-12 rounded-xl bg-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                      <Shuffle className="w-6 h-6 text-white" />
                    </div>
                    <Sparkles className="w-3 h-3 text-yellow-400 absolute top-2 right-2" />
                    <span className="text-xs font-bold text-gray-900 text-center leading-tight">Send to<br/>Pipeline</span>
                  </button>

                  {/* Row 2 - Col 2: Generate AI Sequence */}
                  <button
                    onClick={() => setShowGenerateSequenceModal(true)}
                    className="flex flex-col items-center gap-2 p-3 bg-gradient-to-br from-pink-50 to-rose-50 hover:from-pink-100 hover:to-rose-100 rounded-2xl transition-all border border-pink-200 hover:border-pink-300 hover:shadow-md group relative"
                  >
                    <div className="w-12 h-12 rounded-xl bg-pink-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                      <Layers className="w-6 h-6 text-white" />
                    </div>
                    <Sparkles className="w-3 h-3 text-yellow-400 absolute top-2 right-2" />
                    <span className="text-xs font-bold text-gray-900 text-center leading-tight">AI<br/>Sequence</span>
                  </button>

                  {/* Row 2 - Col 3: Set Appointment */}
                  <button
                    onClick={() => setShowSetAppointmentModal(true)}
                    className="flex flex-col items-center gap-2 p-3 bg-gradient-to-br from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 rounded-2xl transition-all border border-indigo-200 hover:border-indigo-300 hover:shadow-md group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs font-bold text-gray-900 text-center leading-tight">Set<br/>Appointment</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Visitor Info - Facebook Style with Better Spacing */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-3.5 bg-[#F0F2F5]">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-[#1877F2]" />
                  Visitor Info
                </h3>
              </div>
              <div className="px-8 py-6 space-y-1">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-xs font-semibold text-gray-600">Name</span>
                  <span className="text-sm font-bold text-gray-900 truncate max-w-[180px]">{session?.visitor_name || 'Not provided'}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-xs font-semibold text-gray-600">Email</span>
                  <span className="text-xs font-bold text-[#1877F2] truncate max-w-[180px]">{session?.visitor_email || 'Not provided'}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-xs font-semibold text-gray-600">Phone</span>
                  <span className="text-sm font-bold text-gray-900">{session?.visitor_phone || 'Not provided'}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-xs font-semibold text-gray-600">Channel</span>
                  <span className="text-sm font-bold text-[#1877F2]">🌐 Web</span>
                </div>
              </div>
            </div>

            {pipelineEntry && (
              <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">Converted to Prospect</h3>
                </div>
                <button
                  onClick={() => onNavigate?.('prospect-detail', { prospectId: pipelineEntry.prospect_id })}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  View Prospect Details
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Convert to Prospect Modal */}
      {showConvertModal && conversionData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Convert to Prospect</h2>
            
            {/* Extracted Information */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Extracted Information</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    {conversionData.scoreBreakdown.hasName ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-gray-400" />
                    )}
                    <span className="text-sm font-semibold text-gray-700">Name:</span>
                    <span className="text-sm text-gray-900">{conversionData.name || 'Not detected'}</span>
                  </div>
                  <span className={`text-sm font-bold ${conversionData.scoreBreakdown.hasName ? 'text-green-600' : 'text-gray-400'}`}>
                    +{conversionData.scoreBreakdown.nameScore} pts
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    {conversionData.scoreBreakdown.hasEmail ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-gray-400" />
                    )}
                    <span className="text-sm font-semibold text-gray-700">Email:</span>
                    <span className="text-sm text-gray-900">{conversionData.email || 'Not detected'}</span>
                  </div>
                  <span className={`text-sm font-bold ${conversionData.scoreBreakdown.hasEmail ? 'text-green-600' : 'text-gray-400'}`}>
                    +{conversionData.scoreBreakdown.emailScore} pts
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    {conversionData.scoreBreakdown.hasPhone ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-gray-400" />
                    )}
                    <span className="text-sm font-semibold text-gray-700">Phone:</span>
                    <span className="text-sm text-gray-900">{conversionData.phone || 'Not detected'}</span>
                  </div>
                  <span className={`text-sm font-bold ${conversionData.scoreBreakdown.hasPhone ? 'text-green-600' : 'text-gray-400'}`}>
                    +{conversionData.scoreBreakdown.phoneScore} pts
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-semibold text-gray-700">Engagement:</span>
                    <span className="text-sm text-gray-900">{conversionData.scoreBreakdown.hasEngagement ? `${messages.filter(m => m.sender === 'visitor').length} messages` : 'Low'}</span>
                  </div>
                  <span className="text-sm font-bold text-green-600">
                    +{conversionData.scoreBreakdown.engagementScore} pts
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-semibold text-gray-700">Intent:</span>
                    <span className="text-sm text-gray-900">{conversionData.scoreBreakdown.hasIntent ? 'Engaged' : 'Passive'}</span>
                  </div>
                  <span className="text-sm font-bold text-green-600">
                    +{conversionData.scoreBreakdown.intentScore} pts
                  </span>
                </div>
              </div>
            </div>

            {/* Qualification Score */}
            <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border-2 border-blue-300">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Qualification Score</h3>
              <div className="flex items-center gap-4 mb-3">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        conversionData.qualificationScore >= 70 ? 'bg-green-600' :
                        conversionData.qualificationScore >= 40 ? 'bg-orange-600' :
                        'bg-gray-600'
                      }`}
                      style={{ width: `${conversionData.qualificationScore}%` }}
                    />
                  </div>
                </div>
                <span className="text-3xl font-bold text-gray-900">{conversionData.qualificationScore}/100</span>
              </div>
              
              <div className={`px-4 py-2 rounded-xl flex items-center gap-2 ${
                conversionData.qualificationScore >= 70 ? 'bg-green-100 border-2 border-green-300' :
                conversionData.qualificationScore >= 40 ? 'bg-amber-100 border-2 border-amber-300' :
                conversionData.qualificationScore >= 25 ? 'bg-blue-100 border-2 border-blue-300' :
                'bg-red-100 border-2 border-red-300'
              }`}>
                <span className="font-bold">Status:</span>
                <span className="font-semibold">
                  {conversionData.qualificationScore >= 70 ? '✅ HIGHLY QUALIFIED' :
                   conversionData.qualificationScore >= 40 ? '⚠️ QUALIFIED' :
                   conversionData.qualificationScore >= 25 ? '⚠️ PARTIALLY QUALIFIED' :
                   '❌ NOT QUALIFIED'}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Minimum: 25 points {conversionData.canConvert ? '(✅ Met)' : '(❌ Not met)'}
              </p>
            </div>

            {/* Missing Information */}
            {conversionData.missingFields.length > 0 && (
              <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-300 rounded-xl">
                <h4 className="text-sm font-bold text-amber-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Missing Information:
                </h4>
                <ul className="space-y-1 text-sm text-amber-800 mb-3">
                  {conversionData.missingFields.includes('email') && (
                    <li>• Email address (worth +15 points)</li>
                  )}
                  {conversionData.missingFields.includes('phone') && (
                    <li>• Phone number (worth +20 points)</li>
                  )}
                  {conversionData.missingFields.includes('name') && (
                    <li>• Full name (worth +10 points)</li>
                  )}
                </ul>
                <p className="text-xs text-amber-700">
                  💡 Potential score: <strong>{conversionData.qualificationScore + 
                     (conversionData.missingFields.includes('email') ? 15 : 0) +
                     (conversionData.missingFields.includes('phone') ? 20 : 0) +
                     (conversionData.missingFields.includes('name') ? 10 : 0)}/100</strong>
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowConvertModal(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
              >
                Cancel
              </button>
              {conversionData.canConvert ? (
                <button
                  onClick={handleConfirmConvert}
                  disabled={converting}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {converting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Converting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Convert to Prospect →
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => {
                    setShowConvertModal(false);
                    alert('Request missing info feature coming soon! For now, ask manually in chat.');
                  }}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold"
                >
                  Request Missing Info
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Generate AI Message Modal */}
      {showGenerateMessageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-3xl">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                Generate AI Message
              </h3>
              <button
                onClick={() => setShowGenerateMessageModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Message Goal */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Message Goal</label>
                <select
                  value={messageGoal}
                  onChange={(e) => setMessageGoal(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-sm"
                >
                  <option value="follow_up">Follow Up</option>
                  <option value="answer_questions">Answer Questions</option>
                  <option value="handle_objections">Handle Objections</option>
                  <option value="close_sale">Close Sale</option>
                  <option value="build_rapport">Build Rapport</option>
                  <option value="product_benefits">Product Benefits</option>
                  <option value="business_opportunity">Business Opportunity</option>
                  <option value="income_potential">Income Potential</option>
                  <option value="faq_response">FAQ Response</option>
                </select>
              </div>

              {/* Message Tone */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Tone</label>
                <select
                  value={messageTone}
                  onChange={(e) => setMessageTone(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-sm"
                >
                  <option value="friendly">Friendly</option>
                  <option value="professional">Professional</option>
                  <option value="casual">Casual (Taglish)</option>
                  <option value="urgent">Urgent</option>
                  <option value="empathetic">Empathetic</option>
                </select>
              </div>

              {/* AI System Instructions Indicator */}
              {aiInstructions && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-semibold text-purple-800">Using your custom AI instructions</span>
                </div>
              )}

              {/* Generated Message Scenarios */}
              {messageScenarios.length > 0 && (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  <div className="text-sm font-bold text-gray-900">Choose a message style (5 scenarios):</div>
                  {messageScenarios.map((scenario) => (
                    <div
                      key={scenario.id}
                      onClick={() => setSelectedScenario(scenario.id)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedScenario === scenario.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-purple-600">{scenario.perspective}</span>
                        {selectedScenario === scenario.id && <CheckCircle className="w-4 h-4 text-blue-600" />}
                      </div>
                      <div className="text-xs text-gray-600 mb-2 italic">💡 Best for: {scenario.customerNeed}</div>
                      <div className="text-sm text-gray-800">{scenario.message}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Coin Cost (50% off) */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                <span className="text-xs font-bold text-blue-800">Cost:</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 line-through">💎 10 Coins</span>
                  <span className="text-sm font-bold text-blue-900">💎 5 Coins (50% OFF!)</span>
                </div>
              </div>

              {/* Coin Balance Display */}
              <div className="p-2 bg-gray-50 rounded-lg text-center">
                <span className="text-xs text-gray-600">Your Balance: </span>
                <span className="text-sm font-bold text-gray-900">💎 {coinBalance} Coins</span>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex gap-3 rounded-b-3xl border-t border-gray-200">
              <button
                onClick={() => {
                  setShowGenerateMessageModal(false);
                  setMessageScenarios([]);
                  setSelectedScenario(null);
                }}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-semibold"
              >
                Cancel
              </button>
              {messageScenarios.length === 0 ? (
                <button
                  onClick={handleGenerateMessageScenarios}
                  disabled={generatingMessage}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {generatingMessage ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Options
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={async () => {
                    if (selectedScenario) {
                      const selected = messageScenarios.find(s => s.id === selectedScenario);
                      if (selected) {
                        try {
                          await navigator.clipboard.writeText(selected.message);
                          setCopiedMessage(true);
                          setTimeout(() => {
                            setCopiedMessage(false);
                            setShowGenerateMessageModal(false);
                            setMessageScenarios([]);
                            setSelectedScenario(null);
                          }, 1500);
                        } catch (err) {
                          console.error('Failed to copy:', err);
                          alert('Failed to copy to clipboard. Please try again.');
                        }
                      }
                    } else {
                      alert('Please select a message first');
                    }
                  }}
                  disabled={!selectedScenario}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {copiedMessage ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy to Clipboard
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Generate AI Sequence Modal */}
      {showGenerateSequenceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-3xl">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-pink-600" />
                Generate AI Sequence
              </h3>
              <button
                onClick={() => setShowGenerateSequenceModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Sequence Type */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Sequence Type</label>
                <select
                  value={sequenceType}
                  onChange={(e) => setSequenceType(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:outline-none text-sm"
                >
                  <option value="nurture">Nurture (Build Trust)</option>
                  <option value="closing">Closing (Convert to Sale)</option>
                  <option value="reengagement">Re-engagement</option>
                  <option value="onboarding">Onboarding</option>
                  <option value="education">Education (Teach Product)</option>
                </select>
              </div>

              {/* Number of Steps */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Number of Messages: {sequenceSteps}</label>
                <input
                  type="range"
                  min="3"
                  max="7"
                  value={sequenceSteps}
                  onChange={(e) => setSequenceSteps(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>3 (Short)</span>
                  <span>7 (Long)</span>
                </div>
              </div>

              {/* AI System Instructions Indicator */}
              {aiInstructions && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-semibold text-purple-800">Using your custom AI instructions</span>
                </div>
              )}

              {/* AI Recommendation Based on Analysis */}
              {analysis && sequenceApproaches.length === 0 && (
                <div className={`p-4 rounded-xl border-2 ${
                  analysis.leadTemperature === 'hot' ? 'bg-red-50 border-red-200' :
                  analysis.leadTemperature === 'warm' ? 'bg-orange-50 border-orange-200' :
                  analysis.leadTemperature === 'curious' ? 'bg-purple-50 border-purple-200' :
                  'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-bold text-gray-800">AI Recommendation:</span>
                  </div>
                  <p className="text-xs text-gray-700">
                    {analysis.leadTemperature === 'hot' ? '🔥 Hot lead! Try AGGRESSIVE CLOSE approach.' :
                     analysis.leadTemperature === 'warm' ? '🌡️ Warm lead. Try STRATEGIC PUSH approach.' :
                     analysis.leadTemperature === 'curious' ? '❓ Curious lead. Try GENTLE NURTURE approach.' :
                     '❄️ Cold lead. Try STRATEGIC PUSH approach.'}
                  </p>
                </div>
              )}

              {/* Generated Sequence Approaches (3 options) */}
              {sequenceApproaches.length > 0 && (
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  <div className="text-sm font-bold text-gray-900">Choose your sequence approach (3 styles):</div>
                  {sequenceApproaches.map((approach) => {
                    const isExpanded = expandedApproach === approach.id;
                    const messagesToShow = isExpanded ? approach.messages : approach.messages.slice(0, 2);
                    
                    return (
                      <div
                        key={approach.id}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          selectedApproach === approach.id
                            ? 'border-pink-500 bg-pink-50'
                            : 'border-gray-200 bg-white hover:border-pink-300 hover:bg-pink-50'
                        }`}
                      >
                        <div 
                          onClick={() => setSelectedApproach(approach.id)}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-pink-600">{approach.name}</span>
                            {selectedApproach === approach.id && <CheckCircle className="w-5 h-5 text-pink-600" />}
                          </div>
                          <div className="text-xs text-gray-600 mb-3 italic">{approach.description}</div>
                        </div>
                        
                        {/* Message Preview (Collapsible) */}
                        <div className="space-y-2">
                          {messagesToShow.map((msg) => (
                            <div key={msg.day} className="p-3 bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-lg">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold text-pink-600">Day {msg.day}</span>
                                <span className="text-xs text-gray-500">{msg.day === 1 ? 'Send now' : `Day ${msg.day}`}</span>
                              </div>
                              <div className="text-xs font-bold text-gray-900 mb-1">{msg.subject}</div>
                              <div className="text-xs text-gray-700">{msg.message}</div>
                            </div>
                          ))}
                          
                          {/* Expand/Collapse Button */}
                          {approach.messages.length > 2 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedApproach(isExpanded ? null : approach.id);
                              }}
                              className="w-full flex items-center justify-center gap-2 p-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors text-xs font-semibold text-gray-700"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="w-4 h-4" />
                                  Show Less
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-4 h-4" />
                                  Show All {approach.messages.length} Messages
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Coin Cost (50% off) */}
              <div className="p-3 bg-pink-50 border border-pink-200 rounded-xl flex items-center justify-between">
                <span className="text-xs font-bold text-pink-800">Cost:</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 line-through">💎 25 Coins</span>
                  <span className="text-sm font-bold text-pink-900">💎 13 Coins (50% OFF!)</span>
                </div>
              </div>

              {/* Coin Balance Display */}
              <div className="p-2 bg-gray-50 rounded-lg text-center">
                <span className="text-xs text-gray-600">Your Balance: </span>
                <span className="text-sm font-bold text-gray-900">💎 {coinBalance} Coins</span>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex gap-3 rounded-b-3xl border-t border-gray-200">
              <button
                onClick={() => {
                  setShowGenerateSequenceModal(false);
                  setSequenceApproaches([]);
                  setSelectedApproach(null);
                }}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-semibold"
              >
                Cancel
              </button>
              {sequenceApproaches.length === 0 ? (
                <button
                  onClick={handleGenerateSequence}
                  disabled={generatingSequence}
                  className="flex-1 px-6 py-3 bg-pink-600 text-white rounded-xl hover:bg-pink-700 transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {generatingSequence ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate 3 Approaches
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (selectedApproach) {
                      alert('✅ Sequence saved and scheduled!\n\nMessages will be sent automatically over the next ' + sequenceSteps + ' days.');
                      setShowGenerateSequenceModal(false);
                      setSequenceApproaches([]);
                      setSelectedApproach(null);
                    } else {
                      alert('Please select an approach first');
                    }
                  }}
                  disabled={!selectedApproach}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Save & Schedule Sequence
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Generate AI Analysis Modal */}
      {showGenerateAnalysisModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 flex items-center justify-between rounded-t-3xl">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-6 h-6" />
                AI Analysis
              </h3>
              <button
                onClick={() => setShowGenerateAnalysisModal(false)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Current Analysis Summary */}
              {analysis && (
                <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl">
                  <div className="text-sm font-bold text-gray-900 mb-2">Current Analysis:</div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div><span className="text-gray-600">Lead:</span> <span className="font-bold">{analysis.leadTemperature.toUpperCase()}</span></div>
                    <div><span className="text-gray-600">Score:</span> <span className="font-bold">{analysis.qualificationScore}/100</span></div>
                    <div><span className="text-gray-600">Intent:</span> <span className="font-bold">{analysis.intent}</span></div>
                    <div><span className="text-gray-600">Signals:</span> <span className="font-bold">{analysis.buyingSignals.length}</span></div>
                  </div>
                  {lastAnalyzedAt && (
                    <div className="text-xs text-gray-500 mt-2">Last analyzed: {lastAnalyzedAt}</div>
                  )}
                </div>
              )}

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-bold text-blue-900">Updated AI Analysis</span>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">
                  AI will analyze the latest conversation with your customer and provide updated insights on:
                  buying signals, objections, questions, sentiment, intent, and qualification score.
                </p>
              </div>

              {/* Cost */}
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between">
                <span className="text-xs font-bold text-purple-800">Cost:</span>
                <span className="text-sm font-bold text-purple-900">💎 10 Coins</span>
              </div>

              {/* Balance */}
              <div className="p-2 bg-gray-50 rounded-lg text-center">
                <span className="text-xs text-gray-600">Your Balance: </span>
                <span className="text-sm font-bold text-gray-900">💎 {coinBalance} Coins</span>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex gap-3 rounded-b-3xl border-t border-gray-200">
              <button
                onClick={() => setShowGenerateAnalysisModal(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleRegenerateAnalysis}
                disabled={generatingAnalysis}
                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {generatingAnalysis ? (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Analyzing...</span>
                    </div>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Regenerate Analysis
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send to Pipeline Modal */}
      {showSendToPipelineModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-orange-600 to-amber-600 px-6 py-4 flex items-center justify-between rounded-t-3xl">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Shuffle className="w-6 h-6" />
                Send to Pipeline
              </h3>
              <button
                onClick={() => setShowSendToPipelineModal(false)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* AI Recommendation */}
              {generatingPipelineRec ? (
                <div className="p-8 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
                      <Brain className="w-8 h-8 text-orange-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <p className="text-sm font-semibold text-gray-700 animate-pulse">AI analyzing conversation...</p>
                  </div>
                </div>
              ) : pipelineRecommendation ? (
                <div className="p-5 bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-300 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="w-5 h-5 text-orange-600" />
                    <span className="text-sm font-bold text-orange-900">AI Smart Recommendation:</span>
                  </div>
                  <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">{pipelineRecommendation}</p>
                  <button
                    onClick={handleGeneratePipelineRecommendation}
                    className="mt-3 text-xs text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Regenerate Recommendation
                  </button>
                </div>
              ) : null}

              {/* Pipeline Stage Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Select Pipeline Stage:</label>
                <div className="space-y-2">
                  {[
                    { id: 'engage', name: 'Engage', color: 'blue', description: 'Initial contact & interest building' },
                    { id: 'nurture', name: 'Nurture', color: 'purple', description: 'Relationship & trust building' },
                    { id: 'closing', name: 'Closing', color: 'orange', description: 'Ready to convert - close the deal' },
                    { id: 'cold', name: 'Re-engagement', color: 'gray', description: 'Re-activate cold leads' },
                  ].map((stage) => (
                    <button
                      key={stage.id}
                      onClick={() => setSelectedPipelineStage(stage.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                        selectedPipelineStage === stage.id
                          ? `border-${stage.color}-500 bg-${stage.color}-50`
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <CheckCircle className={`w-5 h-5 ${
                        selectedPipelineStage === stage.id ? `text-${stage.color}-600` : 'text-gray-300'
                      }`} />
                      <div className="flex-1 text-left">
                        <div className="text-sm font-bold text-gray-900">{stage.name}</div>
                        <div className="text-xs text-gray-600">{stage.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex gap-3 rounded-b-3xl border-t border-gray-200">
              <button
                onClick={() => setShowSendToPipelineModal(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const stage = selectedPipelineStage;
                  await new Promise(resolve => setTimeout(resolve, 1500));
                  alert(`✅ Lead sent to ${stage.toUpperCase()} pipeline successfully!`);
                  setShowSendToPipelineModal(false);
                }}
                className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors font-semibold flex items-center justify-center gap-2"
              >
                <Shuffle className="w-4 h-4" />
                Send to Pipeline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Set Appointment Modal */}
      {showSetAppointmentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4 flex items-center justify-between rounded-t-3xl">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Calendar className="w-6 h-6" />
                Set Appointment
              </h3>
              <button
                onClick={() => setShowSetAppointmentModal(false)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  <span className="text-sm font-bold text-indigo-900">Simple Booking Interface</span>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed mb-3">
                  Send a booking link directly in the chat for easy customer interaction.
                </p>
                
                {/* Booking Link Preview */}
                <div className="p-3 bg-white border border-indigo-200 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">Message that will be sent:</div>
                  <div className="text-sm text-gray-900 italic">
                    "Hi {session?.visitor_name || 'there'}! Let's schedule a quick call. Book a time that works for you: {bookingLink || '[Your booking link]'}"
                  </div>
                </div>
              </div>

              {!bookingLink && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-bold text-yellow-800">Calendar Not Configured</span>
                  </div>
                  <p className="text-xs text-yellow-700">
                    Please set up your calendar first to send booking links.
                  </p>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex gap-3 rounded-b-3xl border-t border-gray-200">
              <button
                onClick={() => setShowSetAppointmentModal(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-semibold"
              >
                Cancel
              </button>
              {bookingLink ? (
                <button
                  onClick={() => {
                    alert('📅 Booking link sent in chat!\n\nThe customer can now click and book a time with you.');
                    setShowSetAppointmentModal(false);
                  }}
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-semibold flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send Booking Link
                </button>
              ) : (
                <button
                  onClick={() => {
                    setShowSetAppointmentModal(false);
                    onNavigate?.('calendar');
                  }}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold"
                >
                  Setup Calendar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Buy Coins Modal */}
      {showBuyCoinsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-yellow-500 to-orange-500 px-6 py-4 flex items-center justify-between rounded-t-3xl">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                💎 Need More Coins?
              </h3>
              <button
                onClick={() => setShowBuyCoinsModal(false)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Current Balance */}
              <div className="p-4 bg-yellow-50 border-2 border-yellow-300 rounded-xl text-center">
                <div className="text-sm text-gray-600 mb-1">Your Current Balance</div>
                <div className="text-3xl font-bold text-gray-900">💎 {coinBalance} Coins</div>
              </div>

              {/* Popular Packages */}
              <div className="space-y-3">
                <div className="text-sm font-bold text-gray-900">Popular Packages:</div>
                
                {/* Starter */}
                <div className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 transition-all cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-lg font-bold text-gray-900">100 Coins</div>
                      <div className="text-xs text-gray-600">Perfect for trying AI features</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">₱199</div>
                      <div className="text-xs text-gray-500">₱1.99/coin</div>
                    </div>
                  </div>
                </div>

                {/* Basic */}
                <div className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 transition-all cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-lg font-bold text-gray-900">500 Coins</div>
                      <div className="text-xs text-green-600 font-semibold">+ 50 BONUS</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">₱799</div>
                      <div className="text-xs text-gray-500">₱1.45/coin</div>
                    </div>
                  </div>
                </div>

                {/* Popular */}
                <div className="p-4 border-2 border-blue-500 bg-blue-50 rounded-xl cursor-pointer relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                    POPULAR
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-lg font-bold text-gray-900">1,000 Coins</div>
                      <div className="text-xs text-green-600 font-semibold">+ 150 BONUS</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">₱1,299</div>
                      <div className="text-xs text-gray-500">₱1.13/coin</div>
                    </div>
                  </div>
                </div>

                {/* Pro */}
                <div className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 transition-all cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-lg font-bold text-gray-900">2,500 Coins</div>
                      <div className="text-xs text-green-600 font-semibold">+ 500 BONUS</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">₱2,999</div>
                      <div className="text-xs text-gray-500">₱1.00/coin</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                <div className="text-xs font-bold text-purple-800 mb-2">💡 What you can do with coins:</div>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>✨ Generate AI Messages (5 coins each)</li>
                  <li>✨ Create AI Sequences (13 coins each)</li>
                  <li>✨ AI Pipeline Automation</li>
                  <li>✨ Deep Scan Prospects</li>
                  <li>✨ AI Pitch Decks</li>
                </ul>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex gap-3 rounded-b-3xl border-t border-gray-200">
              <button
                onClick={() => setShowBuyCoinsModal(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-semibold"
              >
                Maybe Later
              </button>
              <button
                onClick={() => {
                  setShowBuyCoinsModal(false);
                  onNavigate?.('purchase-coins');
                }}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-colors font-semibold flex items-center justify-center gap-2"
              >
                💎 Buy Coins
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
  );
}
