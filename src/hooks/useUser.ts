import { useAuth } from '../contexts/AuthContext';

/**
 * Hook to access current user and profile
 */
export function useUser() {
  const auth = useAuth();

  return {
    user: auth.user || { id: '' },
    profile: auth.profile,
    isLoading: auth.loading,
    isAuthenticated: !!auth.user,
  };
}
