"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { unifiedApi } from './unified-api';
import { User, AuthResponse } from './types';

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name?: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if the user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (typeof window === 'undefined') return;
      
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const userData = await unifiedApi.user.getProfile(token);
        setUser(userData);
      } catch (err) {
        console.error('Profile fetch error:', err);
        // Clear invalid token
        localStorage.removeItem('token');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const refreshUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setIsLoading(true);
    try {
      const userData = await unifiedApi.user.getProfile(token);
      setUser(userData);
    } catch (err) {
      console.error('Refresh user error:', err);
      setError((err as any).message || '刷新用户数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await unifiedApi.auth.login(email, password);

      if (!response.success || !response.data || !response.data.userId) {
        throw new Error(response.message || '登录失败');
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('token', response.data.userId);
        await refreshUser();
      }
      return true;
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || '登录失败，请检查您的输入');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name?: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await unifiedApi.auth.register(email, password, name || email.split('@')[0]);

      if (!response.success || !response.data || !response.data.userId) {
        throw new Error(response.message || '注册失败');
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('token', response.data.userId);
        await refreshUser();
      }
      return true;
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || '注册失败，请稍后再试');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
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
