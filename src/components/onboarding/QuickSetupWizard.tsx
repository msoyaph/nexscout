/**
 * Quick Setup Wizard - 3-Question Magic Onboarding
 *
 * Gets users to value in under 90 seconds
 * - Industry selection
 * - Company identification
 * - Channel preferences
 */

import { useState } from 'react';
import {
  Building2,
  ShoppingBag,
  Home,
  Briefcase,
  GraduationCap,
  Users,
  Facebook,
  MessageCircle,
  Globe,
  Instagram,
  MessageSquare,
  Smartphone,
  Loader,
  Sparkles,
  CheckCircle,
} from 'lucide-react';
import { fetchAdminSuggestions } from '../../services/onboarding/dataFeederEngine';

interface QuickSetupWizardProps {
  onComplete: (data: QuickSetupData) => void;
  userId: string;
}

export interface QuickSetupData {
  industry: string;
  companyInput: string;
  companyMatch: any | null;
  channels: string[];
}

const industries = [
  { value: 'mlm', label: 'MLM / Network Marketing', icon: Users, color: 'from-purple-500 to-pink-500', examples: 'AIM Global, Frontrow' },
  { value: 'insurance', label: 'Insurance', icon: Briefcase, color: 'from-blue-500 to-cyan-500', examples: 'Pru Life, Sun Life' },
  { value: 'real_estate', label: 'Real Estate', icon: Home, color: 'from-green-500 to-emerald-500', examples: 'Ayala Land, Vista Land' },
  { value: 'online_seller', label: 'Online Seller', icon: ShoppingBag, color: 'from-orange-500 to-red-500', examples: 'Shopee, Lazada' },
  { value: 'coaching', label: 'Coaching / Consulting', icon: GraduationCap, color: 'from-indigo-500 to-purple-500', examples: 'Life Coach, Business Consultant' },
  { value: 'service', label: 'Service Provider', icon: Building2, color: 'from-teal-500 to-green-500', examples: 'Virtual Assistant, Freelancer' },
];

const channels = [
  { value: 'facebook_page', label: 'Facebook Page', icon: Facebook, color: 'bg-blue-600' },
  { value: 'messenger', label: 'Messenger', icon: MessageCircle, color: 'bg-blue-500' },
  { value: 'website', label: 'Website', icon: Globe, color: 'bg-gray-700' },
  { value: 'instagram', label: 'Instagram', icon: Instagram, color: 'bg-pink-600' },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, color: 'bg-green-600' },
  { value: 'sms', label: 'SMS', icon: Smartphone, color: 'bg-purple-600' },
];

export default function QuickSetupWizard({ onComplete, userId }: QuickSetupWizardProps) {
  const [step, setStep] = useState(1);
  const [industry, setIndustry] = useState('');
  const [companyInput, setCompanyInput] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);

  const handleIndustrySelect = (value: string) => {
    setIndustry(value);
    setStep(2);
  };

  const handleCompanySearch = async (input: string) => {
    setCompanyInput(input);

    if (input.length > 2) {
      setSearching(true);
      const results = await fetchAdminSuggestions(input, industry);
      setSuggestions(results);
      setSearching(false);
    } else {
      setSuggestions([]);
    }
  };

  const handleCompanySelect = (company: any) => {
    setSelectedCompany(company);
    setCompanyInput(company.name);
    setSuggestions([]);
    setStep(3);
  };

  const handleManualCompany = () => {
    setSelectedCompany(null);
    setStep(3);
  };

  const handleChannelToggle = (value: string) => {
    setSelectedChannels((prev) =>
      prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value]
    );
  };

  const handleComplete = () => {
    onComplete({
      industry,
      companyInput,
      companyMatch: selectedCompany,
      channels: selectedChannels,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-600">Step {step} of 3</span>
            <span className="text-sm font-semibold text-blue-600">{Math.round((step / 3) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Question 1: Industry */}
        {step === 1 && (
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 animate-fade-in">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Welcome to NexScout!
              </h1>
              <p className="text-lg text-gray-600">Let's get you set up in under 90 seconds</p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">What industry are you in?</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {industries.map((ind) => {
                const Icon = ind.icon;
                return (
                  <button
                    key={ind.value}
                    onClick={() => handleIndustrySelect(ind.value)}
                    className="group relative overflow-hidden rounded-2xl p-6 text-left transition-all hover:scale-105 hover:shadow-xl bg-white border-2 border-gray-200 hover:border-transparent"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${ind.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                    <div className="relative flex items-start gap-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${ind.color}`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-1">{ind.label}</h3>
                        <p className="text-sm text-gray-500">{ind.examples}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Question 2: Company */}
        {step === 2 && (
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 animate-fade-in">
            <button
              onClick={() => setStep(1)}
              className="text-sm text-gray-500 hover:text-gray-700 mb-6"
            >
              ← Back
            </button>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              What company or product do you represent?
            </h2>
            <p className="text-gray-600 mb-6">Type the name and we'll find it for you</p>

            <div className="relative mb-6">
              <input
                type="text"
                value={companyInput}
                onChange={(e) => handleCompanySearch(e.target.value)}
                placeholder="e.g., AIM Global, Pru Life, Ayala Land..."
                className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                autoFocus
              />
              {searching && (
                <Loader className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500 animate-spin" />
              )}
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="mb-6 space-y-3">
                <p className="text-sm font-semibold text-gray-700 mb-3">
                  ✨ We found these matches:
                </p>
                {suggestions.slice(0, 3).map((suggestion) => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleCompanySelect(suggestion)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                  >
                    {suggestion.logo_url ? (
                      <img
                        src={suggestion.logo_url}
                        alt={suggestion.name}
                        className="w-12 h-12 rounded-lg object-cover bg-gray-100"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                          {suggestion.name}
                        </h3>
                        {suggestion.match_score > 80 && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                            Great Match
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {suggestion.industry} · {suggestion.products_count} products
                      </p>
                    </div>
                    <CheckCircle className="w-5 h-5 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            )}

            {companyInput.length > 2 && (
              <button
                onClick={handleManualCompany}
                className="w-full py-4 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-2xl transition-colors"
              >
                Continue with "{companyInput}"
              </button>
            )}
          </div>
        )}

        {/* Question 3: Channels */}
        {step === 3 && (
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 animate-fade-in">
            <button
              onClick={() => setStep(2)}
              className="text-sm text-gray-500 hover:text-gray-700 mb-6"
            >
              ← Back
            </button>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Where do your customers reach you?
            </h2>
            <p className="text-gray-600 mb-6">Select all that apply</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {channels.map((channel) => {
                const Icon = channel.icon;
                const isSelected = selectedChannels.includes(channel.value);

                return (
                  <button
                    key={channel.value}
                    onClick={() => handleChannelToggle(channel.value)}
                    className={`relative overflow-hidden rounded-2xl p-6 transition-all hover:scale-105 ${
                      isSelected
                        ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-2 border-gray-200'
                    }`}
                  >
                    {isSelected && (
                      <CheckCircle className="absolute top-2 right-2 w-5 h-5" />
                    )}
                    <Icon className={`w-8 h-8 mb-3 ${isSelected ? '' : 'opacity-70'}`} />
                    <div className="text-sm font-semibold">{channel.label}</div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleComplete}
              disabled={selectedChannels.length === 0}
              className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Complete Setup
            </button>

            {selectedChannels.length === 0 && (
              <p className="text-center text-sm text-gray-500 mt-4">
                Select at least one channel to continue
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
