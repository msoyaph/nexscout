import { useState, useEffect } from 'react';
import { generateAITasksForUser, generateAIAlertsForUser, completeTask, dismissTask, dismissAlert } from '../services/ai/aiProductivityEngine';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { notificationService } from '../services/notifications/notificationService';
import NotificationsPage from './NotificationsPage';
import {
  Bell,
  Coins,
  Users,
  CheckSquare,
  Calendar,
  Home,
  PlusCircle,
  TrendingUp,
  MoreHorizontal,
  Sparkles,
  AlertCircle,
  Crown,
  Zap,
  MessageSquare,
  Facebook,
  CheckCircle,
  Globe,
  Phone,
  Video,
  Send,
  ChevronDown,
  ChevronUp,
  FileText,
  ArrowRight,
  Flame,
  Thermometer,
  Snowflake
} from 'lucide-react';
import SlideInMenu from '../components/SlideInMenu';
import ActionPopup from '../components/ActionPopup';
import NotificationCenter from '../components/NotificationCenter';
import ProspectAvatar from '../components/ProspectAvatar';
import NotificationBadge from '../components/NotificationBadge';
import { useNotificationCounts } from '../hooks/useNotificationCounts';
import SettingsPage from './SettingsPage';
import WalletPage from './WalletPage';
import PurchaseCoinsPage from './PurchaseCoinsPage';
import CheckoutPage from './CheckoutPage';
import ReceiptPage from './ReceiptPage';
import AmbassadorDashboard from './AmbassadorDashboard';
import CalendarPage from './CalendarPage';
import PublicBookingPage from './PublicBookingPage';
import ProspectsPage from './ProspectsPage';
import PipelinePage from './PipelinePage';
import MissionsPage from './MissionsPage';
import SubscriptionPage from './SubscriptionPage';
import PricingPage from './PricingPage';
import SubscriptionCheckoutPage from './SubscriptionCheckoutPage';
import ManageSubscriptionPage from './ManageSubscriptionPage';
import SupportPage from './SupportPage';
import TermsOfServicePage from './TermsOfServicePage';
import PrivacyPolicyPage from './PrivacyPolicyPage';
import AboutPage from './AboutPage';
import EditProfilePage from './EditProfilePage';
import ChangePasswordPage from './ChangePasswordPage';
import PrivacySecurityPage from './PrivacySecurityPage';
import TrainingHubPage from './TrainingHubPage';
import SuperAdminDashboard from './admin/SuperAdminDashboard';
import BrowserCaptureList from './admin/BrowserCaptureList';
import BrowserCaptureDetail from './admin/BrowserCaptureDetail';
import PersonalAboutPage from './PersonalAboutPage';
import AboutMyCompanyPage from './AboutMyCompanyPage';
import MessagingHubPage from './MessagingHubPage';
import AIPitchDeckPage from './AIPitchDeckPage';
import ScanLibraryPage from './ScanLibraryPage';
import MyCapturedDataPage from './MyCapturedDataPage';
import CaptureDetailPage from './CaptureDetailPage';
import ProspectDetailPage from './ProspectDetailPage';
import AIChatbotPage from './AIChatbotPage';
import AIChatbotControlPanel from './AIChatbotControlPanel';
import ChatbotSessionsPage from './ChatbotSessionsPage';
import ChatbotSettingsPage from './ChatbotSettingsPage';
import ChatbotSessionViewerPage from './ChatbotSessionViewerPage';
import ProductListPage from './products/ProductListPage';
import AddProductPage from './products/AddProductPage';
import ProductAnalyticsPage from './admin/ProductAnalyticsPage';
import DeepScanPage from './DeepScanPage';

interface CoinPackage {
  id: string;
  coins: number;
  price: number;
  popular?: boolean;
  bonus?: number;
}

interface HomePageProps {
  onNavigateToPitchDeck: () => void;
  onNavigateToDiscover?: () => void;
  onNavigateToMessageSequencer?: () => void;
  onNavigateToRealTimeScan?: () => void;
  onNavigateToDeepScan?: () => void;
  initialPage?: string;
}

