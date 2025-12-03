import { useState } from 'react';
import { ArrowLeft, User, Lock, Shield, Crown, FileText, HelpCircle, Info, LogOut, Coins, Settings, Building2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { OperatingModeSelector } from '../components/settings/OperatingModeSelector';

interface SettingsPageProps {
  onBack: () => void;
  onNavigate?: (page: string) => void;
}

export default function SettingsPage({ onBack, onNavigate }: SettingsPageProps) {
  const { user, profile, signOut } = useAuth();
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [aiSuggestions, setAiSuggestions] = useState(false);
  const [lightMode, setLightMode] = useState(true);
  const [linkedin, setLinkedin] = useState(true);
  const [twitter, setTwitter] = useState(false);
  const [facebook, setFacebook] = useState(true);

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
            <div className="bg-gradient-to-r from-blue-100 to-blue-200 px-3 py-1.5 rounded-full">
              <span className="text-xs font-semibold text-blue-900">Pro Plan</span>
            </div>
          </div>
        </section>

        <OperatingModeSelector />

        <section className="bg-white rounded-[30px] shadow-lg">
          <div className="p-5 border-b border-gray-200">
            <h2 className="font-bold text-base text-gray-900">Profile</h2>
            <p className="text-xs text-gray-600 mt-1">Manage your account information</p>
          </div>
          <div className="divide-y divide-gray-200">
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
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="size-5 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">in</span>
                </div>
                <div>
                  <p className="text-sm text-gray-900">LinkedIn</p>
                  <p className="text-xs text-gray-600">Connected</p>
                </div>
              </div>
              <Toggle enabled={linkedin} onChange={() => setLinkedin(!linkedin)} />
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="size-5 rounded-full bg-blue-400 flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">T</span>
                </div>
                <div>
                  <p className="text-sm text-gray-900">Twitter</p>
                  <p className="text-xs text-gray-600">Not connected</p>
                </div>
              </div>
              <Toggle enabled={twitter} onChange={() => setTwitter(!twitter)} />
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="size-5 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">f</span>
                </div>
                <div>
                  <p className="text-sm text-gray-900">Facebook</p>
                  <p className="text-xs text-gray-600">Connected</p>
                </div>
              </div>
              <Toggle enabled={facebook} onChange={() => setFacebook(!facebook)} />
            </div>
          </div>
        </section>

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
                    {profile?.subscription_tier === 'elite' && (
                      <Crown className="size-4 text-[#F59E0B]" fill="#F59E0B" />
                    )}
                    <h3 className="text-sm font-semibold text-gray-900">
                      {profile?.subscription_tier === 'elite' ? 'Elite Plan' :
                       profile?.subscription_tier === 'pro' ? 'Pro Plan' :
                       profile?.subscription_tier === 'starter' ? 'Starter Plan' : 'Free Plan'}
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
              <Toggle enabled={pushNotifications} onChange={() => setPushNotifications(!pushNotifications)} />
            </div>
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm text-gray-900">Email Notifications</p>
                <p className="text-xs text-gray-600 mt-0.5">Get updates via email</p>
              </div>
              <Toggle enabled={emailNotifications} onChange={() => setEmailNotifications(!emailNotifications)} />
            </div>
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm text-gray-900">AI Suggestions</p>
                <p className="text-xs text-gray-600 mt-0.5">Smart recommendations</p>
              </div>
              <Toggle enabled={aiSuggestions} onChange={() => setAiSuggestions(!aiSuggestions)} />
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

        <section className="bg-white rounded-[30px] shadow-lg">
          <div className="p-5 border-b border-gray-200">
            <h2 className="font-bold text-base text-gray-900">More</h2>
            <p className="text-xs text-gray-600 mt-1">Additional settings and information</p>
          </div>
          <div className="divide-y divide-gray-200">
            <button
              onClick={() => onNavigate?.('terms-of-service')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="size-5 text-gray-600" />
                <span className="text-sm text-gray-900">Terms of Service</span>
              </div>
              <ArrowLeft className="size-5 text-gray-600 rotate-180" />
            </button>
            <button
              onClick={() => onNavigate?.('privacy-policy')}
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
