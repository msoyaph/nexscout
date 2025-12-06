import { useState } from 'react';
import { ArrowLeft, Check, Sparkles } from 'lucide-react';

interface PurchaseCoinsPageProps {
  onBack: () => void;
  onCheckout: (packageData: CoinPackage) => void;
}

interface CoinPackage {
  id: string;
  coins: number;
  price: number;
  popular?: boolean;
  bonus?: number;
}

export default function PurchaseCoinsPage({ onBack, onCheckout }: PurchaseCoinsPageProps) {
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null);

  const packages: CoinPackage[] = [
    { id: 'starter', coins: 100, price: 199 }, // Reduced from 249 - lower entry point
    { id: 'popular', coins: 500, price: 799, bonus: 50, popular: true }, // Reduced from 999 - better value
    { id: 'value', coins: 1000, price: 1299, bonus: 150 }, // Reduced from 1749 - matches Pro subscription price anchor
    { id: 'pro', coins: 2500, price: 2999, bonus: 500 }, // Reduced from 3999 - premium but attractive
    { id: 'ultimate', coins: 5000, price: 4999, bonus: 1000 }, // New! Replaces confusing 5k and 10k tiers
  ];

  const handleSelectPackage = (pkg: CoinPackage) => {
    setSelectedPackage(pkg);
  };

  const handleProceedToCheckout = () => {
    if (selectedPackage) {
      onCheckout(selectedPackage);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#F8F9FA] text-slate-900 overflow-hidden pb-28">
      <header className="flex items-center justify-between px-6 py-6 sticky top-0 z-10 bg-[#F8F9FA]/90 backdrop-blur-sm">
        <button
          onClick={onBack}
          className="flex items-center justify-center size-10 rounded-full bg-white border border-slate-100 shadow-sm active:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="size-6 text-slate-600" />
        </button>
        <h2 className="text-lg font-semibold font-heading">Purchase Coins</h2>
        <div className="size-10" />
      </header>

      <div className="px-6 pb-8 pt-2 text-center">
        <div className="mb-4 inline-flex p-4 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-full ring-8 ring-yellow-50">
          <Sparkles className="size-12 text-yellow-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
          Choose Your Coin Package
        </h1>
        <p className="text-slate-500 text-sm">
          Select the perfect package for your needs
        </p>
      </div>

      <div className="px-6 space-y-3 mb-6">
        {packages.map((pkg) => (
          <button
            key={pkg.id}
            onClick={() => handleSelectPackage(pkg)}
            className={`w-full bg-white rounded-2xl p-4 border-2 transition-all shadow-sm relative overflow-hidden ${
              selectedPackage?.id === pkg.id
                ? 'border-blue-600 shadow-lg shadow-blue-600/10'
                : 'border-slate-100 hover:border-slate-200'
            }`}
          >
            {pkg.popular && (
              <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">
                MOST POPULAR
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`size-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    selectedPackage?.id === pkg.id
                      ? 'border-blue-600 bg-blue-600'
                      : 'border-slate-300'
                  }`}
                >
                  {selectedPackage?.id === pkg.id && (
                    <Check className="size-3 text-white" />
                  )}
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-slate-900">
                      {pkg.coins.toLocaleString()}
                    </p>
                    {pkg.bonus && (
                      <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                        +{pkg.bonus} Bonus
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Coins</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">₱{pkg.price.toFixed(2)}</p>
                <p className="text-xs text-slate-400">
                  ₱{(pkg.price / (pkg.coins + (pkg.bonus || 0))).toFixed(2)}/coin
                </p>
              </div>
            </div>

            {pkg.bonus && (
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-sm">
                <Sparkles className="size-4 text-yellow-500" />
                <span className="text-slate-600">
                  Total: <span className="font-bold text-slate-900">{pkg.coins + pkg.bonus}</span> coins
                </span>
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="px-6 bg-blue-50 border border-blue-100 rounded-2xl p-4 mx-6 mb-6">
        <div className="flex items-start gap-3">
          <div className="size-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <svg className="size-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-bold text-slate-900 text-sm mb-1">Why Purchase Coins?</p>
            <ul className="text-xs text-slate-600 space-y-1">
              <li>• Unlock premium AI features</li>
              <li>• Generate unlimited pitch decks</li>
              <li>• Access advanced prospect insights</li>
              <li>• Priority customer support</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-5 bg-white/90 backdrop-blur-md border-t border-slate-100 z-20">
        <button
          onClick={handleProceedToCheckout}
          disabled={!selectedPackage}
          className="w-full h-14 bg-blue-600 active:bg-blue-700 text-white rounded-2xl font-semibold text-lg shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {selectedPackage ? (
            <>
              Proceed to Checkout • ₱{selectedPackage.price.toFixed(2)}
            </>
          ) : (
            'Select a Package'
          )}
        </button>
      </div>
    </div>
  );
}
