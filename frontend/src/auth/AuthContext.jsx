import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setAuthToken, getAuthToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem('vscms_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => getAuthToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verify token validity on load
    async function verifySession() {
      if (token) {
        try {
          const profile = await api.get('/auth/me');
          setUser(profile);
          sessionStorage.setItem('vscms_user', JSON.stringify(profile));
        } catch (err) {
          console.warn('Session expired or invalid:', err.message);
          logout();
        }
      }
      setLoading(false);
    }
    verifySession();
  }, [token]);

  const login = async (username_or_email, password) => {
    const data = await api.post('/auth/login', { username_or_email, password });
    setAuthToken(data.access_token);
    setToken(data.access_token);
    const userInfo = {
      user_id: data.user_id,
      username: data.username,
      full_name: data.full_name,
      role: data.role,
      is_active: true,
    };
    setUser(userInfo);
    sessionStorage.setItem('vscms_user', JSON.stringify(userInfo));
    return userInfo;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout', {});
    } catch (e) {
      // Ignore network errors during logout
    }
    setAuthToken('');
    setToken('');
    setUser(null);
    sessionStorage.removeItem('vscms_user');
  };

  const value = {
    user,
    token,
    role: user?.role || null,
    isAdmin: user?.role === 'Administrator',
    isAuthenticated: !!user && !!token,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
