import { useEffect, useState, useRef } from 'react';
import { Send, Paperclip, Loader, Bot } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { conversationalAIEngine } from '../../services/ai/conversationalAIEngine';
import { getAvatarClasses, getAvatarContent, generateAvatarSeed } from '../../utils/avatarUtils';

interface PublicChatPageProps {
  username: string;
}

interface Message {
  id: string;
  message: string;
  role: 'user' | 'bot';
  created_at: string;
}

export default function PublicChatPage({ username }: PublicChatPageProps) {
  const [agentSettings, setAgentSettings] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sessionId, setSessionId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [avatarSeed] = useState<string>(generateAvatarSeed());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const visitorId = useRef<string>(`visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    loadAgentAndInitialize();
  }, [username]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadAgentAndInitialize = async () => {
    try {
      // Load agent settings by username
      const { data: settings, error } = await supabase
        .from('ai_agent_settings')
        .select('*, profiles!inner(user_id, full_name, avatar_url)')
        .eq('public_username', username)
        .eq('public_chat_enabled', true)
        .single();

      if (error || !settings) {
        throw new Error('Agent not found or chat disabled');
      }

      setAgentSettings(settings);

      // Initialize chat
      const result = await conversationalAIEngine.initializeChat(
        (settings.profiles as any).user_id,
        'web',
        visitorId.current
      );

      if (result.success) {
        setSessionId(result.sessionId);

        // Load conversation history
        const history = await conversationalAIEngine.getConversationHistory(result.sessionId);
        setMessages(history);
      }

      setLoading(false);
    } catch (error) {
      console.error('Failed to load agent:', error);
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !sessionId || !agentSettings) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setSending(true);

    // Add user message immediately
    const tempUserMsg: Message = {
      id: `temp_${Date.now()}`,
      message: userMessage,
      role: 'user',
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMsg]);

    // Show typing indicator
    setTyping(true);

    try {
      const result = await conversationalAIEngine.processMessage({
        userId: (agentSettings.profiles as any).user_id,
        sessionId,
        visitorId: visitorId.current,
        channel: 'web',
        message: userMessage,
      });

      // Remove typing indicator
      setTyping(false);

      if (result.success) {
        // Reload conversation history
        const history = await conversationalAIEngine.getConversationHistory(sessionId);
        setMessages(history);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setTyping(false);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (!agentSettings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bot className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Agent Not Found</h2>
          <p className="text-gray-600">This chat agent is not available or chat has been disabled.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative">
              {(agentSettings.profiles as any)?.avatar_url ? (
                <img
                  src={(agentSettings.profiles as any).avatar_url}
                  alt="Agent"
                  className="w-14 h-14 rounded-full object-cover border-2 border-blue-500"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center border-2 border-blue-500">
                  <Bot className="w-7 h-7 text-white" />
                </div>
              )}
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
            </div>

            {/* Agent Info */}
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">{agentSettings.agent_name}</h1>
              <p className="text-sm text-gray-600">{agentSettings.agent_personality || 'AI Sales Agent'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div
              key={msg.id || index}
              className={`flex gap-2 ${msg.role === 'user' ? 'justify-end flex-row-reverse' : 'justify-start flex-row'}`}
            >
              {/* Avatar */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
                msg.role === 'user'
                  ? getAvatarClasses(avatarSeed, false)
                  : 'bg-gradient-to-br from-blue-600 to-cyan-600 text-white'
              }`}>
                {msg.role === 'user' ? (
                  <span className="text-lg">{getAvatarContent(avatarSeed, null)}</span>
                ) : (
                  <Bot className="w-5 h-5" />
                )}
              </div>
              {/* Message bubble */}
              <div
                className={`max-w-[75%] ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-900 shadow-md'
                } rounded-2xl px-4 py-3`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                <span className={`text-xs ${msg.role === 'user' ? 'text-blue-100' : 'text-gray-400'} mt-1 block`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {typing && (
            <div className="flex justify-start">
              <div className="bg-white shadow-md rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-end gap-2">
            <button className="p-3 text-gray-400 hover:text-gray-600 transition-colors">
              <Paperclip className="w-5 h-5" />
            </button>

            <div className="flex-1">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                rows={1}
                className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                disabled={sending}
              />
            </div>

            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || sending}
              className="p-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-2xl hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {sending ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Powered By Badge */}
          <div className="text-center mt-3">
            <p className="text-xs text-gray-400">
              Powered by <span className="font-semibold text-blue-600">NexScout AI Engine</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
