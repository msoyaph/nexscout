import { useState, useEffect, useRef } from 'react';
import { Send, User, MessageCircle, Loader2, Share2, Copy, CheckCircle, X, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getSupabaseFunctionUrl } from '../lib/supabaseUrl';

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
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [monthlyChatCount, setMonthlyChatCount] = useState(0);
  const [chatLimit, setChatLimit] = useState(30);
  const [isProUser, setIsProUser] = useState(false);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [showPayAsYouGoModal, setShowPayAsYouGoModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<any>(null);

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

  // Real-time: Listen for new messages and reload
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`chat-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'public_chat_messages',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          console.log('[PublicChat] New message detected via realtime:', payload.new);
          // Add new message to state instantly for immediate display
          setMessages(prev => [...prev, payload.new]);
          // Also reload to ensure consistency and get any missed messages
          loadMessages(sessionId);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [sessionId]);

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

      let chatUserId: string | null = null;

      // Try RPC function first
      const { data: rpcUserId, error: slugError } = await supabase
        .rpc('get_user_from_chatbot_id', { p_chatbot_id: slug });

      console.log('[PublicChat] RPC call completed');
      console.log('[PublicChat] RPC Data:', rpcUserId);
      console.log('[PublicChat] RPC Error:', slugError);

      if (rpcUserId) {
        chatUserId = rpcUserId;
        console.log('[PublicChat] ✅ Found user via RPC:', chatUserId);
      } else {
        // Fallback: Direct query to chatbot_links table
        console.log('[PublicChat] ⚠️ RPC returned null, trying direct query to chatbot_links...');
        
        const { data: chatbotLink, error: linkError } = await supabase
          .from('chatbot_links')
          .select('user_id')
          .or(`chatbot_id.eq.${slug},custom_slug.eq.${slug}`)
          .eq('is_active', true)
          .maybeSingle();

        console.log('[PublicChat] chatbot_links query result:', chatbotLink);
        console.log('[PublicChat] chatbot_links query error:', linkError);

        if (chatbotLink && !linkError) {
          chatUserId = chatbotLink.user_id;
          console.log('[PublicChat] ✅ Found user via chatbot_links:', chatUserId);
        } else {
          // Second fallback: Check profiles.unique_user_id
          console.log('[PublicChat] ⚠️ chatbot_links query failed, trying profiles.unique_user_id...');
          
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('unique_user_id', slug)
            .maybeSingle();

          console.log('[PublicChat] profiles query result:', profile);
          console.log('[PublicChat] profiles query error:', profileError);

          if (profile && !profileError) {
            chatUserId = profile.id;
            console.log('[PublicChat] ✅ Found user via profiles.unique_user_id:', chatUserId);
            
            // Auto-create chatbot_link if it doesn't exist
            const { error: createLinkError } = await supabase
              .from('chatbot_links')
              .insert({
                user_id: chatUserId,
                chatbot_id: slug,
                is_active: true
              });
            
            if (createLinkError && createLinkError.code !== '23505') { // Ignore duplicate key errors
              console.warn('[PublicChat] ⚠️ Failed to auto-create chatbot_link:', createLinkError);
            } else {
              console.log('[PublicChat] ✅ Auto-created chatbot_link for slug:', slug);
            }
          } else {
            console.error('[PublicChat] ❌ All lookup methods failed for slug:', slug);
            console.error('[PublicChat] RPC Error:', slugError);
            console.error('[PublicChat] Link Error:', linkError);
            console.error('[PublicChat] Profile Error:', profileError);
            
            // Provide helpful error messages
            let errorMessage = 'Chat not found. Please check your link.';
            if (slugError) {
              if (slugError.code === 'P0001' || slugError.message?.includes('not found')) {
                errorMessage = 'Chat not found. The link may be incorrect or the chatbot may have been removed.';
              } else if (slugError.code === '42883' || slugError.message?.includes('function')) {
                errorMessage = 'Chat service temporarily unavailable. Please try again later.';
              } else if (slugError.message) {
                errorMessage = `Unable to load chat: ${slugError.message}`;
              }
            }
            
            setError(errorMessage);
            setIsLoading(false);
            return;
          }
        }
      }

      if (!chatUserId) {
        console.error('[PublicChat] No user ID found for slug:', slug);
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
      console.log('[PublicChat] Visitor Session ID:', visitorSessionId);

      // Also check for saved session ID directly
      const savedSessionId = localStorage.getItem(`chat_session_${slug}`);
      console.log('[PublicChat] Saved Session ID from localStorage:', savedSessionId);

      // Try to load existing session by ID first (most reliable)
      if (savedSessionId) {
        console.log('[PublicChat] Attempting to load saved session:', savedSessionId);
        const { data: savedSession, error: loadError } = await supabase
          .from('public_chat_sessions')
          .select('*')
          .eq('id', savedSessionId)
          .eq('chatbot_id', slug)
          .in('status', ['active', 'human_takeover']) // Include human_takeover status
          .maybeSingle();

        if (savedSession && !loadError) {
          console.log('[PublicChat] Successfully restored session from localStorage:', savedSession.id);
          setSessionId(savedSession.id);
          await loadMessages(savedSession.id);
          setIsLoading(false);
          return;
        } else {
          console.log('[PublicChat] Saved session not found or error, will check for active session');
          // Clear invalid session ID from localStorage
          localStorage.removeItem(`chat_session_${slug}`);
        }
      }

      // Check if this visitor has an active session by visitor_session_id
      console.log('[PublicChat] Checking for existing visitor session:', visitorSessionId);
      const { data: existingSessions } = await supabase
        .from('public_chat_sessions')
        .select('*')
        .eq('chatbot_id', slug)
        .eq('visitor_session_id', visitorSessionId)
        .in('status', ['active', 'human_takeover'])
        .order('message_count', { ascending: false })
        .order('last_message_at', { ascending: false });

      if (existingSessions && existingSessions.length > 0) {
        // Use the session with the most messages (most activity)
        const existingSession = existingSessions[0];
        console.log('[PublicChat] Found', existingSessions.length, 'existing sessions, using most active one:', existingSession.id);
        
        // Archive any duplicate sessions (keep only the most active one)
        if (existingSessions.length > 1) {
          console.log('[PublicChat] Archiving', existingSessions.length - 1, 'duplicate sessions...');
          const duplicateIds = existingSessions.slice(1).map(s => s.id);
          await supabase
            .from('public_chat_sessions')
            .update({ status: 'archived' })
            .in('id', duplicateIds);
          console.log('[PublicChat] ✅ Archived duplicate sessions:', duplicateIds);
        }
        
        setSessionId(existingSession.id);
        // Save session ID to localStorage for faster restore next time
        localStorage.setItem(`chat_session_${slug}`, existingSession.id);
        await loadMessages(existingSession.id);
        setIsLoading(false);
        return;
      }

      // Check monthly chat limit before creating new session
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('subscription_tier, email')
        .eq('id', chatUserId)
        .maybeSingle();

      if (profileError) {
        console.error('[PublicChat] Error loading profile:', profileError);
      }

      // Check Pro tier - case insensitive and handle null/undefined
      const subscriptionTier = profile?.subscription_tier?.toLowerCase()?.trim() || 'free';
      const isProUser = subscriptionTier === 'pro';

      console.log('[PublicChat] User tier check:', {
        chatUserId,
        subscriptionTier,
        rawTier: profile?.subscription_tier,
        isProUser,
        profileEmail: profile?.email
      });
      const chatLimit = isProUser ? 300 : 30;

      // Count monthly chats
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const { count: monthlyChatCount } = await supabase
        .from('public_chat_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', chatUserId)
        .gte('created_at', startOfMonth.toISOString())
        .neq('status', 'archived');

      const currentCount = monthlyChatCount || 0;
      setMonthlyChatCount(currentCount);
      
      // Set user tier and limit state
      setIsProUser(isProUser);
      setChatLimit(chatLimit);
      
      // Check if limit is reached - BLOCK non-Pro users, allow Pro users to continue
      if (currentCount >= chatLimit && !isProUser) {
        console.log('[PublicChat] ❌ Monthly chat limit reached for free user:', currentCount, '/', chatLimit);
        setIsLimitReached(true);
        setError(`You have reached your monthly chat limit (${chatLimit}). Upgrade to Pro for 300 chats/month.`);
        setIsLoading(false);
        return;
      } else if (currentCount >= chatLimit && isProUser) {
        // Pro users can continue even if they hit 300 (they can purchase more)
        console.log('[PublicChat] ✅ Pro user at limit:', currentCount, '/', chatLimit, '- allowing continuation');
        setIsLimitReached(true);
      } else {
        setIsLimitReached(false);
      }

      // Create new session for this visitor
      console.log('[PublicChat] Creating new visitor session');
      
      // Generate unique session_slug with timestamp to avoid collisions
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substr(2, 6);
      const sessionSlug = `${slug}_${visitorSessionId}_${timestamp}_${randomSuffix}`;
      
      const { data: newSession, error: sessionError } = await supabase
        .from('public_chat_sessions')
        .insert({
          user_id: chatUserId,
          chatbot_id: slug,
          visitor_session_id: visitorSessionId,
          session_slug: sessionSlug,
          channel: 'web',
          status: 'active',
          buying_intent_score: 0,
          qualification_score: 0,
          message_count: 0
        })
        .select()
        .maybeSingle();

      if (sessionError) {
        console.error('[PublicChat] Session creation error:', sessionError);
        
        // Handle duplicate key error - try to find existing session
        if (sessionError.code === '23505' && sessionError.message?.includes('session_slug')) {
          console.log('[PublicChat] Duplicate session_slug detected, searching for existing session...');
          
          // Try to find existing session by visitor_session_id
          const { data: existingSession } = await supabase
            .from('public_chat_sessions')
            .select('*')
            .eq('chatbot_id', slug)
            .eq('visitor_session_id', visitorSessionId)
            .in('status', ['active', 'human_takeover'])
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (existingSession) {
            console.log('[PublicChat] Found existing session, using it:', existingSession.id);
            setSessionId(existingSession.id);
            localStorage.setItem(`chat_session_${slug}`, existingSession.id);
            await loadMessages(existingSession.id);
            setIsLoading(false);
            return;
          }
          
          // If no existing session found, try one more time with a more unique slug
          console.log('[PublicChat] Retrying with more unique session_slug...');
          const retrySessionSlug = `${slug}_${visitorSessionId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const { data: retrySession, error: retryError } = await supabase
            .from('public_chat_sessions')
            .insert({
              user_id: chatUserId,
              chatbot_id: slug,
              visitor_session_id: visitorSessionId,
              session_slug: retrySessionSlug,
              channel: 'web',
              status: 'active',
              buying_intent_score: 0,
              qualification_score: 0,
              message_count: 0
            })
            .select()
            .maybeSingle();
          
          if (retryError) {
            console.error('[PublicChat] Retry session creation also failed:', retryError);
            setError('Failed to start chat session. Please try again.');
            setIsLoading(false);
            return;
          }
          
          console.log('[PublicChat] Successfully created session on retry:', retrySession.id);
          setSessionId(retrySession.id);
          localStorage.setItem(`chat_session_${slug}`, retrySession.id);
          await sendGreeting(retrySession.id, settings);
          setIsLoading(false);
          return;
        }
        
        setError('Failed to start chat session. Please try again.');
        setIsLoading(false);
        return;
      }

      console.log('[PublicChat] New session created:', newSession.id);
      setSessionId(newSession.id);
      
      // Save new session ID to localStorage for persistence
      localStorage.setItem(`chat_session_${slug}`, newSession.id);
      console.log('[PublicChat] Session ID saved to localStorage');

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

    // ========================================
    // MESSENGER-STYLE: Add user message INSTANTLY (optimistic UI)
    // ========================================
    const tempUserMessage: Message = {
      id: `temp_user_${Date.now()}`,
      sender: 'visitor',
      message: userMessage,
      created_at: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, tempUserMessage]);
    
    // Show AI typing indicator immediately (feels instant like Messenger)
    setIsTyping(true);

    try {
      console.log('[PublicChat] ===== SENDING MESSAGE =====');
      console.log('[PublicChat] User Message:', userMessage);

      // ========================================
      // MESSENGER-STYLE: Minimum typing delay for natural feel
      // ========================================
      const startTime = Date.now();
      
      // Call Edge Function to get AI response
      // Use getSupabaseFunctionUrl to ensure proper URL formatting (HTTPS, no double slashes)
      let functionUrl = getSupabaseFunctionUrl('functions/v1/public-chatbot-chat');
      console.log('[PublicChat] Calling edge function:', functionUrl);
      
      // Final validation and fix if needed (defensive programming)
      if (!functionUrl.startsWith('https://')) {
        console.error('[PublicChat] ❌ ERROR: URL is not HTTPS! Fixing...', functionUrl);
        // Force HTTPS
        functionUrl = functionUrl.replace(/^http:\/\//, 'https://');
        if (!functionUrl.startsWith('https://')) {
          functionUrl = `https://${functionUrl}`;
        }
        console.log('[PublicChat] Fixed URL:', functionUrl);
      }
      
      // Fix any double slashes (except after https://)
      if (functionUrl.match(/[^:]\/\//)) {
        console.warn('[PublicChat] ⚠️ URL contains double slashes! Fixing...', functionUrl);
        functionUrl = functionUrl.replace(/([^:]\/)\/+/g, '$1');
        console.log('[PublicChat] Fixed URL:', functionUrl);
      }
      
      const responsePromise = fetch(
        functionUrl,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            sessionId,
            message: userMessage,
            userId,
          }),
        }
      );

      // Minimum typing time for natural feel (1.5-2 seconds)
      const minTypingTime = 1500 + Math.random() * 500;
      
      // Wait for both API response AND minimum typing time
      const [response] = await Promise.all([
        responsePromise,
        new Promise(resolve => setTimeout(resolve, minTypingTime))
      ]);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('[PublicChat] Edge Function error:', response.status, errorData);
        throw new Error(`Server error: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('[PublicChat] AI response received');

      // Remove typing indicator
      setIsTyping(false);

      // Reload messages from database (includes AI response)
      await loadMessages(sessionId);
      
      console.log('[PublicChat] ===== MESSAGE SENT COMPLETE =====');

    } catch (error) {
      console.error('[PublicChat] Error:', error);
      setIsTyping(false);
      // Remove temp message on error
      setMessages(prev => prev.filter(m => m.id !== tempUserMessage.id));
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

  const handleRetry = async () => {
    setError(null);
    setIsLoading(true);
    // Clear any cached session data that might be causing issues
    if (slug) {
      localStorage.removeItem(`chat_session_${slug}`);
      localStorage.removeItem(`visitor_session_${slug}`);
    }
    await initializeChat();
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Chat</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleRetry}
              disabled={isLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Retrying...
                </>
              ) : (
                'Retry'
              )}
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
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
            <button
              onClick={() => setShowShareModal(true)}
              className="p-2.5 hover:bg-blue-50 rounded-full transition-all flex-shrink-0 border border-gray-300 hover:border-blue-400 active:scale-95 bg-white shadow-sm"
              title="Share chat"
              aria-label="Share chat"
            >
              <Share2 className="w-5 h-5 text-gray-700 hover:text-blue-600" strokeWidth={2} />
            </button>
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
              onChange={(e) => {
                setInputMessage(e.target.value);
                
                // Broadcast typing indicator to admin (like Messenger)
                if (sessionId && channelRef.current) {
                  // Clear previous timeout
                  if (typingTimeoutRef.current) {
                    clearTimeout(typingTimeoutRef.current);
                  }
                  
                  // Broadcast typing event
                  channelRef.current.send({
                    type: 'broadcast',
                    event: 'visitor_typing',
                    payload: { sessionId, isTyping: true }
                  });
                  
                  // Stop broadcasting after 1 second of inactivity
                  typingTimeoutRef.current = setTimeout(() => {
                    if (channelRef.current) {
                      channelRef.current.send({
                        type: 'broadcast',
                        event: 'visitor_typing',
                        payload: { sessionId, isTyping: false }
                      });
                    }
                  }, 1000);
                }
              }}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping}
              className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95 flex-shrink-0"
              title="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <div className="text-center mt-3 space-y-1">
            <p className="text-xs text-gray-600 font-medium">
              Want AI like this for your business? 🚀
            </p>
            <p className="text-xs text-gray-500">
              Powered by{' '}
              <a 
                href={import.meta.env.VITE_APP_URL || 'https://nexscout.co'} 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                NexScout AI
              </a>
              {' '}· Turn visitors into customers 24/7
            </p>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" 
            onClick={() => setShowShareModal(false)} 
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Share Chat</h2>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Share2 className="w-5 h-5 text-blue-500" />
                  <span className="font-medium text-gray-900">Public Link</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Share this link to let others chat with this AI assistant
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={window.location.href}
                    readOnly
                    className="flex-1 px-3 py-2 bg-white rounded-lg border border-gray-300 text-sm"
                  />
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(window.location.href);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      } catch (err) {
                        console.error('Failed to copy:', err);
                        // Fallback for older browsers
                        const input = document.createElement('input');
                        input.value = window.location.href;
                        document.body.appendChild(input);
                        input.select();
                        document.execCommand('copy');
                        document.body.removeChild(input);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: `${chatbotSettings?.display_name || 'AI Assistant'} - Chat`,
                        text: `Chat with ${chatbotSettings?.display_name || 'AI Assistant'}`,
                        url: window.location.href,
                      }).catch(() => {});
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Share via...
                </button>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

