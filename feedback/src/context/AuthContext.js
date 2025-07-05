import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = async (username, password) => {
    setLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (
      (username === "teacher" && password === "password") ||
      (username === "student" && password === "password") ||
      (username === "admin" && password === "password")
    ) {
      const userData = {
        id: username === "teacher" ? 1 : 1,
        username,
        role: username,
        name: username === "teacher" ? "Dr. Sarah Johnson" : "Alice Johnson",
        email: username === "teacher" ? "teacher@feedback4u.edu" : "alice.johnson@email.com"
      };
      setCurrentUser(userData);
      setLoading(false);
      return true;
    }

    setLoading(false);
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
