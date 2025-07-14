import { createContext, useContext } from 'react';

const AdminContext = createContext(null);

export const AdminProvider = ({ children, adminId }) => {
  return (
    <AdminContext.Provider value={adminId}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdminId = () => {
  const adminId = useContext(AdminContext);
  if (adminId === null) {
    throw new Error('useAdminId must be used within an AdminProvider');
  }
  return adminId;
};
