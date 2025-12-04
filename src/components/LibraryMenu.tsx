import { useState, useEffect } from 'react';
import { X, FileText, MessageSquare, FolderOpen, Filter, Search, Clock, CheckCircle2, Archive, Loader2, AlertCircle } from 'lucide-react';
import { libraryService, PitchDeck, MessageSequence } from '../services/libraryService';
import { useAuth } from '../contexts/AuthContext';

interface LibraryMenuProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'pitch_deck' | 'message_sequence';
  onSelectItem?: (id: string) => void;
  onEdit?: (id: string) => void;
  onView?: (id: string) => void;
}

export default function LibraryMenu({ isOpen, onClose, type, onSelectItem, onEdit, onView }: LibraryMenuProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<(PitchDeck | MessageSequence)[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (isOpen && user) {
      loadItems();
    }
  }, [isOpen, user, statusFilter]);

  const loadItems = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const filterStatus = statusFilter === 'all' ? undefined : statusFilter;

      if (type === 'pitch_deck') {
        const data = await libraryService.getAllPitchDecks(user.id, filterStatus);
        setItems(data);
      } else {
        const data = await libraryService.getAllMessageSequences(user.id, filterStatus);
        setItems(data);
      }
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (type === 'pitch_deck') {
        await libraryService.archivePitchDeck(id);
      } else {
        await libraryService.archiveMessageSequence(id);
      }
      loadItems();
    } catch (error) {
      console.error('Error archiving:', error);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      if (type === 'pitch_deck') {
        await libraryService.deletePitchDeck(id);
      } else {
        await libraryService.deleteMessageSequence(id);
      }
      loadItems();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ('company_name' in item && item.company_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      ('prospect_name' in item && item.prospect_name?.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesSearch;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'generating':
        return <Loader2 className="size-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle2 className="size-4 text-green-500" />;
      case 'archived':
        return <Archive className="size-4 text-slate-400" />;
      case 'draft':
        return <Clock className="size-4 text-orange-500" />;
      case 'active':
        return <CheckCircle2 className="size-4 text-blue-500" />;
      default:
        return <AlertCircle className="size-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'generating':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'archived':
        return 'bg-slate-50 text-slate-600 border-slate-200';
      case 'draft':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'active':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-fade-in" onClick={onClose} />

      <div className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center gap-3">
            {type === 'pitch_deck' ? (
              <div className="p-2.5 rounded-xl bg-blue-100">
                <FileText className="size-6 text-blue-600" />
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-purple-100">
                <MessageSquare className="size-6 text-purple-600" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {type === 'pitch_deck' ? 'Pitch Decks' : 'Message Sequences'}
              </h2>
              <p className="text-sm text-slate-500">{filteredItems.length} items</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="size-6 text-slate-600" />
          </button>
        </div>

        <div className="p-4 space-y-3 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {['all', 'draft', 'completed', 'active', 'generating', 'archived'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="size-8 text-blue-500 animate-spin mb-3" />
              <p className="text-slate-500">Loading...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FolderOpen className="size-12 text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">No items found</p>
              <p className="text-slate-400 text-sm mt-1">
                {searchQuery ? 'Try a different search' : 'Create your first item to get started'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onView?.(item.id)}
                  className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                        {item.title}
                      </h3>
                      {'company_name' in item && item.company_name && (
                        <p className="text-sm text-slate-500">{item.company_name}</p>
                      )}
                      {'prospect_name' in item && item.prospect_name && (
                        <p className="text-sm text-slate-500">{item.prospect_name}</p>
                      )}
                    </div>
                    <div className={`px-2 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 ${getStatusColor(item.status)}`}>
                      {getStatusIcon(item.status)}
                      {item.status}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                    <span className="text-xs text-slate-400">
                      {formatDate(item.created_at)}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit?.(item.id);
                        }}
                        className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                      >
                        Edit
                      </button>
                      {item.status !== 'archived' && (
                        <button
                          onClick={(e) => handleArchive(item.id, e)}
                          className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                          Archive
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDelete(item.id, e)}
                        className="px-3 py-1 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slide-in-right {
          animation: slideInRight 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
}
