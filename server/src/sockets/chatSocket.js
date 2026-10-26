import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import User from '../models/User.js';
import Conversation from '../models/Conversation.js';
import {
  saveChatMessage,
  markConversationAsRead,
  reactToMessage,
  deleteMessageForEveryone,
} from '../services/chatService.js';

export const isReceiverInConversationRoom = (io, conversationId, receiverId) => {
  const conversationRoom = io.sockets?.adapter?.rooms?.get(`conversation_${conversationId}`);
  const receiverRoom = io.sockets?.adapter?.rooms?.get(`user_${receiverId.toString()}`);

  if (conversationRoom && receiverRoom) {
    for (const socketId of receiverRoom) {
      if (conversationRoom.has(socketId)) {
        return true;
      }
    }
  }
  return false;
};

export const registerChatSocketHandlers = (io) => {
  // Socket.IO authentication middleware
  io.use(async (socket, next) => {
    try {
      let token = null;

      // 1. Check handshake auth token (most reliable cross-origin)
      if (socket.handshake.auth?.token) {
        token = socket.handshake.auth.token;
      }

      // 2. Fallback to HTTP cookie header
      if (!token && socket.handshake.headers?.cookie) {
        const match = socket.handshake.headers.cookie.match(/(?:^|;\s*)token=([^;]+)/);
        if (match) {
          token = decodeURIComponent(match[1]);
        }
      }

      if (!token) {
        return next(new Error('Authentication token required for WebSocket connection'));
      }

      const decoded = jwt.verify(token, env.jwtSecret);
      const user = await User.findById(decoded.sub);

      if (!user) {
        return next(new Error('User account not found'));
      }

      if (user.isBlocked) {
        return next(new Error('User account is suspended'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error(`Authentication error: ${err.message}`));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();

    // Automatically join the user's private notification channel
    socket.join(`user_${userId}`);
    console.log(`Socket connected: ${socket.id} (User: ${socket.user.name} - ${userId})`);

    // Join a specific conversation room
    socket.on('join_conversation', async ({ conversationId }, callback) => {
      try {
        if (!conversationId) return;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          if (callback) callback({ success: false, message: 'Conversation not found' });
          return;
        }

        const isParticipant =
          conversation.tenant.toString() === userId ||
          conversation.owner.toString() === userId;

        if (!isParticipant) {
          if (callback) callback({ success: false, message: 'Unauthorized to join this conversation' });
          return;
        }

        const roomName = `conversation_${conversationId}`;
        socket.join(roomName);

        if (callback) callback({ success: true, roomName });
      } catch (err) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // Leave a specific conversation room
    socket.on('leave_conversation', ({ conversationId }) => {
      if (conversationId) {
        socket.leave(`conversation_${conversationId}`);
      }
    });

    // Send a message (text, media, attachments, forwarded, reply)
    socket.on('send_message', async ({ conversationId, text = '', attachments = [], isForwarded = false, replyTo = null }, callback) => {
      try {
        if (!conversationId || ((!text || !text.trim()) && (!attachments || attachments.length === 0))) {
          if (callback) callback({ success: false, message: 'Valid conversation ID and text or attachment required' });
          return;
        }

        // Persist message in database and update conversation unread counters
        const { message, receiverId, conversation } = await saveChatMessage({
          conversationId,
          senderId: socket.user._id,
          text,
          attachments,
          isForwarded,
          replyTo,
        });

        const roomName = `conversation_${conversationId}`;
        const payload = {
          conversationId,
          message,
          conversation,
        };

        // 1. Emit the new message once to the other participants in the conversation room
        socket.to(roomName).emit('new_message', payload);

        // 2. Broadcast immediately to the recipient's personal user channel (triggers instant laptop alerts)
        io.to(`user_${receiverId.toString()}`).emit('new_message', payload);
        io.to(`user_${receiverId.toString()}`).emit('conversation_updated', payload);

        if (callback) callback({ success: true, message });
      } catch (err) {
        console.error('send_message socket error:', err.message);
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // React to a message
    socket.on('react_message', async ({ messageId, emoji }, callback) => {
      try {
        if (!messageId || !emoji) {
          if (callback) callback({ success: false, message: 'Message ID and emoji required' });
          return;
        }

        const result = await reactToMessage({
          messageId,
          userId: socket.user._id,
          emoji,
        });

        io.to(`conversation_${result.conversationId}`).emit('message_reacted', result);
        io.to(`user_${socket.user._id.toString()}`).emit('message_reacted', result);

        if (callback) callback({ success: true, result });
      } catch (err) {
        console.error('react_message socket error:', err.message);
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // Delete message for everyone
    socket.on('delete_message', async ({ messageId }, callback) => {
      try {
        if (!messageId) {
          if (callback) callback({ success: false, message: 'Message ID required' });
          return;
        }

        const result = await deleteMessageForEveryone({
          messageId,
          userId: socket.user._id,
        });

        io.to(`conversation_${result.conversationId}`).emit('message_deleted', result);

        if (callback) callback({ success: true, result });
      } catch (err) {
        console.error('delete_message socket error:', err.message);
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // Typing indicators
    const handleTypingStart = ({ conversationId }) => {
      if (conversationId) {
        socket.to(`conversation_${conversationId}`).emit('user_typing', {
          conversationId,
          userId,
          userName: socket.user.name,
          senderName: socket.user.name,
        });
      }
    };

    const handleTypingStop = ({ conversationId }) => {
      if (conversationId) {
        socket.to(`conversation_${conversationId}`).emit('user_stop_typing', {
          conversationId,
          userId,
        });
      }
    };

    socket.on('typing_start', handleTypingStart);
    socket.on('typing', handleTypingStart);

    socket.on('typing_stop', handleTypingStop);
    socket.on('stop_typing', handleTypingStop);

    // Mark messages as read in real time
    socket.on('mark_read', async ({ conversationId }) => {
      try {
        if (!conversationId) return;

        const result = await markConversationAsRead(conversationId, socket.user._id);

        // Notify both parties in the room that messages were read
        io.to(`conversation_${conversationId}`).emit('messages_read', {
          conversationId,
          readBy: userId,
        });

        // Update the user's unread counter
        socket.emit('unread_count_updated', {
          conversationId,
          unreadCount: result.unreadCount,
        });
      } catch (err) {
        console.error('mark_read socket error:', err.message);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id} (User: ${socket.user?.name})`);
    });
  });
};
