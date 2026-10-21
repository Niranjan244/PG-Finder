import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { ThemeToggle } from './ThemeToggle.jsx';
import {
  Building2,
  LogOut,
  LayoutDashboard,
  User,
  Calendar,
  Inbox,
  MessageSquare,
  Bell,
  Heart,
} from 'lucide-react';
import {
  fetchNotificationsApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
} from '../../services/notificationClient.js';

export const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { socket, totalUnread, unreadNotifications, refreshNotificationCount } = useSocket();
  const navigate = useNavigate();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);
  const notifRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Pre-fetch and update notification list dynamically in real time
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchNotificationsApi()
      .then((res) => {
        const list = res?.data?.notifications || res?.notifications || [];
        setNotifications(list);
      })
      .catch(() => {});
  }, [isAuthenticated, unreadNotifications]);

  useEffect(() => {
    if (!socket) return;
    const handleNewNotification = (notif) => {
      setNotifications((prev) => {
        const idx = prev.findIndex((n) => n._id === notif._id);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = notif;
          return updated;
        }
        return [notif, ...prev];
      });
      refreshNotificationCount();
    };

    socket.on('new_notification', handleNewNotification);
    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, [socket, refreshNotificationCount]);

  // Fetch recent notifications when dropdown is opened
  const toggleNotifDropdown = async () => {
    const nextState = !isNotifOpen;
    setIsNotifOpen(nextState);
    if (nextState) {
      try {
        setIsLoadingNotifs(true);
        const res = await fetchNotificationsApi();
        setNotifications(res?.data?.notifications || []);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      } finally {
        setIsLoadingNotifs(false);
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsReadApi();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      refreshNotificationCount();
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    }
  };

  const handleNotificationClick = async (notif) => {
    setIsNotifOpen(false);
    if (!notif.isRead) {
      try {
        await markNotificationReadApi(notif._id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
        refreshNotificationCount();
      } catch (err) {
        console.error('Failed to mark notification read:', err);
      }
    }

    // Contextual routing
    if (notif.type === 'booking_request') {
      navigate('/owner/bookings');
    } else if (notif.type === 'booking_approved' || notif.type === 'booking_rejected') {
      navigate('/tenant/bookings');
    } else if (notif.type === 'new_message') {
      if (notif.data?.conversationId) {
        navigate(`/chat?conversationId=${notif.data.conversationId}`);
      } else {
        navigate('/chat');
      }
    } else if (notif.type === 'listing_approved' || notif.type === 'listing_rejected') {
      navigate('/owner/listings');
    } else if (notif.type === 'new_review' && notif.data?.pgId) {
      navigate(`/pg/${notif.data.pgId}`);
    }
  };

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
                </>
              )}

              {user.role === 'tenant' && (
                <Link
                  to="/tenant/bookings"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-theme-border bg-theme-surface px-2.5 py-1.5 text-xs font-semibold text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary transition-colors shadow-xs"
                  title="My Bookings"
                >
                  <Calendar className="h-3.5 w-3.5 text-theme-brand" />
                  <span className="hidden md:inline">My Bookings</span>
                </Link>
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
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  onClick={toggleNotifDropdown}
                  className="relative inline-flex items-center justify-center rounded-lg border border-theme-border bg-theme-surface p-2 text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary transition-colors shadow-xs"
                  title="Notifications"
                >
                  <Bell className="h-4 w-4 text-theme-muted" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-xs">
                      {unreadNotifications > 99 ? '99+' : unreadNotifications}
                    </span>
                  )}
                </button>

                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-theme-border bg-theme-surface shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between border-b border-theme-border bg-theme-surface-subtle px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-theme-primary">Notifications</span>
                        {unreadNotifications > 0 && (
                          <span className="rounded-full bg-theme-brand-subtle px-2 py-0.5 text-[10px] font-bold text-theme-brand">
                            {unreadNotifications} new
                          </span>
                        )}
                      </div>
                      {notifications.some((n) => !n.isRead) && (
                        <button
                          type="button"
                          onClick={handleMarkAllRead}
                          className="text-[11px] font-semibold text-theme-brand hover:underline transition-colors"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-theme-border">
                      {isLoadingNotifs ? (
                        <div className="py-8 text-center text-xs text-theme-muted">
                          Loading alerts...
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="py-8 text-center px-4">
                          <Bell className="mx-auto h-6 w-6 text-theme-muted mb-2" />
                          <p className="text-xs font-medium text-theme-secondary">All caught up!</p>
                          <p className="text-[11px] text-theme-muted mt-0.5">No notifications yet.</p>
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <button
                            key={notif._id}
                            type="button"
                            onClick={() => handleNotificationClick(notif)}
                            className={`w-full p-3.5 text-left transition-colors flex items-start gap-3 hover:bg-theme-surface-hover ${
                              !notif.isRead ? 'bg-theme-brand-subtle/40' : ''
                            }`}
                          >
                            <div className="mt-0.5 shrink-0">
                              <div
                                className={`flex h-7 w-7 items-center justify-center rounded-full ${
                                  notif.type === 'new_message'
                                    ? 'bg-theme-brand-subtle text-theme-brand'
                                    : notif.type === 'booking_approved'
                                    ? 'bg-emerald-500/10 text-emerald-500'
                                    : notif.type === 'booking_rejected'
                                    ? 'bg-rose-500/10 text-rose-500'
                                    : notif.type === 'booking_request'
                                    ? 'bg-indigo-500/10 text-indigo-500'
                                    : notif.type === 'new_review'
                                    ? 'bg-amber-500/10 text-amber-500'
                                    : 'bg-theme-brand-subtle text-theme-brand'
                                }`}
                              >
                                {notif.type === 'new_message' ? (
                                  <MessageSquare className="h-3.5 w-3.5" />
                                ) : notif.type === 'booking_request' ? (
                                  <Inbox className="h-3.5 w-3.5" />
                                ) : notif.type === 'booking_approved' ? (
                                  <Calendar className="h-3.5 w-3.5" />
                                ) : notif.type === 'booking_rejected' ? (
                                  <LogOut className="h-3.5 w-3.5" />
                                ) : (
                                  <Bell className="h-3.5 w-3.5" />
                                )}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-bold text-theme-primary truncate">
                                  {notif.title}
                                </p>
                                <span className="text-[10px] text-theme-muted shrink-0">
                                  {new Date(notif.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                              <p className="text-[11px] text-theme-secondary mt-0.5 line-clamp-2 leading-relaxed">
                                {notif.message}
                              </p>
                            </div>
                            {!notif.isRead && (
                              <span className="h-2 w-2 rounded-full bg-theme-brand mt-1 shrink-0" />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

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
