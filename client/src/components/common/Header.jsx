import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { ThemeToggle } from './ThemeToggle.jsx';
import { NotificationDropdown } from './NotificationDropdown.jsx';
import {
  Building2,
  LogOut,
  LayoutDashboard,
  User,
  Calendar,
  Inbox,
  MessageSquare,
  Heart,
  CreditCard,
} from 'lucide-react';

export const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { totalUnread } = useSocket();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getDashboardPath = () => {
    if (!user) return '/';
    if (user.role === 'admin') return '/dashboard/admin';
    if (user.role === 'owner') return '/dashboard/owner';
    return '/dashboard/tenant';
  };

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800';
      case 'owner':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800';
      default:
        return 'bg-blue-50 text-brand-700 border-brand-200 dark:bg-blue-950/50 dark:text-brand-300 dark:border-brand-800';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'owner':
        return 'PG Owner';
      default:
        return 'Tenant';
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-theme-border bg-theme-surface/95 backdrop-blur transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to={isAuthenticated ? '/search' : '/'} className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-theme-brand text-white shadow-xs transition-colors group-hover:bg-theme-brand-hover">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-theme-primary">PG Finder</span>
            <span className="ml-1.5 rounded bg-theme-surface-hover px-1.5 py-0.5 text-xs font-medium text-theme-secondary border border-theme-border">
              Platform
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                to="/search"
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-theme-secondary hover:text-theme-brand transition-colors"
              >
                <Building2 className="h-3.5 w-3.5 text-theme-muted" />
                <span className="hidden sm:inline">Explore PGs</span>
              </Link>
              {user.role === 'owner' && (
                <>
                  <Link
                    to="/owner/listings"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-theme-border bg-theme-surface px-2.5 py-1.5 text-xs font-semibold text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary transition-colors shadow-xs"
                    title="My Accommodations"
                  >
                    <Building2 className="h-3.5 w-3.5 text-indigo-500" />
                    <span className="hidden md:inline">My PGs</span>
                  </Link>

                  <Link
                    to="/owner/bookings"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-theme-border bg-theme-surface px-2.5 py-1.5 text-xs font-semibold text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary transition-colors shadow-xs"
                    title="Booking Requests"
                  >
                    <Inbox className="h-3.5 w-3.5 text-indigo-500" />
                    <span className="hidden md:inline">Requests</span>
                  </Link>

                  <Link
                    to="/owner/payments"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-theme-border bg-theme-surface px-2.5 py-1.5 text-xs font-semibold text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary transition-colors shadow-xs"
                    title="Received Payments"
                  >
                    <CreditCard className="h-3.5 w-3.5 text-indigo-500" />
                    <span className="hidden md:inline">Tokens</span>
                  </Link>
                </>
              )}

              {user.role === 'tenant' && (
                <>
                  <Link
                    to="/tenant/bookings"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-theme-border bg-theme-surface px-2.5 py-1.5 text-xs font-semibold text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary transition-colors shadow-xs"
                    title="My Bookings"
                  >
                    <Calendar className="h-3.5 w-3.5 text-theme-brand" />
                    <span className="hidden md:inline">My Bookings</span>
                  </Link>

                  <Link
                    to="/tenant/payments"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-theme-border bg-theme-surface px-2.5 py-1.5 text-xs font-semibold text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary transition-colors shadow-xs"
                    title="Payment History"
                  >
                    <CreditCard className="h-3.5 w-3.5 text-theme-brand" />
                    <span className="hidden md:inline">Payments</span>
                  </Link>
                </>
              )}

              <Link
                to="/wishlist"
                className="inline-flex items-center gap-1.5 rounded-lg border border-theme-border bg-theme-surface px-2.5 py-1.5 text-xs font-semibold text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary transition-colors shadow-xs"
                title="Saved PGs"
              >
                <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500/10" />
                <span className="hidden md:inline">Saved</span>
              </Link>

              <Link
                to="/chat"
                className="relative inline-flex items-center gap-1.5 rounded-lg border border-theme-border bg-theme-surface px-2.5 py-1.5 text-xs font-semibold text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary transition-colors shadow-xs"
                title="Direct Messages"
              >
                <MessageSquare className="h-3.5 w-3.5 text-theme-brand" />
                <span className="hidden md:inline">Messages</span>
                {totalUnread > 0 && (
                  <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-xs">
                    {totalUnread > 99 ? '99+' : totalUnread}
                  </span>
                )}
              </Link>

              {/* Notifications Dropdown */}
              <NotificationDropdown />

              <Link
                to={getDashboardPath()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-theme-border bg-theme-surface px-2.5 py-1.5 text-xs font-semibold text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary transition-colors shadow-xs"
                title="Dashboard"
              >
                <LayoutDashboard className="h-3.5 w-3.5 text-theme-brand" />
                <span className="hidden lg:inline">Dashboard</span>
              </Link>

              <div className="h-4 w-px bg-theme-border hidden sm:block" />

              <div className="flex items-center gap-2">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold text-theme-primary leading-tight">{user.name}</span>
                  <span className="text-[11px] text-theme-muted leading-tight">{user.email}</span>
                </div>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getRoleBadgeStyle(
                    user.role
                  )}`}
                >
                  {getRoleLabel(user.role)}
                </span>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                title="Sign out"
                className="inline-flex items-center gap-1.5 rounded-lg border border-theme-border bg-theme-surface p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-medium text-theme-secondary hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30 transition-colors shadow-xs"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-theme-secondary hover:text-theme-brand transition-colors"
              >
                <User className="h-3.5 w-3.5" />
                <span>Sign In</span>
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 rounded-lg bg-theme-brand px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-theme-brand-hover transition-colors"
              >
                <span>Create Account</span>
              </Link>
            </div>
          )}

          {/* Accessible Theme Toggle (Rendered for all users on mobile & desktop) */}
          <div className="pl-1 border-l border-theme-border">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
