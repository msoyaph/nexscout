import { useState } from 'react';
import { Brain, TrendingUp, Users, Target, ArrowRight } from 'lucide-react';

interface CompanyBehaviorScanProps {
  onComplete: (data: BehaviorData) => void;
  onSkip?: () => void;
}

interface BehaviorData {
  businessType: string;
  teamSize: string;
  weeklyContacts: string;
  useCompanyVoice: boolean;
}

export default function CompanyBehaviorScan({ onComplete, onSkip }: CompanyBehaviorScanProps) {
  const [businessType, setBusinessType] = useState('');
  const [teamSize, setTeamSize] = useState('');
  const [weeklyContacts, setWeeklyContacts] = useState('');
  const [useCompanyVoice, setUseCompanyVoice] = useState(true);

  const handleContinue = () => {
    onComplete({
      businessType,
      teamSize,
      weeklyContacts,
      useCompanyVoice,
    });
  };

  const canContinue = businessType && teamSize && weeklyContacts;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="mb-8">
          <div className="w-full bg-slate-200 rounded-full h-3 mb-6">
            <div
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-500"
              style={{ width: '5%' }}
            />
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl mb-6 shadow-2xl animate-pulse">
              <Brain className="size-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              You're seconds away from unlocking your personalized AI sales engine
            </h1>
            <p className="text-lg text-slate-600">
              Quick questions to customize your experience
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-8 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-3">
              Are you selling a product, service, or opportunity?
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['Product', 'Service', 'Opportunity'].map((type) => (
                <button
                  key={type}
                  onClick={() => setBusinessType(type.toLowerCase())}
                  className={`p-4 rounded-2xl border-2 font-medium transition-all ${
                    businessType === type.toLowerCase()
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-3">
              Do you work solo or with a team?
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Solo', icon: Target },
                { label: 'Small Team', icon: Users },
                { label: 'Large Team', icon: TrendingUp },
              ].map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  onClick={() => setTeamSize(label.toLowerCase())}
                  className={`p-4 rounded-2xl border-2 font-medium transition-all flex flex-col items-center gap-2 ${
                    teamSize === label.toLowerCase()
                      ? 'border-purple-600 bg-purple-50 text-purple-700'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <Icon className="size-5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-3">
              How many prospects do you contact per week?
            </label>
            <div className="grid grid-cols-2 gap-3">
              {['1-10', '11-50', '51-100', '100+'].map((range) => (
                <button
                  key={range}
                  onClick={() => setWeeklyContacts(range)}
                  className={`p-4 rounded-2xl border-2 font-medium transition-all ${
                    weeklyContacts === range
                      ? 'border-green-600 bg-green-50 text-green-700'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-6 border-2 border-amber-200">
            <label className="flex items-start gap-4 cursor-pointer">
              <input
                type="checkbox"
                checked={useCompanyVoice}
                onChange={(e) => setUseCompanyVoice(e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-amber-400 text-amber-600 focus:ring-amber-500"
              />
              <div className="flex-1">
                <p className="font-semibold text-amber-900 mb-1">
                  I want AI to talk like my company
                </p>
                <p className="text-sm text-amber-800">
                  Recommended! AI will learn your company's tone, style, and messaging to create
                  branded content that sounds exactly like you.
                </p>
              </div>
            </label>
          </div>

          <button
            onClick={handleContinue}
            disabled={!canContinue}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-2xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <span>Continue to Setup</span>
            <ArrowRight className="size-5" />
          </button>

          {onSkip && (
            <button
              onClick={onSkip}
              className="w-full text-slate-600 hover:text-slate-900 py-3 font-medium transition-colors"
            >
              Skip for now
            </button>
          )}
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          This helps us personalize your AI experience
        </p>
      </div>
    </div>
  );
}
