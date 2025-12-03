import { useState, useEffect } from 'react';
import { ArrowLeft, Check, ChevronDown, Shield, HelpCircle, Sparkles, Zap, Users, Crown, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface SubscriptionPageProps {
  onNavigateBack: () => void;
  onSelectPlan?: (tier: string, billingCycle: 'monthly' | 'annual') => void;
  onNavigate?: (page: string) => void;
}

interface PlanData {
  tier: string;
  name: string;
  display_name: string;
  description: string;
  badge: string | null;
  price_monthly: number;
  price_annual: number;
  features: string[];
  topFeatures: string[];
  fullFeatures: string[];
  icon: any;
  color: string;
  buttonColor: string;
}

export default function SubscriptionPage({ onNavigateBack, onSelectPlan, onNavigate }: SubscriptionPageProps) {
  const { profile } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [dbPlans, setDbPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const { data } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true });

      if (data) {
        setDbPlans(data);
      }
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const plans: PlanData[] = [
    {
      tier: 'starter',
      name: 'Starter',
      display_name: 'Starter',
      description: 'Free forever - Perfect for getting started',
      badge: null,
      price_monthly: 0,
      price_annual: 0,
      features: [],
      topFeatures: [
        'Find 3 new prospects every day',
        'AI writes 3 personalized messages daily',
        'Create 1 sales presentation per week',
        'AI chatbot on your website',
        'Basic insights about your prospects'
      ],
      fullFeatures: [
        'Learn what your prospects need',
        'Track prospects through 3 sales stages',
        'Simple reminders for follow-ups',
        'Earn 5 bonus coins daily',
        'Get extra coins by watching ads',
        'Earn 30 coins for uploading company info',
        'Get 20 coins for each friend you refer'
      ],
      icon: Sparkles,
      color: 'from-gray-400 to-gray-600',
      buttonColor: 'bg-gray-600 hover:bg-gray-700'
    },
    {
      tier: 'pro',
      name: 'Pro – Professional Closer',
      display_name: 'Pro – Professional Closer',
      description: 'For serious sellers who want unlimited power',
      badge: 'Most Popular',
      price_monthly: 1299,
      price_annual: 12990,
      features: [],
      topFeatures: [
        'Find unlimited prospects - never run out',
        'AI writes unlimited personalized messages',
        'Create unlimited sales presentations',
        'Deep research on every prospect',
        'AI chatbot answers on Website, Facebook & Instagram'
      ],
      fullFeatures: [
        'AI learns everything about your prospects company',
        'AI automatically follows up for 7 days',
        'AI asks qualifying questions for you',
        'Track deals through 6 complete sales stages',
        'AI schedules appointments automatically',
        'See which messages work best',
        'Get 150 bonus coins every week',
        'Higher daily AI usage limit',
        'AI recharges automatically',
        'Cheaper refills when you need more'
      ],
      icon: Zap,
      color: 'from-[#1877F2] to-blue-600',
      buttonColor: 'bg-[#1877F2] hover:bg-blue-600'
    },
    {
      tier: 'team',
      name: 'Team Leader Plan',
      display_name: 'Team Leader Plan',
      description: 'Build and manage your sales team',
      badge: null,
      price_monthly: 4990,
      price_annual: 49900,
      features: [],
      topFeatures: [
        'See how your whole team performs',
        'Track which team members close the most',
        'Share sales scripts and presentations',
        'AI chatbot helps you recruit new members',
        'AI trains your team on best practices'
      ],
      fullFeatures: [
        'Entire team shares prospect knowledge',
        'Store all your winning scripts in one place',
        'See who is most active and successful',
        'Team shares AI usage allowance',
        'Get 1,000 bonus coins weekly for the team',
        'Includes 5 team member accounts',
        'Add more members for ₱999 each per month'
      ],
      icon: Users,
      color: 'from-green-500 to-emerald-600',
      buttonColor: 'bg-green-600 hover:bg-green-700'
    },
    {
      tier: 'enterprise',
      name: 'Enterprise',
      display_name: 'Enterprise',
      description: 'For large companies and organizations',
      badge: null,
      price_monthly: 30000,
      price_annual: 300000,
      features: [],
      topFeatures: [
        'Unlimited team members can use the system',
        'Track performance across your whole company',
        'AI automatically assigns leads to the right person',
        'Works for multiple locations or countries',
        'Connects with your existing business tools'
      ],
      fullFeatures: [
        'Get dedicated support from our team',
        'Custom AI setup for your specific needs',
        'Put your company branding on everything',
        'Connect to your other business systems',
        'Get help first when you need it',
        'We train your team how to use everything',
        'Regular meetings to review your results'
      ],
      icon: Star,
      color: 'from-amber-500 to-orange-600',
      buttonColor: 'bg-amber-600 hover:bg-amber-700'
    }
  ];

  const handleSelectPlan = (tier: string) => {
    if (tier === 'enterprise' || tier === 'team') {
      onNavigate?.('support');
    } else {
      onSelectPlan?.(tier, billingCycle);
    }
  };

  const getPrice = (plan: PlanData) => {
    return billingCycle === 'monthly' ? plan.price_monthly : plan.price_annual / 12;
  };

  const getSavings = (plan: PlanData) => {
    if (billingCycle === 'annual' && plan.price_monthly > 0) {
      const monthlyCost = plan.price_monthly * 12;
      const savings = monthlyCost - plan.price_annual;
      return savings;
    }
    return 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={onNavigateBack}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
          <h1 className="text-xl font-bold text-gray-900">Choose Your Plan</h1>
          <div className="w-20"></div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
            Monthly
          </span>
          <button
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
            className={`relative w-14 h-8 rounded-full transition-colors ${
              billingCycle === 'annual' ? 'bg-[#1877F2]' : 'bg-gray-300'
            }`}
          >
            <div
              className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${billingCycle === 'annual' ? 'text-gray-900' : 'text-gray-500'}`}>
            Annual
          </span>
          {billingCycle === 'annual' && (
            <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
              Save 20%
            </span>
          )}
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = profile?.subscription_tier === plan.tier;
            const isExpanded = expandedPlan === plan.tier;
            const price = getPrice(plan);
            const savings = getSavings(plan);

            return (
              <div
                key={plan.tier}
                className={`bg-white rounded-3xl border-2 shadow-lg transition-all ${
                  plan.badge ? 'border-[#1877F2] ring-4 ring-blue-100' : 'border-gray-200'
                } ${plan.tier === 'enterprise' ? 'lg:col-span-2' : ''}`}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{plan.display_name}</h3>
                        <p className="text-sm text-gray-600">{plan.description}</p>
                      </div>
                    </div>
                    {plan.badge && (
                      <span className="px-3 py-1 bg-[#1877F2] text-white text-xs font-bold rounded-full">
                        {plan.badge}
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-gray-900">₱{price.toLocaleString()}</span>
                      <span className="text-gray-600">/month</span>
                    </div>
                    {savings > 0 && (
                      <p className="text-sm text-green-600 font-medium mt-1">
                        Save ₱{savings.toLocaleString()} per year
                      </p>
                    )}
                    {billingCycle === 'annual' && plan.price_annual > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Billed annually: ₱{plan.price_annual.toLocaleString()}
                      </p>
                    )}
                  </div>

                  {/* Top Features - Always Visible */}
                  <div className="space-y-3 mb-4">
                    {plan.topFeatures.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-[#1877F2] flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Shimmer / Accordion */}
                  {!isExpanded && plan.fullFeatures.length > 0 && (
                    <div className="relative mb-4">
                      <div className="h-24 overflow-hidden rounded-xl bg-gradient-to-b from-gray-100 to-gray-200 relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse"></div>
                        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center">
                          <button
                            onClick={() => setExpandedPlan(plan.tier)}
                            className="flex items-center gap-2 px-4 py-2 bg-white/90 rounded-full shadow-lg border border-gray-200 hover:bg-white transition-all"
                          >
                            <span className="text-sm font-semibold text-gray-700">View Full Benefits</span>
                            <ChevronDown className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Expanded Features */}
                  {isExpanded && (
                    <div className="mb-4 space-y-2 animate-fadeIn">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-bold text-gray-900">All Features</h4>
                        <button
                          onClick={() => setExpandedPlan(null)}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Hide
                        </button>
                      </div>
                      {plan.fullFeatures.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                          <span className="text-xs text-gray-600">{feature}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* CTA Button */}
                  <button
                    onClick={() => handleSelectPlan(plan.tier)}
                    disabled={isCurrentPlan}
                    className={`w-full py-3 rounded-2xl font-semibold text-white transition-all ${
                      isCurrentPlan
                        ? 'bg-gray-300 cursor-not-allowed'
                        : plan.buttonColor
                    } ${!isCurrentPlan && 'shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'}`}
                  >
                    {isCurrentPlan
                      ? 'Current Plan'
                      : plan.tier === 'enterprise' || plan.tier === 'team'
                      ? 'Contact Sales'
                      : plan.tier === 'starter'
                      ? 'Start Free'
                      : `Get ${plan.name}`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Money-Back Guarantee */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl shadow-lg border-2 border-green-200 p-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-900 mb-2">7-Day Money-Back Guarantee</h3>
              <p className="text-sm text-gray-700 mb-3">
                Try any paid plan risk-free. If you're not completely satisfied within the first 7 days, we'll refund your payment in full—no questions asked.
              </p>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Full refund within 7 days</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">No questions asked policy</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Cancel anytime before renewal</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-bold text-lg text-gray-900">Frequently Asked Questions</h3>
          </div>

          <div className="space-y-3">
            {[
              {
                question: 'Can I change my plan later?',
                answer: 'Yes! You can upgrade or downgrade your plan at any time. When upgrading, you\'ll have immediate access to new features. When downgrading, changes take effect at the end of your current billing cycle, and you\'ll keep your current features until then.'
              },
              {
                question: 'What payment methods do you accept?',
                answer: 'We accept all major credit and debit cards (Visa, Mastercard, American Express), PayPal, GCash, and Maya. All payments are processed securely through our encrypted payment gateway.'
              },
              {
                question: 'How does billing work for annual plans?',
                answer: 'Annual plans are billed once per year at a 20% discount compared to monthly billing. You\'ll receive the full year of service immediately and your subscription will automatically renew after 12 months unless cancelled.'
              },
              {
                question: 'What happens to my coins if I cancel?',
                answer: 'Your purchased coins remain in your account even after cancellation. However, bonus coins from your subscription plan expire when your subscription ends. You can still use remaining coins to access features on the Free plan.'
              },
              {
                question: 'Can I get a refund after 7 days?',
                answer: 'Our 7-day money-back guarantee covers the first week only. After 7 days, subscriptions are non-refundable, but you can cancel anytime to prevent future charges. Your access continues until the end of your paid period.'
              },
              {
                question: 'Do unused features roll over?',
                answer: 'No, plan features like AI scans and messages reset each billing cycle and don\'t roll over. However, purchased coins never expire and can be used at any time, even across different subscription tiers.'
              },
              {
                question: 'Is there a contract or commitment?',
                answer: 'No contracts required! All our plans are month-to-month or annual, and you can cancel anytime. There are no hidden fees, setup costs, or cancellation penalties. Your subscription simply won\'t renew after you cancel.'
              },
              {
                question: 'What happens when I upgrade mid-cycle?',
                answer: 'When you upgrade, you\'ll receive prorated credit for your current plan and only pay the difference. Your new features activate immediately, and your billing date adjusts to reflect the change.'
              }
            ].map((faq, idx) => (
              <div
                key={idx}
                className="border border-gray-200 rounded-2xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="font-semibold text-sm text-gray-900 pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-600 flex-shrink-0 transition-transform ${
                      openFaqIndex === idx ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaqIndex === idx && (
                  <div className="px-5 pb-4 pt-1">
                    <p className="text-sm text-gray-700 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600 mb-3">Still have questions?</p>
            <button
              onClick={() => onNavigate?.('support')}
              className="w-full py-3 px-4 bg-[#1877F2] text-white rounded-2xl font-semibold text-sm hover:bg-blue-600 transition-colors shadow-lg"
            >
              Contact Support
            </button>
          </div>
        </div>

        {/* Manage Subscription Link */}
        {profile?.subscription_tier && profile.subscription_tier !== 'starter' && (
          <div className="text-center pb-4">
            <button
              onClick={() => onNavigate?.('manage-subscription')}
              className="text-[#1877F2] font-semibold text-sm hover:text-blue-600 transition-colors underline"
            >
              Manage your plan and billing
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
