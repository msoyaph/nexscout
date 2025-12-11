import { useState, useEffect } from 'react';
import { ArrowLeft, User, Lock, Shield, Crown, FileText, HelpCircle, Info, LogOut, Coins, Settings, Building2, Sparkles, MessageCircle, Phone, Instagram } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { OperatingModeSelector } from '../components/settings/OperatingModeSelector';
import { supabase } from '../lib/supabase';

interface SettingsPageProps {
  onBack: () => void;
  onNavigate?: (page: string) => void;
}

export default function SettingsPage({ onBack, onNavigate }: SettingsPageProps) {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [aiSuggestions, setAiSuggestions] = useState(false);
  const [lightMode, setLightMode] = useState(true);
  const [linkedin, setLinkedin] = useState(true);
  const [twitter, setTwitter] = useState(false);
  const [facebook, setFacebook] = useState(false);
  const [facebookConnected, setFacebookConnected] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showFbDisconnectConfirm, setShowFbDisconnectConfirm] = useState(false);

  // SuperAdmin check - only geoffmax22@gmail.com can see development features
  const isSuperAdmin = user?.email === 'geoffmax22@gmail.com';

  // Load notification preferences and Facebook connection status from database
  useEffect(() => {
    if (user && profile) {
      loadNotificationPreferences();
      checkFacebookConnection();
    }
  }, [user, profile]);

  const loadNotificationPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data?.notification_preferences) {
        const prefs = data.notification_preferences;
        if (typeof prefs.push_notifications === 'boolean') {
          setPushNotifications(prefs.push_notifications);
        }
        if (typeof prefs.email_notifications === 'boolean') {
          setEmailNotifications(prefs.email_notifications);
        }
        if (typeof prefs.ai_suggestions === 'boolean') {
          setAiSuggestions(prefs.ai_suggestions);
        }
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
  };

  const saveNotificationPreferences = async (key: string, value: boolean) => {
    if (!user || saving) return;

    setSaving(true);
    try {
      // Get current preferences
      const { data: currentData } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('id', user.id)
        .maybeSingle();

      const currentPrefs = currentData?.notification_preferences || {};
      const updatedPrefs = {
        ...currentPrefs,
        [key]: value,
      };

      const { error } = await supabase
        .from('profiles')
        .update({ notification_preferences: updatedPrefs })
        .eq('id', user.id);

      if (error) throw error;

      // Refresh profile to get updated data
      await refreshProfile();
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      // Revert the toggle on error
      if (key === 'push_notifications') setPushNotifications(!value);
      if (key === 'email_notifications') setEmailNotifications(!value);
      if (key === 'ai_suggestions') setAiSuggestions(!value);
    } finally {
      setSaving(false);
    }
  };

  const checkFacebookConnection = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('facebook_page_connections')
        .select('page_id, page_name')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (data) {
        setFacebookConnected(true);
        setFacebook(true);
      } else {
        setFacebookConnected(false);
        setFacebook(false);
      }
    } catch (error) {
      console.error('Error checking Facebook connection:', error);
    }
  };

  const handleFacebookToggle = () => {
    if (facebook && facebookConnected) {
      // Show confirmation when disconnecting
      setShowFbDisconnectConfirm(true);
    } else {
      // Connect Facebook - navigate to onboarding or Facebook connect page
      handleFacebookConnect();
    }
  };

  const handleFacebookDisconnect = async () => {
    if (!user) return;

    try {
      // Deactivate Facebook connection
      const { error } = await supabase
        .from('facebook_page_connections')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) throw error;

      setFacebookConnected(false);
      setFacebook(false);
      setShowFbDisconnectConfirm(false);
    } catch (error) {
      console.error('Error disconnecting Facebook:', error);
      alert('Failed to disconnect Facebook. Please try again.');
    }
  };

  const handleFacebookConnect = () => {
    const fbAppId = import.meta.env.VITE_FACEBOOK_APP_ID;
    if (!fbAppId) {
      alert('Facebook App ID is not configured. Please contact support.');
      return;
    }

    // Use Edge Function URL as redirect URI (not frontend route)
    // Normalize URL to ensure HTTPS and no double slashes
    let supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    // Ensure HTTPS
    if (supabaseUrl.startsWith('http://')) {
      supabaseUrl = supabaseUrl.replace('http://', 'https://');
    } else if (!supabaseUrl.startsWith('https://')) {
      supabaseUrl = `https://${supabaseUrl}`;
    }
    // Remove trailing slash to prevent double slashes
    supabaseUrl = supabaseUrl.replace(/\/+$/, '');
    const redirectUri = `${supabaseUrl}/functions/v1/facebook-oauth-callback`;
    const scopes = 'pages_show_list,pages_messaging,pages_manage_metadata,pages_read_engagement';
    
    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${fbAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&state=${user?.id || ''}`;
    
    console.log('[Facebook OAuth] Starting OAuth flow:', {
      appId: fbAppId,
      redirectUri,
      userId: user?.id
    });
    
    window.location.href = authUrl;
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`w-11 h-6 rounded-full flex items-center p-0.5 transition-colors ${
        enabled ? 'bg-nexscout-blue' : 'bg-gray-300'
      }`}
    >
      <div
        className={`size-5 bg-white rounded-full shadow-sm transition-transform ${
          enabled ? 'ml-auto' : ''
        }`}
      />
    </button>
  );

  return (
    <div className="bg-gray-50 min-h-screen text-gray-900 pb-28">
      <header className="px-6 pt-8 pb-6 bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center justify-center size-11 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="size-6 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Settings</h1>
          <div className="size-11" />
        </div>
      </header>

      <main className="px-6 space-y-6 mt-6">
        <section className="bg-white rounded-[30px] shadow-lg p-5">
          <div className="flex items-center gap-4">
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`}
              alt="Profile"
              className="size-16 rounded-full border-2 border-gray-200"
            />
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">
                {profile?.full_name || 'User'}
              </h2>
              <p className="text-sm text-gray-600">{user?.email}</p>
            </div>
            {(() => {
              const tier = profile?.subscription_tier || 'free';
              const tierConfig = {
                free: { 
                  label: 'Free Plan', 
                  bg: 'from-gray-100 to-gray-200', 
                  text: 'text-gray-900' 
                },
                pro: { 
                  label: 'Pro Plan', 
                  bg: 'from-blue-100 to-blue-200', 
                  text: 'text-blue-900' 
                },
                elite: { 
                  label: 'Elite Plan', 
                  bg: 'from-purple-100 to-purple-200', 
                  text: 'text-purple-900' 
                },
                team: { 
                  label: 'Team Plan', 
                  bg: 'from-green-100 to-green-200', 
                  text: 'text-green-900' 
                },
                enterprise: { 
                  label: 'Enterprise', 
                  bg: 'from-amber-100 to-amber-200', 
                  text: 'text-amber-900' 
                },
              };
              const config = tierConfig[tier as keyof typeof tierConfig] || tierConfig.free;
              
              return (
                <div className={`bg-gradient-to-r ${config.bg} px-3 py-1.5 rounded-full`}>
                  <span className={`text-xs font-semibold ${config.text}`}>{config.label}</span>
                </div>
              );
            })()}
          </div>
        </section>

        <OperatingModeSelector />

        <section className="bg-white rounded-[30px] shadow-lg">
          <div className="p-5 border-b border-gray-200">
            <h2 className="font-bold text-base text-gray-900">Profile</h2>
            <p className="text-xs text-gray-600 mt-1">Manage your account information</p>
          </div>
          <div className="divide-y divide-gray-200">
            {isSuperAdmin && (
              <button
                onClick={() => onNavigate?.('about-my-company')}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Building2 className="size-5 text-cyan-600" />
                  <div className="text-left">
                    <div className="text-sm font-semibold text-gray-900">About My Company</div>
                    <div className="text-xs text-gray-500">Company Intelligence Engine & AI profile</div>
                  </div>
                </div>
                <ArrowLeft className="size-5 text-gray-600 rotate-180" />
              </button>
            )}
            {isSuperAdmin && (
              <button
                onClick={() => onNavigate?.('personal-about')}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <User className="size-5 text-blue-600" />
                  <div className="text-left">
                    <div className="text-sm font-semibold text-gray-900">Personal About Me</div>
                    <div className="text-xs text-gray-500">AI-generated profile & coaching</div>
                  </div>
                </div>
                <ArrowLeft className="size-5 text-gray-600 rotate-180" />
              </button>
            )}
            <button
              onClick={() => onNavigate?.('edit-profile')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <User className="size-5 text-gray-600" />
                <span className="text-sm text-gray-900">Edit Profile</span>
              </div>
              <ArrowLeft className="size-5 text-gray-600 rotate-180" />
            </button>
            <button
              onClick={() => onNavigate?.('change-password')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Lock className="size-5 text-gray-600" />
                <span className="text-sm text-gray-900">Change Password</span>
              </div>
              <ArrowLeft className="size-5 text-gray-600 rotate-180" />
            </button>
            <button
              onClick={() => onNavigate?.('privacy-security')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Shield className="size-5 text-gray-600" />
                <span className="text-sm text-gray-900">Privacy & Security</span>
              </div>
              <ArrowLeft className="size-5 text-gray-600 rotate-180" />
            </button>
          </div>
        </section>

        <section className="bg-white rounded-[30px] shadow-lg">
          <div className="p-5 border-b border-gray-200">
            <h2 className="font-bold text-base text-gray-900">Connected Accounts</h2>
            <p className="text-xs text-gray-600 mt-1">Manage your social connections</p>
          </div>
          <div className="divide-y divide-gray-200">
            {/* LinkedIn - Locked */}
            <div className="flex items-center justify-between p-4 opacity-60">
              <div className="flex items-center gap-3">
                <div className="size-5 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">in</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-900">LinkedIn</p>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Coming Soon
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">Not available</p>
                </div>
              </div>
              <div className="w-11 h-6 rounded-full bg-gray-300 flex items-center p-0.5 opacity-50 cursor-not-allowed">
                <div className="size-5 bg-white rounded-full shadow-sm" />
              </div>
            </div>

            {/* X (Twitter) - Locked */}
            <div className="flex items-center justify-between p-4 opacity-60">
              <div className="flex items-center gap-3">
                <div className="size-5 rounded-full bg-black flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">X</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-900">X (Twitter)</p>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Coming Soon
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">Not available</p>
                </div>
              </div>
              <div className="w-11 h-6 rounded-full bg-gray-300 flex items-center p-0.5 opacity-50 cursor-not-allowed">
                <div className="size-5 bg-white rounded-full shadow-sm" />
              </div>
            </div>

            {/* Facebook - Wired */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="size-5 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">f</span>
                </div>
                <div>
                  <p className="text-sm text-gray-900">Facebook</p>
                  <p className="text-xs text-gray-600">
                    {facebookConnected ? 'Connected' : 'Not connected'}
                  </p>
                </div>
              </div>
              <Toggle enabled={facebook} onChange={handleFacebookToggle} />
            </div>

            {/* WhatsApp - Locked */}
            <div className="flex items-center justify-between p-4 opacity-60">
              <div className="flex items-center gap-3">
                <div className="size-5 rounded-full bg-green-500 flex items-center justify-center">
                  <MessageCircle className="w-3 h-3 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-900">WhatsApp</p>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Coming Soon
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">Not available</p>
                </div>
              </div>
              <div className="w-11 h-6 rounded-full bg-gray-300 flex items-center p-0.5 opacity-50 cursor-not-allowed">
                <div className="size-5 bg-white rounded-full shadow-sm" />
              </div>
            </div>

            {/* Viber - Locked */}
            <div className="flex items-center justify-between p-4 opacity-60">
              <div className="flex items-center gap-3">
                <div className="size-5 rounded-full bg-purple-500 flex items-center justify-center">
                  <MessageCircle className="w-3 h-3 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-900">Viber</p>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Coming Soon
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">Not available</p>
                </div>
              </div>
              <div className="w-11 h-6 rounded-full bg-gray-300 flex items-center p-0.5 opacity-50 cursor-not-allowed">
                <div className="size-5 bg-white rounded-full shadow-sm" />
              </div>
            </div>

            {/* SMS - Locked */}
            <div className="flex items-center justify-between p-4 opacity-60">
              <div className="flex items-center gap-3">
                <div className="size-5 rounded-full bg-blue-400 flex items-center justify-center">
                  <Phone className="w-3 h-3 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-900">SMS</p>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Coming Soon
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">Not available</p>
                </div>
              </div>
              <div className="w-11 h-6 rounded-full bg-gray-300 flex items-center p-0.5 opacity-50 cursor-not-allowed">
                <div className="size-5 bg-white rounded-full shadow-sm" />
              </div>
            </div>

            {/* Instagram - Locked */}
            <div className="flex items-center justify-between p-4 opacity-60">
              <div className="flex items-center gap-3">
                <div className="size-5 rounded-full bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 flex items-center justify-center">
                  <Instagram className="w-3 h-3 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-900">Instagram</p>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Coming Soon
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">Not available</p>
                </div>
              </div>
              <div className="w-11 h-6 rounded-full bg-gray-300 flex items-center p-0.5 opacity-50 cursor-not-allowed">
                <div className="size-5 bg-white rounded-full shadow-sm" />
              </div>
            </div>
          </div>
        </section>

        {/* Facebook Disconnect Confirmation Modal */}
        {showFbDisconnectConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Disconnect Facebook?</h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure? Your chatbot will disconnect and you'll need to reconnect a Facebook page to use this feature again.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowFbDisconnectConfirm(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFacebookDisconnect}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
                >
                  Disconnect
                </button>
              </div>
            </div>
          </div>
        )}

        <section className="bg-white rounded-[30px] shadow-lg">
          <div className="p-5 border-b border-gray-200">
            <h2 className="font-bold text-base text-gray-900">Subscription</h2>
            <p className="text-xs text-gray-600 mt-1">Manage your plan and billing</p>
          </div>
          <div className="p-4">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-[20px] p-4 border border-blue-200">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {(profile?.subscription_tier === 'pro' || profile?.subscription_tier === 'elite' || profile?.subscription_tier === 'team' || profile?.subscription_tier === 'enterprise') && (
                      <Crown className="size-4 text-[#F59E0B]" fill="#F59E0B" />
                    )}
                    <h3 className="text-sm font-semibold text-gray-900">
                      {(() => {
                        const tier = profile?.subscription_tier || 'free';
                        const tierLabels: Record<string, string> = {
                          free: 'Free Plan',
                          pro: 'Pro Plan',
                          elite: 'Elite Plan',
                          team: 'Team Plan',
                          enterprise: 'Enterprise Plan',
                        };
                        return tierLabels[tier] || 'Free Plan';
                      })()}
                    </h3>
                  </div>
                  {profile?.monthly_coin_bonus && profile.monthly_coin_bonus > 0 ? (
                    <div className="flex items-center gap-1 mt-1">
                      <Coins className="size-3 text-[#F59E0B]" />
                      <p className="text-xs text-gray-600">+{profile.monthly_coin_bonus} coins/month</p>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-600 mt-1">Basic features</p>
                  )}
                </div>
              </div>
              {profile?.subscription_end_date && (
                <p className="text-xs text-gray-600 mb-3">
                  Renews: {new Date(profile.subscription_end_date).toLocaleDateString()}
                </p>
              )}
              <button
                onClick={() => onNavigate?.('manage-subscription')}
                className="w-full bg-nexscout-blue text-white py-2.5 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transition-shadow"
              >
                Manage Your Plan & Billing
              </button>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-[30px] shadow-lg">
          <div className="p-5 border-b border-gray-200">
            <h2 className="font-bold text-base text-gray-900">Notifications</h2>
            <p className="text-xs text-gray-600 mt-1">Control your notification preferences</p>
          </div>
          <div className="divide-y divide-gray-200">
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm text-gray-900">Push Notifications</p>
                <p className="text-xs text-gray-600 mt-0.5">Receive alerts on your device</p>
              </div>
              <Toggle 
                enabled={pushNotifications} 
                onChange={() => {
                  const newValue = !pushNotifications;
                  setPushNotifications(newValue);
                  saveNotificationPreferences('push_notifications', newValue);
                }} 
              />
            </div>
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm text-gray-900">Email Notifications</p>
                <p className="text-xs text-gray-600 mt-0.5">Get updates via email</p>
              </div>
              <Toggle 
                enabled={emailNotifications} 
                onChange={() => {
                  const newValue = !emailNotifications;
                  setEmailNotifications(newValue);
                  saveNotificationPreferences('email_notifications', newValue);
                }} 
              />
            </div>
            <div className={`flex items-center justify-between p-4 ${!isSuperAdmin ? 'opacity-60' : ''}`}>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm text-gray-900">AI Suggestions</p>
                  {!isSuperAdmin && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Coming Soon
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-0.5">Smart recommendations</p>
              </div>
              {isSuperAdmin ? (
                <Toggle 
                  enabled={aiSuggestions} 
                  onChange={() => {
                    const newValue = !aiSuggestions;
                    setAiSuggestions(newValue);
                    saveNotificationPreferences('ai_suggestions', newValue);
                  }} 
                />
              ) : (
                <div className="w-11 h-6 rounded-full bg-gray-300 flex items-center p-0.5 opacity-50 cursor-not-allowed">
                  <div className="size-5 bg-white rounded-full shadow-sm" />
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="bg-white rounded-[30px] shadow-lg">
          <div className="p-5 border-b border-gray-200">
            <h2 className="font-bold text-base text-gray-900">Appearance</h2>
            <p className="text-xs text-gray-600 mt-1">Customize your app theme</p>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-900">Light Mode</p>
                <p className="text-xs text-gray-600 mt-0.5">Use light color scheme</p>
              </div>
              <Toggle enabled={lightMode} onChange={() => setLightMode(!lightMode)} />
            </div>
          </div>
        </section>

        {/* ✅ ONLY SHOW ADMIN ACCESS TO SUPERADMINS */}
        {profile?.is_super_admin && (
          <section className="bg-white rounded-[30px] shadow-lg border-2 border-red-200">
            <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-red-50 to-red-100">
              <h2 className="font-bold text-base text-red-700">Admin Access</h2>
              <p className="text-xs text-red-600 mt-1">Platform management and analytics</p>
            </div>
            <div className="p-4">
              <button
                onClick={() => onNavigate?.('super-admin')}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-[16px] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Settings className="size-5 text-white" />
                  <div className="text-left">
                    <span className="text-sm font-semibold text-white block">Super Admin Dashboard</span>
                    <span className="text-xs text-red-100">Access full platform controls</span>
                  </div>
                </div>
                <ArrowLeft className="size-5 text-white rotate-180" />
              </button>
            </div>
          </section>
        )}

        <section className="bg-white rounded-[30px] shadow-lg">
          <div className="p-5 border-b border-gray-200">
            <h2 className="font-bold text-base text-gray-900">More</h2>
            <p className="text-xs text-gray-600 mt-1">Additional settings and information</p>
          </div>
          <div className="divide-y divide-gray-200">
            <button
              onClick={() => {
                // Navigate to public URL for Facebook App Development requirements
                window.location.href = '/terms';
              }}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="size-5 text-gray-600" />
                <span className="text-sm text-gray-900">Terms of Service</span>
              </div>
              <ArrowLeft className="size-5 text-gray-600 rotate-180" />
            </button>
            <button
              onClick={() => {
                // Navigate to public URL for Facebook App Development requirements
                window.location.href = '/privacy';
              }}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Shield className="size-5 text-gray-600" />
                <span className="text-sm text-gray-900">Privacy Policy</span>
              </div>
              <ArrowLeft className="size-5 text-gray-600 rotate-180" />
            </button>
            <button
              onClick={() => onNavigate?.('support')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <HelpCircle className="size-5 text-gray-600" />
                <span className="text-sm text-gray-900">Help & Support</span>
              </div>
              <ArrowLeft className="size-5 text-gray-600 rotate-180" />
            </button>
            <button
              onClick={() => onNavigate?.('about')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Info className="size-5 text-gray-600" />
                <span className="text-sm text-gray-900">About</span>
              </div>
              <ArrowLeft className="size-5 text-gray-600 rotate-180" />
            </button>
          </div>
        </section>

        <section className="bg-white rounded-[30px] shadow-lg p-5">
          <button
            onClick={handleSignOut}
            className="w-full bg-red-100 text-red-600 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-red-200 transition-colors"
          >
            <LogOut className="size-5" />
            Sign Out
          </button>
        </section>
      </main>
    </div>
  );
}
