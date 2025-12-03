import { TrendingUp, Users, AlertTriangle, Sparkles, ArrowRight, CheckCircle } from 'lucide-react';

interface CompanyWhyUploadProps {
  userTier: string;
  onNext: () => void;
  onSkip?: () => void;
}

export default function CompanyWhyUpload({ userTier, onNext, onSkip }: CompanyWhyUploadProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="mb-8">
          <div className="w-full bg-slate-200 rounded-full h-3 mb-6">
            <div
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-500"
              style={{ width: '15%' }}
            />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Why Upload Your Company Data?
          </h1>
          <p className="text-xl text-slate-600">
            See the massive difference it makes in your AI performance
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-8 text-white shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center">
                <TrendingUp className="size-7 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold">+220%</p>
                <p className="text-green-100 text-sm">More Deals Closed</p>
              </div>
            </div>
            <p className="text-lg font-semibold mb-2">Proven Results</p>
            <p className="text-green-100">
              Users who complete company setup close significantly more deals with AI-powered
              personalization
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl p-8 text-white shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center">
                <Users className="size-7 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold">Top 50</p>
                <p className="text-blue-100 text-sm">Elite Users</p>
              </div>
            </div>
            <p className="text-lg font-semibold mb-2">Social Proof</p>
            <p className="text-blue-100">
              All top Elite users completed this setup in their first 24 hours. Join the winning
              circle!
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl border-2 border-slate-200 p-8 mb-8">
          <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-6 border-2 border-red-200 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="size-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-red-900 text-lg mb-2">Warning: Generic Defaults</h3>
                <p className="text-red-800">
                  Without your company materials, NexScout will use generic defaults. Your
                  conversion rate may drop significantly. Don't leave performance on the table!
                </p>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            Before vs After: See The Difference
          </h2>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="border-2 border-red-200 rounded-2xl p-6 bg-red-50">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">×</span>
                </div>
                <h3 className="font-bold text-slate-900">Generic Message</h3>
              </div>
              <div className="bg-white rounded-xl p-4 text-sm text-slate-600 italic">
                "Hi! I'd like to share a great business opportunity with you. It could help you earn
                extra income. Let me know if you're interested!"
              </div>
              <p className="text-xs text-red-700 mt-3 font-medium">
                Generic, impersonal, low conversion
              </p>
            </div>

            <div className="border-2 border-green-200 rounded-2xl p-6 bg-green-50">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <CheckCircle className="size-5 text-white" />
                </div>
                <h3 className="font-bold text-slate-900">Company-Powered Message</h3>
              </div>
              <div className="bg-white rounded-xl p-4 text-sm text-slate-700">
                "Hey! I noticed you're in real estate. Our company's premium wellness products are
                perfect for high-performers like you. Top agents are earning ₱50K-₱200K monthly.
                Want the exact blueprint?"
              </div>
              <p className="text-xs text-green-700 mt-3 font-medium">
                Personalized, specific, high conversion
              </p>
            </div>
          </div>

          {userTier !== 'elite' && (
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-6 border-2 border-amber-200 mb-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Sparkles className="size-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-amber-900 text-lg mb-2">
                    {userTier === 'free'
                      ? 'Pro unlocks 3× onboarding rewards'
                      : 'Elite unlocks 10× onboarding rewards'}
                  </h3>
                  <p className="text-amber-800 mb-3">
                    {userTier === 'free'
                      ? 'Upgrade to Pro and earn 330 coins instead of 90 coins for the same setup!'
                      : 'Upgrade to Elite and earn 925 coins instead of 330 coins for the same setup!'}
                  </p>
                  <button className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-2 rounded-xl font-semibold text-sm hover:from-amber-600 hover:to-orange-600 transition-all">
                    View Upgrade Options →
                  </button>
                </div>
              </div>
            </div>
          )}

          {userTier === 'elite' && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border-2 border-blue-200 mb-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Sparkles className="size-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-blue-900 text-lg mb-2">
                    🔵 VIP Fast-Learn Mode Activated
                  </h3>
                  <p className="text-blue-800">
                    As an Elite member, your AI gets priority processing and deep personalization.
                    You'll earn up to 925 coins for completing this setup!
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={onNext}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-2xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
          >
            <Sparkles className="size-6" />
            <span>Train My Company AI Brain</span>
            <ArrowRight className="size-6" />
          </button>

          {onSkip && (
            <button
              onClick={onSkip}
              className="w-full mt-4 text-slate-600 hover:text-slate-900 py-3 font-medium transition-colors"
            >
              I'll use generic defaults (not recommended)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
