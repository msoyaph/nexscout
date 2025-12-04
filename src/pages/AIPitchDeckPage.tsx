import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Sparkles, Home, Users, PlusCircle, TrendingUp, MoreHorizontal, Target, Palette, Play, Lock, Zap, Menu, Database, FileText, Globe, Upload, MessageSquare } from 'lucide-react';
import ActionPopup from '../components/ActionPopup';
import SlideInMenu from '../components/SlideInMenu';
import PitchDeckViewer from '../components/PitchDeckViewer';
import PaywallModal from '../components/PaywallModal';
import LibraryMenu from '../components/LibraryMenu';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { pitchDeckGenerator } from '../services';
import { libraryService } from '../services/libraryService';
import type { PitchDeck } from '../services/ai/pitchDeckGenerator';

interface AIPitchDeckPageProps {
  onNavigateToHome?: () => void;
  onNavigateToProspects?: () => void;
  onNavigateToPipeline?: () => void;
  onNavigateToMore?: () => void;
  onNavigateToPitchDeck?: () => void;
  onNavigateToMessageSequencer?: () => void;
  onNavigateToRealTimeScan?: () => void;
  onNavigateToDeepScan?: () => void;
  onNavigate?: (page: string) => void;
}

interface Prospect {
  id: string;
  full_name: string;
  company?: string;
  platform?: string;
  scout_score?: number;
  bucket?: string;
}

