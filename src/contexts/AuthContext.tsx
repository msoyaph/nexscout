import { createContext, useContext, useEffect, useState } from 'react';
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

  const fetchProfile = async (userId: string) => {
    try {
      console.log('[AuthContext] Fetching profile for user:', userId);
      
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) throw profileError;
      
      // Fetch admin status
      console.log('[AuthContext] 🔍 Querying admin_users for user_id:', userId);
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('is_super_admin')
        .eq('user_id', userId)
        .maybeSingle();
      
      console.log('[AuthContext] 🔍 Admin query result:', { adminData, adminError });

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
    } catch (error) {
      console.error('[AuthContext] Error fetching profile:', error);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      })();
    });

    return () => subscription.unsubscribe();
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
    await supabase.auth.signOut();
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
