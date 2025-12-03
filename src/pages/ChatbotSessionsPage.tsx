import React, { useState, useEffect } from 'react';
import { ArrowLeft, MessageCircle, Clock, User, CheckCircle, Settings, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { getAvatarClasses, getAvatarContent } from '../utils/avatarUtils';

interface ChatSession {
  id: string;
  visitor_name: string | null;
  visitor_email: string | null;
  visitor_avatar_seed: string | null;
  message_count: number;
  buying_intent_score: number;
  qualification_score: number;
  emotional_state: string;
  status: string;
  last_message_at: string;
  created_at: string;
  is_read: boolean;
}

interface ChatbotSessionsPageProps {
  onBack?: () => void;
  onNavigate?: (page: string, options?: any) => void;
}

export default function ChatbotSessionsPage({ onBack, onNavigate }: ChatbotSessionsPageProps) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'converted'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user, filter]);

  const loadSessions = async () => {
    setLoading(true);
    let query = supabase
      .from('public_chat_sessions')
      .select('*')
      .eq('user_id', user?.id)
      .neq('status', 'archived')
      .order('last_message_at', { ascending: false });

    if (filter === 'active') {
      query = query.eq('status', 'active');
    } else if (filter === 'converted') {
      query = query.eq('status', 'converted');
    }

    const { data } = await query;
    setSessions(data || []);
    setLoading(false);
  };

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

  const getIntentBadge = (score: number) => {
    if (score >= 0.7) {
      return { label: 'High Intent', color: 'bg-red-100 text-red-700' };
    } else if (score >= 0.4) {
      return { label: 'Medium Intent', color: 'bg-orange-100 text-orange-700' };
    } else {
      return { label: 'Low Intent', color: 'bg-gray-100 text-gray-600' };
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
      {/* Header */}
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

      {/* Filter Tabs - Messenger Style */}
      <div className="bg-white border-b border-gray-200 sticky top-[57px] z-10">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex gap-1">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${
                filter === 'all'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:bg-gray-50'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${
                filter === 'active'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:bg-gray-50'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('converted')}
              className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${
                filter === 'converted'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:bg-gray-50'
              }`}
            >
              Converted
            </button>
          </div>
        </div>
      </div>

      {/* Sessions List - Messenger Style */}
      <div className="max-w-2xl mx-auto">
        {loading ? (
          <div className="p-12 text-center">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-500 text-sm">Loading chats...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No chats yet</h3>
            <p className="text-sm text-gray-500">Share your chat link to start conversations</p>
          </div>
        ) : (
          <div>
            {sessions.map((session) => {
              const intentBadge = getIntentBadge(session.buying_intent_score);
              const qualificationPercent = Math.round(session.qualification_score * 100);

              return (
                <div
                  key={session.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !session.is_read ? 'bg-blue-50/30' : 'bg-white'
                  }`}
                  onClick={() => handleSessionClick(session.id)}
                >
                  <div className="px-4 py-3 flex items-center gap-3">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-sm ${
                        getAvatarClasses(session.visitor_avatar_seed, !!session.visitor_name)
                      }`}>
                        <span className="text-2xl">
                          {getAvatarContent(session.visitor_avatar_seed, session.visitor_name)}
                        </span>
                      </div>
                      {session.status === 'active' && (
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between mb-0.5">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <h3 className={`truncate text-base ${
                            !session.is_read ? 'font-bold text-gray-900' : 'font-semibold text-gray-900'
                          }`}>
                            {session.visitor_name || 'Anonymous Visitor'}
                          </h3>
                          {!session.is_read && (
                            <div className="w-2.5 h-2.5 bg-blue-600 rounded-full flex-shrink-0"></div>
                          )}
                        </div>
                        <span className={`text-xs ml-2 flex-shrink-0 ${
                          !session.is_read ? 'text-blue-600 font-semibold' : 'text-gray-500'
                        }`}>
                          {formatTime(session.last_message_at)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mb-1">
                        <span className="flex items-center gap-1 text-xs text-gray-600">
                          <MessageCircle className="w-3.5 h-3.5" />
                          {session.message_count}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${intentBadge.color}`}>
                          {intentBadge.label}
                        </span>
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
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden max-w-[120px]">
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

                    {/* View Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate?.('chatbot-session-viewer', { sessionId: session.id });
                      }}
                      className="flex-shrink-0 p-2 hover:bg-blue-50 rounded-full transition-colors group"
                    >
                      <Eye className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
