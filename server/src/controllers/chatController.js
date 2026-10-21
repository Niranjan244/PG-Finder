import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import {
  getOrCreateConversation,
  getUserConversations,
  getConversationMessages,
  markConversationAsRead,
  getUserTotalUnreadCount,
  saveChatMessage,
} from '../services/chatService.js';
import { getIO } from '../sockets/index.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const getChatToken = async (req, res, next) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const token = jwt.sign(
      { sub: req.user._id, role: req.user.role },
      env.jwtSecret,
      { expiresIn: '1d' }
    );
    return sendSuccess(res, 200, 'Chat token generated', { token });
  } catch (error) {
    next(error);
  }
};

export const startConversation = async (req, res, next) => {
  try {
    let { pgId } = req.body;
    if (typeof pgId === 'object' && pgId !== null) {
      pgId = pgId.pgId || pgId._id;
    }
    if (!pgId) {
      return res.status(400).json({ success: false, message: 'Property listing ID is required' });
    }
    const conversation = await getOrCreateConversation({
      tenantId: req.user._id,
      pgId,
    });
    return sendSuccess(res, 200, 'Conversation initialized', { conversation });
  } catch (error) {
    next(error);
  }
};

export const sendMessageViaRest = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Message text is required' });
    }

    const { message, receiverId, conversation } = await saveChatMessage({
      conversationId,
      senderId: req.user._id,
      text,
    });

    try {
      const io = getIO();
      if (io) {
        const payload = {
          conversationId: conversationId.toString(),
          message,
          conversation,
        };
        // 1. Broadcast to the conversation room
        io.to(`conversation_${conversationId}`).emit('new_message', payload);
        // 2. Broadcast to recipient's personal user channel (for instant delivery anywhere)
        io.to(`user_${receiverId.toString()}`).emit('new_message', payload);
        io.to(`user_${receiverId.toString()}`).emit('conversation_updated', payload);
        // 3. Broadcast to sender's personal channel (keeps multiple tabs in sync)
        io.to(`user_${req.user._id.toString()}`).emit('conversation_updated', payload);
      }
    } catch {
      // Socket emission failure shouldn't fail REST message delivery
    }

    return sendSuccess(res, 201, 'Message sent successfully', { message, conversation });
  } catch (error) {
    next(error);
  }
};

export const getMyConversations = async (req, res, next) => {
  try {
    const conversations = await getUserConversations(req.user._id);
    return sendSuccess(res, 200, 'Conversations retrieved', { conversations });
  } catch (error) {
    next(error);
  }
};

export const getMessagesForConversation = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { page, limit } = req.query;
    const data = await getConversationMessages(conversationId, req.user._id, { page, limit });
    return sendSuccess(res, 200, 'Messages retrieved', data);
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const result = await markConversationAsRead(conversationId, req.user._id);
    return sendSuccess(res, 200, 'Conversation marked as read', result);
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    const totalUnread = await getUserTotalUnreadCount(req.user._id);
    return sendSuccess(res, 200, 'Unread count retrieved', { totalUnread });
  } catch (error) {
    next(error);
  }
};
