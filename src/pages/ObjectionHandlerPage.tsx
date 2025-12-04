import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Sparkles, Shield, MessageCircle, Calendar, Lightbulb, Copy, Check, Home, Users, PlusCircle, TrendingUp, MoreHorizontal, MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { messagingEngine, ObjectionResponse, BookingScript } from '../services/ai/messagingEngine';
import ActionPopup from '../components/ActionPopup';
import SlideInMenu from '../components/SlideInMenu';
import { useSubscription } from '../hooks/useSubscription';
import EnergyBar from '../components/EnergyBar';
import EnergyWarningModal from '../components/EnergyWarningModal';

interface ObjectionHandlerPageProps {
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

type ToolType = 'objection' | 'booking' | 'coaching' | 'message';

export default function ObjectionHandlerPage({
  onNavigateToHome,
  onNavigateToProspects,
  onNavigateToPipeline,
  onNavigateToMore,
  onNavigate,
}: ObjectionHandlerPageProps) {
  const { user } = useAuth();
  const { tier } = useSubscription();
  const [selectedTool, setSelectedTool] = useState<ToolType>('objection');
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [objectionType, setObjectionType] = useState<string>('no_time');
  const [industry, setIndustry] = useState<'mlm' | 'insurance' | 'real_estate' | 'product'>('mlm');
  const [tone, setTone] = useState<'friendly' | 'professional' | 'warm' | 'direct'>('friendly');
  const [messageType, setMessageType] = useState<string>('first_outreach');
  const [userGoal, setUserGoal] = useState<string>('recruit');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [showActionPopup, setShowActionPopup] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEnergyModal, setShowEnergyModal] = useState(false);
  const [energyModalData, setEnergyModalData] = useState({
    current: 0,
    required: 0,
    feature: ''
  });

  useEffect(() => {
    if (user) {
      loadProspects();
    }
  }, [user]);

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
    if (!user || !selectedProspect) return;

    setGenerating(true);
    setError(null);
    setResult(null);

