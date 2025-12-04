import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { EnergyProvider } from './contexts/EnergyContext';
import { NudgeProvider } from './contexts/NudgeContext';
import { NudgeRenderer } from './components/upgrade';
import SplashScreen from './components/SplashScreen';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import HomePage from './pages/HomePage';
import OnboardingFlow from './pages/onboarding/OnboardingFlow';
import MentorChatPage from './pages/onboarding/MentorChatPage';
import DiscoverProspectsPage from './pages/DiscoverProspectsPage';
import AIPitchDeckPage from './pages/AIPitchDeckPage';
import AIMessageSequencerPage from './pages/AIMessageSequencerPage';
import AIRealTimeScanPage from './pages/AIRealTimeScanPage';
import AIDeepScanPage from './pages/AIDeepScanPage';
import SupportPage from './pages/SupportPage';
import ScanEntryPage from './pages/ScanEntryPage';
import ScanUploadPage from './pages/ScanUploadPage';
import ScanProcessingPage from './pages/ScanProcessingPage';
import ScanResultsPage from './pages/ScanResultsPage';
import ProspectDetailPage from './pages/ProspectDetailPage';
import DeepScanPage from './pages/DeepScanPage';
import DeepScanV3Page from './pages/DeepScanV3Page';
import LibraryPage from './pages/LibraryPage';
import NotificationsPage from './pages/NotificationsPage';
import NotificationSettingsPage from './pages/NotificationSettingsPage';
import PersonalAboutPage from './pages/PersonalAboutPage';
import AboutMyCompanyPage from './pages/AboutMyCompanyPage';
import ScanProspectsV25Page from './pages/ScanProspectsV25Page';
import ScanLibraryPage from './pages/ScanLibraryPage';
import ScanResultsViewerPage from './pages/ScanResultsViewerPage';
import ExtensionSetupGuidePage from './pages/setup/ExtensionSetupGuidePage';
import ScanDiagnosticsPage from './pages/admin/ScanDiagnosticsPage';
import CsvCheckPage from './pages/CsvCheckPage';
import CompanyOverviewPage from './pages/company/CompanyOverviewPage';
import CompanyPerformancePage from './pages/company/CompanyPerformancePage';
import EnergyRefillPage from './pages/EnergyRefillPage';
import AIChatbotPage from './pages/AIChatbotPage';
import AIChatbotControlPanel from './pages/AIChatbotControlPanel';
import PublicChatPage from './pages/PublicChatPage';
import ChatbotSettingsPage from './pages/ChatbotSettingsPage';
import ChatbotSessionsPage from './pages/ChatbotSessionsPage';
import ChatbotSessionViewerPage from './pages/ChatbotSessionViewerPage';
import CalendarPage from './pages/CalendarPage';
import TodosPage from './pages/TodosPage';
import RemindersPage from './pages/RemindersPage';
import NotificationPreferencesPage from './pages/NotificationPreferencesPage';
import TeamBillingPage from './pages/team/TeamBillingPage';
import SeatManagementPage from './pages/team/SeatManagementPage';
import DynamicNudgeDemoPage from './pages/DynamicNudgeDemoPage';
import GovernmentOverviewPage from './pages/admin/government/GovernmentOverviewPage';
import OrgChartPage from './pages/admin/government/OrgChartPage';
import EnginesPage from './pages/admin/government/EnginesPage';
import HealthPage from './pages/admin/government/HealthPage';
import AuditLogPage from './pages/admin/government/AuditLogPage';
import DepartmentsPage from './pages/admin/government/DepartmentsPage';
import EconomyPage from './pages/admin/government/EconomyPage';
import AddProductPage from './pages/products/AddProductPage';
import ProductListPage from './pages/products/ProductListPage';
import ProductAnalyticsPage from './pages/admin/ProductAnalyticsPage';
import AIMessagesPage from './pages/AIMessagesPage';
import MessagingHubPage from './pages/MessagingHubPage';
import AdminControlPanel from './pages/admin/AdminControlPanel';
import AiAdminEditor from './pages/admin/AiAdminEditor';
import LeadsDashboardPage from './pages/LeadsDashboardPage';

