import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('rotatestay-auth');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed.user || null);
        setToken(parsed.token || null);
      } catch (error) {
        console.error('Failed to parse auth storage', error);
      }
    }
    setLoading(false);
  }, []);

  const login = (authToken, authUser) => {
    setUser(authUser);
    setToken(authToken);
    localStorage.setItem('rotatestay-auth', JSON.stringify({ token: authToken, user: authUser }));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('rotatestay-auth');
  };

  const value = useMemo(() => ({ user, token, loading, login, logout }), [user, token, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
