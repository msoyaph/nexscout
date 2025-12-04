import React from 'react';
import { Flame, Tag, Target, Users, Brain, Lightbulb } from 'lucide-react';

interface AIInsightsDashboardProps {
  topHotProspects: Array<{ name: string; score: number }>;
  commonInterests: string[];
  intentSignals: string[];
  engagementPatterns: string[];
  personaClusters: Array<{ label: string; count: number }>;
  aiStrategy: string;
}

export default function AIInsightsDashboard({
  topHotProspects,
  commonInterests,
  intentSignals,
  engagementPatterns,
  personaClusters,
  aiStrategy,
}: AIInsightsDashboardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#E4E6EB] p-6">
      <h3 className="text-lg font-bold text-[#050505] mb-4 flex items-center gap-2">
        <Brain className="w-5 h-5 text-[#1877F2]" />
        AI Insights
      </h3>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
        <div className="flex-shrink-0 w-72 bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-5 h-5 text-red-600" />
            <h4 className="font-bold text-red-900">Top 3 Hot Prospects</h4>
          </div>
          <div className="space-y-2">
            {topHotProspects.slice(0, 3).map((prospect, idx) => (
              <div key={idx} className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2">
                <span className="text-sm font-semibold text-[#050505] truncate">{prospect.name}</span>
                <span className="text-sm font-bold text-red-600">{prospect.score}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-shrink-0 w-72 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="w-5 h-5 text-purple-600" />
            <h4 className="font-bold text-purple-900">Common Interests</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {commonInterests.slice(0, 6).map((interest, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-white/60 rounded-full text-xs font-semibold text-purple-700"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>

        <div className="flex-shrink-0 w-72 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-green-600" />
            <h4 className="font-bold text-green-900">High Intent Signals</h4>
          </div>
          <div className="space-y-1.5">
            {intentSignals.slice(0, 4).map((signal, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-white/60 rounded-lg px-3 py-1.5">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full" />
                <span className="text-sm text-[#050505]">{signal}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-shrink-0 w-72 bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-blue-600" />
            <h4 className="font-bold text-blue-900">Engagement Patterns</h4>
          </div>
          <div className="space-y-2">
            {engagementPatterns.slice(0, 3).map((pattern, idx) => (
              <div key={idx} className="text-sm text-[#050505] bg-white/60 rounded-lg px-3 py-2">
                {pattern}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-shrink-0 w-72 bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-yellow-600" />
            <h4 className="font-bold text-yellow-900">Persona Clusters</h4>
          </div>
          <div className="space-y-2">
            {personaClusters.map((cluster, idx) => (
              <div key={idx} className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2">
                <span className="text-sm font-semibold text-[#050505]">{cluster.label}</span>
                <span className="text-sm font-bold text-yellow-600">{cluster.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-shrink-0 w-80 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-indigo-600" />
            <h4 className="font-bold text-indigo-900">AI Recommended Strategy</h4>
          </div>
          <p className="text-sm text-[#050505] leading-relaxed bg-white/60 rounded-lg px-3 py-2">
            {aiStrategy}
          </p>
        </div>
      </div>
    </div>
  );
}