type AuthView = 'login' | 'onboarding' | 'signup';
type Page = 'home' | 'discover' | 'pitchdeck' | 'messagesequencer' | 'realtimescan' | 'deepscan' | 'support' | 'scan-entry' | 'scan-upload' | 'scan-processing' | 'scan-results' | 'prospect-detail' | 'deep-scan' | 'deep-scan-v3' | 'pricing' | 'library' | 'notifications' | 'notification-settings' | 'personal-about' | 'about-my-company' | 'scan-prospects-v25' | 'scan-library' | 'scan-results-viewer' | 'extension-setup' | 'admin-scan-diagnostics' | 'csv-check' | 'company-overview' | 'company-performance' | 'energy-refill' | 'ai-chatbot' | 'ai-chatbot-settings' | 'chatbot-settings' | 'chatbot-sessions' | 'chatbot-session-viewer' | 'leads-dashboard' | 'public-chat' | 'calendar' | 'todos' | 'reminders' | 'notification-preferences' | 'team-billing' | 'team-seats' | 'nudge-demo' | 'gov-overview' | 'gov-org-chart' | 'gov-engines' | 'gov-health' | 'gov-audit' | 'gov-departments' | 'gov-economy' | 'add-product' | 'products-list' | 'product-detail' | 'product-analytics' | 'mentor-chat' | 'ai-messages' | 'messaging-hub' | 'admin-control-panel' | 'ai-admin-editor';

interface OnboardingData {
  role: string;
  goals: string[];
  connectedPlatforms: string[];
}

// Main App component - checks for public routes FIRST
function App() {
  // CRITICAL: Check for public route BEFORE ANY OTHER LOGIC
  const path = window.location.pathname;
  console.log('[App] Current path:', path);

  // Public Chat Route: /chat/[unique_id or custom_slug]
  if (path.startsWith('/chat/')) {
    const slug = path.split('/chat/')[1];
    console.log('[App] Public chat route detected! Slug:', slug);
    return (
      <PublicChatPage
        slug={slug}
        onNavigate={(page: string) => {
          window.location.href = '/';
        }}
      />
    );
  }

  // About Me Route: /me/[unique_id]
  if (path.startsWith('/me/')) {
    const uniqueId = path.split('/me/')[1];
    console.log('[App] About Me route detected! unique_id:', uniqueId);
    return (
      <PersonalAboutPage
        uniqueUserId={uniqueId}
        onNavigate={(page: string) => {
          window.location.href = '/';
        }}
      />
    );
  }

  // Referral Route: /ref/[unique_id]
  if (path.startsWith('/ref/')) {
    const uniqueId = path.split('/ref/')[1];
    console.log('[App] Referral route detected! unique_id:', uniqueId);
    // Redirect to signup with referral code
    window.location.href = `/?ref=${uniqueId}`;
    return null;
  }

  console.log('[App] Authenticated route - loading AuthProvider');

  // For all other routes, use the normal authenticated app
  return (
    <AuthProvider>
      <EnergyProvider>
        <NudgeProvider>
          <AppContent />
        </NudgeProvider>
      </EnergyProvider>
    </AuthProvider>
  );
}

