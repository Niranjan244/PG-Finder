import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { DashboardSidebar } from '../components/dashboard/DashboardSidebar.jsx';
import { ThemeToggle } from '../components/common/ThemeToggle.jsx';
import { NotificationDropdown } from '../components/common/NotificationDropdown.jsx';
import { Menu, Building2, Search, ArrowLeft } from 'lucide-react';

export const DashboardLayout = () => {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Helper to format breadcrumb / section indicator
  const getSectionTitle = () => {
    const path = location.pathname;
    if (path.includes('/dashboard/tenant')) return 'Tenant Overview';
    if (path.includes('/tenant/bookings')) return 'My Bookings';
    if (path.includes('/tenant/payments')) return 'Payment Receipts';
    if (path.includes('/dashboard/owner')) return 'Owner Portal';
    if (path.includes('/owner/listings')) return 'Property Listings';
    if (path.includes('/owner/bookings')) return 'Tenant Requests';
    if (path.includes('/owner/payments')) return 'Received Payments';
    if (path.includes('/dashboard/admin')) return 'Administration';
    if (path.includes('/admin/payments')) return 'Financial Overview';
    if (path.includes('/wishlist')) return 'Saved Accommodations';
    if (path.includes('/chat')) return 'Direct Messages';
    return 'Dashboard';
  };

  return (
    <div className="min-h-screen bg-theme-bg text-theme-primary transition-colors flex">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Sidebar Slide-Over */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-theme-sidebar transition-transform duration-300 ease-in-out lg:hidden shadow-xl ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <DashboardSidebar onClose={() => setMobileMenuOpen(false)} />
      </div>

      {/* Desktop Persistent Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-30 lg:flex lg:w-64 lg:flex-col">
        <DashboardSidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col lg:pl-64 min-w-0">
        {/* Slim Top Bar */}
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-theme-border bg-theme-sidebar/95 px-4 sm:px-6 lg:px-8 backdrop-blur-xs transition-colors">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden rounded-lg p-1.5 text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary transition-colors"
              aria-label="Open sidebar menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Breadcrumb Section Indicator */}
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="text-theme-muted hidden sm:inline">Portal</span>
              <span className="text-theme-muted hidden sm:inline">/</span>
              <span className="text-theme-primary font-bold">{getSectionTitle()}</span>
            </div>
          </div>

          {/* Right Action Icons: Search, Notifications, Theme Toggle, Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/search"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-theme-border bg-theme-surface px-2.5 py-1 text-xs font-medium text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary transition-colors shadow-2xs"
            >
              <Search className="h-3.5 w-3.5 text-theme-muted" />
              <span>Explore PGs</span>
            </Link>

            {/* Notifications Dropdown */}
            <NotificationDropdown />

            {/* Theme Toggle Button */}
            <ThemeToggle />

            {/* User Avatar Chip */}
            <div className="flex items-center gap-2 pl-2 border-l border-theme-border">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-theme-brand text-[11px] font-bold text-white shadow-2xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="hidden md:inline text-xs font-semibold text-theme-primary">
                {user?.name}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
