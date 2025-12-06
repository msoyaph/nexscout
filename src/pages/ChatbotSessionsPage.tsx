import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowLeft, MessageCircle, Clock, User, CheckCircle, Settings, Eye, Flame, Thermometer, Snowflake, HelpCircle, Facebook, Mail, MessageSquare as SMS, Phone, Play, Pause, Search, X, RefreshCw, Crown, AlertCircle, Zap, CreditCard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { getAvatarClasses, getAvatarContent } from '../utils/avatarUtils';

interface ChatSession {
  id: string;
  visitor_name: string | null;
  visitor_email: string | null;
  visitor_avatar_seed: string | null;
  message_count: number;
  buying_intent_score?: number | null;
  qualification_score: number;
  emotional_state: string;
  status: string;
  last_message_at: string;
  created_at: string;
  is_read: boolean;
  channel?: 'web' | 'facebook' | 'messenger' | 'email' | 'sms' | 'whatsapp';
  lead_temperature?: 'hot' | 'warm' | 'cold' | 'curious' | null;
  conversation_state?: {
    buying_intent_score?: number;
    lead_temperature?: string;
    [key: string]: any;
  } | null;
}

interface ChatbotSessionsPageProps {
  onBack?: () => void;
  onNavigate?: (page: string, options?: any) => void;
}

