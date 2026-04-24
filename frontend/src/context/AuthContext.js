import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  // On app start — restore user from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('funlearn_user');
      const token  = localStorage.getItem('access_token');
      if (stored && token) {
        setUser(JSON.parse(stored));
      }
    } catch {
      localStorage.removeItem('funlearn_user');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email, password, role) => {
    const res  = await loginUser({ email, password, role });
    const data = res.data;

    // Save tokens
    localStorage.setItem('access_token',  data.access);
    localStorage.setItem('refresh_token', data.refresh);

    // Save user object
    const userData = data.user;
    localStorage.setItem('funlearn_user', JSON.stringify(userData));
    setUser(userData);

    return userData;
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('funlearn_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}