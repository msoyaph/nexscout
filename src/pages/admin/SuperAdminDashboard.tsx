import { useState } from 'react';
import {
  LayoutDashboard, Users, UsersRound, Building2, CreditCard, Wallet,
  Target, Brain, DollarSign, ShoppingBag, Shield, FileText,
  Webhook, Settings, Activity, UserCog, Menu, X, ChevronRight,
  TrendingUp, UserPlus, Sparkles, AlertTriangle, Check, BarChart3, Globe, Database, Crown
} from 'lucide-react';
import DashboardHome from './DashboardHome';
import UserManagement from './UserManagement';
import SubscriptionManagement from './SubscriptionManagement';
import FinancialDashboard from './FinancialDashboard';
import AIAnalytics from './AIAnalytics';
import CoinMissionAnalytics from './CoinMissionAnalytics';
import CoinTransactionAuditPage from '../CoinTransactionAuditPage';
import SystemHealth from './SystemHealth';
import AnalyticsIntelligenceDashboard from './AnalyticsIntelligenceDashboard';
import DataFeederPage from './DataFeederPage';
import AmbassadorManagement from './AmbassadorManagement';

interface SuperAdminDashboardProps {
  onNavigateBack: () => void;
  onNavigate?: (page: string, options?: any) => void;
}

export default function SuperAdminDashboard({ onNavigateBack, onNavigate }: SuperAdminDashboardProps) {
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard Home', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics Intelligence', icon: BarChart3 },
    { id: 'data-feeder', label: 'Data Feeder', icon: Database },
    { id: 'browser-captures', label: 'Browser Captures', icon: Globe },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'ambassadors', label: 'Ambassador Agents', icon: Crown },
    { id: 'teams', label: 'Teams', icon: UsersRound },
    { id: 'organizations', label: 'Organizations', icon: Building2 },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
    { id: 'coins', label: 'Coins & Missions', icon: Wallet },
    { id: 'coin-audit', label: 'Coin Transaction Audit', icon: Wallet },
    { id: 'ai', label: 'AI Engine', icon: Brain },
    { id: 'financial', label: 'Financial', icon: DollarSign },
    { id: 'marketplace', label: 'Add-on Marketplace', icon: ShoppingBag },
    { id: 'compliance', label: 'Compliance', icon: Shield },
    { id: 'logs', label: 'Logs', icon: FileText },
    { id: 'webhooks', label: 'Webhooks', icon: Webhook },
    { id: 'settings', label: 'Platform Settings', icon: Settings },
    { id: 'health', label: 'System Health', icon: Activity },
    { id: 'admins', label: 'Admin Users', icon: UserCog },
  ];

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardHome />;
      case 'analytics':
        return <AnalyticsIntelligenceDashboard />;
      case 'data-feeder':
        return <DataFeederPage />;
      case 'users':
        return <UserManagement />;
      case 'ambassadors':
        return <AmbassadorManagement />;
      case 'subscriptions':
        return <SubscriptionManagement />;
      case 'financial':
        return <FinancialDashboard />;
      case 'ai':
        return <AIAnalytics />;
      case 'coins':
        return <CoinMissionAnalytics />;
      case 'health':
        return <SystemHealth />;
      default:
        return (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <Sparkles className="size-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Coming Soon</h3>
              <p className="text-sm text-gray-600">This module is under development</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-[#F4F6F8]">
      <aside
        className={`bg-white border-r border-[#E6E8EB] transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        } flex flex-col`}
      >
        <div className="p-6 border-b border-[#E6E8EB]">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div>
                <h1 className="text-lg font-bold text-[#1877F2]">NexScout</h1>
                <p className="text-xs text-[#666]">Super Admin</p>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-[#F4F6F8] rounded-lg transition-colors"
            >
              <Menu className="size-5 text-gray-600" />
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'browser-captures' && onNavigate) {
                  onNavigate('admin-browser-captures');
                } else {
                  setCurrentView(item.id);
                }
              }}
              className={`w-full flex items-center gap-3 px-6 py-3 transition-colors ${
                currentView === item.id
                  ? 'bg-[#E7F3FF] text-[#1877F2] border-r-4 border-[#1877F2]'
                  : 'text-[#666] hover:bg-[#F4F6F8]'
              }`}
            >
              <item.icon className="size-5 shrink-0" />
              {sidebarOpen && (
                <span className="text-sm font-medium truncate">{item.label}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-[#E6E8EB]">
          <button
            onClick={onNavigateBack}
            className="w-full px-4 py-2 bg-[#F4F6F8] text-gray-700 rounded-lg text-sm font-semibold hover:bg-[#E6E8EB] transition-colors"
          >
            {sidebarOpen ? 'Exit Admin' : 'Exit'}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-[#E6E8EB] px-8 py-6 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#1A1A1A]">
                {menuItems.find(item => item.id === currentView)?.label || 'Dashboard'}
              </h2>
              <p className="text-sm text-[#666] mt-1">
                Manage and monitor the NexScout.ai platform
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-xl border border-green-200">
                <div className="size-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-semibold text-green-700">All Systems Operational</span>
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">
          {renderView()}
        </div>
      </main>
    </div>
  );
}
