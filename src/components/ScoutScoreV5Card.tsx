import React from 'react';
import { TrendingUp, Target, Heart, Users, CheckCircle2, Zap } from 'lucide-react';

interface ScoutScoreV5CardProps {
  scoutScoreV5: {
    score: number;
    rank: 'hot' | 'warm' | 'cold';
    confidence: number;
    contributingFactors: Array<{
      category: string;
      signal: string;
      points: number;
      weight: number;
    }>;
    breakdown: {
      intentSignals: number;
      painPoints: number;
      lifeEvents: number;
      authorityInfluence: number;
      relationshipStrength: number;
      profileCompleteness: number;
    };
  };
}

export default function ScoutScoreV5Card({ scoutScoreV5 }: ScoutScoreV5CardProps) {
  const { score, rank, confidence, contributingFactors, breakdown } = scoutScoreV5;

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'hot':
        return 'from-red-500 to-orange-500';
      case 'warm':
        return 'from-yellow-500 to-orange-500';
      case 'cold':
        return 'from-blue-500 to-cyan-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getRankBg = (rank: string) => {
    switch (rank) {
      case 'hot':
        return 'bg-red-50 border-red-200';
      case 'warm':
        return 'bg-yellow-50 border-yellow-200';
      case 'cold':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const categoryIcons: Record<string, any> = {
    'Intent Signals': Target,
    'Pain Points': Heart,
    'Life Events': Zap,
    'Authority': Users,
    'Relationship': Users,
    'Profile': CheckCircle2,
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">ScoutScore V5</h3>
          <p className="text-slate-600 text-sm">Multi-signal intelligence scoring</p>
        </div>
        <div className={`px-4 py-2 rounded-xl bg-gradient-to-r ${getRankColor(rank)} text-white font-bold text-sm uppercase tracking-wide shadow-lg`}>
          {rank}
        </div>
      </div>

      <div className="relative">
        <div className={`rounded-2xl p-8 bg-gradient-to-br ${getRankColor(rank)} text-white`}>
          <div className="text-center">
            <div className="text-6xl font-black mb-2">{score}</div>
            <div className="text-white/80 text-lg font-medium">out of 100</div>
            <div className="mt-4 flex items-center justify-center gap-2">
              <div className="h-2 bg-white/20 rounded-full w-48">
                <div
                  className="h-2 bg-white rounded-full transition-all duration-500"
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
            <div className="mt-3 text-white/90 text-sm">
              Confidence: {Math.round(confidence * 100)}%
            </div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          Score Breakdown
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="text-xs text-slate-600 mb-1">Intent Signals</div>
            <div className="text-2xl font-bold text-slate-900">{breakdown.intentSignals}</div>
            <div className="text-xs text-slate-500 mt-1">/ 30 pts</div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4">
            <div className="text-xs text-slate-600 mb-1">Pain Points</div>
            <div className="text-2xl font-bold text-slate-900">{breakdown.painPoints}</div>
            <div className="text-xs text-slate-500 mt-1">/ 20 pts</div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4">
            <div className="text-xs text-slate-600 mb-1">Life Events</div>
            <div className="text-2xl font-bold text-slate-900">{breakdown.lifeEvents}</div>
            <div className="text-xs text-slate-500 mt-1">/ 15 pts</div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4">
            <div className="text-xs text-slate-600 mb-1">Authority</div>
            <div className="text-2xl font-bold text-slate-900">{breakdown.authorityInfluence}</div>
            <div className="text-xs text-slate-500 mt-1">/ 15 pts</div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4">
            <div className="text-xs text-slate-600 mb-1">Relationship</div>
            <div className="text-2xl font-bold text-slate-900">{breakdown.relationshipStrength}</div>
            <div className="text-xs text-slate-500 mt-1">/ 10 pts</div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4">
            <div className="text-xs text-slate-600 mb-1">Profile</div>
            <div className="text-2xl font-bold text-slate-900">{breakdown.profileCompleteness}</div>
            <div className="text-xs text-slate-500 mt-1">/ 10 pts</div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-lg font-bold text-slate-900 mb-4">Why This Prospect is {rank.toUpperCase()}</h4>
        <div className="space-y-2">
          {contributingFactors.map((factor, idx) => {
            const IconComponent = categoryIcons[factor.category] || CheckCircle2;
            return (
              <div
                key={idx}
                className={`${getRankBg(rank)} border rounded-xl p-4 flex items-start gap-3`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <IconComponent className="w-5 h-5 text-slate-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-slate-900">{factor.signal}</div>
                    <div className="flex-shrink-0 px-2 py-1 bg-white rounded-lg text-xs font-bold text-slate-700">
                      +{factor.points}
                    </div>
                  </div>
                  <div className="text-xs text-slate-600 mt-1">{factor.category}</div>
                </div>
              </div>
            );
          })}
        </div>

        {contributingFactors.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            No specific signals detected. Score based on baseline criteria.
          </div>
        )}
      </div>
    </div>
  );
}
