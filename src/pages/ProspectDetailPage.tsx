import { useState, useEffect } from 'react';
import { ArrowLeft, Flame, MessageCircle, FileText, TrendingUp, Sparkles, Lock, Plus, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { ProspectWithScore } from '../lib/types/scanning';
import GenerateMessageModal from '../components/GenerateMessageModal';
import GenerateSequenceModal from '../components/GenerateSequenceModal';
import GenerateDeckModal from '../components/GenerateDeckModal';
import ProspectPhotoUpload from '../components/ProspectPhotoUpload';
import ProspectAvatar from '../components/ProspectAvatar';
import { supabase } from '../lib/supabase';

interface ProspectDetailPageProps {
  onBack: () => void;
  onNavigate: (page: string, options?: any) => void;
  prospect?: ProspectWithScore;
  prospectId?: string;
}

export default function ProspectDetailPage({ onBack, onNavigate, prospect: initialProspect, prospectId }: ProspectDetailPageProps) {
  const { profile } = useAuth();
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showSequenceModal, setShowSequenceModal] = useState(false);
  const [showDeckModal, setShowDeckModal] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [prospect, setProspect] = useState<any>(initialProspect);
  const [loading, setLoading] = useState(!initialProspect && !!prospectId);

  useEffect(() => {
    if (prospectId && !initialProspect) {
      loadProspect();
    }
  }, [prospectId]);

  async function loadProspect() {
    try {
      const { data, error } = await supabase
        .from('prospects')
        .select('*')
        .eq('id', prospectId)
        .single();

      if (error) throw error;

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
    if (feature === 'deepscan') return profile?.subscription_tier === 'elite';
    return profile?.subscription_tier === 'pro' || profile?.subscription_tier === 'elite';
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
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        <section className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-3xl p-6 border border-blue-100">
          <div className="text-center mb-6">
            <h2 className="text-sm font-semibold text-gray-600 uppercase mb-2">ScoutScore</h2>
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
              {prospect.score?.explanation_tags.map((tag, i) => (
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
                <div className="text-xs text-white/80">20 coins</div>
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
                onNavigate('pricing');
              }
            }}
            className="w-full flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-2xl hover:border-[#1877F2] transition-all relative overflow-hidden"
          >
            {!canAccessFeature('sequence') && (
              <div className="absolute top-2 right-2 px-3 py-1 bg-gradient-to-r from-amber-400 to-amber-600 text-white text-xs font-bold rounded-full flex items-center gap-1">
                <Lock className="size-3" />
                Pro/Elite
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center">
                <MessageCircle className="size-6 text-[#1877F2]" />
              </div>
              <div className="text-left">
                <div className="font-bold text-gray-900">Generate Follow-Up Sequence</div>
                <div className="text-xs text-gray-600">4-7 message series • 50 coins</div>
              </div>
            </div>
            <svg className="size-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            onClick={() => {
              if (canAccessFeature('deck')) {
                setShowDeckModal(true);
              } else {
                onNavigate('pricing');
              }
            }}
            className="w-full flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-2xl hover:border-[#1877F2] transition-all relative overflow-hidden"
          >
            {!canAccessFeature('deck') && (
              <div className="absolute top-2 right-2 px-3 py-1 bg-gradient-to-r from-amber-400 to-amber-600 text-white text-xs font-bold rounded-full flex items-center gap-1">
                <Lock className="size-3" />
                Pro/Elite
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center">
                <FileText className="size-6 text-[#1877F2]" />
              </div>
              <div className="text-left">
                <div className="font-bold text-gray-900">Generate Pitch Deck</div>
                <div className="text-xs text-gray-600">6-slide presentation • 75 coins</div>
              </div>
            </div>
            <svg className="size-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            onClick={() => {
              if (canAccessFeature('deepscan')) {
                onNavigate('deep-scan', { prospect });
              } else {
                onNavigate('pricing');
              }
            }}
            className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-amber-100 border-2 border-amber-300 rounded-2xl hover:shadow-lg transition-all relative overflow-hidden"
          >
            {!canAccessFeature('deepscan') && (
              <div className="absolute top-2 right-2 px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white text-xs font-bold rounded-full flex items-center gap-1">
                <Lock className="size-3" />
                Pro Only
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                <Sparkles className="size-6 text-white" />
              </div>
              <div className="text-left">
                <div className="font-bold text-gray-900">AI DeepScan Analysis</div>
                <div className="text-xs text-gray-700">Full personality & buying profile</div>
              </div>
            </div>
            <svg className="size-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </section>

        <section className="space-y-3">
          <h3 className="font-bold text-gray-900">Pipeline Actions</h3>

          <button
            onClick={() => setShowActionMenu(!showActionMenu)}
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

          <button
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

        <div className="h-24" />
      </main>

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
        userTier={(profile?.subscription_tier as 'free' | 'pro' | 'elite') || 'free'}
      />

      <GenerateDeckModal
        isOpen={showDeckModal}
        onClose={() => setShowDeckModal(false)}
        prospectId={prospect.id}
        prospectName={prospect.full_name}
        userId={profile?.id || ''}
        userTier={(profile?.subscription_tier as 'free' | 'pro' | 'elite') || 'free'}
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
    </div>
  );
}
