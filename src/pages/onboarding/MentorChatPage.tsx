import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Heart, Sparkles, CheckCircle2, HelpCircle, ExternalLink } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { mentorOnboardingMessages, getMentorMessage } from '../../services/onboarding/mentorOnboardingMessages';

interface MentorChatPageProps {
  onBack: () => void;
  onNavigate?: (page: string) => void;
}

interface Message {
  id: string;
  role: 'user' | 'mentor' | 'system';
  content: string;
  message_type?: 'text' | 'task' | 'celebration' | 'system';
  metadata?: any;
  timestamp: Date;
}

interface TaskAction {
  label: string;
  route?: string;
  action?: () => void;
}

export default function MentorChatPage({ onBack, onNavigate }: MentorChatPageProps) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [persona, setPersona] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      initializeMentorChat();
    }
  }, [user]);

  const initializeMentorChat = async () => {
    if (!user) return;

    try {
      // Load persona
      const { data: personaData } = await supabase
        .from('user_persona_profiles')
        .select('primary_persona_code')
        .eq('user_id', user.id)
        .maybeSingle();

      const detectedPersona = personaData?.primary_persona_code || 'mlm';
      setPersona(detectedPersona);

      // Load existing conversations
      const { data: existingMessages } = await supabase
        .from('mentor_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(50);

      if (existingMessages && existingMessages.length > 0) {
        setMessages(existingMessages.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.message,
          message_type: msg.message_type,
          metadata: msg.metadata,
          timestamp: new Date(msg.created_at)
        })));
      } else {
        // Create welcome message
        await sendWelcomeMessage(detectedPersona);
      }

      // Initialize or update journey state
      await initializeJourneyState();

    } catch (error) {
      console.error('Error initializing mentor chat:', error);
    }
  };

  const sendWelcomeMessage = async (personaCode: string) => {
    if (!user || !profile) return;

    const personaLabels: Record<string, string> = {
      mlm: 'Network Marketing',
      insurance: 'Insurance',
      real_estate: 'Real Estate',
      online_seller: 'Online Selling',
      coach: 'Coaching'
    };

    const welcomeContent = `Kumusta, ${profile.first_name || profile.full_name}! 👋

I'm your AI Coach here at NexScout. Nakita ko you're in ${personaLabels[personaCode] || 'Sales'} — exciting!

I'll guide you step-by-step to set up your AI sales system. It'll only take about 10 minutes, and you'll get your first prospect insights right away. 🚀

Ready to start? Let me know what you'd like to do first:
1️⃣ Set up my business info
2️⃣ Add my products/services
3️⃣ Scan my first prospects
4️⃣ Show me around

What sounds good?`;

    const welcomeMessage: Message = {
      id: Date.now().toString(),
      role: 'mentor',
      content: welcomeContent,
      message_type: 'text',
      timestamp: new Date()
    };

    setMessages([welcomeMessage]);

    // Save to database
    await supabase.from('mentor_conversations').insert({
      user_id: user.id,
      role: 'mentor',
      message: welcomeContent,
      message_type: 'text',
      metadata: { is_welcome: true }
    });
  };

  const initializeJourneyState = async () => {
    if (!user) return;

    const { data: existing } = await supabase
      .from('mentor_journey_state')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!existing) {
      await supabase.from('mentor_journey_state').insert({
        user_id: user.id,
        current_state: 'WELCOME',
        persona: persona,
        session_count: 1,
        total_messages: 1
      });
    } else {
      await supabase
        .from('mentor_journey_state')
        .update({
          session_count: supabase.rpc('increment', { x: 1 }),
          last_interaction_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading || !user) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      message_type: 'text',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setLoading(true);

    // Save user message to DB
    await supabase.from('mentor_conversations').insert({
      user_id: user.id,
      role: 'user',
      message: currentInput,
      message_type: 'text'
    });

    // Update journey state
    await supabase
      .from('mentor_journey_state')
      .update({
        total_messages: supabase.rpc('increment', { x: 1 }),
        last_interaction_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    try {
      // Generate mentor response
      const mentorResponse = await generateMentorResponse(currentInput);

      const mentorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'mentor',
        content: mentorResponse.content,
        message_type: mentorResponse.message_type || 'text',
        metadata: mentorResponse.metadata,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, mentorMessage]);

      // Save mentor response to DB
      await supabase.from('mentor_conversations').insert({
        user_id: user.id,
        role: 'mentor',
        message: mentorResponse.content,
        message_type: mentorResponse.message_type || 'text',
        metadata: mentorResponse.metadata
      });

      // Create task if applicable
      if (mentorResponse.task) {
        await createTask(mentorResponse.task);
      }

    } catch (error) {
      console.error('Error generating mentor response:', error);
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'mentor',
        content: "Oops, nagloko saglit ang system ko. Can you repeat that? 😅",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setLoading(false);
    }
  };

  const generateMentorResponse = async (userInput: string): Promise<any> => {
    const lowerInput = userInput.toLowerCase();

    // Check what user needs
    if (lowerInput.match(/1|business|company|info|setup/)) {
      return {
        content: "Perfect! Let's set up your business info. This helps the AI understand your products and create better pitches.\n\nClick the button below to start:",
        message_type: 'task',
        metadata: {
          task_id: 'setup_company',
          task_label: 'Set up my business',
          task_route: '/about-my-company'
        },
        task: {
          task_id: 'setup_company',
          task_title: 'Set up business information',
          task_description: 'Add your company name, description, and key details',
          task_category: 'setup',
          estimated_minutes: 3
        }
      };
    }

    if (lowerInput.match(/2|product|service|sell|offer/)) {
      return {
        content: "Great choice! Adding your products helps the AI create personalized scripts and recommendations.\n\nLet's add your first product:",
        message_type: 'task',
        metadata: {
          task_id: 'add_product',
          task_label: 'Add my first product',
          task_route: '/products/add'
        },
        task: {
          task_id: 'add_product',
          task_title: 'Add first product/service',
          task_description: 'Add at least one product or service you offer',
          task_category: 'setup',
          estimated_minutes: 5,
          required_for_aha: true
        }
      };
    }

    if (lowerInput.match(/3|scan|prospect|find|lead/)) {
      return {
        content: "Exciting! Let's find your warm prospects. You can scan from:\n• Facebook friends\n• CSV file\n• LinkedIn connections\n• Manual entry\n\nReady to scan?",
        message_type: 'task',
        metadata: {
          task_id: 'first_scan',
          task_label: 'Scan my prospects',
          task_route: '/scan-entry'
        },
        task: {
          task_id: 'first_scan',
          task_title: 'Scan first prospects',
          task_description: 'Import or scan your first batch of prospects',
          task_category: 'core',
          estimated_minutes: 5,
          required_for_aha: true
        }
      };
    }

    if (lowerInput.match(/4|tour|show|guide|help|how/)) {
      return {
        content: "I'll give you a quick tour! 🗺️\n\nNexScout has 5 main tools:\n\n1️⃣ **Prospect Scanner** - Find warm leads from your network\n2️⃣ **DeepScan AI** - Get personality insights and pain points\n3️⃣ **AI Chatbot** - 24/7 sales assistant for your prospects\n4️⃣ **Pitch Deck Generator** - Create custom presentations\n5️⃣ **Message Sequencer** - Auto follow-ups\n\nWhat would you like to try first?",
        message_type: 'text'
      };
    }

    if (lowerInput.match(/confused|lost|don't understand|hindi ko alam/)) {
      return {
        content: "No worries! Let me simplify. 😊\n\nTo get your first win with NexScout:\n\n✅ Step 1: Add your business info (2 min)\n✅ Step 2: Add 1 product (3 min)\n✅ Step 3: Scan 3-5 prospects (5 min)\n\nThen you'll see AI insights about who's most likely to buy!\n\nWant to start with Step 1?",
        message_type: 'text'
      };
    }

    // Generic helpful response
    return {
      content: `I'm here to help! 💪\n\nI can guide you with:\n• Setting up your business\n• Adding products/services\n• Scanning prospects\n• Using AI tools\n• Understanding insights\n\nWhat specifically do you need help with?`,
      message_type: 'text'
    };
  };

  const createTask = async (taskData: any) => {
    if (!user) return;

    await supabase.from('mentor_tasks').insert({
      user_id: user.id,
      task_id: taskData.task_id,
      task_title: taskData.task_title,
      task_description: taskData.task_description,
      task_category: taskData.task_category,
      estimated_minutes: taskData.estimated_minutes,
      required_for_aha: taskData.required_for_aha || false,
      status: 'pending'
    });
  };

  const handleTaskAction = (route: string) => {
    if (onNavigate) {
      onNavigate(route);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickReplies = [
    { label: 'I need help', icon: HelpCircle },
    { label: 'Show me around', icon: Sparkles },
    { label: "I'm ready!", icon: CheckCircle2 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center animate-pulse">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Your AI Coach</h1>
                <p className="text-xs text-gray-500">Onboarding Guide</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-xs text-gray-500">Persona</p>
              <p className="text-sm font-semibold text-gray-900 capitalize">{persona.replace('_', ' ')}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'mentor' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                <Heart className="w-5 h-5 text-white" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-900 shadow-sm'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>

              {/* Task Action Button */}
              {message.message_type === 'task' && message.metadata && (
                <button
                  onClick={() => handleTaskAction(message.metadata.task_route)}
                  className="mt-3 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white px-4 py-2.5 rounded-lg font-medium hover:from-orange-600 hover:to-pink-600 transition-all"
                >
                  <span>{message.metadata.task_label}</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
              )}

              <p
                className={`text-xs mt-2 ${
                  message.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                }`}
              >
                {message.timestamp.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit'
                })}
              </p>
            </div>
            {message.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-bold">
                  {profile?.first_name?.charAt(0) || 'U'}
                </span>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center flex-shrink-0">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Replies */}
      {messages.length <= 2 && (
        <div className="px-6 pb-4">
          <div className="grid grid-cols-3 gap-2">
            {quickReplies.map((reply, idx) => (
              <button
                key={idx}
                onClick={() => setInput(reply.label)}
                className="flex flex-col items-center gap-2 p-3 bg-white border border-gray-200 rounded-xl hover:bg-orange-50 hover:border-orange-300 transition-colors"
              >
                <reply.icon className="w-5 h-5 text-orange-600" />
                <span className="text-xs font-medium text-gray-700 text-center">
                  {reply.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-6 py-4 shadow-lg">
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
              rows={1}
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="flex items-center justify-center w-11 h-11 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl hover:from-orange-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          💡 Your coach is here to guide you every step
        </p>
      </div>
    </div>
  );
}
