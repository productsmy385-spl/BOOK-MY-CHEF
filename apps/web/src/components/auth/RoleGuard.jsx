import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';

/**
 * RoleGuard: Enforces strict account-based authorization.
 * Prevents URL tampering or manual cross-console access.
 */
export default function RoleGuard({ allowedRoles, children }) {
  const location = useLocation();
  const { isAuthenticated, userType } = useAuthStore();

  // 1. Unauthenticated users are redirected to login/welcome
  if (!isAuthenticated || !userType) {
    if (location.pathname.startsWith('/admin')) {
      return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }
    return <Navigate to="/auth/welcome" state={{ from: location }} replace />;
  }

  // 2. Role Check & Automatic Console Routing
  if (allowedRoles && !allowedRoles.includes(userType)) {
    // If a Customer attempts to access a Provider route -> Redirect to /customer/home
    if (userType === 'CUSTOMER') {
      return <Navigate to="/customer/home" replace />;
    }

    // If a Provider attempts to access a Customer-only route -> Redirect to /provider/dashboard
    if (userType === 'PROVIDER') {
      return <Navigate to="/provider/dashboard" replace />;
    }

    // If an Admin attempts to access non-admin routes -> Redirect to /admin/dashboard
    if (userType === 'ADMIN') {
      return <Navigate to="/admin" replace />;
    }

    return <Navigate to="/auth/welcome" replace />;
  }

  return children ? children : <Outlet />;
}
