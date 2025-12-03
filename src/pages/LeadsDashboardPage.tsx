import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LeadDashboardCard } from '../components/dashboard/LeadDashboardCard';
import type { LeadDashboardData, LeadDashboardStats } from '../types/LeadDashboard';
import { temperatureIcon } from '../utils/leadDashboardHelpers';

export default function LeadsDashboardPage() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<LeadDashboardData[]>([]);
  const [stats, setStats] = useState<LeadDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterTemp, setFilterTemp] = useState<string>('all');
  const [filterStage, setFilterStage] = useState<string>('all');
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    loadUserAndData();
  }, []);

  async function loadUserAndData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      setUserId(user.id);
      await loadLeadsData(user.id);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setIsLoading(false);
    }
  }

  async function loadLeadsData(userId: string) {
    try {
      setIsLoading(true);

      // Fetch chat sessions with lead intelligence
      const { data: sessions, error } = await supabase
        .from('public_chat_sessions')
        .select(`
          id,
          visitor_session_id,
          lead_temperature,
          lead_score,
          current_funnel_stage,
          current_intent,
          offer_type,
          suggested_product_id,
          current_product_id,
          buying_signals_history,
          intents_history,
          message_count,
          updated_at,
          channel,
          conversation_state
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Transform to dashboard data
      const leadsData: LeadDashboardData[] = await Promise.all(
        (sessions || []).map(async (session: any) => {
          // Get latest message for preview
          const { data: messages } = await supabase
            .from('public_chat_messages')
            .select('message, sender')
            .eq('session_id', session.id)
            .order('created_at', { ascending: false })
            .limit(1);

          const lastMessage = messages?.[0];

          // Get product names if available
          let fromProduct = undefined;
          let toProduct = undefined;

          if (session.current_product_id) {
            const { data: currProd } = await supabase
              .from('products')
              .select('name, price')
              .eq('id', session.current_product_id)
              .maybeSingle();
            if (currProd) fromProduct = currProd.name;
          }

          if (session.suggested_product_id) {
            const { data: suggProd } = await supabase
              .from('products')
              .select('name, price')
              .eq('id', session.suggested_product_id)
              .maybeSingle();
            if (suggProd) toProduct = suggProd.name;
          }

          // Parse conversation state for offer message
          let offerMessage = 'AI is analyzing this lead...';
          if (session.conversation_state?.offer_suggestion?.to) {
            offerMessage = `Recommended: ${session.conversation_state.offer_suggestion.to}`;
          }

          return {
            id: session.id,
            name: `Visitor ${session.visitor_session_id.slice(-8)}`,
            messagePreview: lastMessage?.message || 'No messages yet',
            leadTemperature: session.lead_temperature || 'cold',
            leadScore: session.lead_score || 0,
            funnelStage: session.current_funnel_stage || 'awareness',
            lastIntent: session.current_intent || 'general_inquiry',
            offerSuggestion: {
              type: session.offer_type || 'stay',
              message: offerMessage,
              fromProduct,
              toProduct
            },
            recommendedNextAction: '', // Will be calculated by component
            buyingSignals: session.buying_signals_history || [],
            messageCount: session.message_count || 0,
            updatedAt: session.updated_at,
            sessionId: session.id,
            channel: session.channel || 'web'
          };
        })
      );

      setLeads(leadsData);

      // Calculate stats
      const statsData: LeadDashboardStats = {
        totalLeads: leadsData.length,
        readyLeads: leadsData.filter(l => l.leadTemperature === 'ready').length,
        hotLeads: leadsData.filter(l => l.leadTemperature === 'hot').length,
        warmLeads: leadsData.filter(l => l.leadTemperature === 'warm').length,
        coldLeads: leadsData.filter(l => l.leadTemperature === 'cold').length,
        averageScore: leadsData.reduce((acc, l) => acc + l.leadScore, 0) / leadsData.length || 0,
        conversionRate: (leadsData.filter(l => l.leadTemperature === 'ready' || l.leadTemperature === 'hot').length / leadsData.length * 100) || 0
      };

      setStats(statsData);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading leads:', error);
      setIsLoading(false);
    }
  }

  function getFilteredLeads() {
    let filtered = leads;

    if (filterTemp !== 'all') {
      filtered = filtered.filter(l => l.leadTemperature === filterTemp);
    }

    if (filterStage !== 'all') {
      filtered = filtered.filter(l => l.funnelStage === filterStage);
    }

    return filtered;
  }

  function handleViewDetails(sessionId: string) {
    navigate(`/chatbot-sessions/${sessionId}`);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading leads dashboard...</p>
        </div>
      </div>
    );
  }

  const filteredLeads = getFilteredLeads();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🎯 AI Sales Dashboard
          </h1>
          <p className="text-gray-600">
            Real-time lead intelligence with AI-powered recommendations
          </p>
        </div>

        {/* STATS CARDS */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Ready to Buy</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.readyLeads}</p>
                </div>
                <div className="text-4xl">{temperatureIcon('ready')}</div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Hot Leads</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.hotLeads}</p>
                </div>
                <div className="text-4xl">{temperatureIcon('hot')}</div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Warm Leads</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.warmLeads}</p>
                </div>
                <div className="text-4xl">{temperatureIcon('warm')}</div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Conversion Rate</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.conversionRate.toFixed(1)}%</p>
                </div>
                <div className="text-4xl">📈</div>
              </div>
            </div>
          </div>
        )}

        {/* FILTERS */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Temperature
              </label>
              <select
                value={filterTemp}
                onChange={(e) => setFilterTemp(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Temperatures</option>
                <option value="ready">🔥🔥🔥 Ready</option>
                <option value="hot">🔥🔥 Hot</option>
                <option value="warm">🔥 Warm</option>
                <option value="cold">❄️ Cold</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Stage
              </label>
              <select
                value={filterStage}
                onChange={(e) => setFilterStage(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Stages</option>
                <option value="awareness">Awareness</option>
                <option value="interest">Interest</option>
                <option value="evaluation">Evaluation</option>
                <option value="decision">Decision</option>
                <option value="closing">Closing</option>
                <option value="followUp">Follow-Up</option>
              </select>
            </div>

            <div className="ml-auto">
              <p className="text-sm text-gray-500 mb-2">Showing</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredLeads.length} leads
              </p>
            </div>
          </div>
        </div>

        {/* LEADS GRID */}
        {filteredLeads.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No leads found</h3>
            <p className="text-gray-600">
              {filterTemp !== 'all' || filterStage !== 'all'
                ? 'Try adjusting your filters'
                : 'Leads will appear here when visitors chat with your AI assistant'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredLeads.map((lead) => (
              <LeadDashboardCard
                key={lead.id}
                lead={lead}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
