import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import {
  fetchMyConversationsApi,
  fetchConversationMessagesApi,
  sendMessageApi,
  markConversationReadApi,
  uploadChatFilesApi,
  reactToMessageApi,
  deleteMessageApi,
  batchDeleteMessagesApi,
  forwardMessageApi,
  fetchConversationMediaApi,
  clearConversationApi,
  toggleBlockConversationApi,
  fetchConversationStorageApi,
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
  Image as ImageIcon,
  Camera,
  Plus,
  FileText,
  Download,
  Folder,
  X,
  MoreVertical,
  Smile,
  Forward,
  Reply,
  Trash2,
  Ban,
  Eye,
  HardDrive,
  ShieldAlert,
} from 'lucide-react';
import { ChatStorageModal } from './components/ChatStorageModal.jsx';
import { ChatForwardModal } from './components/ChatForwardModal.jsx';
import { ChatDeleteModal } from './components/ChatDeleteModal.jsx';
import { ChatMediaDrawer } from './components/ChatMediaDrawer.jsx';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const getSenderId = (entity) => {
  if (!entity) return '';
  if (typeof entity === 'string') return entity;
  if (typeof entity === 'object') {
    return String(entity._id || entity.id || '');
  }
  return String(entity);
};

const formatRole = (role) => (role === 'owner' ? 'PG Owner' : role === 'admin' ? 'Admin' : 'Tenant');

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