    try {
      if (selectedTool === 'objection') {
        const response = await messagingEngine.generateObjectionResponse({
          userId: user.id,
          prospectId: selectedProspect.id,
          objectionType: objectionType as any,
          industry,
          tone
        });
        setResult(response);
      } else if (selectedTool === 'booking') {
        const script = await messagingEngine.generateBookingScript({
          userId: user.id,
          prospectId: selectedProspect.id,
          callType: 'zoom',
          industry,
          tone: tone as any
        });
        setResult(script);
      } else if (selectedTool === 'coaching') {
        // TODO: Implement coaching in canonical engine
        setResult({ success: true, message: 'Coaching feature coming soon!' });
      } else if (selectedTool === 'message') {
        const message = await messagingEngine.generateMessage({
          userId: user.id,
          prospectId: selectedProspect.id,
          prospectName: selectedProspect.full_name,
          intent: messageType as any,
          tone,
          industry
        });
        setResult(message);
      }
    } catch (err: any) {
      if (err.message === 'Insufficient energy') {
        setShowEnergyModal(true);
        setEnergyModalData({
          current: 0,
          required: 1,
          feature: selectedTool === 'objection' ? 'Objection Handler' : selectedTool === 'booking' ? 'Booking Script' : 'Message'
        });
      } else {
        setError(err.message || 'Failed to generate');
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="bg-white min-h-screen text-gray-900 relative overflow-hidden pb-24">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-[500px] bg-gradient-to-br from-green-100 via-blue-50 to-green-50 blur-[120px] rounded-full pointer-events-none" />

      <header className="relative z-10 px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onNavigateToHome}
            className="flex items-center justify-center w-11 h-11 rounded-xl bg-white shadow-sm border border-gray-200"
          >
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">AI Messaging Tools</h1>
          <EnergyBar onEnergyClick={() => onNavigate?.('energy-refill')} compact />
        </div>
      </header>

      <div className="px-6 mb-6 relative z-10">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              setSelectedTool('objection');
              setResult(null);
            }}
            className={`p-4 rounded-xl border-2 transition-all ${
              selectedTool === 'objection'
                ? 'bg-green-50 border-green-500'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <Shield className={`w-6 h-6 mb-2 ${selectedTool === 'objection' ? 'text-green-600' : 'text-gray-600'}`} />
            <div className="text-sm font-semibold text-gray-900">Objection Handler</div>
          </button>
          <button
            onClick={() => {
              setSelectedTool('booking');
              setResult(null);
            }}
            className={`p-4 rounded-xl border-2 transition-all ${
              selectedTool === 'booking'
                ? 'bg-blue-50 border-blue-500'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <Calendar className={`w-6 h-6 mb-2 ${selectedTool === 'booking' ? 'text-blue-600' : 'text-gray-600'}`} />
            <div className="text-sm font-semibold text-gray-900">Booking Script</div>
          </button>
          <button
            onClick={() => {
              setSelectedTool('coaching');
              setResult(null);
            }}
            className={`p-4 rounded-xl border-2 transition-all ${
              selectedTool === 'coaching'
                ? 'bg-purple-50 border-purple-500'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <Lightbulb className={`w-6 h-6 mb-2 ${selectedTool === 'coaching' ? 'text-purple-600' : 'text-gray-600'}`} />
            <div className="text-sm font-semibold text-gray-900">Elite Coaching</div>
          </button>
          <button
            onClick={() => {
              setSelectedTool('message');
              setResult(null);
            }}
            className={`p-4 rounded-xl border-2 transition-all ${
              selectedTool === 'message'
                ? 'bg-orange-50 border-orange-500'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <MessageCircle className={`w-6 h-6 mb-2 ${selectedTool === 'message' ? 'text-orange-600' : 'text-gray-600'}`} />
            <div className="text-sm font-semibold text-gray-900">Smart Message</div>
          </button>
        </div>
      </div>

      <div className="px-6 space-y-6 relative z-10 pb-32">
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
                {prospect.company_name && (
                  <div className="text-xs text-gray-600">{prospect.company_name}</div>
                )}
              </button>
            ))}
          </div>
        </div>

        {selectedTool === 'objection' && (
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-lg">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Objection Type</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'no_time', label: 'No Time' },
                { value: 'no_money', label: 'No Money' },
                { value: 'not_now', label: 'Not Now' },
                { value: 'too_expensive', label: 'Too Expensive' },
                { value: 'skeptic', label: 'Skeptical' },
                { value: 'already_tried', label: 'Already Tried' },
                { value: 'thinking_about_it', label: 'Thinking About It' },
                { value: 'busy', label: 'Too Busy' },
                { value: 'needs_approval', label: 'Needs Approval' },
                { value: 'not_interested', label: 'Not Interested' },
              ].map((obj) => (
                <button
                  key={obj.value}
                  onClick={() => setObjectionType(obj.value)}
                  className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                    objectionType === obj.value
                      ? 'bg-green-50 border-green-500 text-green-700'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  {obj.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedTool === 'message' && (
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-lg">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Message Type</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'first_outreach', label: 'First Outreach' },
                { value: 'follow_up', label: 'Follow-Up' },
                { value: 'reconnect', label: 'Reconnect' },
                { value: 'nurture', label: 'Nurture' },
              ].map((msg) => (
                <button
                  key={msg.value}
                  onClick={() => setMessageType(msg.value)}
                  className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                    messageType === msg.value
                      ? 'bg-orange-50 border-orange-500 text-orange-700'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  {msg.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedTool === 'coaching' && (
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-lg">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Your Goal</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'recruit', label: 'Recruit' },
                { value: 'sell', label: 'Sell' },
                { value: 'follow_up', label: 'Follow-Up' },
                { value: 'close_call', label: 'Close Call' },
              ].map((goal) => (
                <button
                  key={goal.value}
                  onClick={() => setUserGoal(goal.value)}
                  className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                    userGoal === goal.value
                      ? 'bg-purple-50 border-purple-500 text-purple-700'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  {goal.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as any)}
                className="w-full p-3 border border-gray-200 rounded-xl"
              >
                <option value="friendly">Friendly</option>
                <option value="professional">Professional</option>
                <option value="warm">Warm</option>
                <option value="direct">Direct</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Industry</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value as any)}
                className="w-full p-3 border border-gray-200 rounded-xl"
              >
                <option value="mlm">MLM</option>
                <option value="insurance">Insurance</option>
                <option value="real_estate">Real Estate</option>
                <option value="product">Product</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-6 border-2 border-blue-200 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Generated Result</h3>
              <button
                onClick={() => handleCopy(result.response || result.script || result.message || result.situationAnalysis)}
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

            {(result.response || result.script || result.message) && (
              <div className="bg-white rounded-xl p-4 mb-4 whitespace-pre-wrap text-sm leading-relaxed">
                {result.response || result.script || result.message}
              </div>
            )}

            {result.cta && (
              <div className="bg-blue-600 text-white rounded-xl p-3 mb-4 text-center font-semibold">
                {result.cta}
              </div>
            )}

            {result.reinforcementPoints && (
              <div className="bg-white rounded-xl p-4 mb-4">
                <div className="font-semibold text-sm mb-2">Key Points:</div>
                <ul className="space-y-1">
                  {result.reinforcementPoints.map((point: string, i: number) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-blue-600">•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.timeSuggestions && (
              <div className="bg-white rounded-xl p-4 mb-4">
                <div className="font-semibold text-sm mb-2">Suggested Times:</div>
                <div className="flex flex-wrap gap-2">
                  {result.timeSuggestions.map((time: string, i: number) => (
                    <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                      {time}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {result.situationAnalysis && (
              <div className="bg-white rounded-xl p-4 mb-4">
                <div className="font-semibold text-sm mb-2">Situation Analysis:</div>
                <p className="text-sm text-gray-700">{result.situationAnalysis}</p>
              </div>
            )}

            {result.recommendedMessage && (
              <div className="bg-white rounded-xl p-4 mb-4">
                <div className="font-semibold text-sm mb-2">Recommended Message:</div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{result.recommendedMessage}</p>
              </div>
            )}

            {result.doNext && (
              <div className="bg-white rounded-xl p-4 mb-4">
                <div className="font-semibold text-sm mb-2">Next Steps:</div>
                <ol className="space-y-1">
                  {result.doNext.map((step: string, i: number) => (
                    <li key={i} className="text-sm text-gray-700">
                      {i + 1}. {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {result.coachingTip && tier === 'elite' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-sm text-yellow-900 mb-1">Elite Coaching Tip</div>
                    <p className="text-sm text-yellow-800">{result.coachingTip}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={!selectedProspect || generating}
          className="w-full py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl font-semibold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Sparkles className="w-5 h-5" />
          {generating ? 'Generating...' : `Generate ${selectedTool === 'objection' ? 'Response' : selectedTool === 'booking' ? 'Script' : selectedTool === 'coaching' ? 'Coaching' : 'Message'}`}
        </button>
      </div>

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
        <ActionPopup
          isOpen={showActionPopup}
          onClose={() => setShowActionPopup(false)}
          onNavigateToPitchDeck={() => {}}
          onNavigateToMessageSequencer={() => {}}
          onNavigateToRealTimeScan={() => {}}
          onNavigateToDeepScan={() => {}}
        />
      </nav>

      <SlideInMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={(page) => {
          setMenuOpen(false);
          onNavigate?.(page);
        }}
      />

      <EnergyWarningModal
        isOpen={showEnergyModal}
        onClose={() => setShowEnergyModal(false)}
        currentEnergy={energyModalData.current}
        requiredEnergy={energyModalData.required}
        feature={energyModalData.feature}
        onSuccess={() => {
          setShowEnergyModal(false);
          handleGenerate();
        }}
      />
    </div>
  );
}
