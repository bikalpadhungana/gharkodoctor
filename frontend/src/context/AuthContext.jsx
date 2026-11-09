import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, onUnauthorized } from '../services/api';
import { STAFF_ROLES } from '../config';

const AuthContext = createContext();

const readStorage = (key, fallback) => {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
};
const writeStorage = (key, value) => {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* storage unavailable (private mode) — session stays in memory */
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => readStorage('gd_token', null));
  const [loading, setLoading] = useState(() => Boolean(readStorage('gd_token', null)));
  const [lang, setLang] = useState(() => readStorage('gd_lang', 'ne')); // Nepali default

  const logout = useCallback(() => {
    writeStorage('gd_token', null);
    setToken(null);
    setUser(null);
  }, []);

  // Server says our token is no longer valid → clear the session everywhere.
  useEffect(() => onUnauthorized(logout), [logout]);

  useEffect(() => {
    document.documentElement.lang = lang === 'ne' ? 'ne' : 'en';
  }, [lang]);

  useEffect(() => {
    let cancelled = false;
    const fetchUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      const data = await api.getMe(token);
      if (cancelled) return;
      if (data.success) {
        setUser(data.user);
      } else if (!data.networkError) {
        // Only drop the session for real auth failures, not for a flaky 3G connection.
        logout();
      }
      setLoading(false);
    };
    fetchUser();
    return () => { cancelled = true; };
  }, [token, logout]);

  const loginUser = (userData, userToken) => {
    writeStorage('gd_token', userToken);
    setToken(userToken);
    setUser(userData);
  };

  // Lets pages refresh the cached profile after edits (e.g. provider profile, verification status).
  const refreshUser = useCallback(async () => {
    if (!token) return;
    const data = await api.getMe(token);
    if (data.success) setUser(data.user);
  }, [token]);

  const toggleLang = () => {
    const newLang = lang === 'ne' ? 'en' : 'ne';
    setLang(newLang);
    writeStorage('gd_lang', newLang);
  };

  const isStaff = STAFF_ROLES.includes(user?.role);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      lang,
      loginUser,
      logout,
      refreshUser,
      toggleLang,
      isAuthenticated: !!user,
      isPatient: user?.role === 'patient',
      isProvider: user?.role === 'provider',
      isStaff,
      // Kept for existing call sites; now includes superadmin (previously excluded from nav).
      isAdmin: isStaff
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
