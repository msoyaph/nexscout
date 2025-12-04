/**
 * Team Data Feeder Dashboard
 *
 * Allows team leaders to add team-specific templates
 * that override enterprise defaults for their team only
 */

import { useState } from 'react';
import { Package, Users, Sparkles, Plus, TrendingUp } from 'lucide-react';

const tabs = [
  { id: 'products', icon: Package, label: 'Team Products' },
  { id: 'offerings', icon: Users, label: 'Team Offerings' },
  { id: 'preview', icon: Sparkles, label: 'Preview' },
];

export default function TeamDataFeederPage() {
  const [activeTab, setActiveTab] = useState('products');

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b bg-white shadow-sm">
        <div className="px-4 py-4 md:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Team Data Feeder</h1>
              <p className="text-sm text-gray-500">
                Customize templates for your team
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-green-50 rounded-xl border-2 border-green-200">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm font-semibold text-green-900">
                Team: Top Performers
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b px-4 py-3 md:px-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 md:px-6 max-w-7xl mx-auto">
        {activeTab === 'products' && <TeamProductsView />}
        {activeTab === 'offerings' && <TeamOfferingsView />}
        {activeTab === 'preview' && <TeamOnboardingPreview />}
      </div>
    </div>
  );
}

/**
 * Team Products View
 */
function TeamProductsView() {
  return (
    <div className="space-y-4">
      {/* Info Card */}
      <div className="p-4 bg-green-50 rounded-2xl border-2 border-green-200">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-green-900 mb-1">Team-Specific Templates</h3>
            <p className="text-sm text-green-700">
              Products added here will appear first in onboarding for your team members.
              They override enterprise defaults but can still be customized by each agent.
            </p>
          </div>
        </div>
      </div>

      {/* Priority Explanation */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6">
        <h3 className="font-bold text-gray-900 mb-4">Data Priority Levels</h3>
        <div className="space-y-3">
          <PriorityLevel
            level={1}
            label="Team Templates"
            description="Shown first (highest priority)"
            color="green"
          />
          <PriorityLevel
            level={2}
            label="Enterprise Templates"
            description="If no team template exists"
            color="blue"
          />
          <PriorityLevel
            level={3}
            label="Global Templates"
            description="System-wide fallback"
            color="gray"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center">
        <button className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all">
          <Plus className="w-5 h-5" />
          Add Team Product
        </button>
      </div>

      {/* Products List (Example) */}
      <div className="grid gap-4 md:grid-cols-2">
        <TeamProductCard
          name="Premium Wellness Package"
          category="Health Supplement"
          teamMembers={12}
          source="team"
        />
        <TeamProductCard
          name="Elite Insurance Plan"
          category="Life Insurance"
          teamMembers={12}
          source="enterprise"
        />
      </div>
    </div>
  );
}

function PriorityLevel({
  level,
  label,
  description,
  color,
}: {
  level: number;
  label: string;
  description: string;
  color: 'green' | 'blue' | 'gray';
}) {
  const bgColor = {
    green: 'bg-green-50 border-green-200',
    blue: 'bg-blue-50 border-blue-200',
    gray: 'bg-gray-50 border-gray-200',
  }[color];

  const textColor = {
    green: 'text-green-900',
    blue: 'text-blue-900',
    gray: 'text-gray-900',
  }[color];

  const badgeColor = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    gray: 'bg-gray-500',
  }[color];

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border-2 ${bgColor}`}>
      <div className={`flex-shrink-0 w-8 h-8 ${badgeColor} rounded-lg flex items-center justify-center text-white font-bold`}>
        {level}
      </div>
      <div className="flex-1">
        <p className={`font-semibold ${textColor}`}>{label}</p>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
}

function TeamProductCard({
  name,
  category,
  teamMembers,
  source,
}: {
  name: string;
  category: string;
  teamMembers: number;
  source: 'team' | 'enterprise';
}) {
  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 p-5 hover:border-green-300 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-gray-900">{name}</h3>
            <span
              className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                source === 'team'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              {source === 'team' ? 'Team' : 'Enterprise'}
            </span>
          </div>
          <p className="text-sm text-gray-500">{category}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 text-sm">
        <Users className="w-4 h-4 text-green-600" />
        <span className="font-semibold text-gray-900">{teamMembers}</span>
        <span className="text-gray-500">team members using</span>
      </div>

      <div className="flex gap-2">
        <button className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors text-sm">
          Edit
        </button>
        <button className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors text-sm">
          View Details
        </button>
      </div>
    </div>
  );
}

function TeamOfferingsView() {
  return (
    <div className="p-8 bg-white rounded-2xl border-2 border-gray-200 text-center">
      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-bold text-gray-900 mb-2">Team Offerings</h3>
      <p className="text-sm text-gray-500 mb-4">
        Create special packages and bundles specific to your team's strategy
      </p>
      <button className="px-6 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white font-semibold rounded-xl">
        Add Offering
      </button>
    </div>
  );
}

function TeamOnboardingPreview() {
  return (
    <div className="space-y-4">
      <div className="p-6 bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl border-2 border-green-200">
        <div className="text-center mb-6">
          <Sparkles className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Onboarding Preview</h3>
          <p className="text-sm text-gray-600">
            See how team members will experience onboarding with your templates
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Search Results Priority:</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border-2 border-green-200">
                <div className="w-6 h-6 bg-green-500 rounded text-white text-xs font-bold flex items-center justify-center">
                  1
                </div>
                <span className="text-sm text-gray-700">Team templates appear first</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
                <div className="w-6 h-6 bg-blue-500 rounded text-white text-xs font-bold flex items-center justify-center">
                  2
                </div>
                <span className="text-sm text-gray-700">Then enterprise templates</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border-2 border-gray-200">
                <div className="w-6 h-6 bg-gray-500 rounded text-white text-xs font-bold flex items-center justify-center">
                  3
                </div>
                <span className="text-sm text-gray-700">Finally global templates</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Team members can still customize any data after onboarding
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