function AppContent() {
  const [showSplash, setShowSplash] = useState(true);
  const [authView, setAuthView] = useState<AuthView>('login');
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [pageOptions, setPageOptions] = useState<any>(null);
  const { user, profile, loading, refreshProfile } = useAuth();

  const handleNavigate = (page: string, options?: any) => {
    setCurrentPage(page as Page);
    setPageOptions(options || null);
  };

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    if (authView === 'signup') {
      return (
        <SignupPage
          onNavigateToLogin={() => setAuthView('login')}
          onSignupSuccess={() => setAuthView('login')}
        />
      );
    }
    return (
      <LoginPage
        onNavigateToSignup={() => setAuthView('signup')}
        onLoginSuccess={() => {
          setAuthView('login');
        }}
      />
    );
  }

  if (profile && !profile.onboarding_completed && authView !== 'onboarding') {
    setAuthView('onboarding');
  }

  if (authView === 'onboarding' || (profile && !profile.onboarding_completed)) {
    return (
      <OnboardingFlow
        onComplete={async (data: OnboardingData) => {
          setOnboardingData(data);
          await refreshProfile();
          setAuthView('login');
        }}
      />
    );
  }

  // Render the appropriate page
  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} />;
      case 'discover':
        return <DiscoverProspectsPage onNavigate={handleNavigate} />;
      case 'pitchdeck':
        return <AIPitchDeckPage onNavigate={handleNavigate} />;
      case 'messagesequencer':
        return <AIMessageSequencerPage onNavigate={handleNavigate} />;
      case 'realtimescan':
        return <AIRealTimeScanPage onNavigate={handleNavigate} />;
      case 'deepscan':
        return <AIDeepScanPage onNavigate={handleNavigate} />;
      case 'support':
        return <SupportPage onNavigate={handleNavigate} />;
      case 'scan-entry':
        return <ScanEntryPage onNavigate={handleNavigate} />;
      case 'scan-upload':
        return <ScanUploadPage onNavigate={handleNavigate} sourceType={pageOptions?.sourceType} />;
      case 'scan-processing':
        return <ScanProcessingPage sessionId={pageOptions?.sessionId} onNavigate={handleNavigate} />;
      case 'scan-results':
        return <ScanResultsPage sessionId={pageOptions?.sessionId} onNavigate={handleNavigate} />;
      case 'prospect-detail':
        return <ProspectDetailPage prospectId={pageOptions?.id} onNavigate={handleNavigate} onBack={() => handleNavigate('scan-results', { sessionId: pageOptions?.sessionId })} />;
      case 'deep-scan':
        return <DeepScanPage prospectId={pageOptions?.prospectId} onNavigate={handleNavigate} onBack={() => handleNavigate('home')} />;
      case 'deep-scan-v3':
        return <DeepScanV3Page prospectId={pageOptions?.prospectId} onNavigate={handleNavigate} onBack={() => handleNavigate('home')} />;
      case 'library':
        return <LibraryPage onNavigate={handleNavigate} />;
      case 'notifications':
        return <NotificationsPage onNavigate={handleNavigate} />;
      case 'notification-settings':
        return <NotificationSettingsPage onNavigate={handleNavigate} />;
      case 'personal-about':
        return <PersonalAboutPage onNavigate={handleNavigate} />;
      case 'about-my-company':
        return <AboutMyCompanyPage onNavigate={handleNavigate} />;
      case 'scan-prospects-v25':
        return <ScanProspectsV25Page onNavigate={handleNavigate} />;
      case 'scan-library':
        return <ScanLibraryPage onNavigate={handleNavigate} />;
      case 'scan-results-viewer':
        return <ScanResultsViewerPage sessionId={pageOptions?.sessionId} onNavigate={handleNavigate} />;
      case 'extension-setup':
        return <ExtensionSetupGuidePage onNavigate={handleNavigate} />;
      case 'admin-scan-diagnostics':
        return <ScanDiagnosticsPage onNavigate={handleNavigate} />;
      case 'csv-check':
        return <CsvCheckPage onNavigate={handleNavigate} />;
      case 'company-overview':
        return <CompanyOverviewPage onNavigate={handleNavigate} />;
      case 'company-performance':
        return <CompanyPerformancePage onNavigate={handleNavigate} />;
      case 'energy-refill':
        return <EnergyRefillPage onNavigate={handleNavigate} />;
      case 'ai-chatbot':
      case 'ai-chatbot-settings':
        return <AIChatbotPage onNavigate={handleNavigate} />;
      case 'chatbot-settings':
        return <ChatbotSettingsPage onNavigate={handleNavigate} />;
      case 'chatbot-sessions':
        return <ChatbotSessionsPage onNavigate={handleNavigate} />;
      case 'chatbot-session-viewer':
        return <ChatbotSessionViewerPage sessionId={pageOptions?.sessionId} onNavigate={handleNavigate} />;
      case 'leads-dashboard':
        return <LeadsDashboardPage />;
      case 'calendar':
        return <CalendarPage onNavigate={handleNavigate} />;
      case 'todos':
        return <TodosPage onNavigate={handleNavigate} />;
      case 'reminders':
        return <RemindersPage onNavigate={handleNavigate} />;
      case 'notification-preferences':
        return <NotificationPreferencesPage onNavigate={handleNavigate} />;
      case 'team-billing':
        return <TeamBillingPage onNavigate={handleNavigate} />;
      case 'team-seats':
        return <SeatManagementPage onNavigate={handleNavigate} />;
      case 'nudge-demo':
        return <DynamicNudgeDemoPage onNavigate={handleNavigate} />;
      case 'gov-overview':
        return <GovernmentOverviewPage onNavigate={handleNavigate} />;
      case 'gov-org-chart':
        return <OrgChartPage onNavigate={handleNavigate} />;
      case 'gov-engines':
        return <EnginesPage onNavigate={handleNavigate} />;
      case 'gov-health':
        return <HealthPage onNavigate={handleNavigate} />;
      case 'gov-audit':
        return <AuditLogPage onNavigate={handleNavigate} />;
      case 'gov-departments':
        return <DepartmentsPage onNavigate={handleNavigate} />;
      case 'gov-economy':
        return <EconomyPage onNavigate={handleNavigate} />;
      case 'admin-control-panel':
        return <AdminControlPanel />;
      case 'ai-admin-editor':
        return <AiAdminEditor />;
      case 'add-product':
        return <AddProductPage onNavigate={handleNavigate} />;
      case 'products-list':
        return <ProductListPage onNavigate={handleNavigate} />;
      case 'product-analytics':
        return <ProductAnalyticsPage onNavigate={handleNavigate} />;
      case 'mentor-chat':
        return <MentorChatPage onBack={() => handleNavigate('home')} onNavigate={handleNavigate} />;
      case 'ai-messages':
        return <AIMessagesPage onNavigate={handleNavigate} />;
      case 'messaging-hub':
        return <MessagingHubPage onNavigate={handleNavigate} />;
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  return (
    <>
      {renderPage()}
      <NudgeRenderer />
    </>
  );
}

export default App;
