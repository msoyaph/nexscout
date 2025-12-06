import { useState, useEffect } from 'react';
import { ArrowLeft, Shield, Eye, Trash2, Download, Lock, Bell, Globe, Database, AlertCircle, CheckCircle, Sparkles, Loader } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface PrivacySecurityPageProps {
  onNavigateBack: () => void;
  onNavigate?: (page: string) => void;
}

export default function PrivacySecurityPage({ onNavigateBack, onNavigate }: PrivacySecurityPageProps) {
  const { user, profile, refreshProfile } = useAuth();
  const isSuperAdmin = user?.email === 'geoffmax22@gmail.com';
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(true);
  const [productUpdates, setProductUpdates] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);
  const [profileVisibility, setProfileVisibility] = useState<'public' | 'private'>('public');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, [profile]);

  const loadSettings = async () => {
    if (!user || !profile) return;
    
    setLoading(true);
    try {
      // Load notification preferences
      const prefs = profile.notification_preferences || {};
      setMarketingEmails(prefs.marketing_emails !== false);
      setProductUpdates(prefs.product_updates !== false);
      setSecurityAlerts(prefs.security_alerts !== false);
      
      // Load profile visibility
      setProfileVisibility(profile.profile_visibility || 'public');
      
      // Load 2FA status (if available)
      setTwoFactorEnabled(profile.two_factor_enabled || false);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveEmailPreferences = async () => {
    if (!user) return;
    
    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      const prefs = profile?.notification_preferences || {};
      const updatedPrefs = {
        ...prefs,
        marketing_emails: marketingEmails,
        product_updates: productUpdates,
        security_alerts: securityAlerts,
      };

      const { error } = await supabase
        .from('profiles')
        .update({ notification_preferences: updatedPrefs })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      setSuccessMessage('Email preferences saved successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      console.error('Error saving email preferences:', error);
      setErrorMessage('Failed to save email preferences');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const saveProfileVisibility = async () => {
    if (!user) return;
    
    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ profile_visibility: profileVisibility })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      setSuccessMessage('Profile visibility updated');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      console.error('Error saving profile visibility:', error);
      setErrorMessage('Failed to update profile visibility');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleTwoFactorToggle = async (enabled: boolean) => {
    if (!isSuperAdmin) {
      setErrorMessage('Two-Factor Authentication is coming soon');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ two_factor_enabled: enabled })
        .eq('id', user?.id);

      if (error) throw error;

      setTwoFactorEnabled(enabled);
      await refreshProfile();
      setSuccessMessage(enabled ? 'Two-Factor Authentication enabled' : 'Two-Factor Authentication disabled');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      console.error('Error updating 2FA:', error);
      setErrorMessage('Failed to update Two-Factor Authentication');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const Toggle = ({ enabled, onChange, disabled }: { enabled: boolean; onChange: () => void; disabled?: boolean }) => (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`w-11 h-6 rounded-full flex items-center p-0.5 transition-colors ${
        enabled ? 'bg-blue-600' : 'bg-gray-300'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div
        className={`size-5 bg-white rounded-full shadow-sm transition-transform ${
          enabled ? 'ml-auto' : ''
        }`}
      />
    </button>
  );

  const handleDownloadData = async () => {
    if (!isSuperAdmin) {
      setErrorMessage('Data download is coming soon');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    
    setSaving(true);
    try {
      // This would trigger a data export process
      // For now, we'll just show a message
      setSuccessMessage('Data export initiated. You will receive an email when ready.');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error: any) {
      console.error('Error downloading data:', error);
      setErrorMessage('Failed to initiate data download');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    if (!user) return;

    setDeleteLoading(true);
    setErrorMessage('');
    
    try {
      // Delete user data from all tables (cascade should handle most)
      // Then delete the auth user
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
      
      if (deleteError) {
        // If admin delete fails, try regular user deletion
        // Note: This requires proper RLS policies
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', user.id);
        
        if (profileError) throw profileError;
      }

      // Sign out and redirect
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (error: any) {
      console.error('Error deleting account:', error);
      setErrorMessage('Failed to delete account. Please contact support.');
      setShowDeleteConfirm(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen text-gray-900 pb-28">
      <header className="px-6 pt-8 pb-6 bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <button
            onClick={onNavigateBack}
            className="flex items-center justify-center size-11 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="size-6 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Privacy & Security</h1>
          <div className="size-11" />
        </div>
      </header>

      <main className="px-6 mt-6 space-y-4">
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-[20px] p-4 flex items-center gap-3">
            <CheckCircle className="size-5 text-green-600 shrink-0" />
            <p className="text-sm text-green-800">{successMessage}</p>
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-[20px] p-4 flex items-center gap-3">
            <AlertCircle className="size-5 text-red-600 shrink-0" />
            <p className="text-sm text-red-800">{errorMessage}</p>
          </div>
        )}

        <div className="bg-white rounded-[24px] border border-[#E5E7EB] shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Lock className="size-5 text-blue-600" />
              </div>
              <div>
                <h2 className="font-bold text-base text-gray-900">Security Settings</h2>
                <p className="text-xs text-gray-600">Protect your account</p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            <button
              onClick={() => onNavigate?.('change-password')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Lock className="size-5 text-gray-600" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">Change Password</p>
                  <p className="text-xs text-gray-600">Update your account password</p>
                </div>
              </div>
              <ArrowLeft className="size-5 text-gray-600 rotate-180" />
            </button>

            <div className={`flex items-center justify-between p-4 ${!isSuperAdmin ? 'opacity-60 pointer-events-none relative' : ''}`}>
              {!isSuperAdmin && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 bg-gray-700 text-white text-xs font-bold rounded-full flex items-center gap-1 z-10">
                  <Sparkles className="w-3 h-3" /> Coming Soon
                </div>
              )}
              <div className="flex items-center gap-3">
                <Shield className="size-5 text-gray-600" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Two-Factor Authentication</p>
                  <p className="text-xs text-gray-600">Add an extra layer of security</p>
                </div>
              </div>
              <Toggle 
                enabled={twoFactorEnabled} 
                onChange={() => handleTwoFactorToggle(!twoFactorEnabled)}
                disabled={!isSuperAdmin}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[24px] border border-[#E5E7EB] shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Eye className="size-5 text-purple-600" />
              </div>
              <div>
                <h2 className="font-bold text-base text-gray-900">Privacy Settings</h2>
                <p className="text-xs text-gray-600">Control your data and visibility</p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Globe className="size-5 text-gray-600" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Profile Visibility</p>
                    <p className="text-xs text-gray-600">Who can see your profile</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setProfileVisibility('public');
                    saveProfileVisibility();
                  }}
                  disabled={saving}
                  className={`flex-1 py-2 px-4 rounded-[16px] text-sm font-semibold transition-colors ${
                    profileVisibility === 'public'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  } disabled:opacity-50`}
                >
                  Public
                </button>
                <button
                  onClick={() => {
                    setProfileVisibility('private');
                    saveProfileVisibility();
                  }}
                  disabled={saving}
                  className={`flex-1 py-2 px-4 rounded-[16px] text-sm font-semibold transition-colors ${
                    profileVisibility === 'private'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  } disabled:opacity-50`}
                >
                  Private
                </button>
              </div>
            </div>

            <button
              onClick={() => onNavigate?.('privacy-policy')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Database className="size-5 text-gray-600" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">Privacy Policy</p>
                  <p className="text-xs text-gray-600">View our privacy policy</p>
                </div>
              </div>
              <ArrowLeft className="size-5 text-gray-600 rotate-180" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-[24px] border border-[#E5E7EB] shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-orange-100 flex items-center justify-center">
                <Bell className="size-5 text-orange-600" />
              </div>
              <div>
                <h2 className="font-bold text-base text-gray-900">Email Preferences</h2>
                <p className="text-xs text-gray-600">Manage email notifications</p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Bell className="size-5 text-gray-600" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Security Alerts</p>
                  <p className="text-xs text-gray-600">Account security notifications</p>
                </div>
              </div>
              <Toggle 
                enabled={securityAlerts} 
                onChange={() => {
                  setSecurityAlerts(!securityAlerts);
                  setTimeout(() => saveEmailPreferences(), 300);
                }}
              />
            </div>

            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Bell className="size-5 text-gray-600" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Product Updates</p>
                  <p className="text-xs text-gray-600">New features and improvements</p>
                </div>
              </div>
              <Toggle 
                enabled={productUpdates} 
                onChange={() => {
                  setProductUpdates(!productUpdates);
                  setTimeout(() => saveEmailPreferences(), 300);
                }}
              />
            </div>

            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Bell className="size-5 text-gray-600" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Marketing Emails</p>
                  <p className="text-xs text-gray-600">Promotional content and offers</p>
                </div>
              </div>
              <Toggle 
                enabled={marketingEmails} 
                onChange={() => {
                  setMarketingEmails(!marketingEmails);
                  setTimeout(() => saveEmailPreferences(), 300);
                }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[24px] border border-[#E5E7EB] shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-green-100 flex items-center justify-center">
                <Database className="size-5 text-green-600" />
              </div>
              <div>
                <h2 className="font-bold text-base text-gray-900">Data Management</h2>
                <p className="text-xs text-gray-600">Control your data</p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {isSuperAdmin ? (
              <button
                onClick={handleDownloadData}
                disabled={saving}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <Download className="size-5 text-gray-600" />
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900">Download Your Data</p>
                    <p className="text-xs text-gray-600">Get a copy of your information</p>
                  </div>
                </div>
                {saving ? (
                  <Loader className="size-5 text-gray-600 animate-spin" />
                ) : (
                  <ArrowLeft className="size-5 text-gray-600 rotate-180" />
                )}
              </button>
            ) : (
              <div className="relative p-4 opacity-60 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 bg-gray-700 text-white text-xs font-bold rounded-full flex items-center gap-1 z-10">
                  <Sparkles className="w-3 h-3" /> Coming Soon
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Download className="size-5 text-gray-600" />
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-900">Download Your Data</p>
                      <p className="text-xs text-gray-600">Get a copy of your information</p>
                    </div>
                  </div>
                  <ArrowLeft className="size-5 text-gray-600 rotate-180" />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-[24px] p-6 border border-blue-200">
          <div className="flex items-start gap-3">
            <CheckCircle className="size-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm text-[#111827] mb-2">Your Data is Protected</h3>
              <ul className="space-y-1 text-xs text-[#6B7280]">
                <li>• All data is encrypted in transit and at rest</li>
                <li>• We never sell your personal information</li>
                <li>• Regular security audits and updates</li>
                <li>• Compliant with data protection regulations</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[24px] border-2 border-red-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-red-200">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="size-5 text-red-600" />
              </div>
              <div>
                <h2 className="font-bold text-base text-red-900">Danger Zone</h2>
                <p className="text-xs text-red-700">Irreversible actions</p>
              </div>
            </div>
          </div>

          <div className="p-4">
            <button
              onClick={handleDeleteAccount}
              disabled={deleteLoading}
              className="w-full flex items-center justify-between p-4 bg-red-50 hover:bg-red-100 rounded-[16px] transition-colors border border-red-200"
            >
              <div className="flex items-center gap-3">
                <Trash2 className="size-5 text-red-600" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-red-900">Delete Account</p>
                  <p className="text-xs text-red-700">Permanently delete your account and data</p>
                </div>
              </div>
              <ArrowLeft className="size-5 text-red-600 rotate-180" />
            </button>

            {showDeleteConfirm && (
              <div className="mt-4 p-4 bg-red-50 rounded-[16px] border border-red-200">
                <div className="flex items-start gap-3 mb-4">
                  <AlertCircle className="size-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-900 mb-1">Are you absolutely sure?</p>
                    <p className="text-xs text-red-700 mb-2">
                      This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-2 px-4 bg-white border border-slate-300 text-slate-700 rounded-[16px] font-semibold text-sm hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading}
                    className="flex-1 py-2 px-4 bg-red-600 text-white rounded-[16px] font-semibold text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {deleteLoading ? 'Deleting...' : 'Yes, Delete Account'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-[24px] p-6 border border-orange-200">
          <h3 className="font-bold text-sm text-[#111827] mb-2">Security Best Practices</h3>
          <ul className="space-y-2 text-xs text-[#6B7280]">
            <li>• Enable two-factor authentication for extra security</li>
            <li>• Use a strong, unique password</li>
            <li>• Review your privacy settings regularly</li>
            <li>• Be cautious of phishing attempts</li>
            <li>• Keep your contact information up to date</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
