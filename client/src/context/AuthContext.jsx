import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMeApi, loginApi, registerApi, logoutApi } from '../services/authClient.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const resetActivityTimestamp = () => {
    try {
      localStorage.setItem('pg_last_active', Date.now().toString());
      localStorage.removeItem('pg_session_logout');
    } catch {
      // Ignore storage errors
    }
  };

  const checkAuth = async () => {
    try {
      const response = await getMeApi();
      if (response?.data?.user) {
        setUser(response.data.user);
        resetActivityTimestamp();
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (credentials) => {
    const response = await loginApi(credentials);
    const authenticatedUser = response?.data?.user;
    setUser(authenticatedUser);
    resetActivityTimestamp();
    return authenticatedUser;
  };

  const register = async (userData) => {
    const response = await registerApi(userData);
    const registeredUser = response?.data?.user;
    setUser(registeredUser);
    resetActivityTimestamp();
    return registeredUser;
  };

  const logout = async () => {
    try {
      await logoutApi();
    } finally {
      setUser(null);
      try {
        localStorage.removeItem('pg_last_active');
      } catch {
        // Ignore
      }
    }
  };

  const setAuthUser = (userData) => {
    setUser(userData);
    resetActivityTimestamp();
    return userData;
  };

  const value = {
    user,
    role: user?.role || null,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    setAuthUser,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
