import { useState, useEffect } from 'react';
import { ArrowLeft, Flame, MessageCircle, FileText, TrendingUp, Sparkles, Lock, Plus, Bell, MoreHorizontal, Trash2, Phone, Mail, MessageSquare, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { ProspectWithScore } from '../lib/types/scanning';
import GenerateMessageModal from '../components/GenerateMessageModal';
import GenerateSequenceModal from '../components/GenerateSequenceModal';
import GenerateDeckModal from '../components/GenerateDeckModal';
import ProspectPhotoUpload from '../components/ProspectPhotoUpload';
import ProspectAvatar from '../components/ProspectAvatar';
import ProUpgradeModal from '../components/ProUpgradeModal';
import SetReminderModal from '../components/SetReminderModal';
import ManageProspectModal from '../components/ManageProspectModal';
import { supabase } from '../lib/supabase';
import { useAutomation } from '../hooks/useAutomation';
import AutomationPreviewModal from '../components/automation/AutomationPreviewModal';
import AutomationProgressModal from '../components/automation/AutomationProgressModal';
import SmartRecommendationCard from '../components/automation/SmartRecommendationCard';
import { AUTOMATION_COSTS } from '../config/automationCosts';

interface ProspectDetailPageProps {
  onBack: () => void;
  onNavigate: (page: string, options?: any) => void;
  prospect?: ProspectWithScore;
  prospectId?: string;
}

export default function ProspectDetailPage({ onBack, onNavigate, prospect: initialProspect, prospectId }: ProspectDetailPageProps) {
  const { user, profile } = useAuth();
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showSequenceModal, setShowSequenceModal] = useState(false);
  const [showDeckModal, setShowDeckModal] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [prospect, setProspect] = useState<any>(initialProspect);
  const [loading, setLoading] = useState(!initialProspect && !!prospectId);
  const [error, setError] = useState<string | null>(null);
  const [showContactMenu, setShowContactMenu] = useState(false);
  const [regeneratingScore, setRegeneratingScore] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<'sequence' | 'deck' | 'deepscan' | 'automation'>('sequence');
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  // Premium automation features
  const automation = useAutomation(
    prospectId || initialProspect?.id || '',
    initialProspect?.full_name || prospect?.full_name || 'Prospect'
  );

  useEffect(() => {
    if (prospectId && !initialProspect) {
      loadProspect();
    } else if (initialProspect) {
      // Ensure initialProspect has pipeline_stage
      setProspect({
        ...initialProspect,
        pipeline_stage: initialProspect.pipeline_stage || null
      });
    }
  }, [prospectId]);

  // Refresh prospect pipeline status when component becomes visible (e.g., navigating back)
  useEffect(() => {
    if (prospectId && user && prospect?.id) {
      const refreshPipelineStatus = async () => {
        try {
          const { data, error } = await supabase
            .from('prospects')
            .select('pipeline_stage')
            .eq('id', prospectId)
            .maybeSingle();
          
          if (error) {
            console.error('[ProspectDetail] Error refreshing pipeline status:', error);
            return;
          }
          
          if (data) {
            setProspect((prev: any) => ({
              ...prev,
              pipeline_stage: data.pipeline_stage
            }));
          }
        } catch (error) {
          console.error('[ProspectDetail] Unexpected error refreshing pipeline status:', error);
        }
      };
      
      // Only refresh if we have a prospect loaded
      if (prospect?.id) {
        refreshPipelineStatus();
      }
    }
  }, [prospectId, user]);

  async function loadProspect() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('prospects')
        .select('*')
        .eq('id', prospectId)
        .maybeSingle();

      if (error) {
        console.error('[ProspectDetail] Error loading prospect:', error);
        setError('Failed to load prospect. Please try again.');
        setLoading(false);
        return;
      }

      if (!data) {
        setError('Prospect not found.');
        setLoading(false);
        return;
      }

      if (data) {
        setProspect({
          id: data.id,
          full_name: data.full_name,
          username: data.username || '',
          platform: data.platform,
          profile_link: data.profile_link,
          bio_text: data.bio_text,
          profile_image_url: data.profile_image_url,
          uploaded_image_url: data.uploaded_image_url,
          social_image_url: data.social_image_url,
          avatar_seed: data.avatar_seed,
          location: data.location,
          occupation: data.occupation,
          is_unlocked: data.is_unlocked,
          pipeline_stage: data.pipeline_stage,
          metadata: data.metadata,
          score: {
            scout_score: data.metadata?.scout_score || 50,
            bucket: data.metadata?.bucket || 'warm',
            explanation_tags: data.metadata?.explanation_tags || [
              'Active social media presence',
              'Engaged with entrepreneurial content',
              'Shows leadership qualities'
            ],
            engagement_score: data.metadata?.engagement_score || 0.75,
            responsiveness_likelihood: data.metadata?.responsiveness_likelihood || 0.68,
            mlm_leadership_potential: data.metadata?.mlm_leadership_potential || 0.82,
          },
          profile: {
            dominant_topics: data.metadata?.dominant_topics || data.metadata?.tags || ['Business', 'Networking', 'Growth'],
            pain_points: data.metadata?.pain_points || ['Looking for additional income', 'Career growth opportunities'],
            life_events: data.metadata?.life_events || [],
          },
        });
      }
    } catch (error) {
      console.error('Error loading prospect:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegenerateScore() {
    if (!prospect?.id || regeneratingScore) return;
    
    const coinCost = 2;
    const currentCoins = profile?.coin_balance || 0;
    
    if (currentCoins < coinCost) {
      alert(`❌ Insufficient coins!\n\nYou need ${coinCost} coins but have ${currentCoins}.\n\nBuy more coins or upgrade to Pro for monthly bonuses!`);
      return;
    }
    
    if (!confirm(`🔄 Regenerate ScoutScore Analysis?\n\nCost: ${coinCost} coins\n\nThis will analyze the latest chat conversation and update the score with fresh AI insights.`)) {
      return;
    }
    
    setRegeneratingScore(true);
    try {
      // Deduct coins
      const { error: coinError } = await supabase
        .from('profiles')
        .update({ coin_balance: currentCoins - coinCost })
        .eq('id', user?.id);
      
      if (coinError) throw coinError;
      
      // Regenerate score
      const { data, error } = await supabase.rpc('regenerate_prospect_scoutscore', {
        p_prospect_id: prospect.id
      });
      
      if (error) throw error;
      
      if (data?.success) {
        alert(`✅ ScoutScore Updated!\n\nNew Score: ${data.scout_score}/100\nBucket: ${data.bucket.toUpperCase()}\n\n${coinCost} coins deducted.`);
        await loadProspect();
      }
    } catch (error: any) {
      console.error('Error regenerating score:', error);
      
      // Refund coins
      await supabase.from('profiles').update({ coin_balance: currentCoins }).eq('id', user?.id);
      
      alert('❌ Failed to regenerate score.\n\nYour coins have been refunded.');
    } finally {
      setRegeneratingScore(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block size-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600">Loading prospect...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="inline-block size-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="size-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Prospect</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setError(null);
                if (prospectId) {
                  loadProspect();
                } else {
                  onBack();
                }
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              {prospectId ? 'Retry' : 'Go Back'}
            </button>
            <button
              onClick={onBack}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!prospect) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Prospect not found</p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const canAccessFeature = (feature: 'sequence' | 'deck' | 'deepscan') => {
    // All Pro features (Elite tier removed)
    return profile?.subscription_tier === 'pro';

  // Contact menu handlers
  const handleCall = () => {
    const phoneNumber = prospect?.phone || prospect?.metadata?.phone || prospect?.contact_phone || prospect?.metadata?.contact_phone;
    if (phoneNumber && String(phoneNumber).trim().length > 0) {
      window.location.href = `tel:${phoneNumber}`;
    } else {
      alert('No phone number available for this prospect.');
    }
    setShowContactMenu(false);
  };

  const handleMessage = async () => {
    if (!prospect?.id || !user?.id) {
      alert('Unable to find prospect or user information.');
      setShowContactMenu(false);
      return;
    }

    try {
      // Find chatbot session for this prospect
      const phoneValue = prospect?.phone || prospect?.metadata?.phone || prospect?.contact_phone || prospect?.metadata?.contact_phone;
      const emailValue = prospect?.email || prospect?.metadata?.email || prospect?.contact_email || prospect?.metadata?.contact_email;
      
      const { data: session } = await supabase
        .from('public_chat_sessions')
        .select('id')
        .eq('user_id', user.id)
        .or(`visitor_name.eq.${prospect.full_name || ''},visitor_email.eq.${emailValue || ''},visitor_phone.eq.${phoneValue || ''}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (session?.id) {
        onNavigate?.('chatbot-session-viewer', { sessionId: session.id });
      } else {
        alert('No chat session found for this prospect. Start a new conversation from the chatbot sessions page.');
      }
    } catch (error) {
      console.error('Error finding chat session:', error);
      alert('Unable to find chat session. Please try again.');
    }
    setShowContactMenu(false);
  };

  const handleEmail = () => {
    const email = prospect?.email || prospect?.metadata?.email || prospect?.contact_email || prospect?.metadata?.contact_email;
    if (email && String(email).trim().length > 0) {
      window.location.href = `mailto:${email}`;
    } else {
      alert('No email address available for this prospect.');
    }
    setShowContactMenu(false);
  };

  // Get contact data availability - check multiple possible locations and filter out empty strings
  const phoneValue = prospect?.phone || prospect?.metadata?.phone || prospect?.contact_phone || prospect?.metadata?.contact_phone;
  const hasPhone = !!(phoneValue && String(phoneValue).trim().length > 0);
  
  const emailValue = prospect?.email || prospect?.metadata?.email || prospect?.contact_email || prospect?.metadata?.contact_email;
  const hasEmail = !!(emailValue && String(emailValue).trim().length > 0);

  };

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-gradient-to-r from-[#1877F2] to-[#1EC8FF] text-white sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center justify-center size-9 hover:bg-white/20 rounded-xl transition-colors flex-shrink-0"
            >
              <ArrowLeft className="size-4" />
            </button>

            <button
              onClick={() => setShowPhotoUpload(true)}
              className="relative group flex-shrink-0"
              title="Manage photo"
            >
              <ProspectAvatar prospect={prospect} size="md" />
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Plus className="w-4 h-4 text-white" />
              </div>
            </button>

            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold truncate">{prospect.full_name}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="px-2 py-0.5 bg-white/20 backdrop-blur rounded-full text-xs font-medium">
                  {prospect.platform}
                </span>
                {prospect.is_unlocked && (
                  <span className="px-2 py-0.5 bg-green-500/20 backdrop-blur rounded-full text-xs font-medium flex items-center gap-1">
                    <svg className="size-2.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Unlocked
                  </span>
                )}
              </div>
            </div>
            
            {/* 3 Dots Menu */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center justify-center size-9 hover:bg-white/20 rounded-xl transition-colors flex-shrink-0"
              >
                <MoreHorizontal className="size-5" />
              </button>
              
              {/* Dropdown Menu */}
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-10 z-30 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1">
                    <button
                      onClick={() => {
                        setShowManageModal(true);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Manage Prospect
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        <section className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-3xl p-6 border border-blue-100">
          {/* Header with Regenerate Button */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-600 uppercase">ScoutScore</h2>
            <button
              onClick={handleRegenerateScore}
              disabled={regeneratingScore}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all text-xs font-semibold text-blue-600 disabled:opacity-50 shadow-sm"
              title="Regenerate ScoutScore from latest conversation (2 coins)"
            >
              {regeneratingScore ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Regenerate</span>
                  <span className="text-[10px] bg-blue-100 px-1.5 py-0.5 rounded ml-1">2 coins</span>
                </>
              )}
            </button>
          </div>
          <div className="text-center mb-6">
            <div className="relative inline-block">
              <svg className="size-32" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="8"
                  strokeDasharray={`${(prospect.score?.scout_score || 0) * 2.83} 283`}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1877F2" />
                    <stop offset="100%" stopColor="#1EC8FF" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl font-bold text-gray-900">{prospect.score?.scout_score || 0}</span>
              </div>
            </div>
            <div className="mt-4">
              <span className={`inline-block px-6 py-2 rounded-full font-bold text-white ${
                prospect.score?.bucket === 'hot'
                  ? 'bg-gradient-to-r from-red-500 to-orange-500'
                  : prospect.score?.bucket === 'warm'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500'
                  : 'bg-gradient-to-r from-blue-500 to-cyan-500'
              }`}>
                {prospect.score?.bucket?.toUpperCase() || 'UNKNOWN'} LEAD
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Sparkles className="size-4 text-[#1877F2]" />
              Why This Score?
            </h3>
            <div className="space-y-2">
              {(prospect.score?.explanation_tags || []).map((tag, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <div className="size-1.5 rounded-full bg-[#1877F2] mt-2 flex-shrink-0" />
                  <span>{tag}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-gray-200 text-center">
            <div className="text-2xl font-bold text-[#1877F2] mb-1">
              {Math.round((prospect.score?.engagement_score || 0) * 100)}%
            </div>
            <div className="text-xs text-gray-600">Engagement</div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-200 text-center">
            <div className="text-2xl font-bold text-[#1EC8FF] mb-1">
              {Math.round((prospect.score?.responsiveness_likelihood || 0) * 100)}%
            </div>
            <div className="text-xs text-gray-600">Response Rate</div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-200 text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {Math.round((prospect.score?.mlm_leadership_potential || 0) * 100)}%
            </div>
            <div className="text-xs text-gray-600">Leadership</div>
          </div>
        </section>

        {prospect.profile?.dominant_topics && prospect.profile.dominant_topics.length > 0 && (
          <section className="bg-white rounded-3xl p-6 border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="size-5 text-[#1877F2]" />
              Interests & Topics
            </h3>
            <div className="flex flex-wrap gap-2">
              {prospect.profile.dominant_topics.map((topic, i) => (
                <span
                  key={i}
                  className="px-4 py-2 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-full text-sm font-medium text-gray-700"
                >
                  {topic}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Smart Recommendation Card - PREMIUM FEATURE */}
        {automation.recommendation && (
          <SmartRecommendationCard
            recommendation={automation.recommendation}
            onRunAction={automation.runRecommended}
          />
        )}

        {prospect.profile?.pain_points && prospect.profile.pain_points.length > 0 && (
          <section className="bg-white rounded-3xl p-6 border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Flame className="size-5 text-red-500" />
              Pain Points
            </h3>
            <div className="space-y-2">
              {prospect.profile.pain_points.map((pain, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
                  <div className="size-2 rounded-full bg-red-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700 capitalize">{pain}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {prospect.profile?.life_events && prospect.profile.life_events.length > 0 && (
          <section className="bg-white rounded-3xl p-6 border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-4">Recent Life Events</h3>
            <div className="space-y-2">
              {prospect.profile.life_events.map((event, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
                  <div className="size-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <svg className="size-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700">{event}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-3">
          <h3 className="font-bold text-gray-900">AI-Powered Actions</h3>

          <button
            onClick={() => setShowMessageModal(true)}
            className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-[#1877F2] to-[#1EC8FF] text-white rounded-2xl hover:shadow-lg transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <MessageCircle className="size-6" />
              </div>
              <div className="text-left">
                <div className="font-bold">Generate Outreach Message</div>
                <div className="text-xs text-white/80">3 coins</div>
              </div>
            </div>
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            onClick={() => {
              if (canAccessFeature('sequence')) {
                setShowSequenceModal(true);
              } else {
                setUpgradeFeature('sequence');
                setShowUpgradeModal(true);
              }
            }}
            className="w-full flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-2xl hover:border-[#1877F2] transition-all relative overflow-hidden"
          >
            {!canAccessFeature('sequence') && (
              <div className="absolute top-2 right-2 px-3 py-1 bg-gradient-to-r from-amber-400 to-amber-600 text-white text-xs font-bold rounded-full flex items-center gap-1">
                <Lock className="size-3" />
                Pro Only
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center">
                <MessageCircle className="size-6 text-[#1877F2]" />
              </div>
              <div className="text-left">
                <div className="font-bold text-gray-900">Generate Follow-Up Sequence</div>
                <div className="text-xs text-gray-600">4-7 message series • 7 coins</div>
              </div>
            </div>
            <svg className="size-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            disabled
            className="w-full flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-2xl transition-all relative overflow-hidden opacity-75 cursor-not-allowed"
          >
            <div className="absolute top-2 right-2 px-3 py-1 bg-gradient-to-r from-amber-400 to-amber-600 text-white text-xs font-bold rounded-full flex items-center gap-1 z-10">
              <Lock className="size-3" />
              Coming Soon
            </div>
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center">
                <FileText className="size-6 text-[#1877F2]" />
              </div>
              <div className="text-left">
                <div className="font-bold text-gray-900">Generate Pitch Deck</div>
                <div className="text-xs text-gray-600">6-slide presentation • 12 coins</div>
              </div>
            </div>
            <Lock className="size-5 text-gray-400" />
          </button>

          <button
            disabled
            className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-amber-100 border-2 border-amber-300 rounded-2xl transition-all relative overflow-hidden opacity-75 cursor-not-allowed"
          >
            <div className="absolute top-2 right-2 px-3 py-1 bg-gradient-to-r from-amber-400 to-amber-600 text-white text-xs font-bold rounded-full flex items-center gap-1 z-10">
              <Lock className="size-3" />
              Coming Soon
            </div>
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                <Sparkles className="size-6 text-white" />
              </div>
              <div className="text-left">
                <div className="font-bold text-gray-900">AI DeepScan Analysis</div>
                <div className="text-xs text-gray-700">Full personality & buying profile • 12 coins</div>
              </div>
            </div>
            <Lock className="size-5 text-gray-700" />
          </button>

          {/* AI-Powered Call */}
          <button
            onClick={() => {
              alert('AI-Powered Call feature coming soon! This will allow you to make AI-assisted calls to prospects.');
            }}
            className="w-full flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-2xl hover:border-green-500 transition-all relative overflow-hidden"
          >
            <div className="absolute top-2 right-2 px-3 py-1 bg-gradient-to-r from-amber-400 to-amber-600 text-white text-xs font-bold rounded-full flex items-center gap-1 z-10">
              <Lock className="size-3" />
              Coming Soon
            </div>
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
                <Phone className="size-6 text-green-600" />
              </div>
              <div className="text-left">
                <div className="font-bold text-gray-900">AI-Powered Call</div>
                <div className="text-xs text-gray-600">AI-assisted phone call • Coming soon</div>
              </div>
            </div>
            <Lock className="size-5 text-gray-400" />
          </button>
        </section>

        <section className="space-y-3">
          <h3 className="font-bold text-gray-900">Pipeline Actions</h3>

          {/* Only show "Add to Pipeline" button if prospect is not already in pipeline */}
          {!prospect?.pipeline_stage && (
            <button
              onClick={() => onNavigate('pipeline', { prospectId: prospect.id })}
              className="w-full flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-2xl hover:border-green-500 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
                  <Plus className="size-6 text-green-600" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-gray-900">Add to Pipeline</div>
                  <div className="text-xs text-gray-600">Move to engagement workflow</div>
                </div>
              </div>
              <svg className="size-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          <button
            onClick={() => setShowReminderModal(true)}
            className="w-full flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-2xl hover:border-blue-500 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center">
                <Bell className="size-6 text-blue-600" />
              </div>
              <div className="text-left">
                <div className="font-bold text-gray-900">Set Reminder</div>
                <div className="text-xs text-gray-600">Schedule follow-up notification</div>
              </div>
            </div>
            <svg className="size-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </section>

        {/* Notes Section at Bottom */}
        {prospect?.bio_text || prospect?.metadata?.notes ? (
          <section className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">Notes</h3>
            </div>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">
              {prospect.bio_text || prospect.metadata?.notes}
            </p>
          </section>
        ) : null}

        {/* Delete Prospect Link */}
        <div className="mt-6 pb-8 text-center">
          <button
            onClick={async () => {
              if (!confirm('Are you sure you want to delete this prospect? This action cannot be undone.')) {
                return;
              }
              
              if (!prospect?.id || !user) return;
              
              try {
                const { error } = await supabase
                  .from('prospects')
                  .delete()
                  .eq('id', prospect.id)
                  .eq('user_id', user.id);
                
                if (error) throw error;
                
                alert('Prospect deleted successfully');
                onBack();
              } catch (error: any) {
                console.error('Error deleting prospect:', error);
                alert('Failed to delete prospect. Please try again.');
              }
            }}
            className="text-sm text-red-600 hover:text-red-700 underline font-medium"
          >
            Delete Prospect
          </button>
        </div>

        <div className="h-24" />
      </main>

      {/* Manage Prospect Modal */}
      {prospect && (
        <ManageProspectModal
          isOpen={showManageModal}
          onClose={() => setShowManageModal(false)}
          prospectId={prospect.id}
          prospect={prospect}
          onProspectUpdated={async () => {
            if (prospectId) {
              await loadProspect();
            } else if (prospect?.id) {
              // Refresh prospect data
              try {
                const { data, error } = await supabase
                  .from('prospects')
                  .select('*')
                  .eq('id', prospect.id)
                  .maybeSingle();
                
                if (error) {
                  console.error('[ProspectDetail] Error refreshing prospect after update:', error);
                  return;
                }
                
                if (data) {
                  setProspect({
                    ...prospect,
                    ...data,
                    metadata: data.metadata || {}
                  });
                }
              } catch (error) {
                console.error('[ProspectDetail] Unexpected error refreshing prospect:', error);
              }
            }
          }}
        />
      )}

      {/* Set Reminder Modal */}
      {prospect && (
        <SetReminderModal
          isOpen={showReminderModal}
          onClose={() => setShowReminderModal(false)}
          prospectId={prospect.id}
          prospectName={prospect.full_name}
          onSuccess={() => {
            // Optionally show success message or refresh data
          }}
        />
      )}

      <GenerateMessageModal
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        prospectId={prospect.id}
        prospectName={prospect.full_name}
        userId={profile?.id || ''}
        onSuccess={(message) => {
          console.log('Message generated:', message);
        }}
      />

      <GenerateSequenceModal
        isOpen={showSequenceModal}
        onClose={() => setShowSequenceModal(false)}
        prospectId={prospect.id}
        prospectName={prospect.full_name}
        userId={profile?.id || ''}
        userTier={(profile?.subscription_tier as 'free' | 'pro') || 'free'}
      />

      <GenerateDeckModal
        isOpen={showDeckModal}
        onClose={() => setShowDeckModal(false)}
        prospectId={prospect.id}
        prospectName={prospect.full_name}
        userId={profile?.id || ''}
        userTier={(profile?.subscription_tier as 'free' | 'pro') || 'free'}
      />

      {showPhotoUpload && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Manage Prospect Photo</h2>
              <button
                onClick={() => setShowPhotoUpload(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ProspectPhotoUpload
              prospect={prospect}
              userId={user?.id || ''}
              onUploadSuccess={(url) => {
                setProspect({ ...prospect, uploaded_image_url: url });
                setShowPhotoUpload(false);
              }}
              onDeleteSuccess={() => {
                const updated = { ...prospect, uploaded_image_url: null };
                setProspect(updated);
                setShowPhotoUpload(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Premium Automation Modals */}
      {automation.showPreview && automation.previewData && (
        <AutomationPreviewModal
          isOpen={automation.showPreview}
          action={automation.previewData.action || 'follow_up'}
          prospectName={prospect?.full_name || 'Prospect'}
          generatedContent={automation.previewData.content || {}}
          estimatedOutcome={{
            replyRate: 0.34,
            estimatedRevenue: 6800,
          }}
          cost={AUTOMATION_COSTS[automation.previewData.action] || AUTOMATION_COSTS.smart_scan}
          onApprove={automation.previewData.onApprove}
          onRegenerate={async () => {
            console.log('Regenerating...');
          }}
          onCancel={() => automation.setShowPreview(false)}
        />
      )}

      {automation.showProgress && automation.progressData && (
        <AutomationProgressModal
          isOpen={automation.showProgress}
          action="Processing Automation"
          prospectName={prospect?.full_name || 'Prospect'}
          steps={automation.progressData.steps}
          currentStep={automation.progressData.currentStep}
          estimatedTotal={automation.progressData.estimatedTotal}
          onCancel={() => automation.setShowProgress(false)}
        />
      )}


          {/* Floating Contact Menu Button */}
      <div className="fixed bottom-6 right-6 z-[100]">
        {/* Contact Menu Options - Always show vertically when menu is open */}
        {showContactMenu && (
          <div className="mb-4 space-y-3 flex flex-col">
            {/* Call Button - Disabled if no phone */}
            <button
              onClick={handleCall}
              disabled={!hasPhone}
              className={`w-14 h-14 bg-green-500 rounded-full shadow-lg flex items-center justify-center text-white transition-all ${
                hasPhone 
                  ? 'hover:shadow-xl hover:scale-110 active:scale-95 cursor-pointer' 
                  : 'opacity-50 cursor-not-allowed'
              }`}
              aria-label={hasPhone ? 'Call prospect' : 'Call unavailable - no phone number'}
              title={hasPhone ? 'Call' : 'No phone number available'}
            >
              <Phone className="w-6 h-6" />
            </button>

            {/* Message Button - Always enabled */}
            <button
              onClick={handleMessage}
              className="w-14 h-14 bg-[#1877F2] rounded-full shadow-lg hover:shadow-xl flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 cursor-pointer"
              aria-label="Message prospect"
              title="Message"
            >
              <MessageSquare className="w-6 h-6" />
            </button>

            {/* Email Button - Disabled if no email */}
            <button
              onClick={handleEmail}
              disabled={!hasEmail}
              className={`w-14 h-14 bg-pink-500 rounded-full shadow-lg flex items-center justify-center text-white transition-all ${
                hasEmail 
                  ? 'hover:shadow-xl hover:scale-110 active:scale-95 cursor-pointer' 
                  : 'opacity-50 cursor-not-allowed'
              }`}
              aria-label={hasEmail ? 'Email prospect' : 'Email unavailable - no email address'}
              title={hasEmail ? 'Email' : 'No email address available'}
            >
              <Mail className="w-6 h-6" />
            </button>
          </div>
        )}

        {/* Main Contact Button - Shows X when menu is open */}
        <button
          onClick={() => setShowContactMenu(!showContactMenu)}
          className={`w-14 h-14 rounded-full shadow-lg hover:shadow-xl flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 ${
            showContactMenu ? 'bg-gray-800' : 'bg-black'
          }`}
          aria-label={showContactMenu ? 'Close contact menu' : 'Open contact menu'}
        >
          {showContactMenu ? (
            <X className="w-6 h-6" />
          ) : (
            <MessageCircle className="w-6 h-6" />
          )}
        </button>
      </div>
    </div>
  );
}
