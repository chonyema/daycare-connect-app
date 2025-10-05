'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  userType: 'PARENT' | 'PROVIDER' | 'ADMIN';
  phone?: string;
  role?: string;
  isActive?: boolean;
  isSuperAdmin?: boolean;
  permissions?: string;
  daycareId?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (userData: {
    name: string;
    email: string;
    password: string;
    userType: 'PARENT' | 'PROVIDER';
    phone?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isProvider: boolean;
  isParent: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on load
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error: any) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error: any) {
      return { success: false, error: 'Login failed. Please try again.' };
    }
  };

  const signup = async (userData: {
    name: string;
    email: string;
    password: string;
    userType: 'PARENT' | 'PROVIDER';
    phone?: string;
  }) => {
    try {
      console.log('Signup request data:', userData);
      
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      console.log('Signup response status:', response.status);
      
      const data = await response.json();
      console.log('Signup response data:', data);

      if (response.ok) {
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, error: data.message || 'Signup failed' };
      }
    } catch (error: any) {
      console.error('Signup client error:', error);
      return { success: false, error: 'Network error: ' + (error?.message || 'Unknown error') };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error: any) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  const isProvider = user?.userType === 'PROVIDER';
  const isParent = user?.userType === 'PARENT';

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    isProvider,
    isParent,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};