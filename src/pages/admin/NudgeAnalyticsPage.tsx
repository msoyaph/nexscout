import React, { useEffect, useState } from 'react';
import { ArrowLeft, TrendingUp, Target, Zap, Users, DollarSign, BarChart3 } from 'lucide-react';
import {
  getNudgePerformance,
  getEmotionalConversionAnalytics,
  getConversionFunnel,
  getTopPerformingNudges,
  type NudgePerformance,
} from '../../services/nudgeAnalytics';

interface NudgeAnalyticsPageProps {
  onBack?: () => void;
}

export default function NudgeAnalyticsPage({ onBack }: NudgeAnalyticsPageProps) {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30);

  const [funnel, setFunnel] = useState<any>(null);
  const [performance, setPerformance] = useState<NudgePerformance[]>([]);
  const [emotionalData, setEmotionalData] = useState<any[]>([]);
  const [topNudges, setTopNudges] = useState<NudgePerformance[]>([]);

  useEffect(() => {
    loadData();
  }, [timeRange]);

  async function loadData() {
    setLoading(true);

    try {
      const [funnelData, perfData, emotionData, topData] = await Promise.all([
        getConversionFunnel(timeRange),
        getNudgePerformance(undefined, timeRange),
        getEmotionalConversionAnalytics(timeRange),
        getTopPerformingNudges(5, timeRange),
      ]);

      setFunnel(funnelData);
      setPerformance(perfData);
      setEmotionalData(emotionData);
      setTopNudges(topData);
    } catch (error) {
      console.error('Error loading nudge analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5] pb-24">
      {/* Header */}
      <div className="bg-white border-b shadow-sm p-4">
        {onBack && (
          <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2">
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
        )}
        <h1 className="text-xl font-semibold">Nudge & Conversion Analytics</h1>
        <p className="text-gray-500 text-sm">Track nudge performance and A/B test results</p>

        {/* Time Range Selector */}
        <div className="flex gap-2 mt-3">
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              onClick={() => setTimeRange(days)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                timeRange === days
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {days} days
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Conversion Funnel */}
        {funnel && (
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold">Conversion Funnel</h2>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{funnel.shown.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Nudges Shown</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{funnel.clicked.toLocaleString()}</div>
                <div className="text-sm text-gray-600">
                  Clicked ({funnel.click_rate.toFixed(1)}%)
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{funnel.upgraded.toLocaleString()}</div>
                <div className="text-sm text-gray-600">
                  Upgraded ({funnel.conversion_rate.toFixed(1)}%)
                </div>
              </div>
            </div>

            {/* Visual Funnel */}
            <div className="mt-6 space-y-2">
              <div className="bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all"
                  style={{ width: '100%' }}
                ></div>
              </div>
              <div className="bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-500 h-3 rounded-full transition-all"
                  style={{ width: `${funnel.click_rate}%` }}
                ></div>
              </div>
              <div className="bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-600 h-3 rounded-full transition-all"
                  style={{ width: `${funnel.conversion_rate}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Top Performing Nudges */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold">Top Performing Nudges</h2>
          </div>

          <div className="space-y-3">
            {topNudges.map((nudge, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{nudge.trigger_type}</div>
                  <div className="text-sm text-gray-600">Variant: {nudge.variant}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">
                    {nudge.conversion_rate.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500">
                    {nudge.upgraded_count}/{nudge.shown_count} converted
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Emotional Conversion Analytics */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-semibold">Emotional Conversion Analysis</h2>
          </div>

          <div className="space-y-2">
            {emotionalData
              .sort((a, b) => b.conversion_rate - a.conversion_rate)
              .map((emotion, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-32 text-sm font-medium text-gray-700 capitalize">
                    {emotion.emotional_state}
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-200 rounded-full h-6 relative overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-orange-400 to-orange-600 h-6 rounded-full flex items-center justify-end px-2 transition-all"
                        style={{ width: `${Math.min(emotion.conversion_rate, 100)}%` }}
                      >
                        <span className="text-xs text-white font-semibold">
                          {emotion.conversion_rate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 w-20 text-right">
                    {emotion.total_converted}/{emotion.total_shown}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* All Nudge Performance */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">All Nudge Performance</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Trigger</th>
                  <th className="text-left py-2">Variant</th>
                  <th className="text-right py-2">Shown</th>
                  <th className="text-right py-2">Clicked</th>
                  <th className="text-right py-2">CTR</th>
                  <th className="text-right py-2">Converted</th>
                  <th className="text-right py-2">Conv Rate</th>
                  <th className="text-right py-2">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {performance.map((perf, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-2 font-medium">{perf.trigger_type}</td>
                    <td className="py-2 text-gray-600">{perf.variant}</td>
                    <td className="py-2 text-right">{perf.shown_count}</td>
                    <td className="py-2 text-right">{perf.clicked_count}</td>
                    <td className="py-2 text-right">
                      <span className={perf.ctr >= 10 ? 'text-green-600 font-semibold' : ''}>
                        {perf.ctr.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2 text-right">{perf.upgraded_count}</td>
                    <td className="py-2 text-right">
                      <span className={perf.conversion_rate >= 5 ? 'text-green-600 font-semibold' : ''}>
                        {perf.conversion_rate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2 text-right font-medium">
                      ₱{perf.revenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