export default function HomePage({
  onNavigateToPitchDeck,
  onNavigateToDiscover,
  onNavigateToMessageSequencer,
  onNavigateToRealTimeScan,
  onNavigateToDeepScan,
  initialPage
}: HomePageProps) {
  const { user, profile, signOut } = useAuth();
  const isSuperAdmin = user?.email === 'geoffmax22@gmail.com';
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<string>(initialPage || 'home');
  const [showActionPopup, setShowActionPopup] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<{tier: string, cycle: 'monthly' | 'annual'} | null>(null);
  const [topProspects, setTopProspects] = useState<any[]>([]);
  const [prospectsLoading, setProspectsLoading] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [scheduleEvents, setScheduleEvents] = useState<any[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [aiAlerts, setAiAlerts] = useState<any[]>([]);
  const notificationCounts = useNotificationCounts();
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [generatingTasks, setGeneratingTasks] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [pageOptions, setPageOptions] = useState<any>(null);
  const [energy, setEnergy] = useState({ current: 0, max: 5 });
  const [chatbotLink, setChatbotLink] = useState<string | null>(null);

  // Verification states
  const [chatbotVerified, setChatbotVerified] = useState(false);
  const [facebookVerified, setFacebookVerified] = useState(false);
  const [webChatVerified, setWebChatVerified] = useState(false);
  const [whatsappVerified, setWhatsappVerified] = useState(false);
  const [tiktokVerified, setTiktokVerified] = useState(false);
  const [telegramVerified, setTelegramVerified] = useState(false);
  
  // Collapsible state
  const [showMoreButtons, setShowMoreButtons] = useState(false);

  // Check and award subscription coins (weekly for Pro, daily for Free)
  useEffect(() => {
    const checkCoins = async () => {
      if (!user?.id || !profile?.subscription_tier) return;

      try {
        const { subscriptionCoinService } = await import('../services/subscriptionCoinService');
        await subscriptionCoinService.checkAndAwardCoins(user.id, profile.subscription_tier);
      } catch (error) {
        console.error('[HomePage] Error checking/awarding coins:', error);
      }
    };

    // Check coins when user/profile loads (with delay to avoid blocking)
    if (user && profile) {
      const timer = setTimeout(checkCoins, 2000); // Wait 2 seconds after page load
      return () => clearTimeout(timer);
    }
  }, [user, profile]);

  // Load chatbot link for welcome card
  useEffect(() => {
    const loadChatbotLink = async () => {
      if (!user?.id) return;

      try {
        // Get chatbot link from chatbot_links table
        const { data: chatbotLinkData } = await supabase
          .from('chatbot_links')
          .select('chatbot_id, custom_slug')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (chatbotLinkData) {
          // Prefer custom_slug if available, otherwise use chatbot_id
          const slug = chatbotLinkData.custom_slug || chatbotLinkData.chatbot_id;
          if (slug) {
            setChatbotLink(slug);
          }
        } else {
          // Fallback: try to get from profiles.unique_user_id
          const { data: profileData } = await supabase
            .from('profiles')
            .select('unique_user_id')
            .eq('id', user.id)
            .maybeSingle();

          if (profileData?.unique_user_id) {
            setChatbotLink(profileData.unique_user_id);
          }
        }
      } catch (error) {
        console.error('[HomePage] Error loading chatbot link:', error);
      }
    };

    if (user) {
      loadChatbotLink();
    }
  }, [user]);

  useEffect(() => {
    if (user && currentPage === 'home') {
      loadTopProspects();
      loadTasks();
      loadSchedule();
      loadAlerts();
      loadUnreadCount();
      loadEnergy();
    }
  }, [user, currentPage]);

  async function loadEnergy() {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('user_energy')
        .select('current_energy, max_energy')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setEnergy({ current: data.current_energy, max: data.max_energy });
      }
    } catch (error) {
      console.error('Error loading energy:', error);
    }
  }

  async function loadUnreadCount() {
    if (!user) return;
    const result = await notificationService.getUnreadCount(user.id);
    if (result.success) {
      setUnreadNotifications(result.count);
    }
  }

  async function loadTopProspects() {
    try {
      // Fetch all prospects for the user
      const { data: prospects, error: prospectsError } = await supabase
        .from('prospects')
        .select('*')
        .eq('user_id', user?.id);

      if (prospectsError) throw prospectsError;

      if (!prospects || prospects.length === 0) {
        setTopProspects([]);
        setProspectsLoading(false);
        return;
      }

      // Get latest chat session date for each prospect
      // Use only prospect_id to avoid 400 errors from empty values and special characters
      const prospectsWithSessions = await Promise.all(
        prospects.map(async (p: any) => {
          let latestSessionDate: Date | null = null;
          
          try {
            // Only query by prospect_id (most reliable, avoids URL encoding issues)
            const { data: session, error: sessionError } = await supabase
              .from('public_chat_sessions')
              .select('updated_at, created_at')
              .eq('user_id', user?.id)
              .eq('prospect_id', p.id)
              .order('updated_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (session && !sessionError) {
              latestSessionDate = session.updated_at 
                ? new Date(session.updated_at) 
                : session.created_at 
                  ? new Date(session.created_at) 
                  : null;
            }
          } catch (error) {
            // Silently fail - session date is optional
            console.warn(`Error loading session for prospect ${p.id}:`, error);
          }

          return {
            prospect: p,
            latestSessionDate,
            score: p.metadata?.scout_score || 0,
          };
        })
      );

      // Sort by: 1) ScoutScore (descending), 2) Latest session date (descending)
      prospectsWithSessions.sort((a, b) => {
        // First sort by score (higher is better)
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        
        // If scores are equal, sort by latest session date (more recent is better)
        if (a.latestSessionDate && b.latestSessionDate) {
          return b.latestSessionDate.getTime() - a.latestSessionDate.getTime();
        }
        
        // Prospects with sessions come before those without
        if (a.latestSessionDate && !b.latestSessionDate) return -1;
        if (!a.latestSessionDate && b.latestSessionDate) return 1;
        
        // If no sessions, sort by prospect created_at (newer first)
        const aCreated = new Date(a.prospect.created_at || 0);
        const bCreated = new Date(b.prospect.created_at || 0);
        return bCreated.getTime() - aCreated.getTime();
      });

      // Take top 5
      const top5 = prospectsWithSessions.slice(0, 5);

      // Format for display
      const formatted = top5.map(({ prospect: p }) => ({
        id: p.id,
        name: p.full_name,
        full_name: p.full_name,
        uploaded_image_url: p.uploaded_image_url,
        social_image_url: p.social_image_url,
        avatar_seed: p.avatar_seed,
        score: p.metadata?.scout_score || 0,
        platform: p.platform,
        analysis: p.metadata?.notes || p.bio_text?.substring(0, 60) || 'No analysis available',
      }));

      setTopProspects(formatted);
    } catch (error) {
      console.error('Error loading prospects:', error);
    } finally {
      setProspectsLoading(false);
    }
  }

  async function loadTasks() {
    try {
      const { data: aiTasks, error: aiError } = await supabase
        .from('ai_tasks')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'pending')
        .order('due_time', { ascending: true })
        .limit(5);

      if (aiError) throw aiError;

      const { data: missions, error: missionsError } = await supabase
        .from('missions')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_completed', false)
        .order('order_index', { ascending: true })
        .limit(5);

      if (missionsError) throw missionsError;

      const combinedTasks = [
        ...(aiTasks || []).map((t: any) => ({ ...t, source: 'ai_tasks' })),
        ...(missions || []).map((m: any) => ({
          id: m.id,
          title: m.title,
          description: m.description,
          category: m.task_category || m.mission_type,
          priority: m.priority || 'medium',
          linked_page: m.linked_page,
          navigation_data: m.navigation_data,
          source: 'missions',
          icon_name: m.icon_name,
          color: m.color,
          reward_coins: m.reward_coins,
          current_progress: m.current_progress,
          total_required: m.total_required
        }))
      ];

      if (combinedTasks.length === 0) {
        await autoGenerateTrainingTasks();
        await loadTasks();
        return;
      }

      setTasks(combinedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setTasksLoading(false);
    }
  }

  async function autoGenerateTrainingTasks() {
    try {
      const { data, error } = await supabase.rpc('generate_daily_training_tasks', {
        p_user_id: user?.id
      });

      if (error) throw error;
      console.log('Auto-generated training tasks:', data);
    } catch (error) {
      console.error('Error auto-generating training tasks:', error);
    }
  }

  async function loadSchedule() {
    try {
      setScheduleLoading(true);
      
      if (!user) return;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Load from calendar_bookings (Smart Calendar integration)
      const { data, error } = await supabase
        .from('calendar_bookings')
        .select(`
          *,
          meeting_type:meeting_types(name, duration_minutes, color)
        `)
        .eq('user_id', user.id)
        .eq('status', 'confirmed')
        .gte('start_time', today.toISOString())
        .lt('start_time', tomorrow.toISOString())
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Calendar bookings error:', error);
        // Fallback to old schedule_events table if calendar not deployed yet
        const { data: fallbackData } = await supabase
          .from('schedule_events')
          .select('*')
          .eq('user_id', user.id)
          .gte('start_time', today.toISOString())
          .lt('start_time', tomorrow.toISOString())
          .order('start_time', { ascending: true });
        
        setScheduleEvents(fallbackData || []);
        return;
      }

      setScheduleEvents(data || []);
    } catch (error) {
      console.error('Error loading schedule:', error);
      setScheduleEvents([]);
    } finally {
      setScheduleLoading(false);
    }
  }

  async function loadAlerts() {
    try {
      setAlertsLoading(true);
      
      if (!user) return;
      
      const alerts = [];
      
      // 1. CALENDAR ALERTS - Check for upcoming meetings (next 24 hours)
      try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const { data: upcomingMeetings } = await supabase
          .from('calendar_bookings')
          .select('*, meeting_type:meeting_types(name)')
          .eq('user_id', user.id)
          .eq('status', 'confirmed')
          .gte('start_time', new Date().toISOString())
          .lte('start_time', tomorrow.toISOString())
          .order('start_time', { ascending: true });
        
        if (upcomingMeetings && upcomingMeetings.length > 0) {
          upcomingMeetings.forEach((meeting: any) => {
            const meetingTime = new Date(meeting.start_time);
            const hoursUntil = Math.round((meetingTime.getTime() - Date.now()) / (1000 * 60 * 60));
            const minutesUntil = Math.round((meetingTime.getTime() - Date.now()) / (1000 * 60));
            
            alerts.push({
              id: `meeting-${meeting.id}`,
              icon: hoursUntil <= 1 ? '🔥' : '📅',
              title: `Meeting with ${meeting.guest_name}`,
              message: hoursUntil < 1 
                ? `Starting in ${minutesUntil} minutes!` 
                : `In ${hoursUntil} hour${hoursUntil !== 1 ? 's' : ''} - ${meetingTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
              priority: hoursUntil <= 1 ? 1 : minutesUntil <= 60 ? 2 : 3,
              action: () => setCurrentPage('calendar'),
              actionLabel: 'View Calendar',
            });
          });
        }
      } catch (calError) {
        console.log('Calendar not deployed yet, skipping meeting alerts');
      }
      
      // 2. REMINDERS - Load upcoming reminders from prospect_reminders
      try {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const { data: reminders, error: remindersError } = await supabase
          .from('prospect_reminders')
          .select(`
            *,
            prospect:prospects(full_name, profile_image_url, social_image_url, avatar_seed, uploaded_image_url)
          `)
          .eq('user_id', user.id)
          .eq('is_completed', false)
          .gte('reminder_date', now.toISOString())
          .lte('reminder_date', tomorrow.toISOString())
          .order('reminder_date', { ascending: true })
          .limit(5);

        // Handle 404 (table doesn't exist) gracefully
        if (remindersError && remindersError.code !== 'PGRST116') {
          throw remindersError;
        }

        // Handle 404 error (table doesn't exist) gracefully
        if (remindersError) {
          // If table doesn't exist (404, PGRST205, or "Could not find the table"), skip reminders silently
          if (remindersError.code === 'PGRST116' || 
              remindersError.code === 'PGRST205' || 
              remindersError.message?.includes('404') ||
              remindersError.message?.includes('Could not find the table')) {
            // Table doesn't exist - this is fine, just skip reminders
            // Don't log as error, it's expected if the table hasn't been created yet
            // Silently continue - no console.error
          } else {
            // Only log non-404 errors
            console.error('Error loading reminders:', remindersError);
          }
        } else if (reminders) {
          reminders.forEach((reminder: any) => {
            const reminderTime = new Date(reminder.reminder_date);
            const hoursUntil = Math.round((reminderTime.getTime() - now.getTime()) / (1000 * 60 * 60));
            const minutesUntil = Math.round((reminderTime.getTime() - now.getTime()) / (1000 * 60));
            const prospectName = reminder.prospect?.full_name || 'Prospect';
            
            alerts.push({
              id: `reminder-${reminder.id}`,
              icon: '🔔',
              title: `Follow-up: ${prospectName}`,
              message: reminder.notes || `Time to follow up with ${prospectName}`,
              priority: minutesUntil <= 30 ? 1 : hoursUntil <= 2 ? 2 : 3,
              alert_type: 'reminder_due',
              action: () => handleNavigate('prospect-detail', { prospectId: reminder.prospect_id }),
              actionLabel: 'View Prospect',
              related_prospect_id: reminder.prospect_id,
              reminder_date: reminder.reminder_date,
            });
          });
        }
      } catch (remindersError) {
        console.error('Error loading reminders:', remindersError);
      }

      // 3. AI SALES ALERTS - Load from ai_alerts table
      try {
        const { data: aiAlertsData, error } = await supabase
          .from('ai_alerts')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_dismissed', false)
          .order('priority', { ascending: true })
          .order('created_at', { ascending: false })
          .limit(3);

        if (!error && aiAlertsData) {
          alerts.push(...aiAlertsData);
        }
      } catch (aiError) {
        console.error('Error loading AI alerts:', aiError);
      }

      // Sort alerts by priority (1 = urgent, 2 = high, 3 = normal)
      alerts.sort((a, b) => (a.priority || 3) - (b.priority || 3));

      setAiAlerts(alerts);
    } catch (error) {
      console.error('Error loading alerts:', error);
      setAiAlerts([]);
    } finally {
      setAlertsLoading(false);
    }
  }

  async function handleGenerateTasks() {
    if (!user) return;
    setGeneratingTasks(true);
    try {
      await autoGenerateTrainingTasks();
      await generateAITasksForUser(user.id);
      await generateAIAlertsForUser(user.id);
      await loadTasks();
      await loadAlerts();
    } catch (error) {
      console.error('Error generating tasks:', error);
    } finally {
      setGeneratingTasks(false);
    }
  }

  function handleTaskClick(task: any) {
    if (task.linked_page) {
      handleNavigate(task.linked_page);
    }
  }

  async function handleCompleteTask(taskId: string) {
    await completeTask(taskId);
    await loadTasks();
  }

  async function handleDismissAlert(alertId: string) {
    await dismissAlert(alertId);
    await loadAlerts();
  }

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  function getAlertColor(priority: string) {
    switch (priority) {
      case 'urgent': return { bg: 'from-[#FEF2F2] to-[#FEE2E2]', border: 'border-[#FCA5A5]', icon: 'text-[#EF4444]' };
      case 'high': return { bg: 'from-[#FEF3C7] to-[#FDE68A]', border: 'border-[#FCD34D]', icon: 'text-[#F59E0B]' };
      default: return { bg: 'from-[#EFF6FF] to-[#DBEAFE]', border: 'border-[#93C5FD]', icon: 'text-[#1877F2]' };
    }
  }

  function getPlatformIcon(platform: string) {
    if (platform === 'linkedin') {
      return (
        <svg className="size-4 text-[#0A66C2]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      );
    }
    if (platform === 'twitter') {
      return (
        <svg className="size-4 text-[#1DA1F2]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
        </svg>
      );
    }
    return (
      <svg className="size-4 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    );
  }

  function getScoreColor(score: number) {
    if (score >= 90) return 'bg-[#22C55E] text-white';
    if (score >= 80) return 'bg-[#3B82F6] text-white';
    if (score >= 70) return 'bg-[#F59E0B] text-white';
    return 'bg-[#6B7280] text-white';
  }

  function getTemperatureIndicator(score: number) {
    if (score >= 70) {
      return { label: 'Hot', icon: Flame, color: 'text-red-600' };
    } else if (score >= 50) {
      return { label: 'Warm', icon: Thermometer, color: 'text-orange-500' };
    } else {
      return { label: 'Cold', icon: Snowflake, color: 'text-blue-400' };
    }
  }

  const handleNavigate = (page: string, options?: any) => {
    // Handle external navigation (to AI tools)
    if (page === 'pitch-decks' && onNavigateToPitchDeck) {
      onNavigateToPitchDeck();
      setMenuOpen(false);
      return;
    }
    if (page === 'messages' && onNavigateToMessageSequencer) {
      onNavigateToMessageSequencer();
      setMenuOpen(false);
      return;
    }

    // Handle internal page navigation
    setCurrentPage(page);
    setPageOptions(options || null);
    setMenuOpen(false);
  };

  const handleNavigateToPurchase = () => {
    setCurrentPage('purchase');
  };

  const handleCheckout = (packageData: CoinPackage) => {
    setSelectedPackage(packageData);
    setCurrentPage('checkout');
  };

  const handleConfirmPurchase = () => {
    setCurrentPage('receipt');
  };

  const handleBackToHome = () => {
    setCurrentPage('home');
    setSelectedPackage(null);
  };

  if (currentPage === 'notifications') {
    return <NotificationsPage onBack={() => setCurrentPage('home')} onNavigate={handleNavigate} />;
  }

  if (currentPage === 'settings') {
    return <SettingsPage onBack={() => setCurrentPage('home')} onNavigate={handleNavigate} />;
  }

  if (currentPage === 'personal-about') {
    return <PersonalAboutPage onNavigateBack={() => setCurrentPage('home')} />;
  }

  if (currentPage === 'about-my-company') {
    return <AboutMyCompanyPage onBack={() => setCurrentPage('settings')} />;
  }

  if (currentPage === 'prospects') {
    return (
      <ProspectsPage
        onBack={() => setCurrentPage('home')}
        onNavigate={handleNavigate}
        onNavigateToPitchDeck={onNavigateToPitchDeck}
        onNavigateToMessageSequencer={onNavigateToMessageSequencer}
        onNavigateToRealTimeScan={onNavigateToRealTimeScan}
        onNavigateToDeepScan={onNavigateToDeepScan}
      />
    );
  }

  if (currentPage === 'prospect-detail') {
    return (
      <ProspectDetailPage
        onBack={() => setCurrentPage('prospects')}
        onNavigate={handleNavigate}
        prospectId={pageOptions?.prospectId}
      />
    );
  }

  if (currentPage === 'pipeline') {
    return (
      <PipelinePage
        onBack={() => setCurrentPage('home')}
        onNavigate={handleNavigate}
        onNavigateToPitchDeck={onNavigateToPitchDeck}
        onNavigateToMessageSequencer={onNavigateToMessageSequencer}
        onNavigateToRealTimeScan={onNavigateToRealTimeScan}
        onNavigateToDeepScan={onNavigateToDeepScan}
      />
    );
  }

  if (currentPage === 'missions') {
    return (
      <MissionsPage
        onNavigateBack={() => setCurrentPage('home')}
        onNavigate={handleNavigate}
        onNavigateToMore={() => setMenuOpen(true)}
      />
    );
  }

  if (currentPage === 'subscription') {
    return (
      <SubscriptionPage
        onNavigateBack={() => setCurrentPage('home')}
        onSelectPlan={(tier, cycle) => {
          setSelectedSubscription({ tier, cycle });
          setCurrentPage('subscription-checkout');
        }}
        onNavigate={handleNavigate}
      />
    );
  }

  if (currentPage === 'pricing') {
    return (
      <PricingPage
        onNavigateBack={() => setCurrentPage('home')}
        onSelectPlan={(tier, cycle) => {
          setSelectedSubscription({ tier, cycle });
          setCurrentPage('subscription-checkout');
        }}
      />
    );
  }

  if (currentPage === 'subscription-checkout' && selectedSubscription) {
    return (
      <SubscriptionCheckoutPage
        onBack={() => setCurrentPage('pricing')}
        onSuccess={() => {
          setCurrentPage('home');
          // Refresh profile to get updated subscription tier
          window.location.reload();
        }}
        tier={selectedSubscription.tier}
        billingCycle={selectedSubscription.cycle}
      />
    );
  }

  if (currentPage === 'manage-subscription') {
    return (
      <ManageSubscriptionPage
        onBack={() => setCurrentPage('home')}
        onNavigate={handleNavigate}
      />
    );
  }

  if (currentPage === 'wallet') {
    return (
      <WalletPage
        onBack={() => setCurrentPage('home')}
        onNavigateToPurchase={handleNavigateToPurchase}
        onNavigate={handleNavigate}
        onNavigateToMore={() => setMenuOpen(true)}
      />
    );
  }

  if (currentPage === 'ambassador') {
    return (
      <AmbassadorDashboard
        onBack={() => setCurrentPage('wallet')}
        onNavigate={handleNavigate}
      />
    );
  }

  if (currentPage === 'calendar') {
    return (
      <CalendarPage
        onBack={() => setCurrentPage('home')}
        onNavigate={handleNavigate}
      />
    );
  }

  if (currentPage.startsWith('book-')) {
    const slug = currentPage.replace('book-', '');
    return <PublicBookingPage slug={slug} />;
  }

  if (currentPage === 'ai-chatbot') {
    return (
      <AIChatbotPage
        onBack={() => setCurrentPage('home')}
        onNavigate={handleNavigate}
      />
    );
  }

  if (currentPage === 'ai-chatbot-settings') {
    return (
      <AIChatbotControlPanel
        onBack={() => setCurrentPage('ai-chatbot')}
        onNavigate={handleNavigate}
      />
    );
  }

  if (currentPage === 'chatbot-sessions') {
    return (
      <ChatbotSessionsPage
        onBack={() => setCurrentPage('home')}
        onNavigate={handleNavigate}
      />
    );
  }

  if (currentPage === 'chatbot-settings') {
    return (
      <ChatbotSettingsPage
        onBack={() => setCurrentPage('home')}
        onNavigate={handleNavigate}
      />
    );
  }

  if (currentPage === 'chatbot-session-viewer') {
    return (
      <ChatbotSessionViewerPage
        sessionId={pageOptions?.sessionId}
        onBack={() => setCurrentPage('chatbot-sessions')}
        onNavigate={handleNavigate}
      />
    );
  }

  if (currentPage === 'purchase') {
    return (
      <PurchaseCoinsPage
        onBack={() => setCurrentPage('wallet')}
        onCheckout={handleCheckout}
      />
    );
  }

  if (currentPage === 'checkout' && selectedPackage) {
    return (
      <CheckoutPage
        onBack={() => setCurrentPage('purchase')}
        onConfirmPurchase={handleConfirmPurchase}
        packageData={selectedPackage}
      />
    );
  }

  if (currentPage === 'receipt' && selectedPackage) {
    return (
      <ReceiptPage
        onBackToHome={handleBackToHome}
        packageData={selectedPackage}
      />
    );
  }

  if (currentPage === 'support') {
    return (
      <SupportPage
        onNavigateBack={() => setCurrentPage('settings')}
      />
    );
  }

  if (currentPage === 'terms-of-service') {
    return (
      <TermsOfServicePage
        onNavigateBack={() => setCurrentPage('settings')}
      />
    );
  }

  if (currentPage === 'privacy-policy') {
    return (
      <PrivacyPolicyPage
        onNavigateBack={() => setCurrentPage('settings')}
      />
    );
  }

  if (currentPage === 'about') {
    return (
      <AboutPage
        onNavigateBack={() => setCurrentPage('settings')}
      />
    );
  }

  if (currentPage === 'edit-profile') {
    return (
      <EditProfilePage
        onNavigateBack={() => setCurrentPage('settings')}
      />
    );
  }

  if (currentPage === 'change-password') {
    return (
      <ChangePasswordPage
        onNavigateBack={() => setCurrentPage('settings')}
      />
    );
  }

  if (currentPage === 'privacy-security') {
    return (
      <PrivacySecurityPage
        onNavigateBack={() => setCurrentPage('settings')}
        onNavigate={handleNavigate}
      />
    );
  }

  if (currentPage === 'training-hub') {
    return (
      <TrainingHubPage
        onNavigateBack={() => setCurrentPage('home')}
      />
    );
  }

  if (currentPage === 'super-admin') {
    return (
      <SuperAdminDashboard
        onNavigateBack={() => setCurrentPage('home')}
        onNavigate={handleNavigate}
      />
    );
  }

  if (currentPage === 'admin-browser-captures') {
    return (
      <BrowserCaptureList
        onBack={() => setCurrentPage('super-admin')}
        onNavigate={handleNavigate}
      />
    );
  }

  if (currentPage === 'admin-browser-capture-detail') {
    return (
      <BrowserCaptureDetail
        captureId={pageOptions?.captureId}
        onBack={() => setCurrentPage('admin-browser-captures')}
        onNavigate={handleNavigate}
      />
    );
  }

  if (currentPage === 'messages') {
    return (
      <MessagingHubPage
        onNavigateBack={() => setCurrentPage('home')}
        onNavigate={handleNavigate}
      />
    );
  }

  if (currentPage === 'pitch-decks') {
    return (
      <AIPitchDeckPage
        onNavigateToHome={() => setCurrentPage('home')}
        onNavigateToProspects={() => setCurrentPage('prospects')}
        onNavigateToPipeline={() => setCurrentPage('pipeline')}
        onNavigateToMore={() => setMenuOpen(true)}
        onNavigateToPitchDeck={() => setCurrentPage('pitch-decks')}
        onNavigateToMessageSequencer={() => setCurrentPage('messages')}
        onNavigateToRealTimeScan={() => setCurrentPage('scan-entry')}
        onNavigateToDeepScan={() => setCurrentPage('deepscan')}
        onNavigate={handleNavigate}
      />
    );
  }

  if (currentPage === 'scan-library') {
    return (
      <ScanLibraryPage
        onBack={() => setCurrentPage('home')}
        onNavigate={handleNavigate}
      />
    );
  }

  if (currentPage === 'my-captured-data') {
    return (
      <MyCapturedDataPage
        onBack={() => setCurrentPage('home')}
        onNavigate={handleNavigate}
      />
    );
  }

  if (currentPage === 'capture-detail') {
    return (
      <CaptureDetailPage
        captureId={pageOptions?.captureId}
        onBack={() => setCurrentPage('my-captured-data')}
        onNavigate={handleNavigate}
      />
    );
  }

  if (currentPage === 'products-list') {
    return (
      <ProductListPage
        onBack={() => setCurrentPage('home')}
        onNavigate={handleNavigate}
      />
    );
  }

  if (currentPage === 'add-product') {
    return (
      <AddProductPage
        onBack={() => setCurrentPage('products-list')}
        onNavigate={handleNavigate}
      />
    );
  }

  if (currentPage === 'product-analytics') {
    return (
      <ProductAnalyticsPage
        onBack={() => setCurrentPage('products-list')}
      />
    );
  }

  if (currentPage === 'deep-scan') {
    return (
      <DeepScanPage
        onBack={() => setCurrentPage('prospect-detail')}
        onNavigate={handleNavigate}
        prospect={pageOptions?.prospect}
      />
    );
  }

  if (currentPage === 'product-detail') {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-6">
        <div className="bg-white rounded-[24px] p-8 shadow-sm border border-[#E5E7EB] max-w-md text-center">
          <h2 className="text-xl font-bold mb-4">Product Detail Page</h2>
          <p className="text-[#6B7280] mb-6">Coming in Phase 1 - Product Intelligence v6.0</p>
          <button
            onClick={() => setCurrentPage('products-list')}
            className="px-6 py-3 bg-blue-600 text-white rounded-[16px] font-semibold hover:bg-blue-700 transition-colors"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  if (currentPage === 'chatbot-link') {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-6">
        <div className="bg-white rounded-[24px] p-8 shadow-sm border border-[#E5E7EB] max-w-md text-center">
          <h2 className="text-xl font-bold mb-4">Link Product to Chatbot</h2>
          <p className="text-[#6B7280] mb-6">Coming in Omni-Channel Chatbot v6.0</p>
          <button
            onClick={() => setCurrentPage('products-list')}
            className="px-6 py-3 bg-blue-600 text-white rounded-[16px] font-semibold hover:bg-blue-700 transition-colors"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  const userName = profile?.full_name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || 'there';

  return (
    <div className="bg-[#F4F6F8] min-h-screen text-[#1F2937] relative overflow-hidden pb-28">
      <header className="px-6 pt-8 pb-6 bg-white shadow-[0px_8px_24px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-[#1F2937] tracking-tight">
              Good morning, {userName}!
            </h1>
            <p className="text-sm text-[#6B7280] mt-1">Here are your top opportunities today</p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationCenter onNavigate={handleNavigate} />
          </div>        </div>
        <div className="flex items-center gap-3 overflow-x-auto">
          {profile?.subscription_tier && profile.subscription_tier !== 'free' && (
            <button
              onClick={() => handleNavigate('subscription')}
              className={`rounded-full px-4 py-2 flex items-center gap-2 shadow-[0px_8px_24px_rgba(0,0,0,0.06)] shrink-0 ${
                profile.subscription_tier === 'pro'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                  : 'bg-green-600'
              }`}
            >
              {profile.subscription_tier === 'pro' && (
                <Crown className="size-4 text-white" fill="white" />
              )}
              <span className="text-sm font-bold text-white">
                {profile.subscription_tier === 'pro' ? 'Pro' :
                 profile.subscription_tier === 'starter' ? 'Starter' : ''}
              </span>
            </button>
          )}
          <button
            onClick={() => handleNavigate('energy-refill')}
            className="bg-gradient-to-r from-[#DBEAFE] to-[#BFDBFE] rounded-full px-4 py-2 flex items-center gap-2 shadow-[0px_8px_24px_rgba(0,0,0,0.06)] shrink-0 hover:shadow-[0px_8px_32px_rgba(0,0,0,0.12)] transition-shadow"
          >
            <div className="relative">
              <Zap className="size-5 text-[#2563EB]" fill="#2563EB" />
              {energy.current === 0 && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </div>
            <span className="text-sm font-bold text-[#1E40AF]">
              {energy.current}/{energy.max}
            </span>
          </button>
          <button
            onClick={() => handleNavigate('wallet')}
            className="bg-gradient-to-r from-[#FEF3C7] to-[#FDE68A] rounded-full px-4 py-2 flex items-center gap-2 shadow-[0px_8px_24px_rgba(0,0,0,0.06)] shrink-0 hover:shadow-[0px_8px_32px_rgba(0,0,0,0.12)] transition-shadow"
          >
            <Coins className="size-5 text-[#F59E0B]" fill="#F59E0B" />
            <span className="text-sm font-bold text-[#92400E]">{profile?.coin_balance || 0}</span>
          </button>
        </div>
      </header>

      <main className="px-6 space-y-6 mt-6">
        {/* Welcome Card - 3-Step Guided Tour */}
        {chatbotLink && (
          <section className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-[30px] shadow-[0px_8px_24px_rgba(0,0,0,0.08)] border border-[#E5E7EB] overflow-hidden">
            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900 mb-1">
                    Welcome! 🎉 Get Started with Your AI Sales Agent
                  </h3>
                  <p className="text-sm text-gray-600">
                    Follow these 3 simple steps to start running your AI Sales Agent
                  </p>
                </div>
              </div>
              
              {/* 3-Step Guide */}
              <div className="space-y-3">
                {/* Step 1: Test My Chatbot */}
                <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-colors">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 mb-1">Test My Chatbot</h4>
                    <p className="text-xs text-gray-600">Try your AI Sales Agent and see how it works</p>
                  </div>
                  <a
                    href={`${import.meta.env.VITE_APP_URL || 'https://nexscout.co'}/chat/${chatbotLink}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-[#1877F2] text-white font-semibold rounded-lg hover:bg-[#166FE5] transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    {chatbotVerified && (
                      <CheckCircle className="w-4 h-4 text-green-300" />
                    )}
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>

                {/* Step 2: Check AI Instructions */}
                <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-colors">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 mb-1">Check AI Instructions</h4>
                    <p className="text-xs text-gray-600">Configure your AI's knowledge and behavior</p>
                  </div>
                  <button
                    onClick={() => setCurrentPage('chatbot-settings')}
                    className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Step 3: Connect FB Page */}
                <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-colors">
                  <div className="flex-shrink-0 w-8 h-8 bg-pink-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 mb-1">Connect FB Page</h4>
                    <p className="text-xs text-gray-600">Connect your Facebook Page to enable Messenger</p>
                  </div>
                  <button
                    onClick={() => {
                      const isProUser = profile?.subscription_tier === 'pro' || isSuperAdmin;
                      if (isProUser) {
                        const fbAppId = import.meta.env.VITE_FACEBOOK_APP_ID || 'YOUR_FB_APP_ID';
                        const redirectUri = `${window.location.origin}/api/facebook/callback`;
                        const scopes = 'pages_show_list,pages_messaging,pages_manage_metadata,pages_read_engagement';
                        const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${fbAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&state=${user?.id}`;
                        window.location.href = authUrl;
                      }
                    }}
                    disabled={profile?.subscription_tier !== 'pro' && !isSuperAdmin}
                    className={`flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 font-semibold rounded-lg transition-colors relative ${
                      profile?.subscription_tier === 'pro' || isSuperAdmin
                        ? 'bg-white text-[#1877F2] border-2 border-[#1877F2] hover:bg-blue-50 cursor-pointer'
                        : 'bg-[#E4E6EB] text-[#8A8D91] cursor-not-allowed'
                    }`}
                    title={profile?.subscription_tier === 'pro' || isSuperAdmin ? 'Connect your Facebook Page' : 'Pro feature - Upgrade to connect your Facebook Page'}
                  >
                    {profile?.subscription_tier !== 'pro' && !isSuperAdmin && (
                      <Crown className="w-4 h-4 text-amber-500 absolute -top-1 -right-1" />
                    )}
                    <Facebook className="w-4 h-4" />
                    {facebookVerified && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="bg-white rounded-[30px] shadow-[0px_8px_24px_rgba(0,0,0,0.08)] border border-[#E5E7EB] overflow-hidden">
          <div className="p-5 border-b border-[#E5E7EB] flex justify-between items-center">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Users className="size-5 text-[#1877F2]" />
              Top 5 Prospects Today
            </h2>
            <span className="text-xs text-[#6B7280]">{topProspects.length} leads</span>
          </div>
          {prospectsLoading ? (
            <div className="p-8 text-center">
              <div className="inline-block size-6 border-3 border-[#1877F2] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-[#6B7280] mt-2">Loading prospects...</p>
            </div>
          ) : topProspects.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="size-12 text-[#E5E7EB] mx-auto mb-2" />
              <p className="text-sm text-[#6B7280]">No prospects yet</p>
              <p className="text-xs text-[#9CA3AF] mt-1">Start scanning to find prospects!</p>
            </div>
          ) : (
            <div className="divide-y divide-[#E5E7EB]">
              {topProspects.map((prospect) => (
                <div key={prospect.id} className="p-4 flex items-center gap-3">
                  <ProspectAvatar
                    prospect={{
                      id: prospect.id,
                      full_name: prospect.full_name,
                      uploaded_image_url: prospect.uploaded_image_url,
                      social_image_url: prospect.social_image_url,
                      avatar_seed: prospect.avatar_seed
                    }}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-[#1F2937] truncate whitespace-nowrap">{prospect.name}</h3>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getScoreColor(prospect.score)}`}>
                        {prospect.score}
                      </div>
                      {(() => {
                        const temp = getTemperatureIndicator(prospect.score);
                        const TempIcon = temp.icon;
                        return (
                          <div className={`flex items-center gap-1 ${temp.color}`}>
                            <TempIcon className="w-3 h-3" />
                            <span className="text-[10px] font-semibold">{temp.label}</span>
                          </div>
                        );
                      })()}
                    </div>
                    {prospect.analysis && prospect.analysis !== 'No analysis available' && (
                      <p className="text-xs text-[#6B7280] line-clamp-1">
                        {prospect.analysis}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleNavigate('prospect-detail', { prospectId: prospect.id })}
                    className="px-3 py-1.5 bg-[#1877F2] text-white text-xs font-semibold rounded-full shadow-[0px_4px_12px_rgba(24,119,242,0.3)]"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          )}
          {topProspects.length > 0 && (
            <div className="p-4">
              <button
                onClick={() => handleNavigate('prospects')}
                className="w-full py-3 text-sm font-semibold text-[#1877F2] bg-[#EFF6FF] rounded-full border border-[#93C5FD]"
              >
                View all prospects
              </button>
            </div>
          )}
        </section>


        <section className="bg-white rounded-[30px] shadow-[0px_8px_24px_rgba(0,0,0,0.08)] border border-[#E5E7EB]">
          <div className="p-5 border-b border-[#E5E7EB] flex justify-between items-center">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Calendar className="size-5 text-[#1877F2]" />
              Today's Schedule
            </h2>
            <button
              onClick={() => handleNavigate('calendar')}
              className="text-xs font-semibold text-[#1877F2] hover:text-[#1558B0] transition-colors"
            >
              View Calendar →
            </button>
          </div>
          {scheduleLoading ? (
            <div className="p-8 text-center">
              <div className="inline-block size-6 border-3 border-[#1877F2] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-[#6B7280] mt-2">Loading schedule...</p>
            </div>
          ) : (
            <div className="p-5 space-y-3">
              {scheduleEvents.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="size-12 text-[#E5E7EB] mx-auto mb-2" />
                  <p className="text-sm text-[#6B7280]">No events today</p>
                  <p className="text-xs text-[#9CA3AF] mt-1">Your schedule is clear!</p>
                  <button
                    onClick={() => handleNavigate('calendar')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm"
                  >
                    📅 Open Calendar
                  </button>
                </div>
              ) : (
                scheduleEvents.map((event) => (
                  <div 
                    key={event.id} 
                    className="flex items-start gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                    onClick={() => handleNavigate('calendar')}
                  >
                    <div className="text-center shrink-0 w-16">
                      <div className="text-xs text-[#6B7280] font-medium">{formatTime(event.start_time)}</div>
                    </div>
                    <div
                      className={`flex-1 ${
                        event.meeting_type
                          ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200'
                          : event.is_ai_suggested
                          ? 'bg-gradient-to-r from-[#DBEAFE] to-[#BFDBFE] border-[#93C5FD]'
                          : 'bg-[#F4F6F8] border-[#E5E7EB]'
                      } rounded-[16px] p-3 border`}
                    >
                      <p className="text-sm font-semibold text-[#1F2937]">{event.title}</p>
                      <p className="text-xs text-[#6B7280] mt-1">
                        {Math.round((new Date(event.end_time).getTime() - new Date(event.start_time).getTime()) / 60000)} min
                        {event.location && ` • ${event.location}`}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </section>

        <section className="bg-white rounded-[30px] shadow-[0px_8px_24px_rgba(0,0,0,0.08)] border border-[#E5E7EB]">
          <div className="p-5 border-b border-[#E5E7EB] flex justify-between items-center">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Bell className="size-5 text-[#EF4444]" />
              AI Alerts &amp; Reminders
            </h2>
            <button
              onClick={() => handleNavigate('reminders')}
              className="text-xs font-semibold text-[#EF4444] hover:text-[#DC2626] transition-colors"
            >
              View All →
            </button>
          </div>
          {alertsLoading ? (
            <div className="p-8 text-center">
              <div className="inline-block size-6 border-3 border-[#1877F2] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-[#6B7280] mt-2">Loading alerts...</p>
            </div>
          ) : (
            <div className="p-5 space-y-3">
              {aiAlerts.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="size-12 text-[#E5E7EB] mx-auto mb-2" />
                  <p className="text-sm text-[#6B7280]">No alerts</p>
                  <p className="text-xs text-[#9CA3AF] mt-1">You're all caught up!</p>
                </div>
              ) : (
                aiAlerts.map((alert) => {
                  const colors = alert.icon ? { bg: 'from-blue-50 to-purple-50', border: 'border-blue-200', icon: 'text-blue-600' } : getAlertColor(alert.priority);
                  return (
                    <div
                      key={alert.id}
                      className={`bg-gradient-to-r ${colors.bg} rounded-[20px] p-4 border ${colors.border} flex items-start gap-3 ${alert.action ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
                      onClick={() => alert.action && alert.action()}
                    >
                      {/* Icon rendering */}
                      {alert.icon ? (
                        <span className="text-2xl shrink-0 mt-0.5">{alert.icon}</span>
                      ) : alert.alert_type === 'cold_prospect' ? (
                        <AlertCircle className={`size-5 ${colors.icon} shrink-0 mt-0.5`} />
                      ) : alert.alert_type === 'timing_suggestion' ? (
                        <Sparkles className={`size-5 ${colors.icon} shrink-0 mt-0.5`} />
                      ) : (alert.alert_type === 'hot_prospect' || alert.alert_type === 'opportunity') ? (
                        <Coins className={`size-5 ${colors.icon} shrink-0 mt-0.5`} />
                      ) : (
                        <Bell className={`size-5 ${colors.icon} shrink-0 mt-0.5`} />
                      )}
                      
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-[#1F2937]">{alert.title}</p>
                        <p className="text-xs text-[#6B7280] mt-1">{alert.message}</p>
                        {alert.actionLabel && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (alert.action) alert.action();
                            }}
                            className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-semibold"
                          >
                            {alert.actionLabel} →
                          </button>
                        )}
                      </div>
                      
                      {alert.id && typeof alert.id === 'string' && !alert.id.startsWith('meeting-') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDismissAlert(alert.id);
                          }}
                          className="text-[#9CA3AF] hover:text-[#6B7280] shrink-0"
                        >
                          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </section>

        <section className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            <h2 className="font-semibold text-base text-gray-900 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-[#1877F2]" />
              Today's Tasks
            </h2>
            <button
              onClick={() => handleNavigate('todos')}
              className="text-xs font-medium text-[#1877F2] hover:underline"
            >
              See All
            </button>
          </div>
          {tasksLoading ? (
            <div className="p-6 text-center">
              <div className="inline-block w-6 h-6 border-3 border-[#1877F2] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div>
              {tasks.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <CheckSquare className="w-12 h-12 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No tasks yet</p>
                  <button
                    onClick={handleGenerateTasks}
                    disabled={generatingTasks}
                    className="mt-3 text-xs text-[#1877F2] font-medium hover:underline disabled:opacity-50"
                  >
                    {generatingTasks ? 'Generating...' : 'Generate AI tasks'}
                  </button>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-gray-100">
                    {tasks.slice(0, 4).map((task) => (
                      <div
                        key={task.id}
                        onClick={() => handleTaskClick(task)}
                        className={`px-4 py-3 ${task.linked_page ? 'cursor-pointer hover:bg-gray-50' : ''} transition-colors`}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCompleteTask(task.id);
                            }}
                            className="mt-0.5 w-5 h-5 rounded border-2 border-[#1877F2] bg-white flex items-center justify-center shrink-0 hover:bg-[#1877F2] transition-colors group"
                          >
                            <svg className="w-3 h-3 text-transparent group-hover:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  {(task.source === 'missions' || task.task_type === 'ai_suggested' || task.task_type === 'ai_generated') && (
                                    <Sparkles className="w-3.5 h-3.5 text-[#1877F2] flex-shrink-0" />
                                  )}
                                  <p className="text-sm text-gray-900 font-medium line-clamp-1">{task.title}</p>
                                </div>
                                {task.description && (
                                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{task.description}</p>
                                )}
                              </div>
                              {task.reward_coins && (
                                <span className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0">
                                  <Coins className="w-3 h-3" />
                                  {task.reward_coins}
                                </span>
                              )}
                            </div>
                            {task.current_progress !== undefined && task.total_required && (
                              <div className="mt-2">
                                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                  <span>{task.current_progress}/{task.total_required}</span>
                                  <span>{Math.round((task.current_progress / task.total_required) * 100)}%</span>
                                </div>
                                <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-[#1877F2] rounded-full transition-all"
                                    style={{
                                      width: `${(task.current_progress / task.total_required) * 100}%`
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {tasks.length > 4 && (
                    <div className="px-4 py-2 bg-gray-50 text-center border-t border-gray-100">
                      <button
                        onClick={() => handleNavigate('todos')}
                        className="text-xs text-gray-600 hover:text-gray-900 font-medium"
                      >
                        +{tasks.length - 4} more tasks
                      </button>
                    </div>
                  )}
                  <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                    <button
                      onClick={handleGenerateTasks}
                      disabled={generatingTasks}
                      className="w-full bg-white border border-gray-300 text-gray-700 py-2 rounded-lg font-medium text-sm hover:bg-gray-50 flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                    >
                      {generatingTasks ? (
                        <div className="inline-block w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Sparkles className="w-4 h-4 text-[#1877F2]" />
                      )}
                      {generatingTasks ? 'Generating...' : 'Generate tasks with AI'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </section>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 w-full bg-white/95 backdrop-blur-xl border-t border-[#E5E7EB] z-50 shadow-[0px_-8px_24px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between px-6 h-[72px]">
          <button className="flex flex-col items-center gap-1 text-[#1877F2]">
            <Home className="size-6" />
            <span className="text-[10px] font-medium">Home</span>
          </button>
          <button
            onClick={() => handleNavigate('prospects')}
            className="flex flex-col items-center gap-1 text-[#6B7280] relative"
          >
            <div className="relative">
              <Users className="size-6" />
              <NotificationBadge count={notificationCounts.newProspects} />
            </div>
            <span className="text-[10px] font-medium">Prospects</span>
          </button>
          <button
            onClick={() => handleNavigate('chatbot-sessions')}
            className="relative -top-6 bg-[#1877F2] text-white size-14 rounded-full shadow-[0px_8px_24px_rgba(24,119,242,0.4)] flex items-center justify-center border-4 border-white transition-transform active:scale-95"
          >
            <MessageSquare className="size-7" />
            {notificationCounts.newChats > 0 && (
              <div className="absolute -top-1 -right-1 min-w-[20px] h-[20px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1.5 border-2 border-white shadow-sm">
                {notificationCounts.newChats > 99 ? '99+' : notificationCounts.newChats}
              </div>
            )}
          </button>
          <button
            onClick={() => handleNavigate('pipeline')}
            className="flex flex-col items-center gap-1 text-[#6B7280] relative"
          >
            <div className="relative">
              <TrendingUp className="size-6" />
              <NotificationBadge count={notificationCounts.pipelineUpdates} />
            </div>
            <span className="text-[10px] font-medium">Pipeline</span>
          </button>
          <button
            onClick={() => setMenuOpen(true)}
            className="flex flex-col items-center gap-1 text-[#6B7280]"
          >
            <MoreHorizontal className="size-6" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>

<ActionPopup
          isOpen={showActionPopup}
          onClose={() => setShowActionPopup(false)}
          onNavigateToPitchDeck={onNavigateToPitchDeck}
          onNavigateToMessageSequencer={onNavigateToMessageSequencer}
          onNavigateToRealTimeScan={onNavigateToRealTimeScan}
          onNavigateToDeepScan={onNavigateToDeepScan}
        />
      </nav>

      <SlideInMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={handleNavigate}
      />
    </div>
  );
}
