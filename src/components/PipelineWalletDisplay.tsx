import { useState, useEffect } from 'react';
import { Zap, Coins, Plus, TrendingUp, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface PipelineWalletDisplayProps {
  onPurchaseClick: () => void;
}

export default function PipelineWalletDisplay({ onPurchaseClick }: PipelineWalletDisplayProps) {
  const { user } = useAuth();
  const [energy, setEnergy] = useState(0);
  const [coins, setCoins] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showLowWarning, setShowLowWarning] = useState(false);

  useEffect(() => {
    if (user) {
      loadResources();
      // Refresh every 30 seconds
      const interval = setInterval(loadResources, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadResources = async () => {
    if (!user) return;

    try {
      // Get energy
      const { data: energyData } = await supabase
        .from('user_energy')
        .select('current_energy')
        .eq('user_id', user.id)
        .maybeSingle();

      // Get coins
      const { data: profileData } = await supabase
        .from('profiles')
        .select('coin_balance')
        .eq('id', user.id)
        .maybeSingle();

      const currentEnergy = energyData?.current_energy || 0;
      const currentCoins = profileData?.coin_balance || 0;

      setEnergy(currentEnergy);
      setCoins(currentCoins);

      // Show warning if resources are low
      setShowLowWarning(currentEnergy < 20 || currentCoins < 10);
    } catch (error) {
      console.error('Error loading resources:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200">
        <div className="w-16 h-5 bg-gray-200 animate-pulse rounded" />
      </div>
    );
  }

  const energyPercentage = Math.min(100, (energy / 100) * 100);
  const isEnergyLow = energy < 20;
  const isCoinsLow = coins < 10;

  return (
    <div className="flex items-center gap-2">
      {/* Energy Display */}
      <div
        className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
          isEnergyLow
            ? 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200 shadow-sm'
            : 'bg-white/80 backdrop-blur-sm border-gray-200'
        }`}
      >
        <Zap className={`w-4 h-4 ${isEnergyLow ? 'text-red-500 animate-pulse' : 'text-yellow-500'}`} />
        <div className="flex items-center gap-1 whitespace-nowrap">
          <span className={`text-xs font-bold ${isEnergyLow ? 'text-red-700' : 'text-gray-900'}`}>
            {energy}
          </span>
          {isEnergyLow && (
            <span className="text-[10px] text-red-600 font-semibold">Low!</span>
          )}
        </div>

        {/* Energy bar */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-200 rounded-b-xl overflow-hidden">
          <div
            className={`h-full transition-all ${isEnergyLow ? 'bg-red-500' : 'bg-yellow-500'}`}
            style={{ width: `${energyPercentage}%` }}
          />
        </div>
      </div>

      {/* Coins Display */}
      <div
        className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
          isCoinsLow
            ? 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200 shadow-sm'
            : 'bg-white/80 backdrop-blur-sm border-gray-200'
        }`}
      >
        <Coins className={`w-4 h-4 ${isCoinsLow ? 'text-red-500 animate-pulse' : 'text-orange-500'}`} />
        <div className="flex items-center gap-1 whitespace-nowrap">
          <span className={`text-xs font-bold ${isCoinsLow ? 'text-red-700' : 'text-gray-900'}`}>
            {coins}
          </span>
          {isCoinsLow && (
            <span className="text-[10px] text-red-600 font-semibold">Low!</span>
          )}
        </div>
      </div>

      {/* Buy Button */}
      <button
        onClick={onPurchaseClick}
        className={`relative p-2 rounded-xl font-semibold transition-all flex items-center justify-center ${
          showLowWarning
            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg hover:shadow-xl animate-pulse'
            : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
        }`}
        title="Buy Energy & Coins"
      >
        {showLowWarning ? (
          <TrendingUp className="w-4 h-4" />
        ) : (
          <Plus className="w-4 h-4" />
        )}

        {showLowWarning && (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
        )}
      </button>
    </div>
  );
}
