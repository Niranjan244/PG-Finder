import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import {
  getOrCreateConversation,
  getUserConversations,
  getConversationMessages,
  markConversationAsRead,
  getUserTotalUnreadCount,
  saveChatMessage,
  reactToMessage,
  deleteChatMessage,
  deleteMessageForEveryone,
  deleteMessagesBatch,
  forwardMessage,
  getConversationMediaDocsLinks,
  clearConversationChat,
  toggleBlockConversation,
  getConversationStorageStats,
} from '../services/chatService.js';
import { processChatAttachment } from '../middleware/chatUploadMiddleware.js';
import { getIO } from '../sockets/index.js';
import { isReceiverInConversationRoom } from '../sockets/chatSocket.js';
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
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const { conversationId } = req.params;
    const { text = '', attachments = [], isForwarded = false, replyTo = null } = req.body;

    if ((!text || !text.trim()) && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ success: false, message: 'Message text or attachment is required' });
    }

    const { message, receiverId, conversation } = await saveChatMessage({
      conversationId,
      senderId: req.user._id,
      text,
      attachments,
      isForwarded,
      replyTo,
    });

    try {
      const io = getIO();
      if (io) {
        const payload = {
          conversationId: conversationId.toString(),
          message,
          conversation,
        };
        // 1. Broadcast to the conversation room immediately
        io.to(`conversation_${conversationId}`).emit('new_message', payload);

        // 2. Broadcast immediately to recipient's personal user channel (triggers instant laptop alerts)
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

export const uploadChatAttachments = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'Please select at least one file to upload' });
    }

    const processPromises = req.files.map((file) => processChatAttachment(file));
    const processedAttachments = await Promise.all(processPromises);

    return sendSuccess(res, 201, 'Files processed successfully', {
      attachments: processedAttachments,
    });
  } catch (error) {
    next(error);
  }
};

export const reactToMessageController = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({ success: false, message: 'Emoji reaction is required' });
    }

    const result = await reactToMessage({
      messageId,
      userId: req.user._id,
      emoji,
    });

    try {
      const io = getIO();
      if (io) {
        io.to(`conversation_${result.conversationId}`).emit('message_reacted', result);
        io.to(`user_${req.user._id.toString()}`).emit('message_reacted', result);
      }
    } catch (_) {}

    return sendSuccess(res, 200, 'Reaction updated successfully', result);
  } catch (error) {
    next(error);
  }
};

export const deleteMessageController = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const deleteFor = req.body?.deleteFor || req.query?.deleteFor || 'everyone';
    const result = await deleteChatMessage({
      messageId,
      userId: req.user._id,
      deleteFor,
    });

    try {
      const io = getIO();
      if (io) {
        if (result.type === 'everyone') {
          io.to(`conversation_${result.conversationId}`).emit('message_deleted', result);
        } else {
          io.to(`user_${req.user._id.toString()}`).emit('message_deleted_for_me', result);
        }
      }
    } catch (_) {}

    return sendSuccess(
      res,
      200,
      `Message deleted ${result.type === 'everyone' ? 'for everyone' : 'for you'}`,
      result
    );
  } catch (error) {
    next(error);
  }
};

export const batchDeleteMessagesController = async (req, res, next) => {
  try {
    const { messageIds, deleteFor = 'me' } = req.body;
    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Message IDs array required' });
    }

    const results = await deleteMessagesBatch({
      messageIds,
      userId: req.user._id,
      deleteFor,
    });

    try {
      const io = getIO();
      if (io) {
        results.forEach((r) => {
          if (r.type === 'everyone') {
            io.to(`conversation_${r.conversationId}`).emit('message_deleted', r);
          } else {
            io.to(`user_${req.user._id.toString()}`).emit('message_deleted_for_me', r);
          }
        });
      }
    } catch (_) {}

    return sendSuccess(res, 200, 'Messages deleted successfully', { results });
  } catch (error) {
    next(error);
  }
};

export const forwardMessageController = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { targetConversationIds } = req.body;

    if (!targetConversationIds || !Array.isArray(targetConversationIds) || targetConversationIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one target conversation ID is required',
      });
    }

    const forwardedMessages = await forwardMessage({
      messageId,
      userId: req.user._id,
      targetConversationIds,
    });

    return sendSuccess(res, 200, 'Message forwarded successfully', {
      forwardedCount: forwardedMessages.length,
      messages: forwardedMessages,
    });
  } catch (error) {
    next(error);
  }
};

export const getConversationMediaController = async (req, res, next) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const { conversationId } = req.params;
    const data = await getConversationMediaDocsLinks({
      conversationId,
      userId: req.user._id,
    });

    return sendSuccess(res, 200, 'Media, docs, and links retrieved', data);
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
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

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
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

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

export const clearConversationController = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const result = await clearConversationChat({
      conversationId,
      userId: req.user._id,
    });
    return sendSuccess(res, 200, 'Chat messages cleared successfully', result);
  } catch (error) {
    next(error);
  }
};

export const toggleBlockController = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const result = await toggleBlockConversation({
      conversationId,
      userId: req.user._id,
    });
    return sendSuccess(res, 200, result.isBlocked ? 'Conversation blocked' : 'Conversation unblocked', result);
  } catch (error) {
    next(error);
  }
};

export const getConversationStorageController = async (req, res, next) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const { conversationId } = req.params;
    const stats = await getConversationStorageStats({
      conversationId,
      userId: req.user._id,
    });
    return sendSuccess(res, 200, 'Conversation storage stats retrieved', stats);
  } catch (error) {
    next(error);
  }
};
