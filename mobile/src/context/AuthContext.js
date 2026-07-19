import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setupAuthInterceptor, api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMultiTenant, setIsMultiTenant] = useState(null);

  useEffect(() => {
    // We update the api client token when access token changes
    if (accessToken) {
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, [accessToken]);

  const logout = useCallback(async () => {
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    await AsyncStorage.removeItem('rms_access_token');
    await AsyncStorage.removeItem('rms_refresh_token');
  }, []);

  useEffect(() => {
    // Setup interceptor for auto-refresh
    setupAuthInterceptor(async (failedRequest) => {
      if (!refreshToken) return Promise.reject(new Error('No refresh token'));
      try {
        const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
        const newToken = response.data.access_token;
        setAccessToken(newToken);
        setUser(response.data.user);
        await AsyncStorage.setItem('rms_access_token', newToken);
        failedRequest.headers.Authorization = `Bearer ${newToken}`;
        return api.request(failedRequest);
      } catch (e) {
        await logout();
        return Promise.reject(e);
      }
    });
  }, [refreshToken, logout]);

  useEffect(() => {
    const checkMode = async () => {
      try {
        const res = await api.get('/auth/me');
        if (res.data?.user?.org_id === null) {
          setIsMultiTenant(false);
          setUser(res.data.user);
          setAccessToken(null);
          setLoading(false);
          return;
        }
      } catch (err) {
        if (err.response?.status === 401) {
          setIsMultiTenant(true);
        } else {
            console.error('Error checking multi-tenant mode:', err.message);
        }
      }

      const savedToken = await AsyncStorage.getItem('rms_access_token');
      const savedRefresh = await AsyncStorage.getItem('rms_refresh_token');
      
      if (savedToken && savedRefresh) {
        setAccessToken(savedToken);
        setRefreshToken(savedRefresh);
        try {
          const res = await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${savedToken}` }
          });
          setUser(res.data.user);
          setIsMultiTenant(true);
        } catch {
          // Attempt refresh
          try {
            const refreshRes = await api.post('/auth/refresh', { refresh_token: savedRefresh });
            setAccessToken(refreshRes.data.access_token);
            setUser(refreshRes.data.user);
            await AsyncStorage.setItem('rms_access_token', refreshRes.data.access_token);
          } catch {
             await logout();
          }
        }
      }
      setLoading(false);
    };

    checkMode();
  }, [logout]);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { access_token, refresh_token, user: userData } = res.data;

    setAccessToken(access_token);
    setRefreshToken(refresh_token);
    setUser(userData);
    setIsMultiTenant(true);

    await AsyncStorage.setItem('rms_access_token', access_token);
    await AsyncStorage.setItem('rms_refresh_token', refresh_token);

    return userData;
  }, []);

  const value = {
    user,
    accessToken,
    isAuthenticated: !!user,
    isMultiTenant,
    loading,
    login,
    logout,
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
