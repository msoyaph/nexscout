import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, CheckCircle2, Sparkles, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { referralService } from '../services/referralService';

interface OnboardingData {
  role: string;
  goals: string[];
  connectedPlatforms: string[];
}

interface SignupPageProps {
  onNavigateToLogin: () => void;
  prefilledData?: OnboardingData | null;
  onSignupSuccess?: () => void;
}

export default function SignupPage({ onNavigateToLogin, prefilledData, onSignupSuccess }: SignupPageProps) {
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [companyEnriched, setCompanyEnriched] = useState(false);
  const { signUp } = useAuth();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
      referralService.storeReferralCode(refCode);
    }
  }, []);

  const handleCompanyBlur = async () => {
    if (!company || company.length < 2) return;

    setEnriching(true);
    try {
      // Simulate AI enrichment delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      setCompanyEnriched(true);
    } catch (err) {
      console.error('Error enriching company:', err);
    } finally {
      setEnriching(false);
    }
  };

  const enrichCompanyAfterSignup = async (userId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enrich-company-data`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ companyName: company }),
        }
      );

      if (!response.ok) {
        console.error('Failed to enrich company data');
      }
    } catch (err) {
      console.error('Error enriching company data:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName || fullName.trim().length === 0) {
      setError('Full name is required');
      return;
    }

    if (!company || company.trim().length === 0) {
      setError('Company name is required');
      return;
    }

    if (!email || email.trim().length === 0) {
      setError('Email is required');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    const { error, data } = await signUp(email, password, fullName, company, prefilledData?.role);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Enrich company data in the background
      if (data?.user?.id) {
        enrichCompanyAfterSignup(data.user.id);

        const refCode = referralService.getReferralCode();
        if (refCode) {
          try {
            await referralService.processSignupReferral(refCode, data.user.id);
            referralService.clearReferralCode();
          } catch (error) {
            console.error('Error processing referral:', error);
          }
        }
      }

      if (onSignupSuccess) {
        onSignupSuccess();
      }
      setLoading(false);
    }
  };

  return (
    <div className="bg-white min-h-screen text-gray-900 relative overflow-hidden flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 relative z-10">
        <div className="mb-8 relative">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            NexScout<span className="text-nexscout-blue">.ai</span>
          </h1>
        </div>

        <h2 className="text-2xl font-semibold text-gray-900 text-center mb-4 px-4">
          Create your account
        </h2>

        {prefilledData && (
          <div className="flex items-center gap-2 mb-8 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm max-w-sm w-full">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>Onboarding complete! Just a few more details to get started.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-4 py-3.5 rounded-xl bg-white text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-nexscout-blue/30 transition-all shadow-sm"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900">
              Company / Business Name / Brand <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={company}
                onChange={(e) => {
                  setCompany(e.target.value);
                  setCompanyEnriched(false);
                }}
                onBlur={handleCompanyBlur}
                required
                className="w-full px-4 py-3.5 rounded-xl bg-white text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-nexscout-blue/30 transition-all shadow-sm"
                placeholder="e.g., Frontrow Philippines, USANA, Pru Life UK"
              />
              {enriching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Sparkles className="w-5 h-5 text-nexscout-blue animate-pulse" />
                </div>
              )}
              {companyEnriched && !enriching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
              )}
            </div>
            {enriching && (
              <p className="text-xs text-nexscout-blue mt-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                AI is detecting your company...
              </p>
            )}
            {companyEnriched && !enriching && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Company detected! We'll personalize your experience.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3.5 rounded-xl bg-white text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-nexscout-blue/30 transition-all shadow-sm"
              placeholder="you@company.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3.5 pr-12 rounded-xl bg-white text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-nexscout-blue/30 transition-all shadow-sm"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">At least 6 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3.5 pr-12 rounded-xl bg-white text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-nexscout-blue/30 transition-all shadow-sm"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                Passwords do not match
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-nexscout-blue text-white font-semibold text-base shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                Sign up
              </>
            )}
          </button>

          <div className="relative flex items-center my-6">
            <div className="flex-1 border-t border-gray-200" />
            <span className="px-4 text-sm text-gray-500">or continue with</span>
            <div className="flex-1 border-t border-gray-200" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 font-medium text-sm hover:bg-gray-100 transition-colors shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#DB4437"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 font-medium text-sm hover:bg-gray-100 transition-colors shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </button>
          </div>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <button
              onClick={onNavigateToLogin}
              className="text-nexscout-blue font-semibold hover:underline"
            >
              Log in
            </button>
          </p>
        </div>

        <div className="mt-12 flex items-center justify-center gap-4 text-xs text-gray-500">
          <button className="hover:text-gray-900 transition-colors">
            Terms of Service
          </button>
          <span>•</span>
          <button className="hover:text-gray-900 transition-colors">
            Privacy Policy
          </button>
        </div>
      </div>
    </div>
  );
}
