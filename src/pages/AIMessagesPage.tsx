import { useState, useEffect } from 'react';
import {
  ArrowLeft, Search, Sparkles, MessageSquare, Trash2, Copy, Check,
  Filter, Plus, Star, Clock, User, Coins, Home, Users,
  TrendingUp, MoreHorizontal, Send, Heart, Eye
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import SlideInMenu from '../components/SlideInMenu';

interface AIMessagesPageProps {
  onNavigateToHome?: () => void;
  onNavigateToProspects?: () => void;
  onNavigateToPipeline?: () => void;
  onNavigateToMore?: () => void;
  onNavigate?: (page: string) => void;
}

interface AIMessage {
  id: string;
  title: string;
  message_content: string;
  message_type: string;
  language: string;
  scenario: string;
  prospect_name?: string;
  is_favorite: boolean;
  times_used: number;
  created_at: string;
}

export default function AIMessagesPage({
  onNavigateToHome,
  onNavigateToProspects,
  onNavigateToPipeline,
  onNavigateToMore,
  onNavigate,
}: AIMessagesPageProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'favorite' | 'recent'>('all');
  const [selectedMessage, setSelectedMessage] = useState<AIMessage | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [coinBalance, setCoinBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadMessages();
      loadCoinBalance();
    }
  }, [user, filterType]);

  const loadCoinBalance = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('coin_balance')
      .eq('id', user.id)
      .single();

    if (data) {
      setCoinBalance(data.coin_balance || 0);
    }
  };

  const loadMessages = async () => {
    if (!user) return;
    setLoading(true);

    let query = supabase
      .from('ai_messages_library')
      .select('*')
      .eq('user_id', user.id);

    if (filterType === 'favorite') {
      query = query.eq('is_favorite', true);
    }

    query = query.order('created_at', { ascending: false });

    const { data } = await query;
    setMessages(data || []);
    setLoading(false);
  };

  const handleCopy = async (message: AIMessage) => {
    await navigator.clipboard.writeText(message.message_content);
    setCopiedId(message.id);

    // Update times_used
    await supabase
      .from('ai_messages_library')
      .update({ times_used: message.times_used + 1 })
      .eq('id', message.id);

    setTimeout(() => setCopiedId(null), 2000);
    loadMessages(); // Refresh to show updated count
  };

  const toggleFavorite = async (message: AIMessage) => {
    await supabase
      .from('ai_messages_library')
      .update({ is_favorite: !message.is_favorite })
      .eq('id', message.id);

    loadMessages();
  };

  const handleDelete = async (messageId: string) => {
    if (!confirm('Delete this message?')) return;

    await supabase
      .from('ai_messages_library')
      .delete()
      .eq('id', messageId);

    setSelectedMessage(null);
    loadMessages();
  };

  const filteredMessages = messages.filter(
    (msg) =>
      msg.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.message_content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.prospect_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const messageTypeColors: Record<string, string> = {
    outreach: 'bg-blue-100 text-blue-700',
    followup: 'bg-green-100 text-green-700',
    objection: 'bg-orange-100 text-orange-700',
    revival: 'bg-purple-100 text-purple-700',
    referral: 'bg-pink-100 text-pink-700',
    booking: 'bg-indigo-100 text-indigo-700',
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      {/* Facebook-inspired Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <button
                onClick={onNavigateToHome}
                className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AI Messages</h1>
                <p className="text-xs text-gray-500">{filteredMessages.length} messages</p>
              </div>
            </div>

            {/* Coin Wallet Balance */}
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-full border border-yellow-200">
              <Coins className="w-5 h-5 text-yellow-600" />
              <span className="text-sm font-bold text-yellow-900">{coinBalance.toLocaleString()}</span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-gray-100 border-0 rounded-full text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 px-4 pb-3 overflow-x-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
              filterType === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Messages
          </button>
          <button
            onClick={() => setFilterType('favorite')}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              filterType === 'favorite'
                ? 'bg-pink-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Star className="w-4 h-4" />
            Favorites
          </button>
          <button
            onClick={() => setFilterType('recent')}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              filterType === 'recent'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            Recent
          </button>
        </div>
      </header>

      {/* Messages Feed */}
      <main className="px-4 py-4 pb-24">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-gray-500">Loading messages...</p>
            </div>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <MessageSquare className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No Messages Yet</h3>
            <p className="text-sm text-gray-500 text-center max-w-sm mb-6">
              Generate AI messages from the Messaging Hub to save them here
            </p>
            <button
              onClick={() => onNavigate?.('messaging-hub')}
              className="px-6 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Message
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMessages.map((message) => (
              <div
                key={message.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                {/* Message Header */}
                <div className="p-4 pb-3">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            messageTypeColors[message.message_type] || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {message.message_type}
                        </span>
                        {message.language !== 'english' && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                            {message.language}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-gray-900">{message.title}</h3>
                      {message.prospect_name && (
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <User className="w-3.5 h-3.5" />
                          {message.prospect_name}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => toggleFavorite(message)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          message.is_favorite
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-400'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Message Content */}
                  <div
                    className={`text-sm text-gray-700 leading-relaxed ${
                      selectedMessage?.id === message.id ? '' : 'line-clamp-3'
                    }`}
                  >
                    {message.message_content}
                  </div>

                  {message.message_content.length > 150 && (
                    <button
                      onClick={() =>
                        setSelectedMessage(selectedMessage?.id === message.id ? null : message)
                      }
                      className="text-sm text-blue-600 font-semibold mt-2 hover:underline"
                    >
                      {selectedMessage?.id === message.id ? 'Show less' : 'Show more'}
                    </button>
                  )}
                </div>

                {/* Message Actions */}
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-t border-gray-100">
                  <button
                    onClick={() => handleCopy(message)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                      copiedId === message.id
                        ? 'bg-green-100 text-green-700'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {copiedId === message.id ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1 px-3 py-2 bg-white rounded-lg border border-gray-200">
                    <Eye className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-700">{message.times_used}</span>
                  </div>

                  <button
                    onClick={() => handleDelete(message.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>

                {/* Timestamp */}
                <div className="px-4 py-2 bg-white border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    {new Date(message.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <button
        onClick={() => onNavigate?.('messaging-hub')}
        className="fixed bottom-24 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center z-30 hover:scale-110 active:scale-95"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg">
        <div className="flex items-center justify-between px-6 h-18">
          <button
            onClick={onNavigateToHome}
            className="flex flex-col items-center gap-1 text-gray-400 hover:text-blue-600 transition-colors"
          >
            <Home className="w-6 h-6" />
            <span className="text-xs font-medium">Home</span>
          </button>
          <button
            onClick={onNavigateToProspects}
            className="flex flex-col items-center gap-1 text-gray-400 hover:text-blue-600 transition-colors"
          >
            <Users className="w-6 h-6" />
            <span className="text-xs font-medium">Prospects</span>
          </button>
          <button
            onClick={() => onNavigate?.('chatbot-sessions')}
            className="relative -top-6 bg-[#1877F2] text-white w-14 h-14 rounded-full shadow-[0px_8px_24px_rgba(24,119,242,0.4)] flex items-center justify-center border-4 border-white transition-transform active:scale-95"
          >
            <MessageSquare className="w-7 h-7" />
          </button>
          <button
            onClick={onNavigateToPipeline}
            className="flex flex-col items-center gap-1 text-gray-400 hover:text-blue-600 transition-colors"
          >
            <TrendingUp className="w-6 h-6" />
            <span className="text-xs font-medium">Pipeline</span>
          </button>
          <button
            onClick={() => setMenuOpen(true)}
            className="flex flex-col items-center gap-1 text-gray-400 hover:text-blue-600 transition-colors"
          >
            <MoreHorizontal className="w-6 h-6" />
            <span className="text-xs font-medium">More</span>
          </button>
        </div>
      </nav>

      <SlideInMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={(page) => {
          setMenuOpen(false);
          onNavigate?.(page);
        }}
      />
    </div>
  );
}
