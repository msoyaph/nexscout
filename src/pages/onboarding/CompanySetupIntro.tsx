import { Sparkles, TrendingUp, Target, Shield, Users, Gift } from 'lucide-react';

interface CompanySetupIntroProps {
  onNext: () => void;
  onSkip?: () => void;
}

export default function CompanySetupIntro({ onNext, onSkip }: CompanySetupIntroProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl mb-6 shadow-lg">
            <Sparkles className="size-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Let's Train Your AI to Sell YOUR Company Better
          </h1>
          <p className="text-xl text-slate-600 leading-relaxed">
            The more information you upload, the smarter NexScout becomes.{' '}
            <span className="font-semibold text-blue-600">
              Teams that upload their company materials close 5× more deals.
            </span>
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 mb-6">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full" style={{ width: '25%' }} />
              </div>
              <span className="text-sm font-semibold text-slate-600 whitespace-nowrap">Step 1/4</span>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-6">What You'll Get:</h2>

          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Target className="size-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Tailored AI Pitch Decks</h3>
                <p className="text-slate-600">Custom decks using YOUR products, YOUR brand, YOUR story</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <TrendingUp className="size-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Personalized Message Sequences</h3>
                <p className="text-slate-600">AI writes in your company's tone and style automatically</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Shield className="size-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Company-Compliant Objections</h3>
                <p className="text-slate-600">Handle objections using your company's approved rebuttals</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Users className="size-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Automatic Team Playbooks</h3>
                <p className="text-slate-600">AI generates complete sales playbooks for your entire team</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-6 border-2 border-amber-200 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Gift className="size-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-amber-900 mb-2">Bonus Reward!</h3>
                <p className="text-amber-800">
                  Upload company materials today and get{' '}
                  <span className="font-bold text-xl">+100 coins!</span>
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={onNext}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-2xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
          >
            Start Building My AI Company Brain →
          </button>

          {onSkip && (
            <button
              onClick={onSkip}
              className="w-full mt-4 text-slate-600 hover:text-slate-900 py-3 font-medium transition-colors"
            >
              I'll do this later
            </button>
          )}
        </div>

        <p className="text-center text-sm text-slate-500">
          This is your <span className="font-semibold">MOST IMPORTANT</span> first step to success on NexScout
        </p>
      </div>
    </div>
  );
}
