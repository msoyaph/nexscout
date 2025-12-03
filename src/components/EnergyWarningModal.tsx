import { useState } from 'react';
import { X, Battery, Coins, Crown, Video, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useEnergy } from '../contexts/EnergyContext';

interface EnergyWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredEnergy: number;
  feature: string;
  onSuccess?: () => void;
}

export default function EnergyWarningModal({
  isOpen,
  onClose,
  requiredEnergy,
  feature,
  onSuccess
}: EnergyWarningModalProps) {
  const { user } = useAuth();
  const { currentEnergy, addEnergy, purchaseEnergyWithCoins } = useEnergy();
  const [loading, setLoading] = useState(false);
  const [adWatchCount, setAdWatchCount] = useState(0);

  if (!isOpen) return null;

  const handleWatchAd = async () => {
    if (adWatchCount >= 2) {
      alert('Maximum 2 ads per day');
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const success = await addEnergy(2, 'Watched ad');
      if (success) {
        setAdWatchCount(prev => prev + 1);
        alert('You gained 2 energy!');
        if (onSuccess) onSuccess();
        onClose();
      } else {
        alert('Failed to add energy');
      }
    } catch (error) {
      console.error('Error watching ad:', error);
      alert('Failed to watch ad');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseEnergy = async (energyAmount: number) => {
    setLoading(true);
    try {
      const success = await purchaseEnergyWithCoins(energyAmount);
      if (success) {
        alert(`You gained ${energyAmount} energy!`);
        if (onSuccess) onSuccess();
        onClose();
      } else {
        alert('Failed to purchase energy. Check your coin balance.');
      }
    } catch (error) {
      console.error('Error purchasing energy:', error);
      alert('Failed to purchase energy');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = () => {
    // Navigate to subscription page
    window.location.href = '/subscription';
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <Battery className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Out of Energy</h3>
              <p className="text-sm text-gray-600">Choose how to continue</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Current Status */}
        <div className="bg-red-50 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-700">Current Energy</span>
            <span className="text-lg font-bold text-red-600">{currentEnergy}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Required for {feature}</span>
            <span className="text-lg font-bold text-blue-600">{requiredEnergy}</span>
          </div>
          <div className="mt-3 pt-3 border-t border-red-200">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-600" />
              <span className="text-xs text-gray-600">
                You need {requiredEnergy - currentEnergy} more energy
              </span>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-3 mb-6">
          {/* Watch Ad */}
          {adWatchCount < 2 && (
            <button
              onClick={handleWatchAd}
              disabled={loading}
              className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
            >
              <Video className="w-6 h-6 text-white" />
              <div className="flex-1 text-left">
                <p className="font-semibold text-white">Watch Ad</p>
                <p className="text-sm text-white/80">Get +2 energy ({2 - adWatchCount} left today)</p>
              </div>
              <div className="px-3 py-1 bg-white/20 rounded-lg">
                <span className="text-sm font-bold text-white">+2</span>
              </div>
            </button>
          )}

          {/* Purchase with Coins */}
          <div className="space-y-2">
            <button
              onClick={() => handlePurchaseEnergy(1)}
              disabled={loading}
              className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
            >
              <Coins className="w-6 h-6 text-white" />
              <div className="flex-1 text-left">
                <p className="font-semibold text-white">10 Coins</p>
                <p className="text-sm text-white/80">Get +1 energy</p>
              </div>
              <div className="px-3 py-1 bg-white/20 rounded-lg">
                <span className="text-sm font-bold text-white">+1</span>
              </div>
            </button>

            <button
              onClick={() => handlePurchaseEnergy(5)}
              disabled={loading}
              className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
            >
              <Coins className="w-6 h-6 text-white" />
              <div className="flex-1 text-left">
                <p className="font-semibold text-white">50 Coins</p>
                <p className="text-sm text-white/80">Get +5 energy</p>
              </div>
              <div className="px-3 py-1 bg-white/20 rounded-lg">
                <span className="text-sm font-bold text-white">+5</span>
              </div>
            </button>

            <button
              onClick={() => handlePurchaseEnergy(10)}
              disabled={loading}
              className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-yellow-700 to-orange-700 rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
            >
              <Coins className="w-6 h-6 text-white" />
              <div className="flex-1 text-left">
                <p className="font-semibold text-white">100 Coins</p>
                <p className="text-sm text-white/80">Get +10 energy</p>
              </div>
              <div className="px-3 py-1 bg-white/20 rounded-lg">
                <span className="text-sm font-bold text-white">+10</span>
              </div>
            </button>
          </div>

          {/* Upgrade */}
          <button
            onClick={handleUpgrade}
            className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl hover:shadow-lg transition-all"
          >
            <Crown className="w-6 h-6 text-white" />
            <div className="flex-1 text-left">
              <p className="font-semibold text-white">Upgrade to Pro</p>
              <p className="text-sm text-white/80">Get 25 energy daily + bonuses</p>
            </div>
          </button>
        </div>

        {/* Info */}
        <div className="bg-blue-50 rounded-xl p-3">
          <p className="text-xs text-gray-700 text-center">
            Energy resets daily at midnight (UTC+8). Pro & Elite members get more energy!
          </p>
        </div>
      </div>
    </div>
  );
}
