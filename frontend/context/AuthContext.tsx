/**
 * AuthContext — JWT auth state with AsyncStorage persistence.
 *
 * On mount: reads saved tokens, verifies they exist.
 * login() / signup(): stores tokens, sets user state.
 * logout(): clears tokens, resets state.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiLogin, apiSignup, apiRefresh } from '../api/authApi';

const ACCESS_KEY = '@closira_access_token';
const REFRESH_KEY = '@closira_refresh_token';

export interface AuthUser {
  /** Decoded from JWT sub claim */
  id: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (
    email: string,
    password: string,
    fullName?: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function parseJwtSub(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(ACCESS_KEY);
        if (saved) {
          const id = parseJwtSub(saved);
          if (id) {
            setAccessToken(saved);
            setUser({ id });
          }
        }
      } catch (_) {
        // Corrupt storage — ignore, user will see login screen
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const _storeTokens = useCallback(async (access: string, refresh: string) => {
    await AsyncStorage.multiSet([
      [ACCESS_KEY, access],
      [REFRESH_KEY, refresh],
    ]);
    const id = parseJwtSub(access) ?? '';
    setAccessToken(access);
    setUser({ id });
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const tokens = await apiLogin(email, password);
        await _storeTokens(tokens.access_token, tokens.refresh_token);
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err?.message ?? 'Login failed' };
      }
    },
    [_storeTokens]
  );

  const signup = useCallback(
    async (email: string, password: string, fullName?: string) => {
      try {
        const tokens = await apiSignup(email, password, fullName);
        await _storeTokens(tokens.access_token, tokens.refresh_token);
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err?.message ?? 'Signup failed' };
      }
    },
    [_storeTokens]
  );

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove([ACCESS_KEY, REFRESH_KEY]);
    setAccessToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, accessToken, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
