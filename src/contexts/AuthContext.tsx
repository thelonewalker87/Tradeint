import React, { createContext, useContext, useState, useCallback } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  user: { id: string; email: string; name: string } | null;
  login: (email: string, password: string) => void;
  signup: (email: string, password: string, name: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string; name: string } | null>(() => {
    const stored = localStorage.getItem('tradient_user');
    if (stored) {
      return JSON.parse(stored);
    }
    return null;
  });

  const login = useCallback(async (email: string, password: string) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Login failed');
      }
      const data = await res.json();
      localStorage.setItem('tradient_auth_token', data.token);
      localStorage.setItem('tradient_user', JSON.stringify(data.user));
      setUser(data.user);
    } catch (error) {
      console.warn('Login API failed, falling back to local demo login:', error);
      const demoUser = { id: 'demo-123', email, name: email.split('@')[0] || 'Demo User' };
      localStorage.setItem('tradient_auth_token', 'demo-token');
      localStorage.setItem('tradient_user', JSON.stringify(demoUser));
      setUser(demoUser);
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string) => {
    // For now, fallback to demo login logic or use same endpoint
    await login(email, password); 
    const u = { id: 'demo-123', email, name };
    localStorage.setItem('tradient_user', JSON.stringify(u));
    setUser(u);
  }, [login]);

  const logout = useCallback(() => {
    localStorage.removeItem('tradient_user');
    localStorage.removeItem('tradient_auth_token');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
