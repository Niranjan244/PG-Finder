import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';
import { fetchTotalUnreadCountApi, fetchChatTokenApi } from '../services/chatClient.js';
import { fetchUnreadNotificationCountApi } from '../services/notificationClient.js';
import { ToastContainer } from '../components/common/ToastContainer.jsx';

const SocketContext = createContext(null);

const SOCKET_SERVER_URL =
  (typeof import.meta !== 'undefined' &&
    (import.meta.env?.VITE_SOCKET_URL || import.meta.env?.VITE_API_URL?.replace('/api', ''))) ||
  'http://localhost:5000';

// Gentle Web Audio API synthesizer chime
const playNotificationSound = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Ignore audio policy errors
  }
};

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [toasts, setToasts] = useState([]);
  const [activeChatConversationId, setActiveChatConversationId] = useState(null);

  const socketRef = useRef(null);
  const activeChatConversationIdRef = useRef(null);
  activeChatConversationIdRef.current = activeChatConversationId;

  const originalTitleRef = useRef(typeof document !== 'undefined' ? document.title : 'PG Finder');
  const titleFlashIntervalRef = useRef(null);

  // Restore document title when window gains focus
  useEffect(() => {
    const handleFocus = () => {
      clearInterval(titleFlashIntervalRef.current);
      if (typeof document !== 'undefined') {
        document.title = originalTitleRef.current;
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Request browser Notification permission on login
  useEffect(() => {
    if (isAuthenticated && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    }
  }, [isAuthenticated]);

  const flashTabTitle = useCallback((alertText) => {
    if (typeof document === 'undefined' || document.hasFocus()) return;
    clearInterval(titleFlashIntervalRef.current);
    let isAlert = true;
    titleFlashIntervalRef.current = setInterval(() => {
      document.title = isAlert ? `🔔 ${alertText}` : originalTitleRef.current;
      isAlert = !isAlert;
    }, 1200);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (toastData) => {
      const id = toastData.id || Date.now() + Math.random();
      const newToast = { ...toastData, id };
      setToasts((prev) => [newToast, ...prev.slice(0, 3)]);

      // 1. Play gentle audio ping
      playNotificationSound();

      // 2. Flash browser tab title if not focused
      flashTabTitle(toastData.title || 'New message');

      // 3. Trigger native desktop OS notification if permitted
      if (
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted' &&
        !document.hasFocus()
      ) {
        try {
          new Notification(toastData.title || 'PG Finder', {
            body: toastData.message || 'You received a new update',
            icon: '/favicon.ico',
          });
        } catch {
          // Native notification fallback
        }
      }

      // Auto dismiss after 6 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 6000);
    },
    [flashTabTitle]
  );

  // Load initial unread message count
  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) {
      setTotalUnread(0);
      return;
    }
    try {
      const res = await fetchTotalUnreadCountApi();
      const count =
        typeof res?.data?.totalUnread === 'number'
          ? res.data.totalUnread
          : typeof res?.totalUnread === 'number'
          ? res.totalUnread
          : typeof res?.data?.data?.totalUnread === 'number'
          ? res.data.data.totalUnread
          : 0;
      setTotalUnread(count);
    } catch {
      // Gracefully ignore network errors on badge fetch
    }
  }, [isAuthenticated]);

  // Load initial unread notification count
  const refreshNotificationCount = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadNotifications(0);
      return;
    }
    try {
      const res = await fetchUnreadNotificationCountApi();
      const count =
        typeof res?.data?.unreadCount === 'number'
          ? res.data.unreadCount
          : typeof res?.unreadCount === 'number'
          ? res.unreadCount
          : typeof res?.data?.data?.unreadCount === 'number'
          ? res.data.data.unreadCount
          : 0;
      setUnreadNotifications(count);
    } catch {
      // Gracefully ignore network errors
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    let isSubscribed = true;

    const initializeConnection = async () => {
      try {
        refreshUnreadCount();
        refreshNotificationCount();

        // Obtain dedicated WebSocket JWT token via authenticated REST endpoint
        let token = null;
        try {
          const tokenRes = await fetchChatTokenApi();
          token = tokenRes.data?.token;
        } catch (err) {
          console.warn('Could not fetch dedicated chat token, relying on cookies:', err);
        }

        if (!isSubscribed) return;

        // Disconnect previous instance if any
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }

        // Initialize authenticated Socket.IO connection
        const socketOptions = {
          withCredentials: true,
          transports: ['websocket', 'polling'],
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: Infinity,
          reconnectionDelay: 1000,
        };

        if (token) {
          socketOptions.auth = { token };
        }

        const newSocket = io(SOCKET_SERVER_URL, socketOptions);

        socketRef.current = newSocket;
        setSocket(newSocket);

        newSocket.on('connect', () => {
          if (isSubscribed) setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
          if (isSubscribed) setIsConnected(false);
        });

        newSocket.on('connect_error', (err) => {
          console.warn('Real-time chat socket connect error:', err.message);
          if (isSubscribed) setIsConnected(false);
        });

        newSocket.on('conversation_updated', () => {
          refreshUnreadCount();
        });

        newSocket.on('new_notification', (notif) => {
          refreshNotificationCount();

          const notifConvId = String(notif?.data?.conversationId || '');
          const activeConv = String(activeChatConversationIdRef.current || '');
          const isTabFocused = typeof document !== 'undefined' && document.hasFocus() && !document.hidden;

          // Only suppress toast if the user is actively staring at this conversation right now
          if (notifConvId && activeConv && notifConvId === activeConv && isTabFocused) {
            return;
          }

          showToast({
            id: notif?._id || Date.now(),
            title: notif?.title || 'New Notification',
            message: notif?.message || '',
            conversationId: notifConvId,
            type: notif?.type,
          });
        });

        newSocket.on('new_message', (payload) => {
          refreshUnreadCount();

          const msg = payload?.message || payload;
          const convId = String(
            payload?.conversationId ||
            msg?.conversation?._id ||
            msg?.conversation ||
            msg?.conversationId ||
            ''
          );

          // Don't toast my own sent messages
          const senderId = String(msg?.sender?._id || msg?.sender || '');
          const myId = String(user?.id || user?._id || '');
          if (senderId && myId && senderId === myId) {
            return;
          }

          const activeConv = String(activeChatConversationIdRef.current || '');
          const isTabFocused = typeof document !== 'undefined' && document.hasFocus() && !document.hidden;

          // Only suppress toast if the user is actively staring at this conversation right now
          if (convId && activeConv && convId === activeConv && isTabFocused) {
            return;
          }

          showToast({
            id: msg?._id || Date.now(),
            title: `Message from ${msg?.sender?.name || 'User'}`,
            message: msg?.text || 'Sent you a message',
            conversationId: convId,
            type: 'new_message',
          });
        });

        newSocket.on('notification_unread_count', (payload) => {
          const count =
            typeof payload?.unreadCount === 'number'
              ? payload.unreadCount
              : typeof payload === 'number'
              ? payload
              : 0;
          setUnreadNotifications(count);
        });
      } catch (err) {
        console.error('Failed to initialize socket connection:', err);
      }
    };

    initializeConnection();

    return () => {
      isSubscribed = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
    };
  }, [isAuthenticated, user, refreshUnreadCount, refreshNotificationCount, showToast]);

  const decrementUnreadBy = (count) => {
    setTotalUnread((prev) => Math.max(0, prev - count));
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        totalUnread,
        unreadNotifications,
        refreshUnreadCount,
        refreshNotificationCount,
        decrementUnreadBy,
        showToast,
        activeChatConversationId,
        setActiveChatConversationId,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;
