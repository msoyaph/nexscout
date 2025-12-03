/**
 * Enterprise Data Feeder Dashboard
 *
 * Allows enterprise admins to create and manage master data templates
 * that auto-populate onboarding for all agents in their enterprise
 */

import { useState } from 'react';
import { Building2, Package, Layers, Users, Sparkles, Search, Plus } from 'lucide-react';

const tabs = [
  { id: 'companies', icon: Building2, label: 'Companies', color: 'blue' },
  { id: 'products', icon: Package, label: 'Products', color: 'purple' },
  { id: 'services', icon: Layers, label: 'Services', color: 'green' },
  { id: 'offerings', icon: Users, label: 'Offerings', color: 'orange' },
  { id: 'preview', icon: Sparkles, label: 'Preview', color: 'pink' },
];

export default function EnterpriseDataFeederPage() {
  const [activeTab, setActiveTab] = useState('companies');

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b bg-white shadow-sm">
        <div className="px-4 py-4 md:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Enterprise Data Feeder</h1>
              <p className="text-sm text-gray-500">
                Auto-populate onboarding for all your agents
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-xl border-2 border-blue-200">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-900">
                1,247 agents using your templates
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b px-4 py-3 md:px-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
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
        {activeTab === 'companies' && <EnterpriseCompaniesView />}
        {activeTab === 'products' && <EnterpriseProductsView />}
        {activeTab === 'services' && <EnterpriseServicesView />}
        {activeTab === 'offerings' && <EnterpriseOfferingsView />}
        {activeTab === 'preview' && <EnterpriseOnboardingPreview />}
      </div>
    </div>
  );
}

/**
 * Companies View
 */
function EnterpriseCompaniesView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div className="space-y-4">
      {/* Search + Actions */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search companies..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Company
        </button>
      </div>

      {/* Info Card */}
      <div className="p-4 bg-blue-50 rounded-2xl border-2 border-blue-200">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-blue-900 mb-1">Enterprise Master Data</h3>
            <p className="text-sm text-blue-700">
              Companies added here will auto-populate during agent onboarding. They'll see your
              company's official data, products, and scripts instantly.
            </p>
          </div>
        </div>
      </div>

      {/* Companies List */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Example Company Card */}
        <CompanyCard
          name="MegaLife Insurance Corp"
          industry="Life Insurance"
          agentsUsing={420}
          productsCount={12}
          onEdit={() => {}}
        />

        <CompanyCard
          name="Wellness Ventures Inc"
          industry="MLM - Health & Wellness"
          agentsUsing={856}
          productsCount={25}
          onEdit={() => {}}
        />
      </div>
    </div>
  );
}

/**
 * Company Card Component
 */
function CompanyCard({
  name,
  industry,
  agentsUsing,
  productsCount,
  onEdit,
}: {
  name: string;
  industry: string;
  agentsUsing: number;
  productsCount: number;
  onEdit: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 p-5 hover:border-blue-300 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{name}</h3>
            <p className="text-sm text-gray-500">{industry}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1 text-sm">
          <Users className="w-4 h-4 text-blue-600" />
          <span className="font-semibold text-gray-900">{agentsUsing}</span>
          <span className="text-gray-500">agents</span>
        </div>
        <div className="flex items-center gap-1 text-sm">
          <Package className="w-4 h-4 text-purple-600" />
          <span className="font-semibold text-gray-900">{productsCount}</span>
          <span className="text-gray-500">products</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onEdit}
          className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors text-sm"
        >
          Edit
        </button>
        <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors text-sm">
          Manage Products
        </button>
      </div>
    </div>
  );
}

/**
 * Products View (Placeholder)
 */
function EnterpriseProductsView() {
  return (
    <div className="p-8 bg-white rounded-2xl border-2 border-gray-200 text-center">
      <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-bold text-gray-900 mb-2">Products Management</h3>
      <p className="text-sm text-gray-500 mb-4">
        Add and manage products that will be available to all agents during onboarding
      </p>
      <button className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl">
        Add First Product
      </button>
    </div>
  );
}

function EnterpriseServicesView() {
  return (
    <div className="p-8 bg-white rounded-2xl border-2 border-gray-200 text-center">
      <Layers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-bold text-gray-900 mb-2">Services Management</h3>
      <p className="text-sm text-gray-500">Manage service offerings and consultation packages</p>
    </div>
  );
}

function EnterpriseOfferingsView() {
  return (
    <div className="p-8 bg-white rounded-2xl border-2 border-gray-200 text-center">
      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-bold text-gray-900 mb-2">Offerings & Packages</h3>
      <p className="text-sm text-gray-500">Create bundled offerings and special packages</p>
    </div>
  );
}

function EnterpriseOnboardingPreview() {
  return (
    <div className="p-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border-2 border-blue-200">
      <div className="text-center mb-6">
        <Sparkles className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Onboarding Preview</h3>
        <p className="text-sm text-gray-600">
          See how your agents will experience auto-populated onboarding
        </p>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-lg">
        <p className="text-sm text-gray-500 text-center">
          Preview mode - Shows how the 3-question wizard will auto-suggest your company data
        </p>
      </div>
    </div>
  );
}
