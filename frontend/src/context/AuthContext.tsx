import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('microlims_token');
      if (token) {
        try {
          const profile = await api.me();
          setUser(profile);
        } catch {
          localStorage.removeItem('microlims_token');
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password = 'Password123!') => {
    const res = await api.login({ email, password });
    localStorage.setItem('microlims_token', res.accessToken);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('microlims_token');
    setUser(null);
  };

  const hasRole = (...roles: UserRole[]): boolean => {
    if (!user || !user.roles) return false;
    if (user.roles.includes('ADMIN')) return true;
    return roles.some((r) => user.roles?.includes(r));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
