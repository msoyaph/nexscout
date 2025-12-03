import { useState, useEffect } from 'react';
import { X, FileText, Trash2, Edit, Clock, ChevronRight, Plus, Search, Archive, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface PitchDeck {
  id: string;
  title: string;
  company_name: string;
  industry: string;
  target_audience: string;
  content: any;
  status: 'draft' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
}

interface PitchDeckListProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadPitchDeck: (pitchDeck: PitchDeck) => void;
  onNewPitchDeck: () => void;
}

export default function PitchDeckList({ isOpen, onClose, onLoadPitchDeck, onNewPitchDeck }: PitchDeckListProps) {
  const { user } = useAuth();
  const [pitchDecks, setPitchDecks] = useState<PitchDeck[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'completed' | 'archived'>('all');

  useEffect(() => {
    if (isOpen && user) {
      loadPitchDecks();
    }
  }, [isOpen, user]);

  const loadPitchDecks = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('pitch_decks')
        .select('*')
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPitchDecks(data || []);
    } catch (error) {
      console.error('Error loading pitch decks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this pitch deck?')) return;

    try {
      const { error } = await supabase
        .from('pitch_decks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadPitchDecks();
    } catch (error) {
      console.error('Error deleting pitch deck:', error);
    }
  };

  const handleArchive = async (id: string, currentStatus: string, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      const newStatus = currentStatus === 'archived' ? 'draft' : 'archived';
      const { error } = await supabase
        .from('pitch_decks')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      loadPitchDecks();
    } catch (error) {
      console.error('Error archiving pitch deck:', error);
    }
  };

  const filteredPitchDecks = pitchDecks.filter(deck =>
    deck.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    deck.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'draft': return 'bg-yellow-100 text-yellow-700';
      case 'archived': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 transition-opacity"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">My Pitch Decks</h2>
              <button
                onClick={onClose}
                className="size-10 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
              >
                <X className="size-6 text-white" />
              </button>
            </div>

            <button
              onClick={() => {
                onNewPitchDeck();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-white text-blue-600 rounded-[16px] font-semibold text-sm hover:bg-blue-50 transition-colors"
            >
              <Plus className="size-5" />
              Create New Pitch Deck
            </button>
          </div>

          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search pitch decks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-[12px] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  filterStatus === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus('draft')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  filterStatus === 'draft'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                Drafts
              </button>
              <button
                onClick={() => setFilterStatus('completed')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  filterStatus === 'completed'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                Completed
              </button>
              <button
                onClick={() => setFilterStatus('archived')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  filterStatus === 'archived'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                Archived
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredPitchDecks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="size-12 text-gray-400 mb-3" />
                <p className="text-sm font-semibold text-gray-900 mb-1">
                  {searchQuery ? 'No pitch decks found' : 'No pitch decks yet'}
                </p>
                <p className="text-xs text-gray-600">
                  {searchQuery
                    ? 'Try a different search term'
                    : 'Create your first pitch deck to get started'}
                </p>
              </div>
            ) : (
              filteredPitchDecks.map((deck) => (
                <div
                  key={deck.id}
                  onClick={() => {
                    onLoadPitchDeck(deck);
                    onClose();
                  }}
                  className="bg-white rounded-[16px] p-4 border border-gray-200 hover:border-blue-600 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-sm text-gray-900 line-clamp-1">
                          {deck.title}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(deck.status)}`}>
                          {deck.status}
                        </span>
                      </div>
                      {deck.company_name && (
                        <p className="text-xs text-gray-600 mb-1">{deck.company_name}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {formatDate(deck.updated_at)}
                        </div>
                        {deck.industry && (
                          <span>• {deck.industry}</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="size-5 text-gray-400 shrink-0" />
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onLoadPitchDeck(deck);
                        onClose();
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="size-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={(e) => handleArchive(deck.id, deck.status, e)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Archive className="size-3.5" />
                      {deck.status === 'archived' ? 'Unarchive' : 'Archive'}
                    </button>
                    <button
                      onClick={(e) => handleDelete(deck.id, e)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-auto"
                    >
                      <Trash2 className="size-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="text-center text-xs text-gray-600">
              {filteredPitchDecks.length} pitch deck{filteredPitchDecks.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
