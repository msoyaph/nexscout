import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { OperatingMode, ModePreferences } from '../types/operatingMode';

interface Profile {
  id: string;
  onboarding_completed: boolean;
  profession: string | null;
  full_name: string | null;
  company: string | null;
  coin_balance: number;
  subscription_tier: string;
  operating_mode: OperatingMode;
  mode_preferences: ModePreferences;
  is_super_admin?: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, company?: string, profession?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchingProfileRef = useRef<string | null>(null); // Track which user profile is being fetched

  const fetchProfile = async (userId: string) => {
    // Prevent duplicate fetches for the same user
    if (fetchingProfileRef.current === userId) {
      console.log('[AuthContext] Profile fetch already in progress for user:', userId);
      return;
    }

    try {
      fetchingProfileRef.current = userId;
      console.log('[AuthContext] Fetching profile for user:', userId);
      
      // Fetch profile - simplified, no timeout race (handled at higher level)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('[AuthContext] Profile query error:', profileError);
        setProfile(null);
        return; // Don't throw, just return
      }
      
      // Fetch admin status (non-blocking)
      let adminData = null;
      try {
        console.log('[AuthContext] 🔍 Querying admin_users for user_id:', userId);
        const { data: adminResult, error: adminError } = await supabase
          .from('admin_users')
          .select('is_super_admin')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (!adminError && adminResult) {
          adminData = adminResult;
        }
      } catch (adminError) {
        console.warn('[AuthContext] Admin query failed (non-critical):', adminError);
        // Continue without admin data
      }
      
      console.log('[AuthContext] 🔍 Admin query result:', { adminData });

      // ⚠️ TEMPORARY FIX: Force is_super_admin = true for geoffmax22@gmail.com
      const isSuperAdmin = profileData?.email === 'geoffmax22@gmail.com' 
        ? true 
        : (adminData?.is_super_admin || false);
      
      const fullProfile = {
        ...profileData,
        is_super_admin: isSuperAdmin
      };

      console.log('[AuthContext] Profile query result:', { 
        profile: profileData, 
        admin: adminData,
        is_super_admin: fullProfile.is_super_admin 
      });
      
      if (fullProfile) {
        console.log('[AuthContext] Profile loaded:', {
          email: fullProfile.email,
          onboarding_completed: fullProfile.onboarding_completed,
          full_name: fullProfile.full_name,
          is_super_admin: fullProfile.is_super_admin
        });
      } else {
        console.warn('[AuthContext] No profile found for user:', userId);
      }
      
      setProfile(fullProfile);
      
      // Check and award subscription coins (non-blocking, runs in background)
      if (fullProfile?.subscription_tier) {
        // Don't await - let it run in background
        import('../services/subscriptionCoinService').then(({ subscriptionCoinService }) => {
          subscriptionCoinService.checkAndAwardCoins(userId, fullProfile.subscription_tier || 'free')
            .then(result => {
              if (result.weekly && result.weekly > 0) {
                console.log(`[AuthContext] ✅ Awarded ${result.weekly} weekly coins to Pro user`);
              }
              if (result.daily && result.daily > 0) {
                console.log(`[AuthContext] ✅ Awarded ${result.daily} daily coins to Free user`);
              }
              if (result.errors && result.errors.length > 0) {
                console.warn('[AuthContext] Coin distribution warnings:', result.errors);
              }
            })
            .catch(err => {
              console.error('[AuthContext] Error in background coin distribution:', err);
            });
        }).catch(err => {
          console.error('[AuthContext] Error loading subscriptionCoinService:', err);
        });
      }
    } catch (error) {
      console.error('[AuthContext] Error fetching profile:', error);
      // Set profile to null but don't block the app
      setProfile(null);
      // Don't re-throw - let the app continue
    } finally {
      // Clear the fetching flag
      if (fetchingProfileRef.current === userId) {
        fetchingProfileRef.current = null;
      }
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout | null = null;

    const initializeAuth = async () => {
      try {
        // Set a maximum timeout to ensure loading is always set to false (reduced to 5 seconds)
        timeoutId = setTimeout(() => {
          if (mounted) {
            console.warn('[AuthContext] Auth initialization timeout - forcing loading to false');
            setLoading(false);
          }
        }, 5000); // 5 second maximum timeout

        // Add timeout to getSession call itself
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session check timeout')), 3000)
        );

        let sessionResult;
        try {
          sessionResult = await Promise.race([sessionPromise, timeoutPromise]);
        } catch (timeoutError) {
          console.warn('[AuthContext] Session check timed out, continuing without session');
          if (mounted) {
            setSession(null);
            setUser(null);
            setProfile(null);
            setLoading(false);
            if (timeoutId) clearTimeout(timeoutId);
          }
          return;
        }

        const { data: { session }, error } = sessionResult as any;
        
        if (error) {
          console.error('[AuthContext] Error getting session:', error);
          if (mounted) {
            setLoading(false);
            if (timeoutId) clearTimeout(timeoutId);
          }
          return;
        }

        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            // Fetch profile but don't let it block loading state
            fetchProfile(session.user.id).catch((profileError) => {
              console.error('[AuthContext] Error fetching profile on init:', profileError);
              // Profile fetch failed, but we continue anyway
            });
          } else {
            setProfile(null);
          }
          
          // Always set loading to false after session check
          setLoading(false);
          if (timeoutId) clearTimeout(timeoutId);
        }
      } catch (error) {
        console.error('[AuthContext] Error initializing auth:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
          if (timeoutId) clearTimeout(timeoutId);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      try {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch profile but don't let it block
          fetchProfile(session.user.id).catch((profileError) => {
            console.error('[AuthContext] Error fetching profile on auth change:', profileError);
            // Continue even if profile fetch fails
          });
        } else {
          setProfile(null);
        }
        
        // Always set loading to false
        setLoading(false);
      } catch (error) {
        console.error('[AuthContext] Error handling auth state change:', error);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string, company?: string, profession?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            company: company || '',
            profession: profession || '',
          },
        },
      });

      if (error) throw error;

      if (data.user && profession) {
        await supabase
          .from('profiles')
          .update({
            profession: profession,
            onboarding_completed: true,
            onboarding_step: 'completed',
          })
          .eq('id', data.user.id);
      }

      return { error: null, data };
    } catch (error) {
      return { error: error as Error, data: null };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      // Clear local state first (so UI updates immediately)
      setUser(null);
      setSession(null);
      setProfile(null);
      
      // Try to sign out from Supabase (may fail due to CORS/403, but that's okay)
      // We clear local state first so the user is logged out regardless
      try {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.warn('[AuthContext] Sign out API error (local state already cleared):', error);
        }
      } catch (apiError) {
        console.warn('[AuthContext] Sign out API exception (local state already cleared):', apiError);
      }
      
      // Clear cached auth data from localStorage
      try {
        // Supabase stores auth tokens with a specific key pattern
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
        const projectRef = supabaseUrl.split('//')[1]?.split('.')[0] || 'supabase';
        const storageKey = `sb-${projectRef}-auth-token`;
        localStorage.removeItem(storageKey);
        sessionStorage.clear();
      } catch (storageError) {
        // Ignore storage errors - not critical
      }
    } catch (error) {
      console.error('[AuthContext] Sign out exception:', error);
      // Ensure state is cleared even on exception
      setUser(null);
      setSession(null);
      setProfile(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
