/**
 * Facebook Messenger Integration Page
 *
 * Connect Facebook Pages, enable auto-reply, view analytics.
 * Full automation: Message → AI → Prospect → Pipeline → Close
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users,
  MessageCircle,
  Zap,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface FacebookPage {
  id: string;
  pageId: string;
  pageName: string;
  pageUsername: string;
  autoReplyEnabled: boolean;
  isActive: boolean;
  connectedAt: string;
}

interface FacebookStats {
  totalMessages: number;
  newLeads: number;
  meetingsBooked: number;
  responseRate: number;
}

export default function FacebookIntegrationPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [connectedPages, setConnectedPages] = useState<FacebookPage[]>([]);
  const [stats, setStats] = useState<FacebookStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadConnectedPages();
      loadStats();
    }
  }, [user]);

  const loadConnectedPages = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('facebook_page_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('connected_at', { ascending: false });

    if (data) {
      setConnectedPages(
        data.map((p: any) => ({
          id: p.id,
          pageId: p.page_id,
          pageName: p.page_name,
          pageUsername: p.page_username,
          autoReplyEnabled: p.auto_reply_enabled,
          isActive: p.is_active,
          connectedAt: p.connected_at,
        }))
      );
    }

    setLoading(false);
  };

  const loadStats = async () => {
    if (!user) return;

    // Get stats from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: sessions } = await supabase
      .from('facebook_chat_sessions')
      .select('id, message_count')
      .eq('user_id', user.id)
      .gte('created_at', thirtyDaysAgo.toISOString());

    const { data: messages } = await supabase
      .from('facebook_message_logs')
      .select('direction')
      .in('session_id', (sessions || []).map((s: any) => s.id));

    const totalMessages = messages?.length || 0;
    const outboundMessages = messages?.filter((m: any) => m.direction === 'outbound').length || 0;
    const inboundMessages = messages?.filter((m: any) => m.direction === 'inbound').length || 0;

    // Get prospects created from Facebook
    const { data: prospects } = await supabase
      .from('prospects')
      .select('id, pipeline_stage')
      .eq('user_id', user.id)
      .eq('source', 'facebook')
      .gte('created_at', thirtyDaysAgo.toISOString());

    const newLeads = prospects?.length || 0;
    const meetingsBooked = prospects?.filter((p: any) => p.pipeline_stage === 'appointment' || p.pipeline_stage === 'closing').length || 0;

    const responseRate = inboundMessages > 0 ? (outboundMessages / inboundMessages) * 100 : 0;

    setStats({
      totalMessages,
      newLeads,
      meetingsBooked,
      responseRate,
    });
  };

  const toggleAutoReply = async (pageId: string, currentState: boolean) => {
    const { error } = await supabase
      .from('facebook_page_connections')
      .update({ auto_reply_enabled: !currentState })
      .eq('id', pageId);

    if (!error) {
      loadConnectedPages();
    }
  };

  const disconnectPage = async (pageId: string) => {
    if (!confirm('Are you sure you want to disconnect this Facebook page?')) {
      return;
    }

    const { error } = await supabase
      .from('facebook_page_connections')
      .update({ is_active: false })
      .eq('id', pageId);

    if (!error) {
      loadConnectedPages();
    }
  };

  const startFacebookOAuth = () => {
    const appId = import.meta.env.VITE_FACEBOOK_APP_ID;
    if (!appId) {
      alert('Facebook App ID is not configured. Please contact support.');
      return;
    }

    // Use Edge Function URL as redirect URI (not frontend route)
    // Normalize URL to ensure HTTPS and no double slashes
    let supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    // Ensure HTTPS
    if (supabaseUrl.startsWith('http://')) {
      supabaseUrl = supabaseUrl.replace('http://', 'https://');
    } else if (!supabaseUrl.startsWith('https://')) {
      supabaseUrl = `https://${supabaseUrl}`;
    }
    // Remove trailing slash to prevent double slashes
    supabaseUrl = supabaseUrl.replace(/\/+$/, '');
    const redirectUri = `${supabaseUrl}/functions/v1/facebook-oauth-callback`;

    // Include user_id in state parameter for the callback
    const userId = user?.id || '';
    const scope = 'pages_show_list,pages_messaging,pages_manage_metadata,pages_read_engagement';
    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${userId}`;

    console.log('[Facebook OAuth] Starting OAuth flow:', {
      appId,
      redirectUri,
      userId
    });

    window.location.href = authUrl;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Facebook integration...</p>
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
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Settings
          </button>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold">Facebook Messenger Integration</h1>
          </div>
          <p className="text-gray-600">
            Connect your Facebook Page and let NexScout AI handle customer conversations automatically.
          </p>
        </div>

        {/* Stats Cards */}
        {stats && connectedPages.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-2">
                <MessageCircle className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-600">Total Messages</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.totalMessages}</p>
              <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-600">New Leads</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.newLeads}</p>
              <p className="text-xs text-gray-500 mt-1">From Messenger</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-600">Meetings Booked</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.meetingsBooked}</p>
              <p className="text-xs text-gray-500 mt-1">By AI Chatbot</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-medium text-gray-600">Response Rate</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.responseRate.toFixed(0)}%</p>
              <p className="text-xs text-gray-500 mt-1">AI replies instantly</p>
            </div>
          </div>
        )}

        {/* Connected Pages */}
        {connectedPages.length > 0 ? (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Connected Pages</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {connectedPages.map((page) => (
                <div key={page.id} className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{page.pageName}</h3>
                      <p className="text-sm text-gray-600">@{page.pageUsername}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Connected {new Date(page.connectedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right mr-4">
                      <div className="flex items-center gap-2">
                        {page.autoReplyEnabled ? (
                          <>
                            <Zap className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-600">Auto-Reply ON</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">Auto-Reply OFF</span>
                          </>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => toggleAutoReply(page.id, page.autoReplyEnabled)}
                      className={`px-4 py-2 rounded-lg font-medium text-sm ${
                        page.autoReplyEnabled
                          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {page.autoReplyEnabled ? 'Disable' : 'Enable'}
                    </button>

                    <button
                      onClick={() => disconnectPage(page.id)}
                      className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium text-sm"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center mb-8">
            <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Facebook Pages Connected</h3>
            <p className="text-gray-600 mb-6">
              Connect your Facebook Page to start automating customer conversations with AI.
            </p>
          </div>
        )}

        {/* Connect New Page Button */}
        <button
          onClick={startFacebookOAuth}
          className="w-full bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 font-semibold text-lg flex items-center justify-center gap-3"
        >
          <MessageSquare className="w-6 h-6" />
          Connect Facebook Page
        </button>

        {/* How It Works */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-4">🚀 How Auto-Reply Works:</h3>
          <ol className="space-y-2 text-sm text-blue-800">
            <li>1. Customer messages your Facebook Page</li>
            <li>2. NexScout AI instantly replies using your company & product intelligence</li>
            <li>3. AI captures lead data and creates a prospect automatically</li>
            <li>4. AI qualifies, nurtures, and moves them through your pipeline</li>
            <li>5. When ready, AI books appointments and closes sales</li>
            <li>6. System learns and improves with every conversation</li>
          </ol>
          <p className="text-xs text-blue-700 mt-4">
            ✨ It's like having a 24/7 sales team that never sleeps!
          </p>
        </div>
      </div>
    </div>
  );
}
