import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('gd_token') || null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState(localStorage.getItem('gd_lang') || 'ne'); // Nepali default

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const data = await api.getMe(token);
          if (data.success) {
            setUser(data.user);
          } else {
            logout();
          }
        } catch (error) {
          console.error('Failed to load user session', error);
          logout();
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, [token]);

  const loginUser = (userData, userToken) => {
    localStorage.setItem('gd_token', userToken);
    setToken(userToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('gd_token');
    setToken(null);
    setUser(null);
  };

  const toggleLang = () => {
    const newLang = lang === 'ne' ? 'en' : 'ne';
    setLang(newLang);
    localStorage.setItem('gd_lang', newLang);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      lang,
      loginUser,
      logout,
      toggleLang,
      isAuthenticated: !!user,
      isPatient: user?.role === 'patient',
      isProvider: user?.role === 'provider',
      isAdmin: user?.role === 'admin' || user?.role === 'dispatcher'
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