export default function AIPitchDeckPage({
  onNavigateToHome,
  onNavigateToProspects,
  onNavigateToPipeline,
  onNavigateToMore,
  onNavigateToPitchDeck,
  onNavigateToMessageSequencer,
  onNavigateToRealTimeScan,
  onNavigateToDeepScan,
  onNavigate
}: AIPitchDeckPageProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [showActionPopup, setShowActionPopup] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLibraryMenu, setShowLibraryMenu] = useState(false);
  const [viewingDeckId, setViewingDeckId] = useState<string | null>(null);

  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [deckType, setDeckType] = useState<'basic' | 'elite'>('basic');
  const [goal, setGoal] = useState<'recruit' | 'sell' | 'invite_call' | 'intro'>('recruit');
  const [tone, setTone] = useState<'friendly' | 'professional' | 'confident' | 'warm'>('friendly');
  const [useCompanyData, setUseCompanyData] = useState(false);
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [hasCompanyData, setHasCompanyData] = useState(false);

  const [generating, setGenerating] = useState(false);
  const [generatedDeck, setGeneratedDeck] = useState<PitchDeck | null>(null);
  const [generatedDeckId, setGeneratedDeckId] = useState<string>('');
  const [showViewer, setShowViewer] = useState(false);

  const [subscriptionTier, setSubscriptionTier] = useState<'free' | 'pro' | 'elite'>('free');
  const [weeklyUsed, setWeeklyUsed] = useState(0);
  const [coinBalance, setCoinBalance] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (user) {
      loadUserProfile();
      loadProspects();
      checkCompanyData();
    }
  }, [user]);

  const checkCompanyData = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('company_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      setHasCompanyData(!!profile);
    } catch (error) {
      console.error('Error checking company data:', error);
    }
  };

  const loadUserProfile = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('subscription_tier, coin_balance, weekly_presentations_used')
      .eq('id', user.id)
      .single();

    if (data) {
      setSubscriptionTier(data.subscription_tier || 'free');
      setCoinBalance(data.coin_balance || 0);
      setWeeklyUsed(data.weekly_presentations_used || 0);
    }
  };

  const loadProspects = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('prospects')
        .select('id, full_name, occupation, platform, metadata')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error loading prospects:', error);
        return;
      }

      if (data) {
        const formatted = data.map((p: any) => ({
          id: p.id,
          full_name: p.full_name || 'Unknown',
          company: p.occupation || p.metadata?.company || '',
          platform: p.platform || 'Unknown',
          scout_score: p.metadata?.scout_score || 50,
          bucket: p.metadata?.bucket || 'warm',
        }));
        setProspects(formatted);
        console.log('Loaded prospects:', formatted.length);
      }
    } catch (error) {
      console.error('Error in loadProspects:', error);
    }
  };

  const filteredProspects = prospects.filter(p => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    return (
      p.full_name?.toLowerCase().includes(query) ||
      p.company?.toLowerCase().includes(query) ||
      p.platform?.toLowerCase().includes(query)
    );
  });

  const canProceedToStep = (targetStep: number): boolean => {
    if (targetStep === 2) return selectedProspect !== null;
    if (targetStep === 3) return selectedProspect !== null && deckType !== null;
    if (targetStep === 4) return selectedProspect !== null && deckType !== null && goal !== null;
    if (targetStep === 5) return selectedProspect !== null && deckType !== null && goal !== null;
    return true;
  };

  const handleGenerate = async () => {
    if (!user || !selectedProspect) {
      setError('Please select a prospect first');
      return;
    }

    setError('');
    setGenerating(true);

    let createdDeckId: string | null = null;
    let pendingTxId: string | undefined;

    try {
      console.log('Generating deck for:', {
        prospectId: selectedProspect.id,
        deckType,
        goal,
        tone,
        useCompanyData,
        hasFiles: uploadedFiles.length > 0,
        hasWebsite: !!companyWebsite,
      });

      const createdDeck = await libraryService.createPitchDeck({
        user_id: user.id,
        title: `Pitch Deck for ${selectedProspect.full_name}`,
        company_name: selectedProspect.company || '',
        industry: 'general',
        target_audience: selectedProspect.full_name,
        status: 'generating',
        content: {
          useCompanyData,
          uploadedFiles: uploadedFiles.map(f => f.name),
          companyWebsite,
        },
      });
      createdDeckId = createdDeck.id;

      const result = await pitchDeckGenerator.generateDeck({
        prospectId: selectedProspect.id,
        userId: user.id,
        deckType,
        goal,
        tone,
        useCompanyData,
        companyWebsite: companyWebsite || undefined,
      });

      pendingTxId = result.pendingTransactionId;
      console.log('Deck generated successfully');

      if (result.deck.locked) {
        await libraryService.deletePitchDeck(createdDeckId);
        if (pendingTxId) {
          await pitchDeckGenerator.failDeckTransaction(pendingTxId, 'Paywall - requires upgrade');
        }
        setShowPaywall(true);
        setGenerating(false);
        return;
      }

      await libraryService.updatePitchDeck(createdDeckId, {
        content: { slides: result.deck.slides },
        status: 'completed',
      });

      if (pendingTxId) {
        await pitchDeckGenerator.completeDeckTransaction(pendingTxId);
      }

      setGeneratedDeck(result.deck);
      setGeneratedDeckId(createdDeckId);
      setShowViewer(true);
      await loadUserProfile();
      console.log('Generation complete, showing viewer');
    } catch (err: any) {
      console.error('Generation error:', err);
      setError(err.message || 'Failed to generate deck');

      if (createdDeckId) {
        await libraryService.updatePitchDeck(createdDeckId, { status: 'archived' });
      }

      if (pendingTxId) {
        await pitchDeckGenerator.failDeckTransaction(pendingTxId, err.message || 'Generation failed');
      }

      if (err.message.includes('Upgrade') || err.message.includes('tier')) {
        setShowPaywall(true);
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = async (format: 'json' | 'html') => {
    if (!user || !generatedDeckId) return;

    try {
      const exported = await pitchDeckGenerator.exportDeck(generatedDeckId, user.id, format);

      const blob = new Blob([exported], { type: format === 'json' ? 'application/json' : 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pitch-deck-${selectedProspect?.full_name || 'prospect'}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const getUsageStatus = () => {
    if (subscriptionTier === 'elite') return { text: 'Unlimited decks', color: 'text-yellow-600' };
    if (subscriptionTier === 'pro') return { text: `${weeklyUsed}/5 decks used`, color: weeklyUsed >= 5 ? 'text-red-600' : 'text-blue-600' };
    return { text: `${weeklyUsed}/1 deck used`, color: weeklyUsed >= 1 ? 'text-red-600' : 'text-green-600' };
  };

  const usageStatus = getUsageStatus();

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#111827] relative overflow-hidden pb-24">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-[500px] bg-gradient-to-br from-[#2563EB]/10 via-[#2563EB]/5 to-[#60A5FA]/10 blur-[120px] rounded-full pointer-events-none" />

      <header className="relative z-10 px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onNavigateToHome}
            className="flex items-center justify-center size-11 rounded-xl bg-white backdrop-blur-sm border border-[#E5E7EB] shadow-sm"
          >
            <ArrowLeft className="size-6 text-[#111827]" />
          </button>
          <div className="text-center">
            <h1 className="text-xl font-bold text-[#111827]">AI Pitch Deck</h1>
            <p className="text-xs text-[#6B7280]">{usageStatus.text}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs font-semibold text-yellow-700">{coinBalance} coins</p>
            </div>
            <button
              onClick={() => setShowLibraryMenu(true)}
              className="flex items-center justify-center size-11 rounded-xl bg-white backdrop-blur-sm border border-[#E5E7EB] shadow-sm hover:bg-slate-50 transition-colors"
            >
              <Menu className="size-6 text-[#111827]" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full ${step >= 1 ? 'bg-[#2563EB]' : 'bg-gray-200'} text-white text-xs font-bold flex items-center justify-center shadow-sm transition-colors`}>
                {step >= 1 ? '✓' : '1'}
              </div>
              <div className={`w-8 h-8 rounded-full ${step >= 2 ? 'bg-[#2563EB]' : 'bg-gray-200'} text-white text-xs font-bold flex items-center justify-center shadow-sm transition-colors`}>
                {step >= 2 ? '✓' : '2'}
              </div>
              <div className={`w-8 h-8 rounded-full ${step >= 3 ? 'bg-[#2563EB]' : 'bg-gray-200'} text-white text-xs font-bold flex items-center justify-center shadow-sm transition-colors`}>
                {step >= 3 ? '✓' : '3'}
              </div>
              <div className={`w-8 h-8 rounded-full ${step >= 4 ? 'bg-[#2563EB]' : 'bg-gray-200'} text-white text-xs font-bold flex items-center justify-center shadow-sm transition-colors`}>
                {step >= 4 ? '✓' : '4'}
              </div>
              <div className={`w-8 h-8 rounded-full ${step >= 5 ? 'bg-[#2563EB]' : 'bg-gray-200'} text-white text-xs font-bold flex items-center justify-center shadow-sm transition-colors`}>
                {step >= 5 ? '✓' : '5'}
              </div>
            </div>
            <span className="text-xs text-[#6B7280]">Step {step} of 5</span>
          </div>
        </div>
      </header>

      <main className="px-6 pb-6 space-y-4 relative z-10">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Step 1: Select Prospect */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#111827]">Select Prospect</h3>
                  <p className="text-xs text-[#6B7280]">Choose who you're pitching to</p>
                </div>
              </div>

              <div className="relative mb-4">
                <div className="flex items-center gap-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-3">
                  <Search className="size-5 text-[#6B7280]" />
                  <input
                    type="text"
                    placeholder="Search prospects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-[#111827] placeholder:text-[#9CA3AF] outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {filteredProspects.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No prospects found</p>
                    <button
                      onClick={onNavigateToProspects}
                      className="mt-3 text-sm text-blue-600 font-semibold"
                    >
                      Add prospects first
                    </button>
                  </div>
                )}

                {filteredProspects.map((prospect) => (
                  <button
                    key={prospect.id}
                    onClick={() => {
                      setSelectedProspect(prospect);
                      console.log('Selected prospect:', prospect);
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                      selectedProspect?.id === prospect.id
                        ? 'bg-blue-50 border-blue-500 shadow-md'
                        : 'bg-[#F9FAFB] border-transparent hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-base">
                      {prospect.full_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-semibold text-[#111827] truncate">{prospect.full_name}</p>
                      <p className="text-xs text-[#6B7280] truncate">{prospect.company || prospect.platform || 'No company'}</p>
                    </div>
                    {prospect.bucket && (
                      <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
                        prospect.bucket === 'hot' ? 'bg-red-100 text-red-700' :
                        prospect.bucket === 'warm' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {prospect.bucket.toUpperCase()}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Choose Deck Type */}
        {step === 2 && selectedProspect && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-800">
                <strong>Selected:</strong> {selectedProspect.full_name}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#111827]">Choose Deck Type</h3>
                  <p className="text-xs text-[#6B7280]">Basic or Elite presentation</p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setDeckType('basic')}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    deckType === 'basic'
                      ? 'bg-blue-50 border-blue-500'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">Basic Deck</h4>
                      <p className="text-xs text-gray-600 mt-1">7 personalized slides</p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-lg">
                      FREE
                    </span>
                  </div>
                  <ul className="space-y-1 text-xs text-gray-600">
                    <li>• Introduction & rapport building</li>
                    <li>• Pain points & needs analysis</li>
                    <li>• Solution overview & benefits</li>
                    <li>• Call-to-action</li>
                  </ul>
                </button>

                <button
                  onClick={() => {
                    if (subscriptionTier === 'elite') {
                      setDeckType('elite');
                    } else {
                      setShowPaywall(true);
                    }
                  }}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left relative ${
                    deckType === 'elite'
                      ? 'bg-yellow-50 border-yellow-500'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {subscriptionTier !== 'elite' && (
                    <div className="absolute top-3 right-3">
                      <Lock className="w-5 h-5 text-yellow-600" />
                    </div>
                  )}
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">Elite Deck</h4>
                      <p className="text-xs text-gray-600 mt-1">15 advanced slides</p>
                    </div>
                    <span className="px-2 py-1 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-xs font-semibold rounded-lg">
                      ELITE
                    </span>
                  </div>
                  <ul className="space-y-1 text-xs text-gray-600">
                    <li>• All Basic features</li>
                    <li>• Deep personalization with ScoutScore</li>
                    <li>• Objection handling slides</li>
                    <li>• Conversation scripts & meeting invite</li>
                  </ul>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Select Goal */}
        {step === 3 && selectedProspect && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Target className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#111827]">What's Your Goal?</h3>
                  <p className="text-xs text-[#6B7280]">Choose your pitch objective</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setGoal('recruit')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    goal === 'recruit'
                      ? 'bg-blue-50 border-blue-500'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <Users className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                    <p className="font-semibold text-sm text-gray-900">Recruit</p>
                    <p className="text-xs text-gray-600 mt-1">Build your team</p>
                  </div>
                </button>

                <button
                  onClick={() => setGoal('sell')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    goal === 'sell'
                      ? 'bg-blue-50 border-blue-500'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <Zap className="w-6 h-6 mx-auto mb-2 text-green-600" />
                    <p className="font-semibold text-sm text-gray-900">Sell</p>
                    <p className="text-xs text-gray-600 mt-1">Offer product/service</p>
                  </div>
                </button>

                <button
                  onClick={() => setGoal('invite_call')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    goal === 'invite_call'
                      ? 'bg-blue-50 border-blue-500'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <Play className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                    <p className="font-semibold text-sm text-gray-900">Invite Call</p>
                    <p className="text-xs text-gray-600 mt-1">Book a meeting</p>
                  </div>
                </button>

                <button
                  onClick={() => setGoal('intro')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    goal === 'intro'
                      ? 'bg-blue-50 border-blue-500'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <Sparkles className="w-6 h-6 mx-auto mb-2 text-yellow-600" />
                    <p className="font-semibold text-sm text-gray-900">Introduce</p>
                    <p className="text-xs text-gray-600 mt-1">Start conversation</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Company Data */}
        {step === 4 && selectedProspect && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
                  <Database className="w-5 h-5 text-cyan-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#111827]">Customize with Company Data</h3>
                  <p className="text-xs text-[#6B7280]">Make it branded and accurate</p>
                </div>
              </div>

              {hasCompanyData && (
                <div className="mb-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-5 border-2 border-blue-200">
                  <label className="flex items-start gap-4 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useCompanyData}
                      onChange={(e) => setUseCompanyData(e.target.checked)}
                      className="mt-1 w-5 h-5 rounded border-blue-400 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Database className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold text-slate-900 text-base">
                          Use Your Company's Data
                        </span>
                      </div>
                      <p className="text-sm text-slate-700">
                        Use data you've already uploaded and processed by the Company Intelligence Engine
                        (company profile, materials, brand voice, products, AI insights)
                      </p>
                    </div>
                  </label>
                </div>
              )}

              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 hover:border-purple-400 transition-colors cursor-pointer bg-gradient-to-br from-white to-purple-50">
                  <input
                    type="file"
                    accept=".pdf,.ppt,.pptx,.doc,.docx,image/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setUploadedFiles([...uploadedFiles, ...files]);
                    }}
                    className="hidden"
                    id="company-files"
                  />
                  <label htmlFor="company-files" className="cursor-pointer">
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-purple-500 mx-auto mb-3" />
                      <p className="font-semibold text-gray-900 mb-1">
                        Upload Company Materials
                      </p>
                      <p className="text-sm text-gray-600">
                        Presentation, brochure, or product catalog
                      </p>
                    </div>
                  </label>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-3 bg-green-50 rounded-xl p-3 border border-green-200">
                        <FileText className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-gray-900 flex-1">{file.name}</span>
                        <button
                          onClick={() => setUploadedFiles(uploadedFiles.filter((_, i) => i !== index))}
                          className="text-gray-400 hover:text-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Or add company website
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="url"
                      value={companyWebsite}
                      onChange={(e) => setCompanyWebsite(e.target.value)}
                      placeholder="https://yourcompany.com"
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    AI will extract company story, products, and brand automatically
                  </p>
                </div>

                {(useCompanyData || uploadedFiles.length > 0 || companyWebsite) && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-green-900 mb-1">
                          {useCompanyData ? 'Using your Company Intelligence data!' : 'Great! Your AI is now supercharged!'}
                        </p>
                        <p className="text-xs text-green-800">
                          Your pitch deck will be customized with company data, brand voice, and products.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Choose Tone */}
        {step === 5 && selectedProspect && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                  <Palette className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#111827]">Choose Tone</h3>
                  <p className="text-xs text-[#6B7280]">How should we sound?</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'friendly', label: 'Friendly', desc: 'Warm & casual' },
                  { value: 'professional', label: 'Professional', desc: 'Formal & polished' },
                  { value: 'confident', label: 'Confident', desc: 'Direct & bold' },
                  { value: 'warm', label: 'Warm', desc: 'Caring & empathetic' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTone(option.value as any)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      tone === option.value
                        ? 'bg-blue-50 border-blue-500'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-semibold text-sm text-gray-900">{option.label}</p>
                    <p className="text-xs text-gray-600 mt-1">{option.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
              <h4 className="font-semibold text-gray-900 mb-3">Ready to Generate</h4>
              <div className="space-y-2 text-sm text-gray-700">
                <p>• <strong>Prospect:</strong> {selectedProspect.full_name}</p>
                <p>• <strong>Type:</strong> {deckType === 'basic' ? 'Basic (7 slides)' : 'Elite (15 slides)'}</p>
                <p>• <strong>Goal:</strong> {goal.replace('_', ' ')}</p>
                <p>• <strong>Tone:</strong> {tone}</p>
                <p>• <strong>Company Data:</strong> {useCompanyData ? 'Using saved data' : uploadedFiles.length > 0 || companyWebsite ? 'New materials added' : 'Generic'}</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Navigation Buttons */}
      <div className="fixed bottom-20 left-0 right-0 px-6 pb-4 z-20 bg-gradient-to-t from-white via-white to-transparent pt-6">
        <div className="flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 bg-white backdrop-blur-sm text-[#111827] text-base font-bold py-4 px-6 rounded-2xl border border-[#E5E7EB] shadow-md hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
          )}

          {step < 5 ? (
            <button
              onClick={() => {
                if (canProceedToStep(step + 1)) {
                  setStep(step + 1);
                }
              }}
              disabled={!canProceedToStep(step + 1)}
              className="flex-1 bg-gradient-to-r from-[#2563EB] via-[#2563EB] to-[#60A5FA] text-white text-base font-bold py-4 px-6 rounded-2xl shadow-lg border border-[#2563EB]/50 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next Step
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={generating || !selectedProspect}
              className="flex-1 bg-gradient-to-r from-[#2563EB] via-[#2563EB] to-[#60A5FA] text-white text-base font-bold py-4 px-6 rounded-2xl shadow-lg border border-[#2563EB]/50 flex items-center justify-center gap-2 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="size-6" />
                  <span>Generate Deck</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-[#E5E7EB] z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between px-6 h-[72px]">
          <button onClick={onNavigateToHome} className="flex flex-col items-center gap-1 text-[#9CA3AF] hover:text-[#2563EB] transition-colors">
            <Home className="size-6" />
            <span className="text-[10px] font-medium">Home</span>
          </button>
          <button onClick={onNavigateToProspects} className="flex flex-col items-center gap-1 text-[#9CA3AF] hover:text-[#2563EB] transition-colors">
            <Users className="size-6" />
            <span className="text-[10px] font-medium">Prospects</span>
          </button>
          <button
            onClick={() => onNavigate?.('chatbot-sessions')}
            className="relative -top-6 bg-[#1877F2] text-white size-14 rounded-full shadow-[0px_8px_24px_rgba(24,119,242,0.4)] flex items-center justify-center border-4 border-white transition-transform active:scale-95"
          >
            <MessageSquare className="size-7" />
          </button>
          <button onClick={onNavigateToPipeline} className="flex flex-col items-center gap-1 text-[#9CA3AF] hover:text-[#2563EB] transition-colors">
            <TrendingUp className="size-6" />
            <span className="text-[10px] font-medium">Pipeline</span>
          </button>
          <button onClick={() => setMenuOpen(true)} className="flex flex-col items-center gap-1 text-[#9CA3AF] hover:text-[#2563EB] transition-colors">
            <MoreHorizontal className="size-6" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>

      <ActionPopup
        isOpen={showActionPopup}
        onClose={() => setShowActionPopup(false)}
        onNavigateToPitchDeck={onNavigateToPitchDeck || (() => {})}
        onNavigateToMessageSequencer={onNavigateToMessageSequencer}
        onNavigateToRealTimeScan={onNavigateToRealTimeScan}
        onNavigateToDeepScan={onNavigateToDeepScan}
      />

      <SlideInMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={(page) => {
          setMenuOpen(false);
          if (onNavigate) {
            onNavigate(page);
          } else if (page === 'home') {
            onNavigateToHome?.();
          }
        }}
      />

      {showViewer && generatedDeck && selectedProspect && (
        <PitchDeckViewer
          slides={generatedDeck.slides}
          deckType={deckType}
          prospectName={selectedProspect.full_name}
          locked={generatedDeck.locked}
          upgradePrompt={generatedDeck.upgradePrompt}
          deckId={generatedDeckId}
          onClose={() => {
            setShowViewer(false);
            setStep(1);
            setSelectedProspect(null);
          }}
          onExport={handleExport}
          onRegenerate={handleGenerate}
          onUpgrade={() => {
            setShowViewer(false);
            setShowPaywall(true);
          }}
        />
      )}

      {showPaywall && (
        <PaywallModal
          isOpen={showPaywall}
          onClose={() => setShowPaywall(false)}
          feature="Elite Pitch Deck Generator"
          currentTier={subscriptionTier}
        />
      )}

      <LibraryMenu
        isOpen={showLibraryMenu}
        onClose={() => setShowLibraryMenu(false)}
        type="pitch_deck"
        onView={(id) => {
          setViewingDeckId(id);
          setShowLibraryMenu(false);
          onNavigate?.('pitch-deck-editor');
        }}
        onEdit={(id) => {
          setViewingDeckId(id);
          setShowLibraryMenu(false);
          onNavigate?.('pitch-deck-editor');
        }}
      />

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
