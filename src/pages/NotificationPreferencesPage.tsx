import { useState, useEffect } from 'react';
import { ArrowLeft, Bell, Mail, MessageSquare, Calendar, Zap, Coins, Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface NotificationPreferencesPageProps {
  onBack: () => void;
}

interface Preferences {
  push_notifications: boolean;
  email_reminders: boolean;
  sms_reminders: boolean;
  daily_summary: boolean;
  weekly_recap: boolean;
  reminder_notifications: boolean;
  hot_lead_alerts: boolean;
  chatbot_alerts: boolean;
  scan_complete_alerts: boolean;
  event_reminders: boolean;
  missed_follow_up_alerts: boolean;
  ai_task_notifications: boolean;
  energy_alerts: boolean;
  coin_alerts: boolean;
}

export default function NotificationPreferencesPage({ onBack }: NotificationPreferencesPageProps) {
  const { user, profile } = useAuth();
  const [preferences, setPreferences] = useState<Preferences>({
    push_notifications: true,
    email_reminders: false,
    sms_reminders: false,
    daily_summary: true,
    weekly_recap: true,
    reminder_notifications: true,
    hot_lead_alerts: true,
    chatbot_alerts: true,
    scan_complete_alerts: true,
    event_reminders: true,
    missed_follow_up_alerts: true,
    ai_task_notifications: true,
    energy_alerts: true,
    coin_alerts: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isPro = profile?.subscription_tier === 'pro';

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user]);

  async function loadPreferences() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data?.notification_preferences) {
        setPreferences({ ...preferences, ...data.notification_preferences });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ notification_preferences: preferences })
        .eq('id', user.id);

      if (error) throw error;

      alert('Preferences saved successfully!');
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  }

  function handleToggle(key: keyof Preferences) {
    if (key === 'email_reminders' && !isPro) {
      alert('Email reminders are available for Pro and Elite members');
      return;
    }

    if (key === 'sms_reminders' && !isPro) {
      alert('SMS reminders are available for Elite members only');
      return;
    }

    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center">
        <div className="size-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8] pb-24">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <button onClick={onBack} className="size-10 rounded-full bg-gray-100 flex items-center justify-center">
              <ArrowLeft className="size-5 text-gray-700" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Notification Preferences</h1>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-white transition-colors ${
                saving ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <Save className="size-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </header>

      <main className="px-6 py-6 space-y-6">
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Bell className="size-5 text-blue-600" />
              Delivery Channels
            </h2>
            <p className="text-sm text-gray-600 mt-1">Choose how you want to receive notifications</p>
          </div>

          <div className="divide-y divide-gray-200">
            <ToggleItem
              icon={Bell}
              title="Push Notifications"
              description="In-app notifications (Free)"
              checked={preferences.push_notifications}
              onChange={() => handleToggle('push_notifications')}
              locked={false}
            />

            <ToggleItem
              icon={Mail}
              title="Email Reminders"
              description="Receive reminders via email (Pro/Elite)"
              checked={preferences.email_reminders}
              onChange={() => handleToggle('email_reminders')}
              locked={!isPro}
              badge={!isPro ? 'Pro' : undefined}
            />

            <ToggleItem
              icon={MessageSquare}
              title="SMS Reminders"
              description="Get SMS alerts for urgent items (Elite)"
              checked={preferences.sms_reminders}
              onChange={() => handleToggle('sms_reminders')}
              locked={!isPro}
              badge={!isPro ? 'Pro' : undefined}
            />
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
            <h2 className="font-bold text-gray-900">Summaries & Digests</h2>
            <p className="text-sm text-gray-600 mt-1">Periodic activity summaries</p>
          </div>

          <div className="divide-y divide-gray-200">
            <ToggleItem
              icon={Calendar}
              title="Daily Summary"
              description="Morning recap of today's tasks and priorities"
              checked={preferences.daily_summary}
              onChange={() => handleToggle('daily_summary')}
            />

            <ToggleItem
              icon={Calendar}
              title="Weekly Recap"
              description="Sunday summary of the week ahead"
              checked={preferences.weekly_recap}
              onChange={() => handleToggle('weekly_recap')}
            />
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
            <h2 className="font-bold text-gray-900">Productivity Alerts</h2>
            <p className="text-sm text-gray-600 mt-1">Reminders, tasks, and calendar events</p>
          </div>

          <div className="divide-y divide-gray-200">
            <ToggleItem
              icon={Bell}
              title="Reminder Notifications"
              description="Alert when reminders are due"
              checked={preferences.reminder_notifications}
              onChange={() => handleToggle('reminder_notifications')}
            />

            <ToggleItem
              icon={Calendar}
              title="Event Reminders"
              description="15-minute warning before calendar events"
              checked={preferences.event_reminders}
              onChange={() => handleToggle('event_reminders')}
            />

            <ToggleItem
              icon={Bell}
              title="AI Task Notifications"
              description="When AI creates new tasks for you"
              checked={preferences.ai_task_notifications}
              onChange={() => handleToggle('ai_task_notifications')}
            />

            <ToggleItem
              icon={Bell}
              title="Missed Follow-Up Alerts"
              description="Notify about overdue follow-ups"
              checked={preferences.missed_follow_up_alerts}
              onChange={() => handleToggle('missed_follow_up_alerts')}
            />
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
            <h2 className="font-bold text-gray-900">Prospect Activity</h2>
            <p className="text-sm text-gray-600 mt-1">Hot leads and prospect engagement</p>
          </div>

          <div className="divide-y divide-gray-200">
            <ToggleItem
              icon={Bell}
              title="Hot Lead Alerts"
              description="Immediate alerts for high-value prospects"
              checked={preferences.hot_lead_alerts}
              onChange={() => handleToggle('hot_lead_alerts')}
            />

            <ToggleItem
              icon={MessageSquare}
              title="Chatbot Alerts"
              description="When prospects message your AI chatbot"
              checked={preferences.chatbot_alerts}
              onChange={() => handleToggle('chatbot_alerts')}
            />

            <ToggleItem
              icon={Bell}
              title="Scan Complete Alerts"
              description="Notify when prospect scans finish"
              checked={preferences.scan_complete_alerts}
              onChange={() => handleToggle('scan_complete_alerts')}
            />
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
            <h2 className="font-bold text-gray-900">System Alerts</h2>
            <p className="text-sm text-gray-600 mt-1">Energy and coin balance notifications</p>
          </div>

          <div className="divide-y divide-gray-200">
            <ToggleItem
              icon={Zap}
              title="Energy Alerts"
              description="Low energy and refill reminders"
              checked={preferences.energy_alerts}
              onChange={() => handleToggle('energy_alerts')}
            />

            <ToggleItem
              icon={Coins}
              title="Coin Alerts"
              description="Low balance and earning opportunities"
              checked={preferences.coin_alerts}
              onChange={() => handleToggle('coin_alerts')}
            />
          </div>
        </section>

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <p className="text-sm text-blue-900">
            <strong>Tip:</strong> You can always adjust these settings later. We recommend keeping hot lead alerts enabled to never miss opportunities!
          </p>
        </div>
      </main>
    </div>
  );
}

interface ToggleItemProps {
  icon: any;
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  locked?: boolean;
  badge?: string;
}

function ToggleItem({ icon: Icon, title, description, checked, onChange, locked, badge }: ToggleItemProps) {
  return (
    <div className="px-6 py-4 flex items-center justify-between">
      <div className="flex items-start gap-3 flex-1">
        <div className="size-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-1">
          <Icon className="size-5 text-gray-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900">{title}</h3>
            {badge && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                {badge}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>

      <button
        onClick={onChange}
        disabled={locked}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
          locked
            ? 'bg-gray-300 cursor-not-allowed'
            : checked
            ? 'bg-blue-600'
            : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block size-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
