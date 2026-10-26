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
  CheckSquare,
  ChevronDown,
  Bell,
  BellRing,
  AlertTriangle,
  RefreshCw,
  Info,
  Paperclip,
  Image as ImageIcon,
  Camera,
  Plus,
  FileText,
  File,
  Download,
  Folder,
  X,
  MoreVertical,
  Smile,
  Forward,
  Trash2,
  Ban,
  FileArchive,
  FileSpreadsheet,
  FileCode,
  Eye,
  Share2,
  HardDrive,
  Eraser,
  ShieldAlert,
} from 'lucide-react';

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
  const {
    socket,
    isConnected,
    decrementUnreadBy,
    setActiveChatConversationId,
    notificationPermission,
    requestNotificationPermission,
    testWindowNotification,
  } = useSocket();
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
  const [pendingAttachments, setPendingAttachments] = useState([]); // files selected for sending
  const [isUploading, setIsUploading] = useState(false);
  const [activeActionMenuMessageId, setActiveActionMenuMessageId] = useState(null);
  const [activeReactionPickerMessageId, setActiveReactionPickerMessageId] = useState(null);
  const [forwardModalMessage, setForwardModalMessage] = useState(null); // message to forward
  const [selectedForwardTargets, setSelectedForwardTargets] = useState([]);
  const [isForwarding, setIsForwarding] = useState(false);
  const [showMediaDrawer, setShowMediaDrawer] = useState(false); // Media, Links & Docs drawer
  const [mediaDrawerTab, setMediaDrawerTab] = useState('media'); // 'media' | 'docs' | 'links'
  const [conversationMediaData, setConversationMediaData] = useState({ media: [], docs: [], links: [] });
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null); // preview image url
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState(null);
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [cameraError, setCameraError] = useState('');

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

  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const isNearBottomRef = useRef(true);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const attachMenuRef = useRef(null);
  const headerMenuRef = useRef(null);
  const chatSearchInputRef = useRef(null);
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const cameraFallbackInputRef = useRef(null);

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

  // Helper to scroll
  const scrollToBottom = useCallback((behavior = 'smooth') => {
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
  }, []);

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

  // Event listener for opening/focusing a conversation from laptop notifications or dropdown
  useEffect(() => {
    const handleOpenConversation = (e) => {
      const targetId = e?.detail?.conversationId;
      if (targetId) {
        setActiveConversationId(targetId);
        setShowMobileChat(true);
        fetchConversationMessagesApi(targetId, { _t: Date.now() })
          .then((response) => {
            const list =
              response.data?.messages ||
              response.data?.data?.messages ||
              (Array.isArray(response.data) ? response.data : []);
            setMessages(list);
            const conv = response.data?.conversation || response.data?.data?.conversation;
            if (conv) setFetchedConversation(conv);
            setTimeout(() => scrollToBottom('auto'), 50);
          })
          .catch((err) => console.error('Error reloading messages on notification click:', err));

        markConversationReadApi(targetId)
          .then((response) => {
            const readCount = response.data?.markedCount || response.data?.data?.markedCount || 0;
            if (readCount > 0) {
              decrementUnreadBy(readCount);
              queryClient.invalidateQueries({ queryKey: ['myConversations'] });
            }
          })
          .catch(() => {});
      }
    };

    window.addEventListener('open_chat_conversation', handleOpenConversation);
    return () => window.removeEventListener('open_chat_conversation', handleOpenConversation);
  }, [decrementUnreadBy, queryClient, scrollToBottom]);

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

  // Scroll to bottom on new message
  useEffect(() => {
    if (isNearBottomRef.current) {
      scrollToBottom('smooth');
    } else {
      setShowScrollBottomBtn(true);
    }
  }, [messages, typingStatus, scrollToBottom]);

  // Handle incoming real-time socket events (new message, reaction, deletion, read receipt)
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

  // WhatsApp Camera Capture Methods
  const startCamera = async () => {
    setCameraError('');
    setCapturedPhotoUrl(null);
    setCapturedBlob(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera stream not supported in this browser environment. You can use your device camera directly.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false,
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Camera error:', err);
      setCameraError(err.message || 'Unable to access camera. Please allow camera permissions.');
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const openCameraModal = () => {
    setShowCameraModal(true);
    setTimeout(() => {
      startCamera();
    }, 150);
  };

  const closeCameraModal = () => {
    stopCamera();
    setShowCameraModal(false);
    setCapturedPhotoUrl(null);
    setCapturedBlob(null);
    setCameraError('');
  };

  const takePhotoSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const photoUrl = URL.createObjectURL(blob);
        setCapturedPhotoUrl(photoUrl);
        setCapturedBlob(blob);
        stopCamera();
      }
    }, 'image/jpeg', 0.92);
  };

  const handleAttachCapturedPhoto = () => {
    if (!capturedBlob || !capturedPhotoUrl) return;
    const photoFile = new File([capturedBlob], `camera_${Date.now()}.jpg`, {
      type: 'image/jpeg',
    });
    setPendingAttachments((prev) => [
      ...prev,
      {
        file: photoFile,
        previewUrl: capturedPhotoUrl,
        name: photoFile.name,
        size: photoFile.size,
        type: 'image',
      },
    ].slice(0, 5));
    closeCameraModal();
  };

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

  // Handle file selection from local disk
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newPending = files.map((file) => {
      const isImg = file.type.startsWith('image/');
      return {
        file,
        previewUrl: isImg ? URL.createObjectURL(file) : null,
        name: file.name,
        size: file.size,
        type: isImg ? 'image' : 'document',
      };
    });

    setPendingAttachments((prev) => [...prev, ...newPending].slice(0, 5));
    // Reset file input so same file can be re-selected if removed
    if (e.target) e.target.value = '';
  };

  const removePendingAttachment = (indexToRemove) => {
    setPendingAttachments((prev) => {
      const item = prev[indexToRemove];
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((_, idx) => idx !== indexToRemove);
    });
  };

  // Send message (handles text + attachments)
  const handleSendMessage = async (event) => {
    event.preventDefault();
    const hasText = Boolean(inputText.trim());
    const hasFiles = pendingAttachments.length > 0;
    if ((!hasText && !hasFiles) || isSending || !activeConversationId) return;

    const messageText = inputText.trim();
    setInputText('');
    setIsSending(true);

    if (socket) {
      socket.emit('typing_stop', {
        conversationId: activeConversationId,
        recipientId: counterpart?._id,
      });
    }

    try {
      let uploadedAttachments = [];

      // 1. Upload files first if any
      if (hasFiles) {
        setIsUploading(true);
        const filesToUpload = pendingAttachments.map((p) => p.file);
        const uploadRes = await uploadChatFilesApi(filesToUpload);
        uploadedAttachments = uploadRes.data?.data?.attachments || uploadRes.data?.attachments || [];
        setPendingAttachments([]);
        setIsUploading(false);
      }

      // 2. Dispatch via REST API
      const response = await sendMessageApi(activeConversationId, {
        text: messageText,
        attachments: uploadedAttachments,
        isForwarded: false,
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

  // WhatsApp Feature: Reaction Toggle
  const handleToggleReaction = async (messageId, emoji) => {
    if (!messageId || !emoji) return;
    setActiveReactionPickerMessageId(null);
    setActiveActionMenuMessageId(null);

    // Optimistic UI update
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

  // WhatsApp Feature: Delete Message Modal & Execution
  const openDeleteModal = (msg) => {
    setActiveActionMenuMessageId(null);
    setDeleteModalMessage(msg);
  };

  const handleExecuteDelete = async (messageId, deleteFor = 'everyone') => {
    if (!messageId || isDeletingMessage) return;
    setIsDeletingMessage(true);

    // Optimistic UI update
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
      // Delete for me
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

  // Multiple messages batch delete
  const handleBatchDeleteSelected = async () => {
    if (selectedMessageIds.length === 0 || isDeletingMessage) return;
    if (!window.confirm(`Delete ${selectedMessageIds.length} selected message(s)?`)) return;

    setIsDeletingMessage(true);
    const toDeleteIds = [...selectedMessageIds];

    // Optimistically remove from view
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

  // WhatsApp Feature: Forward Modal & Execution
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
      // If forwarded to the current active chat, refresh messages
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

  const matchingMessageIds = React.useMemo(() => {
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
      {/* Banner if notification permission is blocked in browser settings */}
      {notificationPermission === 'denied' && (
        <div className="mb-3 shrink-0 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-start gap-2.5 text-rose-700 dark:text-rose-300">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />
            <div>
              <p className="font-bold text-rose-600 dark:text-rose-400">
                Desktop Notifications are Blocked in your Browser
              </p>
              <p className="text-[11px] text-theme-secondary mt-0.5 leading-relaxed">
                Click the <strong className="text-theme-primary">🔒 lock icon</strong> in your browser address bar next to <code className="px-1 py-0.5 rounded bg-theme-surface border border-theme-border font-mono text-[10px]">localhost:5173</code>, set <strong className="text-theme-primary">Notifications</strong> to <strong className="text-emerald-600 dark:text-emerald-400">Allow</strong>, then reload.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reload Page</span>
            </button>
            <button
              type="button"
              onClick={testWindowNotification}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-theme-border bg-theme-surface hover:bg-theme-surface-hover px-3 py-1.5 text-xs font-semibold text-theme-secondary hover:text-theme-primary transition-colors cursor-pointer"
            >
              <Bell className="h-3.5 w-3.5 text-theme-brand" />
              <span>Test Laptop Alert</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden rounded-2xl border border-theme-border bg-theme-surface shadow-xs">
        {/* Left Pane: Conversation Threads */}
        <div
          className={`w-full md:w-80 lg:w-96 flex flex-col border-r border-theme-border bg-theme-surface-subtle shrink-0 ${
            showMobileChat ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-theme-border bg-theme-surface shrink-0">
            <div className="flex items-center justify-between">
              <h1 className="text-sm font-bold text-theme-primary">Direct Messages</h1>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={testWindowNotification}
                  title={notificationPermission === 'granted' ? 'Window alerts active (click to test)' : 'Click to enable window alerts'}
                  className="rounded-lg p-1 text-theme-muted hover:text-theme-primary hover:bg-theme-surface-hover transition-colors cursor-pointer"
                >
                  <Bell className={`h-3.5 w-3.5 ${notificationPermission === 'granted' ? 'text-emerald-500' : 'text-amber-500'}`} />
                </button>
                <span className="text-[11px] font-semibold text-theme-muted">
                  {conversations.length} Active
                </span>
              </div>
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
              <div className="flex-1 min-w-0 flex flex-col">
                {/* Chat Header */}
                <div className="p-3 sm:p-4 border-b border-theme-border flex items-center justify-between bg-theme-surface z-10 shadow-2xs shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => setShowMobileChat(false)}
                      className="md:hidden rounded-lg p-1 text-theme-muted hover:text-theme-primary hover:bg-theme-surface-hover"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>

                    {/* Counterpart info: Clickable to open Media, Links & Docs drawer */}
                    <div
                      onClick={() => setShowMediaDrawer((prev) => !prev)}
                      className="flex items-center gap-3 min-w-0 cursor-pointer group select-none"
                      title="Click name to view Media, Links & Docs"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-theme-brand-subtle text-theme-brand font-bold text-xs uppercase shrink-0 group-hover:scale-105 transition-transform">
                        {counterpart?.name?.[0] || 'U'}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h2 className="text-xs font-bold text-theme-primary truncate group-hover:text-theme-brand transition-colors">
                            {counterpart?.name || 'User'}
                          </h2>
                          <span className="rounded-full bg-theme-surface-hover border border-theme-border px-2 py-0.5 text-[10px] font-semibold text-theme-secondary uppercase shrink-0">
                            {counterpart?.role || 'User'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-theme-muted truncate">
                          <Building2 className="h-3 w-3 text-theme-muted shrink-0" />
                          <span className="truncate max-w-xs">{activeConversation.pg?.title}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {activeConversation.pg?._id && (
                      <Link
                        to={`/pg/${activeConversation.pg._id}`}
                        target="_blank"
                        className="hidden lg:inline-flex items-center gap-1 rounded-lg border border-theme-border bg-theme-surface px-2.5 py-1 text-[11px] font-semibold text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary transition-colors"
                      >
                        <span>View PG</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    )}

                    {/* Three Dots Menu Button & Dropdown */}
                    <div className="relative" ref={headerMenuRef}>
                      <button
                        type="button"
                        onClick={() => setShowHeaderMenu((prev) => !prev)}
                        className={`rounded-lg p-2 transition-colors cursor-pointer ${
                          showHeaderMenu
                            ? 'bg-theme-surface-hover text-theme-primary'
                            : 'text-theme-muted hover:text-theme-primary hover:bg-theme-surface-hover'
                        }`}
                        title="More options"
                      >
                        <MoreVertical className="h-4.5 w-4.5" />
                      </button>

                      {showHeaderMenu && (
                        <div className="absolute right-0 top-full mt-1.5 w-52 rounded-xl border border-theme-border bg-theme-surface shadow-xl py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                          {/* 1. Chat Search */}
                          <button
                            type="button"
                            onClick={handleOpenChatSearch}
                            className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-hover transition-colors cursor-pointer"
                          >
                            <Search className="h-4 w-4 text-theme-muted" />
                            <span>Chat search</span>
                          </button>

                          {/* 2. Media, Links & Docs */}
                          <button
                            type="button"
                            onClick={() => {
                              setShowHeaderMenu(false);
                              setShowMediaDrawer(true);
                            }}
                            className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-hover transition-colors cursor-pointer"
                          >
                            <Folder className="h-4 w-4 text-theme-muted" />
                            <span>Media, links and docs</span>
                          </button>

                          {/* 3. Storage */}
                          <button
                            type="button"
                            onClick={handleOpenStorageModal}
                            className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-hover transition-colors cursor-pointer"
                          >
                            <HardDrive className="h-4 w-4 text-theme-muted" />
                            <span>Storage</span>
                          </button>

                          {/* 4. Delete Messages (Selection mode) */}
                          <button
                            type="button"
                            onClick={() => {
                              setShowHeaderMenu(false);
                              setIsSelectionMode(true);
                              setSelectedMessageIds([]);
                            }}
                            className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-hover transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4 text-theme-muted" />
                            <span>Delete messages</span>
                          </button>

                          <div className="my-1 border-t border-theme-border" />

                          {/* 5. Clear Chat */}
                          <button
                            type="button"
                            onClick={handleClearChat}
                            disabled={isClearingChat}
                            className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          >
                            <Eraser className="h-4 w-4" />
                            <span>Clear chat</span>
                          </button>

                          {/* 6. Block / Unblock User */}
                          <button
                            type="button"
                            onClick={handleToggleBlock}
                            disabled={isTogglingBlock}
                            className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          >
                            {activeConversation.isBlocked ? (
                              <>
                                <Check className="h-4 w-4" />
                                <span>Unblock user</span>
                              </>
                            ) : (
                              <>
                                <Ban className="h-4 w-4" />
                                <span>Block</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* In-Chat Search Bar when active */}
                {showChatSearch && (
                  <div className="px-4 py-2 bg-theme-surface-subtle border-b border-theme-border flex items-center gap-2 animate-in slide-in-from-top-2 duration-150 shrink-0">
                    <Search className="h-4 w-4 text-theme-muted shrink-0" />
                    <input
                      ref={chatSearchInputRef}
                      type="text"
                      value={chatSearchQuery}
                      onChange={(e) => setChatSearchQuery(e.target.value)}
                      placeholder="Search messages in this chat..."
                      className="flex-1 bg-transparent text-xs text-theme-primary placeholder-theme-muted focus:outline-none"
                    />
                    {chatSearchQuery && (
                      <span className="text-[11px] font-medium text-theme-muted px-2">
                        {matchingMessageIds.size} {matchingMessageIds.size === 1 ? 'match' : 'matches'}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setShowChatSearch(false);
                        setChatSearchQuery('');
                      }}
                      className="p-1 rounded-md text-theme-muted hover:text-theme-primary hover:bg-theme-surface cursor-pointer"
                      title="Close search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* Message Selection Action Bar (for batch message deletion) */}
                {isSelectionMode && (
                  <div className="px-4 py-2.5 bg-theme-surface-subtle border-b border-theme-border flex items-center justify-between text-xs animate-in slide-in-from-top-2 duration-150 shrink-0">
                    <div className="flex items-center gap-2 font-bold text-theme-primary">
                      <CheckSquare className="h-4 w-4 text-theme-brand" />
                      <span>
                        {selectedMessageIds.length} message{selectedMessageIds.length === 1 ? '' : 's'} selected
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={selectedMessageIds.length === 0 || isDeletingMessage}
                        onClick={handleBatchDeleteSelected}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold transition-colors disabled:opacity-40 cursor-pointer shadow-2xs"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete ({selectedMessageIds.length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsSelectionMode(false);
                          setSelectedMessageIds([]);
                        }}
                        className="px-2.5 py-1.5 rounded-lg border border-theme-border bg-theme-surface text-theme-secondary hover:bg-theme-surface-hover cursor-pointer font-medium"
                      >
                        Cancel
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

                      let isMine = Boolean(senderIdStr && myUserIdStr && senderIdStr === myUserIdStr);

                      if (!isMine && activeConversation) {
                        const tenantIdStr = getSenderId(activeConversation.tenant);
                        const ownerIdStr = getSenderId(activeConversation.owner);

                        if (myUserIdStr && tenantIdStr && myUserIdStr === tenantIdStr && senderIdStr === tenantIdStr) {
                          isMine = true;
                        } else if (myUserIdStr && ownerIdStr && myUserIdStr === ownerIdStr && senderIdStr === ownerIdStr) {
                          isMine = true;
                        }
                      }

                      if (!isMine && user?.role && msg.sender?.role) {
                        if (user.role === 'tenant' && msg.sender.role === 'tenant') {
                          isMine = true;
                        } else if (user.role === 'owner' && msg.sender.role === 'owner') {
                          isMine = true;
                        }
                      }

                      const prevMsg = index > 0 ? messages[index - 1] : null;

                      const showDateSeparator =
                        !prevMsg || !isSameDay(msg.createdAt, prevMsg.createdAt);
                      const dateLabel = showDateSeparator
                        ? formatMessageDate(msg.createdAt)
                        : null;

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

                      const isSearchMatch = chatSearchQuery.trim() && matchingMessageIds.has(msg._id);

                      // Group reactions
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
                              {/* Sender name label on consecutive breaks */}
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
                                {/* WhatsApp Hover Actions (Left for mine, Right for counterpart) */}
                                {!msg.isDeleted && (
                                  <div
                                    className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover/bubble:opacity-100 transition-opacity z-20 ${
                                      isMine ? '-left-20' : '-right-20'
                                    }`}
                                  >
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

                                    {/* Delete Button (opens delete modal) */}
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
                                  {/* WhatsApp Message Bubble Header with Chevron Dropdown */}
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

                                      {/* Message Action Dropdown */}
                                      {activeActionMenuMessageId === msg._id && (
                                        <div
                                          onClick={(e) => e.stopPropagation()}
                                          className="absolute right-0 top-full mt-1 w-36 rounded-xl border border-theme-border bg-theme-surface shadow-xl py-1 z-40 text-xs animate-in zoom-in-95 duration-100"
                                        >
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
                                  {/* WhatsApp Forwarded Badge */}
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

                                  {/* Deleted Message WhatsApp Tombstone */}
                                  {msg.isDeleted ? (
                                    <div className="flex items-center gap-1.5">
                                      <Ban className="h-3.5 w-3.5 text-theme-muted shrink-0" />
                                      <span>This message was deleted</span>
                                    </div>
                                  ) : (
                                    <>
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

                                            // Document card
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

                                      {/* Text Content with URL linkification */}
                                      {msg.text && (
                                        <div className="[overflow-wrap:anywhere] break-words whitespace-pre-wrap">
                                          {renderMessageContent(msg.text, isMine)}
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Floating Emoji Reactions Bar under bubble */}
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
                                  isMine ? 'justify-end' : 'justify-start'
                                }`}
                              >
                                <span>{formattedTime}</span>
                                {isMine && !msg.isDeleted && (
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
                    className="absolute bottom-24 right-6 flex items-center gap-1.5 rounded-full bg-theme-brand px-3 py-1.5 text-xs font-semibold text-white shadow-lg hover:bg-theme-brand-hover transition-all animate-bounce z-20 cursor-pointer"
                  >
                    <span>New messages</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                )}

                {/* Pending Attachment Preview Bar (above input) */}
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
                    {/* Hidden native file pickers */}
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

                    {/* WhatsApp Style Attachment Plus (+) Button & Popup Menu */}
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

                      {/* Attachment Popup Menu with Icons & Names */}
                      {showAttachMenu && (
                        <div className="absolute bottom-12 left-0 z-40 w-52 rounded-2xl border border-theme-border bg-theme-surface p-1.5 shadow-2xl animate-in slide-in-from-bottom-2 zoom-in-95 duration-150 flex flex-col gap-1">
                          {/* 1. Document */}
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

                          {/* 2. Photos & Media */}
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

                          {/* 3. Camera */}
                          <button
                            type="button"
                            onClick={() => {
                              setShowAttachMenu(false);
                              openCameraModal();
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
                      type="text"
                      value={inputText}
                      onChange={handleInputChange}
                      placeholder={
                        pendingAttachments.length > 0
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
              {showMediaDrawer && (
                <div className="w-80 sm:w-96 border-l border-theme-border bg-theme-surface flex flex-col z-20 animate-in slide-in-from-right duration-200 shadow-xl shrink-0">
                  {/* Drawer Header */}
                  <div className="p-4 border-b border-theme-border flex items-center justify-between bg-theme-surface-subtle">
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4 text-theme-brand" />
                      <h3 className="text-xs font-bold text-theme-primary">Media, Links & Docs</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={handleOpenStorageModal}
                        className="p-1 rounded-lg text-theme-muted hover:text-theme-primary hover:bg-theme-surface-hover transition-colors cursor-pointer"
                        title="View Storage Usage"
                      >
                        <HardDrive className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowMediaDrawer(false)}
                        className="p-1 rounded-lg text-theme-muted hover:text-theme-primary hover:bg-theme-surface-hover transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="grid grid-cols-3 border-b border-theme-border bg-theme-surface text-xs font-semibold text-center">
                    <button
                      type="button"
                      onClick={() => setMediaDrawerTab('media')}
                      className={`py-2.5 border-b-2 transition-colors cursor-pointer ${
                        mediaDrawerTab === 'media'
                          ? 'border-theme-brand text-theme-brand'
                          : 'border-transparent text-theme-muted hover:text-theme-primary'
                      }`}
                    >
                      Media ({conversationMediaData.media?.length || 0})
                    </button>
                    <button
                      type="button"
                      onClick={() => setMediaDrawerTab('docs')}
                      className={`py-2.5 border-b-2 transition-colors cursor-pointer ${
                        mediaDrawerTab === 'docs'
                          ? 'border-theme-brand text-theme-brand'
                          : 'border-transparent text-theme-muted hover:text-theme-primary'
                      }`}
                    >
                      Docs ({conversationMediaData.docs?.length || 0})
                    </button>
                    <button
                      type="button"
                      onClick={() => setMediaDrawerTab('links')}
                      className={`py-2.5 border-b-2 transition-colors cursor-pointer ${
                        mediaDrawerTab === 'links'
                          ? 'border-theme-brand text-theme-brand'
                          : 'border-transparent text-theme-muted hover:text-theme-primary'
                      }`}
                    >
                      Links ({conversationMediaData.links?.length || 0})
                    </button>
                  </div>

                  {/* Drawer Tab Content */}
                  <div className="flex-1 min-h-0 overflow-y-auto p-3">
                    {isLoadingMedia ? (
                      <div className="flex items-center justify-center py-16">
                        <Loader2 className="h-5 w-5 animate-spin text-theme-brand" />
                      </div>
                    ) : mediaDrawerTab === 'media' ? (
                      conversationMediaData.media?.length === 0 ? (
                        <div className="text-center py-12 text-theme-muted text-xs">
                          <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No photos or media shared yet</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          {conversationMediaData.media.map((item, mIdx) => (
                            <div
                              key={mIdx}
                              onClick={() => setLightboxImage(item.url)}
                              className="relative aspect-square rounded-lg overflow-hidden bg-theme-surface-subtle cursor-pointer group"
                            >
                              <img
                                src={item.url}
                                alt={item.originalName || 'Photo'}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                <Eye className="h-4 w-4" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    ) : mediaDrawerTab === 'docs' ? (
                      conversationMediaData.docs?.length === 0 ? (
                        <div className="text-center py-12 text-theme-muted text-xs">
                          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No documents or PDFs shared yet</p>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {conversationMediaData.docs.map((doc, dIdx) => (
                            <a
                              key={dIdx}
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={doc.originalName}
                              className="flex items-center gap-3 p-2.5 rounded-xl border border-theme-border bg-theme-surface-subtle hover:bg-theme-surface-hover transition-colors"
                            >
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-theme-brand-subtle text-theme-brand shrink-0">
                                <FileText className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-theme-primary truncate">
                                  {doc.originalName || 'Document'}
                                </p>
                                <p className="text-[10px] text-theme-muted">
                                  {formatFileSize(doc.fileSize)} •{' '}
                                  {new Date(doc.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <Download className="h-4 w-4 text-theme-muted hover:text-theme-primary shrink-0" />
                            </a>
                          ))}
                        </div>
                      )
                    ) : (
                      conversationMediaData.links?.length === 0 ? (
                        <div className="text-center py-12 text-theme-muted text-xs">
                          <ExternalLink className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No web links shared yet</p>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {conversationMediaData.links.map((linkItem, lIdx) => (
                            <a
                              key={lIdx}
                              href={linkItem.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2.5 rounded-xl border border-theme-border bg-theme-surface-subtle hover:bg-theme-surface-hover transition-colors flex items-start gap-2.5"
                            >
                              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-sky-500/10 text-sky-500 shrink-0 mt-0.5">
                                <ExternalLink className="h-3.5 w-3.5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-sky-500 truncate">
                                  {linkItem.url}
                                </p>
                                <p className="text-[11px] text-theme-secondary line-clamp-2 mt-0.5">
                                  {linkItem.text}
                                </p>
                                <p className="text-[9px] text-theme-muted mt-1">
                                  {new Date(linkItem.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </a>
                          ))}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
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
      {forwardModalMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-theme-surface border border-theme-border rounded-2xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-theme-border flex items-center justify-between bg-theme-surface-subtle">
              <div className="flex items-center gap-2">
                <Forward className="h-4 w-4 text-theme-brand" />
                <h3 className="text-sm font-bold text-theme-primary">Forward message to...</h3>
              </div>
              <button
                type="button"
                onClick={() => setForwardModalMessage(null)}
                className="p-1 rounded-lg text-theme-muted hover:text-theme-primary hover:bg-theme-surface-hover"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Message preview snippet */}
            <div className="p-3 bg-theme-bg border-b border-theme-border text-xs text-theme-secondary flex items-center gap-2">
              <span className="font-semibold text-theme-primary shrink-0">Forwarding:</span>
              <span className="truncate italic">
                {forwardModalMessage.text ||
                  (forwardModalMessage.attachments?.[0]?.fileType === 'image'
                    ? '📷 Photo'
                    : '📄 Document')}
              </span>
            </div>

            {/* Conversation list to choose recipients */}
            <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-theme-border p-2">
              {conversations.map((conv) => {
                const cp = getCounterpart(conv);
                const isChecked = selectedForwardTargets.includes(conv._id);
                return (
                  <button
                    key={conv._id}
                    type="button"
                    onClick={() => {
                      setSelectedForwardTargets((prev) =>
                        prev.includes(conv._id)
                          ? prev.filter((id) => id !== conv._id)
                          : [...prev, conv._id]
                      );
                    }}
                    className={`w-full p-3 rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer ${
                      isChecked ? 'bg-theme-brand-subtle/50' : 'hover:bg-theme-surface-hover'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-theme-brand-subtle text-theme-brand font-bold text-xs uppercase shrink-0">
                        {cp?.name?.[0] || 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-theme-primary truncate">
                          {cp?.name || 'User'}
                        </p>
                        <p className="text-[11px] text-theme-muted truncate">
                          {conv.pg?.title || 'Accommodation'}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`h-5 w-5 rounded-md border flex items-center justify-center transition-colors ${
                        isChecked
                          ? 'bg-theme-brand border-theme-brand text-white'
                          : 'border-theme-border bg-theme-surface'
                      }`}
                    >
                      {isChecked && <Check className="h-3.5 w-3.5" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-theme-border bg-theme-surface-subtle flex items-center justify-between">
              <span className="text-xs text-theme-muted">
                {selectedForwardTargets.length} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setForwardModalMessage(null)}
                  className="px-3 py-1.5 rounded-lg border border-theme-border bg-theme-surface text-xs font-semibold text-theme-secondary hover:bg-theme-surface-hover"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={selectedForwardTargets.length === 0 || isForwarding}
                  onClick={handleExecuteForward}
                  className="px-4 py-1.5 rounded-lg bg-theme-brand text-xs font-bold text-white hover:bg-theme-brand-hover disabled:opacity-40 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {isForwarding ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  <span>Forward ({selectedForwardTargets.length})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Camera Capture Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-theme-surface border border-theme-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-3.5 border-b border-theme-border flex items-center justify-between bg-theme-surface-subtle">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-theme-brand" />
                <h3 className="text-xs font-bold text-theme-primary">Capture Photo</h3>
              </div>
              <button
                type="button"
                onClick={closeCameraModal}
                className="p-1 rounded-lg text-theme-muted hover:text-theme-primary hover:bg-theme-surface-hover"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Video Viewfinder / Captured Photo Preview */}
            <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
              {capturedPhotoUrl ? (
                <img
                  src={capturedPhotoUrl}
                  alt="Captured"
                  className="w-full h-full object-contain"
                />
              ) : cameraError ? (
                <div className="p-6 text-center text-rose-400 max-w-xs">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-80" />
                  <p className="text-xs font-semibold">{cameraError}</p>
                  <p className="text-[11px] text-white/70 mt-1 mb-3">
                    You can still capture using your device camera app.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      cameraFallbackInputRef.current?.click();
                      closeCameraModal();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    <span>Open Device Camera</span>
                  </button>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Hidden native camera capture input for device fallback */}
            <input
              type="file"
              ref={cameraFallbackInputRef}
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Modal Controls */}
            <div className="p-3.5 border-t border-theme-border bg-theme-surface-subtle flex items-center justify-between">
              {capturedPhotoUrl ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setCapturedPhotoUrl(null);
                      setCapturedBlob(null);
                      startCamera();
                    }}
                    className="px-3.5 py-1.5 rounded-xl border border-theme-border bg-theme-surface hover:bg-theme-surface-hover text-xs font-semibold text-theme-secondary cursor-pointer"
                  >
                    Retake
                  </button>
                  <button
                    type="button"
                    onClick={handleAttachCapturedPhoto}
                    className="px-4 py-1.5 rounded-xl bg-theme-brand hover:bg-theme-brand-hover text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Attach Photo</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={closeCameraModal}
                    className="px-3.5 py-1.5 rounded-xl border border-theme-border bg-theme-surface hover:bg-theme-surface-hover text-xs font-semibold text-theme-secondary cursor-pointer"
                  >
                    Cancel
                  </button>
                  {!cameraError && (
                    <button
                      type="button"
                      onClick={takePhotoSnapshot}
                      className="flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md cursor-pointer transition-transform active:scale-95"
                    >
                      <Camera className="h-4 w-4" />
                      <span>Snap Photo</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Style Storage Usage Modal */}
      {showStorageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-theme-surface border border-theme-border rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-theme-border flex items-center justify-between bg-theme-surface-subtle">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-theme-brand-subtle text-theme-brand">
                  <HardDrive className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-theme-primary">Storage Usage</h3>
                  <p className="text-[10px] text-theme-muted">
                    {counterpart?.name || 'Chat'} • {activeConversation?.pg?.title || 'Accommodation'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowStorageModal(false)}
                className="p-1 rounded-lg text-theme-muted hover:text-theme-primary hover:bg-theme-surface-hover"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
              {isLoadingStorage ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-theme-muted">
                  <Loader2 className="h-6 w-6 animate-spin text-theme-brand" />
                  <span className="text-xs">Calculating storage...</span>
                </div>
              ) : (
                <>
                  {/* Total Storage Summary Card */}
                  <div className="p-4 rounded-xl border border-theme-border bg-theme-surface-subtle flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold text-theme-muted uppercase tracking-wider">
                        Total Chat Storage
                      </p>
                      <h4 className="text-xl font-bold text-theme-primary mt-0.5">
                        {formatFileSize(storageData?.totalBytes || 0)}
                      </h4>
                      <p className="text-[11px] text-theme-muted mt-0.5">
                        {storageData?.totalFiles || 0} shared item{(storageData?.totalFiles || 0) === 1 ? '' : 's'}
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-theme-brand text-white shadow-md">
                      <Folder className="h-6 w-6" />
                    </div>
                  </div>

                  {/* Storage Visual Bar */}
                  {storageData?.totalBytes > 0 && (
                    <div className="space-y-1.5">
                      <div className="h-3 w-full rounded-full bg-theme-surface-hover overflow-hidden flex">
                        <div
                          style={{
                            width: `${Math.round(
                              ((storageData.imageBytes || 0) / (storageData.totalBytes || 1)) * 100
                            )}%`,
                          }}
                          className="bg-purple-500 h-full transition-all"
                          title={`Photos & Media: ${formatFileSize(storageData.imageBytes || 0)}`}
                        />
                        <div
                          style={{
                            width: `${Math.round(
                              ((storageData.docBytes || 0) / (storageData.totalBytes || 1)) * 100
                            )}%`,
                          }}
                          className="bg-indigo-500 h-full transition-all"
                          title={`Documents: ${formatFileSize(storageData.docBytes || 0)}`}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-theme-muted px-0.5">
                        <span className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-purple-500 inline-block" />
                          <span>Photos ({formatFileSize(storageData?.imageBytes || 0)})</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-indigo-500 inline-block" />
                          <span>Docs ({formatFileSize(storageData?.docBytes || 0)})</span>
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Category Breakdown Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl border border-theme-border bg-theme-surface flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 shrink-0">
                        <ImageIcon className="h-4.5 w-4.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-theme-primary">Photos & Media</p>
                        <p className="text-[10px] text-theme-muted">
                          {storageData?.imageCount || 0} files • {formatFileSize(storageData?.imageBytes || 0)}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border border-theme-border bg-theme-surface flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 shrink-0">
                        <FileText className="h-4.5 w-4.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-theme-primary">Documents</p>
                        <p className="text-[10px] text-theme-muted">
                          {storageData?.docCount || 0} files • {formatFileSize(storageData?.docBytes || 0)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Itemized Files List */}
                  <div className="space-y-2 pt-2">
                    <h5 className="text-xs font-bold text-theme-primary">
                      Shared Files ({storageData?.files?.length || 0})
                    </h5>
                    {!storageData?.files || storageData.files.length === 0 ? (
                      <div className="text-center py-8 text-theme-muted text-xs">
                        <HardDrive className="h-6 w-6 mx-auto mb-1.5 opacity-40" />
                        <p>No files shared in this chat yet</p>
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                        {storageData.files.map((file, fIdx) => (
                          <div
                            key={fIdx}
                            className="p-2.5 rounded-xl border border-theme-border bg-theme-surface hover:bg-theme-surface-hover flex items-center justify-between gap-3 text-xs transition-colors"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${
                                  file.fileType === 'image'
                                    ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
                                    : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
                                }`}
                              >
                                {file.fileType === 'image' ? (
                                  <ImageIcon className="h-4 w-4" />
                                ) : (
                                  <FileText className="h-4 w-4" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-theme-primary truncate max-w-[200px] sm:max-w-[260px]">
                                  {file.originalName}
                                </p>
                                <p className="text-[10px] text-theme-muted">
                                  {formatFileSize(file.fileSize)} •{' '}
                                  {new Date(file.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {file.fileType === 'image' ? (
                                <button
                                  type="button"
                                  onClick={() => setLightboxImage(file.url)}
                                  className="p-1.5 rounded-lg text-theme-muted hover:text-theme-primary hover:bg-theme-surface transition-colors cursor-pointer"
                                  title="Preview"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </button>
                              ) : null}
                              <a
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={file.originalName}
                                className="p-1.5 rounded-lg text-theme-muted hover:text-theme-primary hover:bg-theme-surface transition-colors"
                                title="Download"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-theme-border bg-theme-surface-subtle flex justify-end">
              <button
                type="button"
                onClick={() => setShowStorageModal(false)}
                className="px-4 py-1.5 rounded-xl border border-theme-border bg-theme-surface hover:bg-theme-surface-hover text-xs font-semibold text-theme-secondary transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Style Delete Message Confirmation Modal */}
      {deleteModalMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-theme-surface border border-theme-border rounded-2xl shadow-2xl p-5 flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-theme-primary">Delete message?</h3>
                <p className="text-xs text-theme-muted mt-0.5 line-clamp-2">
                  {deleteModalMessage.text ||
                    (deleteModalMessage.attachments?.[0]?.originalName
                      ? `Attachment: ${deleteModalMessage.attachments[0].originalName}`
                      : 'Selected message')}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              {/* If current user is sender and message isn't already deleted, show Delete for everyone */}
              {getSenderId(deleteModalMessage.sender) === String(currentUserId) &&
                !deleteModalMessage.isDeleted && (
                  <button
                    type="button"
                    disabled={isDeletingMessage}
                    onClick={() => handleExecuteDelete(deleteModalMessage._id, 'everyone')}
                    className="w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs text-center"
                  >
                    Delete for everyone
                  </button>
                )}

              <button
                type="button"
                disabled={isDeletingMessage}
                onClick={() => handleExecuteDelete(deleteModalMessage._id, 'me')}
                className="w-full py-2 px-3 rounded-xl border border-theme-border bg-theme-surface hover:bg-theme-surface-hover text-theme-primary font-semibold text-xs transition-colors cursor-pointer text-center"
              >
                Delete for me
              </button>

              <button
                type="button"
                onClick={() => setDeleteModalMessage(null)}
                className="w-full py-1.5 px-3 rounded-xl text-theme-muted hover:text-theme-primary text-xs font-medium transition-colors cursor-pointer text-center"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Image Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
              <a
                href={lightboxImage}
                target="_blank"
                rel="noopener noreferrer"
                download
                onClick={(e) => e.stopPropagation()}
                className="p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors"
                title="Download full image"
              >
                <Download className="h-4 w-4" />
              </a>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <img
              src={lightboxImage}
              alt="Enlarged preview"
              className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
