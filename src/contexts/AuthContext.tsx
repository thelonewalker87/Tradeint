import React, { createContext, useContext, useState, useCallback } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  user: { email: string; name: string } | null;
  login: (email: string, password: string) => void;
  signup: (email: string, password: string, name: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ email: string; name: string } | null>(() => {
    const stored = localStorage.getItem('tradient_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback((email: string, _password: string) => {
    const u = { email, name: email.split('@')[0] };
    localStorage.setItem('tradient_user', JSON.stringify(u));
    setUser(u);
  }, []);

  const signup = useCallback((email: string, _password: string, name: string) => {
    const u = { email, name };
    localStorage.setItem('tradient_user', JSON.stringify(u));
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('tradient_user');
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
