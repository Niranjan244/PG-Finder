import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import {
  Building2,
  LayoutDashboard,
  Calendar,
  Heart,
  MessageSquare,
  CreditCard,
  Search,
  Inbox,
  Shield,
  Users,
  LogOut,
  X,
  ChevronRight,
  Receipt,
} from 'lucide-react';

export const DashboardSidebar = ({ onClose }) => {
  const { user, logout } = useAuth();
  const { totalUnread } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    if (onClose) onClose();
    await logout();
    navigate('/');
  };

  const getNavItems = () => {
    if (!user) return [];

    if (user.role === 'admin') {
      return [
        {
          label: 'Overview',
          path: '/dashboard/admin',
          icon: LayoutDashboard,
          end: true,
        },
        {
          label: 'Listings Moderation',
          path: '/dashboard/admin?tab=listings',
          icon: Building2,
          isActive: (pathname, search) => pathname === '/dashboard/admin' && (!search || search.includes('tab=listings')),
        },
        {
          label: 'User Management',
          path: '/dashboard/admin?tab=users',
          icon: Users,
          isActive: (pathname, search) => pathname === '/dashboard/admin' && search.includes('tab=users'),
        },
        {
          label: 'Revenue & Payments',
          path: '/admin/payments',
          icon: CreditCard,
        },
      ];
    }

    if (user.role === 'owner') {
      return [
        {
          label: 'Overview',
          path: '/dashboard/owner',
          icon: LayoutDashboard,
          end: true,
        },
        {
          label: 'My Accommodations',
          path: '/owner/listings',
          icon: Building2,
        },
        {
          label: 'Booking Requests',
          path: '/owner/bookings',
          icon: Inbox,
        },
        {
          label: 'Direct Chat',
          path: '/chat',
          icon: MessageSquare,
          badge: totalUnread,
        },
        {
          label: 'Tokens Received',
          path: '/owner/payments',
          icon: Receipt,
        },
      ];
    }

    // Default: Tenant
    return [
      {
        label: 'Overview',
        path: '/dashboard/tenant',
        icon: LayoutDashboard,
        end: true,
      },
      {
        label: 'Search Accommodations',
        path: '/search',
        icon: Search,
      },
      {
        label: 'My Bookings',
        path: '/tenant/bookings',
        icon: Calendar,
      },
      {
        label: 'Saved Wishlist',
        path: '/wishlist',
        icon: Heart,
      },
      {
        label: 'Direct Chat',
        path: '/chat',
        icon: MessageSquare,
        badge: totalUnread,
      },
      {
        label: 'Payment Receipts',
        path: '/tenant/payments',
        icon: Receipt,
      },
    ];
  };

  const navItems = getNavItems();

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900';
      case 'owner':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-900';
      default:
        return 'bg-blue-50 text-brand-700 border-brand-200 dark:bg-blue-950/50 dark:text-brand-300 dark:border-brand-900';
    }
  };

  return (
    <aside className="flex h-full flex-col justify-between bg-theme-sidebar border-r border-theme-border transition-colors">
      {/* Brand & Close button on Mobile */}
      <div>
        <div className="flex h-14 items-center justify-between px-4 sm:px-6 border-b border-theme-border">
          <NavLink
            to="/"
            onClick={onClose}
            className="flex items-center gap-2.5 group"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-theme-brand text-white shadow-xs transition-colors group-hover:bg-theme-brand-hover">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold tracking-tight text-theme-primary">
                PG Finder
              </span>
              <span className="rounded bg-theme-surface-hover px-1.5 py-0.5 text-[10px] font-semibold text-theme-secondary border border-theme-border">
                Portal
              </span>
            </div>
          </NavLink>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden rounded-lg p-1 text-theme-muted hover:bg-theme-surface-hover hover:text-theme-primary transition-colors"
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation List */}
        <div className="p-3">
          <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-theme-muted">
            {user?.role === 'admin'
              ? 'Administration'
              : user?.role === 'owner'
              ? 'Property Management'
              : 'Tenant Portal'}
          </div>

          <nav className="space-y-1 mt-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isCustomActive = item.isActive
                ? item.isActive(location.pathname, location.search)
                : false;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  onClick={onClose}
                  className={({ isActive }) => {
                    const active = isCustomActive || isActive;
                    return `flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                      active
                        ? 'bg-theme-brand text-white shadow-xs'
                        : 'text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary'
                    }`;
                  }}
                >
                  {({ isActive }) => {
                    const active = isCustomActive || isActive;
                    return (
                      <>
                        <div className="flex items-center gap-2.5">
                          <Icon
                            className={`h-4 w-4 shrink-0 ${
                              active ? 'text-white' : 'text-theme-muted'
                            }`}
                          />
                          <span>{item.label}</span>
                        </div>

                        {item.badge > 0 && (
                          <span
                            className={`flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                              active
                                ? 'bg-white text-brand-700'
                                : 'bg-rose-600 text-white shadow-xs'
                            }`}
                          >
                            {item.badge > 99 ? '99+' : item.badge}
                          </span>
                        )}
                      </>
                    );
                  }}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Profile & Logout */}
      <div className="p-3 border-t border-theme-border">
        <div className="rounded-xl border border-theme-border bg-theme-surface p-3 transition-colors">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-theme-primary">
                {user?.name || 'User'}
              </p>
              <p className="truncate text-[11px] text-theme-muted">{user?.email}</p>
            </div>
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-bold capitalize shrink-0 ${getRoleBadgeStyle(
                user?.role
              )}`}
            >
              {user?.role}
            </span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-theme-border bg-theme-surface-hover py-1.5 text-xs font-semibold text-theme-secondary hover:bg-rose-500/10 hover:text-rose-600 hover:border-rose-500/20 transition-all shadow-2xs"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
