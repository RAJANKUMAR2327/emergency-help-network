'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from './api';

export interface User {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  role: 'user' | 'helper' | 'hospital' | 'police' | 'ambulance' | 'admin';
  isVerified: boolean;
  isAvailable: boolean;
  bloodGroup?: string;
  medicalInfo?: string;
  profilePhoto?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => void;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AuthState>({ user: null, token: null, loading: true });

  useEffect(() => {
    const t = localStorage.getItem('token');
    const u = localStorage.getItem('user');
    // Reading localStorage must happen post-mount (it doesn't exist during
    // SSR), so this effect is the correct place for it, not a workaround.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- required: syncing from a browser-only store (localStorage) that isn't available during SSR, so it can't be moved to a lazy useState initializer without a hydration mismatch.
    setState(
      t && u
        ? { user: JSON.parse(u) as User, token: t, loading: false }
        : { user: null, token: null, loading: false }
    );
  }, []);

  const login = async (phone: string, password: string) => {
    const res = await authAPI.login({ phone, password });
    const { token: t, data: u } = res.data;
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(u));
    setState({ user: u, token: t, loading: false });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setState({ user: null, token: null, loading: false });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
