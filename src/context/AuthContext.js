import React, { createContext, useState, useEffect } from 'react';
import { getUserSession } from '../services/storageService';
import { hasUsers } from '../services/database';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userExists, setUserExists] = useState(false);

  useEffect(() => {
    checkUserSession();
  }, []);

  const checkUserSession = async () => {
    try {
      const usersExist = await hasUsers();
      setUserExists(usersExist);

      const session = await getUserSession();
      if (session) {
        setUser(session);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Session Check Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  const markUserCreated = () => {
    setUserExists(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        userExists,
        login,
        logout,
        updateUser,
        markUserCreated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
