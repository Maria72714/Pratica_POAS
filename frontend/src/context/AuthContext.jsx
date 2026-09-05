import React, { createContext, useContext, useState, useEffect } from 'react';
import { logoutUsuario as limparStorage } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isLogged, setIsLogged] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('suap_access_token');
    const userData = localStorage.getItem('suap_user') || localStorage.getItem('usuario');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
      setIsLogged(true);
    }
    
    setLoading(false);
  }, []);

  const setAuthenticatedUser = (userData) => {
    setUser(userData);
    setIsLogged(true);
  };

  const logout = () => {
    limparStorage();
    setUser(null);
    setIsLogged(false);
  };

  return (
    <AuthContext.Provider value={{ isLogged, loading, user, setAuthenticatedUser, logout }}>
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
