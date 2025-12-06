import { useState } from 'react';
import { ArrowLeft, Check, Crown, Zap, Users, Sparkles, Calendar, RefreshCw, CheckCircle } from 'lucide-react';
import { TIER_PRICING, SUBSCRIPTION_TIERS } from '../lib/subscriptionTiers';
import { useAuth } from '../contexts/AuthContext';

interface PricingPageProps {
  onNavigateBack: () => void;
  onSelectPlan: (tier: string, billingCycle: 'monthly' | 'annual') => void;
}

export default function PricingPage({ onNavigateBack, onSelectPlan }: PricingPageProps) {
  const { profile } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const currentTier = profile?.subscription_tier || SUBSCRIPTION_TIERS.FREE;

  const plans = [
    {
      tier: SUBSCRIPTION_TIERS.PRO,
      name: 'Pro',
      description: 'Full AI power for professionals',
      icon: Crown,
      features: [
        'Unlimited AI Scans',
        'Unlimited AI Messages',
        'Unlimited AI Presentations',
        '+500 Weekly Coins',
        'No Ads',
        'AI DeepScan Analysis',
        'AI Affordability Score',
        'AI Leadership Potential',
        'Multi-Step Sequences (4-7 steps)',
        'Advanced AI templates',
        'ALL cards unlocked',
        'Personalized AI insights',
        'Lead Timeline & Affinity',
        'Full 8-stage pipeline',
        'Priority AI queue',
        'Early access features'
      ],
      highlighted: true,
      color: 'purple'
    },
    {
      tier: SUBSCRIPTION_TIERS.TEAM,
      name: 'Team',
      description: 'For teams & leaders',
      icon: Users,
      features: [
        '5 Pro seats included',
        'Shared Team Dashboard',
        'Shared Pipeline',
        'Team Missions',
        'Leaderboard',
        'Team Coaching AI',
        'Training deck generator',
        'Performance analytics',
        'Activity breakdown',
        'Perfect for MLM/Insurance/RE teams'
      ],
      highlighted: false,
      color: 'green'
    },
    {
      tier: SUBSCRIPTION_TIERS.FREE,
      name: 'Free',
      description: 'Get started with basics',
      icon: Sparkles,
      features: [
        '3 AI Prospect Scans/day',
        '3 AI Messages/day',
        '1 AI Presentation/week',
        '+35 Weekly Coins',
        'Watch ads for bonus coins',
        'Basic 3-stage pipeline',
        '1 visible prospect card'
      ],
      highlighted: false,
      color: 'slate'
    }
  ];

  const getButtonStyle = (tier: string, highlighted: boolean) => {
    const isCurrentPlan = currentTier === tier;

    if (isCurrentPlan) {
      return 'bg-slate-200 text-slate-500 cursor-not-allowed';
    }

    if (highlighted) {
      return 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl';
    }

    return 'bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50';
  };

  const getCardStyle = (tier: string, highlighted: boolean) => {
    if (highlighted) {
      return 'border-2 border-purple-600 shadow-2xl relative overflow-hidden';
    }

    return 'border border-slate-200';
  };

  return (
    <div className="bg-[#F3F4F6] min-h-screen text-[#111827] pb-28">
      <header className="px-6 pt-8 pb-6 bg-white shadow-[0px_8px_24px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-[#111827] tracking-tight">
              Choose Your Plan
            </h1>
            <p className="text-sm text-[#6B7280] mt-1">
              Unlock powerful AI features for your business
            </p>
          </div>
          <button
            onClick={onNavigateBack}
            className="size-10 rounded-full bg-white flex items-center justify-center shadow-[0px_8px_24px_rgba(0,0,0,0.08)] border border-[#E5E7EB]"
          >
            <ArrowLeft className="size-5 text-[#111827]" />
          </button>
        </div>

        <div className="flex items-center gap-2 bg-white rounded-full p-1 border border-[#E5E7EB] shadow-[0px_4px_12px_rgba(0,0,0,0.04)]">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`flex-1 px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
              billingCycle === 'monthly'
                ? 'bg-[#2563EB] text-white'
                : 'text-[#6B7280]'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`flex-1 px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
              billingCycle === 'annual'
                ? 'bg-[#2563EB] text-white'
                : 'text-[#6B7280]'
            }`}
          >
            Annual
            <span className="ml-1 text-[10px] font-bold text-green-600">Save 20%</span>
          </button>
        </div>
      </header>

      <main className="px-6 space-y-4 mt-6">
        {currentTier !== SUBSCRIPTION_TIERS.FREE && (
          <div className="bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] rounded-[24px] shadow-[0px_4px_16px_rgba(37,99,235,0.08)] border border-[#BFDBFE] p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-bold text-base text-[#111827]">Current Plan</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold text-white ${
                    currentTier === SUBSCRIPTION_TIERS.PRO
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                      : currentTier === SUBSCRIPTION_TIERS.TEAM
                      ? 'bg-green-600'
                      : 'bg-slate-600'
                  }`}>
                    {currentTier === SUBSCRIPTION_TIERS.PRO && '👑 '}
                    {TIER_PRICING[currentTier]?.displayName || 'Free'}
                  </span>
                </div>
                <p className="text-sm text-[#6B7280] mb-3">
                  You're on the {TIER_PRICING[currentTier]?.displayName || 'Free'} plan
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-[#2563EB]" />
                    <span className="text-xs text-[#6B7280]">
                      <span className="font-semibold text-[#111827]">Billing:</span> Monthly
                    </span>
                  </div>
                  {profile?.subscription_end_date && (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="size-4 text-[#2563EB]" />
                      <span className="text-xs text-[#6B7280]">
                        <span className="font-semibold text-[#111827]">Renews:</span>{' '}
                        {new Date(profile.subscription_end_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <CheckCircle className="size-4 text-[#22C55E]" />
                    <span className="text-xs text-[#22C55E] font-semibold">Active & Up to Date</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {plans.map((plan) => {
          const pricing = TIER_PRICING[plan.tier];
          const price = billingCycle === 'monthly' ? pricing.monthly : pricing.annual / 12;
          const isCurrentPlan = currentTier === plan.tier;
          const Icon = plan.icon;

          return (
            <div
              key={plan.tier}
              className={`bg-white rounded-[30px] shadow-lg overflow-hidden ${getCardStyle(plan.tier, plan.highlighted)}`}
            >
              {plan.highlighted && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 animate-pulse" />
              )}

              {plan.highlighted && (
                <div className="absolute top-4 right-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                  Most Popular
                </div>
              )}

              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`size-12 rounded-[16px] flex items-center justify-center ${
                      plan.tier === SUBSCRIPTION_TIERS.PRO
                        ? 'bg-gradient-to-br from-purple-100 to-pink-100'
                        : plan.tier === SUBSCRIPTION_TIERS.TEAM
                        ? 'bg-green-100'
                        : 'bg-slate-100'
                    }`}>
                      <Icon className={`size-6 ${
                        plan.tier === SUBSCRIPTION_TIERS.PRO
                          ? 'text-purple-600'
                          : plan.tier === SUBSCRIPTION_TIERS.TEAM
                          ? 'text-green-600'
                          : 'text-slate-600'
                      }`} />
                    </div>
                    <div>
                      <h2 className="font-bold text-xl text-[#111827]">
                        {plan.name}
                      </h2>
                      <p className="text-sm text-[#6B7280]">{plan.description}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-bold text-[#111827]">
                    {pricing.currency}{Math.floor(price)}
                  </span>
                  <span className="text-[#6B7280] text-sm">/month</span>
                </div>

                {billingCycle === 'annual' && plan.tier !== SUBSCRIPTION_TIERS.FREE && (
                  <p className="text-xs text-[#6B7280] mb-4">
                    Billed {pricing.currency}{pricing.annual} annually
                  </p>
                )}

                {pricing.weeklyCoins > 0 && (
                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-[16px] p-3 mb-4 border border-amber-200">
                    <p className="text-xs font-semibold text-amber-900">
                      🎁 +{pricing.weeklyCoins} bonus coins per week
                    </p>
                  </div>
                )}

                <button
                  onClick={() => {
                    if (!isCurrentPlan && plan.tier !== SUBSCRIPTION_TIERS.TEAM) {
                      onSelectPlan(plan.tier, billingCycle);
                    }
                  }}
                  disabled={isCurrentPlan || plan.tier === SUBSCRIPTION_TIERS.TEAM}
                  className={`w-full py-3 px-4 rounded-[20px] font-semibold text-sm transition-all mb-6 ${getButtonStyle(plan.tier, plan.highlighted)}`}
                >
                  {isCurrentPlan ? 'Current Plan' : plan.tier === SUBSCRIPTION_TIERS.TEAM ? 'Contact Sales' : 'Get Started'}
                </button>

                <div className="space-y-3 pt-6 border-t border-slate-100">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <Check className={`size-5 shrink-0 mt-0.5 ${
                        plan.tier === SUBSCRIPTION_TIERS.PRO
                          ? 'text-purple-600'
                          : plan.tier === SUBSCRIPTION_TIERS.TEAM
                          ? 'text-green-600'
                          : 'text-slate-600'
                      }`} />
                      <span className="text-sm text-[#6B7280]">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}

        <div className="bg-blue-50 rounded-[24px] p-6 border border-blue-200">
          <h3 className="font-bold text-lg text-[#111827] mb-3">Why upgrade?</h3>
          <div className="space-y-2 text-sm text-slate-700">
            <p>✨ Unlock unlimited AI-powered insights</p>
            <p>🎯 Close deals faster with advanced scoring</p>
            <p>💰 Earn more coins to unlock premium features</p>
            <p>🚀 Get priority support and early access</p>
          </div>
        </div>
      </main>
    </div>
  );
}
