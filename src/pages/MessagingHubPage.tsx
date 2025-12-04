import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Sparkles, Shield, MessageCircle, Calendar, Lightbulb, RefreshCw, Users as UsersIcon, MessageSquare, Phone, Copy, Check, Home, Users, PlusCircle, TrendingUp, MoreHorizontal, BookOpen, Coins, Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { messagingEngine } from '../services/ai/messagingEngine';
import ActionPopup from '../components/ActionPopup';
import SlideInMenu from '../components/SlideInMenu';
import { useSubscription } from '../hooks/useSubscription';

interface MessagingHubPageProps {
  onNavigateToHome?: () => void;
  onNavigateToProspects?: () => void;
  onNavigateToPipeline?: () => void;
  onNavigateToMore?: () => void;
  onNavigate?: (page: string) => void;
}

interface Prospect {
  id: string;
  full_name: string;
  company_name?: string;
}

type ToolType = 'objection' | 'booking' | 'coaching' | 'message' | 'revival' | 'referral' | 'social' | 'call';

export default function MessagingHubPage({
  onNavigateToHome,
  onNavigateToProspects,
  onNavigateToPipeline,
  onNavigateToMore,
  onNavigate,
}: MessagingHubPageProps) {
  const { user } = useAuth();
  const { tier } = useSubscription();
  const [selectedTool, setSelectedTool] = useState<ToolType>('objection');
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [params, setParams] = useState<any>({
    objectionType: 'no_time',
    industry: 'mlm',
    tone: 'friendly',
    messageType: 'first_outreach',
    userGoal: 'recruit',
    lastInteractionDays: 30,
    context: 'warm_friend',
    rewardType: 'none',
    commentText: '',
    postType: 'personal',
    socialGoal: 'relationship_building',
    callGoal: 'book_meeting',
  });
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [showActionPopup, setShowActionPopup] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coinBalance, setCoinBalance] = useState(0);
  const [activeTab, setActiveTab] = useState<'generate' | 'library'>('generate');
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    if (user) {
      loadProspects();
      loadCoinBalance();
    }
  }, [user]);

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

  const loadProspects = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('prospects')
      .select('id, full_name, company_name')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    setProspects(data || []);
  };

  const filteredProspects = prospects.filter(
    (p) =>
      p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.company_name && p.company_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleGenerate = async () => {
    if (!user) return;
    if (!selectedProspect && selectedTool !== 'referral') return;

    setGenerating(true);
    setError(null);
    setResult(null);

    try {
      if (selectedTool === 'objection') {
        const response = await messagingEngine.generateObjectionResponse({
          userId: user.id,
          prospectId: selectedProspect!.id,
          objectionType: params.objectionType,
          industry: params.industry,
          tone: params.tone
        });
        setResult(response);
      } else if (selectedTool === 'booking') {
        const script = await messagingEngine.generateBookingScript({
          userId: user.id,
          prospectId: selectedProspect!.id,
          callType: 'zoom',
          industry: params.industry,
          tone: params.tone
        });
        setResult(script);
      } else if (selectedTool === 'coaching') {
        // TODO: Implement coaching in canonical engine
        setResult({ success: true, message: 'Coaching feature coming soon!' });
      } else if (selectedTool === 'message') {
        const message = await messagingEngine.generateMessage({
          userId: user.id,
          prospectId: selectedProspect!.id,
          prospectName: selectedProspect!.full_name,
          intent: params.messageType || 'recruit',
          tone: params.tone,
          industry: params.industry
        });
        setResult(message);
      } else if (selectedTool === 'revival') {
        const revival = await messagingEngine.generateRevivalMessage({
          userId: user.id,
          prospectId: selectedProspect!.id,
          daysSinceLastContact: params.lastInteractionDays,
          lastInteractionType: 'message',
          industry: params.industry
        });
        setResult(revival);
      } else if (selectedTool === 'referral') {
        const referral = await messagingEngine.generateReferralMessage({
          userId: user.id,
          prospectId: selectedProspect?.id || '',
          referrerName: params.context || 'a mutual friend',
          industry: params.industry,
          tone: params.tone
        });
        setResult(referral);
      } else if (selectedTool === 'social') {
        // TODO: Implement social reply in canonical engine
        setResult({ success: true, message: 'Social reply feature coming soon!' });
      } else if (selectedTool === 'call') {
        const call = await messagingEngine.generateCallScript({
          userId: user.id,
          prospectId: selectedProspect!.id,
          callPurpose: params.callGoal || 'discovery',
          industry: params.industry
        });
        setResult(call);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleSaveToLibrary = async () => {
    if (!user || !result || !selectedProspect) return;

    const messageContent = result.response || result.script || result.message ||
                          result.revivalMessage || result.referralMessage ||
                          result.publicReply || result.opening || '';

    await supabase.from('ai_messages_library').insert({
      user_id: user.id,
      prospect_id: selectedProspect.id,
      prospect_name: selectedProspect.full_name,
      title: `${selectedTool} - ${selectedProspect.full_name}`,
      message_content: messageContent,
      message_type: selectedTool,
      language: 'english',
      scenario: params.industry || 'general',
      is_favorite: false,
      times_used: 0,
    });

    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
  };

  const toolsGrid = [
    { id: 'objection', label: 'Objection Handler', icon: Shield, color: 'green' },
    { id: 'booking', label: 'Book Meeting', icon: Calendar, color: 'blue' },
    { id: 'coaching', label: 'Elite Coaching', icon: Lightbulb, color: 'purple' },
    { id: 'message', label: 'Smart Message', icon: MessageCircle, color: 'orange' },
    { id: 'revival', label: 'Lead Revival', icon: RefreshCw, color: 'red' },
    { id: 'referral', label: 'Referral Request', icon: UsersIcon, color: 'indigo' },
    { id: 'social', label: 'Social Reply', icon: MessageSquare, color: 'pink' },
    { id: 'call', label: 'Call Script', icon: Phone, color: 'teal' },
  ];

  return (
    <div className="bg-white min-h-screen text-gray-900 relative overflow-hidden pb-24">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-[500px] bg-gradient-to-br from-green-100 via-blue-50 to-purple-50 blur-[120px] rounded-full pointer-events-none" />

      <header className="relative z-10 px-6 pt-6 pb-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onNavigateToHome}
            className="flex items-center justify-center w-11 h-11 rounded-xl bg-white shadow-sm border border-gray-200"
          >
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Messaging Hub</h1>

          {/* Coin Balance */}
          <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-full border border-yellow-200">
            <Coins className="w-5 h-5 text-yellow-600" />
            <span className="text-sm font-bold text-yellow-900">{coinBalance.toLocaleString()}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('generate')}
            className={`flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'generate'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Generate
          </button>
          <button
            onClick={() => {
              setActiveTab('library');
              onNavigate?.('ai-messages');
            }}
            className={`flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'library'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Library
          </button>
        </div>
      </header>

      <div className="px-6 mb-6 relative z-10">
        <div className="grid grid-cols-2 gap-3">
          {toolsGrid.map((tool) => {
            const Icon = tool.icon;
            const isSelected = selectedTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => {
                  setSelectedTool(tool.id as ToolType);
                  setResult(null);
                }}
                className={`p-4 rounded-xl border-2 transition-all ${
                  isSelected
                    ? `bg-${tool.color}-50 border-${tool.color}-500`
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <Icon className={`w-6 h-6 mb-2 ${isSelected ? `text-${tool.color}-600` : 'text-gray-600'}`} />
                <div className="text-xs font-semibold text-gray-900">{tool.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-6 space-y-4 relative z-10 pb-32">
        {selectedTool !== 'referral' && selectedTool !== 'social' && (
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-lg">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Select Prospect</h2>
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search prospects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
              />
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {filteredProspects.slice(0, 5).map((prospect) => (
                <button
                  key={prospect.id}
                  onClick={() => setSelectedProspect(prospect)}
                  className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                    selectedProspect?.id === prospect.id
                      ? 'bg-blue-50 border-blue-500'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="font-semibold text-sm">{prospect.full_name}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedTool === 'social' && (
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-lg">
            <label className="text-sm font-semibold text-gray-700 mb-2 block">Comment/Post Text</label>
            <textarea
              value={params.commentText}
              onChange={(e) => setParams({ ...params, commentText: e.target.value })}
              placeholder="Paste the comment or post text here..."
              className="w-full h-24 p-3 border border-gray-200 rounded-xl text-sm resize-none"
            />
          </div>
        )}

        {['objection', 'booking', 'message', 'revival', 'referral', 'call'].includes(selectedTool) && (
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Industry</label>
                <select
                  value={params.industry}
                  onChange={(e) => setParams({ ...params, industry: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm"
                >
                  <option value="mlm">MLM</option>
                  <option value="insurance">Insurance</option>
                  <option value="real_estate">Real Estate</option>
                  <option value="product">Product</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Tone</label>
                <select
                  value={params.tone}
                  onChange={(e) => setParams({ ...params, tone: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm"
                >
                  <option value="friendly">Friendly</option>
                  <option value="professional">Professional</option>
                  <option value="warm">Warm</option>
                  <option value="direct">Direct</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-6 border-2 border-blue-200 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Generated Result</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveToLibrary}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    savedMessage
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {savedMessage ? (
                    <>
                      <Check className="w-4 h-4" />
                      Saved
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleCopy(
                    result.response || result.script || result.message || result.revivalMessage ||
                    result.referralMessage || result.publicReply || result.opening || ''
                  )}
                  className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg text-sm font-semibold"
                >
                  {copiedText ? (
                    <>
                      <Check className="w-4 h-4 text-green-600" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {(result.response || result.script || result.message || result.revivalMessage ||
                result.referralMessage || result.publicReply) && (
                <div className="bg-white rounded-xl p-4 whitespace-pre-wrap text-sm leading-relaxed">
                  {result.response || result.script || result.message || result.revivalMessage ||
                   result.referralMessage || result.publicReply}
                </div>
              )}

              {result.opening && (
                <div className="bg-white rounded-xl p-4">
                  <div className="font-semibold text-sm mb-2">Opening:</div>
                  <p className="text-sm">{result.opening}</p>
                </div>
              )}

              {result.discoveryQuestions && (
                <div className="bg-white rounded-xl p-4">
                  <div className="font-semibold text-sm mb-2">Discovery Questions:</div>
                  <ol className="space-y-1">
                    {result.discoveryQuestions.map((q: string, i: number) => (
                      <li key={i} className="text-sm">{i + 1}. {q}</li>
                    ))}
                  </ol>
                </div>
              )}

              {result.alternatives && result.alternatives.length > 0 && (
                <div className="bg-white rounded-xl p-4">
                  <div className="font-semibold text-sm mb-2">Alternatives:</div>
                  {result.alternatives.map((alt: string, i: number) => (
                    <div key={i} className="text-sm mb-2 pb-2 border-b last:border-0">{alt}</div>
                  ))}
                </div>
              )}

              {(result.cta || result.microCTA || result.softCTA) && (
                <div className="bg-blue-600 text-white rounded-xl p-3 text-center font-semibold text-sm">
                  {result.cta || result.microCTA || result.softCTA}
                </div>
              )}

              {(result.coachingTip || result.eliteCoachingTip) && tier === 'elite' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-sm text-yellow-900 mb-1">Elite Tip</div>
                      <p className="text-sm text-yellow-800">{result.coachingTip || result.eliteCoachingTip}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={(!selectedProspect && selectedTool !== 'referral' && selectedTool !== 'social') || generating}
          className="w-full py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl font-semibold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Sparkles className="w-5 h-5" />
          {generating ? 'Generating...' : 'Generate'}
        </button>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg">
        <div className="flex items-center justify-between px-6 h-18">
          <button onClick={onNavigateToHome} className="flex flex-col items-center gap-1 text-gray-400 hover:text-blue-600 transition-colors">
            <Home className="w-6 h-6" />
            <span className="text-xs font-medium">Home</span>
          </button>
          <button onClick={onNavigateToProspects} className="flex flex-col items-center gap-1 text-gray-400 hover:text-blue-600 transition-colors">
            <Users className="w-6 h-6" />
            <span className="text-xs font-medium">Prospects</span>
          </button>
          <button onClick={() => onNavigate?.('chatbot-sessions')} className="relative -top-6 bg-[#1877F2] text-white w-14 h-14 rounded-full shadow-[0px_8px_24px_rgba(24,119,242,0.4)] flex items-center justify-center border-4 border-white transition-transform active:scale-95">
            <MessageSquare className="w-7 h-7" />
          </button>
          <button onClick={onNavigateToPipeline} className="flex flex-col items-center gap-1 text-gray-400 hover:text-blue-600 transition-colors">
            <TrendingUp className="w-6 h-6" />
            <span className="text-xs font-medium">Pipeline</span>
          </button>
          <button onClick={() => setMenuOpen(true)} className="flex flex-col items-center gap-1 text-gray-400 hover:text-blue-600 transition-colors">
            <MoreHorizontal className="w-6 h-6" />
            <span className="text-xs font-medium">More</span>
          </button>
        </div>
        <ActionPopup isOpen={showActionPopup} onClose={() => setShowActionPopup(false)} onNavigateToPitchDeck={() => {}} onNavigateToMessageSequencer={() => {}} onNavigateToRealTimeScan={() => {}} onNavigateToDeepScan={() => {}} />
      </nav>

      <SlideInMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} onNavigate={(page) => { setMenuOpen(false); onNavigate?.(page); }} />
    </div>
  );
}
