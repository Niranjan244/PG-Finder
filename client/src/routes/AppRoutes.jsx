import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout.jsx';
import { DashboardLayout } from '../layouts/DashboardLayout.jsx';
import { HomePage } from '../pages/HomePage.jsx';
import { LoginPage } from '../pages/auth/LoginPage.jsx';
import { RegisterPage } from '../pages/auth/RegisterPage.jsx';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage.jsx';
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage.jsx';
import { TenantDashboard } from '../pages/dashboards/TenantDashboard.jsx';
import { OwnerDashboard } from '../pages/dashboards/OwnerDashboard.jsx';
import { AdminDashboard } from '../pages/dashboards/AdminDashboard.jsx';
import { OwnerListingsPage } from '../pages/owner/OwnerListingsPage.jsx';
import { PGFormPage } from '../pages/owner/PGFormPage.jsx';
import { PGRoomsPage } from '../pages/owner/PGRoomsPage.jsx';
import { PGDetailsPage } from '../pages/pg/PGDetailsPage.jsx';
import { NotFoundPage } from '../pages/NotFoundPage.jsx';
import { ProtectedRoute } from './ProtectedRoute.jsx';
import { RoleRoute } from './RoleRoute.jsx';
import { useAuth } from '../context/AuthContext.jsx';

import { SearchPage } from '../pages/search/SearchPage.jsx';
import { TenantBookingsPage } from '../pages/tenant/TenantBookingsPage.jsx';
import { TenantPaymentsPage } from '../pages/tenant/TenantPaymentsPage.jsx';
import { OwnerBookingsPage } from '../pages/owner/OwnerBookingsPage.jsx';
import { OwnerPaymentsPage } from '../pages/owner/OwnerPaymentsPage.jsx';
import { AdminPaymentsPage } from '../pages/admin/AdminPaymentsPage.jsx';
import { ChatPage } from '../pages/chat/ChatPage.jsx';
import { WishlistPage } from '../pages/wishlist/WishlistPage.jsx';

// Redirect authenticated users away from public auth forms directly to their dashboard
const PublicAuthRoute = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;

  if (isAuthenticated && user) {
    if (user.role === 'admin') return <Navigate to="/dashboard/admin" replace />;
    if (user.role === 'owner') return <Navigate to="/dashboard/owner" replace />;
    return <Navigate to="/dashboard/tenant" replace />;
  }

  return children;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Standalone Landing Page (includes its own dedicated Figma-style Navbar & Footer) */}
      <Route path="/" element={<HomePage />} />

      {/* Standalone Split-Screen Auth Pages */}
      <Route
        path="login"
        element={
          <PublicAuthRoute>
            <LoginPage />
          </PublicAuthRoute>
        }
      />

      {/* Main Layout routes (Public & Auth Pages) */}
      <Route element={<MainLayout />}>
        <Route
          path="register"
          element={
            <PublicAuthRoute>
              <RegisterPage />
            </PublicAuthRoute>
          }
        />
        <Route
          path="forgot-password"
          element={
            <PublicAuthRoute>
              <ForgotPasswordPage />
            </PublicAuthRoute>
          }
        />
        <Route
          path="reset-password"
          element={
            <PublicAuthRoute>
              <ResetPasswordPage />
            </PublicAuthRoute>
          }
        />
        <Route
          path="reset-password/:token"
          element={
            <PublicAuthRoute>
              <ResetPasswordPage />
            </PublicAuthRoute>
          }
        />

        {/* Public Accommodations Discovery */}
        <Route path="search" element={<SearchPage />} />
        <Route path="pg/:id" element={<PGDetailsPage />} />

        {/* Catch-all 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Dedicated Clean SaaS Dashboard Layout for Authenticated Portals */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          {/* General Authenticated Features */}
          <Route path="chat" element={<ChatPage />} />
          <Route path="wishlist" element={<WishlistPage />} />

          {/* Protected Tenant Routes */}
          <Route element={<RoleRoute allowedRoles={['tenant']} />}>
            <Route path="dashboard/tenant" element={<TenantDashboard />} />
            <Route path="tenant/bookings" element={<TenantBookingsPage />} />
            <Route path="tenant/payments" element={<TenantPaymentsPage />} />
          </Route>

          {/* Protected PG Owner Routes */}
          <Route element={<RoleRoute allowedRoles={['owner', 'admin']} />}>
            <Route path="dashboard/owner" element={<OwnerDashboard />} />
            <Route path="owner/listings" element={<OwnerListingsPage />} />
            <Route path="owner/listings/new" element={<PGFormPage />} />
            <Route path="owner/listings/:id/edit" element={<PGFormPage />} />
            <Route path="owner/listings/:id/rooms" element={<PGRoomsPage />} />
            <Route path="owner/bookings" element={<OwnerBookingsPage />} />
            <Route path="owner/payments" element={<OwnerPaymentsPage />} />
          </Route>

          {/* Protected Admin Routes */}
          <Route element={<RoleRoute allowedRoles={['admin']} />}>
            <Route path="dashboard/admin" element={<AdminDashboard />} />
            <Route path="admin/payments" element={<AdminPaymentsPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
};

export default AppRoutes;
