import { useState, useEffect } from 'react';
import { ArrowLeft, Battery, Coins, Crown, Video, Zap, TrendingUp, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { energyEngine } from '../services/energy/energyEngine';
import { supabase } from '../lib/supabase';
import EnergyBar from '../components/EnergyBar';

interface EnergyRefillPageProps {
  onBack: () => void;
}

export default function EnergyRefillPage({ onBack }: EnergyRefillPageProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [coinBalance, setCoinBalance] = useState(0);

  useEffect(() => {
    if (user) {
      loadStats();
      loadCoinBalance();
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

  const loadCoinBalance = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('coin_wallets')
      .select('balance')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setCoinBalance(data.balance);
    }
  };

  const handlePurchase = async (coins: number, energy: number) => {
    if (!user) return;

    if (coinBalance < coins) {
      alert('Insufficient coins. Purchase coins first!');
      return;
    }

    setPurchasing(true);
    try {
      const result = await energyEngine.purchaseEnergyWithCoins(user.id, coins, energy);

      if (result.success) {
        alert(`Successfully purchased ${energy} energy!`);
        await loadStats();
        await loadCoinBalance();
      } else {
        alert(result.error || 'Purchase failed');
      }
    } catch (error) {
      console.error('Error purchasing energy:', error);
      alert('Purchase failed');
    } finally {
      setPurchasing(false);
    }
  };

  const handleWatchAd = async () => {
    if (!user) return;

    setPurchasing(true);
    try {
      // Simulate ad watching
      await new Promise(resolve => setTimeout(resolve, 2000));
      await energyEngine.addEnergy(user.id, 2, 'refill', 'Watched ad');
      alert('You gained 2 energy!');
      await loadStats();
    } catch (error) {
      console.error('Error watching ad:', error);
      alert('Failed to watch ad');
    } finally {
      setPurchasing(false);
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

        {/* Coin Balance */}
        <section className="bg-white rounded-[30px] shadow-lg p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <Coins className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Available Coins</p>
                <p className="text-2xl font-bold text-gray-900">{coinBalance}</p>
              </div>
            </div>
            <button
              onClick={() => window.location.href = '/wallet'}
              className="px-4 py-2 bg-yellow-500 text-white rounded-xl font-semibold hover:bg-yellow-600 transition-colors"
            >
              Buy Coins
            </button>
          </div>
        </section>

        {/* Watch Ads */}
        <section className="bg-white rounded-[30px] shadow-lg">
          <div className="p-5 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Video className="w-6 h-6 text-purple-600" />
              <div>
                <h2 className="font-bold text-gray-900">Watch Ads</h2>
                <p className="text-xs text-gray-600">Free energy by watching short videos</p>
              </div>
            </div>
          </div>
          <div className="p-5">
            <button
              onClick={handleWatchAd}
              disabled={purchasing}
              className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
            >
              <Video className="w-6 h-6 text-white" />
              <div className="flex-1 text-left">
                <p className="font-semibold text-white">Watch 30s Ad</p>
                <p className="text-sm text-white/80">Get +2 energy (Max 2/day)</p>
              </div>
              <div className="px-4 py-2 bg-white/20 rounded-lg">
                <span className="text-lg font-bold text-white">+2 ⚡</span>
              </div>
            </button>
          </div>
        </section>

        {/* Purchase Options */}
        <section className="bg-white rounded-[30px] shadow-lg">
          <div className="p-5 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 text-yellow-600" />
              <div>
                <h2 className="font-bold text-gray-900">Buy with Coins</h2>
                <p className="text-xs text-gray-600">Instant energy refill</p>
              </div>
            </div>
          </div>
          <div className="p-5 space-y-3">
            {/* 3 coins = 3 energy */}
            <button
              onClick={() => handlePurchase(3, 3)}
              disabled={purchasing || coinBalance < 3}
              className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Coins className="w-6 h-6 text-white" />
              <div className="flex-1 text-left">
                <p className="font-semibold text-white">3 Coins</p>
                <p className="text-sm text-white/80">Quick refill</p>
              </div>
              <div className="px-4 py-2 bg-white/20 rounded-lg">
                <span className="text-lg font-bold text-white">+3 ⚡</span>
              </div>
            </button>

            {/* 5 coins = 5 energy */}
            <button
              onClick={() => handlePurchase(5, 5)}
              disabled={purchasing || coinBalance < 5}
              className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Coins className="w-6 h-6 text-white" />
              <div className="flex-1 text-left">
                <p className="font-semibold text-white">5 Coins</p>
                <p className="text-sm text-white/80">Standard refill</p>
              </div>
              <div className="px-4 py-2 bg-white/20 rounded-lg">
                <span className="text-lg font-bold text-white">+5 ⚡</span>
              </div>
            </button>

            {/* 10 coins = 12 energy (best value) */}
            <div className="relative">
              <div className="absolute -top-2 -right-2 z-10 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                Best Value!
              </div>
              <button
                onClick={() => handlePurchase(10, 12)}
                disabled={purchasing || coinBalance < 10}
                className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed border-2 border-yellow-400"
              >
                <Coins className="w-6 h-6 text-white" />
                <div className="flex-1 text-left">
                  <p className="font-semibold text-white">10 Coins</p>
                  <p className="text-sm text-white/80">20% bonus energy!</p>
                </div>
                <div className="px-4 py-2 bg-white/20 rounded-lg">
                  <span className="text-lg font-bold text-white">+12 ⚡</span>
                </div>
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
              <p className="text-2xl font-bold text-white">25</p>
              <p className="text-xs text-white/80">Pro Daily</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-white">99</p>
              <p className="text-xs text-white/80">Elite Daily</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-white">∞</p>
              <p className="text-xs text-white/80">Enterprise</p>
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
  );
}
