import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Check localStorage or API for existing session
    setLoading(false);
  }, []);

  const login = (userData) => {
    setUser(userData);
    // TODO: Save token/session
  };

  const logout = () => {
    setUser(null);
    // TODO: Remove token/session
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}; 