import React, { useState, useEffect } from 'react';
import { ArrowLeft, MessageCircle, User, TrendingUp, AlertCircle, Calendar, CheckCircle, Mail, Send, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { getAvatarClasses, getAvatarContent } from '../utils/avatarUtils';

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

  useEffect(() => {
    if (user && sessionId) {
      loadSessionData();
    }
  }, [user, sessionId]);

  const loadSessionData = async () => {
    const { data: sessionData } = await supabase
      .from('public_chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user?.id)
      .maybeSingle();

    if (!sessionData) {
      onBack?.();
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
    setLoading(false);
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

  const analyzeBuyingSignals = () => {
    const allSignals: string[] = [];
    messages.forEach(msg => {
      if (msg.ai_buying_signals && msg.ai_buying_signals.length > 0) {
        allSignals.push(...msg.ai_buying_signals);
      }
    });
    return [...new Set(allSignals)];
  };

  const analyzeObjections = () => {
    const allObjections: string[] = [];
    messages.forEach(msg => {
      if (msg.detected_objections && msg.detected_objections.length > 0) {
        allObjections.push(...msg.detected_objections);
      }
    });
    return [...new Set(allObjections)];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <MessageCircle className="w-12 h-12 text-blue-600 animate-pulse" />
      </div>
    );
  }

  const buyingSignals = analyzeBuyingSignals();
  const objections = analyzeObjections();
  const qualificationPercent = Math.round((session?.qualification_score || 0) * 100);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Chat with {session?.visitor_name || 'Anonymous Visitor'}
              </h1>
              <p className="text-sm text-gray-600">
                {new Date(session?.created_at).toLocaleDateString()} · {messages.length} messages
              </p>
            </div>
          </div>
          {session?.status === 'active' && session?.visitor_name && !pipelineEntry && (
            <button
              onClick={convertToProspect}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <CheckCircle className="w-4 h-4" />
              Convert to Prospect
            </button>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Conversation</h2>
              <div className="space-y-4 max-h-[500px] overflow-y-auto mb-4">
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

              {/* Human Intervention Input */}
              {session?.status === 'active' && (
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">Reply as Human</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={humanReply}
                      onChange={(e) => setHumanReply(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendHumanReply()}
                      placeholder="Type your message to the visitor..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      disabled={sending}
                    />
                    <button
                      onClick={sendHumanReply}
                      disabled={!humanReply.trim() || sending}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      {sending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      <span className="text-sm font-medium">Send</span>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Your reply will be sent to the visitor. This will change the chat status to "Human Takeover".
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Visitor Info</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium text-gray-900">{session?.visitor_name || 'Not captured'}</p>
                </div>
                {session?.visitor_email && (
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{session.visitor_email}</p>
                  </div>
                )}
                {session?.visitor_phone && (
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium text-gray-900">{session.visitor_phone}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Channel</p>
                  <p className="font-medium text-gray-900 capitalize">{session?.channel}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Analysis</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Qualification Score</span>
                    <span className="text-sm font-semibold text-gray-900">{qualificationPercent}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        qualificationPercent >= 70
                          ? 'bg-green-500'
                          : qualificationPercent >= 40
                          ? 'bg-yellow-500'
                          : 'bg-gray-400'
                      }`}
                      style={{ width: `${qualificationPercent}%` }}
                    />
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Buying Intent</p>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    session?.buying_intent_score >= 0.7
                      ? 'bg-green-100 text-green-800'
                      : session?.buying_intent_score >= 0.4
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {session?.buying_intent_score >= 0.7 ? 'High' : session?.buying_intent_score >= 0.4 ? 'Medium' : 'Low'}
                  </span>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Emotional State</p>
                  <p className="font-medium text-gray-900 capitalize">{session?.emotional_state}</p>
                </div>
              </div>
            </div>

            {buyingSignals.length > 0 && (
              <div className="bg-green-50 rounded-xl border border-green-200 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-green-900">Buying Signals</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {buyingSignals.map((signal, i) => (
                    <span key={i} className="px-3 py-1 bg-white border border-green-200 text-green-800 rounded-full text-xs font-medium">
                      {signal}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {objections.length > 0 && (
              <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <h3 className="font-semibold text-yellow-900">Objections</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {objections.map((objection, i) => (
                    <span key={i} className="px-3 py-1 bg-white border border-yellow-200 text-yellow-800 rounded-full text-xs font-medium">
                      {objection}
                    </span>
                  ))}
                </div>
              </div>
            )}

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
    </div>
  );
}
