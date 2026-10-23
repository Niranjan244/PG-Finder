import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { ThemeToggle } from './ThemeToggle.jsx';
import { NotificationDropdown } from './NotificationDropdown.jsx';
import { HeaderSearchBar } from '../search/HeaderSearchBar.jsx';
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
  ChevronDown,
  Compass,
} from 'lucide-react';

export const Header = ({ searchMeta = {} }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { totalUnread } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const isSearchPage = location.pathname === '/search';

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
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
    <header className="sticky top-0 z-40 border-b border-theme-border bg-theme-surface/95 backdrop-blur-md transition-colors shadow-xs">
      {/* Main Header Row */}
      <div className="relative mx-auto flex h-16 max-w-[1760px] w-full items-center justify-between gap-3 sm:gap-4 px-4 sm:px-6 lg:px-8 xl:px-10">
        {/* Brand Logo */}
        <Link to={isAuthenticated ? '/search' : '/'} className="flex items-center gap-2.5 group shrink-0 z-10">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-theme-brand text-white shadow-xs transition-transform duration-200 group-hover:scale-105 group-hover:bg-theme-brand-hover">
            <Building2 className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-theme-primary hidden sm:inline">PG Finder</span>
        </Link>

        {/* Center: Integrated Discovery Search Bar (Dead Center) */}
        <div className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg lg:max-w-xl xl:max-w-2xl px-4 z-10">
          <HeaderSearchBar />
        </div>

        {/* Mobile Search Bar (< md screens) */}
        <div className="flex md:hidden flex-1 mx-2">
          <HeaderSearchBar />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 z-10">
          {isAuthenticated ? (
            <div className="flex items-center gap-2 sm:gap-2.5">
              {/* Clean Dashboard Pill Button */}
              <Link
                to={getDashboardPath()}
                className="inline-flex items-center gap-2 rounded-xl border border-theme-brand/20 bg-theme-brand/5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-theme-brand hover:bg-theme-brand/15 hover:border-theme-brand/40 transition-all shadow-xs"
                title="Go to Dashboard"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>

              {/* Normal Chat Icon Button with Unread Badge */}
              <Link
                to="/chat"
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-theme-border bg-theme-surface text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary hover:border-theme-border/80 transition-all active:scale-95 shadow-xs"
                title="Direct Messages"
              >
                <MessageSquare className="h-5 w-5 text-theme-muted" />
                {totalUnread > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-rose-600 px-1 text-[11px] font-bold text-white shadow-xs animate-pulse">
                    {totalUnread > 99 ? '99+' : totalUnread}
                  </span>
                )}
              </Link>

              {/* Notifications Dropdown (Bell icon) */}
              <NotificationDropdown />

              <div className="h-5 w-px bg-theme-border mx-0.5 hidden sm:block" />

              {/* User Profile Dropdown */}
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 rounded-xl border border-theme-border bg-theme-surface p-1 sm:px-2.5 sm:py-1.5 text-xs sm:text-sm font-medium text-theme-primary hover:bg-theme-surface-hover hover:border-theme-border/80 transition-all shadow-xs"
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="true"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-theme-brand text-white font-bold text-xs uppercase shadow-xs">
                    {user.name ? user.name.charAt(0) : 'U'}
                  </div>
                  <span className="hidden md:inline text-xs sm:text-sm font-semibold text-theme-primary leading-tight max-w-[120px] truncate">
                    {user.name}
                  </span>
                  <ChevronDown className={`h-3.5 w-3.5 text-theme-muted transition-transform duration-200 hidden sm:inline ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-theme-border bg-theme-surface p-2 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2.5 border-b border-theme-border mb-1">
                      <p className="text-xs font-bold text-theme-primary truncate">{user.name}</p>
                      <p className="text-[11px] text-theme-muted truncate">{user.email}</p>
                      <div className="mt-1.5">
                        <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getRoleBadgeStyle(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <Link
                        to={getDashboardPath()}
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-hover transition-colors"
                      >
                        <LayoutDashboard className="h-4 w-4 text-theme-brand" />
                        <span>Dashboard Overview</span>
                      </Link>

                      {user.role === 'tenant' && (
                        <>
                          <Link
                            to="/tenant/bookings"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-hover transition-colors"
                          >
                            <Calendar className="h-4 w-4 text-theme-brand" />
                            <span>My Bookings</span>
                          </Link>
                          <Link
                            to="/wishlist"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-hover transition-colors"
                          >
                            <Heart className="h-4 w-4 text-rose-500" />
                            <span>Saved PGs</span>
                          </Link>
                          <Link
                            to="/tenant/payments"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-hover transition-colors"
                          >
                            <CreditCard className="h-4 w-4 text-emerald-500" />
                            <span>Payment Receipts</span>
                          </Link>
                        </>
                      )}

                      {user.role === 'owner' && (
                        <>
                          <Link
                            to="/owner/listings"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-hover transition-colors"
                          >
                            <Building2 className="h-4 w-4 text-indigo-500" />
                            <span>My Accommodations</span>
                          </Link>
                          <Link
                            to="/owner/bookings"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-hover transition-colors"
                          >
                            <Inbox className="h-4 w-4 text-indigo-500" />
                            <span>Booking Requests</span>
                          </Link>
                          <Link
                            to="/owner/payments"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-hover transition-colors"
                          >
                            <CreditCard className="h-4 w-4 text-emerald-500" />
                            <span>Received Payments</span>
                          </Link>
                        </>
                      )}
                    </div>

                    <div className="pt-1 mt-1 border-t border-theme-border">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
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

          {/* Accessible Theme Toggle */}
          <div className="pl-1 border-l border-theme-border">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;