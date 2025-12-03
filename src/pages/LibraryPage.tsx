import { useState, useEffect } from 'react';
import { ArrowLeft, MessageCircle, FileText, List, Star, Copy, Check, Trash2, Filter } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { messagingEngine } from '../services/ai/messagingEngine';
import { supabase } from '../lib/supabase';

interface LibraryPageProps {
  onBack: () => void;
}

export default function LibraryPage({ onBack }: LibraryPageProps) {
  const { profile } = useAuth();
  const [filter, setFilter] = useState<'all' | 'message' | 'sequence' | 'deck'>('all');
  const [library, setLibrary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadLibrary();
  }, [filter]);

  const loadLibrary = async () => {
    if (!profile?.id) return;

    setLoading(true);
    const result = await messagingEngine.getLibrary(
      profile.id,
      filter === 'all' ? undefined : filter
    );

    if (result.success) {
      setLibrary(result.library || []);
    }
    setLoading(false);
  };

  const handleCopy = (content: any) => {
    let textToCopy = '';

    if (typeof content === 'string') {
      textToCopy = content;
    } else if (content.message) {
      textToCopy = content.message;
    } else if (content.sequence) {
      textToCopy = content.sequence.map((s: any) => `Step ${s.step}: ${s.message}`).join('\n\n');
    } else if (content.deck) {
      textToCopy = content.deck.map((s: any) => `${s.title}\n${s.content}`).join('\n\n');
    } else {
      textToCopy = JSON.stringify(content, null, 2);
    }

    navigator.clipboard.writeText(textToCopy);
    setCopiedId(content.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item from your library?')) return;

    const { error } = await supabase.from('user_library').delete().eq('id', id);

    if (!error) {
      setLibrary(library.filter(item => item.id !== id));
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'message':
        return MessageCircle;
      case 'sequence':
        return List;
      case 'deck':
        return FileText;
      default:
        return Star;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-[#1877F2] to-[#1EC8FF] text-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <button
            onClick={onBack}
            className="flex items-center justify-center size-10 hover:bg-white/20 rounded-xl transition-colors mb-4"
          >
            <ArrowLeft className="size-5" />
          </button>

          <div>
            <h1 className="text-3xl font-bold mb-2">My Library</h1>
            <p className="text-white/90">Saved messages, sequences, and pitch decks</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {(['all', 'message', 'sequence', 'deck'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-shrink-0 px-6 py-3 rounded-xl font-medium text-sm transition-all ${
                filter === f
                  ? 'bg-[#1877F2] text-white shadow-lg shadow-blue-500/30'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {f === 'all' ? (
                <>
                  <Filter className="size-4 inline mr-2" />
                  All Items
                </>
              ) : (
                <>
                  {f === 'message' && <MessageCircle className="size-4 inline mr-2" />}
                  {f === 'sequence' && <List className="size-4 inline mr-2" />}
                  {f === 'deck' && <FileText className="size-4 inline mr-2" />}
                  {f.charAt(0).toUpperCase() + f.slice(1)}s
                </>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="size-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : library.length === 0 ? (
          <div className="text-center py-20">
            <div className="size-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Star className="size-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No saved items yet</h3>
            <p className="text-gray-600">
              Save your favorite messages, sequences, and decks for quick access later.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {library.map((item) => {
              const Icon = getIcon(item.content_type);

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="size-12 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center flex-shrink-0">
                        <Icon className="size-6 text-[#1877F2]" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-900">{item.title}</h3>
                          {item.is_favorite && <Star className="size-4 text-yellow-500 fill-yellow-500" />}
                        </div>
                        <p className="text-sm text-gray-600">
                          {item.content_type.charAt(0).toUpperCase() + item.content_type.slice(1)} • Created{' '}
                          {new Date(item.created_at).toLocaleDateString()}
                        </p>
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.tags.map((tag: string, i: number) => (
                              <span
                                key={i}
                                className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-lg"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 mb-4 max-h-40 overflow-y-auto">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {typeof item.content === 'string'
                        ? item.content
                        : item.content.message ||
                          JSON.stringify(item.content).substring(0, 200) + '...'}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopy(item)}
                      className="flex-1 px-4 py-2 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check className="size-4 text-green-600" />
                          <span className="text-green-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="size-4" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="px-4 py-2 rounded-xl border border-red-300 text-red-700 font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
