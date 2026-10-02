import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AuthUser } from '../types/auth';
import { getMeApi, loginApi, logoutApi } from '../services/authService';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Check existing session via /api/auth/me on initial app load
  useEffect(() => {
    let isMounted = true;

    getMeApi()
      .then((authenticatedUser) => {
        if (isMounted) setUser(authenticatedUser);
      })
      .catch(() => {
        if (isMounted) setUser(null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (username: string, password: string): Promise<void> => {
    const authenticatedUser = await loginApi(username, password);
    setUser(authenticatedUser);
  };

  const logout = async (): Promise<void> => {
    try {
      await logoutApi();
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};