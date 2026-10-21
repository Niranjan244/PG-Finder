import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';
import PG from '../models/PG.js';
import { createOrGroupMessageNotification } from './notificationService.js';
import { getIO } from '../sockets/index.js';

const populateConversationDetails = (query) =>
  query
    .populate('tenant', 'name email phone role')
    .populate('owner', 'name email phone role')
    .populate('pg', 'title address city area rentRange images status');

export const getOrCreateConversation = async ({ tenantId, pgId }) => {
  const pg = await PG.findById(pgId);
  if (!pg) {
    const error = new Error('Accommodation listing not found');
    error.statusCode = 404;
    throw error;
  }

  const ownerId = pg.owner._id || pg.owner;
  if (tenantId.toString() === ownerId.toString()) {
    const error = new Error('Property owners cannot initiate a chat on their own listing');
    error.statusCode = 400;
    throw error;
  }

  // Find existing or create a new conversation thread
  let conversation = await populateConversationDetails(
    Conversation.findOne({
      tenant: tenantId,
      owner: ownerId,
      pg: pgId,
    })
  );

  if (!conversation) {
    const newConversation = await Conversation.create({
      tenant: tenantId,
      owner: ownerId,
      pg: pgId,
      unreadCount: { tenant: 0, owner: 0 },
    });

    conversation = await populateConversationDetails(Conversation.findById(newConversation._id));
  }

  return conversation;
};

export const getUserConversations = async (userId) => {
  const conversations = await populateConversationDetails(
    Conversation.find({
      $or: [{ tenant: userId }, { owner: userId }],
    }).sort({ updatedAt: -1 })
  );

  return conversations;
};

export const getConversationMessages = async (conversationId, userId, { page = 1, limit = 50 } = {}) => {
  const conversation = await populateConversationDetails(Conversation.findById(conversationId));

  if (!conversation) {
    const error = new Error('Conversation thread not found');
    error.statusCode = 404;
    throw error;
  }

  // Strictly enforce participant authorization
  const tenantIdStr = (conversation.tenant._id || conversation.tenant).toString();
  const ownerIdStr = (conversation.owner._id || conversation.owner).toString();
  const userIdStr = userId.toString();

  const isParticipant = tenantIdStr === userIdStr || ownerIdStr === userIdStr;

  if (!isParticipant) {
    const error = new Error('Access denied: You are not a participant in this conversation');
    error.statusCode = 403;
    throw error;
  }

  const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
  const total = await Message.countDocuments({ conversation: conversationId });

  const messages = await Message.find({ conversation: conversationId })
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(parseInt(limit, 10))
    .populate('sender', 'name role');

  return {
    messages,
    pagination: {
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(total / limit) || 1,
    },
    conversation,
  };
};

