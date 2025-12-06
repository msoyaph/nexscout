import { useState, useEffect } from 'react';
import { ArrowLeft, ChevronRight, MoreHorizontal, MessageCircle, Eye, Trash2, Facebook, Bot, Sparkles, Users, TrendingUp, BarChart3 } from 'lucide-react';
import ProspectAvatar from '../components/ProspectAvatar';
import AIPipelineControlPanel from '../components/AIPipelineControlPanel';
import PipelineWalletDisplay from '../components/PipelineWalletDisplay';
import CoinPurchaseModal from '../components/CoinPurchaseModal';
import AutomationQuotaModal from '../components/AutomationQuotaModal';
import ProspectProgressModal from '../components/ProspectProgressModal';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface PipelinePageProps {
  onBack: () => void;
  onNavigate: (page: string) => void;
}

interface ProspectCard {
  id: string;
  name: string;
  full_name: string;
  uploaded_image_url?: string | null;
  social_image_url?: string | null;
  avatar_seed?: string | null;
  score: number;
  platform: string;
  lastContact: string;
  pipeline_stage: string;
}

export default function PipelinePage({ onBack, onNavigate }: PipelinePageProps) {
  const { user } = useAuth();
  const [prospects, setProspects] = useState<ProspectCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [movingProspect, setMovingProspect] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<ProspectCard | null>(null);

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

      // Get last message timestamps for all prospects
      const prospectIds = (data || []).map((p: any) => p.id);
      
      // Query omnichannel messages for last contact (only if we have prospects)
      let lastMessages: any[] = [];
      if (prospectIds.length > 0) {
        const { data: messagesData } = await supabase
          .from('omnichannel_messages')
          .select('prospect_id, created_at')
          .in('prospect_id', prospectIds)
          .order('created_at', { ascending: false });
        lastMessages = messagesData || [];
      }

      // Query chat sessions linked to prospects (only if we have prospects)
      let pipelineLinks: any[] = [];
      if (prospectIds.length > 0) {
        const { data: linksData } = await supabase
          .from('chatbot_to_prospect_pipeline')
          .select('prospect_id, public_chat_sessions(last_message_at)')
          .in('prospect_id', prospectIds);
        pipelineLinks = linksData || [];
      }

      // Create a map of prospect_id to last contact time
      const lastContactMap = new Map<string, string>();
      
      // Process omnichannel messages
      if (lastMessages) {
        lastMessages.forEach((msg: any) => {
          if (!lastContactMap.has(msg.prospect_id) || 
              new Date(msg.created_at) > new Date(lastContactMap.get(msg.prospect_id) || '')) {
            lastContactMap.set(msg.prospect_id, msg.created_at);
          }
        });
      }

      // Process chat session messages
      if (pipelineLinks) {
        pipelineLinks.forEach((link: any) => {
          const chatSession = link.public_chat_sessions;
          if (chatSession?.last_message_at) {
            const prospectId = link.prospect_id;
            const existingTime = lastContactMap.get(prospectId);
            if (!existingTime || new Date(chatSession.last_message_at) > new Date(existingTime)) {
              lastContactMap.set(prospectId, chatSession.last_message_at);
            }
          }
        });
      }

      const formatted = (data || []).map((p: any) => {
        // Get last contact from messages, metadata, or last_seen_activity_at
        const lastMessageTime = lastContactMap.get(p.id);
        const metadataTime = p.metadata?.last_contact;
        const activityTime = p.last_seen_activity_at;
        
        // Use the most recent timestamp available
        const timestamps = [lastMessageTime, metadataTime, activityTime].filter(Boolean);
        const lastContactTime = timestamps.length > 0
          ? timestamps.reduce((latest, current) => 
              new Date(current || '') > new Date(latest || '') ? current : latest
            )
          : null;

        return {
          id: p.id,
          name: p.full_name,
          full_name: p.full_name,
          uploaded_image_url: p.uploaded_image_url,
          social_image_url: p.social_image_url,
          avatar_seed: p.avatar_seed,
          score: p.metadata?.scout_score || 0,
          platform: p.platform,
          lastContact: getTimeAgo(lastContactTime),
          pipeline_stage: p.pipeline_stage || 'discover',
        };
      });

      setProspects(formatted);
    } catch (error) {
      console.error('Error loading prospects:', error);
    } finally {
      setLoading(false);
    }
  }

  function getTimeAgo(date: string) {
    if (!date) return 'Never';
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return `${Math.floor(diffMs / (1000 * 60))}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays === 1) return '1d';
    return `${diffDays}d`;
  }

  async function moveProspect(prospectId: string, newStage: string) {
    setMovingProspect(prospectId);
    try {
      const { error } = await supabase
        .from('prospects')
        .update({ pipeline_stage: newStage })
        .eq('id', prospectId);

      if (error) throw error;

      setProspects(prev =>
        prev.map(p => (p.id === prospectId ? { ...p, pipeline_stage: newStage } : p))
      );
    } catch (error) {
      console.error('Error moving prospect:', error);
    } finally {
      setMovingProspect(null);
    }
  }

  async function deleteProspect(prospectId: string) {
    if (!confirm('Are you sure you want to delete this prospect?')) return;

    try {
      const { error } = await supabase
        .from('prospects')
        .delete()
        .eq('id', prospectId);

      if (error) throw error;

      setProspects(prev => prev.filter(p => p.id !== prospectId));
      setOpenMenuId(null);
    } catch (error) {
      console.error('Error deleting prospect:', error);
      alert('Failed to delete prospect');
    }
  }

  const stages = [
    { key: 'discover', name: 'Discover', color: 'bg-blue-500', bgLight: 'bg-blue-50', textColor: 'text-blue-700' },
    { key: 'engage', name: 'Engage', color: 'bg-amber-500', bgLight: 'bg-amber-50', textColor: 'text-amber-700' },
    { key: 'qualify', name: 'Qualify', color: 'bg-purple-500', bgLight: 'bg-purple-50', textColor: 'text-purple-700' },
    { key: 'nurture', name: 'Nurture', color: 'bg-green-500', bgLight: 'bg-green-50', textColor: 'text-green-700' },
    { key: 'close', name: 'Close', color: 'bg-emerald-500', bgLight: 'bg-emerald-50', textColor: 'text-emerald-700' },
    { key: 'won', name: 'Won', color: 'bg-green-600', bgLight: 'bg-green-50', textColor: 'text-green-800' },
  ];

  const getStageProspects = (stageKey: string) =>
    prospects.filter(p => p.pipeline_stage === stageKey);

  const getNextStage = (currentStage: string) => {
    const idx = stages.findIndex(s => s.key === currentStage);
    return idx >= 0 && idx < stages.length - 1 ? stages[idx + 1].key : null;
  };

  const ProspectCard = ({ prospect, stage }: { prospect: ProspectCard; stage: string }) => {
    const nextStage = getNextStage(stage);
    const isMenuOpen = openMenuId === prospect.id;
    
    // SuperAdmin access for development
    const isSuperAdmin = user?.email === 'geoffmax22@gmail.com';

    return (
      <div className="relative bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
        {/* Header */}
        <div className="p-3 pb-2">
          <div className="flex items-start gap-2 mb-2">
            <ProspectAvatar
              uploadedImageUrl={prospect.uploaded_image_url}
              socialImageUrl={prospect.social_image_url}
              avatarSeed={prospect.avatar_seed}
              fullName={prospect.full_name}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-gray-900 truncate">{prospect.name}</h3>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                {prospect.platform === 'facebook' && <Facebook className="w-3 h-3 text-blue-600" />}
                <span className="truncate">{prospect.platform}</span>
              </div>
            </div>
            <div className="relative">
              <button
                onClick={() => setOpenMenuId(isMenuOpen ? null : prospect.id)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <MoreHorizontal className="w-4 h-4 text-gray-600" />
              </button>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setOpenMenuId(null)}
                  />
                  <div className="absolute right-0 top-8 z-20 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1">
                    <button
                      onClick={() => {
                        onNavigate('prospect-detail', { prospectId: prospect.id });
                        setOpenMenuId(null);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View Prospect
                    </button>
                    <button
                      onClick={() => deleteProspect(prospect.id)}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Score & Last Contact */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 bg-gray-100 rounded-full h-1.5">
              <div
                className="bg-[#1877F2] h-1.5 rounded-full transition-all"
                style={{ width: `${prospect.score}%` }}
              />
            </div>
            <span className="text-xs font-bold text-gray-600">{prospect.score}</span>
          </div>

          {/* Last Contact */}
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
            <MessageCircle className="w-3 h-3" />
            <span>{prospect.lastContact}</span>
          </div>

          {/* AI Smart Recommendation - PREMIUM FEATURE */}
          {prospect.score >= 70 && stage === 'engage' && (
            <div className="mb-2 px-2 py-1.5 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-1 mb-1">
                <Sparkles className="w-3 h-3 text-purple-600" />
                <span className="text-[10px] font-bold text-purple-900 uppercase">AI Suggests</span>
              </div>
              <p className="text-xs text-gray-700 leading-tight">
                <strong>Follow-Up</strong> – High score, send message now
              </p>
            </div>
          )}
          {prospect.score >= 75 && stage === 'qualify' && (
            <div className="mb-2 px-2 py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-1 mb-1">
                <Sparkles className="w-3 h-3 text-green-600" />
                <span className="text-[10px] font-bold text-green-900 uppercase">AI Suggests</span>
              </div>
              <p className="text-xs text-gray-700 leading-tight">
                <strong>Book Meeting</strong> – Ready to close, schedule call
              </p>
            </div>
          )}
          {prospect.score < 50 && (stage === 'engage' || stage === 'qualify') && (
            <div className="mb-2 px-2 py-1.5 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-1 mb-1">
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span className="text-[10px] font-bold text-amber-900 uppercase">AI Suggests</span>
              </div>
              <p className="text-xs text-gray-700 leading-tight">
                <strong>Nurture</strong> – Score low, build trust first
              </p>
            </div>
          )}

          {/* See Progress Button - SuperAdmin Only */}
          <button
            onClick={() => {
              if (isSuperAdmin) {
                setSelectedProspect(prospect);
                setShowProgressModal(true);
              }
            }}
            disabled={!isSuperAdmin}
            className={`w-full py-2 mb-2 rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-1.5 ${
              isSuperAdmin
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 hover:shadow-md cursor-pointer'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-60'
            }`}
            title={!isSuperAdmin ? 'This feature is currently in development' : 'View prospect progress'}
          >
            <Sparkles className="w-4 h-4" />
            See Progress
          </button>

          {/* Action Button */}
          {nextStage ? (
            <button
              onClick={() => moveProspect(prospect.id, nextStage)}
              disabled={movingProspect === prospect.id}
              className="w-full py-2 bg-[#1877F2] text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
            >
              {movingProspect === prospect.id ? (
                'Moving...'
              ) : (
                <>
                  Next <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => onNavigate(`prospect-detail-${prospect.id}`)}
              className="w-full py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
            >
              <Eye className="w-4 h-4" />
              View
            </button>
          )}
        </div>
      </div>
    );
  };

  const discoverProspects = getStageProspects('discover');
  const engageProspects = getStageProspects('engage');
  const qualifyProspects = getStageProspects('qualify');
  const nurtureProspects = getStageProspects('nurture');
  const closeProspects = getStageProspects('close');
  const wonProspects = getStageProspects('won');

  const totalProspects = prospects.length;
  const conversionRate = totalProspects > 0 ? Math.round((wonProspects.length / totalProspects) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      {/* Facebook-Inspired Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="px-4 py-2.5 flex items-center justify-between max-w-screen-2xl mx-auto">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>

            <div className="flex items-center gap-2">
              <div>
                <h1 className="text-lg font-bold text-gray-900">Pipeline</h1>
                <p className="text-xs text-gray-500">{totalProspects} total prospects</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="hidden md:flex items-center gap-4 ml-4 pl-4 border-l border-gray-200">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
                <Users className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-xs text-gray-600">Active</p>
                  <p className="text-sm font-bold text-gray-900">{totalProspects - wonProspects.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <div>
                  <p className="text-xs text-gray-600">Won Rate</p>
                  <p className="text-sm font-bold text-gray-900">{conversionRate}%</p>
                </div>
              </div>
              {/* Premium Automation Quota */}
              <div className="ml-2">
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            <PipelineWalletDisplay onPurchaseClick={() => setShowPurchaseModal(true)} />
          </div>
        </div>
      </header>

      {/* Content */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-[#1877F2] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-gray-600 mt-4">Loading pipeline...</p>
          </div>
        </div>
      ) : prospects.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No prospects yet</h3>
            <p className="text-sm text-gray-600 mb-4">Start scanning to add prospects to your pipeline</p>
            <button
              onClick={() => onNavigate('prospects')}
              className="px-6 py-2 bg-[#1877F2] text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition-colors"
            >
              Go to Prospects
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto pb-24">
          <div className="flex gap-3 p-4 min-h-full">
            {/* Discover Stage */}
            <div className="flex flex-col w-56 shrink-0">
              <div className="bg-white rounded-t-2xl border border-gray-200 px-3 py-2.5 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 bg-blue-500 rounded-full" />
                  <h2 className="font-bold text-sm text-gray-900">Discover</h2>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  {discoverProspects.length}
                </span>
              </div>
              <div className="flex-1 bg-blue-50/50 border-l border-r border-b border-gray-200 rounded-b-2xl p-2 space-y-2 overflow-y-auto min-h-[400px]">
                {discoverProspects.length === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-500">
                    No prospects
                  </div>
                ) : (
                  discoverProspects.map((prospect) => (
                    <ProspectCard key={prospect.id} prospect={prospect} stage="discover" />
                  ))
                )}
              </div>
            </div>

            {/* Engage Stage */}
            <div className="flex flex-col w-56 shrink-0">
              <div className="bg-white rounded-t-2xl border border-gray-200 px-3 py-2.5 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 bg-amber-500 rounded-full" />
                  <h2 className="font-bold text-sm text-gray-900">Engage</h2>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  {engageProspects.length}
                </span>
              </div>
              <div className="flex-1 bg-amber-50/50 border-l border-r border-b border-gray-200 rounded-b-2xl p-2 space-y-2 overflow-y-auto min-h-[400px]">
                {engageProspects.length === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-500">
                    No prospects
                  </div>
                ) : (
                  engageProspects.map((prospect) => (
                    <ProspectCard key={prospect.id} prospect={prospect} stage="engage" />
                  ))
                )}
              </div>
            </div>

            {/* Qualify Stage */}
            <div className="flex flex-col w-56 shrink-0">
              <div className="bg-white rounded-t-2xl border border-gray-200 px-3 py-2.5 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 bg-purple-500 rounded-full" />
                  <h2 className="font-bold text-sm text-gray-900">Qualify</h2>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                  {qualifyProspects.length}
                </span>
              </div>
              <div className="flex-1 bg-purple-50/50 border-l border-r border-b border-gray-200 rounded-b-2xl p-2 space-y-2 overflow-y-auto min-h-[400px]">
                {qualifyProspects.length === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-500">
                    No prospects
                  </div>
                ) : (
                  qualifyProspects.map((prospect) => (
                    <ProspectCard key={prospect.id} prospect={prospect} stage="qualify" />
                  ))
                )}
              </div>
            </div>

            {/* Nurture Stage */}
            <div className="flex flex-col w-56 shrink-0">
              <div className="bg-white rounded-t-2xl border border-gray-200 px-3 py-2.5 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 bg-green-500 rounded-full" />
                  <h2 className="font-bold text-sm text-gray-900">Nurture</h2>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                  {nurtureProspects.length}
                </span>
              </div>
              <div className="flex-1 bg-green-50/50 border-l border-r border-b border-gray-200 rounded-b-2xl p-2 space-y-2 overflow-y-auto min-h-[400px]">
                {nurtureProspects.length === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-500">
                    No prospects
                  </div>
                ) : (
                  nurtureProspects.map((prospect) => (
                    <ProspectCard key={prospect.id} prospect={prospect} stage="nurture" />
                  ))
                )}
              </div>
            </div>

            {/* Close Stage */}
            <div className="flex flex-col w-56 shrink-0">
              <div className="bg-white rounded-t-2xl border border-gray-200 px-3 py-2.5 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 bg-emerald-500 rounded-full" />
                  <h2 className="font-bold text-sm text-gray-900">Close</h2>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  {closeProspects.length}
                </span>
              </div>
              <div className="flex-1 bg-emerald-50/50 border-l border-r border-b border-gray-200 rounded-b-2xl p-2 space-y-2 overflow-y-auto min-h-[400px]">
                {closeProspects.length === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-500">
                    No prospects
                  </div>
                ) : (
                  closeProspects.map((prospect) => (
                    <ProspectCard key={prospect.id} prospect={prospect} stage="close" />
                  ))
                )}
              </div>
            </div>

            {/* Won Stage */}
            <div className="flex flex-col w-56 shrink-0">
              <div className="bg-white rounded-t-2xl border border-gray-200 px-3 py-2.5 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 bg-green-600 rounded-full" />
                  <h2 className="font-bold text-sm text-gray-900">Won</h2>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                  {wonProspects.length}
                </span>
              </div>
              <div className="flex-1 bg-green-50/50 border-l border-r border-b border-gray-200 rounded-b-2xl p-2 space-y-2 overflow-y-auto min-h-[400px]">
                {wonProspects.length === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-500">
                    No prospects
                  </div>
                ) : (
                  wonProspects.map((prospect) => (
                    <ProspectCard key={prospect.id} prospect={prospect} stage="won" />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating AI Auto Button - Bottom Right */}
      <button
        onClick={() => setShowAIPanel(true)}
        className="fixed bottom-6 right-6 z-20 px-5 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-2 shadow-2xl hover:shadow-3xl group hover:scale-105"
        title="AI Pipeline Automation"
      >
        <Bot className="w-5 h-5" />
        <span>AI Auto</span>
        <Sparkles className="w-4 h-4 animate-pulse" />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse" />
      </button>

      {/* AI Pipeline Control Panel */}
      <AIPipelineControlPanel
        isOpen={showAIPanel}
        onClose={() => {
          setShowAIPanel(false);
          loadProspects();
        }}
        onBuyClick={() => {
          setShowAIPanel(false);
          setShowPurchaseModal(true);
        }}
      />

      {/* Coin Purchase Modal */}
      <CoinPurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        onPurchaseComplete={() => {
          setShowPurchaseModal(false);
          // Resources will auto-refresh in wallet display
        }}
      />

      {/* Prospect Progress Modal */}
      {showProgressModal && selectedProspect && (
        <ProspectProgressModal
          isOpen={showProgressModal}
          onClose={() => {
            setShowProgressModal(false);
            setSelectedProspect(null);
          }}
          prospect={{
            id: selectedProspect.id,
            full_name: selectedProspect.full_name,
            score: selectedProspect.score,
            stage: selectedProspect.pipeline_stage,
            profile_image_url: selectedProspect.uploaded_image_url || selectedProspect.social_image_url,
            avatar_seed: selectedProspect.avatar_seed,
          }}
        />
      )}
    </div>
  );
}
