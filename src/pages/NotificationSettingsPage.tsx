import { useState, useEffect } from 'react';
import { ArrowLeft, Bell, Mail, Smartphone, Clock, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { notificationService, NotificationSettings } from '../services/notifications/notificationService';

interface NotificationSettingsPageProps {
  onBack: () => void;
}

export default function NotificationSettingsPage({ onBack }: NotificationSettingsPageProps) {
  const { profile } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [profile?.id]);

  const loadSettings = async () => {
    if (!profile?.id) return;

    setLoading(true);
    const result = await notificationService.getSettings(profile.id);
    if (result.success && result.settings) {
      setSettings(result.settings);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!profile?.id || !settings) return;

    setSaving(true);
    await notificationService.updateSettings(profile.id, settings);
    setSaving(false);
    setSaved(true);

    setTimeout(() => setSaved(false), 2000);
  };

  const handleToggle = (key: keyof NotificationSettings) => {
    if (!settings) return;

    setSettings({
      ...settings,
      [key]: !settings[key],
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!settings) {
    return <div>Error loading settings</div>;
  }

  const notificationTypes = [
    {
      key: 'enable_hot_lead' as const,
      icon: '🔥',
      title: 'Hot Lead Alerts',
      description: 'Get notified when new HOT prospects are detected',
    },
    {
      key: 'enable_followup' as const,
      icon: '🕒',
      title: 'Follow-Up Reminders',
      description: 'Reminders for scheduled prospect follow-ups',
    },
    {
      key: 'enable_sequences' as const,
      icon: '📨',
      title: 'Sequence Actions',
      description: 'Notifications for multi-step message sequences',
    },
    {
      key: 'enable_missions' as const,
      icon: '🎯',
      title: 'Mission Alerts',
      description: 'Reminders for daily missions and goals',
    },
    {
      key: 'enable_weekly_reports' as const,
      icon: '📊',
      title: 'Weekly Reports',
      description: 'Weekly performance summaries',
    },
    {
      key: 'enable_streak_reminders' as const,
      icon: '⭐',
      title: 'Streak Reminders',
      description: 'Daily reminders to maintain your activity streak',
    },
    {
      key: 'enable_ai_insights' as const,
      icon: '🧠',
      title: 'AI Insights',
      description: 'Smart recommendations from the AI engine',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-[#1877F2] to-[#1EC8FF] text-white sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-6">
          <button
            onClick={onBack}
            className="flex items-center justify-center size-10 hover:bg-white/20 rounded-xl transition-colors mb-4"
          >
            <ArrowLeft className="size-5" />
          </button>

          <div>
            <h1 className="text-3xl font-bold mb-2">Notification Settings</h1>
            <p className="text-white/90">Customize your notification preferences</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <section className="bg-white rounded-3xl p-6 border border-gray-200 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#1877F2]" />
            Delivery Methods
          </h2>

          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl cursor-pointer hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Push Notifications</div>
                  <div className="text-sm text-gray-600">Receive notifications on your device</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.push_enabled}
                onChange={() => handleToggle('push_enabled')}
                className="w-12 h-6 appearance-none bg-gray-300 rounded-full relative cursor-pointer transition-colors checked:bg-blue-500 before:content-[''] before:absolute before:w-5 before:h-5 before:bg-white before:rounded-full before:top-0.5 before:left-0.5 before:transition-transform checked:before:translate-x-6"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl cursor-pointer hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Email Notifications</div>
                  <div className="text-sm text-gray-600">Receive important alerts via email</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.email_enabled}
                onChange={() => handleToggle('email_enabled')}
                className="w-12 h-6 appearance-none bg-gray-300 rounded-full relative cursor-pointer transition-colors checked:bg-blue-500 before:content-[''] before:absolute before:w-5 before:h-5 before:bg-white before:rounded-full before:top-0.5 before:left-0.5 before:transition-transform checked:before:translate-x-6"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl cursor-pointer hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Daily Digest</div>
                  <div className="text-sm text-gray-600">Receive a daily summary email</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.daily_digest}
                onChange={() => handleToggle('daily_digest')}
                className="w-12 h-6 appearance-none bg-gray-300 rounded-full relative cursor-pointer transition-colors checked:bg-blue-500 before:content-[''] before:absolute before:w-5 before:h-5 before:bg-white before:rounded-full before:top-0.5 before:left-0.5 before:transition-transform checked:before:translate-x-6"
              />
            </label>
          </div>
        </section>

        <section className="bg-white rounded-3xl p-6 border border-gray-200 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Notification Types</h2>

          <div className="space-y-3">
            {notificationTypes.map((type) => (
              <label
                key={type.key}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{type.icon}</div>
                  <div>
                    <div className="font-semibold text-gray-900">{type.title}</div>
                    <div className="text-sm text-gray-600">{type.description}</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings[type.key]}
                  onChange={() => handleToggle(type.key)}
                  className="w-12 h-6 appearance-none bg-gray-300 rounded-full relative cursor-pointer transition-colors checked:bg-blue-500 before:content-[''] before:absolute before:w-5 before:h-5 before:bg-white before:rounded-full before:top-0.5 before:left-0.5 before:transition-transform checked:before:translate-x-6"
                />
              </label>
            ))}
          </div>
        </section>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-gradient-to-r from-[#1877F2] to-[#1EC8FF] text-white font-bold py-4 rounded-2xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saved ? (
            <>
              <Check className="w-5 h-5" />
              <span>Saved!</span>
            </>
          ) : saving ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <span>Save Settings</span>
          )}
        </button>
      </main>
    </div>
  );
}
