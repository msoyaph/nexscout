/**
 * FB Lead Ads Performance Dashboard
 *
 * Complete ROI tracking: Lead → Meeting → Sale → Revenue
 * Per-form, per-campaign analytics with AI insights
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  Target,
  Zap,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface FormMetrics {
  leadSourceId: string;
  formName: string;
  pageId: string;
  totalLeads: number;
  totalProspects: number;
  totalMeetings: number;
  totalSales: number;
  totalRevenue: number;
  costPerLead: number;
  costPerMeeting: number;
  costPerSale: number;
  meetingRate: number;
  closeRate: number;
  roi: number;
}

interface OverallStats {
  totalLeads: number;
  totalMeetings: number;
  totalSales: number;
  totalRevenue: number;
  avgMeetingRate: number;
  avgCloseRate: number;
}

export default function FBLeadAdsAnalyticsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formMetrics, setFormMetrics] = useState<FormMetrics[]>([]);
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ from: '2024-01-01', to: new Date().toISOString() });

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user, dateRange]);

  const loadAnalytics = async () => {
    if (!user) return;

    setLoading(true);

    try {
      // Get all lead sources for user
      const { data: sources } = await supabase
        .from('lead_sources')
        .select('id, form_name, page_id')
        .eq('user_id', user.id)
        .eq('provider', 'facebook');

      if (!sources || sources.length === 0) {
        setOverallStats({
          totalLeads: 0,
          totalMeetings: 0,
          totalSales: 0,
          totalRevenue: 0,
          avgMeetingRate: 0,
          avgCloseRate: 0,
        });
        setLoading(false);
        return;
      }

      const metrics: FormMetrics[] = [];
      let totalLeads = 0;
      let totalMeetings = 0;
      let totalSales = 0;
      let totalRevenue = 0;

      for (const source of sources) {
        // Get raw leads
        const { data: rawLeads } = await supabase
          .from('fb_leads_raw')
          .select('fb_lead_id')
          .eq('lead_source_id', source.id)
          .gte('created_at', dateRange.from)
          .lte('created_at', dateRange.to);

        const leadsCount = rawLeads?.length || 0;

        // Get prospect links
        const { data: links } = await supabase
          .from('lead_prospect_links')
          .select('prospect_id, converted_to_meeting, converted_to_deal, conversion_value')
          .in('fb_lead_id', (rawLeads || []).map(l => l.fb_lead_id));

        const prospectsCount = links?.length || 0;
        const meetingsCount = links?.filter(l => l.converted_to_meeting).length || 0;
        const salesCount = links?.filter(l => l.converted_to_deal).length || 0;
        const revenue = links?.reduce((sum, l) => sum + (Number(l.conversion_value) || 0), 0) || 0;

        const meetingRate = leadsCount > 0 ? meetingsCount / leadsCount : 0;
        const closeRate = meetingsCount > 0 ? salesCount / meetingsCount : 0;

        metrics.push({
          leadSourceId: source.id,
          formName: source.form_name || 'Untitled Form',
          pageId: source.page_id || '',
          totalLeads: leadsCount,
          totalProspects: prospectsCount,
          totalMeetings: meetingsCount,
          totalSales: salesCount,
          totalRevenue: revenue,
          costPerLead: 0, // TODO: If ad spend data available
          costPerMeeting: 0,
          costPerSale: 0,
          meetingRate,
          closeRate,
          roi: 0,
        });

        totalLeads += leadsCount;
        totalMeetings += meetingsCount;
        totalSales += salesCount;
        totalRevenue += revenue;
      }

      setFormMetrics(metrics.sort((a, b) => b.totalLeads - a.totalLeads));

      setOverallStats({
        totalLeads,
        totalMeetings,
        totalSales,
        totalRevenue,
        avgMeetingRate: totalLeads > 0 ? totalMeetings / totalLeads : 0,
        avgCloseRate: totalMeetings > 0 ? totalSales / totalMeetings : 0,
      });
    } catch (error) {
      console.error('[Analytics] Error loading:', error);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Admin
          </button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">FB Lead Ads Performance</h1>
          <p className="text-gray-600">Complete funnel analytics: Lead → Meeting → Sale → ROI</p>
        </div>

        {/* Overall Stats */}
        {overallStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-600">Total Leads</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{overallStats.totalLeads}</p>
              <p className="text-xs text-gray-500 mt-1">All forms</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-600">Meetings Booked</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{overallStats.totalMeetings}</p>
              <p className="text-xs text-gray-500 mt-1">
                {(overallStats.avgMeetingRate * 100).toFixed(1)}% conversion
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-600">Deals Closed</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{overallStats.totalSales}</p>
              <p className="text-xs text-gray-500 mt-1">
                {(overallStats.avgCloseRate * 100).toFixed(1)}% close rate
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-medium text-gray-600">Total Revenue</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                ₱{overallStats.totalRevenue.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">From FB leads</p>
            </div>
          </div>
        )}

        {/* Per-Form Breakdown */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Performance by Form</h2>
          </div>

          {formMetrics.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Form Name
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Leads
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Meetings
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Sales
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Meeting Rate
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Close Rate
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {formMetrics.map((metric) => (
                    <tr key={metric.leadSourceId} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{metric.formName}</div>
                        <div className="text-xs text-gray-500">{metric.pageId}</div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium">{metric.totalLeads}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-medium">{metric.totalMeetings}</div>
                        <div className="flex items-center justify-end gap-1 text-xs text-green-600">
                          {metric.totalMeetings > metric.totalLeads * 0.15 && (
                            <TrendingUp className="w-3 h-3" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-medium">{metric.totalSales}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-medium">{(metric.meetingRate * 100).toFixed(1)}%</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-medium">{(metric.closeRate * 100).toFixed(1)}%</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-medium">₱{metric.totalRevenue.toLocaleString()}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No data available yet. Connect your FB Lead Forms to start tracking.</p>
            </div>
          )}
        </div>

        {/* AI Insights */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <Zap className="w-6 h-6 text-blue-600 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-3">🤖 AI Insights & Recommendations</h3>
              <div className="space-y-2 text-sm text-blue-800">
                {formMetrics.length > 0 && (
                  <>
                    <p>
                      • <strong>Top Performer:</strong> "{formMetrics[0]?.formName}" has the most leads
                      ({formMetrics[0]?.totalLeads}). Close rate: {(formMetrics[0]?.closeRate * 100).toFixed(1)}%.
                    </p>
                    {overallStats && overallStats.avgMeetingRate < 0.15 && (
                      <p>
                        • <strong>Opportunity:</strong> Meeting rate is {(overallStats.avgMeetingRate * 100).toFixed(1)}%.
                        Consider improving Day 3 follow-up message to boost bookings.
                      </p>
                    )}
                    {overallStats && overallStats.avgCloseRate > 0.25 && (
                      <p>
                        • <strong>Great Job!</strong> Your {(overallStats.avgCloseRate * 100).toFixed(1)}% close rate is excellent.
                        Scale up ad spend to maximize revenue.
                      </p>
                    )}
                  </>
                )}
                {formMetrics.length === 0 && (
                  <p>Connect your FB Lead Forms to get AI-powered insights on performance optimization.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
