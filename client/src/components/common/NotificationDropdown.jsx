import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import {
  Bell,
  MessageSquare,
  Inbox,
  Calendar,
  LogOut,
} from 'lucide-react';
import {
  fetchNotificationsApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
} from '../../services/notificationClient.js';

export const NotificationDropdown = () => {
  const { isAuthenticated } = useAuth();
  const {
    socket,
    unreadNotifications,
    refreshNotificationCount,
    notificationPermission,
    requestNotificationPermission,
    testWindowNotification,
  } = useSocket();
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
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('open_chat_conversation', {
              detail: { conversationId: notif.data.conversationId, timestamp: Date.now() },
            })
          );
        }
      } else {
        navigate('/chat');
      }
    } else if (notif.type === 'listing_approved' || notif.type === 'listing_rejected') {
      navigate('/owner/listings');
    } else if (notif.type === 'new_review' && notif.data?.pgId) {
      navigate(`/pg/${notif.data.pgId}`);
    }
  };

  return (
    <div className="relative" ref={notifRef}>
      <button
        type="button"
        onClick={toggleNotifDropdown}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-theme-border bg-theme-surface text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary hover:border-theme-border/80 transition-all active:scale-95 shadow-xs"
        title="Notifications"
      >
        <Bell className="h-5 w-5 text-theme-muted" />
        {unreadNotifications > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-rose-600 px-1 text-[11px] font-bold text-white shadow-xs animate-pulse">
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
                className="text-[11px] font-semibold text-theme-brand hover:underline transition-colors cursor-pointer"
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

          {/* Footer: Native Window Desktop Notification Status & Quick Action */}
          <div className="p-2.5 border-t border-theme-border bg-theme-surface-subtle flex items-center justify-between text-[11px] rounded-b-2xl">
            <div className="flex items-center gap-1.5 text-theme-secondary font-medium">
              <span
                className={`h-2 w-2 rounded-full ${
                  notificationPermission === 'granted'
                    ? 'bg-emerald-500 animate-pulse'
                    : notificationPermission === 'denied'
                    ? 'bg-rose-500'
                    : 'bg-amber-500'
                }`}
              />
              <span>
                Desktop Alerts:{' '}
                {notificationPermission === 'granted'
                  ? 'Active'
                  : notificationPermission === 'denied'
                  ? 'Blocked'
                  : 'Off'}
              </span>
            </div>
            {notificationPermission === 'granted' ? (
              <button
                type="button"
                onClick={testWindowNotification}
                className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                Test Alert
              </button>
            ) : notificationPermission === 'denied' ? (
              <button
                type="button"
                onClick={requestNotificationPermission}
                className="font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
              >
                Fix (🔒)
              </button>
            ) : (
              <button
                type="button"
                onClick={requestNotificationPermission}
                className="font-semibold text-theme-brand hover:underline cursor-pointer"
              >
                Enable
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
