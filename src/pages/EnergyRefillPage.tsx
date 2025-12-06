import { useState, useEffect } from 'react';
import { ArrowLeft, Battery, Crown, Video, Zap, TrendingUp, Clock, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { energyEngine } from '../services/energy/energyEngine';
import EnergyBar from '../components/EnergyBar';
import AdPlayer from '../components/AdPlayer';

interface EnergyRefillPageProps {
  onBack: () => void;
}

export default function EnergyRefillPage({ onBack }: EnergyRefillPageProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [showAdPlayer, setShowAdPlayer] = useState(false);
  const [adsWatchedToday, setAdsWatchedToday] = useState(0);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const energyStats = await energyEngine.getEnergyStats(user.id);
      setStats(energyStats);
    } catch (error) {
      console.error('Error loading energy stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Removed: coin balance loading (no longer needed for energy purchase)

  // Removed: coin-to-energy conversion (creates pricing arbitrage)
  // Energy now obtained via: daily reset, watching ads, or upgrading subscription

  const handleWatchAd = () => {
    if (!user) return;
    if (adsWatchedToday >= 5) {
      alert('You\'ve watched the maximum 5 ads today. Come back tomorrow!');
      return;
    }
    setShowAdPlayer(true);
  };

  const handleAdComplete = async () => {
    if (!user) return;

    try {
      // Award energy for watching ad
      await energyEngine.addEnergy(user.id, 2, 'refill', 'Watched ad');
      setAdsWatchedToday(prev => prev + 1);
      setShowAdPlayer(false);
      await loadStats();
      
      // Show success message
      alert(`🎉 You gained 2 energy! (${adsWatchedToday + 1}/5 ads today)`);
    } catch (error) {
      console.error('Error completing ad:', error);
      alert('Failed to award energy. Please try again.');
    }
  };

  const getTimeUntilReset = () => {
    if (!stats?.lastReset) return '';

    const lastReset = new Date(stats.lastReset);
    const nextReset = new Date(lastReset.getTime() + 24 * 60 * 60 * 1000);
    const now = new Date();
    const diff = nextReset.getTime() - now.getTime();

    if (diff <= 0) return 'Resetting now...';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Ad Player Modal */}
      {showAdPlayer && (
        <AdPlayer
          onComplete={handleAdComplete}
          onClose={() => setShowAdPlayer(false)}
          reward={{ energy: 2 }}
        />
      )}

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pb-28">
      {/* Header */}
      <header className="px-6 pt-8 pb-6 bg-white shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="flex items-center justify-center size-11 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="size-6 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Energy Refill</h1>
          <EnergyBar compact />
        </div>
        <p className="text-sm text-gray-600 text-center">
          Power up your AI actions with energy
        </p>
      </header>

      <main className="px-6 space-y-6 mt-6">
        {/* Current Status */}
        <section className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-[30px] shadow-xl p-6 text-white">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Battery className="w-8 h-8" />
              <div>
                <p className="text-sm opacity-90">Current Energy</p>
                <p className="text-3xl font-bold">{stats?.current || 0}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90">Daily Max</p>
              <p className="text-2xl font-bold">{stats?.max || 5}</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-white/20">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Resets in {getTimeUntilReset()}</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">{stats?.dailyUsage || 0}/{stats?.dailyLimit || 15} used today</span>
            </div>
          </div>
        </section>

        {/* Energy Info */}
        <section className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-[30px] border border-blue-200 p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-2">⚡ How to Get More Energy</h3>
              <ul className="text-sm text-gray-700 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span><strong>Free:</strong> Watch ads below (up to 5 per day)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span><strong>Daily Reset:</strong> Energy refills automatically every 24 hours</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-0.5">•</span>
                  <span><strong>Best Value:</strong> Upgrade to Pro for 100 energy/day!</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Watch Ads - Primary Free Energy Source */}
        <section className="bg-white rounded-[30px] shadow-lg overflow-hidden">
          <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
            <div className="flex items-center gap-3">
              <Video className="w-6 h-6 text-purple-600" />
              <div>
                <h2 className="font-bold text-gray-900">Watch Ads for Free Energy</h2>
                <p className="text-xs text-gray-600">Up to 5 ads per day = 10 free energy! 🎉</p>
              </div>
            </div>
          </div>
          <div className="p-5 space-y-3">
            <button
              onClick={handleWatchAd}
              disabled={purchasing || adsWatchedToday >= 5}
              className="w-full flex items-center gap-3 p-5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 active:scale-[0.99]"
            >
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Video className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-white text-lg">Watch 30s Video</p>
                <p className="text-sm text-white/90">Get +2 energy instantly</p>
              </div>
              <div className="px-5 py-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <span className="text-2xl font-bold text-white">+2 ⚡</span>
              </div>
            </button>
            
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-purple-700">
                  <Sparkles className="w-4 h-4" />
                  <span className="font-semibold">Watch 5 ads = 10 free energy!</span>
                </div>
                <div className="text-sm font-bold text-purple-900">
                  {adsWatchedToday}/5 today
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Info: Coins Are For Add-Ons */}
        <section className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-[30px] border border-yellow-200 p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center shrink-0">
              <Coins className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-2">💰 Need More Coins?</h3>
              <p className="text-sm text-gray-700 mb-3">
                Coins are used for premium add-ons like AI Video Scripts, Competitor Analysis, 
                WhatsApp Integration, and more!
              </p>
              <button
                onClick={() => window.location.href = '/wallet'}
                className="px-5 py-2.5 bg-yellow-500 text-white rounded-xl font-semibold hover:bg-yellow-600 transition-colors shadow-md"
              >
                Buy Coins for Add-Ons
              </button>
            </div>
          </div>
        </section>

        {/* Upgrade */}
        <section className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-[30px] shadow-lg p-6">
          <div className="flex items-center gap-4 mb-4">
            <Crown className="w-12 h-12 text-yellow-300" />
            <div className="flex-1">
              <h3 className="font-bold text-white text-lg">Upgrade for More Energy</h3>
              <p className="text-sm text-white/80">Get unlimited AI power</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-white">10</p>
              <p className="text-xs text-white/80">Free Daily</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-white">100</p>
              <p className="text-xs text-white/80">Pro Daily</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-white">500</p>
              <p className="text-xs text-white/80">Team Daily</p>
            </div>
          </div>

          <button
            onClick={() => window.location.href = '/subscription'}
            className="w-full bg-white text-blue-600 py-3 rounded-xl font-bold hover:shadow-xl transition-all"
          >
            View Plans
          </button>
        </section>

        {/* Recent Activity */}
        {stats?.recentTransactions && stats.recentTransactions.length > 0 && (
          <section className="bg-white rounded-[30px] shadow-lg">
            <div className="p-5 border-b border-gray-200">
              <h2 className="font-bold text-gray-900">Recent Activity</h2>
            </div>
            <div className="p-5 space-y-2">
              {stats.recentTransactions.slice(0, 5).map((tx: any) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      tx.energy_change > 0 ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      <Zap className={`w-4 h-4 ${
                        tx.energy_change > 0 ? 'text-green-600' : 'text-red-600'
                      }`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{tx.reason}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(tx.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${
                    tx.energy_change > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {tx.energy_change > 0 ? '+' : ''}{tx.energy_change}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
      </div>
    </>
  );
}
