import { CheckCircle, Download, Share2, Home } from 'lucide-react';

interface ReceiptPageProps {
  onBackToHome: () => void;
  packageData: {
    coins: number;
    price: number;
    bonus?: number;
  };
}

export default function ReceiptPage({ onBackToHome, packageData }: ReceiptPageProps) {
  const totalCoins = packageData.coins + (packageData.bonus || 0);
  const transactionId = `TXN${Date.now().toString().slice(-8)}`;
  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="relative min-h-screen bg-[#F8F9FA] text-slate-900 overflow-hidden pb-28">
      <div className="px-6 pt-12 pb-8 text-center">
        <div className="mb-6 inline-flex p-4 bg-green-100 rounded-full ring-8 ring-green-50 animate-in fade-in zoom-in duration-500">
          <CheckCircle className="size-16 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
          Payment Successful!
        </h1>
        <p className="text-slate-500">
          Your coins have been added to your wallet
        </p>
      </div>

      <div className="px-6 space-y-4">
        <div className="bg-gradient-to-br from-blue-600 to-blue-500 rounded-3xl p-6 text-white shadow-xl">
          <div className="text-center mb-4">
            <p className="text-blue-100 text-sm mb-2">You Received</p>
            <div className="flex items-baseline justify-center gap-2">
              <h2 className="text-5xl font-bold">{totalCoins.toLocaleString()}</h2>
              <span className="text-blue-100 text-xl">Coins</span>
            </div>
          </div>

          {packageData.bonus && (
            <div className="flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
              <svg className="size-4 text-yellow-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span className="text-sm">
                Including <span className="font-bold">{packageData.bonus}</span> bonus coins
              </span>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 pb-3 border-b border-slate-100">
            Transaction Details
          </h3>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-sm">Transaction ID</span>
              <span className="font-mono font-semibold text-slate-900 text-sm">{transactionId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-sm">Date & Time</span>
              <span className="font-semibold text-slate-900 text-sm">{currentDate}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-sm">Payment Method</span>
              <span className="font-semibold text-slate-900 text-sm">Credit Card</span>
            </div>
            <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
              <span className="text-slate-500 text-sm">Base Coins</span>
              <span className="font-semibold text-slate-900">{packageData.coins.toLocaleString()}</span>
            </div>
            {packageData.bonus && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-sm">Bonus Coins</span>
                <span className="font-semibold text-green-600">+{packageData.bonus}</span>
              </div>
            )}
            <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
              <span className="font-bold text-slate-900">Total Coins</span>
              <span className="font-bold text-blue-600 text-lg">{totalCoins.toLocaleString()}</span>
            </div>
            <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
              <span className="font-bold text-slate-900">Amount Paid</span>
              <span className="font-bold text-slate-900 text-xl">${packageData.price}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button className="flex-1 h-12 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
            <Download className="size-4" />
            Download
          </button>
          <button className="flex-1 h-12 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
            <Share2 className="size-4" />
            Share
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <p className="text-sm text-slate-600 text-center">
            A confirmation email has been sent to your registered email address.
          </p>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-5 bg-white/90 backdrop-blur-md border-t border-slate-100 z-20">
        <button
          onClick={onBackToHome}
          className="w-full h-14 bg-blue-600 active:bg-blue-700 text-white rounded-2xl font-semibold text-lg shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
        >
          <Home className="size-5" />
          Back to Home
        </button>
      </div>
    </div>
  );
}
