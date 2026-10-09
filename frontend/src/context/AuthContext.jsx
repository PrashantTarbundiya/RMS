/**
 * AuthContext.jsx — Global authentication state for the RMS Face AI dashboard.
 * 
 * Provides:
 *   - user, accessToken, isAuthenticated state
 *   - login(email, password), register(orgName, email, password, name), logout()
 *   - Auto-refresh: intercepts 401 responses, refreshes the token, retries
 *   - apiClient: an Axios instance that auto-attaches the Authorization header
 * 
 * In single-tenant mode (backend has no DATABASE_URL), authentication is skipped
 * and the user is automatically granted org_admin access.
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMultiTenant, setIsMultiTenant] = useState(null); // null = unknown

  // ─── Axios Instance with Auth Header ─────────────────────────────────
  const apiClient = useMemo(() => {
    const instance = axios.create({
      baseURL: API_BASE.replace(/\/api\/?$/, ''),
    });

    // Request interceptor: attach Bearer token
    instance.interceptors.request.use((config) => {
      const token = accessToken;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor: handle 401 by refreshing
    instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry && refreshToken) {
          originalRequest._retry = true;
          try {
            const res = await axios.post(`${API_BASE}/auth/refresh`, {
              refresh_token: refreshToken,
            });
            const newToken = res.data.access_token;
            setAccessToken(newToken);
            setUser(res.data.user);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return instance(originalRequest);
          } catch (refreshError) {
            // Refresh also failed — force logout
            logout();
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );

    return instance;
  }, [accessToken, refreshToken]);

  // ─── Check if backend is running in multi-tenant mode ────────────────
  useEffect(() => {
    const checkMode = async (retries = 5) => {
      try {
        // Try to hit /api/auth/me without a token
        // In single-tenant mode, @require_auth is a no-op and returns the local admin
        const res = await axios.get(`${API_BASE}/auth/me`);
        if (res.data?.user?.org_id === null || res.data?.user?.id === 'local-admin' || res.data?.user?.email === 'admin@rms.local') {
          // Local / Single-tenant dev mode — auto-login as local admin
          setIsMultiTenant(false);
          setUser(res.data.user);
          setAccessToken('single-tenant-token');
          sessionStorage.setItem('rms_access_token', 'single-tenant-token');
          setLoading(false);
          return;
        }
      } catch (err) {
        if (err.response?.status === 401) {
          // Multi-tenant mode — need real auth
          setIsMultiTenant(true);
        } else if (!err.response && retries > 0) {
          // Network error (connection refused / backend starting up), retry in 2s
          setTimeout(() => checkMode(retries - 1), 2000);
          return; // don't continue to sessionStorage check yet
        }
      }

      // Check for persisted tokens in sessionStorage
      const savedToken = sessionStorage.getItem('rms_access_token');
      const savedRefresh = sessionStorage.getItem('rms_refresh_token');
      if (savedToken && savedRefresh) {
        setAccessToken(savedToken);
        setRefreshToken(savedRefresh);
        try {
          const res = await axios.get(`${API_BASE}/auth/me`, {
            headers: { Authorization: `Bearer ${savedToken}` },
          });
          setUser(res.data.user);
          setIsMultiTenant(true);
        } catch {
          // Token expired — try refresh
          try {
            const refreshRes = await axios.post(`${API_BASE}/auth/refresh`, {
              refresh_token: savedRefresh,
            });
            setAccessToken(refreshRes.data.access_token);
            setUser(refreshRes.data.user);
            sessionStorage.setItem('rms_access_token', refreshRes.data.access_token);
          } catch {
            // Refresh also failed — clear everything
            sessionStorage.removeItem('rms_access_token');
            sessionStorage.removeItem('rms_refresh_token');
          }
        }
      }
      setLoading(false);
    };

    checkMode();
  }, []);

  // ─── Auth Actions ────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
    const { access_token, refresh_token, user: userData } = res.data;

    setAccessToken(access_token);
    setRefreshToken(refresh_token);
    setUser(userData);
    setIsMultiTenant(userData.org_id !== null);

    sessionStorage.setItem('rms_access_token', access_token);
    sessionStorage.setItem('rms_refresh_token', refresh_token);

    return userData;
  }, []);

  const register = useCallback(async (orgName, email, password, name) => {
    const res = await axios.post(`${API_BASE}/auth/register`, {
      org_name: orgName,
      email,
      password,
      name,
    });
    const { access_token, refresh_token, user: userData } = res.data;

    setAccessToken(access_token);
    setRefreshToken(refresh_token);
    setUser(userData);
    setIsMultiTenant(userData.org_id !== null);

    sessionStorage.setItem('rms_access_token', access_token);
    sessionStorage.setItem('rms_refresh_token', refresh_token);

    return userData;
  }, []);

  const logout = useCallback(() => {
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);

    sessionStorage.removeItem('rms_access_token');
    sessionStorage.removeItem('rms_refresh_token');
  }, []);

  const loginLocalDev = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/auth/me`);
      const devUser = res.data?.user || {
        id: 'local-admin',
        name: 'System Administrator',
        email: 'admin@rms.local',
        role: 'org_admin',
        org_id: 'default-org',
        org_name: 'Default Organization'
      };
      setUser(devUser);
      setAccessToken('single-tenant-token');
      sessionStorage.setItem('rms_access_token', 'single-tenant-token');
      sessionStorage.setItem('rms_refresh_token', 'single-tenant-refresh');
      setIsMultiTenant(false);
      return devUser;
    } catch {
      const fallbackUser = {
        id: 'local-admin',
        name: 'System Administrator',
        email: 'admin@rms.local',
        role: 'org_admin',
        org_id: 'default-org',
        org_name: 'Default Organization'
      };
      setUser(fallbackUser);
      setAccessToken('single-tenant-token');
      sessionStorage.setItem('rms_access_token', 'single-tenant-token');
      sessionStorage.setItem('rms_refresh_token', 'single-tenant-refresh');
      setIsMultiTenant(false);
      return fallbackUser;
    }
  }, []);

  const updateOnboardingState = useCallback(async (newState) => {
    try {
      const res = await axios.post(`${API_BASE}/onboarding/state`, {
        onboarding_state: newState
      }, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
      });
      const saved = res.data?.onboarding_state || newState;
      setUser(prev => prev ? ({ ...prev, onboarding_state: saved }) : prev);
      return saved;
    } catch (e) {
      setUser(prev => prev ? ({ ...prev, onboarding_state: newState }) : prev);
      return newState;
    }
  }, [accessToken]);

  const value = {
    user,
    accessToken,
    isAuthenticated: !!user || isMultiTenant === false,
    isMultiTenant,
    loading,
    login,
    loginLocalDev,
    register,
    logout,
    apiClient,
    updateOnboardingState,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
