import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Bot, User as UserIcon, Sparkles, Lightbulb, TrendingUp, MessageCircle, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { chatbotEngine } from '../services/ai/chatbotEngine';
import EnergyBar from '../components/EnergyBar';

interface AIChatbotPageProps {
  onBack: () => void;
  onNavigate?: (page: string) => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AIChatbotPage({ onBack, onNavigate }: AIChatbotPageProps) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      initializeChat();
    }
  }, [user]);

  const initializeChat = async () => {
    if (!user) return;

    try {
      // Get or create conversation
      const convId = await chatbotEngine.getOrCreateConversation(user.id, 'general');
      setConversationId(convId);

      // Load existing messages
      const history = await chatbotEngine.getConversationHistory(user.id, convId, 20);

      if (history.length === 0) {
        // Add welcome message
        const welcomeMsg: Message = {
          id: '1',
          role: 'assistant',
          content: `Hi ${profile?.full_name || 'there'}! 👋 I'm your AI sales assistant. I can help you with:\n\n• Sales strategies and tips\n• Prospect insights and analysis\n• Message crafting advice\n• Objection handling techniques\n• Pipeline management\n• Training and coaching\n\nWhat would you like help with today?`,
          timestamp: new Date()
        };
        setMessages([welcomeMsg]);
      } else {
        setMessages(history.map((msg: any) => ({
          id: Date.now().toString() + Math.random(),
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.timestamp)
        })));
      }
    } catch (error) {
      console.error('Error initializing chat:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const quickActions = [
    { icon: Lightbulb, label: 'Sales Tips', prompt: 'Give me 3 quick sales tips for today' },
    { icon: MessageCircle, label: 'Write Message', prompt: 'Help me write a prospecting message' },
    { icon: TrendingUp, label: 'Close Deal', prompt: 'How do I close this prospect?' }
  ];

  const handleSend = async () => {
    if (!input.trim() || loading || !user || !conversationId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setLoading(true);

    try {
      // Get AI response from chatbot engine
      const response = await chatbotEngine.generateResponse(
        user.id,
        currentInput,
        conversationId
      );

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);

      // Handle suggested actions
      if (response.actions && response.actions.length > 0) {
        // Could show action buttons here
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      // Fallback to local response
      const fallbackResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateAIResponse(currentInput),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, fallbackResponse]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
  };

  const generateAIResponse = (userInput: string): string => {
    const lowerInput = userInput.toLowerCase();

    if (lowerInput.includes('tip') || lowerInput.includes('advice')) {
      return `Here are 3 powerful sales tips for you:\n\n1. **Lead with Value** - Always start conversations by addressing the prospect's pain points, not your product features.\n\n2. **Ask Better Questions** - Use open-ended questions to understand their real needs. "What challenges are you facing with...?" works better than "Do you need...?"\n\n3. **Follow Up Consistently** - 80% of sales require 5+ follow-ups. Set reminders and vary your approach each time.\n\nWould you like specific scripts or strategies for any of these?`;
    }

    if (lowerInput.includes('message') || lowerInput.includes('write')) {
      return `I can help you craft a compelling message! To personalize it, tell me:\n\n• Who is the prospect? (name, role, company)\n• What's their main pain point or interest?\n• What action do you want them to take?\n\nOr I can generate a general template based on your NexScout prospect data. What would you prefer?`;
    }

    if (lowerInput.includes('close') || lowerInput.includes('deal')) {
      return `Here's a proven closing framework:\n\n**The Assumptive Close**\n"Based on everything we've discussed, it sounds like this is a great fit for you. When would you like to get started - this week or next?"\n\n**Key principles:**\n• Assume the sale\n• Give two positive options\n• Address final objections confidently\n• Create urgency without pressure\n\nWhat stage is your prospect at? I can give more specific advice!`;
    }

    if (lowerInput.includes('objection')) {
      return `Let me help you handle objections! The most common ones are:\n\n1. **"I don't have time"** → Empathize, then reframe as time investment for future freedom\n2. **"Too expensive"** → Shift to value and ROI, not price\n3. **"I need to think"** → Uncover the real concern, address it directly\n\nWhich objection are you facing? I'll give you a word-for-word script!`;
    }

    return `Great question! I'm here to help with:\n\n• Sales strategies and techniques\n• Prospect analysis and insights\n• Message and script writing\n• Objection handling\n• Pipeline management\n• Training and development\n\nCould you tell me more about what you need? The more specific you are, the better I can assist you!`;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-green-600 flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">AI Sales Assistant</h1>
                <p className="text-xs text-gray-500">Always ready to help</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate?.('ai-chatbot-settings')}
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200"
            >
              <Settings className="w-5 h-5" />
            </button>
            <EnergyBar onEnergyClick={() => onNavigate?.('energy-refill')} compact />
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
            {message.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-green-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
            )}
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-900'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
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
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                <UserIcon className="w-5 h-5 text-gray-600" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-green-600 flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
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

      {/* Quick Actions */}
      {messages.length <= 2 && (
        <div className="px-6 pb-4">
          <div className="grid grid-cols-3 gap-2">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickAction(action.prompt)}
                className="flex flex-col items-center gap-2 p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <action.icon className="w-5 h-5 text-blue-600" />
                <span className="text-xs font-medium text-gray-700 text-center">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about sales..."
              className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              rows={1}
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
            {input.length > 0 && (
              <div className="absolute right-3 bottom-3 text-xs text-gray-400">
                {input.length}
              </div>
            )}
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="flex items-center justify-center w-11 h-11 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          💡 Normal chat is free - no energy cost!
        </p>
      </div>
    </div>
  );
}
