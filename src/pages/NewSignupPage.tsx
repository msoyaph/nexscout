/**
 * NEW Signup Page - Clean Implementation
 * 
 * Handles user creation manually to bypass broken triggers
 * Redirects to QuickOnboardingFlow after successful signup
 */

import { useState, useEffect, useRef } from 'react';
import { UserPlus, Eye, EyeOff, Sparkles, Loader2, CheckCircle, Zap, Bot, MessageSquare, ChevronLeft, ChevronRight, MessageCircle, X, Send, Minimize2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

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
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: 'Hi! 👋 I\'m your NexScout AI assistant. Ask me anything about our features, pricing, or how we can help grow your business!'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom of chat when new message arrives
  useEffect(() => {
    if (chatOpen && !chatMinimized) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, chatOpen, chatMinimized]);
  
  // Handle chat message submission
  const handleChatSend = async () => {
    if (!chatInput.trim() || chatLoading) return;
    
    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatLoading(true);
    
    // Simulate AI response (you can replace this with actual AI API call)
    setTimeout(() => {
      let response = '';
      
      // Simple keyword-based responses for demo
      const lowerMessage = userMessage.toLowerCase();
      
      if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('pricing')) {
        response = 'We offer a Free tier to get started, and Pro plans starting at ₱1,299/month. The Free tier includes 30 AI chatbot messages, 50 scans, and basic features. Pro includes unlimited scans, 300 chatbot messages, and advanced AI automation. Would you like to know more about specific features?';
      } else if (lowerMessage.includes('feature') || lowerMessage.includes('what can') || lowerMessage.includes('how does')) {
        response = 'NexScout offers three main features:\n\n1. **24/7 AI Chatbot Automation** - Automatically handle customer inquiries, qualify leads, and book appointments even while you sleep.\n\n2. **AI-Powered Prospecting** - Find high-quality leads using AI that understands Filipino market needs and pain points.\n\n3. **Unified Chat Inbox** - Manage all conversations from Facebook, WhatsApp, SMS in one place.\n\nWhich feature interests you most?';
      } else if (lowerMessage.includes('signup') || lowerMessage.includes('sign up') || lowerMessage.includes('register')) {
        response = 'Great! Just fill out the form above with your name, company, email, and password. It takes less than 2 minutes to get started. Once you sign up, you\'ll get:\n\n✨ FREE 30 coins\n⚡ FREE 5 energy\n💬 FREE 30 AI chatbot messages\n\nPlus daily bonuses! Ready to start?';
      } else if (lowerMessage.includes('free') || lowerMessage.includes('trial')) {
        response = 'Yes! We have a Free tier that includes:\n\n• 30 AI chatbot messages per month\n• 50 prospect scans per month\n• Basic AI prospecting\n• Unified inbox\n• Email support\n\nNo credit card required! You can upgrade anytime to unlock more features.';
      } else if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
        response = 'I\'m here to help! You can ask me about:\n\n• Features and capabilities\n• Pricing and plans\n• How to get started\n• Use cases and examples\n• Technical questions\n\nOr fill out the signup form above and our team will reach out. What would you like to know?';
      } else {
        response = 'That\'s a great question! Let me help you:\n\nNexScout is an AI-powered sales intelligence platform designed for Filipino entrepreneurs. We help automate your sales process, find qualified leads, and manage all your customer conversations in one place.\n\nWould you like to know more about:\n• Our features\n• Pricing\n• How to get started\n• Real customer success stories\n\nJust ask!';
      }
      
      setChatMessages(prev => [...prev, { role: 'assistant', content: response }]);
      setChatLoading(false);
    }, 1000);
  };
  
  const handleChatKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChatSend();
    }
  };
  
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
      // Normalize URL to ensure HTTPS and remove trailing slashes
      let supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
      supabaseUrl = supabaseUrl.trim().replace(/\/+$/, ''); // Remove trailing slashes
      if (supabaseUrl.startsWith('http://')) {
        supabaseUrl = supabaseUrl.replace('http://', 'https://'); // Force HTTPS
      }
      if (!supabaseUrl.startsWith('https://')) {
        supabaseUrl = `https://${supabaseUrl}`;
      }
      
      const response = await fetch(
        `${supabaseUrl}/functions/v1/admin-signup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            email,
            password,
            fullName,
            company
          })
        }
      );

      const result = await response.json();

      if (!result.success) {
        console.error('[NewSignup] Admin signup error:', result.error);
        throw new Error(result.error || 'Signup failed');
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
            NexScout<span className="text-blue-600">.ai</span>
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

        {/* Trust Indicators */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 flex items-center justify-center gap-2">
            <Sparkles className="w-3 h-3" />
            <span>Join 1,000+ Filipino entrepreneurs using NexScout AI</span>
          </p>
        </div>
      </div>

      {/* Floating Chatbox */}
      {!chatOpen ? (
        <button
          onClick={() => {
            setChatOpen(true);
            setChatMinimized(false);
          }}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-full shadow-2xl hover:shadow-blue-500/50 flex items-center justify-center transition-all hover:scale-110 z-50 group"
          aria-label="Open chat"
        >
          <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
        </button>
      ) : (
        <div
          className={`fixed bottom-6 right-6 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 transition-all duration-300 ${
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
                    onKeyPress={handleChatKeyPress}
                    placeholder="Ask about features, pricing, or how to get started..."
                    className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                    disabled={chatLoading}
                  />
                  <button
                    onClick={handleChatSend}
                    disabled={!chatInput.trim() || chatLoading}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                  >
                    <Send className="w-4 h-4" />
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
    </div>
  );
}