export default function ChatbotSessionsPage({ onBack, onNavigate }: ChatbotSessionsPageProps) {
  const { user, profile } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Chat limits state
  const [monthlyChatCount, setMonthlyChatCount] = useState(0);
  const [showPayAsYouGoModal, setShowPayAsYouGoModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  // Pull-to-refresh state
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullStartY, setPullStartY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Chat limits by tier
  const CHAT_LIMITS = {
    free: 30,
    pro: 300,
  };

  const isProUser = profile?.subscription_tier === 'pro';
  const chatLimit = isProUser ? CHAT_LIMITS.pro : CHAT_LIMITS.free;
  const chatUsage = monthlyChatCount;
  const chatRemaining = Math.max(0, chatLimit - chatUsage);
  const usagePercentage = Math.min(100, (chatUsage / chatLimit) * 100);
  const isNearLimit = usagePercentage >= 80;
  const isOverLimit = chatUsage >= chatLimit;

  useEffect(() => {
    if (user) {
      loadSessions();
      loadMonthlyChatCount();
    }
  }, [user, filter]);


  // Load monthly chat session count
  const loadMonthlyChatCount = async () => {
    if (!user?.id) return;

    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const { count, error } = await supabase
        .from('public_chat_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth.toISOString())
        .neq('status', 'archived');

      if (error) throw error;
      setMonthlyChatCount(count || 0);
    } catch (error) {
      console.error('Error loading monthly chat count:', error);
    }
  };

  // Real-time subscription to session changes
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('chat-sessions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'public_chat_sessions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          // Reload sessions when any change occurs (including status updates from Chat Viewer)
          loadSessions();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const loadSessions = async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    
    // Load all sessions (filtering by active/inactive will be done client-side based on 24-hour rule)
    const { data } = await supabase
      .from('public_chat_sessions')
      .select('*')
      .eq('user_id', user?.id)
      .neq('status', 'archived')
      .order('last_message_at', { ascending: false });

    setSessions(data || []);
    
    if (isRefresh) {
      setIsRefreshing(false);
    } else {
      setLoading(false);
    }
  };
  
  // Helper function to determine if session is active (last message within 24 hours)
  const isSessionActive = (lastMessageAt: string): boolean => {
    const lastMessage = new Date(lastMessageAt);
    const now = new Date();
    const hoursSinceLastMessage = (now.getTime() - lastMessage.getTime()) / (1000 * 60 * 60);
    return hoursSinceLastMessage <= 24;
  };
  
  // Pull-to-refresh handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;
    
    // Only trigger if scrolled to top
    if (scrollContainer.scrollTop === 0) {
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
      loadSessions(true);
    }
    
    // Reset pull state
    setPullDistance(0);
    setIsPulling(false);
    setPullStartY(0);
  };
  
  // Mouse drag support for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;
    
    if (scrollContainer.scrollTop === 0) {
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
        loadSessions(true);
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

  // Real-time filtering based on search query and active/inactive filter
  const filteredSessions = useMemo(() => {
    let filtered = sessions;

    // Filter by active/inactive based on 24-hour rule
    if (filter === 'active') {
      filtered = sessions.filter(session => {
        // Active if last message was within 24 hours AND status is not converted
        return isSessionActive(session.last_message_at) && session.status !== 'converted';
      });
    } else if (filter === 'inactive') {
      filtered = sessions.filter(session => {
        // Inactive if last message was more than 24 hours ago OR status is converted
        return !isSessionActive(session.last_message_at) || session.status === 'converted';
      });
    }

    // Apply search query filter
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(session => {
        const name = session.visitor_name?.toLowerCase() || '';
        const email = session.visitor_email?.toLowerCase() || '';
        return name.includes(lowerQuery) || email.includes(lowerQuery);
      });
    }

    return filtered;
  }, [sessions, searchQuery, filter]);

  const markAsRead = async (sessionId: string) => {
    await supabase
      .from('public_chat_sessions')
      .update({ is_read: true })
      .eq('id', sessionId);
  };

  const handleSessionClick = async (sessionId: string) => {
    await markAsRead(sessionId);
    onNavigate?.('chatbot-session-viewer', { sessionId });
  };

  const convertToProspect = async (sessionId: string) => {
    const { data } = await supabase.rpc('auto_qualify_session', {
      p_session_id: sessionId
    });

    if (data) {
      alert('Successfully converted to prospect!');
      loadSessions();
    } else {
      alert('Could not convert. Make sure visitor information is captured.');
    }
  };

  const getIntentBadge = (score: number | null | undefined) => {
    // Handle null/undefined by defaulting to 0 (Low Intent)
    const normalizedScore = score ?? 0;
    
    if (normalizedScore >= 0.7) {
      return { 
        label: 'High Intent', 
        color: 'bg-red-100 text-red-700 border-red-200',
        icon: <Flame className="w-3 h-3" />
      };
    } else if (normalizedScore >= 0.4) {
      return { 
        label: 'Medium Intent', 
        color: 'bg-orange-100 text-orange-700 border-orange-200',
        icon: <Thermometer className="w-3 h-3" />
      };
    } else {
      return { 
        label: 'Low Intent', 
        color: 'bg-gray-100 text-gray-600 border-gray-200',
        icon: <Snowflake className="w-3 h-3" />
      };
    }
  };

  const getLeadTemperatureIcon = (temp?: string, score?: number) => {
    // If lead_temperature exists, use it
    if (temp === 'hot' || score >= 0.7) {
      return { icon: <Flame className="w-4 h-4" />, color: 'text-red-600', label: 'Hot' };
    } else if (temp === 'warm' || (score >= 0.4 && score < 0.7)) {
      return { icon: <Thermometer className="w-4 h-4" />, color: 'text-orange-600', label: 'Warm' };
    } else if (temp === 'curious') {
      return { icon: <HelpCircle className="w-4 h-4" />, color: 'text-purple-600', label: 'Curious' };
    } else {
      return { icon: <Snowflake className="w-4 h-4" />, color: 'text-blue-600', label: 'Cold' };
    }
  };

  const getChannelIcon = (channel?: string) => {
    switch (channel) {
      case 'facebook':
      case 'messenger':
        return { icon: <Facebook className="w-3 h-3" />, label: 'Messenger', color: 'text-blue-600 bg-blue-50 border-blue-200' };
      case 'email':
        return { icon: <Mail className="w-3 h-3" />, label: 'Email', color: 'text-purple-600 bg-purple-50 border-purple-200' };
      case 'sms':
        return { icon: <SMS className="w-3 h-3" />, label: 'SMS', color: 'text-green-600 bg-green-50 border-green-200' };
      case 'whatsapp':
        return { icon: <Phone className="w-3 h-3" />, label: 'WhatsApp', color: 'text-green-600 bg-green-50 border-green-200' };
      default:
        return { icon: <MessageCircle className="w-3 h-3" />, label: 'Web', color: 'text-gray-600 bg-gray-50 border-gray-200' };
    }
  };

  const getEmotionEmoji = (emotion: string) => {
    const emotions: Record<string, string> = {
      excited: '🤩',
      interested: '😊',
      neutral: '😐',
      confused: '🤔',
      frustrated: '😤',
      hopeful: '🙏'
    };
    return emotions[emotion] || '😊';
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Back Button and Settings - Fixed */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Chats</h1>
              </div>
            </div>
            <button
              onClick={() => onNavigate?.('chatbot-settings')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="max-w-2xl mx-auto px-4 py-3">
        {/* Chat Usage Progress Bar */}
        <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-gray-600" />
                <span className="font-semibold text-gray-700">
                  {chatUsage} / {chatLimit} chats this month
                </span>
                {isProUser && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    Pro
                  </span>
                )}
              </div>
              {!isProUser && (
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="px-3 py-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-bold rounded-full hover:from-blue-700 hover:to-blue-800 transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Zap className="w-3 h-3" />
                  Upgrade
                </button>
              )}
              {isProUser && isOverLimit && (
                <button
                  onClick={() => setShowPayAsYouGoModal(true)}
                  className="px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-bold rounded-full hover:from-amber-600 hover:to-amber-700 transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <CreditCard className="w-3 h-3" />
                  Buy More
                </button>
              )}
            </div>
            
            {/* Progress Bar */}
            <div className="relative h-2.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isOverLimit
                    ? 'bg-red-500'
                    : isNearLimit
                    ? 'bg-amber-500'
                    : 'bg-gradient-to-r from-blue-500 to-blue-600'
                }`}
                style={{ width: `${Math.min(100, usagePercentage)}%` }}
              />
            </div>

            {/* Warning Messages */}
            {isOverLimit && (
              <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-red-900">Chat limit reached</p>
                  <p className="text-xs text-red-700">
                    {isProUser 
                      ? 'Purchase additional chats to continue' 
                      : 'Upgrade to Pro for 300 chats/month'}
                  </p>
                </div>
              </div>
            )}
            {isNearLimit && !isOverLimit && (
              <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">
                  {chatRemaining} chats remaining this month
                </p>
              </div>
            )}
        </div>

        {/* Search Box */}
        <div className="pt-3 border-t border-gray-200 mt-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 bg-gray-100 border-0 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-3.5 h-3.5 text-gray-500" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Tabs - Messenger Style */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 pb-0">
          <div className="flex gap-1">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 py-2 text-sm font-semibold transition-colors border-b-2 ${
                filter === 'all'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:bg-gray-50'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`flex-1 py-2 text-sm font-semibold transition-colors border-b-2 ${
                filter === 'active'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:bg-gray-50'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('inactive')}
              className={`flex-1 py-2 text-sm font-semibold transition-colors border-b-2 ${
                filter === 'inactive'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:bg-gray-50'
              }`}
            >
              Inactive
            </button>
          </div>
        </div>
      </div>

      {/* Sessions List - Messenger Style */}
      <div className="max-w-2xl mx-auto">
        {/* Pull-to-refresh indicator */}
        {(pullDistance > 0 || isRefreshing) && (
          <div 
            className="flex items-center justify-center py-3 bg-white border-b border-gray-200 transition-all duration-200"
            style={{ 
              transform: `translateY(${Math.max(0, pullDistance - 40)}px)`,
              opacity: Math.min(1, pullDistance / 50)
            }}
          >
            {isRefreshing ? (
              <div className="flex items-center gap-2 text-blue-600">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span className="text-sm font-medium">Refreshing...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-600">
                <RefreshCw 
                  className="w-5 h-5 transition-transform"
                  style={{ transform: `rotate(${pullDistance * 4}deg)` }}
                />
                <span className="text-sm font-medium">
                  {pullDistance >= 50 ? 'Release to refresh' : 'Pull to refresh'}
                </span>
              </div>
            )}
          </div>
        )}
        
        <div
          ref={scrollContainerRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          style={{ 
            touchAction: 'pan-y',
            overflowY: 'auto',
            maxHeight: 'calc(100vh - 171px)'
          }}
        >
          {loading ? (
          <div className="p-12 text-center">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-500 text-sm">Loading chats...</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {searchQuery ? (
                <Search className="w-10 h-10 text-gray-400" />
              ) : (
                <MessageCircle className="w-10 h-10 text-gray-400" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery ? 'No results found' : 'No chats yet'}
            </h3>
            <p className="text-sm text-gray-500">
              {searchQuery 
                ? `No chats matching "${searchQuery}"`
                : 'Share your chat link to start conversations'
              }
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div>
            {/* Tiny pull-to-refresh hint at top */}
            {filteredSessions.length > 0 && pullDistance === 0 && !isRefreshing && (
              <div className="flex items-center justify-center gap-1 pb-2 pt-2 pointer-events-none">
                <RefreshCw className="w-3 h-3 text-gray-400" />
                <span className="text-[10px] text-gray-400 font-normal">Pull the chatbox to refresh</span>
              </div>
            )}
            
            {filteredSessions.map((session) => {
              // Extract buying_intent_score from session or conversation_state
              const buyingIntentScore = session.buying_intent_score ?? 
                session.conversation_state?.buying_intent_score ?? 
                0;
              
              // Extract lead_temperature from session or conversation_state
              const leadTemperature = session.lead_temperature ?? 
                session.conversation_state?.lead_temperature ?? 
                null;
              
              // Get channel, default to 'web' if not provided
              const channel = session.channel ?? 'web';
              
              // Calculate badges using actual session data
              const intentBadge = getIntentBadge(buyingIntentScore);
              const qualificationPercent = Math.round(session.qualification_score * 100);
              const tempIcon = getLeadTemperatureIcon(leadTemperature as any, buyingIntentScore);
              const channelInfo = getChannelIcon(channel);

              return (
                <div
                  key={session.id}
                  className={`border-b transition-colors cursor-pointer ${
                    !session.is_read 
                      ? 'bg-blue-50 border-l-4 border-l-blue-500 hover:bg-blue-100' 
                      : 'bg-white border-l-4 border-l-transparent hover:bg-gray-50'
                  }`}
                  onClick={() => handleSessionClick(session.id)}
                >
                  <div className="px-3 py-1.5 flex items-center gap-2">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-sm ${
                        getAvatarClasses(session.visitor_avatar_seed, !!session.visitor_name)
                      }`}>
                        <span className="text-xl">
                          {getAvatarContent(session.visitor_avatar_seed, session.visitor_name)}
                        </span>
                      </div>
                      {session.status === 'active' && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between mb-0.5">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <h3 className={`truncate text-sm ${
                            !session.is_read ? 'font-bold text-gray-900' : 'font-semibold text-gray-900'
                          }`}>
                            {session.visitor_name || 'Anonymous Visitor'}
                          </h3>
                          {!session.is_read && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                          )}
                        </div>
                        <span className={`text-xs ml-1.5 flex-shrink-0 ${
                          !session.is_read ? 'text-blue-600 font-semibold' : 'text-gray-500'
                        }`}>
                          {formatTime(session.last_message_at)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        {/* Channel Badge */}
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border flex items-center gap-1 ${channelInfo.color}`}>
                          {channelInfo.icon}
                          {channelInfo.label}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        
                        {/* Message Count */}
                        <span className="flex items-center gap-1 text-xs text-gray-600">
                          <MessageCircle className="w-3.5 h-3.5" />
                          {session.message_count}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        
                        {/* Intent Badge with Icon */}
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold flex items-center gap-1 ${intentBadge.color}`}>
                          {intentBadge.icon}
                          {intentBadge.label}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        
                        {/* Temperature Icon */}
                        <span className={`flex items-center gap-1 text-xs font-semibold ${tempIcon.color}`} title={`${tempIcon.label} Lead`}>
                          {tempIcon.icon}
                          {tempIcon.label}
                        </span>
                        
                        {/* Small Chatbot Status Indicator */}
                        <span className="text-xs text-gray-400">•</span>
                        {session.status === 'human_takeover' ? (
                          <span className="flex items-center gap-1 text-xs text-orange-600" title="AI Paused">
                            <Pause className="w-3 h-3" />
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-green-600" title="AI Active">
                            <Play className="w-3 h-3" />
                          </span>
                        )}
                        
                        {session.status === 'converted' && (
                          <>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Converted
                            </span>
                          </>
                        )}
                      </div>

                      {/* Qualification Bar */}
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden max-w-[100px]">
                          <div
                            className={`h-full transition-all ${
                              qualificationPercent >= 70
                                ? 'bg-green-500'
                                : qualificationPercent >= 40
                                ? 'bg-orange-500'
                                : 'bg-gray-400'
                            }`}
                            style={{ width: `${qualificationPercent}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{qualificationPercent}%</span>
                        <span className="text-sm">{getEmotionEmoji(session.emotional_state)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </div>
      </div>

      {/* Upgrade Modal for Free Tier */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Upgrade to Pro</h2>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-5 h-5 text-blue-600" />
                  <span className="font-bold text-blue-900">Pro Benefits</span>
                </div>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>300 chats per month (vs 30 free)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Unlimited AI messages</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Advanced analytics</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Priority support</span>
                  </li>
                </ul>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Maybe Later
                </button>
                <button
                  onClick={() => {
                    setShowUpgradeModal(false);
                    onNavigate?.('pricing');
                  }}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
                >
                  View Plans
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pay-as-You-Go Modal for Pro Users */}
      {showPayAsYouGoModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Buy Additional Chats</h2>
              <button
                onClick={() => setShowPayAsYouGoModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-900 mb-1">You've reached your monthly limit</p>
                    <p className="text-xs text-amber-700">
                      You've used {chatUsage} of {chatLimit} chats this month. Purchase additional chats to continue.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Choose a Package</h3>
                
                {/* Package Options */}
                <div className="space-y-2">
                  {/* 100 Chats - Base Price */}
                  <button
                    onClick={async () => {
                      // TODO: Implement payment processing
                      alert('Payment integration coming soon!');
                    }}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-gray-900">100 Additional Chats</div>
                        <div className="text-sm text-gray-600">₱200.00</div>
                      </div>
                      <div className="text-lg font-bold text-blue-600">₱2.00/chat</div>
                    </div>
                  </button>

                  {/* 200 Chats - 5% Discount */}
                  <button
                    onClick={async () => {
                      // TODO: Implement payment processing
                      alert('Payment integration coming soon!');
                    }}
                    className="w-full p-4 border-2 border-blue-500 rounded-xl bg-blue-50 hover:bg-blue-100 transition-all text-left relative"
                  >
                    <div className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                      Save 5%
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-gray-900">200 Additional Chats</div>
                        <div className="text-sm text-gray-600">
                          <span className="line-through text-gray-400">₱400.00</span>{' '}
                          <span className="text-green-600 font-semibold">₱380.00</span>
                        </div>
                      </div>
                      <div className="text-lg font-bold text-blue-600">₱1.90/chat</div>
                    </div>
                  </button>

                  {/* 500 Chats - 10% Discount */}
                  <button
                    onClick={async () => {
                      // TODO: Implement payment processing
                      alert('Payment integration coming soon!');
                    }}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left relative"
                  >
                    <div className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                      Save 10%
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-gray-900">500 Additional Chats</div>
                        <div className="text-sm text-gray-600">
                          <span className="line-through text-gray-400">₱1,000.00</span>{' '}
                          <span className="text-green-600 font-semibold">₱900.00</span>
                        </div>
                      </div>
                      <div className="text-lg font-bold text-blue-600">₱1.80/chat</div>
                    </div>
                  </button>

                  {/* 1000 Chats - 15% Discount */}
                  <button
                    onClick={async () => {
                      // TODO: Implement payment processing
                      alert('Payment integration coming soon!');
                    }}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left relative"
                  >
                    <div className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                      Best Value - 15% Off
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-gray-900">1,000 Additional Chats</div>
                        <div className="text-sm text-gray-600">
                          <span className="line-through text-gray-400">₱2,000.00</span>{' '}
                          <span className="text-green-600 font-semibold">₱1,700.00</span>
                        </div>
                      </div>
                      <div className="text-lg font-bold text-blue-600">₱1.70/chat</div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowPayAsYouGoModal(false)}
                  className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
