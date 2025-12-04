import React, { useState } from 'react';
import { Zap, MessageSquare, FileStack, Download, Save, X } from 'lucide-react';

interface FloatingActionBubbleProps {
  onBlastMessage: () => void;
  onBatchDeck: () => void;
  onExportLeads: () => void;
  onSaveScan: () => void;
}

export default function FloatingActionBubble({
  onBlastMessage,
  onBatchDeck,
  onExportLeads,
  onSaveScan,
}: FloatingActionBubbleProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {isOpen && (
        <div className="fixed bottom-24 right-6 bg-white rounded-2xl shadow-2xl border border-[#E4E6EB] p-3 space-y-2 animate-slide-up z-40">
          <button
            onClick={() => {
              onBlastMessage();
              setIsOpen(false);
            }}
            className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[#F0F2F5] rounded-xl transition-colors text-left"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-5 h-5 text-[#1877F2]" />
            </div>
            <div>
              <div className="font-semibold text-[#050505] text-sm">Blast Message</div>
              <div className="text-xs text-[#65676B]">Send to multiple prospects</div>
            </div>
          </button>

          <button
            onClick={() => {
              onBatchDeck();
              setIsOpen(false);
            }}
            className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[#F0F2F5] rounded-xl transition-colors text-left"
          >
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <FileStack className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="font-semibold text-[#050505] text-sm">Batch Deck</div>
              <div className="text-xs text-[#65676B]">Generate decks for all</div>
            </div>
          </button>

          <button
            onClick={() => {
              onExportLeads();
              setIsOpen(false);
            }}
            className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[#F0F2F5] rounded-xl transition-colors text-left"
          >
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Download className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="font-semibold text-[#050505] text-sm">Export Leads</div>
              <div className="text-xs text-[#65676B]">Download as CSV</div>
            </div>
          </button>

          <button
            onClick={() => {
              onSaveScan();
              setIsOpen(false);
            }}
            className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[#F0F2F5] rounded-xl transition-colors text-left"
          >
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Save className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="font-semibold text-[#050505] text-sm">Save Scan</div>
              <div className="text-xs text-[#65676B]">Add to library</div>
            </div>
          </button>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-[#1877F2] to-purple-600 rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-110 transition-transform z-50"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
      </button>
    </>
  );
}
