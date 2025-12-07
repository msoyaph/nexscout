/**
 * NEW Signup Page - Clean Implementation
 * 
 * Handles user creation manually to bypass broken triggers
 * Redirects to QuickOnboardingFlow after successful signup
 */

import { useState, useEffect, useRef } from 'react';
import { UserPlus, Eye, EyeOff, Sparkles, Loader2, CheckCircle, Zap, Bot, MessageSquare, ChevronLeft, ChevronRight, MessageCircle, X, Send, Minimize2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getSupabaseFunctionUrl } from '../lib/supabaseUrl';

interface NewSignupPageProps {
  onNavigateToLogin: () => void;
  onSignupSuccess: () => void;
}

export default function NewSignupPage({ onNavigateToLogin, onSignupSuccess }: NewSignupPageProps) {
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Progressive reveal states
  const [showCompany, setShowCompany] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [showConfirmPasswordField, setShowConfirmPasswordField] = useState(false);
  
  // Feature slideshow state
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Floating chatbox state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMinimized, setChatMinimized] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [signupChatUserId, setSignupChatUserId] = useState<string | null>(null);
  const [chatbotSettings, setChatbotSettings] = useState<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInitializedRef = useRef(false);
  
  // Get signup chat user ID on mount (meyouvideos@gmail.com)
  // Use a fixed chatbot_id for signup page chat
  // Wrapped in try-catch to prevent component crash
  useEffect(() => {
    let isMounted = true;
    
    const getSignupChatUserId = async () => {
      try {
        console.log('[SignupChat] Looking up signup chat user ID (meyouvideos@gmail.com)...');
        
        // Strategy 1: Use RPC function to get signup chat user ID (bypasses RLS)
        try {
          const { data: rpcUserId, error: rpcError } = await supabase
            .rpc('get_signup_chat_user_id');
          
          if (rpcUserId && !rpcError && isMounted) {
            setSignupChatUserId(rpcUserId);
            console.log('[SignupChat] ✅ Found signup chat user via RPC function:', rpcUserId);
            return;
          } else if (rpcError) {
            // Check if error is because user doesn't exist
            if (rpcError.message?.includes('not found') || rpcError.message?.includes('Signup chat user not found')) {
              console.warn('[SignupChat] ⚠️ User meyouvideos@gmail.com does not exist in database');
              console.warn('[SignupChat] 📝 Please create the user account first, or use a different email');
              console.warn('[SignupChat] Chat will be disabled until user account is created');
              // Don't return - try other methods
            } else {
              console.warn('[SignupChat] RPC function error:', rpcError.message);
            }
          }
        } catch (rpcError: any) {
          console.warn('[SignupChat] RPC function error, trying fallback methods...', rpcError?.message || rpcError);
        }
        
        // Strategy 2: Try to get via a known chatbot_id
        // First try 'signup-page-chat' which should be set up for the signup chat account
        const knownChatbotId = 'signup-page-chat';
        
        // Try RPC function first (same as PublicChatPage)
        const { data: rpcUserId2, error: rpcError2 } = await supabase
          .rpc('get_user_from_chatbot_id', { p_chatbot_id: knownChatbotId });
        
        if (rpcUserId2 && !rpcError2 && isMounted) {
          setSignupChatUserId(rpcUserId2);
          console.log('[SignupChat] ✅ Found signup chat user via RPC:', rpcUserId2);
          return;
        }
        
        // Strategy 3: Query chatbot_links table directly (publicly accessible)
        const { data: chatbotLink, error: linkError } = await supabase
          .from('chatbot_links')
          .select('user_id')
          .eq('chatbot_id', knownChatbotId)
          .eq('is_active', true)
          .maybeSingle();
        
        if (chatbotLink && !linkError && isMounted) {
          setSignupChatUserId(chatbotLink.user_id);
          console.log('[SignupChat] ✅ Found signup chat user via chatbot_links:', chatbotLink.user_id);
          return;
        }
        
        // Strategy 4: Try common chatbot_id patterns
        const possibleIds = ['meyouvideos', 'signup-chat', 'nexscout-signup'];
        
        for (const testId of possibleIds) {
          if (!isMounted) break;
          
          const { data: testLink } = await supabase
            .from('chatbot_links')
            .select('user_id')
            .or(`chatbot_id.eq.${testId},custom_slug.eq.${testId}`)
            .eq('is_active', true)
            .maybeSingle();
          
          if (testLink && isMounted) {
            setSignupChatUserId(testLink.user_id);
            console.log('[SignupChat] ✅ Found signup chat user via chatbot_id pattern:', testId, testLink.user_id);
            return;
          }
        }
        
        // Strategy 5: Final fallback - show helpful error (non-blocking)
        if (isMounted) {
          console.warn('[SignupChat] ⚠️ Could not find signup chat user ID via any method');
          console.warn('[SignupChat] 📝 SETUP REQUIRED:');
          console.warn('[SignupChat] 1. Create user account with email: meyouvideos@gmail.com');
          console.warn('[SignupChat] 2. Or update RPC function to use a different email');
          console.warn('[SignupChat] 3. See file: FIX_SIGNUP_CHAT_NOW.md for detailed instructions');
          // Chat will be disabled until user account is created
          // Component will still render normally
        }
        
      } catch (error: any) {
        // Prevent error from crashing the component
        console.error('[SignupChat] Error getting signup chat user:', error);
        console.error('[SignupChat] Error details:', {
          message: error?.message || 'Unknown error',
          stack: error?.stack
        });
        // Component will still render - chat just won't work until RPC function is created
      }
    };
    
    // Call async function
    getSignupChatUserId().catch((error) => {
      // Extra safety catch
      console.error('[SignupChat] Unhandled error in getSignupChatUserId:', error);
    });
    
    // Cleanup
    return () => {
      isMounted = false;
    };
  }, []);
  
  // Initialize chat session when chat opens
  useEffect(() => {
    if (chatOpen && signupChatUserId && !chatInitializedRef.current) {
      console.log('[SignupChat] Chat opened, initializing session...');
      initializeChatSession();
    } else if (chatOpen && !signupChatUserId) {
      console.warn('[SignupChat] Chat opened but signup chat user ID not loaded yet');
      // Show helpful message in chat
      setChatMessages([{
        role: 'assistant',
        content: 'Hi! 👋 Chat service is being configured. Please try again in a moment, or feel free to sign up above! 😊'
      }]);
    }
  }, [chatOpen, signupChatUserId]);
  
  // Scroll to bottom of chat when new message arrives
  useEffect(() => {
    if (chatOpen && !chatMinimized) {
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [chatMessages, chatOpen, chatMinimized]);
  
  // Initialize chat session and load chatbot settings
  const initializeChatSession = async () => {
    if (!signupChatUserId || chatInitializedRef.current) return;
    
    try {
      chatInitializedRef.current = true;
      console.log('[SignupChat] Initializing chat session for signup chat user:', signupChatUserId);
      
      // Load chatbot settings
      const { data: settings, error: settingsError } = await supabase
        .from('chatbot_settings')
        .select('*')
        .eq('user_id', signupChatUserId)
        .maybeSingle();
      
      if (settingsError) {
        console.error('[SignupChat] Error loading settings:', settingsError);
      }
      
      setChatbotSettings(settings || {
        display_name: 'NexScout AI Assistant',
        greeting_message: 'Hi! 👋 I\'m your NexScout AI assistant. Ask me anything about our features, pricing, or how we can help grow your business!',
        use_custom_instructions: true,
        instructions_override_intelligence: true,
        custom_system_instructions: '' // Will be loaded from NEXSCOUT_AI_SYSTEM_INSTRUCTIONS.md
      });
      
      // Generate unique visitor session ID
      const visitorSessionId = localStorage.getItem('signup_chat_visitor_id') ||
        `signup_visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('signup_chat_visitor_id', visitorSessionId);
      
      // Check for existing session
      const { data: existingSession } = await supabase
        .from('public_chat_sessions')
        .select('*')
        .eq('user_id', signupChatUserId)
        .eq('visitor_session_id', visitorSessionId)
        .eq('channel', 'web')
        .in('status', ['active', 'human_takeover'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      let sessionId: string;
      
      if (existingSession) {
        sessionId = existingSession.id;
        console.log('[SignupChat] Using existing session:', sessionId);
        
        // Load existing messages
        const { data: existingMessages } = await supabase
          .from('public_chat_messages')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true });
        
        if (existingMessages) {
          const formattedMessages = existingMessages.map(msg => ({
            role: msg.sender === 'visitor' ? 'user' as const : 'assistant' as const,
            content: msg.message
          }));
          setChatMessages(formattedMessages);
        }
      } else {
        // Create new session
        const sessionSlug = `signup_chat_${visitorSessionId}_${Date.now()}`;
        const { data: newSession, error: sessionError } = await supabase
          .from('public_chat_sessions')
          .insert({
            user_id: signupChatUserId,
            chatbot_id: 'signup-page-chat',
            visitor_session_id: visitorSessionId,
            session_slug: sessionSlug,
            channel: 'web',
            status: 'active',
            buying_intent_score: 0,
            qualification_score: 0,
            message_count: 0
          })
          .select()
          .single();
        
        if (sessionError) {
          console.error('[SignupChat] Error creating session:', sessionError);
          return;
        }
        
        sessionId = newSession.id;
        console.log('[SignupChat] Created new session:', sessionId);
        
        // Add greeting message
        const greeting = settings?.greeting_message || 'Hi! 👋 I\'m your NexScout AI assistant. Ask me anything about our features, pricing, or how we can help grow your business!';
        setChatMessages([{ role: 'assistant', content: greeting }]);
        
        // Save greeting to database
        await supabase
          .from('public_chat_messages')
          .insert({
            session_id: sessionId,
            sender: 'ai',
            message: greeting,
            created_at: new Date().toISOString()
          });
      }
      
      setChatSessionId(sessionId);
      console.log('[SignupChat] ✅ Chat session initialized successfully:', {
        sessionId,
        userId: signupChatUserId,
        hasSettings: !!settings,
        useCustomInstructions: settings?.use_custom_instructions,
        hasCustomInstructions: !!settings?.custom_system_instructions
      });
      
      // Note: AI System Instructions are loaded by the Edge Function from chatbot_settings
      // The Edge Function will use custom_system_instructions if use_custom_instructions is true
      if (settings?.use_custom_instructions && settings?.custom_system_instructions) {
        console.log('[SignupChat] Custom AI System Instructions will be used by Edge Function');
      } else {
        console.warn('[SignupChat] ⚠️ No custom AI System Instructions found. Using default.');
      }
      
    } catch (error: any) {
      console.error('[SignupChat] ❌ Error initializing chat:', error);
        console.error('[SignupChat] Error details:', {
          message: error.message,
          stack: error.stack
        });
      chatInitializedRef.current = false;
      
      // Show error to user
      setChatMessages([{
        role: 'assistant',
        content: 'Sorry, I couldn\'t initialize the chat. Please try closing and reopening it. 😊'
      }]);
    }
  };
  
  // Handle chat message submission
  const handleChatSend = async () => {
    // Validation checks
    if (!chatInput.trim()) {
      console.warn('[SignupChat] Empty message, ignoring');
      return;
    }
    
    if (chatLoading) {
      console.warn('[SignupChat] Already sending message, ignoring');
      return;
    }
    
    if (!chatSessionId) {
      console.error('[SignupChat] No session ID, cannot send message');
      alert('Chat session not initialized. Please close and reopen the chat.');
      return;
    }
    
    if (!signupChatUserId) {
      console.error('[SignupChat] No signup chat user ID, cannot send message');
      alert('Chat configuration error. Please refresh the page.');
      return;
    }
    
    const userMessage = chatInput.trim();
    setChatInput('');
    
    // Add user message immediately (optimistic UI)
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatLoading(true);
    
    try {
      console.log('[SignupChat] ===== SENDING MESSAGE =====');
      console.log('[SignupChat] Session ID:', chatSessionId);
      console.log('[SignupChat] User ID:', superAdminUserId);
      console.log('[SignupChat] Message:', userMessage);
      
      // First, save user message to database
      const { error: messageError } = await supabase
        .from('public_chat_messages')
        .insert({
          session_id: chatSessionId,
          sender: 'visitor',
          message: userMessage,
          created_at: new Date().toISOString()
        });
      
      if (messageError) {
        console.error('[SignupChat] Error saving user message:', messageError);
        throw new Error('Failed to save message: ' + messageError.message);
      }
      
      console.log('[SignupChat] User message saved to database');
      
      // Use Edge Function approach (same as PublicChatPage)
      const functionUrl = getSupabaseFunctionUrl('functions/v1/public-chatbot-chat');
      console.log('[SignupChat] Calling Edge Function:', functionUrl);
      
      const response = await fetch(
        functionUrl,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            sessionId: chatSessionId,
            message: userMessage,
            userId: signupChatUserId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error('[SignupChat] Edge Function error:', response.status, errorData);
        throw new Error(`Server error (${response.status}): ${errorData || response.statusText}`);
      }

      const result = await response.json();
      console.log('[SignupChat] AI response received:', result);
      
      // Reload messages from database (includes AI response)
      const { data: messages, error: loadError } = await supabase
        .from('public_chat_messages')
        .select('*')
        .eq('session_id', chatSessionId)
        .order('created_at', { ascending: true });
      
      if (loadError) {
        console.error('[SignupChat] Error loading messages:', loadError);
        throw new Error('Failed to load messages: ' + loadError.message);
      }
      
      if (messages && messages.length > 0) {
        const formattedMessages = messages.map(msg => ({
          role: msg.sender === 'visitor' ? 'user' as const : 'assistant' as const,
          content: msg.message
        }));
        setChatMessages(formattedMessages);
        console.log('[SignupChat] Messages reloaded:', formattedMessages.length);
      } else {
        console.warn('[SignupChat] No messages found after sending');
      }
      
      console.log('[SignupChat] ===== MESSAGE SENT COMPLETE =====');
      
    } catch (error: any) {
      console.error('[SignupChat] Error processing message:', error);
        console.error('[SignupChat] Error details:', {
          message: error.message,
          stack: error.stack,
          sessionId: chatSessionId,
          userId: signupChatUserId
        });
      
      // Remove the optimistic user message on error
      setChatMessages(prev => {
        const filtered = prev.filter((msg, idx) => {
          // Keep all messages except the last user message if it matches
          if (idx === prev.length - 1 && msg.role === 'user' && msg.content === userMessage) {
            return false;
          }
          return true;
        });
        return filtered;
      });
      
      // Show error message
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message || 'Unknown error'}. Please try again! 😊`
      }]);
    } finally {
      setChatLoading(false);
    }
  };
  
  const handleChatKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChatSend();
    }
  };
  
  // Reset chat when closed
  useEffect(() => {
    if (!chatOpen) {
      chatInitializedRef.current = false;
    }
  }, [chatOpen]);
  
  const features = [
    {
      icon: Zap,
      title: 'Automate Your Sales 24/7',
      description: 'Let AI handle your sales pipeline around the clock. Never miss a follow-up or opportunity.',
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-50 to-pink-50',
    },
    {
      icon: Bot,
      title: 'State-of-the-Art AI-Powered Prospecting',
      description: 'Discover high-quality leads with AI that understands Filipino market needs and pain points.',
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50',
    },
    {
      icon: MessageSquare,
      title: 'Connect All Your Chat Conversations',
      description: 'Unified inbox for Facebook, WhatsApp, SMS, and more. Manage all conversations in one place.',
      gradient: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-50 to-emerald-50',
    },
  ];
  
  // Auto-rotate slides
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % features.length);
    }, 6000); // Change slide every 6 seconds (increased from 4s for better readability)
    
    return () => clearInterval(interval);
  }, [features.length]);
  
  // Show next field when previous field has content
  useEffect(() => {
    if (fullName.trim().length > 0 && !showCompany) {
      setTimeout(() => setShowCompany(true), 200);
    }
  }, [fullName, showCompany]);
  
  useEffect(() => {
    if (company.trim().length > 0 && !showEmail) {
      setTimeout(() => setShowEmail(true), 200);
    }
  }, [company, showEmail]);
  
  useEffect(() => {
    if (email.trim().length > 0 && !showPasswordField) {
      setTimeout(() => setShowPasswordField(true), 200);
    }
  }, [email, showPasswordField]);
  
  useEffect(() => {
    if (password.length > 0 && !showConfirmPasswordField) {
      setTimeout(() => setShowConfirmPasswordField(true), 200);
    }
  }, [password, showConfirmPasswordField]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!fullName.trim()) {
      setError('Full name is required');
      return;
    }

    if (!company.trim()) {
      setError('Company name is required');
      return;
    }

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      console.log('[NewSignup] Starting signup via admin endpoint for:', email);

      // Call admin-signup edge function (bypasses ALL Supabase Auth restrictions!)
      const functionUrl = getSupabaseFunctionUrl('functions/v1/admin-signup');
      console.log('[NewSignup] Calling edge function:', functionUrl);
      
      const response = await fetch(
        functionUrl,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            email,
            password,
            fullName,
            company
          })
        }
      );

      console.log('[NewSignup] Response status:', response.status);
      console.log('[NewSignup] Response ok:', response.ok);

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        let errorMessage = `Server error: ${response.status} ${response.statusText}`;
        
        // Try to get error details from response
        try {
          const errorText = await response.text();
          console.error('[NewSignup] Error response text:', errorText);
          
          // Try to parse as JSON
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.error || errorJson.message || errorText || errorMessage;
            console.error('[NewSignup] Error JSON:', errorJson);
          } catch {
            // Not JSON, use text as is
            errorMessage = errorText || errorMessage;
          }
        } catch (parseError) {
          console.error('[NewSignup] Failed to parse error response:', parseError);
        }
        
        throw new Error(errorMessage);
      }

      // Parse response JSON
      let result;
      try {
        const responseText = await response.text();
        console.log('[NewSignup] Response text:', responseText);
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('[NewSignup] Failed to parse response JSON:', parseError);
        throw new Error('Invalid response from server. Please try again.');
      }

      if (!result.success) {
        console.error('[NewSignup] Admin signup error:', result.error || result);
        throw new Error(result.error || result.message || 'Signup failed');
      }

      console.log('[NewSignup] ✅ User created via admin endpoint:', result.user_id);

      // Now sign in the user
      console.log('[NewSignup] Signing in user...');
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        console.error('[NewSignup] Sign-in error:', signInError);
        // Not critical - user can log in manually
        throw new Error('Account created but auto-login failed. Please log in manually.');
      }

      console.log('[NewSignup] ✅ User signed in successfully!');
      
      // Wait a bit for session to be established
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('[NewSignup] Session established, redirecting to onboarding wizard...');

      // Success! Call parent callback
      onSignupSuccess();

    } catch (error: any) {
      console.error('[NewSignup] ❌ Signup failed:', error);
      setError(error.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateShortId = () => {
    return Math.random().toString(36).substring(2, 10);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            NexScout
          </h1>
          <p className="text-gray-600">AI-Powered Sales Intelligence</p>
        </div>

        {/* Feature Showcase Carousel */}
        <div className="mb-6 bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="relative h-64">
            {/* Slides */}
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const isActive = index === currentSlide;
              return (
                <div
                  key={index}
                  className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                    isActive
                      ? 'opacity-100 translate-x-0'
                      : index < currentSlide
                      ? 'opacity-0 -translate-x-full'
                      : 'opacity-0 translate-x-full'
                  }`}
                >
                  <div className={`h-full bg-gradient-to-br ${feature.bgGradient} p-8 flex flex-col items-center justify-center text-center`}>
                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg transform transition-transform duration-500 ${isActive ? 'scale-100 rotate-0' : 'scale-75 rotate-12'}`}>
                      <Icon className="w-10 h-10 text-white" strokeWidth={2} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-600 max-w-xs">{feature.description}</p>
                  </div>
                </div>
              );
            })}
            
            {/* Navigation Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {features.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentSlide
                      ? 'bg-white w-6'
                      : 'bg-white/50 hover:bg-white/75'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
            
            {/* Navigation Arrows */}
            <button
              onClick={() => setCurrentSlide((prev) => (prev - 1 + features.length) % features.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white shadow-md flex items-center justify-center transition-all hover:scale-110 z-10"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={() => setCurrentSlide((prev) => (prev + 1) % features.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white shadow-md flex items-center justify-center transition-all hover:scale-110 z-10"
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>

        {/* Signup Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create your account</h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Full Name - Always visible */}
            <div className="transition-all duration-500 ease-out">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Juan Dela Cruz"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                required
                autoFocus
              />
            </div>

            {/* Company - Appears when Full Name has content */}
            <div
              className={`transition-all duration-500 ease-out overflow-hidden ${
                showCompany
                  ? 'opacity-100 max-h-96 translate-y-0'
                  : 'opacity-0 max-h-0 -translate-y-4 pointer-events-none'
              }`}
            >
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Company / Business Name *
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g., AIM Global, Pru Life UK"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                required
              />
              {company.length > 2 && (
                <div className="mt-2 flex items-center gap-2 text-sm text-green-600 animate-in fade-in slide-in-from-top-2 duration-300">
                  <CheckCircle className="w-4 h-4" />
                  <span>We'll personalize your AI for {company}!</span>
                </div>
              )}
            </div>

            {/* Email - Appears when Company has content */}
            <div
              className={`transition-all duration-500 ease-out overflow-hidden ${
                showEmail
                  ? 'opacity-100 max-h-96 translate-y-0'
                  : 'opacity-0 max-h-0 -translate-y-4 pointer-events-none'
              }`}
            >
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                required
              />
            </div>

            {/* Password - Appears when Email has content */}
            <div
              className={`transition-all duration-500 ease-out overflow-hidden ${
                showPasswordField
                  ? 'opacity-100 max-h-96 translate-y-0'
                  : 'opacity-0 max-h-0 -translate-y-4 pointer-events-none'
              }`}
            >
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">At least 6 characters</p>
            </div>

            {/* Confirm Password - Appears when Password has content */}
            <div
              className={`transition-all duration-500 ease-out overflow-hidden ${
                showConfirmPasswordField
                  ? 'opacity-100 max-h-96 translate-y-0'
                  : 'opacity-0 max-h-0 -translate-y-4 pointer-events-none'
              }`}
            >
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 -mt-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating your account...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Sign up
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                onClick={onNavigateToLogin}
                className="text-blue-600 font-semibold hover:underline"
              >
                Log in
              </button>
            </p>
          </div>
        </div>

        {/* Sales Content - Use Cases */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
            How NexScout Helps Your Business Grow
          </h3>
          
          <div className="space-y-6">
            {/* Feature 1: Automation */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 mb-1">Automate Your Sales 24/7 with AI Chatbot</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Never miss a lead, even while you sleep. Your AI chatbot handles inquiries, qualifies prospects, and books appointments automatically.
                </p>
                <div className="bg-purple-50 rounded-lg p-3 border-l-4 border-purple-500">
                  <p className="text-xs text-gray-700">
                    <span className="font-semibold">Real Case:</span> Maria, an MLM leader, increased her conversions by 340% by letting AI handle Facebook inquiries 24/7. She now closes deals even at 2 AM while prospects are most active.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 2: Prospecting */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 mb-1">State-of-the-Art AI-Powered Prospecting</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Find high-quality leads who are ready to buy. Our AI understands Filipino pain points like "kailangan ng extra income" and "gusto mag-business."
                </p>
                <div className="bg-blue-50 rounded-lg p-3 border-l-4 border-blue-500">
                  <p className="text-xs text-gray-700">
                    <span className="font-semibold">Real Case:</span> Juan, a financial advisor, used AI prospecting to find 50 qualified leads in 1 hour from Facebook groups. His ScoutScore system identified prospects with 85+ scores who closed 3x faster.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 3: Unified Inbox */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 mb-1">Connect All Your Chat Conversations</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Manage Facebook Messenger, WhatsApp, SMS, and more in one unified inbox. Never lose a conversation or miss a follow-up.
                </p>
                <div className="bg-green-50 rounded-lg p-3 border-l-4 border-green-500">
                  <p className="text-xs text-gray-700">
                    <span className="font-semibold">Real Case:</span> Sarah, a real estate agent, manages 200+ conversations daily across 4 platforms. With unified inbox, she responds 5x faster and increased her closing rate by 60%.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 text-center">
              <p className="text-sm font-semibold text-gray-900 mb-1">
                Join 1,000+ Filipino entrepreneurs growing their business with AI
              </p>
              <p className="text-xs text-gray-600">
                Start automating your sales today. No credit card required.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Floating Chatbox - Only show if signup chat user exists */}
      {signupChatUserId && (
        <>
          {!chatOpen ? (
            <div className="fixed bottom-6 right-6 flex flex-col items-end gap-2 z-50">
              <p 
                className="text-sm text-gray-700 font-medium whitespace-nowrap milky-candy"
                style={{ fontFamily: "'Milky Candy Regular', 'Fredoka', 'Comic Sans MS', cursive" }}
              >
                Wanna chat?
              </p>
              <button
                onClick={() => {
                  setChatOpen(true);
                  setChatMinimized(false);
                }}
                className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-full shadow-2xl hover:shadow-blue-500/50 flex items-center justify-center transition-all hover:scale-110 group"
                aria-label="Open chat"
              >
                <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          ) : (
        <div
          className={`fixed bottom-6 right-6 w-[369px] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 transition-all duration-300 ${
            chatMinimized ? 'h-16' : 'h-[500px]'
          } flex flex-col`}
        >
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">NexScout AI Assistant</h3>
                <p className="text-xs text-white/80">Ask me anything!</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setChatMinimized(!chatMinimized)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                aria-label={chatMinimized ? 'Maximize' : 'Minimize'}
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setChatOpen(false);
                  setChatMinimized(false);
                }}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          {!chatMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {chatMessages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                          : 'bg-white text-gray-800 border border-gray-200'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-line">{message.content}</p>
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 rounded-2xl px-4 py-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (chatSessionId && !chatLoading && chatInput.trim()) {
                          handleChatSend();
                        }
                      }
                    }}
                    placeholder={!chatSessionId ? "Initializing chat..." : "Ask about features, pricing, or how to get started..."}
                    className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                    disabled={chatLoading || !chatSessionId}
                  />
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      if (chatSessionId && !chatLoading && chatInput.trim()) {
                        handleChatSend();
                      }
                    }}
                    disabled={!chatInput.trim() || chatLoading || !chatSessionId}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center min-w-[44px]"
                    title={!chatSessionId ? 'Chat initializing...' : chatInput.trim() ? 'Send message' : 'Type a message'}
                  >
                    {chatLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Powered by NexScout AI • Ask me anything!
                </p>
              </div>
            </>
          )}
        </div>
          )}
        </>
      )}
    </div>
  );
}

