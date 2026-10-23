import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import {
  fetchMyConversationsApi,
  fetchConversationMessagesApi,
  sendMessageApi,
  markConversationReadApi,
} from '../../services/chatClient.js';
import {
  MessageSquare,
  Send,
  Building2,
  ArrowLeft,
  Loader2,
  ExternalLink,
  Search,
  Check,
  CheckCheck,
  ChevronDown,
} from 'lucide-react';

const getSenderId = (entity) => {
  if (!entity) return '';
  if (typeof entity === 'string') return entity;
  if (typeof entity === 'object') {
    return String(entity._id || entity.id || '');
  }
  return String(entity);
};

export const ChatPage = () => {
  const { user } = useAuth();
  const currentUserId = user?.id || user?._id;
  const { socket, isConnected, decrementUnreadBy, setActiveChatConversationId } = useSocket();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const conversationIdFromQuery = searchParams.get('conversationId');
  const [activeConversationId, setActiveConversationId] = useState(conversationIdFromQuery || null);
  const [fetchedConversation, setFetchedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [typingStatus, setTypingStatus] = useState('');
  const [filterSearch, setFilterSearch] = useState('');
  const [showMobileChat, setShowMobileChat] = useState(Boolean(conversationIdFromQuery));
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);

  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const isNearBottomRef = useRef(true);
  const typingTimeoutRef = useRef(null);

  // Fetch list of conversations
  const {
    data: conversationsData,
    isLoading: isConversationsLoading,
  } = useQuery({
    queryKey: ['myConversations'],
    queryFn: fetchMyConversationsApi,
    staleTime: 0,
    refetchInterval: 5000,
  });

  const conversations =
    conversationsData?.data?.conversations ||
    conversationsData?.data?.data?.conversations ||
    conversationsData?.conversations ||
    (Array.isArray(conversationsData?.data) ? conversationsData.data : []);

  // Auto-select first conversation if none selected
  useEffect(() => {
    if (conversationIdFromQuery) {
      setActiveConversationId(conversationIdFromQuery);
      setShowMobileChat(true);
    } else if (conversations.length > 0 && !activeConversationId) {
      setActiveConversationId(conversations[0]._id);
    }
  }, [conversationIdFromQuery, conversations, activeConversationId]);

  const activeConversation =
    conversations.find((conversation) => conversation._id === activeConversationId) ||
    (fetchedConversation?._id === activeConversationId ? fetchedConversation : null);

  // Helper to determine counterpart details
  const getCounterpart = useCallback(
    (conv) => {
      if (!conv || !user) return { name: 'User', role: 'user', email: '' };
      const myIdStr = getSenderId(user.id || user._id);
      const tenantIdStr = getSenderId(conv.tenant);
      const isTenant = myIdStr && tenantIdStr ? myIdStr === tenantIdStr : user?.role === 'tenant';
      return isTenant ? conv.owner : conv.tenant;
    },
    [user]
  );

  const counterpart = getCounterpart(activeConversation);

  // Load message history when active conversation changes
  useEffect(() => {
    if (!activeConversationId) return;

    let isMounted = true;
    const loadMessages = async () => {
      try {
        const response = await fetchConversationMessagesApi(activeConversationId);
        if (isMounted) {
          const list =
            response.data?.messages ||
            response.data?.data?.messages ||
            (Array.isArray(response.data) ? response.data : []);
          setMessages(list);
          const conv = response.data?.conversation || response.data?.data?.conversation;
          if (conv) {
            setFetchedConversation(conv);
          }
        }
      } catch (error) {
        console.error('Failed to load conversation messages:', error);
      }
    };

    loadMessages();

    // Mark as read immediately on open
    markConversationReadApi(activeConversationId)
      .then((response) => {
        const readCount = response.data?.markedCount || response.data?.data?.markedCount || 0;
        if (readCount > 0) {
          decrementUnreadBy(readCount);
          queryClient.invalidateQueries({ queryKey: ['myConversations'] });
        }
      })
      .catch((error) => console.error('Failed to mark read on open:', error));

    return () => {
      isMounted = false;
    };
  }, [activeConversationId, decrementUnreadBy, queryClient]);

  // Sync active conversation with SocketContext to suppress popup toasts for current chat
  useEffect(() => {
    if (activeConversationId) {
      setActiveChatConversationId(activeConversationId);
    }
    return () => {
      setActiveChatConversationId(null);
    };
  }, [activeConversationId, setActiveChatConversationId]);

  // Date comparison and formatting helpers
  const isSameDay = (d1, d2) => {
    if (!d1 || !d2) return false;
    const a = new Date(d1);
    const b = new Date(d2);
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  };

  const formatMessageDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (isSameDay(d, today)) return 'Today';
    if (isSameDay(d, yesterday)) return 'Yesterday';

    return d.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
  };

  // Scroll handler for auto-scroll vs "New messages" indicator
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const threshold = 120;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = distanceToBottom <= threshold;
    isNearBottomRef.current = nearBottom;
    setShowScrollBottomBtn(!nearBottom);
  };

  const scrollToBottom = (behavior = 'smooth') => {
    const container = scrollContainerRef.current;
    if (container) {
      if (behavior === 'smooth') {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth',
        });
      } else {
        container.scrollTop = container.scrollHeight;
      }
    }
    setShowScrollBottomBtn(false);
  };

  // Reset scroll position on active conversation change
  useEffect(() => {
    isNearBottomRef.current = true;
    setShowScrollBottomBtn(false);
    scrollToBottom('auto');
  }, [activeConversationId]);

  // Join and leave conversation socket rooms, and automatically re-join upon socket reconnect
  useEffect(() => {
    if (!socket || !activeConversationId) return;

    const joinRoom = () => {
      socket.emit('join_conversation', { conversationId: activeConversationId });
    };

    joinRoom();
    socket.on('connect', joinRoom);

    return () => {
      socket.off('connect', joinRoom);
      socket.emit('leave_conversation', { conversationId: activeConversationId });
    };
  }, [socket, activeConversationId]);

  // Scroll to bottom on new message only if already near bottom, else show "New messages" button
  useEffect(() => {
    if (isNearBottomRef.current) {
      scrollToBottom('smooth');
    } else {
      setShowScrollBottomBtn(true);
    }
  }, [messages, typingStatus]);

  // Handle incoming real-time socket events
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (payload) => {
      const msg = payload?.message || payload;
      const convId = String(
        payload?.conversationId ||
        msg?.conversation?._id ||
        msg?.conversation ||
        msg?.conversationId ||
        ''
      );
      const currentActiveId = String(activeConversationId || activeConversation?._id || '');

      if (!msg || typeof msg !== 'object' || !msg._id) return;

      if (convId && currentActiveId && convId === currentActiveId) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        markConversationReadApi(activeConversationId).catch(() => {});
        socket.emit('mark_read', { conversationId: activeConversationId });
      }
      queryClient.invalidateQueries({ queryKey: ['myConversations'] });
    };

    const handleUserTyping = (typingData) => {
      const convId = String(typingData?.conversationId || '');
      const currentActiveId = String(activeConversationId || activeConversation?._id || '');
      const senderName = typingData?.senderName || typingData?.userName || 'User';
      const senderUserId = String(typingData?.userId || '');
      const myId = String(currentUserId || '');

      if (convId && currentActiveId && convId === currentActiveId && senderUserId !== myId) {
        setTypingStatus(`${senderName} is typing...`);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setTypingStatus('');
        }, 3000);
      }
    };

    const handleUserStopTyping = (typingData) => {
      const convId = String(typingData?.conversationId || '');
      const currentActiveId = String(activeConversationId || activeConversation?._id || '');
      if (convId && currentActiveId && convId === currentActiveId) {
        setTypingStatus('');
      }
    };

    const handleMessagesRead = ({ conversationId }) => {
      const convId = String(conversationId || '');
      const currentActiveId = String(activeConversationId || activeConversation?._id || '');
      if (convId && currentActiveId && convId === currentActiveId) {
        setMessages((prev) =>
          prev.map((msg) => (msg.isRead ? msg : { ...msg, isRead: true }))
        );
      }
    };

    socket.on('new_message', handleReceiveMessage);
    socket.on('receive_message', handleReceiveMessage);
    socket.on('conversation_updated', handleReceiveMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);
    socket.on('messages_read', handleMessagesRead);

    return () => {
      socket.off('new_message', handleReceiveMessage);
      socket.off('receive_message', handleReceiveMessage);
      socket.off('conversation_updated', handleReceiveMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stop_typing', handleUserStopTyping);
      socket.off('messages_read', handleMessagesRead);
    };
  }, [socket, activeConversationId, activeConversation?._id, currentUserId, queryClient]);

  const handleInputChange = (event) => {
    setInputText(event.target.value);
    if (!socket || !activeConversationId) return;

    socket.emit('typing_start', {
      conversationId: activeConversationId,
      recipientId: counterpart?._id,
      senderName: user?.name,
    });
    socket.emit('typing', {
      conversationId: activeConversationId,
      recipientId: counterpart?._id,
      senderName: user?.name,
    });

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', {
        conversationId: activeConversationId,
        recipientId: counterpart?._id,
      });
      socket.emit('stop_typing', {
        conversationId: activeConversationId,
        recipientId: counterpart?._id,
      });
    }, 1500);
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    if (!inputText.trim() || isSending || !activeConversationId) return;

    const messageText = inputText.trim();
    setInputText('');
    setIsSending(true);

    if (socket) {
      socket.emit('typing_stop', {
        conversationId: activeConversationId,
        recipientId: counterpart?._id,
      });
      socket.emit('stop_typing', {
        conversationId: activeConversationId,
        recipientId: counterpart?._id,
      });
    }

    try {
      const response = await sendMessageApi(activeConversationId, messageText);
      const savedMessage =
        response.data?.message ||
        response.data?.data?.message ||
        (response.message && typeof response.message === 'object' ? response.message : null);

      if (savedMessage && typeof savedMessage === 'object' && savedMessage._id) {
        setMessages((prev) => {
          if (prev.some((msg) => msg._id === savedMessage._id)) return prev;
          return [...prev, savedMessage];
        });
      }
      queryClient.invalidateQueries({ queryKey: ['myConversations'] });
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleSelectConversation = (convId) => {
    setActiveConversationId(convId);
    setShowMobileChat(true);
  };

  const filteredConversations = conversations.filter((conversation) => {
    const counterpartInfo = getCounterpart(conversation);
    const search = filterSearch.toLowerCase();
    return (
      counterpartInfo?.name?.toLowerCase().includes(search) ||
      conversation.pg?.title?.toLowerCase().includes(search) ||
      conversation.pg?.city?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[500px]">
      <div className="flex-1 min-h-0 rounded-2xl border border-theme-border bg-theme-surface shadow-xs overflow-hidden flex flex-col md:flex-row transition-colors">
        {/* Left Sidebar: Conversations List */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-theme-border flex flex-col bg-theme-surface-subtle shrink-0 ${
            showMobileChat ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-theme-border bg-theme-surface">
            <div className="flex items-center justify-between">
              <h1 className="text-base font-bold text-theme-primary flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-theme-brand" />
                <span>Direct Inquiries</span>
              </h1>
              <span className="text-[11px] font-semibold text-theme-muted">
                {conversations.length} Active
              </span>
            </div>

            {/* Search Input */}
            <div className="relative mt-3">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-theme-muted" />
              <input
                type="text"
                value={filterSearch}
                onChange={(event) => setFilterSearch(event.target.value)}
                placeholder="Filter by name or property..."
                className="w-full rounded-lg border border-theme-border bg-theme-surface pl-8 pr-3 py-1.5 text-xs text-theme-primary placeholder-theme-muted focus:border-theme-brand focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-theme-border">
            {isConversationsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-5 w-5 animate-spin text-theme-brand" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-16 px-4">
                <MessageSquare className="mx-auto h-8 w-8 text-theme-muted" />
                <h3 className="mt-2 text-xs font-semibold text-theme-primary">No conversations found</h3>
                <p className="mt-1 text-[11px] text-theme-muted">
                  When you inquire about a PG listing, your conversation thread will appear here.
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const cp = getCounterpart(conv);
                const isSelected = String(conv._id) === String(activeConversationId);
                const myIdStr = getSenderId(user?.id || user?._id || currentUserId);
                const tenantIdStr = getSenderId(conv.tenant);
                const isTenant = myIdStr && tenantIdStr ? myIdStr === tenantIdStr : user?.role === 'tenant';
                const unread = isTenant ? conv.unreadCount?.tenant || 0 : conv.unreadCount?.owner || 0;

                return (
                  <button
                    key={conv._id}
                    type="button"
                    onClick={() => handleSelectConversation(conv._id)}
                    className={`w-full p-4 text-left transition-colors flex items-start gap-3 hover:bg-theme-surface-hover ${
                      isSelected ? 'bg-theme-surface-hover border-l-4 border-theme-brand' : ''
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-theme-brand-subtle text-theme-brand font-bold text-xs uppercase">
                        {cp?.name?.[0] || 'U'}
                      </div>
                      {unread > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white">
                          {unread}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-theme-primary text-xs truncate">
                          {cp?.name || 'User'}
                        </span>
                        {conv.lastMessage?.createdAt && (
                          <span className="text-[10px] text-theme-muted">
                            {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-theme-secondary font-medium truncate flex items-center gap-1 mt-0.5">
                        <Building2 className="h-3 w-3 shrink-0 text-theme-muted" />
                        <span>{conv.pg?.title || 'Accommodation'}</span>
                      </p>

                      <p className="text-[11px] text-theme-muted truncate mt-1">
                        {conv.lastMessage?.text ? (
                          <span>{conv.lastMessage.text}</span>
                        ) : (
                          <span className="italic">No messages exchanged yet</span>
                        )}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Main Pane: Active Message Stream */}
        <div
          className={`relative flex-1 min-w-0 flex flex-col bg-theme-surface ${
            !showMobileChat ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-theme-border flex items-center justify-between bg-theme-surface z-10 shadow-2xs shrink-0">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowMobileChat(false)}
                    className="md:hidden rounded-lg p-1 text-theme-muted hover:text-theme-primary hover:bg-theme-surface-hover"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>

                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-theme-brand-subtle text-theme-brand font-bold text-xs uppercase">
                    {counterpart?.name?.[0] || 'U'}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xs font-bold text-theme-primary">
                        {counterpart?.name || 'User'}
                      </h2>
                      <span className="rounded-full bg-theme-surface-hover border border-theme-border px-2 py-0.5 text-[10px] font-semibold text-theme-secondary uppercase">
                        {counterpart?.role || 'User'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-theme-muted">
                      <Building2 className="h-3 w-3 text-theme-muted" />
                      <span className="truncate max-w-xs">{activeConversation.pg?.title}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                      isConnected
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        : 'bg-theme-surface-hover text-theme-muted border-theme-border'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                      }`}
                    />
                    <span>{isConnected ? 'Real-Time Live' : 'Connecting'}</span>
                  </span>

                  {activeConversation.pg?._id && (
                    <Link
                      to={`/pg/${activeConversation.pg._id}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 rounded-lg border border-theme-border bg-theme-surface px-2.5 py-1 text-[11px] font-semibold text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary transition-colors"
                    >
                      <span>View Property</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>

              {/* Message Stream */}
              <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 bg-theme-bg transition-colors"
              >
                {messages.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-theme-brand-subtle text-theme-brand mb-2">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-semibold text-theme-primary">Start the conversation</p>
                    <p className="text-[11px] text-theme-muted mt-1 max-w-xs mx-auto">
                      Ask questions about rent, food, availability, or house rules directly to{' '}
                      {counterpart?.name || 'the other party'}.
                    </p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const senderIdStr = getSenderId(msg.sender);
                    const myUserIdStr = getSenderId(user?.id || user?._id || currentUserId);

                    // 1. Primary check: does sender ID match my logged-in user ID?
                    let isMine = Boolean(senderIdStr && myUserIdStr && senderIdStr === myUserIdStr);

                    // 2. Fallback check: check conversation participant IDs
                    if (!isMine && activeConversation) {
                      const tenantIdStr = getSenderId(activeConversation.tenant);
                      const ownerIdStr = getSenderId(activeConversation.owner);

                      if (myUserIdStr && tenantIdStr && myUserIdStr === tenantIdStr && senderIdStr === tenantIdStr) {
                        isMine = true;
                      } else if (myUserIdStr && ownerIdStr && myUserIdStr === ownerIdStr && senderIdStr === ownerIdStr) {
                        isMine = true;
                      }
                    }

                    // 3. Fallback check: if user role and sender role are both tenant or both owner
                    if (!isMine && user?.role && msg.sender?.role) {
                      if (user.role === 'tenant' && msg.sender.role === 'tenant') {
                        isMine = true;
                      } else if (user.role === 'owner' && msg.sender.role === 'owner') {
                        isMine = true;
                      }
                    }

                    const prevMsg = index > 0 ? messages[index - 1] : null;

                    // Date separator check
                    const showDateSeparator =
                      !prevMsg || !isSameDay(msg.createdAt, prevMsg.createdAt);
                    const dateLabel = showDateSeparator
                      ? formatMessageDate(msg.createdAt)
                      : null;

                    // Consecutive sender check on same day
                    const prevSenderIdStr = prevMsg ? getSenderId(prevMsg.sender) : '';
                    const isConsecutive =
                      !showDateSeparator &&
                      prevMsg &&
                      prevSenderIdStr === senderIdStr;

                    const counterpartName = msg.sender?.name || counterpart?.name || 'User';
                    const rawCounterpartRole = msg.sender?.role || counterpart?.role || 'user';
                    const counterpartRoleLabel =
                      rawCounterpartRole === 'owner'
                        ? 'PG Owner'
                        : rawCounterpartRole === 'admin'
                        ? 'Admin'
                        : 'Tenant';

                    const myRoleLabel =
                      user?.role === 'owner'
                        ? 'PG Owner'
                        : user?.role === 'admin'
                        ? 'Admin'
                        : 'Tenant';

                    const senderName = isMine ? 'You' : counterpartName;
                    const senderRole = isMine ? myRoleLabel : counterpartRoleLabel;

                    const formattedTime = new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <React.Fragment key={msg._id || index}>
                        {showDateSeparator && (
                          <div className="flex items-center justify-center my-4">
                            <span className="rounded-full bg-theme-surface border border-theme-border px-3 py-1 text-[11px] font-medium text-theme-muted shadow-2xs">
                              {dateLabel}
                            </span>
                          </div>
                        )}

                        {/* Full-width container: ensures messages align to the right for sender, left for receiver */}
                        <div
                          className={`w-full flex ${
                            isMine ? 'justify-end' : 'justify-start'
                          } ${isConsecutive ? 'mt-1.5' : 'mt-3.5'}`}
                        >
                          <div
                            className={`flex flex-col ${
                              isMine ? 'items-end' : 'items-start'
                            } max-w-[80%] sm:max-w-[70%]`}
                          >
                            {/* Sender name clearly displayed on top of the message bubble */}
                            <div
                              className={`flex items-center gap-1.5 mb-1 px-1 ${
                                isMine ? 'flex-row-reverse' : 'flex-row'
                              }`}
                            >
                              <span
                                className={`text-[11px] font-bold tracking-tight ${
                                  isMine ? 'text-theme-brand' : 'text-theme-primary'
                                }`}
                              >
                                {senderName}
                              </span>
                              <span className="text-[9px] uppercase font-semibold px-1.5 py-0.5 rounded bg-theme-surface-hover text-theme-secondary border border-theme-border">
                                {senderRole}
                              </span>
                            </div>

                            {/* Message bubble */}
                            <div
                              className={`rounded-2xl px-4 py-2.5 text-xs shadow-2xs [overflow-wrap:anywhere] break-words whitespace-pre-wrap leading-relaxed ${
                                isMine
                                  ? 'bg-theme-brand text-white rounded-tr-xs'
                                  : 'bg-theme-surface border border-theme-border text-theme-primary rounded-tl-xs'
                              }`}
                            >
                              {msg.text}
                            </div>

                            {/* Timestamp + delivery checkmarks */}
                            <div
                              className={`flex items-center gap-1 mt-1 text-[10px] text-theme-muted px-1 ${
                                isMine ? 'justify-end' : 'justify-start'
                              }`}
                            >
                              <span>{formattedTime}</span>
                              {isMine && (
                                <span
                                  className={`inline-flex items-center ${
                                    msg.isRead ? 'text-theme-brand font-semibold' : 'text-theme-muted'
                                  }`}
                                  title={msg.isRead ? 'Read' : 'Sent'}
                                >
                                  {msg.isRead ? (
                                    <CheckCheck className="h-3.5 w-3.5 inline ml-0.5" />
                                  ) : (
                                    <Check className="h-3.5 w-3.5 inline ml-0.5" />
                                  )}
                                  <span className="sr-only">{msg.isRead ? 'Read' : 'Sent'}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })
                )}

                {/* Animated Typing Indicator */}
                {typingStatus && (
                  <div className="flex items-start gap-2 max-w-[75%] mt-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-theme-brand-subtle text-theme-brand font-bold text-[10px] uppercase shrink-0">
                      {counterpart?.name?.[0] || 'U'}
                    </div>
                    <div className="rounded-2xl rounded-tl-xs bg-theme-surface border border-theme-border px-3.5 py-2.5 shadow-2xs flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-theme-muted animate-bounce [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-theme-muted animate-bounce [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-theme-muted animate-bounce" />
                      <span className="text-[11px] text-theme-muted ml-1.5 font-medium">
                        {counterpart?.name || 'User'} is typing...
                      </span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Floating "New messages" Button when scrolled up */}
              {showScrollBottomBtn && (
                <button
                  type="button"
                  onClick={() => scrollToBottom('smooth')}
                  className="absolute bottom-20 right-6 flex items-center gap-1.5 rounded-full bg-theme-brand px-3 py-1.5 text-xs font-semibold text-white shadow-lg hover:bg-theme-brand-hover transition-all animate-bounce z-20 cursor-pointer"
                >
                  <span>New messages</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
              )}

              {/* Message Input Box */}
              <form onSubmit={handleSendMessage} className="p-3 bg-theme-surface border-t border-theme-border flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  value={inputText}
                  onChange={handleInputChange}
                  placeholder={`Type a message to ${counterpart?.name || 'user'}...`}
                  className="flex-1 rounded-xl border border-theme-border bg-theme-surface-subtle px-4 py-2.5 text-xs text-theme-primary placeholder-theme-muted focus:bg-theme-surface focus:border-theme-brand focus:outline-none focus:ring-1 focus:ring-theme-brand transition-colors"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isSending}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-theme-brand text-white shadow-xs hover:bg-theme-brand-hover disabled:opacity-40 transition-colors shrink-0"
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-theme-surface">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-theme-surface-hover text-theme-muted mb-3">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-theme-primary">Select a Conversation</h3>
              <p className="mt-1 text-xs text-theme-muted max-w-sm">
                Choose a conversation from the left to view messages, or inquire about any PG from its details page.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