const renderMessageContent = (text, isMine) => {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className={`underline font-semibold break-all inline-flex items-center gap-0.5 ${
            isMine ? 'text-amber-200 hover:text-white' : 'text-theme-brand hover:underline'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <span>{part}</span>
          <ExternalLink className="h-3 w-3 inline shrink-0" />
        </a>
      );
    }
    return part;
  });
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

  // WhatsApp Features State
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [activeActionMenuMessageId, setActiveActionMenuMessageId] = useState(null);
  const [activeReactionPickerMessageId, setActiveReactionPickerMessageId] = useState(null);
  const [forwardModalMessage, setForwardModalMessage] = useState(null);
  const [selectedForwardTargets, setSelectedForwardTargets] = useState([]);
  const [isForwarding, setIsForwarding] = useState(false);
  const [showMediaDrawer, setShowMediaDrawer] = useState(false);
  const [mediaDrawerTab, setMediaDrawerTab] = useState('media');
  const [conversationMediaData, setConversationMediaData] = useState({ media: [], docs: [], links: [] });
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  // Three-dots menu, in-chat search, storage modal, and block state
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [showChatSearch, setShowChatSearch] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [showStorageModal, setShowStorageModal] = useState(false);
  const [storageData, setStorageData] = useState(null);
  const [isLoadingStorage, setIsLoadingStorage] = useState(false);
  const [isClearingChat, setIsClearingChat] = useState(false);
  const [isTogglingBlock, setIsTogglingBlock] = useState(false);

  // Message deletion & selection mode state
  const [deleteModalMessage, setDeleteModalMessage] = useState(null);
  const [isDeletingMessage, setIsDeletingMessage] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState([]);

  // Message Reply state
  const [replyingToMessage, setReplyingToMessage] = useState(null);

  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const isNearBottomRef = useRef(true);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const messageInputRef = useRef(null);
  const attachMenuRef = useRef(null);
  const headerMenuRef = useRef(null);
  const chatSearchInputRef = useRef(null);

  // Fetch list of conversations
  const { data: conversationsData, isLoading: isConversationsLoading } = useQuery({
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
    conversations.find((c) => c._id === activeConversationId) ||
    (fetchedConversation?._id === activeConversationId ? fetchedConversation : null);

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

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    const container = scrollContainerRef.current;
    if (container) {
      if (behavior === 'smooth') {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      } else {
        container.scrollTop = container.scrollHeight;
      }
    }
    setShowScrollBottomBtn(false);
  }, []);

  // Load message history when active conversation changes
  useEffect(() => {
    if (!activeConversationId) return;
    setReplyingToMessage(null);

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
          if (conv) setFetchedConversation(conv);
          setTimeout(() => scrollToBottom('auto'), 50);
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
  }, [activeConversationId, decrementUnreadBy, queryClient, scrollToBottom]);

  // Load Media, Links & Docs for active conversation
  const loadConversationMedia = useCallback(async (convId) => {
    if (!convId) return;
    setIsLoadingMedia(true);
    try {
      const res = await fetchConversationMediaApi(convId);
      const data = res?.data?.data || res?.data || { media: [], docs: [], links: [] };
      setConversationMediaData(data);
    } catch (err) {
      console.warn('Failed to load media docs links:', err.message);
    } finally {
      setIsLoadingMedia(false);
    }
  }, []);

  useEffect(() => {
    if (showMediaDrawer && activeConversationId) {
      loadConversationMedia(activeConversationId);
    }
  }, [showMediaDrawer, activeConversationId, loadConversationMedia]);

  // Event listener for opening/focusing conversation from notifications
  useEffect(() => {
    const handleOpenConversation = (e) => {
      const targetId = e?.detail?.conversationId;
      if (targetId) {
        setActiveConversationId(targetId);
        setShowMobileChat(true);
      }
    };

    window.addEventListener('open_chat_conversation', handleOpenConversation);
    return () => window.removeEventListener('open_chat_conversation', handleOpenConversation);
  }, []);

  // Sync latest messages when window/tab is focused
  useEffect(() => {
    const handleWindowFocus = () => {
      if (activeConversationId) {
        fetchConversationMessagesApi(activeConversationId, { _t: Date.now() })
          .then((response) => {
            const list =
              response.data?.messages ||
              response.data?.data?.messages ||
              (Array.isArray(response.data) ? response.data : []);
            if (list.length > 0) {
              setMessages(list);
              setTimeout(() => scrollToBottom('smooth'), 50);
            }
          })
          .catch(() => {});
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, [activeConversationId, scrollToBottom]);

  // Sync active conversation with SocketContext to suppress popup toasts for current chat
  useEffect(() => {
    if (setActiveChatConversationId) {
      setActiveChatConversationId(activeConversationId);
    }
    return () => {
      if (setActiveChatConversationId) {
        setActiveChatConversationId(null);
      }
    };
  }, [activeConversationId, setActiveChatConversationId]);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const threshold = 120;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = distanceToBottom <= threshold;
    isNearBottomRef.current = nearBottom;
    setShowScrollBottomBtn(!nearBottom);
  };

  // Reset scroll position on active conversation change
  useEffect(() => {
    isNearBottomRef.current = true;
    setShowScrollBottomBtn(false);
    scrollToBottom('auto');
  }, [activeConversationId, scrollToBottom]);

  // Join and leave conversation socket rooms
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

  // Scroll to bottom on new message
  useEffect(() => {
    if (isNearBottomRef.current) {
      scrollToBottom('smooth');
    } else {
      setShowScrollBottomBtn(true);
    }
  }, [messages, typingStatus, scrollToBottom]);

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
        setTimeout(() => scrollToBottom('smooth'), 50);
      }
      queryClient.invalidateQueries({ queryKey: ['myConversations'] });
    };

    const handleMessageReacted = (data) => {
      const messageId = String(data?.messageId || data?.message?._id || '');
      const reactions = data?.reactions || data?.message?.reactions || [];
      if (!messageId) return;

      setMessages((prev) =>
        prev.map((msg) => (String(msg._id) === messageId ? { ...msg, reactions } : msg))
      );
    };

    const handleMessageDeleted = (data) => {
      const messageId = String(data?.messageId || data?.message?._id || '');
      if (!messageId) return;

      setMessages((prev) =>
        prev.map((msg) =>
          String(msg._id) === messageId
            ? {
                ...msg,
                isDeleted: true,
                text: 'This message was deleted',
                attachments: [],
                reactions: [],
              }
            : msg
        )
      );
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

    const handleChatCleared = (data) => {
      const convId = String(data?.conversationId || '');
      const currentActiveId = String(activeConversationId || activeConversation?._id || '');
      if (convId && currentActiveId && convId === currentActiveId) {
        setMessages([]);
      }
      queryClient.invalidateQueries({ queryKey: ['myConversations'] });
    };

    const handleBlockedStatus = (data) => {
      const convId = String(data?.conversationId || '');
      const currentActiveId = String(activeConversationId || activeConversation?._id || '');
      if (convId && currentActiveId && convId === currentActiveId) {
        setFetchedConversation((prev) =>
          prev ? { ...prev, isBlocked: data.isBlocked, blockedBy: data.blockedBy } : prev
        );
      }
      queryClient.invalidateQueries({ queryKey: ['myConversations'] });
    };

    const handleMessageDeletedForMe = (data) => {
      const messageId = String(data?.messageId || '');
      if (!messageId) return;
      setMessages((prev) => prev.filter((m) => String(m._id) !== messageId));
      queryClient.invalidateQueries({ queryKey: ['myConversations'] });
    };

    socket.on('new_message', handleReceiveMessage);
    socket.on('receive_message', handleReceiveMessage);
    socket.on('conversation_updated', handleReceiveMessage);
    socket.on('message_reacted', handleMessageReacted);
    socket.on('message_deleted', handleMessageDeleted);
    socket.on('message_deleted_for_me', handleMessageDeletedForMe);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);
    socket.on('messages_read', handleMessagesRead);
    socket.on('chat_cleared', handleChatCleared);
    socket.on('conversation_blocked_status', handleBlockedStatus);

    return () => {
      socket.off('new_message', handleReceiveMessage);
      socket.off('receive_message', handleReceiveMessage);
      socket.off('conversation_updated', handleReceiveMessage);
      socket.off('message_reacted', handleMessageReacted);
      socket.off('message_deleted', handleMessageDeleted);
      socket.off('message_deleted_for_me', handleMessageDeletedForMe);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stop_typing', handleUserStopTyping);
      socket.off('messages_read', handleMessagesRead);
      socket.off('chat_cleared', handleChatCleared);
      socket.off('conversation_blocked_status', handleBlockedStatus);
    };
  }, [socket, activeConversationId, activeConversation?._id, currentUserId, queryClient, scrollToBottom]);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target)) {
        setShowAttachMenu(false);
      }
      if (headerMenuRef.current && !headerMenuRef.current.contains(e.target)) {
        setShowHeaderMenu(false);
      }
      setActiveActionMenuMessageId(null);
      setActiveReactionPickerMessageId(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleInputChange = (event) => {
    setInputText(event.target.value);
    if (!socket || !activeConversationId) return;

    socket.emit('typing_start', {
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
    }, 1500);
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    const newPending = selectedFiles.map((file) => ({
      file,
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      name: file.name,
      size: file.size,
      type: file.type.startsWith('image/') ? 'image' : 'doc',
    }));

    setPendingAttachments((prev) => [...prev, ...newPending].slice(0, 5));
    if (e.target) e.target.value = '';
  };

  const removePendingAttachment = (indexToRemove) => {
    setPendingAttachments((prev) => {
      const item = prev[indexToRemove];
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((_, idx) => idx !== indexToRemove);
    });
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    const hasText = Boolean(inputText.trim());
    const hasFiles = pendingAttachments.length > 0;
    if ((!hasText && !hasFiles) || isSending || !activeConversationId) return;

    const messageText = inputText.trim();
    const replyTarget = replyingToMessage;
    setInputText('');
    setReplyingToMessage(null);
    setIsSending(true);

    if (socket) {
      socket.emit('typing_stop', {
        conversationId: activeConversationId,
        recipientId: counterpart?._id,
      });
    }

    try {
      let uploadedAttachments = [];

      if (hasFiles) {
        setIsUploading(true);
        const filesToUpload = pendingAttachments.map((p) => p.file);
        const uploadRes = await uploadChatFilesApi(filesToUpload);
        uploadedAttachments = uploadRes.data?.data?.attachments || uploadRes.data?.attachments || [];
        setPendingAttachments([]);
        setIsUploading(false);
      }

      const response = await sendMessageApi(activeConversationId, {
        text: messageText,
        attachments: uploadedAttachments,
        isForwarded: false,
        replyTo: replyTarget?._id || null,
      });

      const savedMessage =
        response.data?.message ||
        response.data?.data?.message ||
        (response.message && typeof response.message === 'object' ? response.message : null);

      if (savedMessage && typeof savedMessage === 'object' && savedMessage._id) {
        setMessages((prev) => {
          if (prev.some((msg) => msg._id === savedMessage._id)) return prev;
          return [...prev, savedMessage];
        });
        setTimeout(() => scrollToBottom('smooth'), 50);
      }
      queryClient.invalidateQueries({ queryKey: ['myConversations'] });
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsSending(false);
      setIsUploading(false);
    }
  };

  const handleToggleReaction = async (messageId, emoji) => {
    if (!messageId || !emoji) return;
    setActiveReactionPickerMessageId(null);
    setActiveActionMenuMessageId(null);

    setMessages((prev) =>
      prev.map((msg) => {
        if (msg._id !== messageId) return msg;
        const reactions = Array.isArray(msg.reactions) ? [...msg.reactions] : [];
        const existingIdx = reactions.findIndex(
          (r) => getSenderId(r.user) === String(currentUserId)
        );

        if (existingIdx !== -1) {
          if (reactions[existingIdx].emoji === emoji) {
            reactions.splice(existingIdx, 1);
          } else {
            reactions[existingIdx] = { ...reactions[existingIdx], emoji };
          }
        } else {
          reactions.push({ user: currentUserId, emoji });
        }
        return { ...msg, reactions };
      })
    );

    try {
      if (socket && isConnected) {
        socket.emit('react_message', { messageId, emoji });
      } else {
        await reactToMessageApi(messageId, emoji);
      }
    } catch (err) {
      console.warn('Reaction error:', err.message);
    }
  };

  const openDeleteModal = (msg) => {
    setActiveActionMenuMessageId(null);
    setDeleteModalMessage(msg);
  };

  const handleExecuteDelete = async (messageId, deleteFor = 'everyone') => {
    if (!messageId || isDeletingMessage) return;
    setIsDeletingMessage(true);

    if (deleteFor === 'everyone') {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? {
                ...msg,
                isDeleted: true,
                text: 'This message was deleted',
                attachments: [],
                reactions: [],
              }
            : msg
        )
      );
    } else {
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
    }

    try {
      if (deleteFor === 'everyone' && socket && isConnected) {
        socket.emit('delete_message', { messageId });
      } else {
        await deleteMessageApi(messageId, deleteFor);
      }
      setDeleteModalMessage(null);
      queryClient.invalidateQueries({ queryKey: ['myConversations'] });
    } catch (err) {
      console.error('Delete message error:', err);
      alert('Could not delete message: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsDeletingMessage(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    const msg = messages.find((m) => m._id === messageId);
    if (msg) {
      openDeleteModal(msg);
    } else {
      handleExecuteDelete(messageId, 'everyone');
    }
  };

  const handleBatchDeleteSelected = async () => {
    if (selectedMessageIds.length === 0 || isDeletingMessage) return;
    if (!window.confirm(`Delete ${selectedMessageIds.length} selected message(s)?`)) return;

    setIsDeletingMessage(true);
    const toDeleteIds = [...selectedMessageIds];

    setMessages((prev) => prev.filter((msg) => !toDeleteIds.includes(msg._id)));
    setSelectedMessageIds([]);
    setIsSelectionMode(false);

    try {
      await batchDeleteMessagesApi(toDeleteIds, 'me');
      queryClient.invalidateQueries({ queryKey: ['myConversations'] });
    } catch (err) {
      console.error('Batch delete error:', err);
      alert('Could not delete selected messages: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsDeletingMessage(false);
    }
  };

  const openForwardModal = (msg) => {
    setActiveActionMenuMessageId(null);
    setForwardModalMessage(msg);
    setSelectedForwardTargets([]);
  };

  const handleExecuteForward = async () => {
    if (!forwardModalMessage || selectedForwardTargets.length === 0 || isForwarding) return;
    setIsForwarding(true);

    try {
      await forwardMessageApi(forwardModalMessage._id, selectedForwardTargets);
      setForwardModalMessage(null);
      setSelectedForwardTargets([]);
      queryClient.invalidateQueries({ queryKey: ['myConversations'] });
      if (selectedForwardTargets.includes(activeConversationId)) {
        const res = await fetchConversationMessagesApi(activeConversationId);
        setMessages(res.data?.messages || res.data?.data?.messages || []);
        setTimeout(() => scrollToBottom('smooth'), 50);
      }
    } catch (err) {
      console.error('Forward failed:', err);
      alert('Could not forward message: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsForwarding(false);
    }
  };

  const handleScrollToQuotedMessage = (targetMessageId) => {
    if (!targetMessageId) return;
    const element = document.getElementById(`msg-${targetMessageId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('ring-2', 'ring-theme-brand', 'bg-theme-brand/10', 'transition-all');
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-theme-brand', 'bg-theme-brand/10');
      }, 1600);
    }
  };

  const getQuotedMessageDetails = (replyTo) => {
    if (!replyTo) return null;
    if (typeof replyTo === 'object' && replyTo._id) return replyTo;
    return messages.find((m) => m._id === replyTo) || null;
  };

  const handleOpenChatSearch = () => {
    setShowHeaderMenu(false);
    setShowChatSearch(true);
    setTimeout(() => {
      chatSearchInputRef.current?.focus();
    }, 100);
  };

  const handleOpenStorageModal = async () => {
    setShowHeaderMenu(false);
    setShowStorageModal(true);
    setIsLoadingStorage(true);
    try {
      const res = await fetchConversationStorageApi(activeConversationId);
      const data = res.data?.data || res.data;
      setStorageData(data || null);
    } catch (err) {
      console.error('Failed to load storage data:', err);
    } finally {
      setIsLoadingStorage(false);
    }
  };

  const handleClearChat = async () => {
    if (!activeConversationId || isClearingChat) return;
    setShowHeaderMenu(false);
    const counterpartName = counterpart?.name || 'this chat';
    if (
      !window.confirm(
        `Are you sure you want to clear all messages in this conversation with ${counterpartName}? This cannot be undone.`
      )
    ) {
      return;
    }

    setIsClearingChat(true);
    try {
      await clearConversationApi(activeConversationId);
      setMessages([]);
      queryClient.invalidateQueries({ queryKey: ['myConversations'] });
    } catch (err) {
      console.error('Failed to clear chat:', err);
      alert('Could not clear chat: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsClearingChat(false);
    }
  };

  const handleToggleBlock = async () => {
    if (!activeConversationId || isTogglingBlock) return;
    setShowHeaderMenu(false);
    const isCurrentlyBlocked = Boolean(activeConversation?.isBlocked);
    const counterpartName = counterpart?.name || 'this contact';
    const confirmPrompt = isCurrentlyBlocked
      ? `Unblock ${counterpartName}? You will both be able to exchange messages again.`
      : `Block ${counterpartName}? Neither of you will be able to send messages until unblocked.`;

    if (!window.confirm(confirmPrompt)) {
      return;
    }

    setIsTogglingBlock(true);
    try {
      const res = await toggleBlockConversationApi(activeConversationId);
      const data = res.data?.data || res.data;
      if (data) {
        setFetchedConversation((prev) =>
          prev ? { ...prev, isBlocked: data.isBlocked, blockedBy: data.blockedBy } : prev
        );
      }
      queryClient.invalidateQueries({ queryKey: ['myConversations'] });
    } catch (err) {
      console.error('Failed to toggle block status:', err);
      alert('Action failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsTogglingBlock(false);
    }
  };

  const matchingMessageIds = useMemo(() => {
    if (!chatSearchQuery.trim()) return new Set();
    const q = chatSearchQuery.toLowerCase();
    const ids = new Set();
    messages.forEach((msg) => {
      if (msg.text && msg.text.toLowerCase().includes(q)) {
        ids.add(msg._id);
      }
      if (Array.isArray(msg.attachments)) {
        msg.attachments.forEach((att) => {
          if (att.originalName && att.originalName.toLowerCase().includes(q)) {
            ids.add(msg._id);
          }
        });
      }
    });
    return ids;
  }, [messages, chatSearchQuery]);

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
      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden rounded-2xl border border-theme-border bg-theme-surface shadow-xs">
        {/* Left Pane: Conversation Threads */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-theme-border flex flex-col bg-theme-surface shrink-0 ${
            showMobileChat ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-theme-border bg-theme-surface shrink-0">
            <div className="flex items-center justify-between">
              <h1 className="text-sm font-bold text-theme-primary">Direct Messages</h1>
              <span className="text-[11px] font-semibold text-theme-muted">
                {conversations.length} Active
              </span>
            </div>
            {/* Search Input */}
            <div className="mt-3 relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-theme-muted" />
              <input
                type="text"
                value={filterSearch}
                onChange={(event) => setFilterSearch(event.target.value)}
                placeholder="Filter by name or property..."
                className="w-full rounded-lg border border-theme-border bg-theme-surface pl-8 pr-3 py-1.5 text-xs text-theme-primary placeholder-theme-muted focus:border-theme-brand focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Conversation List */}
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
                    className={`w-full p-4 text-left transition-colors flex items-start gap-3 hover:bg-theme-surface-hover cursor-pointer ${
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

        {/* Right Main Pane: Active Message Stream & Drawer */}
        <div
          className={`relative flex-1 min-w-0 flex flex-col bg-theme-surface ${
            !showMobileChat ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activeConversation ? (
            <div className="flex-1 flex overflow-hidden relative">
              {/* Main Chat Stream Container */}
              <div className="flex-1 flex flex-col min-w-0 relative">
                {/* Chat Header */}
                <div className="p-3.5 border-b border-theme-border bg-theme-surface flex items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => setShowMobileChat(false)}
                      className="md:hidden p-1.5 rounded-lg text-theme-muted hover:text-theme-primary hover:bg-theme-surface-hover"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>

                    {/* Counterpart info: Clickable to open Media, Links & Docs drawer */}
                    <div
                      onClick={() => setShowMediaDrawer((prev) => !prev)}
                      className="flex items-center gap-2.5 min-w-0 cursor-pointer group/header"
                      title="Click to view Media, Links & Docs"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-theme-brand text-white font-bold text-xs uppercase shrink-0 transition-transform group-hover/header:scale-105">
                        {counterpart?.name?.[0] || 'U'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h2 className="text-xs font-bold text-theme-primary truncate group-hover/header:text-theme-brand transition-colors">
                            {counterpart?.name || 'User'}
                          </h2>
                          <span className="text-[9px] uppercase font-semibold px-1.5 py-0.2 rounded bg-theme-brand-subtle text-theme-brand border border-theme-brand/20">
                            {formatRole(counterpart?.role)}
                          </span>
                        </div>
                        <p className="text-[11px] text-theme-muted truncate">
                          {activeConversation.pg?.title || 'Accommodation'} • {activeConversation.pg?.city || ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Header Actions: Three-dots menu */}
                  <div className="flex items-center gap-1 relative" ref={headerMenuRef}>
                    <button
                      type="button"
                      onClick={() => setShowHeaderMenu((prev) => !prev)}
                      className="p-1.5 rounded-lg text-theme-muted hover:text-theme-primary hover:bg-theme-surface-hover transition-colors cursor-pointer"
                      title="Chat Options"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {showHeaderMenu && (
                      <div className="absolute right-0 top-full mt-1 w-52 rounded-2xl border border-theme-border bg-theme-surface py-1.5 shadow-2xl z-30 text-xs animate-in zoom-in-95 duration-100 flex flex-col">
                        <button
                          type="button"
                          onClick={handleOpenChatSearch}
                          className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-hover transition-colors cursor-pointer"
                        >
                          <Search className="h-3.5 w-3.5 text-theme-muted" />
                          <span>Search in chat</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowHeaderMenu(false);
                            setShowMediaDrawer(true);
                          }}
                          className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-hover transition-colors cursor-pointer"
                        >
                          <Folder className="h-3.5 w-3.5 text-theme-muted" />
                          <span>Media, Links & Docs</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleOpenStorageModal}
                          className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-hover transition-colors cursor-pointer"
                        >
                          <HardDrive className="h-3.5 w-3.5 text-theme-muted" />
                          <span>Storage usage</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowHeaderMenu(false);
                            setIsSelectionMode((prev) => !prev);
                            setSelectedMessageIds([]);
                          }}
                          className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-hover transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-theme-muted" />
                          <span>{isSelectionMode ? 'Cancel selection' : 'Delete messages'}</span>
                        </button>
                        <div className="my-1 border-t border-theme-border" />
                        <button
                          type="button"
                          onClick={handleClearChat}
                          disabled={isClearingChat}
                          className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        >
                          <Ban className="h-3.5 w-3.5" />
                          <span>Clear chat history</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleToggleBlock}
                          disabled={isTogglingBlock}
                          className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        >
                          <ShieldAlert className="h-3.5 w-3.5" />
                          <span>{activeConversation.isBlocked ? 'Unblock user' : 'Block user'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* In-Chat Search Bar when active */}
                {showChatSearch && (
                  <div className="px-3.5 py-2 bg-theme-surface-subtle border-b border-theme-border flex items-center gap-2 shrink-0 animate-in slide-in-from-top-1 duration-150">
                    <Search className="h-3.5 w-3.5 text-theme-muted shrink-0" />
                    <input
                      ref={chatSearchInputRef}
                      type="text"
                      value={chatSearchQuery}
                      onChange={(e) => setChatSearchQuery(e.target.value)}
                      placeholder="Search messages, documents, or photos..."
                      className="flex-1 bg-transparent text-xs text-theme-primary placeholder-theme-muted focus:outline-none"
                    />
                    {chatSearchQuery && (
                      <span className="text-[10px] text-theme-muted px-1.5 py-0.5 rounded bg-theme-surface border border-theme-border font-medium shrink-0">
                        {matchingMessageIds.size} match{matchingMessageIds.size === 1 ? '' : 'es'}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setShowChatSearch(false);
                        setChatSearchQuery('');
                      }}
                      className="p-1 rounded-md text-theme-muted hover:text-theme-primary hover:bg-theme-surface-hover"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {/* Message Selection Action Bar (for batch message deletion) */}
                {isSelectionMode && (
                  <div className="px-4 py-2 bg-theme-brand-subtle border-b border-theme-brand/20 flex items-center justify-between text-xs shrink-0 animate-in slide-in-from-top-1 duration-150">
                    <span className="font-bold text-theme-brand">
                      {selectedMessageIds.length} message{selectedMessageIds.length === 1 ? '' : 's'} selected
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsSelectionMode(false);
                          setSelectedMessageIds([]);
                        }}
                        className="px-2.5 py-1 rounded-lg text-theme-secondary hover:text-theme-primary text-xs font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={selectedMessageIds.length === 0 || isDeletingMessage}
                        onClick={handleBatchDeleteSelected}
                        className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs disabled:opacity-40 transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete ({selectedMessageIds.length})</span>
                      </button>
                    </div>
                  </div>
                )}

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
                        Send messages, photos, agreements, or PDF docs directly to{' '}
                        {counterpart?.name || 'the other party'}.
                      </p>
                    </div>
                  ) : (
                    messages.map((msg, index) => {
                      const senderIdStr = getSenderId(msg.sender);
                      const myUserIdStr = getSenderId(user?.id || user?._id || currentUserId);
                      const isMine = Boolean(
                        (senderIdStr && myUserIdStr && senderIdStr === myUserIdStr) ||
                        (user?.role && msg.sender?.role && user.role === msg.sender.role)
                      );

                      const prevMsg = index > 0 ? messages[index - 1] : null;
                      const showDateSeparator = !prevMsg || !isSameDay(msg.createdAt, prevMsg.createdAt);
                      const dateLabel = showDateSeparator ? formatMessageDate(msg.createdAt) : null;
                      const prevSenderIdStr = prevMsg ? getSenderId(prevMsg.sender) : '';
                      const isConsecutive = !showDateSeparator && prevMsg && prevSenderIdStr === senderIdStr;

                      const senderName = isMine ? 'You' : msg.sender?.name || counterpart?.name || 'User';
                      const senderRole = isMine ? formatRole(user?.role) : formatRole(msg.sender?.role || counterpart?.role);

                      const formattedTime = new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      const isSearchMatch = chatSearchQuery.trim() && matchingMessageIds.has(msg._id);

                      const reactionsList = Array.isArray(msg.reactions) ? msg.reactions : [];
                      const reactionCounts = reactionsList.reduce((acc, r) => {
                        acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                        return acc;
                      }, {});
                      const userReactedEmojis = reactionsList
                        .filter((r) => getSenderId(r.user) === String(currentUserId))
                        .map((r) => r.emoji);

                      return (
                        <React.Fragment key={msg._id || index}>
                          {showDateSeparator && (
                            <div className="flex items-center justify-center my-4">
                              <span className="rounded-full bg-theme-surface border border-theme-border px-3 py-1 text-[11px] font-medium text-theme-muted shadow-2xs">
                                {dateLabel}
                              </span>
                            </div>
                          )}

                          <div
                            id={`msg-${msg._id}`}
                            className={`w-full flex items-center ${
                              isMine ? 'justify-end' : 'justify-start'
                            } ${isConsecutive ? 'mt-1.5' : 'mt-3.5'} group`}
                          >
                            {/* Checkbox for batch message selection mode */}
                            {isSelectionMode && !msg.isDeleted && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedMessageIds((prev) =>
                                    prev.includes(msg._id)
                                      ? prev.filter((id) => id !== msg._id)
                                      : [...prev, msg._id]
                                  );
                                }}
                                className={`mr-2.5 h-5 w-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                                  selectedMessageIds.includes(msg._id)
                                    ? 'bg-theme-brand border-theme-brand text-white'
                                    : 'border-theme-border bg-theme-surface hover:border-theme-brand'
                                }`}
                              >
                                {selectedMessageIds.includes(msg._id) && (
                                  <Check className="h-3.5 w-3.5" />
                                )}
                              </button>
                            )}

                            <div
                              className={`flex flex-col ${
                                isMine ? 'items-end' : 'items-start'
                              } max-w-[85%] sm:max-w-[75%] relative`}
                            >
                              {!isConsecutive && (
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
                              )}

                              {/* Message bubble wrapper with hover actions */}
                              <div className="relative group/bubble flex items-center">
                                {!msg.isDeleted && (
                                  <div
                                    className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover/bubble:opacity-100 transition-opacity z-20 ${
                                      isMine ? '-left-32' : '-right-32'
                                    }`}
                                  >
                                    {/* Reply Button */}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setReplyingToMessage(msg);
                                        messageInputRef.current?.focus();
                                      }}
                                      className="h-7 w-7 rounded-full bg-theme-surface border border-theme-border shadow-md flex items-center justify-center text-theme-muted hover:text-theme-primary hover:bg-theme-surface-hover transition-colors cursor-pointer"
                                      title="Reply"
                                    >
                                      <Reply className="h-3.5 w-3.5" />
                                    </button>

                                    {/* Reaction Trigger Button */}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveReactionPickerMessageId(
                                          activeReactionPickerMessageId === msg._id ? null : msg._id
                                        );
                                        setActiveActionMenuMessageId(null);
                                      }}
                                      className="h-7 w-7 rounded-full bg-theme-surface border border-theme-border shadow-md flex items-center justify-center text-theme-muted hover:text-theme-primary hover:bg-theme-surface-hover transition-colors cursor-pointer"
                                      title="React"
                                    >
                                      <Smile className="h-3.5 w-3.5" />
                                    </button>

                                    {/* Forward Button */}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openForwardModal(msg);
                                      }}
                                      className="h-7 w-7 rounded-full bg-theme-surface border border-theme-border shadow-md flex items-center justify-center text-theme-muted hover:text-theme-primary hover:bg-theme-surface-hover transition-colors cursor-pointer"
                                      title="Forward message"
                                    >
                                      <Forward className="h-3.5 w-3.5" />
                                    </button>

                                    {/* Delete Button */}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openDeleteModal(msg);
                                      }}
                                      className="h-7 w-7 rounded-full bg-theme-surface border border-theme-border shadow-md flex items-center justify-center text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                      title="Delete message"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                )}

                                {/* Quick Reaction Picker Popover */}
                                {activeReactionPickerMessageId === msg._id && !msg.isDeleted && (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    className={`absolute -top-10 z-30 flex items-center gap-1 p-1 bg-theme-surface border border-theme-border rounded-full shadow-xl animate-in zoom-in-95 duration-100 ${
                                      isMine ? 'right-0' : 'left-0'
                                    }`}
                                  >
                                    {QUICK_EMOJIS.map((emoji) => (
                                      <button
                                        key={emoji}
                                        type="button"
                                        onClick={() => handleToggleReaction(msg._id, emoji)}
                                        className="h-7 w-7 rounded-full hover:bg-theme-surface-hover flex items-center justify-center text-base transition-transform hover:scale-125 cursor-pointer"
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>
                                )}

                                {/* Main Bubble Container */}
                                <div
                                  className={`rounded-2xl text-xs shadow-2xs leading-relaxed relative ${
                                    isSearchMatch
                                      ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-theme-bg'
                                      : ''
                                  } ${
                                    msg.isDeleted
                                      ? 'bg-theme-surface/70 border border-theme-border text-theme-muted italic px-3.5 py-2.5 rounded-tr-xs'
                                      : isMine
                                      ? 'bg-theme-brand text-white rounded-tr-xs px-3.5 py-2.5'
                                      : 'bg-theme-surface border border-theme-border text-theme-primary rounded-tl-xs px-3.5 py-2.5'
                                  }`}
                                >
                                  {/* Chevron Dropdown */}
                                  {!msg.isDeleted && (
                                    <div className="absolute top-1.5 right-1.5 opacity-0 group-hover/bubble:opacity-100 transition-opacity z-10">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveActionMenuMessageId(
                                            activeActionMenuMessageId === msg._id ? null : msg._id
                                          );
                                          setActiveReactionPickerMessageId(null);
                                        }}
                                        className={`p-0.5 rounded-full transition-colors cursor-pointer ${
                                          isMine
                                            ? 'text-white/70 hover:text-white hover:bg-black/20'
                                            : 'text-theme-muted hover:text-theme-primary hover:bg-theme-surface-hover'
                                        }`}
                                        title="Message options"
                                      >
                                        <ChevronDown className="h-3.5 w-3.5" />
                                      </button>

                                      {activeActionMenuMessageId === msg._id && (
                                        <div
                                          onClick={(e) => e.stopPropagation()}
                                          className="absolute right-0 top-full mt-1 w-36 rounded-xl border border-theme-border bg-theme-surface shadow-xl py-1 z-40 text-xs animate-in zoom-in-95 duration-100"
                                        >
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setActiveActionMenuMessageId(null);
                                              setReplyingToMessage(msg);
                                              messageInputRef.current?.focus();
                                            }}
                                            className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-hover transition-colors cursor-pointer"
                                          >
                                            <Reply className="h-3.5 w-3.5 text-theme-muted" />
                                            <span>Reply</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setActiveActionMenuMessageId(null);
                                              setActiveReactionPickerMessageId(msg._id);
                                            }}
                                            className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-hover transition-colors cursor-pointer"
                                          >
                                            <Smile className="h-3.5 w-3.5 text-theme-muted" />
                                            <span>React</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              openForwardModal(msg);
                                            }}
                                            className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-hover transition-colors cursor-pointer"
                                          >
                                            <Forward className="h-3.5 w-3.5 text-theme-muted" />
                                            <span>Forward</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              openDeleteModal(msg);
                                            }}
                                            className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            <span>Delete message</span>
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Forwarded Badge */}
                                  {msg.isForwarded && !msg.isDeleted && (
                                    <div
                                      className={`flex items-center gap-1 text-[10px] italic font-medium mb-1.5 pb-1 border-b ${
                                        isMine
                                          ? 'text-white/80 border-white/20'
                                          : 'text-theme-muted border-theme-border'
                                      }`}
                                    >
                                      <Forward className="h-3 w-3 inline" />
                                      <span>Forwarded</span>
                                    </div>
                                  )}

                                  {/* Deleted Message Tombstone */}
                                  {msg.isDeleted ? (
                                    <div className="flex items-center gap-1.5">
                                      <Ban className="h-3.5 w-3.5 text-theme-muted shrink-0" />
                                      <span>This message was deleted</span>
                                    </div>
                                  ) : (
                                    <>
                                      {/* Quoted Reply inside bubble */}
                                      {(() => {
                                        const quoted = getQuotedMessageDetails(msg.replyTo);
                                        if (!quoted) return null;
                                        const quotedSenderId = getSenderId(quoted.sender?._id || quoted.sender);
                                        const isQuotedMine = quotedSenderId === String(currentUserId);
                                        const quotedSenderName = isQuotedMine
                                          ? 'You'
                                          : quoted.sender?.name || counterpart?.name || 'User';
                                        const hasQuotedImage =
                                          Array.isArray(quoted.attachments) &&
                                          quoted.attachments.some((a) => a.fileType === 'image');
                                        const quotedImageUrl = hasQuotedImage
                                          ? quoted.attachments.find((a) => a.fileType === 'image')?.url
                                          : null;

                                        return (
                                          <div
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleScrollToQuotedMessage(quoted._id);
                                            }}
                                            className={`mb-2 p-2 rounded-lg cursor-pointer transition-all border-l-4 text-xs select-none flex items-center justify-between gap-2.5 ${
                                              isMine
                                                ? 'bg-black/20 border-white hover:bg-black/30 text-white'
                                                : 'bg-theme-surface-subtle border-l-theme-brand border-t border-r border-b border-theme-border/60 hover:bg-theme-surface-hover text-theme-primary'
                                            }`}
                                            title="Click to jump to quoted message"
                                          >
                                            <div className="min-w-0 flex-1">
                                              <p
                                                className={`text-[11px] font-bold truncate mb-0.5 ${
                                                  isMine ? 'text-white' : 'text-theme-brand'
                                                }`}
                                              >
                                                {quotedSenderName}
                                              </p>
                                              <p
                                                className={`text-[11px] truncate ${
                                                  isMine ? 'text-white/85' : 'text-theme-secondary'
                                                } ${quoted.isDeleted ? 'italic opacity-80' : ''}`}
                                              >
                                                {quoted.isDeleted
                                                  ? 'This message was deleted'
                                                  : quoted.text ||
                                                    (quoted.attachments?.length > 0
                                                      ? quoted.attachments[0].fileType === 'image'
                                                        ? '📷 Photo'
                                                        : `📄 ${quoted.attachments[0].originalName || 'Document'}`
                                                      : 'Message')}
                                              </p>
                                            </div>
                                            {quotedImageUrl && (
                                              <img
                                                src={quotedImageUrl}
                                                alt="quoted thumbnail"
                                                className="h-9 w-9 object-cover rounded-md shrink-0 border border-black/10 dark:border-white/10"
                                              />
                                            )}
                                          </div>
                                        );
                                      })()}

                                      {/* Attached Media & Docs */}
                                      {Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                                        <div className="flex flex-col gap-2 mb-2">
                                          {msg.attachments.map((att, attIdx) => {
                                            if (att.fileType === 'image') {
                                              return (
                                                <div
                                                  key={attIdx}
                                                  className="relative rounded-xl overflow-hidden cursor-pointer group/img max-w-sm"
                                                  onClick={() => setLightboxImage(att.url)}
                                                >
                                                  <img
                                                    src={att.url}
                                                    alt={att.originalName || 'Chat attachment'}
                                                    className="w-full max-h-72 object-cover rounded-xl transition-transform duration-200 group-hover/img:scale-102"
                                                    loading="lazy"
                                                  />
                                                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                                                    <span className="p-1.5 rounded-full bg-black/60">
                                                      <Eye className="h-4 w-4" />
                                                    </span>
                                                  </div>
                                                </div>
                                              );
                                            }

                                            return (
                                              <a
                                                key={attIdx}
                                                href={att.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                download={att.originalName}
                                                className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                                                  isMine
                                                    ? 'bg-black/15 border-white/20 hover:bg-black/25 text-white'
                                                    : 'bg-theme-surface-subtle border-theme-border hover:bg-theme-surface-hover text-theme-primary'
                                                }`}
                                              >
                                                <div
                                                  className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${
                                                    att.originalName?.endsWith('.pdf')
                                                      ? 'bg-rose-500/20 text-rose-500'
                                                      : att.originalName?.match(/\.(doc|docx)$/i)
                                                      ? 'bg-sky-500/20 text-sky-500'
                                                      : att.originalName?.match(/\.(xls|xlsx|csv)$/i)
                                                      ? 'bg-emerald-500/20 text-emerald-500'
                                                      : 'bg-amber-500/20 text-amber-500'
                                                  }`}
                                                >
                                                  <FileText className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                  <p className="font-semibold text-xs truncate">
                                                    {att.originalName || 'Document'}
                                                  </p>
                                                  <p
                                                    className={`text-[10px] ${
                                                      isMine ? 'text-white/75' : 'text-theme-muted'
                                                    }`}
                                                  >
                                                    {formatFileSize(att.fileSize)}
                                                  </p>
                                                </div>
                                                <Download className="h-4 w-4 shrink-0 opacity-80" />
                                              </a>
                                            );
                                          })}
                                        </div>
                                      )}

                                      {/* Text Content */}
                                      {msg.text && (
                                        <div className="[overflow-wrap:anywhere] break-words whitespace-pre-wrap">
                                          {renderMessageContent(msg.text, isMine)}
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Floating Emoji Reactions Bar */}
                              {!msg.isDeleted && Object.keys(reactionCounts).length > 0 && (
                                <div
                                  className={`flex flex-wrap items-center gap-1 mt-1 z-10 ${
                                    isMine ? 'justify-end' : 'justify-start'
                                  }`}
                                >
                                  {Object.entries(reactionCounts).map(([emoji, count]) => {
                                    const hasUserReacted = userReactedEmojis.includes(emoji);
                                    return (
                                      <button
                                        key={emoji}
                                        type="button"
                                        onClick={() => handleToggleReaction(msg._id, emoji)}
                                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold border shadow-2xs transition-transform hover:scale-110 cursor-pointer ${
                                          hasUserReacted
                                            ? 'bg-theme-brand-subtle border-theme-brand text-theme-brand'
                                            : 'bg-theme-surface border-theme-border text-theme-secondary hover:bg-theme-surface-hover'
                                        }`}
                                        title={`${count} reaction${count > 1 ? 's' : ''}`}
                                      >
                                        <span>{emoji}</span>
                                        {count > 1 && <span>{count}</span>}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Timestamp + delivery checkmarks */}
                              <div
                                className={`flex items-center gap-1 mt-1 text-[10px] text-theme-muted px-1 ${
                                  isMine ? 'flex-row-reverse' : 'flex-row'
                                }`}
                              >
                                <span>{formattedTime}</span>
                                {isMine && !msg.isDeleted && (
                                  <span title={msg.isRead ? 'Read' : 'Delivered'}>
                                    {msg.isRead ? (
                                      <CheckCheck className="h-3.5 w-3.5 text-sky-500" />
                                    ) : (
                                      <Check className="h-3.5 w-3.5 text-theme-muted" />
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Animated Typing Indicator */}
                {typingStatus && (
                  <div className="px-4 py-1.5 bg-theme-surface border-t border-theme-border flex items-center gap-2 text-xs text-theme-brand italic shrink-0 animate-in fade-in duration-200">
                    <div className="flex gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-theme-brand animate-bounce" />
                      <span className="h-1.5 w-1.5 rounded-full bg-theme-brand animate-bounce [animation-delay:0.2s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-theme-brand animate-bounce [animation-delay:0.4s]" />
                    </div>
                    <span>{typingStatus}</span>
                  </div>
                )}

                {/* Floating New Messages Button */}
                {showScrollBottomBtn && (
                  <button
                    type="button"
                    onClick={() => scrollToBottom('smooth')}
                    className="absolute bottom-24 right-6 flex items-center gap-1.5 rounded-full bg-theme-brand px-3 py-1.5 text-xs font-semibold text-white shadow-lg hover:bg-theme-brand-hover transition-all animate-bounce z-20 cursor-pointer"
                  >
                    <span>New messages</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                )}

                {/* Pending Attachment Preview Bar */}
                {pendingAttachments.length > 0 && (
                  <div className="p-2.5 bg-theme-surface-subtle border-t border-theme-border flex items-center gap-2 overflow-x-auto shrink-0">
                    <span className="text-[11px] font-semibold text-theme-muted shrink-0 mr-1">
                      Attachments ({pendingAttachments.length}):
                    </span>
                    {pendingAttachments.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-xl bg-theme-surface border border-theme-border shadow-2xs text-xs shrink-0 max-w-xs"
                      >
                        {item.type === 'image' && item.previewUrl ? (
                          <img
                            src={item.previewUrl}
                            alt="preview"
                            className="h-8 w-8 object-cover rounded-md"
                          />
                        ) : (
                          <FileText className="h-4 w-4 text-theme-brand shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold text-theme-primary truncate max-w-[120px]">
                            {item.name}
                          </p>
                          <p className="text-[9px] text-theme-muted">{formatFileSize(item.size)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removePendingAttachment(idx)}
                          className="p-1 rounded-md text-theme-muted hover:text-rose-500 hover:bg-theme-surface-hover transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Banner */}
                {replyingToMessage && !activeConversation?.isBlocked && (
                  <div className="px-3.5 py-2 bg-theme-surface-subtle border-t border-theme-border flex items-center justify-between gap-3 shrink-0 animate-in slide-in-from-bottom-2 duration-150">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 border-l-4 border-theme-brand pl-2.5 py-0.5">
                      <Reply className="h-4 w-4 text-theme-brand shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold text-theme-brand truncate">
                          Replying to{' '}
                          {getSenderId(replyingToMessage.sender?._id || replyingToMessage.sender) ===
                          String(currentUserId)
                            ? 'yourself'
                            : replyingToMessage.sender?.name || counterpart?.name || 'User'}
                        </p>
                        <p className="text-xs text-theme-secondary truncate">
                          {replyingToMessage.isDeleted
                            ? 'This message was deleted'
                            : replyingToMessage.text ||
                              (Array.isArray(replyingToMessage.attachments) &&
                              replyingToMessage.attachments.length > 0
                                ? replyingToMessage.attachments[0].fileType === 'image'
                                  ? '📷 Photo'
                                  : `📄 ${replyingToMessage.attachments[0].originalName || 'Document'}`
                                : 'Message')}
                        </p>
                      </div>
                      {Array.isArray(replyingToMessage.attachments) &&
                        replyingToMessage.attachments.some((a) => a.fileType === 'image') && (
                          <img
                            src={replyingToMessage.attachments.find((a) => a.fileType === 'image')?.url}
                            alt="thumbnail"
                            className="h-9 w-9 object-cover rounded-md shrink-0 border border-theme-border"
                          />
                        )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setReplyingToMessage(null)}
                      className="p-1 rounded-full text-theme-muted hover:text-theme-primary hover:bg-theme-surface-hover transition-colors shrink-0 cursor-pointer"
                      title="Cancel reply (Esc)"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* Blocked Conversation Notice Banner or Active Input Box */}
                {activeConversation.isBlocked ? (
                  <div className="p-3.5 bg-theme-surface-subtle border-t border-theme-border flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left shrink-0">
                    <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
                      <ShieldAlert className="h-5 w-5 shrink-0" />
                      <span className="text-xs font-semibold">
                        {String(activeConversation.blockedBy?._id || activeConversation.blockedBy || '') ===
                        String(user?.id || user?._id || currentUserId || '')
                          ? 'You blocked this contact. Unblock to send and receive messages.'
                          : 'This conversation is currently blocked.'}
                      </span>
                    </div>
                    {String(activeConversation.blockedBy?._id || activeConversation.blockedBy || '') ===
                      String(user?.id || user?._id || currentUserId || '') && (
                      <button
                        type="button"
                        onClick={handleToggleBlock}
                        disabled={isTogglingBlock}
                        className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs shrink-0"
                      >
                        {isTogglingBlock ? 'Unblocking...' : 'Unblock Contact'}
                      </button>
                    )}
                  </div>
                ) : (
                  <form
                    onSubmit={handleSendMessage}
                    className="p-3 bg-theme-surface border-t border-theme-border flex items-center gap-2 shrink-0"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      multiple
                      accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.zip,text/csv"
                      className="hidden"
                    />
                    <input
                      type="file"
                      ref={imageInputRef}
                      onChange={handleFileChange}
                      multiple
                      accept="image/*"
                      className="hidden"
                    />
                    <input
                      type="file"
                      ref={cameraInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                    />

                    {/* Attachment Plus (+) Button & Menu */}
                    <div className="relative shrink-0" ref={attachMenuRef}>
                      <button
                        type="button"
                        onClick={() => setShowAttachMenu((prev) => !prev)}
                        title="Add attachment"
                        disabled={isSending || isUploading}
                        className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all cursor-pointer shadow-2xs ${
                          showAttachMenu
                            ? 'bg-theme-brand text-white border-theme-brand rotate-45'
                            : 'border-theme-border bg-theme-surface-subtle text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-hover'
                        }`}
                      >
                        <Plus className="h-5 w-5 transition-transform duration-200" />
                      </button>

                      {showAttachMenu && (
                        <div className="absolute bottom-12 left-0 z-40 w-52 rounded-2xl border border-theme-border bg-theme-surface p-1.5 shadow-2xl animate-in slide-in-from-bottom-2 zoom-in-95 duration-150 flex flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setShowAttachMenu(false);
                              fileInputRef.current?.click();
                            }}
                            className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-theme-surface-hover text-left transition-colors cursor-pointer group"
                          >
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                              <FileText className="h-4.5 w-4.5" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-theme-primary">Document</p>
                              <p className="text-[10px] text-theme-muted">PDF, Word, Excel, Docs</p>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setShowAttachMenu(false);
                              imageInputRef.current?.click();
                            }}
                            className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-theme-surface-hover text-left transition-colors cursor-pointer group"
                          >
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">
                              <ImageIcon className="h-4.5 w-4.5" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-theme-primary">Photos & Media</p>
                              <p className="text-[10px] text-theme-muted">Images from device</p>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setShowAttachMenu(false);
                              cameraInputRef.current?.click();
                            }}
                            className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-theme-surface-hover text-left transition-colors cursor-pointer group"
                          >
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 group-hover:scale-105 transition-transform">
                              <Camera className="h-4.5 w-4.5" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-theme-primary">Camera</p>
                              <p className="text-[10px] text-theme-muted">Capture a photo now</p>
                            </div>
                          </button>
                        </div>
                      )}
                    </div>

                    <input
                      ref={messageInputRef}
                      type="text"
                      value={inputText}
                      onChange={handleInputChange}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape' && replyingToMessage) {
                          setReplyingToMessage(null);
                        }
                      }}
                      placeholder={
                        replyingToMessage
                          ? `Replying to ${
                              getSenderId(replyingToMessage.sender?._id || replyingToMessage.sender) ===
                              String(currentUserId)
                                ? 'yourself'
                                : replyingToMessage.sender?.name || counterpart?.name || 'user'
                            }...`
                          : pendingAttachments.length > 0
                          ? 'Add a caption...'
                          : `Type a message to ${counterpart?.name || 'user'}...`
                      }
                      className="flex-1 rounded-xl border border-theme-border bg-theme-surface-subtle px-4 py-2.5 text-xs text-theme-primary placeholder-theme-muted focus:bg-theme-surface focus:border-theme-brand focus:outline-none focus:ring-1 focus:ring-theme-brand transition-colors"
                    />

                    <button
                      type="submit"
                      disabled={(!inputText.trim() && pendingAttachments.length === 0) || isSending || isUploading}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-theme-brand text-white shadow-xs hover:bg-theme-brand-hover disabled:opacity-40 transition-colors shrink-0 cursor-pointer"
                      title="Send message"
                    >
                      {isSending || isUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </button>
                  </form>
                )}
              </div>

              {/* WhatsApp-Style Right Drawer: Media, Links and Docs */}
              <ChatMediaDrawer
                isOpen={showMediaDrawer}
                onClose={() => setShowMediaDrawer(false)}
                mediaData={conversationMediaData}
                isLoading={isLoadingMedia}
                activeTab={mediaDrawerTab}
                onTabChange={setMediaDrawerTab}
                onOpenStorage={handleOpenStorageModal}
                onPreviewImage={setLightboxImage}
                formatFileSize={formatFileSize}
              />
            </div>
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

      {/* WhatsApp Forward Modal */}
      <ChatForwardModal
        isOpen={Boolean(forwardModalMessage)}
        onClose={() => setForwardModalMessage(null)}
        message={forwardModalMessage}
        conversations={conversations}
        selectedTargets={selectedForwardTargets}
        onToggleTarget={(convId) => {
          setSelectedForwardTargets((prev) =>
            prev.includes(convId) ? prev.filter((id) => id !== convId) : [...prev, convId]
          );
        }}
        onForward={handleExecuteForward}
        isForwarding={isForwarding}
        getCounterpart={getCounterpart}
      />

      {/* WhatsApp Storage Modal */}
      <ChatStorageModal
        isOpen={showStorageModal}
        onClose={() => setShowStorageModal(false)}
        storageData={storageData}
        isLoading={isLoadingStorage}
        counterpartName={counterpart?.name}
        propertyTitle={activeConversation?.pg?.title}
        onPreviewImage={setLightboxImage}
        formatFileSize={formatFileSize}
      />

      {/* WhatsApp Delete Message Confirmation Modal */}
      <ChatDeleteModal
        isOpen={Boolean(deleteModalMessage)}
        onClose={() => setDeleteModalMessage(null)}
        message={deleteModalMessage}
        currentUserId={currentUserId}
        isDeleting={isDeletingMessage}
        onDelete={handleExecuteDelete}
        getSenderId={getSenderId}
      />

      {/* Full-Screen Image Lightbox Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xs p-4 animate-in fade-in duration-150 cursor-pointer"
        >
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white/80 hover:text-white hover:bg-black/80 transition-colors cursor-pointer"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={lightboxImage}
            alt="Preview"
            onClick={(e) => e.stopPropagation()}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
