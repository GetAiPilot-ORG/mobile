import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { AuthStatus, useAuthStore, User as BFFUser } from '../core/store/authStore';

export interface UserProfile {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  is_admin?: boolean;
  role?: string;
  phone?: string;
  onboarding_completed?: boolean;
  account_status?: 'active' | 'suspended' | 'banned';
}

interface AuthContextType {
  session: { access_token: string; user: BFFUser } | null;
  user: BFFUser | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  isLoading: boolean;
  authStatus: AuthStatus;
  onboardingComplete: boolean;
  accountStatus: 'active' | 'suspended' | 'banned' | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  isAdmin: false,
  isLoading: true,
  authStatus: 'hydrating',
  onboardingComplete: true,
  accountStatus: 'active',
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const authStatus = useAuthStore((s) => s.authStatus);
  const logout = useAuthStore((s) => s.logout);
  const loadSession = useAuthStore((s) => s.loadSession);

  // Load session only once on mount
  useEffect(() => {
    loadSession();
  }, []);

  const userWithMeta: BFFUser | null = useMemo(() => {
    if (!user) return null;
    return {
      ...user,
      user_metadata: {
        full_name: user.name,
        ...user.user_metadata,
      },
    };
  }, [user]);

  const profile: UserProfile | null = useMemo(() => {
    if (!userWithMeta) return null;
    return {
      id: userWithMeta.id,
      email: userWithMeta.email,
      full_name: userWithMeta.name,
      role: userWithMeta.role,
      is_admin: userWithMeta.role === 'Admin' || userWithMeta.role === 'Owner',
      onboarding_completed: true,
      account_status: 'active',
    };
  }, [userWithMeta]);

  const session = useMemo(() => {
    if (!isAuthenticated || !userWithMeta) return null;
    return {
      access_token: 'bff_session_active',
      user: userWithMeta,
    };
  }, [isAuthenticated, userWithMeta]);

  const isAdmin = Boolean(userWithMeta?.role === 'Admin' || userWithMeta?.role === 'Owner');
  const onboardingComplete = true;
  const accountStatus: 'active' | 'suspended' | 'banned' = 'active';

  const contextValue = useMemo(
    () => ({
      session,
      user: userWithMeta,
      profile,
      isAdmin,
      isLoading,
      authStatus,
      onboardingComplete,
      accountStatus,
      signOut: async () => {
        await logout();
      },
      refreshProfile: async () => {
        await loadSession();
      },
    }),
    [session, userWithMeta, profile, isAdmin, isLoading, authStatus, logout, loadSession]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

