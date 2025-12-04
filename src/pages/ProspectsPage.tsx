import { useState, useEffect } from 'react';
import { Settings, Search, Filter, Eye, Calendar, Home, Users, MessageSquare, TrendingUp, ArrowLeft, MoreVertical, MoreHorizontal, Star, UserPlus } from 'lucide-react';
import ActionPopup from '../components/ActionPopup';
import SlideInMenu from '../components/SlideInMenu';
import ProspectAvatar from '../components/ProspectAvatar';
import NotificationBadge from '../components/NotificationBadge';
import AddProspectManuallyModal from '../components/AddProspectManuallyModal';
import ProspectActionsMenu from '../components/ProspectActionsMenu';
import EditProspectModal from '../components/EditProspectModal';
import { useNotificationCounts } from '../hooks/useNotificationCounts';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ProspectsPageProps {
  onBack: () => void;
  onNavigate: (page: string, options?: any) => void;
  onNavigateToPitchDeck?: () => void;
  onNavigateToMessageSequencer?: () => void;
  onNavigateToRealTimeScan?: () => void;
  onNavigateToDeepScan?: () => void;
}

export default function ProspectsPage({
  onBack,
  onNavigate,
  onNavigateToPitchDeck,
  onNavigateToMessageSequencer,
  onNavigateToRealTimeScan,
  onNavigateToDeepScan
}: ProspectsPageProps) {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showActionPopup, setShowActionPopup] = useState(false);
  const notificationCounts = useNotificationCounts();
  const [menuOpen, setMenuOpen] = useState(false);
  const [prospects, setProspects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProspectId, setEditingProspectId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadProspects();
    }
  }, [user]);

  async function loadProspects() {
    try {
      const { data, error } = await supabase
        .from('prospects')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedProspects = (data || []).map((p: any) => ({
        id: p.id,
        name: p.full_name,
        username: p.username || `@${p.full_name.toLowerCase().replace(/\s+/g, '')}`,
        avatar: p.profile_image_url,
        uploaded_image_url: p.uploaded_image_url,
        social_image_url: p.social_image_url,
        avatar_seed: p.avatar_seed,
        full_name: p.full_name,
        score: p.metadata?.scout_score || 0,
        tags: p.metadata?.tags || [],
        analysis: p.metadata?.notes || p.bio_text || 'No analysis available',
        lastActive: getTimeAgo(p.last_seen_activity_at),
        temperature: p.metadata?.bucket || p.metadata?.temperature || 'warm',
        platform: p.platform,
        pipeline_stage: p.pipeline_stage,
      }));

      setProspects(formattedProspects);
    } catch (error) {
      console.error('Error loading prospects:', error);
    } finally {
      setLoading(false);
    }
  }

  function getTimeAgo(date: string) {
    if (!date) return 'New';
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return `${Math.floor(diffDays / 7)}w`;
  }

  const filteredProspects = prospects.filter(prospect => {
    const matchesSearch = prospect.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         prospect.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'all' ||
                         (activeFilter === 'hot' && prospect.score >= 80) ||
                         (activeFilter === 'warm' && prospect.score >= 50 && prospect.score < 80) ||
                         (activeFilter === 'cold' && prospect.score < 50) ||
                         prospect.platform === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const getScoreBadgeClass = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-700';
    if (score >= 50) return 'bg-orange-100 text-orange-700';
    return 'bg-gray-100 text-gray-600';
  };

  const getTemperatureBadge = (score: number) => {
    if (score >= 80) return { emoji: '🔥', text: 'Hot Lead', class: 'bg-red-50 text-red-700' };
    if (score >= 50) return { emoji: '💡', text: 'Warm', class: 'bg-orange-50 text-orange-700' };
    return { emoji: '❄️', text: 'Cold', class: 'bg-blue-50 text-blue-700' };
  };

  return (
    <div className="bg-[#F0F2F5] min-h-screen">
      {/* Fixed Header - Facebook Style */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              <h1 className="text-xl font-bold text-gray-900">Prospects</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Add Prospect Manually"
              >
                <UserPlus className="w-5 h-5 text-gray-700" />
              </button>
              <button
                onClick={() => setMenuOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Settings className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-gray-100 rounded-full px-4 py-2 flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search prospects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs - Facebook Style */}
      <div className="bg-white border-b border-gray-200 sticky top-[73px] z-10">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mb-px">
            <button
              onClick={() => setActiveFilter('all')}
              className={`flex-shrink-0 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeFilter === 'all'
                  ? 'text-[#1877F2] border-[#1877F2]'
                  : 'text-gray-500 border-transparent hover:bg-gray-50'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveFilter('hot')}
              className={`flex-shrink-0 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeFilter === 'hot'
                  ? 'text-[#1877F2] border-[#1877F2]'
                  : 'text-gray-500 border-transparent hover:bg-gray-50'
              }`}
            >
              🔥 Hot
            </button>
            <button
              onClick={() => setActiveFilter('warm')}
              className={`flex-shrink-0 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeFilter === 'warm'
                  ? 'text-[#1877F2] border-[#1877F2]'
                  : 'text-gray-500 border-transparent hover:bg-gray-50'
              }`}
            >
              💡 Warm
            </button>
            <button
              onClick={() => setActiveFilter('cold')}
              className={`flex-shrink-0 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeFilter === 'cold'
                  ? 'text-[#1877F2] border-[#1877F2]'
                  : 'text-gray-500 border-transparent hover:bg-gray-50'
              }`}
            >
              ❄️ Cold
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Facebook Style Cards */}
      <div className="max-w-2xl mx-auto">
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-[#1877F2] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {!loading && prospects.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center m-4">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No prospects yet</h3>
            <p className="text-sm text-gray-500 mb-4">Start scanning to discover prospects</p>
            <button
              onClick={() => onNavigate('scan-entry')}
              className="px-6 py-2 bg-[#1877F2] text-white rounded-lg text-sm font-semibold hover:bg-[#166FE5] transition-colors"
            >
              Start Scanning
            </button>
          </div>
        )}

        {!loading && prospects.length > 0 && filteredProspects.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center m-4">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-sm text-gray-500">No prospects match your search</p>
          </div>
        )}

        {!loading && filteredProspects.map((prospect) => {
          const tempBadge = getTemperatureBadge(prospect.score);

          return (
            <div
              key={prospect.id}
              className="bg-white border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => onNavigate('prospect-detail', { prospectId: prospect.id })}
            >
              <div className="px-4 py-3">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <ProspectAvatar
                      prospect={{
                        id: prospect.id,
                        full_name: prospect.full_name,
                        uploaded_image_url: prospect.uploaded_image_url,
                        social_image_url: prospect.social_image_url,
                        avatar_seed: prospect.avatar_seed
                      }}
                      size="lg"
                      className="shadow-sm"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 text-base truncate">
                            {prospect.name}
                          </h3>
                          {prospect.score >= 80 && (
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500 truncate">{prospect.username}</p>
                      </div>

                      <ProspectActionsMenu
                        prospectId={prospect.id}
                        prospectName={prospect.name}
                        onDelete={() => loadProspects()}
                        onEdit={() => {
                          setEditingProspectId(prospect.id);
                          setShowEditModal(true);
                        }}
                        onMoveToPipeline={() => {
                          loadProspects();
                        }}
                        onAutoFollowUp={() => {
                          // Auto follow-up activated
                        }}
                      />
                    </div>

                    {/* Tags and Score */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${tempBadge.class}`}>
                        <span>{tempBadge.emoji}</span>
                        <span>{tempBadge.text}</span>
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getScoreBadgeClass(prospect.score)}`}>
                        {prospect.score} Score
                      </span>
                      {prospect.tags.slice(0, 2).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Analysis Preview */}
                    {prospect.analysis && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {prospect.analysis}
                      </p>
                    )}

                    {/* Meta Info */}
                    <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {prospect.lastActive}
                      </span>
                      {prospect.platform && (
                        <span className="capitalize">· {prospect.platform}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Helper Tip Card */}
        {!loading && filteredProspects.length > 0 && (
          <div className="bg-white m-4 mt-2 rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-[#1877F2]" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 text-sm mb-1">Pro Tip</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Tap any prospect to view detailed insights, send messages, or add them to your pipeline.
                  Hot leads with 80+ scores are your best opportunities!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Spacing */}
        <div className="h-20"></div>
      </div>

      {/* Bottom Navigation - Facebook Style */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-around">
          <button
            onClick={() => onNavigate('home')}
            className="flex flex-col items-center gap-1 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <Home className="w-6 h-6" />
            <span className="text-[10px] font-medium">Home</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-[#1877F2] relative">
            <div className="relative">
              <Users className="w-6 h-6" />
              <NotificationBadge count={notificationCounts.newProspects} />
            </div>
            <span className="text-[10px] font-medium">Prospects</span>
          </button>
          <button
            onClick={() => onNavigate('chatbot-sessions')}
            className="relative -top-6 bg-[#1877F2] text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center border-4 border-white transition-transform active:scale-95"
          >
            <MessageSquare className="w-7 h-7" />
            {notificationCounts.newChats > 0 && (
              <div className="absolute -top-1 -right-1 min-w-[20px] h-[20px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1.5 border-2 border-white shadow-sm">
                {notificationCounts.newChats > 99 ? '99+' : notificationCounts.newChats}
              </div>
            )}
          </button>
          <button
            onClick={() => onNavigate('pipeline')}
            className="flex flex-col items-center gap-1 text-gray-500 hover:text-gray-900 transition-colors relative"
          >
            <div className="relative">
              <TrendingUp className="w-6 h-6" />
              <NotificationBadge count={notificationCounts.pipelineUpdates} />
            </div>
            <span className="text-[10px] font-medium">Pipeline</span>
          </button>
          <button
            onClick={() => setMenuOpen(true)}
            className="flex flex-col items-center gap-1 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <MoreHorizontal className="w-6 h-6" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* Slide-in Menu */}
      <SlideInMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={onNavigate}
        onNavigateToPitchDeck={onNavigateToPitchDeck}
        onNavigateToMessageSequencer={onNavigateToMessageSequencer}
        onNavigateToRealTimeScan={onNavigateToRealTimeScan}
        onNavigateToDeepScan={onNavigateToDeepScan}
      />

      {/* Action Popup */}
      <ActionPopup isOpen={showActionPopup} onClose={() => setShowActionPopup(false)} />

      {/* Add Prospect Modal */}
      <AddProspectManuallyModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onProspectAdded={() => {
          loadProspects();
        }}
      />

      {/* Edit Prospect Modal */}
      {editingProspectId && (
        <EditProspectModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingProspectId(null);
          }}
          prospectId={editingProspectId}
          onProspectUpdated={() => {
            loadProspects();
          }}
        />
      )}
    </div>
  );
}
