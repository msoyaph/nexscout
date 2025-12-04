import { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, MessageSquare, Calendar, Award, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getCompanyPerformanceSummary, generateLearningSignals } from '../../services/intelligence/companyLearningEngine';
import type { CompanyPerformanceSummary } from '../../services/intelligence/companyLearningEngine';

interface CompanyPerformancePageProps {
  onBack?: () => void;
}

export default function CompanyPerformancePage({ onBack }: CompanyPerformancePageProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<CompanyPerformanceSummary | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadPerformance();
  }, [user]);

  async function loadPerformance() {
    if (!user) return;

    try {
      const data = await getCompanyPerformanceSummary(user.id);
      setSummary(data);
    } catch (error) {
      console.error('Load performance error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateSignals() {
    if (!user) return;

    setGenerating(true);
    try {
      await generateLearningSignals(user.id);
      await loadPerformance();
      alert('Learning signals generated successfully!');
    } catch (error) {
      console.error('Generate signals error:', error);
      alert('Failed to generate learning signals');
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onBack?.()}
              className="flex items-center justify-center size-10 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="size-5 text-slate-700" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-slate-900">Company Performance Insights</h1>
              <p className="text-sm text-slate-600">AI learning from real-world results</p>
            </div>
            <TrendingUp className="size-6 text-blue-600" />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <MessageSquare className="size-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-600">Total Sent</p>
                <p className="text-2xl font-bold text-slate-900">{summary?.totalSent || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <MessageSquare className="size-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-600">Replies</p>
                <p className="text-2xl font-bold text-slate-900">{summary?.totalReplies || 0}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500">{summary?.overallReplyRate || 0}% reply rate</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Calendar className="size-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-600">Meetings</p>
                <p className="text-2xl font-bold text-slate-900">{summary?.totalMeetings || 0}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500">{summary?.overallMeetingRate || 0}% booking rate</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <Award className="size-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-600">Deals Closed</p>
                <p className="text-2xl font-bold text-slate-900">{summary?.totalDeals || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingUp className="size-5 text-green-600" />
              Top Performing Patterns
            </h2>
            {summary?.topPerformingPatterns && summary.topPerformingPatterns.length > 0 ? (
              <div className="space-y-3">
                {summary.topPerformingPatterns.map((pattern, i) => (
                  <div key={i} className="p-4 bg-green-50 rounded-xl border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-slate-900">{pattern.pattern}</p>
                      <span className="px-2 py-1 bg-green-600 text-white text-xs font-semibold rounded-lg">
                        {Math.round(pattern.score * 100)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <span>{pattern.metrics.replyRate}% replies</span>
                      <span>{pattern.metrics.meetingRate}% meetings</span>
                      <span className="text-xs">({pattern.sampleCount} sent)</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">Not enough data yet. Keep sending!</p>
            )}
          </section>

          <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <AlertCircle className="size-5 text-red-600" />
              Underperforming Patterns
            </h2>
            {summary?.underperformingPatterns && summary.underperformingPatterns.length > 0 ? (
              <div className="space-y-3">
                {summary.underperformingPatterns.map((pattern, i) => (
                  <div key={i} className="p-4 bg-red-50 rounded-xl border border-red-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-slate-900">{pattern.pattern}</p>
                      <span className="px-2 py-1 bg-red-600 text-white text-xs font-semibold rounded-lg">
                        {Math.round(pattern.score * 100)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <span>{pattern.metrics.replyRate}% replies</span>
                      <span>{pattern.metrics.meetingRate}% meetings</span>
                      <span className="text-xs">({pattern.sampleCount} sent)</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">No underperforming patterns detected yet.</p>
            )}
          </section>
        </div>

        <section className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">AI Recommendations</h2>
          {summary?.recommendations && summary.recommendations.length > 0 ? (
            <ul className="space-y-2">
              {summary.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-slate-700 flex-1">{rec}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-600">No recommendations yet. AI is still learning your patterns.</p>
          )}
        </section>

        <div className="flex justify-center">
          <button
            onClick={handleGenerateSignals}
            disabled={generating}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2" />
                Analyzing...
              </>
            ) : (
              'Update Learning Signals'
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
