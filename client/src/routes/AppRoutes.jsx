import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout.jsx';
import { HomePage } from '../pages/HomePage.jsx';
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
import { OwnerBookingsPage } from '../pages/owner/OwnerBookingsPage.jsx';
import { ChatPage } from '../pages/chat/ChatPage.jsx';
import { WishlistPage } from '../pages/wishlist/WishlistPage.jsx';

// Redirect authenticated users away from auth forms directly into PG Finder
const PublicAuthRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;

  if (isAuthenticated) {
    return <Navigate to="/search" replace />;
  }

  return children;
};

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        {/* Landing Page with Embedded Login */}
        <Route index element={<HomePage />} />
        <Route path="login" element={<Navigate to="/" replace />} />
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

        {/* Protected General PG Finder Routes (Accessible to all authenticated roles) */}
        <Route element={<ProtectedRoute />}>
          <Route path="search" element={<SearchPage />} />
          <Route path="pg/:id" element={<PGDetailsPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="wishlist" element={<WishlistPage />} />

          {/* Protected Tenant Routes */}
          <Route element={<RoleRoute allowedRoles={['tenant']} />}>
            <Route path="dashboard/tenant" element={<TenantDashboard />} />
            <Route path="tenant/bookings" element={<TenantBookingsPage />} />
          </Route>

          {/* Protected PG Owner Routes */}
          <Route element={<RoleRoute allowedRoles={['owner', 'admin']} />}>
            <Route path="dashboard/owner" element={<OwnerDashboard />} />
            <Route path="owner/listings" element={<OwnerListingsPage />} />
            <Route path="owner/listings/new" element={<PGFormPage />} />
            <Route path="owner/listings/:id/edit" element={<PGFormPage />} />
            <Route path="owner/listings/:id/rooms" element={<PGRoomsPage />} />
            <Route path="owner/bookings" element={<OwnerBookingsPage />} />
          </Route>

          {/* Protected Admin Routes */}
          <Route element={<RoleRoute allowedRoles={['admin']} />}>
            <Route path="dashboard/admin" element={<AdminDashboard />} />
          </Route>
        </Route>

        {/* Catch-all 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
