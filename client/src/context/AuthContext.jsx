import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { analyticsService } from '../services/analyticsService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('dutube_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      const storedToken = localStorage.getItem('dutube_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        setUser(res.data.user);
      } catch (err) {
        localStorage.removeItem('dutube_token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('dutube_token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    analyticsService.track('login', { method: 'email', userId: res.data.user.id });
    return res.data.user;
  };

  const register = async (username, email, password) => {
    const res = await api.post('/auth/register', { username, email, password });
    localStorage.setItem('dutube_token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    analyticsService.track('register', { userId: res.data.user.id });
    return res.data.user;
  };

  const loginGoogleDemo = async () => {
    const res = await api.post('/auth/google-demo');
    localStorage.setItem('dutube_token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    analyticsService.track('login', { method: 'google_demo', userId: res.data.user.id });
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('dutube_token');
    setToken(null);
    setUser(null);
    analyticsService.track('logout');
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: Boolean(user),
        isAdmin: user?.role === 'admin',
        login,
        register,
        loginGoogleDemo,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
