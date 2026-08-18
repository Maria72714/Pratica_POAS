import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isLogged, setIsLogged] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('suap_access_token');
    const userData = localStorage.getItem('suap_user');
    
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
    localStorage.removeItem('suap_access_token');
    localStorage.removeItem('suap_token_expiry');
    localStorage.removeItem('suap_user');
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
