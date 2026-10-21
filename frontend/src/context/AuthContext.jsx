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

const getStoredToken = () => sessionStorage.getItem('rms_access_token') || localStorage.getItem('rms_access_token') || null;
const getStoredRefresh = () => sessionStorage.getItem('rms_refresh_token') || localStorage.getItem('rms_refresh_token') || null;
const getStoredUser = () => {
  try {
    const raw = sessionStorage.getItem('rms_user') || localStorage.getItem('rms_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const initialToken = useMemo(() => getStoredToken(), []);
  const initialRefresh = useMemo(() => getStoredRefresh(), []);
  const initialUser = useMemo(() => getStoredUser(), []);

  const [user, setUser] = useState(initialUser);
  const [accessToken, setAccessToken] = useState(initialToken);
  const [refreshToken, setRefreshToken] = useState(initialRefresh);
  // Fast loading: if no stored token, loading is false immediately (0ms wait for login/landing pages)
  const [loading, setLoading] = useState(!!initialToken);
  const [isMultiTenant, setIsMultiTenant] = useState(true);

  const saveTokens = useCallback((access, refresh, userData) => {
    if (access) {
      localStorage.setItem('rms_access_token', access);
      sessionStorage.setItem('rms_access_token', access);
    }
    if (refresh) {
      localStorage.setItem('rms_refresh_token', refresh);
      sessionStorage.setItem('rms_refresh_token', refresh);
    }
    if (userData) {
      localStorage.setItem('rms_user', JSON.stringify(userData));
      sessionStorage.setItem('rms_user', JSON.stringify(userData));
    }
  }, []);

  const clearTokens = useCallback(() => {
    localStorage.removeItem('rms_access_token');
    localStorage.removeItem('rms_refresh_token');
    localStorage.removeItem('rms_user');
    sessionStorage.removeItem('rms_access_token');
    sessionStorage.removeItem('rms_refresh_token');
    sessionStorage.removeItem('rms_user');
  }, []);

  // ─── Axios Instance with Auth Header ─────────────────────────────────
  const apiClient = useMemo(() => {
    const instance = axios.create({
      baseURL: API_BASE.replace(/\/api\/?$/, ''),
      timeout: 60000,
    });

    instance.interceptors.request.use((config) => {
      const token = accessToken;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry && refreshToken) {
          originalRequest._retry = true;
          try {
            const res = await axios.post(`${API_BASE}/auth/refresh`, {
              refresh_token: refreshToken,
            }, { timeout: 6000 });
            const newToken = res.data.access_token;
            setAccessToken(newToken);
            setUser(res.data.user);
            saveTokens(newToken, refreshToken, res.data.user);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return instance(originalRequest);
          } catch (refreshError) {
            logout();
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );

    return instance;
  }, [accessToken, refreshToken, saveTokens]);

  const logout = useCallback(() => {
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    clearTokens();
  }, [clearTokens]);

  // ─── Fast Initial Session Hydration & Pre-warm ───────────────────────
  useEffect(() => {
    // Pre-warm backend asynchronously so Render wake-up starts immediately in background
    axios.get(`${API_BASE}/ping`, { timeout: 4000 }).catch(() => {});

    // Local dev bypass check
    const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (import.meta.env.VITE_BYPASS_AUTH === 'true' && isLocalHost && !initialToken) {
      loginLocalDev();
      setLoading(false);
      return;
    }

    if (!initialToken) {
      setLoading(false);
      return;
    }

    // Validate stored token in background with tight timeout
    axios.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${initialToken}` },
      timeout: 5000,
    })
      .then((res) => {
        if (res.data?.user) {
          setUser(res.data.user);
          saveTokens(null, null, res.data.user);
        }
      })
      .catch(async (err) => {
        if (err.response?.status === 401 && initialRefresh) {
          try {
            const refreshRes = await axios.post(`${API_BASE}/auth/refresh`, {
              refresh_token: initialRefresh,
            }, { timeout: 5000 });
            const newToken = refreshRes.data.access_token;
            const newUser = refreshRes.data.user;
            setAccessToken(newToken);
            setUser(newUser);
            saveTokens(newToken, initialRefresh, newUser);
          } catch {
            logout();
          }
        } else if (!err.response) {
          // Timeout / server spinning up — keep cached user so dashboard stays available
          console.warn('Network timeout during auth check, using cached credentials');
        } else {
          logout();
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [initialToken, initialRefresh, saveTokens, logout]);

  // ─── Auth Actions ────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const res = await axios.post(`${API_BASE}/auth/login`, { email, password }, { timeout: 75000 });
    const { access_token, refresh_token, user: userData } = res.data;

    setAccessToken(access_token);
    setRefreshToken(refresh_token);
    setUser(userData);
    setIsMultiTenant(userData.org_id !== null);
    saveTokens(access_token, refresh_token, userData);

    return userData;
  }, [saveTokens]);

  const register = useCallback(async (orgName, email, password, name) => {
    const res = await axios.post(`${API_BASE}/auth/register`, {
      org_name: orgName,
      email,
      password,
      name,
    }, { timeout: 75000 });
    const { access_token, refresh_token, user: userData } = res.data;

    setAccessToken(access_token);
    setRefreshToken(refresh_token);
    setUser(userData);
    setIsMultiTenant(userData.org_id !== null);
    saveTokens(access_token, refresh_token, userData);

    return userData;
  }, [saveTokens]);

  const loginLocalDev = useCallback(async () => {
    const devUser = {
      id: 'local-admin',
      name: 'System Administrator',
      email: 'admin@rms.local',
      role: 'org_admin',
      org_id: 'default-org',
      org_name: 'Default Organization'
    };
    setUser(devUser);
    setAccessToken('single-tenant-token');
    saveTokens('single-tenant-token', 'single-tenant-refresh', devUser);
    setIsMultiTenant(false);
    setLoading(false);
    return devUser;
  }, [saveTokens]);

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
