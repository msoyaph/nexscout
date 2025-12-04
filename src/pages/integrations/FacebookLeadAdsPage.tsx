/**
 * Facebook Lead Ads Integration Page
 *
 * Auto-capture leads from FB Lead Forms → Create prospects → Deep Scan → Pipeline
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users,
  DollarSign,
  Settings,
  Trash2,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface LeadSource {
  id: string;
  formId: string;
  formName: string;
  autoCaptureEnabled: boolean;
  autoDeepScanEnabled: boolean;
  autoFollowupEnabled: boolean;
  totalLeadsCaptured: number;
  lastLeadCapturedAt: string | null;
  isActive: boolean;
}

interface LeadStats {
  totalLeads: number;
  prospectsCreated: number;
  meetingsBooked: number;
  dealsClosed: number;
  conversionRate: number;
}

export default function FacebookLeadAdsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [leadSources, setLeadSources] = useState<LeadSource[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadLeadSources();
      loadStats();
    }
  }, [user]);

  const loadLeadSources = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('lead_sources')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'facebook')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (data) {
      setLeadSources(
        data.map((s: any) => ({
          id: s.id,
          formId: s.form_id,
          formName: s.form_name,
          autoCaptureEnabled: s.auto_capture_enabled,
          autoDeepScanEnabled: s.auto_deep_scan_enabled,
          autoFollowupEnabled: s.auto_followup_enabled,
          totalLeadsCaptured: s.total_leads_captured,
          lastLeadCapturedAt: s.last_lead_captured_at,
          isActive: s.is_active,
        }))
      );
    }

    setLoading(false);
  };

  const loadStats = async () => {
    if (!user) return;

    // Get all lead sources
    const { data: sources } = await supabase
      .from('lead_sources')
      .select('id')
      .eq('user_id', user.id)
      .eq('provider', 'facebook');

    if (!sources || sources.length === 0) {
      setStats({
        totalLeads: 0,
        prospectsCreated: 0,
        meetingsBooked: 0,
        dealsClosed: 0,
        conversionRate: 0,
      });
      return;
    }

    const sourceIds = sources.map(s => s.id);

    // Get raw leads count
    const { data: rawLeads } = await supabase
      .from('fb_leads_raw')
      .select('id')
      .in('lead_source_id', sourceIds);

    const totalLeads = rawLeads?.length || 0;

    // Get prospects created from leads
    const { data: links } = await supabase
      .from('lead_prospect_links')
      .select('prospect_id, converted_to_meeting, converted_to_deal')
      .eq('source_channel', 'facebook_lead_ad');

    const prospectsCreated = links?.length || 0;
    const meetingsBooked = links?.filter(l => l.converted_to_meeting).length || 0;
    const dealsClosed = links?.filter(l => l.converted_to_deal).length || 0;

    const conversionRate = prospectsCreated > 0 ? (dealsClosed / prospectsCreated) * 100 : 0;

    setStats({
      totalLeads,
      prospectsCreated,
      meetingsBooked,
      dealsClosed,
      conversionRate,
    });
  };

  const toggleAutoCapture = async (sourceId: string, currentState: boolean) => {
    const { error } = await supabase
      .from('lead_sources')
      .update({ auto_capture_enabled: !currentState })
      .eq('id', sourceId);

    if (!error) {
      loadLeadSources();
    }
  };

  const deleteSource = async (sourceId: string) => {
    if (!confirm('Are you sure you want to disconnect this lead form?')) {
      return;
    }

    const { error } = await supabase
      .from('lead_sources')
      .update({ is_active: false })
      .eq('id', sourceId);

    if (!error) {
      loadLeadSources();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading FB Lead Ads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/integrations/facebook')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Facebook Lead Ads Auto-Capture</h1>
          <p className="text-gray-600">
            Automatically capture leads from Facebook Lead Forms and add them to your pipeline.
          </p>
        </div>

        {/* Stats Cards */}
        {stats && leadSources.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-600">Total Leads</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.totalLeads}</p>
              <p className="text-xs text-gray-500 mt-1">Auto-captured</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-600">Prospects Created</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.prospectsCreated}</p>
              <p className="text-xs text-gray-500 mt-1">In pipeline</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-600">Meetings Booked</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.meetingsBooked}</p>
              <p className="text-xs text-gray-500 mt-1">By AI</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-medium text-gray-600">Deals Closed</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.dealsClosed}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.conversionRate.toFixed(1)}% conversion</p>
            </div>
          </div>
        )}

        {/* Connected Forms */}
        {leadSources.length > 0 ? (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Connected Lead Forms</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {leadSources.map((source) => (
                <div key={source.id} className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{source.formName}</h3>
                      <p className="text-sm text-gray-600">Form ID: {source.formId}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-gray-500">
                          {source.totalLeadsCaptured} leads captured
                        </span>
                        {source.lastLeadCapturedAt && (
                          <span className="text-xs text-gray-500">
                            Last: {new Date(source.lastLeadCapturedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right mr-4">
                      {source.autoCaptureEnabled ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-600">Auto-Capture ON</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">Auto-Capture OFF</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">
                          Deep Scan: {source.autoDeepScanEnabled ? 'ON' : 'OFF'}
                        </span>
                        <span className="text-xs text-gray-500">
                          Follow-up: {source.autoFollowupEnabled ? 'ON' : 'OFF'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate(`/integrations/facebook/leads/mapping/${source.id}`)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4" />
                      Configure
                    </button>

                    <button
                      onClick={() => toggleAutoCapture(source.id, source.autoCaptureEnabled)}
                      className={`px-4 py-2 rounded-lg font-medium text-sm ${
                        source.autoCaptureEnabled
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {source.autoCaptureEnabled ? 'Disable' : 'Enable'}
                    </button>

                    <button
                      onClick={() => deleteSource(source.id)}
                      className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center mb-8">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Lead Forms Connected</h3>
            <p className="text-gray-600 mb-6">
              Connect your Facebook Lead Form to start auto-capturing leads.
            </p>
          </div>
        )}

        {/* Connect Button */}
        <button
          onClick={() => alert('Facebook OAuth flow coming soon!')}
          className="w-full bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 font-semibold text-lg flex items-center justify-center gap-3"
        >
          <Plus className="w-6 h-6" />
          Connect FB Lead Form
        </button>

        {/* How It Works */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-4">🚀 How Auto-Capture Works:</h3>
          <ol className="space-y-2 text-sm text-blue-800">
            <li>1. User fills out your Facebook Lead Form</li>
            <li>2. Webhook instantly sends data to NexScout</li>
            <li>3. Prospect automatically created in your pipeline</li>
            <li>4. Deep Scan Lite analyzes the lead</li>
            <li>5. AI starts follow-up sequence</li>
            <li>6. Lead moves through pipeline automatically</li>
            <li>7. Meetings booked, deals closed, revenue tracked</li>
          </ol>
          <p className="text-xs text-blue-700 mt-4">
            ✨ Zero manual work - 100% automation!
          </p>
        </div>
      </div>
    </div>
  );
}
