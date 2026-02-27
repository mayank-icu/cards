import React, { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';

// Admin emails - in production, this should come from environment variables or a secure admin collection
const ADMIN_EMAILS = [
  'admin@egreet.com',
  'mayankkumar.inc@gmail.com' // Replace with your actual admin email
];

const AdminAuthContext = createContext({
  isAdmin: false,
  checkAdminAccess: () => false
});

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider = ({ children }) => {
  const { currentUser } = useAuth();
  
  const checkAdminAccess = (user = currentUser) => {
    if (!user || !user.email) return false;
    return ADMIN_EMAILS.includes(user.email.toLowerCase());
  };

  const value = {
    isAdmin: checkAdminAccess(),
    checkAdminAccess
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};
