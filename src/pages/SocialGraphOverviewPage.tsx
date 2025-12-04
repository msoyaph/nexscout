import { useEffect, useState } from 'react';
import { Users, Network, TrendingUp, RefreshCw, Facebook, Instagram, Linkedin, Twitter, Video } from 'lucide-react';
import { SocialGraphBuilder, GraphSummary, TopContact } from '../services/socialGraphBuilder';
import { supabase } from '../lib/supabase';

interface SocialGraphOverviewPageProps {
  onNavigate: (page: string) => void;
}

export default function SocialGraphOverviewPage({ onNavigate }: SocialGraphOverviewPageProps) {
  const [summary, setSummary] = useState<GraphSummary | null>(null);
  const [topContacts, setTopContacts] = useState<TopContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [rebuilding, setRebuilding] = useState(false);

  useEffect(() => {
    loadGraphData();
  }, []);

  const loadGraphData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const graphSummary = await SocialGraphBuilder.getGraphSummary(user.id);
      setSummary(graphSummary);

      const contacts = await SocialGraphBuilder.getTopContacts(user.id, 10);
      setTopContacts(contacts);
    } catch (error) {
      console.error('Failed to load graph data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRebuild = async () => {
    setRebuilding(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newSummary = await SocialGraphBuilder.buildGraphForUser(user.id);
      setSummary(newSummary);

      const contacts = await SocialGraphBuilder.getTopContacts(user.id, 10);
      setTopContacts(contacts);

      alert('Social graph rebuilt successfully!');
    } catch (error) {
      console.error('Failed to rebuild graph:', error);
      alert('Failed to rebuild graph. Please try again.');
    } finally {
      setRebuilding(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'facebook': return Facebook;
      case 'instagram': return Instagram;
      case 'linkedin': return Linkedin;
      case 'twitter': return Twitter;
      case 'tiktok': return Video;
      default: return Users;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading social graph...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-cyan-50 p-6">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => onNavigate('home')}
          className="mb-6 text-gray-600 hover:text-gray-900 flex items-center gap-2"
        >
          ← Back to Home
        </button>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Social Graph Overview</h1>
            <p className="text-gray-600">Your unified social network mapped by NexScout AI</p>
          </div>
          <button
            onClick={handleRebuild}
            disabled={rebuilding}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 font-medium flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${rebuilding ? 'animate-spin' : ''}`} />
            {rebuilding ? 'Rebuilding...' : 'Rebuild Graph'}
          </button>
        </div>

        {!summary ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Network className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Social Graph Yet</h2>
            <p className="text-gray-600 mb-6">
              Connect your social platforms or upload data to build your social graph
            </p>
            <button
              onClick={handleRebuild}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 font-medium"
            >
              Build Graph Now
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-700">Total Contacts</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900">{summary.totalContacts}</p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Network className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-700">Connections</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900">{summary.totalEdges}</p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-700">Recent Activity</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900">{summary.interactionsLast30Days}</p>
                <p className="text-sm text-gray-500">Last 30 days</p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Users className="w-5 h-5 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-gray-700">Prospects</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900">{summary.prospectsWithSocialContext}</p>
                <p className="text-sm text-gray-500">With social data</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Platform Breakdown</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(summary.platformBreakdown).map(([platform, count]) => {
                  const Icon = getPlatformIcon(platform);
                  return (
                    <div key={platform} className="text-center p-4 bg-gray-50 rounded-xl">
                      <Icon className="w-8 h-8 mx-auto mb-2 text-gray-700" />
                      <p className="text-sm font-medium text-gray-600 capitalize">{platform}</p>
                      <p className="text-2xl font-bold text-gray-900">{count}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Top High-Relationship Contacts</h2>
              <div className="space-y-4">
                {topContacts.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No contacts yet. Connect platforms or upload data.</p>
                ) : (
                  topContacts.map((contact, index) => {
                    const Icon = getPlatformIcon(contact.platform);
                    return (
                      <div
                        key={contact.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{contact.fullName}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Icon className="w-4 h-4" />
                              <span className="capitalize">{contact.platform}</span>
                              {contact.mutualFriends && (
                                <span>· {contact.mutualFriends} mutual friends</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-green-400 to-green-600"
                                style={{ width: `${contact.relationshipStrength}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-gray-700">
                              {Math.round(contact.relationshipStrength)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            {contact.recentInteractions30d} recent interactions
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
