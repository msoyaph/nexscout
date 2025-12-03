import { X, FileText, MessageSquare, Search, Zap } from 'lucide-react';

interface ActionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToPitchDeck: () => void;
  onNavigateToMessageSequencer?: () => void;
  onNavigateToRealTimeScan?: () => void;
  onNavigateToDeepScan?: () => void;
}

export default function ActionPopup({
  isOpen,
  onClose,
  onNavigateToPitchDeck,
  onNavigateToMessageSequencer,
  onNavigateToRealTimeScan,
  onNavigateToDeepScan
}: ActionPopupProps) {
  if (!isOpen) return null;

  const handlePitchDeckClick = () => {
    onClose();
    onNavigateToPitchDeck();
  };

  const handleMessageSequencerClick = () => {
    onClose();
    onNavigateToMessageSequencer?.();
  };

  const handleRealTimeScanClick = () => {
    onClose();
    onNavigateToRealTimeScan?.();
  };

  const handleDeepScanClick = () => {
    onClose();
    onNavigateToDeepScan?.();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 animate-[fadeIn_0.2s_ease-out]"
        onClick={onClose}
      />
      <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-3 animate-[slideUp_0.3s_ease-out]">
        <button
          onClick={onClose}
          className="self-end size-8 rounded-full bg-white shadow-[0px_4px_16px_rgba(0,0,0,0.12)] flex items-center justify-center border border-[#E5E7EB] mb-2 hover:bg-[#F9FAFB] transition-all active:scale-95"
        >
          <X className="size-5 text-[#6B7280]" />
        </button>
        <button onClick={handlePitchDeckClick} className="bg-white text-[#1A1A1A] px-6 py-4 rounded-2xl shadow-[0px_10px_42px_rgba(0,0,0,0.21)] border border-[#D1E3FF] flex items-center gap-4 min-w-[280px] hover:bg-[#F8FBFF] transition-all active:scale-95">
          <div className="size-6 flex items-center justify-center shrink-0">
            <FileText className="size-5 text-[#4A90E2]" />
          </div>
          <span className="text-sm font-normal text-[#4A4A4A]">Create AI Pitch Deck</span>
        </button>
        <button onClick={handleMessageSequencerClick} className="bg-white text-[#1A1A1A] px-6 py-4 rounded-2xl shadow-[0px_10px_42px_rgba(0,0,0,0.21)] border border-[#D1E3FF] flex items-center gap-4 min-w-[280px] hover:bg-[#F8FBFF] transition-all active:scale-95">
          <div className="size-6 flex items-center justify-center shrink-0">
            <MessageSquare className="size-5 text-[#4A90E2]" />
          </div>
          <span className="text-sm font-normal text-[#4A4A4A] text-left">Create AI Message Sequencer</span>
        </button>
        <button onClick={handleRealTimeScanClick} className="bg-white text-[#1A1A1A] px-6 py-4 rounded-2xl shadow-[0px_10px_42px_rgba(0,0,0,0.21)] border border-[#D1E3FF] flex items-center gap-4 min-w-[280px] hover:bg-[#F8FBFF] transition-all active:scale-95">
          <div className="size-6 flex items-center justify-center shrink-0">
            <Zap className="size-5 text-[#4A90E2]" />
          </div>
          <span className="text-sm font-normal text-[#4A4A4A]">AI Real-Time Scan</span>
        </button>
        <button onClick={handleDeepScanClick} className="bg-white text-[#1A1A1A] px-6 py-4 rounded-2xl shadow-[0px_10px_42px_rgba(0,0,0,0.21)] border border-[#D1E3FF] flex items-center gap-4 min-w-[280px] hover:bg-[#F8FBFF] transition-all active:scale-95">
          <div className="size-6 flex items-center justify-center shrink-0">
            <Search className="size-5 text-[#4A90E2]" />
          </div>
          <span className="text-sm font-normal text-[#4A4A4A]">AI Deep Scan</span>
        </button>
      </div>
    </>
  );
}