export const saveChatMessage = async ({ conversationId, senderId, text }) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    const error = new Error('Conversation thread not found');
    error.statusCode = 404;
    throw error;
  }

  const isTenant = (conversation.tenant._id || conversation.tenant).toString() === senderId.toString();
  const isOwner = (conversation.owner._id || conversation.owner).toString() === senderId.toString();

  if (!isTenant && !isOwner) {
    const error = new Error('Access denied: You are not authorized to post in this conversation');
    error.statusCode = 403;
    throw error;
  }

  const receiverId = isTenant ? conversation.owner : conversation.tenant;

  // Check if recipient is actively viewing this conversation room via Socket.IO
  let isRecipientInRoom = false;
  try {
    const io = getIO();
    if (io) {
      const room = io.sockets.adapter.rooms.get(`conversation_${conversationId}`);
      if (room && room.size > 0) {
        for (const socketId of room) {
          const socket = io.sockets.sockets.get(socketId);
          if (socket?.user?._id?.toString() === receiverId.toString()) {
            isRecipientInRoom = true;
            break;
          }
        }
      }
    }
  } catch {
    // If socket query fails, fallback to false
  }

  // Persist message to database: if recipient is in room, it's immediately read!
  const message = await Message.create({
    conversation: conversationId,
    sender: senderId,
    receiver: receiverId,
    text: text.trim(),
    isRead: isRecipientInRoom,
  });

  // Update conversation lastMessage
  conversation.lastMessage = {
    text: text.trim(),
    sender: senderId,
    createdAt: message.createdAt,
  };

  if (!conversation.unreadCount) {
    conversation.unreadCount = { tenant: 0, owner: 0 };
  }

  // Only increment unread counter if recipient is not actively in the room
  if (!isRecipientInRoom) {
    const recipientRole = isTenant ? 'owner' : 'tenant';
    conversation.unreadCount[recipientRole] = (conversation.unreadCount[recipientRole] || 0) + 1;
    conversation.markModified('unreadCount');
  }

  conversation.updatedAt = new Date();
  await conversation.save();

  const populatedMessage = await Message.findById(message._id).populate('sender', 'name role');

  // Always create or update message notification for the recipient
  createOrGroupMessageNotification({
    recipient: receiverId,
    sender: senderId,
    senderName: populatedMessage.sender?.name || 'User',
    conversationId: conversation._id.toString(),
    messageId: message._id.toString(),
    previewText: text,
    isRead: isRecipientInRoom,
  }).catch((err) => {
    console.error('Failed to create/group message notification:', err.message);
  });

  return {
    message: populatedMessage,
    receiverId,
    conversation,
  };
};

export const markConversationAsRead = async (conversationId, userId) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    const error = new Error('Conversation thread not found');
    error.statusCode = 404;
    throw error;
  }

  const isTenant = (conversation.tenant._id || conversation.tenant).toString() === userId.toString();
  const isOwner = (conversation.owner._id || conversation.owner).toString() === userId.toString();

  if (!isTenant && !isOwner) {
    const error = new Error('Access denied: You are not a participant in this conversation');
    error.statusCode = 403;
    throw error;
  }

  // Mark all unread messages addressed to this user as read
  const result = await Message.updateMany(
    {
      conversation: conversationId,
      receiver: userId,
      isRead: false,
    },
    { $set: { isRead: true } }
  );

  // Reset this user's unread counter on the conversation
  if (isTenant) {
    conversation.unreadCount.tenant = 0;
  } else {
    conversation.unreadCount.owner = 0;
  }
  conversation.markModified('unreadCount');
  await conversation.save();

  // Also mark any unread notifications for this conversation as read
  await Notification.updateMany(
    {
      recipient: userId,
      type: 'new_message',
      'data.conversationId': conversationId.toString(),
      isRead: false,
    },
    { $set: { isRead: true } }
  );

  // Recalculate remaining unread notification count and broadcast to user channel
  const unreadCount = await Notification.countDocuments({
    recipient: userId,
    isRead: false,
  });

  try {
    const io = getIO();
    if (io) {
      io.to(`user_${userId.toString()}`).emit('notification_unread_count', { unreadCount });
      io.to(`conversation_${conversationId}`).emit('messages_read', {
        conversationId,
        readBy: userId.toString(),
      });
    }
  } catch {
    // Ignore socket error on read receipt
  }

  return {
    conversationId,
    userId,
    unreadCount: conversation.unreadCount,
    markedCount: result.modifiedCount,
  };
};

export const getUserTotalUnreadCount = async (userId) => {
  const conversations = await Conversation.find({
    $or: [{ tenant: userId }, { owner: userId }],
  });

  const totalUnread = conversations.reduce((sum, conversation) => {
    if (conversation.tenant.toString() === userId.toString()) {
      return sum + (conversation.unreadCount?.tenant || 0);
    }
    if (conversation.owner.toString() === userId.toString()) {
      return sum + (conversation.unreadCount?.owner || 0);
    }
    return sum;
  }, 0);

  return totalUnread;
};
