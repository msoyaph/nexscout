import { useEffect, useState } from 'react';
import { Facebook, Instagram, Linkedin, Twitter, Video, CheckCircle, XCircle, Zap, Users, TrendingUp, Loader } from 'lucide-react';
import { SocialAuth, SocialProvider } from '../auth/socialAuth';
import { SocialProspectScanner, ScanProgress } from '../services/socialProspectScanner';
import { useAuth } from '../contexts/AuthContext';

interface SocialConnectPageProps {
  onNavigate: (page: string) => void;
}

interface ConnectionStatus {
  provider: SocialProvider;
  connected: boolean;
  profileData?: any;
}

export default function SocialConnectPage({ onNavigate }: SocialConnectPageProps) {
  const { user } = useAuth();
  const [connections, setConnections] = useState<ConnectionStatus[]>([]);
  const [smartnessBoost, setSmartnessBoost] = useState(0);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null);
  const [lastScanResults, setLastScanResults] = useState<any>(null);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    setLoading(true);
    try {
      const identities = await SocialAuth.getConnectedIdentities();

      const allProviders: SocialProvider[] = ['facebook', 'instagram', 'linkedin', 'twitter', 'tiktok'];

      const statusList: ConnectionStatus[] = allProviders.map(provider => {
        const identity = identities.find(i => i.provider === provider);
        return {
          provider,
          connected: !!identity,
          profileData: identity?.profileData,
        };
      });

      setConnections(statusList);

      const connectedCount = statusList.filter(s => s.connected).length;
      if (connectedCount >= 3) setSmartnessBoost(40);
      else if (connectedCount >= 2) setSmartnessBoost(25);
      else if (connectedCount >= 1) setSmartnessBoost(10);
      else setSmartnessBoost(0);
    } catch (error) {
      console.error('Failed to load connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (provider: SocialProvider) => {
    try {
      const { url } = await SocialAuth.startOAuthFlow(provider);
      window.location.href = url;
    } catch (error) {
      console.error('Failed to start OAuth:', error);
      alert('Failed to connect. Please try again.');
    }
  };

  const handleDisconnect = async (provider: SocialProvider) => {
    if (!confirm(`Disconnect ${provider}?`)) return;

    try {
      await SocialAuth.disconnectProvider(provider);
      await loadConnections();
    } catch (error) {
      console.error('Failed to disconnect:', error);
      alert('Failed to disconnect. Please try again.');
    }
  };

  const handleScanProspects = async (provider: SocialProvider) => {
    if (!user) {
      alert('Please log in to scan prospects');
      return;
    }

    const connection = connections.find(c => c.provider === provider && c.connected);
    if (!connection) {
      alert('Please connect this platform first');
      return;
    }

    setScanning(true);
    setScanProgress(null);
    setLastScanResults(null);

    try {
      const identities = await SocialAuth.getConnectedIdentities();
      const identity = identities.find(i => i.provider === provider);

      if (!identity) {
        throw new Error('Identity not found');
      }

      const scanner = new SocialProspectScanner((progress: ScanProgress) => {
        setScanProgress(progress);
      });

      const result = await scanner.scanProvider(user.id, provider, identity.id);

      if (result.success) {
        setLastScanResults(result);
        alert(`Success! Found ${result.prospectsFound} prospects from ${provider}!`);

        // Navigate to prospects page after a moment
        setTimeout(() => {
          onNavigate('prospects');
        }, 2000);
      } else {
        alert(`Scan failed: ${result.error}`);
      }
    } catch (error: any) {
      console.error('Scan error:', error);
      alert(`Failed to scan: ${error.message}`);
    } finally {
      setScanning(false);
      setScanProgress(null);
    }
  };

  const socialCards = [
    {
      provider: 'facebook' as SocialProvider,
      name: 'Facebook Page',
      description: 'Connect your business page to import posts, comments, and insights',
      icon: Facebook,
      color: 'bg-[#1877F2]',
    },
    {
      provider: 'instagram' as SocialProvider,
      name: 'Instagram Professional',
      description: 'Import posts, stories, and engagement from your business account',
      icon: Instagram,
      color: 'bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500',
    },
    {
      provider: 'linkedin' as SocialProvider,
      name: 'LinkedIn Company Page',
      description: 'Connect your organization page for post analytics and engagement',
      icon: Linkedin,
      color: 'bg-[#0A66C2]',
    },
    {
      provider: 'twitter' as SocialProvider,
      name: 'Twitter / X',
      description: 'Import your tweets and engagement metrics',
      icon: Twitter,
      color: 'bg-black',
    },
    {
      provider: 'tiktok' as SocialProvider,
      name: 'TikTok Business',
      description: 'Connect your business account for video insights',
      icon: Video,
      color: 'bg-black',
    },
  ];

  const connectedCount = connections.filter(c => c.connected).length;
  const progressPercentage = (connectedCount / 5) * 100;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading connections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-cyan-50 p-6">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => onNavigate('home')}
          className="mb-6 text-gray-600 hover:text-gray-900 flex items-center gap-2"
        >
          ← Back to Home
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Social Connect</h1>
          <p className="text-gray-600">
            Connect your social platforms to supercharge your AI Scanner with real prospect data
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Connect Social Media</h2>

          <div className="flex items-center justify-center gap-4 mb-8">
            {[
              { provider: 'facebook' as SocialProvider, icon: Facebook, label: 'FB', color: 'bg-[#1877F2]' },
              { provider: 'instagram' as SocialProvider, icon: Instagram, label: 'IG', color: 'bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500' },
              { provider: 'linkedin' as SocialProvider, icon: Linkedin, label: 'LI', color: 'bg-[#0A66C2]' },
              { provider: 'twitter' as SocialProvider, icon: Twitter, label: 'X', color: 'bg-black' },
            ].map(item => {
              const status = connections.find(c => c.provider === item.provider);
              const Icon = item.icon;

              return (
                <div key={item.provider} className="flex flex-col items-center">
                  <button
                    onClick={() => status?.connected ? handleDisconnect(item.provider) : handleConnect(item.provider)}
                    className="relative group"
                  >
                    <div className={`${item.color} w-16 h-16 rounded-2xl flex items-center justify-center hover:scale-105 transition-transform shadow-lg`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    {status?.connected && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                  <span className="text-sm font-semibold text-gray-900 mt-3">{item.label}</span>
                  <span className="text-xs text-gray-500 mt-1">
                    {status?.connected ? 'Connected' : 'Connect'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Boost Your AI Scanner</h2>
              <p className="text-sm text-gray-600">
                {connectedCount} of 5 platforms connected (+{smartnessBoost} Smartness)
              </p>
            </div>
          </div>

          <div className="mb-4">
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${connectedCount >= 1 ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className={connectedCount >= 1 ? 'text-gray-900' : 'text-gray-400'}>
                1 platform: +10 Smartness
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${connectedCount >= 2 ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className={connectedCount >= 2 ? 'text-gray-900' : 'text-gray-400'}>
                2 platforms: +25 Smartness
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${connectedCount >= 3 ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className={connectedCount >= 3 ? 'text-gray-900' : 'text-gray-400'}>
                3+ platforms: +40 Smartness
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {socialCards.map(card => {
            const status = connections.find(c => c.provider === card.provider);
            const Icon = card.icon;

            return (
              <div
                key={card.provider}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className={`${card.color} p-6 text-white`}>
                  <div className="flex items-center justify-between mb-4">
                    <Icon className="w-10 h-10" />
                    {status?.connected ? (
                      <CheckCircle className="w-6 h-6 text-green-300" />
                    ) : (
                      <XCircle className="w-6 h-6 text-white/30" />
                    )}
                  </div>
                  <h3 className="text-xl font-bold">{card.name}</h3>
                </div>

                <div className="p-6">
                  <p className="text-sm text-gray-600 mb-4">{card.description}</p>

                  {status?.connected ? (
                    <div className="space-y-3">
                      <div className="text-sm text-green-600 font-medium mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Connected
                      </div>
                      <button
                        onClick={() => handleScanProspects(card.provider)}
                        disabled={scanning}
                        className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl hover:from-green-700 hover:to-teal-700 font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {scanning ? (
                          <>
                            <Loader className="w-5 h-5 animate-spin" />
                            Scanning...
                          </>
                        ) : (
                          <>
                            <Users className="w-5 h-5" />
                            Scan Prospects
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleDisconnect(card.provider)}
                        className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium text-sm"
                      >
                        Disconnect
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleConnect(card.provider)}
                      className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 font-medium"
                    >
                      Connect Now
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Tips to Improve AI Accuracy</h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-sm font-bold">1</span>
              </div>
              <p className="text-gray-700">Connect at least 1 social platform to unlock advanced AI features</p>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-sm font-bold">2</span>
              </div>
              <p className="text-gray-700">Upload friends list screenshots for maximum prospect discovery</p>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-sm font-bold">3</span>
              </div>
              <p className="text-gray-700">Upload FB/IG data exports for deeper relationship mapping</p>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-sm font-bold">4</span>
              </div>
              <p className="text-gray-700">Upload comment screenshots to identify active prospects</p>
            </li>
          </ul>
        </div>

        {/* Scanning Progress Modal */}
        {scanning && scanProgress && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  {scanProgress.status === 'completed' ? (
                    <CheckCircle className="w-10 h-10 text-white" />
                  ) : (
                    <Loader className="w-10 h-10 text-white animate-spin" />
                  )}
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {scanProgress.status === 'completed' ? 'Scan Complete!' : 'Scanning...'}
                </h3>
                <p className="text-gray-600 mb-6">{scanProgress.message}</p>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-teal-500 transition-all duration-300"
                      style={{ width: `${scanProgress.progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">{scanProgress.progress}%</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="text-2xl font-bold text-gray-900">{scanProgress.itemsProcessed}</div>
                    <div className="text-gray-600">Processed</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-3">
                    <div className="text-2xl font-bold text-green-600">{scanProgress.prospectsFound}</div>
                    <div className="text-gray-600">Prospects</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
