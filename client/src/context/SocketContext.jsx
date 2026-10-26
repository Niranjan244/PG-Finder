import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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

// Rich, pleasant Web Audio API melodic synthesizer chime
const playNotificationSound = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;

    // Tone 1: High crisp ding (D5 - 587.33Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.32);

    // Tone 2: Harmonic ping (A5 - 880Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.08);
    gain2.gain.setValueAtTime(0.25, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.45);
  } catch {
    // Gracefully ignore audio policy errors if autoplay is restricted
  }
};

export const SocketProvider = ({ children }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [toasts, setToasts] = useState([]);
  const [activeChatConversationId, setActiveChatConversationId] = useState(null);

  // Native desktop window notification permission state ('default' | 'granted' | 'denied' | 'unsupported')
  const [notificationPermission, setNotificationPermission] = useState(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });

  const socketRef = useRef(null);
  const activeChatConversationIdRef = useRef(null);
  activeChatConversationIdRef.current = activeChatConversationId;

  const originalTitleRef = useRef(typeof document !== 'undefined' ? document.title : 'PG Finder');
  const titleFlashIntervalRef = useRef(null);
  const processedMessageIdsRef = useRef(new Set());
  const lastNotificationRef = useRef({ time: 0, text: '', id: '' });

  // Register Service Worker in background (non-blocking)
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[PG Finder] Service Worker registered:', reg.scope);
        })
        .catch((err) => {
          console.warn('[PG Finder] SW registration note:', err);
        });

      const handleSwMessage = (event) => {
        if (event.data?.type === 'open_chat_conversation' && event.data?.conversationId) {
          navigate(`/chat?conversationId=${event.data.conversationId}`);
          window.dispatchEvent(
            new CustomEvent('open_chat_conversation', {
              detail: { conversationId: event.data.conversationId, timestamp: Date.now() },
            })
          );
        }
      };
      navigator.serviceWorker.addEventListener('message', handleSwMessage);
      return () => navigator.serviceWorker.removeEventListener('message', handleSwMessage);
    }
  }, [navigate]);

  // Restore document title & sync permission when window gains focus
  useEffect(() => {
    const handleFocus = () => {
      clearInterval(titleFlashIntervalRef.current);
      if (typeof document !== 'undefined') {
        document.title = originalTitleRef.current;
      }
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setNotificationPermission(Notification.permission);
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Sync notification permission state on mount & when auth changes
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, [isAuthenticated]);

  const flashTabTitle = useCallback((alertText) => {
    if (typeof document === 'undefined') return;
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

      // Auto dismiss after 6 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 6000);
    },
    []
  );

  const dispatchDirectNotification = useCallback((notifTitle, notifOptions, conversationId) => {
    try {
      const notif = new Notification(notifTitle, notifOptions);
      notif.onclick = (event) => {
        event.preventDefault();
        window.focus();
        try {
          notif.close();
        } catch (_) {}

        if (conversationId) {
          navigate(`/chat?conversationId=${conversationId}`);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('open_chat_conversation', {
                detail: { conversationId, timestamp: Date.now() },
              })
            );
          }
        }
      };
      return notif;
    } catch (err) {
      console.warn('[Notification] Direct Notification error:', err);
      return null;
    }
  }, [navigate]);

  // Trigger native desktop OS notification INSTANTLY and EXACTLY ONCE
  const triggerWindowNotification = useCallback(
    ({ title, body, conversationId, messageId }) => {
      if (typeof window === 'undefined' || !('Notification' in window)) {
        return null;
      }

      if (Notification.permission !== 'granted') {
        return null;
      }

      // Debounce: strictly prevent double notifications for the same message
      const now = Date.now();
      const textKey = (body || '').trim();
      const idKey = String(messageId || '');
      if (idKey && lastNotificationRef.current.id === idKey) {
        return null;
      }

      lastNotificationRef.current = { time: now, text: textKey, id: idKey };

      const notifTitle = title || 'PG Finder Message';
      const notifOptions = {
        body: body || 'New message received',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'msg_' + (idKey || now), // Fresh unique tag so Windows 11 pops it up immediately
        renotify: true,
        data: { conversationId, messageId: idKey },
      };

      // 1. Deliver native OS desktop notification INSTANTLY (0ms latency on Windows/macOS/Linux)
      const directNotif = dispatchDirectNotification(notifTitle, notifOptions, conversationId);
      if (directNotif) {
        return directNotif;
      }

      // 2. Fallback to Service Worker only if direct constructor fails (e.g. mobile Android Chrome)
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready
          .then((reg) => {
            return reg.showNotification(notifTitle, notifOptions);
          })
          .catch(() => {});
        return null;
      }

      return null;
    },
    [dispatchDirectNotification]
  );

  // Request browser notification permission explicitly via user gesture
  const requestNotificationPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      showToast({
        id: 'notif_unsupported_' + Date.now(),
        title: 'Notifications Unsupported',
        message: 'Your browser does not support native laptop notifications.',
        type: 'warning',
      });
      return 'unsupported';
    }

    const currentPermission = Notification.permission;
    setNotificationPermission(currentPermission);

    if (currentPermission === 'denied') {
      playNotificationSound();
      showToast({
        id: 'notif_blocked_' + Date.now(),
        title: '⚠️ Notifications Blocked in Browser',
        message: 'Click the 🔒 icon next to localhost:5173 in the address bar, set Notifications to "Allow", then reload.',
        type: 'warning',
      });
      return 'denied';
    }

    try {
      let result = currentPermission;

      if (typeof Notification.requestPermission === 'function') {
        const promiseOrUndefined = Notification.requestPermission((p) => {
          if (p) {
            result = p;
            setNotificationPermission(p);
          }
        });

        if (promiseOrUndefined && typeof promiseOrUndefined.then === 'function') {
          result = await promiseOrUndefined;
        }
      }

      setNotificationPermission(result);

      if (result === 'granted') {
        playNotificationSound();
        showToast({
          id: 'notif_granted_' + Date.now(),
          title: '✅ Laptop Notifications Active!',
          message: 'Notifications will now appear in your laptop notification center.',
          type: 'success',
        });
        triggerWindowNotification({
          title: '💬 PG Finder: Notifications Active',
          body: 'Messages between tenants and owners will now appear right here on your laptop screen.',
        });
      } else if (result === 'denied') {
        playNotificationSound();
        showToast({
          id: 'notif_denied_' + Date.now(),
          title: '⚠️ Notifications Blocked',
          message: 'Click the 🔒 lock icon in the address bar to change Notifications to Allow.',
          type: 'warning',
        });
      }

      return result;
    } catch (err) {
      console.warn('Failed to request notification permission:', err);
      showToast({
        id: 'notif_err_' + Date.now(),
        title: 'Permission Notice',
        message: 'Click the 🔒 lock icon in your address bar to set Notifications to Allow.',
        type: 'warning',
      });
      return 'denied';
    }
  }, [triggerWindowNotification, showToast]);

  // Test native window notification helper for evaluation / demonstration
  const testWindowNotification = useCallback(() => {
    // 1. Audio chime
    playNotificationSound();

    // 2. Tab title flash
    flashTabTitle('Test Chat Message');

    // 3. Deliver directly to Windows 11 Desktop (Laptop Notifications Section)
    triggerWindowNotification({
      title: '💬 Tenant Venkat (tenant)',
      body: 'Hello owner! Is the single room available from next month?',
      conversationId: 'test',
      messageId: 'test_' + Date.now(),
    });
  }, [flashTabTitle, triggerWindowNotification]);

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
          upgrade: true,
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: Infinity,
          reconnectionDelay: 500,
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

        // Non-chat notifications (bookings, reviews, etc.)
        newSocket.on('new_notification', (notif) => {
          refreshNotificationCount();

          // Suppress if it is a chat message notification on either tenant or owner side
          const notifConvId = String(notif?.data?.conversationId || '');
          if (notif?.type === 'new_message' || notifConvId) {
            return;
          }

          // Native window desktop notification
          triggerWindowNotification({
            title: notif?.title || 'New Notification',
            body: notif?.message || '',
            conversationId: notifConvId,
          });

          // Play audio chime & flash tab
          playNotificationSound();
          flashTabTitle(notif?.title || 'New notification');

          showToast({
            id: notif?._id || Date.now(),
            title: notif?.title || 'New Notification',
            message: notif?.message || '',
            conversationId: notifConvId,
            type: notif?.type,
          });
        });

        // Real-time chat message delivery (Tenant <-> Owner)
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

          // Deduplicate incoming events by message ID (prevents double alert if emitted on both channels)
          const msgId = String(msg?._id || '');
          if (msgId) {
            if (processedMessageIdsRef.current.has(msgId)) {
              return;
            }
            processedMessageIdsRef.current.add(msgId);
            if (processedMessageIdsRef.current.size > 200) {
              const firstVal = processedMessageIdsRef.current.values().next().value;
              processedMessageIdsRef.current.delete(firstVal);
            }
          }

          // Do NOT notify for user's own sent messages
          const senderId = String(msg?.sender?._id || msg?.sender || '');
          const myId = String(user?.id || user?._id || '');
          if (senderId && myId && senderId === myId) {
            return;
          }

          const senderName = msg?.sender?.name || 'User';
          const senderRole = msg?.sender?.role ? ` (${msg?.sender?.role})` : '';
          const messageText =
            msg?.text ||
            (msg?.attachments?.[0]?.fileType === 'image'
              ? '📷 Photo'
              : msg?.attachments?.[0]
              ? `📄 ${msg.attachments[0].originalName || 'Document'}`
              : 'Sent you a message');

          // 1. Deliver to Windows 11 Laptop Notifications Section (Action Center)
          triggerWindowNotification({
            title: `💬 ${senderName}${senderRole}`,
            body: messageText,
            conversationId: convId,
            senderName,
            messageId: msgId,
          });

          // 2. Play gentle melodic synthesizer chime
          playNotificationSound();

          // 3. Flash browser tab title
          flashTabTitle(`New message from ${senderName}`);
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
  }, [isAuthenticated, user, refreshUnreadCount, refreshNotificationCount, showToast, triggerWindowNotification, flashTabTitle]);

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
        notificationPermission,
        setNotificationPermission,
        requestNotificationPermission,
        testWindowNotification,
        triggerWindowNotification,
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
