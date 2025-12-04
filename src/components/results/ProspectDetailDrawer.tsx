import React, { useState } from 'react';
import { X, User, Brain, Radio, FileText, GitBranch, MessageSquare, Download } from 'lucide-react';

interface ProspectDetailDrawerProps {
  prospect: any;
  isOpen: boolean;
  onClose: () => void;
  onGenerateMessage: () => void;
  onGenerateDeck: () => void;
  onAddToPipeline: () => void;
  onAddNotes: () => void;
  onExport: () => void;
}

export default function ProspectDetailDrawer({
  prospect,
  isOpen,
  onClose,
  onGenerateMessage,
  onGenerateDeck,
  onAddToPipeline,
  onAddNotes,
  onExport,
}: ProspectDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'insights' | 'signals' | 'scripts' | 'pipeline'>(
    'profile'
  );

  if (!isOpen || !prospect) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 max-h-[85vh] flex flex-col animate-slide-up">
        <div className="flex-shrink-0 p-4 border-b border-[#E4E6EB]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {prospect.name?.charAt(0) || '?'}
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#050505]">{prospect.name}</h3>
                <span className="text-sm text-[#65676B]">ScoutScore: {prospect.score}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#F0F2F5] transition-colors"
            >
              <X className="w-6 h-6 text-[#65676B]" />
            </button>
          </div>

          <div className="flex gap-1 bg-[#F0F2F5] rounded-xl p-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'profile' ? 'bg-white text-[#1877F2] shadow-sm' : 'text-[#65676B]'
              }`}
            >
              <User className="w-4 h-4" />
              Profile
            </button>
            <button
              onClick={() => setActiveTab('insights')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'insights' ? 'bg-white text-[#1877F2] shadow-sm' : 'text-[#65676B]'
              }`}
            >
              <Brain className="w-4 h-4" />
              Insights
            </button>
            <button
              onClick={() => setActiveTab('signals')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'signals' ? 'bg-white text-[#1877F2] shadow-sm' : 'text-[#65676B]'
              }`}
            >
              <Radio className="w-4 h-4" />
              Social Signals
            </button>
            <button
              onClick={() => setActiveTab('scripts')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'scripts' ? 'bg-white text-[#1877F2] shadow-sm' : 'text-[#65676B]'
              }`}
            >
              <FileText className="w-4 h-4" />
              Scripts
            </button>
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'pipeline' ? 'bg-white text-[#1877F2] shadow-sm' : 'text-[#65676B]'
              }`}
            >
              <GitBranch className="w-4 h-4" />
              Pipeline
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-[#050505] mb-2">Basic Info</h4>
                <div className="bg-[#F0F2F5] rounded-xl p-4">
                  <p className="text-sm text-[#050505]">{prospect.summary || 'No summary available'}</p>
                </div>
              </div>

              {prospect.tags && prospect.tags.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-[#050505] mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {prospect.tags.map((tag: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-[#F0F2F5] rounded-full text-sm text-[#65676B]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="text-sm font-bold text-blue-900 mb-2">AI Analysis</h4>
                <p className="text-sm text-blue-700">
                  This prospect shows strong intent signals and is likely ready for engagement.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'signals' && (
            <div className="space-y-3">
              <div className="bg-[#F0F2F5] rounded-xl p-3">
                <span className="text-sm text-[#050505]">High engagement detected</span>
              </div>
              <div className="bg-[#F0F2F5] rounded-xl p-3">
                <span className="text-sm text-[#050505]">Active on LinkedIn</span>
              </div>
            </div>
          )}

          {activeTab === 'scripts' && (
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <h4 className="text-sm font-bold text-green-900 mb-2">Opening Message</h4>
                <p className="text-sm text-green-700">
                  Hi {prospect.name}, I noticed your interest in business opportunities...
                </p>
              </div>
            </div>
          )}

          {activeTab === 'pipeline' && (
            <div className="space-y-3">
              <p className="text-sm text-[#65676B]">Prospect not yet in pipeline</p>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 p-4 border-t border-[#E4E6EB] bg-white">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button
              onClick={onGenerateMessage}
              className="flex items-center justify-center gap-2 bg-[#1877F2] text-white py-3 rounded-xl font-semibold hover:bg-[#166FE5] transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Generate Message
            </button>
            <button
              onClick={onGenerateDeck}
              className="flex items-center justify-center gap-2 bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Generate Deck
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={onAddToPipeline}
              className="flex items-center justify-center gap-2 bg-[#F0F2F5] text-[#050505] py-2 rounded-xl font-semibold hover:bg-[#E4E6EB] transition-colors text-sm"
            >
              <GitBranch className="w-4 h-4" />
              Pipeline
            </button>
            <button
              onClick={onAddNotes}
              className="flex items-center justify-center gap-2 bg-[#F0F2F5] text-[#050505] py-2 rounded-xl font-semibold hover:bg-[#E4E6EB] transition-colors text-sm"
            >
              Notes
            </button>
            <button
              onClick={onExport}
              className="flex items-center justify-center gap-2 bg-[#F0F2F5] text-[#050505] py-2 rounded-xl font-semibold hover:bg-[#E4E6EB] transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
