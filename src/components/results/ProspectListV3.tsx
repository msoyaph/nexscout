import React, { useState } from 'react';
import { List, Grid, Flame, MessageSquare, FileText, Plus, StickyNote } from 'lucide-react';

interface Prospect {
  id: string;
  name: string;
  score: number;
  rank: 'hot' | 'warm' | 'cold';
  summary: string;
  tags: string[];
  avatar?: string;
}

interface ProspectListV3Props {
  prospects: Prospect[];
  onProspectClick: (prospect: Prospect) => void;
  onMessage: (prospect: Prospect) => void;
  onDeck: (prospect: Prospect) => void;
  onPipeline: (prospect: Prospect) => void;
  onNotes: (prospect: Prospect) => void;
}

export default function ProspectListV3({
  prospects,
  onProspectClick,
  onMessage,
  onDeck,
  onPipeline,
  onNotes,
}: ProspectListV3Props) {
  const [viewMode, setViewMode] = useState<'list' | 'swipe'>('list');
  const [currentSwipeIndex, setCurrentSwipeIndex] = useState(0);

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'hot':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'warm':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'cold':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const currentProspect = prospects[currentSwipeIndex];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#E4E6EB]">
      <div className="flex items-center justify-between p-4 border-b border-[#E4E6EB]">
        <h3 className="text-lg font-bold text-[#050505]">Prospects ({prospects.length})</h3>

        <div className="flex items-center gap-1 bg-[#F0F2F5] rounded-lg p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
              viewMode === 'list' ? 'bg-white text-[#1877F2] shadow-sm' : 'text-[#65676B]'
            }`}
          >
            <List className="w-4 h-4" />
            List
          </button>
          <button
            onClick={() => setViewMode('swipe')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
              viewMode === 'swipe' ? 'bg-white text-[#1877F2] shadow-sm' : 'text-[#65676B]'
            }`}
          >
            <Grid className="w-4 h-4" />
            Swipe
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="divide-y divide-[#E4E6EB] max-h-[600px] overflow-y-auto">
          {prospects.map((prospect) => (
            <div
              key={prospect.id}
              className="p-4 hover:bg-[#F0F2F5] transition-colors cursor-pointer"
              onClick={() => onProspectClick(prospect)}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {prospect.name.charAt(0)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-[#050505] truncate">{prospect.name}</h4>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getRankColor(
                        prospect.rank
                      )}`}
                    >
                      {prospect.score}
                    </span>
                    {prospect.rank === 'hot' && <Flame className="w-4 h-4 text-red-500" />}
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    {prospect.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-[#F0F2F5] rounded-md text-xs text-[#65676B]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMessage(prospect);
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blue-100 text-[#65676B] hover:text-[#1877F2] transition-colors"
                    title="Generate Message"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeck(prospect);
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-purple-100 text-[#65676B] hover:text-purple-600 transition-colors"
                    title="Generate Deck"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPipeline(prospect);
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-green-100 text-[#65676B] hover:text-green-600 transition-colors"
                    title="Add to Pipeline"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6">
          {currentProspect ? (
            <div className="max-w-sm mx-auto">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border-2 border-[#E4E6EB] p-6 shadow-lg">
                <div className="flex flex-col items-center mb-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-3xl mb-3 shadow-lg">
                    {currentProspect.name.charAt(0)}
                  </div>
                  <h3 className="text-2xl font-bold text-[#050505] mb-2">{currentProspect.name}</h3>
                  <div
                    className={`px-4 py-1.5 rounded-full text-sm font-bold border ${getRankColor(
                      currentProspect.rank
                    )}`}
                  >
                    ScoutScore: {currentProspect.score}
                  </div>
                </div>

                <p className="text-sm text-[#050505] mb-4 text-center leading-relaxed">
                  {currentProspect.summary}
                </p>

                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  {currentProspect.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-white/80 rounded-full text-xs font-semibold text-[#65676B]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onMessage(currentProspect)}
                    className="flex items-center justify-center gap-2 bg-[#1877F2] text-white py-3 rounded-xl font-semibold hover:bg-[#166FE5] transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Message
                  </button>
                  <button
                    onClick={() => onDeck(currentProspect)}
                    className="flex items-center justify-center gap-2 bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    Deck
                  </button>
                  <button
                    onClick={() => onPipeline(currentProspect)}
                    className="flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Pipeline
                  </button>
                  <button
                    onClick={() => onNotes(currentProspect)}
                    className="flex items-center justify-center gap-2 bg-amber-600 text-white py-3 rounded-xl font-semibold hover:bg-amber-700 transition-colors"
                  >
                    <StickyNote className="w-4 h-4" />
                    Notes
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between mt-6">
                <button
                  onClick={() => setCurrentSwipeIndex(Math.max(0, currentSwipeIndex - 1))}
                  disabled={currentSwipeIndex === 0}
                  className="px-6 py-2 bg-[#F0F2F5] rounded-xl font-semibold text-[#050505] hover:bg-[#E4E6EB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-[#65676B]">
                  {currentSwipeIndex + 1} / {prospects.length}
                </span>
                <button
                  onClick={() =>
                    setCurrentSwipeIndex(Math.min(prospects.length - 1, currentSwipeIndex + 1))
                  }
                  disabled={currentSwipeIndex === prospects.length - 1}
                  className="px-6 py-2 bg-[#F0F2F5] rounded-xl font-semibold text-[#050505] hover:bg-[#E4E6EB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-[#65676B]">No prospects found</div>
          )}
        </div>
      )}
    </div>
  );
}
