import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Initialize axios defaults immediately
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  useEffect(() => {
    if (token) {
      const savedUser = JSON.parse(localStorage.getItem('user'));
      if (savedUser) setUser(savedUser);
    }
    setLoading(false);
  }, [token]);

  // Global axios interceptors for token management and 401 handling
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const currentToken = localStorage.getItem('token');
        if (currentToken) {
          config.headers.Authorization = `Bearer ${currentToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        // Only redirect if it's a 401 and not on the login page already
        if (error.response?.status === 401 && !error.config.url.includes('/auth/login')) {
          const currentToken = localStorage.getItem('token');
          // Only clear and redirect if we actually had a token (to avoid redirect loops)
          if (currentToken) {
            console.warn('Session expired or invalid. Logging out.');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
            setToken(null);
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  const login = async (email, password, role) => {
    try {
      const response = await axios.post('http://localhost:8000/auth/login', { email, password, role });
      const { access_token, user: userData } = response.data;
      
      // Normalize role to lowercase for frontend consistency
      if (userData && userData.role) {
        userData.role = userData.role.toLowerCase();
      }
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setToken(access_token);
      setUser(userData);
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      return userData;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
