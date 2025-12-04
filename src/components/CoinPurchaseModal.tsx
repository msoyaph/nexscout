import { useState } from 'react';
import { X, Zap, Coins, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface CoinPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchaseComplete: () => void;
}

interface CoinPack {
  id: string;
  name: string;
  energy: number;
  coins: number;
  price: number;
  popular?: boolean;
  savings?: string;
}

const COIN_PACKS: CoinPack[] = [
  {
    id: 'starter',
    name: 'Starter',
    energy: 50,
    coins: 25,
    price: 499,
  },
  {
    id: 'popular',
    name: 'Popular',
    energy: 150,
    coins: 75,
    price: 999,
    popular: true,
    savings: 'Save 15%'
  },
  {
    id: 'pro',
    name: 'Pro',
    energy: 350,
    coins: 200,
    price: 1999,
    savings: 'Save 25%'
  },
  {
    id: 'ultimate',
    name: 'Ultimate',
    energy: 1000,
    coins: 600,
    price: 4999,
    savings: 'Save 35%'
  }
];

export default function CoinPurchaseModal({ isOpen, onClose, onPurchaseComplete }: CoinPurchaseModalProps) {
  const { user } = useAuth();
  const [selectedPack, setSelectedPack] = useState<string>('popular');
  const [purchasing, setPurchasing] = useState(false);

  if (!isOpen) return null;

  const handlePurchase = async () => {
    if (!user) return;

    const pack = COIN_PACKS.find(p => p.id === selectedPack);
    if (!pack) return;

    setPurchasing(true);
    try {
      // Add energy
      const { data: energyData } = await supabase
        .from('user_energy')
        .select('current_energy')
        .eq('user_id', user.id)
        .maybeSingle();

      const newEnergy = (energyData?.current_energy || 0) + pack.energy;

      await supabase
        .from('user_energy')
        .update({
          current_energy: newEnergy,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      // Add coins
      const { data: profileData } = await supabase
        .from('profiles')
        .select('coin_balance')
        .eq('id', user.id)
        .maybeSingle();

      const newCoins = (profileData?.coin_balance || 0) + pack.coins;

      await supabase
        .from('profiles')
        .update({ coin_balance: newCoins })
        .eq('id', user.id);

      // Log transaction
      await supabase.from('coin_transactions').insert({
        user_id: user.id,
        amount: pack.coins,
        transaction_type: 'purchase',
        description: `Purchased ${pack.name}`,
        balance_after: newCoins,
        metadata: {
          pack_id: pack.id,
          energy_added: pack.energy,
          price_paid: pack.price
        }
      });

      onPurchaseComplete();
      onClose();
    } catch (error) {
      console.error('Error processing purchase:', error);
      alert('Failed to process purchase. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const selectedPackData = COIN_PACKS.find(p => p.id === selectedPack);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header - Facebook Style */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Buy Energy & Coins</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Packs Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {COIN_PACKS.map((pack) => {
              const isSelected = selectedPack === pack.id;

              return (
                <button
                  key={pack.id}
                  onClick={() => setSelectedPack(pack.id)}
                  className={`relative p-4 rounded-lg border-2 transition-all text-center ${
                    isSelected
                      ? 'border-[#1877F2] bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {/* Popular Badge */}
                  {pack.popular && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[#1877F2] text-white text-xs font-semibold rounded">
                      Most Popular
                    </div>
                  )}

                  {/* Selected Checkmark */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#1877F2] flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}

                  {/* Pack Name */}
                  <h3 className={`text-base font-semibold mb-3 ${isSelected ? 'text-[#1877F2]' : 'text-gray-900'}`}>
                    {pack.name}
                  </h3>

                  {/* Resources */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      <span className="text-lg font-semibold text-gray-900">{pack.energy}</span>
                    </div>
                    <div className="flex items-center justify-center gap-1.5">
                      <Coins className="w-4 h-4 text-orange-500" />
                      <span className="text-lg font-semibold text-gray-900">{pack.coins}</span>
                    </div>
                  </div>

                  {/* Savings */}
                  {pack.savings && (
                    <div className="mb-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded inline-block">
                      {pack.savings}
                    </div>
                  )}

                  {/* Price */}
                  <div className={`text-xl font-bold ${isSelected ? 'text-[#1877F2]' : 'text-gray-900'}`}>
                    ₱{pack.price}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Pack Summary */}
          {selectedPackData && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Summary</h3>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Package</span>
                <span className="text-sm font-semibold text-gray-900">{selectedPackData.name}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Energy</span>
                <div className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-yellow-500" />
                  <span className="text-sm font-semibold text-gray-900">{selectedPackData.energy}</span>
                </div>
              </div>
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
                <span className="text-sm text-gray-600">Coins</span>
                <div className="flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-orange-500" />
                  <span className="text-sm font-semibold text-gray-900">{selectedPackData.coins}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-gray-900">Total</span>
                <span className="text-xl font-bold text-gray-900">₱{selectedPackData.price}</span>
              </div>
            </div>
          )}

          {/* Info Text */}
          <p className="text-xs text-gray-500 text-center mt-4">
            Resources are delivered instantly after purchase
          </p>
        </div>

        {/* Footer - Facebook Style */}
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handlePurchase}
            disabled={purchasing}
            className="px-4 py-2 bg-[#1877F2] text-white text-sm font-semibold rounded-md hover:bg-[#0E5FCC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
          >
            {purchasing ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing...</span>
              </div>
            ) : (
              'Purchase'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
