import { ArrowLeft, Brain, Target, TrendingUp, Users, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { ProspectWithScore } from '../lib/types/scanning';

interface DeepScanPageProps {
  onBack: () => void;
  onNavigate: (page: string) => void;
  prospect: ProspectWithScore;
}

export default function DeepScanPage({ onBack, onNavigate, prospect }: DeepScanPageProps) {
  const { profile } = useAuth();
  const isPro = profile?.subscription_tier === 'pro';

  // Handle missing prospect
  if (!prospect) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Prospect data not available</p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const deepScanData = {
    personality: {
      extrovert: 75,
      optimism: 82,
      leadership: 68,
      risk_tolerance: 71,
    },
    buying_likelihood: 84,
    responsiveness: 78,
    affordability: 'Medium-High',
    leadership_potential: 72,
    selling_angle: 'Financial Freedom & Passive Income',
    closing_technique: 'Consultative approach with emphasis on long-term wealth building',
  };

  if (!isPro) {
    return (
      <div className="min-h-screen bg-white">
        <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-6 py-4">
            <button
              onClick={onBack}
              className="flex items-center justify-center size-10 hover:bg-gray-50 rounded-xl transition-colors"
            >
              <ArrowLeft className="size-5 text-gray-700" />
            </button>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-6 py-16">
          <div className="relative">
            <div className="absolute inset-0 backdrop-blur-lg bg-white/60 z-10 rounded-3xl" />
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-3xl p-12 border-2 border-amber-300 relative">
              <div className="space-y-6 blur-sm">
                <div className="space-y-3">
                  <div className="h-6 bg-gray-300 rounded w-48" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-24 bg-white rounded-2xl" />
                  ))}
                </div>
              </div>
            </div>

            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="text-center space-y-6 max-w-md">
                <div className="size-24 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto shadow-2xl">
                  <Lock className="size-12 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-3">Pro Feature</h2>
                  <p className="text-gray-700 mb-6">
                    DeepScan provides comprehensive AI personality profiling, buying behavior analysis, and advanced closing strategies.
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('pricing')}
                  className="px-8 py-4 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all"
                >
                  Upgrade to Pro
                </button>
                <p className="text-sm text-gray-600">
                  Join Pro to unlock full DeepScan insights for all prospects
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-50">
      <header className="bg-gradient-to-r from-amber-400 to-amber-600 text-white sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-6">
          <button
            onClick={onBack}
            className="flex items-center justify-center size-10 hover:bg-white/20 rounded-xl transition-colors mb-4"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Brain className="size-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AI DeepScan</h1>
              <p className="text-white/90 text-sm">{prospect.full_name}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        <section className="bg-white rounded-3xl p-6 border border-gray-200">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Brain className="size-5 text-amber-600" />
            Personality Profile
          </h3>
          <div className="space-y-4">
            {Object.entries(deepScanData.personality).map(([trait, value]) => (
              <div key={trait}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 capitalize">{trait.replace('_', ' ')}</span>
                  <span className="text-sm font-bold text-amber-600">{value}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all"
                    style={{ width: `${value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <div className="size-12 rounded-xl bg-green-100 flex items-center justify-center mb-3">
              <Target className="size-6 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{deepScanData.buying_likelihood}%</div>
            <div className="text-sm text-gray-600">Buying Likelihood</div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <div className="size-12 rounded-xl bg-blue-100 flex items-center justify-center mb-3">
              <TrendingUp className="size-6 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{deepScanData.responsiveness}%</div>
            <div className="text-sm text-gray-600">Responsiveness</div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <div className="size-12 rounded-xl bg-purple-100 flex items-center justify-center mb-3">
              <Users className="size-6 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{deepScanData.leadership_potential}%</div>
            <div className="text-sm text-gray-600">Leadership</div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <div className="size-12 rounded-xl bg-amber-100 flex items-center justify-center mb-3">
              <svg className="size-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-lg font-bold text-gray-900 mb-1">{deepScanData.affordability}</div>
            <div className="text-sm text-gray-600">Affordability</div>
          </div>
        </div>

        <section className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-3xl p-6 border border-green-200">
          <h3 className="font-bold text-gray-900 mb-3">🎯 Strongest Selling Angle</h3>
          <p className="text-gray-700 text-lg font-medium">{deepScanData.selling_angle}</p>
        </section>

        <section className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-3xl p-6 border border-blue-200">
          <h3 className="font-bold text-gray-900 mb-3">💡 Recommended Closing Technique</h3>
          <p className="text-gray-700">{deepScanData.closing_technique}</p>
        </section>

        <section className="bg-white rounded-3xl p-6 border border-gray-200">
          <h3 className="font-bold text-gray-900 mb-4">Key Insights</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="size-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="size-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-sm text-gray-700">High optimism score indicates receptiveness to opportunity-based messaging</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="size-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="size-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-sm text-gray-700">Extroverted personality suggests they value social proof and team success stories</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="size-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="size-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-sm text-gray-700">Leadership potential makes them ideal for recruitment vs direct sales</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
