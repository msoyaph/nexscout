import { useState } from 'react';
import { ArrowLeft, Lock, Eye, EyeOff, Loader, CheckCircle, AlertCircle, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ChangePasswordPageProps {
  onNavigateBack: () => void;
}

export default function ChangePasswordPage({ onNavigateBack }: ChangePasswordPageProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: '',
    color: ''
  });

  const calculatePasswordStrength = (password: string) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    let label = '';
    let color = '';

    if (score === 0) {
      label = '';
      color = '';
    } else if (score <= 2) {
      label = 'Weak';
      color = 'bg-red-500';
    } else if (score <= 3) {
      label = 'Fair';
      color = 'bg-orange-500';
    } else if (score <= 4) {
      label = 'Good';
      color = 'bg-yellow-500';
    } else {
      label = 'Strong';
      color = 'bg-green-500';
    }

    setPasswordStrength({ score, label, color });
  };

  const handleNewPasswordChange = (value: string) => {
    setFormData({ ...formData, newPassword: value });
    calculatePasswordStrength(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validation
    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (formData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (passwordStrength.score < 3) {
      setError('Please choose a stronger password');
      return;
    }

    setLoading(true);

    try {
      // Verify current password by attempting to sign in
      if (user?.email && formData.currentPassword) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: formData.currentPassword
        });

        if (signInError) {
          throw new Error('Current password is incorrect');
        }
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.newPassword
      });

      if (updateError) throw updateError;

      // Send email notification
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-password-change-email`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              userEmail: user?.email,
              userName: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User',
              changedAt: new Date().toISOString(),
            }),
          }
        );

        if (!response.ok) {
          // Email sending failed, but password change succeeded - log warning
          console.warn('Password changed but email notification failed');
        }
      } catch (emailError) {
        // Email sending failed, but password change succeeded - log warning
        console.warn('Password changed but email notification failed:', emailError);
      }

      setSuccess(true);
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      setTimeout(() => {
        onNavigateBack();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
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
          <h1 className="text-lg font-semibold text-gray-900">Change Password</h1>
          <div className="size-11" />
        </div>
      </header>

      <main className="px-6 mt-6 space-y-4">
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-[20px] p-4 flex items-center gap-3">
            <CheckCircle className="size-5 text-green-600 shrink-0" />
            <p className="text-sm text-green-800">Password updated successfully!</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-[20px] p-4 flex items-center gap-3">
            <AlertCircle className="size-5 text-red-600 shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-[#111827] mb-2">
                <Lock className="size-4" />
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  placeholder="Enter your current password"
                  className="w-full px-4 py-3 pr-12 bg-slate-50 rounded-[16px] border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showCurrentPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-[#111827] mb-2">
                <Lock className="size-4" />
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={(e) => handleNewPasswordChange(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-4 py-3 pr-12 bg-slate-50 rounded-[16px] border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNewPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>

              {formData.newPassword && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[#6B7280]">Password Strength:</span>
                    <span className={`text-xs font-semibold ${
                      passwordStrength.score <= 2 ? 'text-red-600' :
                      passwordStrength.score <= 3 ? 'text-orange-600' :
                      passwordStrength.score <= 4 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-[#111827] mb-2">
                <Lock className="size-4" />
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-3 pr-12 bg-slate-50 rounded-[16px] border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onNavigateBack}
                className="flex-1 py-3 bg-slate-200 text-slate-700 rounded-[20px] font-semibold text-sm hover:bg-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-blue-600 text-white rounded-[20px] font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="size-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Password'
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-[24px] p-6 border border-orange-200">
          <div className="flex items-start gap-3">
            <Shield className="size-5 text-orange-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm text-[#111827] mb-2">Password Requirements</h3>
              <ul className="space-y-1 text-xs text-[#6B7280]">
                <li className="flex items-center gap-2">
                  <div className={`size-1.5 rounded-full ${formData.newPassword.length >= 8 ? 'bg-green-500' : 'bg-slate-300'}`} />
                  At least 8 characters long
                </li>
                <li className="flex items-center gap-2">
                  <div className={`size-1.5 rounded-full ${/[a-z]/.test(formData.newPassword) && /[A-Z]/.test(formData.newPassword) ? 'bg-green-500' : 'bg-slate-300'}`} />
                  Mix of uppercase and lowercase letters
                </li>
                <li className="flex items-center gap-2">
                  <div className={`size-1.5 rounded-full ${/\d/.test(formData.newPassword) ? 'bg-green-500' : 'bg-slate-300'}`} />
                  At least one number
                </li>
                <li className="flex items-center gap-2">
                  <div className={`size-1.5 rounded-full ${/[^a-zA-Z0-9]/.test(formData.newPassword) ? 'bg-green-500' : 'bg-slate-300'}`} />
                  At least one special character
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-[24px] p-6 border border-blue-200">
          <h3 className="font-bold text-sm text-[#111827] mb-2">Security Tips</h3>
          <ul className="space-y-2 text-xs text-[#6B7280]">
            <li>• Never share your password with anyone</li>
            <li>• Use a unique password for this account</li>
            <li>• Consider using a password manager</li>
            <li>• Change your password regularly</li>
            <li>• Avoid using personal information in passwords</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
