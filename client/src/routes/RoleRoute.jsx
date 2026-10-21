import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export const RoleRoute = ({ allowedRoles, children }) => {
  const { role } = useAuth();

  if (!allowedRoles.includes(role)) {
    const roleFallbackMap = {
      tenant: '/dashboard/tenant',
      owner: '/dashboard/owner',
      admin: '/dashboard/admin',
    };

    const targetRoute = roleFallbackMap[role] || '/';
    return <Navigate to={targetRoute} replace />;
  }

  return children ? children : <Outlet />;
};

export default RoleRoute;
