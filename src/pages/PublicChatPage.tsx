import { useState, useEffect, useRef } from 'react';
import { Send, User, MessageCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Message {
  id: string;
  sender: 'visitor' | 'ai';
  message: string;
  created_at: string;
}

interface PublicChatPageProps {
  slug?: string;
  onNavigate?: (page: string) => void;
}

export default function PublicChatPage({ slug, onNavigate }: PublicChatPageProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [chatbotSettings, setChatbotSettings] = useState<any>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (slug) {
      initializeChat();
    } else {
      setError('No chat slug provided');
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeChat = async () => {
    console.log('[PublicChat] Initializing chat with slug:', slug);
    try {
      setIsLoading(true);
      setError(null);

      // Get user ID from chatbot ID (fixed ID or custom slug)
      console.log('[PublicChat] Looking up user from chatbot ID:', slug);
      console.log('[PublicChat] Supabase client:', supabase);

      const { data: chatUserId, error: slugError } = await supabase
        .rpc('get_user_from_chatbot_id', { p_chatbot_id: slug });

      console.log('[PublicChat] RPC call completed');
      console.log('[PublicChat] Data:', chatUserId);
      console.log('[PublicChat] Error:', slugError);

      if (slugError) {
        console.error('[PublicChat] Chatbot ID lookup error details:', {
          message: slugError.message,
          details: slugError.details,
          hint: slugError.hint,
          code: slugError.code
        });
        setError(`Chat not found. Please check your link. (Error: ${slugError.message})`);
        setIsLoading(false);
        return;
      }

      if (!chatUserId) {
        console.error('[PublicChat] No user ID returned for slug:', slug);
        setError('Chat not found. Please check your link.');
        setIsLoading(false);
        return;
      }

      setUserId(chatUserId);

      // Load chatbot settings for this user
      const { data: settings } = await supabase
        .from('chatbot_settings')
        .select('*')
        .eq('user_id', chatUserId)
        .eq('is_active', true)
        .maybeSingle();

      if (!settings) {
        setError('Chatbot not configured. Please contact support.');
        setIsLoading(false);
        return;
      }

      setChatbotSettings(settings);

      // Generate unique visitor session ID (persistent for this visitor)
      const visitorSessionId = localStorage.getItem(`visitor_session_${slug}`) ||
        `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      localStorage.setItem(`visitor_session_${slug}`, visitorSessionId);

      // Check if this visitor has an active session
      console.log('[PublicChat] Checking for existing visitor session:', visitorSessionId);
      const { data: existingSession } = await supabase
        .from('public_chat_sessions')
        .select('*')
        .eq('chatbot_id', slug)
        .eq('visitor_session_id', visitorSessionId)
        .eq('status', 'active')
        .maybeSingle();

      if (existingSession) {
        console.log('[PublicChat] Found existing session:', existingSession.id);
        setSessionId(existingSession.id);
        await loadMessages(existingSession.id);
        setIsLoading(false);
        return;
      }

      // Create new session for this visitor
      console.log('[PublicChat] Creating new visitor session');
      const { data: newSession, error: sessionError } = await supabase
        .from('public_chat_sessions')
        .insert({
          user_id: chatUserId,
          chatbot_id: slug,
          visitor_session_id: visitorSessionId,
          session_slug: `${slug}_${visitorSessionId}`,
          channel: 'web',
          status: 'active',
          buying_intent_score: 0,
          qualification_score: 0,
          message_count: 0
        })
        .select()
        .single();

      if (sessionError) {
        console.error('[PublicChat] Session creation error:', sessionError);
        setError('Failed to start chat session.');
        setIsLoading(false);
        return;
      }

      console.log('[PublicChat] New session created:', newSession.id);
      setSessionId(newSession.id);

      // Send greeting message
      await sendGreeting(newSession.id, settings);

      setIsLoading(false);
    } catch (error) {
      console.error('Error initializing chat:', error);
      setError('Failed to initialize chat. Please try again.');
      setIsLoading(false);
    }
  };

  const sendGreeting = async (sessionId: string, settings: any) => {
    const greeting = settings.greeting_message || 'Hi! How can I help you today?';

    const { error } = await supabase.from('public_chat_messages').insert({
      session_id: sessionId,
      sender: 'ai',
      message: greeting,
      ai_emotion: 'welcoming',
      ai_intent: 'greeting'
    });

    if (!error) {
      await loadMessages(sessionId);
    }
  };

  const loadMessages = async (sessionId: string) => {
    const { data } = await supabase
      .from('public_chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !sessionId || !userId || isSending) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsSending(true);

    try {
      console.log('[PublicChat] ===== SENDING MESSAGE =====');
      console.log('[PublicChat] User Message:', userMessage);
      console.log('[PublicChat] Session ID:', sessionId);
      console.log('[PublicChat] User ID:', userId);
      console.log('[PublicChat] Calling Edge Function directly...');

      // Call Edge Function ONLY - it handles ALL message saving
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-chatbot-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            sessionId,
            message: userMessage,
            userId,
          }),
        }
      );

      // Turn off send button animation immediately after request sent
      setIsSending(false);

      // Show AI typing indicator only after send button completes
      setIsTyping(true);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('[PublicChat] Edge Function error:', response.status, errorData);
        setIsTyping(false);
        throw new Error(`Server error: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('[PublicChat] Edge Function response:', result);

      // Reload all messages from database (Edge Function already saved them)
      console.log('[PublicChat] Edge Function complete, reloading messages...');
      await loadMessages(sessionId);
      setIsTyping(false);
      console.log('[PublicChat] ===== MESSAGE SENT COMPLETE =====');

    } catch (error) {
      console.error('[PublicChat] Critical error in handleSendMessage:', error);
      setIsTyping(false);
      setIsSending(false);
      alert('Failed to send message. Please try again.');
    }
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Chat</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center flex-shrink-0">
              {chatbotSettings?.avatar_url ? (
                <img src={chatbotSettings.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <MessageCircle className="w-6 h-6 text-white" />
              )}
            </div>
            <div className="flex-1">
              <h1 className="font-semibold text-gray-900">
                {chatbotSettings?.display_name || 'AI Assistant'}
              </h1>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Online · Powered by NexScout
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-4xl w-full mx-auto">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'visitor' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-2 max-w-[80%] ${msg.sender === 'visitor' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.sender === 'ai'
                  ? 'bg-gradient-to-br from-blue-500 to-cyan-600'
                  : 'bg-gray-300'
              }`}>
                {msg.sender === 'ai' ? (
                  <MessageCircle className="w-4 h-4 text-white" />
                ) : (
                  <User className="w-4 h-4 text-gray-600" />
                )}
              </div>
              <div>
                <div className={`rounded-2xl px-4 py-3 ${
                  msg.sender === 'visitor'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-900 shadow-sm'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                </div>
                <p className={`text-xs text-gray-400 mt-1 ${msg.sender === 'visitor' ? 'text-right' : 'text-left'}`}>
                  {new Date(msg.created_at).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex gap-2 max-w-[80%]">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isSending}
              className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            >
              {isSending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-center text-xs text-gray-400 mt-3">
            Powered by <span className="font-semibold text-blue-600">NexScout AI</span>
          </p>
        </div>
      </div>
    </div>
  );
}
