import { useState } from 'react';
import { ArrowLeft, Search, History, TrendingUp, MessageCircle, Home, Users, PlusCircle, MoreHorizontal, MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { energyEngine } from '../services/energy/energyEngine';
import ActionPopup from '../components/ActionPopup';
import SlideInMenu from '../components/SlideInMenu';
import EnergyBar from '../components/EnergyBar';
import EnergyWarningModal from '../components/EnergyWarningModal';

interface AIDeepScanPageProps {
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

export default function AIDeepScanPage({
  onNavigateToHome,
  onNavigateToProspects,
  onNavigateToPipeline,
  onNavigateToMore,
  onNavigateToPitchDeck,
  onNavigateToMessageSequencer,
  onNavigateToRealTimeScan,
  onNavigateToDeepScan,
  onNavigate
}: AIDeepScanPageProps) {
  const { user } = useAuth();
  const [scanDepth, setScanDepth] = useState<'Quick' | 'Standard' | 'Deep'>('Standard');
  const [includeSocialHistory, setIncludeSocialHistory] = useState(true);
  const [analyzeEngagement, setAnalyzeEngagement] = useState(true);
  const [generatePainPoints, setGeneratePainPoints] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showActionPopup, setShowActionPopup] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showEnergyModal, setShowEnergyModal] = useState(false);
  const [scanning, setScanning] = useState(false);

  const handleStartScan = async () => {
    if (!user) return;

    try {
      // Check energy before scan
      const energyCheck = await energyEngine.canPerformAction(user.id, 'ai_deepscan');
      if (!energyCheck.canPerform) {
        setShowEnergyModal(true);
        return;
      }

      // Consume energy
      await energyEngine.tryConsumeEnergyOrThrow(user.id, 'ai_deepscan');

      setScanning(true);
      setProgress(65);

      // Simulate scan completion
      setTimeout(() => {
        setScanning(false);
        setProgress(100);
      }, 3000);
    } catch (err: any) {
      if (err.message === 'Insufficient energy') {
        setShowEnergyModal(true);
      }
    }
  };

  return (
    <div className="bg-[#0B1120] min-h-screen text-[#F9FAFB] relative overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1F2937]">
        <button
          onClick={onNavigateToHome}
          className="flex items-center justify-center size-11"
        >
          <ArrowLeft className="size-6" />
        </button>
        <h1 className="text-lg font-semibold">AI Deep Scan</h1>
        <EnergyBar onEnergyClick={() => onNavigate?.('energy-refill')} compact />
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        <div className="p-4 space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#F9FAFB]">
              Search/Select Prospect
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name or handle"
                className="w-full px-4 py-3 pl-11 rounded-xl bg-[#1F2937] text-[#F9FAFB] border border-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
              <Search className="size-5 text-[#9CA3AF] absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="relative flex items-center justify-center py-12">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute size-[280px] rounded-full bg-[#2563EB] opacity-5 animate-[ping_3s_ease-in-out_infinite]" />
              <div className="absolute size-[220px] rounded-full bg-[#2563EB] opacity-10 animate-[ping_3s_ease-in-out_infinite_0.5s]" />
              <div className="absolute size-[160px] rounded-full bg-[#22C55E] opacity-15 animate-[ping_3s_ease-in-out_infinite_1s]" />
              <div className="absolute size-[100px] rounded-full bg-[#22C55E] opacity-20 animate-[ping_3s_ease-in-out_infinite_1.5s]" />
            </div>
            <div className="relative size-[260px] rounded-full border-4 border-[#2563EB]/20 flex items-center justify-center animate-[spin_8s_linear_infinite]">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 size-4 rounded-full bg-[#2563EB] shadow-[0_0_20px_rgba(37,99,235,0.6)]" />
              <div className="absolute size-[220px] rounded-full border-4 border-[#2563EB]/30" />
              <div className="absolute size-[180px] rounded-full border-4 border-[#22C55E]/40" />
              <div className="absolute size-[140px] rounded-full bg-gradient-to-br from-[#2563EB]/20 to-[#22C55E]/20 backdrop-blur-sm flex items-center justify-center">
                <div className="size-[100px] rounded-full bg-gradient-to-br from-[#2563EB]/30 to-[#22C55E]/30 backdrop-blur-md flex items-center justify-center animate-pulse">
                  <div className="size-14 text-[#2563EB] flex items-center justify-center">
                    <svg className="size-14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h10v2H7z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleStartScan}
            disabled={scanning}
            className="w-full py-4 px-6 bg-[#2563EB] text-white rounded-xl font-semibold text-base shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {scanning ? 'Scanning...' : 'Start Deep Scan'}
          </button>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-[#F9FAFB]">Scan Parameters</h2>

            <div className="bg-[#111827] rounded-xl border border-[#1F2937] p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-[#F9FAFB]">Scan Depth</h3>
                  <p className="text-xs text-[#9CA3AF]">{scanDepth}</p>
                </div>
                <div className="flex items-center gap-2 bg-[#1F2937] rounded-lg p-1">
                  {(['Quick', 'Standard', 'Deep'] as const).map((depth) => (
                    <button
                      key={depth}
                      onClick={() => setScanDepth(depth)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                        scanDepth === depth
                          ? 'bg-[#2563EB] text-white'
                          : 'text-[#F9FAFB]'
                      }`}
                    >
                      {depth}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <ToggleCard
              icon={<History className="size-5 text-[#2563EB]" />}
              title="Include Social History"
              description="Analyze past interactions"
              enabled={includeSocialHistory}
              onToggle={() => setIncludeSocialHistory(!includeSocialHistory)}
            />

            <ToggleCard
              icon={<TrendingUp className="size-5 text-[#22C55E]" />}
              title="Analyze Engagement Patterns"
              description="Track interaction trends"
              enabled={analyzeEngagement}
              onToggle={() => setAnalyzeEngagement(!analyzeEngagement)}
            />

            <ToggleCard
              icon={<MessageCircle className="size-5 text-[#F59E0B]" />}
              title="Generate Pain Points"
              description="Identify key challenges"
              enabled={generatePainPoints}
              onToggle={() => setGeneratePainPoints(!generatePainPoints)}
            />
          </div>

          <div className="bg-[#111827] rounded-xl border border-[#1F2937] p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#F9FAFB]">Scan Progress</span>
              <span className="text-sm font-semibold text-[#2563EB]">{progress}%</span>
            </div>
            <div className="h-2 bg-[#1F2937] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#2563EB] to-[#22C55E] rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="space-y-2 pt-2">
              <ProgressStep text="Initializing scan..." active={progress > 0} />
              <ProgressStep text="Analyzing social signals..." active={progress > 30} />
              <ProgressStep text="Generating insights..." active={progress > 60} />
            </div>
          </div>
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 w-full bg-[#0B1120]/95 backdrop-blur-xl border-t border-[#1F2937] z-50 shadow-[0px_-8px_24px_rgba(0,0,0,0.08)]">
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
          <button onClick={onNavigateToPipeline} className="flex flex-col items-center gap-1 text-[#2563EB]">
            <TrendingUp className="size-6" />
            <span className="text-[10px] font-medium">Pipeline</span>
          </button>
          <button onClick={() => setMenuOpen(true)} className="flex flex-col items-center gap-1 text-[#9CA3AF] hover:text-[#2563EB] transition-colors">
            <MoreHorizontal className="size-6" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
        <ActionPopup
          isOpen={showActionPopup}
          onClose={() => setShowActionPopup(false)}
          onNavigateToPitchDeck={onNavigateToPitchDeck || (() => {})}
          onNavigateToMessageSequencer={onNavigateToMessageSequencer}
          onNavigateToRealTimeScan={onNavigateToRealTimeScan}
          onNavigateToDeepScan={onNavigateToDeepScan}
        />
      </nav>

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

      <EnergyWarningModal
        isOpen={showEnergyModal}
        onClose={() => setShowEnergyModal(false)}
        currentEnergy={0}
        requiredEnergy={3}
        feature="AI Deep Scan"
        onSuccess={() => {
          setShowEnergyModal(false);
          handleStartScan();
        }}
      />
    </div>
  );
}

function ToggleCard({ icon, title, description, enabled, onToggle }: { icon: React.ReactNode; title: string; description: string; enabled: boolean; onToggle: () => void }) {
  return (
    <div className="bg-[#111827] rounded-xl border border-[#1F2937] p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-[#2563EB]/10 flex items-center justify-center">
            {icon}
          </div>
          <div className="space-y-0.5">
            <h3 className="text-sm font-medium text-[#F9FAFB]">{title}</h3>
            <p className="text-xs text-[#9CA3AF]">{description}</p>
          </div>
        </div>
        <button
          onClick={onToggle}
          className={`relative w-11 h-6 rounded-full cursor-pointer transition-colors ${
            enabled ? 'bg-[#2563EB]' : 'bg-[#1F2937]'
          }`}
        >
          <div
            className={`absolute top-1 size-4 rounded-full bg-white transition-all ${
              enabled ? 'right-1' : 'left-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
}

function ProgressStep({ text, active }: { text: string; active: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${active ? 'opacity-100' : 'opacity-40'}`}>
      <div className={`size-2 rounded-full ${active ? 'bg-[#22C55E]' : 'bg-[#9CA3AF]'}`} />
      <span className="text-xs text-[#9CA3AF]">{text}</span>
    </div>
  );
}
