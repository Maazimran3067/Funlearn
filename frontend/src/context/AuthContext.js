import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

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

  const login = async (emailOrNull, password, role, usernameOrNull = null) => {
    const payload = {};

    if (usernameOrNull) {
      // Student — login with username
      payload.username = usernameOrNull;
    } else {
      // Teacher, Parent, Admin — login with email
      payload.email = emailOrNull;
    }

    payload.password = password;
    payload.role     = role;

    const res      = await loginUser(payload);
    const data     = res.data;

    localStorage.setItem('access_token',  data.access);
    localStorage.setItem('refresh_token', data.refresh);
    localStorage.setItem('funlearn_user', JSON.stringify(data.user));

    setUser(data.user);
    return data.user;
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