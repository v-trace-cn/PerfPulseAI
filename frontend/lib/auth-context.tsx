"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { directAuthApi, directUserApi } from './direct-api';

// Define the User type
export interface User {
  id: string;
  name?: string;
  email: string;
  department?: string;
  position?: string;
  points?: number;
  level?: number;
  createdAt?: string;
  updatedAt?: string;
  // Add other user properties as needed
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name?: string) => Promise<boolean>;
  logout: () => void;
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
        const userData = await directUserApi.getProfile(token);
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

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await directAuthApi.login(email, password);
      
      if (!response.success) {
        throw new Error(response.message || '登录失败');
      }
      
      // Store user ID as token since backend uses sessions
      if (typeof window !== 'undefined' && response.data && response.data.userId) {
        localStorage.setItem('token', response.data.userId);
        
        try {
          // Fetch user profile with the userId
          const userData = await directUserApi.getProfile(response.data.userId);
          setUser(userData);
        } catch (profileError) {
          console.error('Failed to fetch user profile:', profileError);
          // Create a minimal user object with the userId and basic info
          setUser({ 
            id: response.data.userId, 
            email: response.data.email || email,
            name: response.data.name || email.split('@')[0]
          });
        }
      } else {
        throw new Error('登录成功但未返回用户ID');
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
      const response = await directAuthApi.register(email, password, name || email.split('@')[0]);
      
      if (!response.success) {
        throw new Error(response.message || '注册失败');
      }
      
      // Store user ID as token since backend uses sessions
      if (typeof window !== 'undefined' && response.data && response.data.userId) {
        localStorage.setItem('token', response.data.userId);
        
        try {
          // Fetch user profile with the userId
          const userData = await directUserApi.getProfile(response.data.userId);
          setUser(userData);
        } catch (profileError) {
          console.error('Failed to fetch user profile:', profileError);
          // Create a minimal user object with the userId and provided info
          setUser({ id: response.data.userId, email, name: name || email.split('@')[0] });
        }
      } else {
        throw new Error('注册成功但未返回用户ID');
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
