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

  const parsedLimit = parseInt(limit, 10) || 50;
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const skip = (parsedPage - 1) * parsedLimit;
  const messageFilter = {
    conversation: conversationId,
    deletedFor: { $ne: userId },
  };
  const total = await Message.countDocuments(messageFilter);

  // Query newest messages first (descending), then reverse so they render chronologically (oldest to newest)
  const rawMessages = await Message.find(messageFilter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parsedLimit)
    .populate('sender', 'name role')
    .populate({
      path: 'replyTo',
      select: 'text attachments isDeleted sender',
      populate: { path: 'sender', select: 'name role' },
    });

  const messages = rawMessages.reverse();

  return {
    messages,
    pagination: {
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit) || 1,
    },
    conversation,
  };
};

export const saveChatMessage = async ({
  conversationId,
  senderId,
  text = '',
  attachments = [],
  isForwarded = false,
  replyTo = null,
}) => {
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

  if (conversation.isBlocked) {
    const error = new Error('Cannot send message: This conversation has been blocked');
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

  const trimmedText = (text || '').trim();

  // Persist message to database: if recipient is in room, it's immediately read!
  const message = await Message.create({
    conversation: conversationId,
    sender: senderId,
    receiver: receiverId,
    text: trimmedText,
    attachments: Array.isArray(attachments) ? attachments : [],
    isForwarded: Boolean(isForwarded),
    replyTo: replyTo || null,
    isRead: isRecipientInRoom,
  });

  // Determine preview text for lastMessage
  let previewText = trimmedText;
  if (!previewText && attachments && attachments.length > 0) {
    const firstAtt = attachments[0];
    if (firstAtt.fileType === 'image') {
      previewText = '📷 Photo';
    } else {
      previewText = `📄 ${firstAtt.originalName || 'Document'}`;
    }
  }

  // Update conversation lastMessage
  conversation.lastMessage = {
    text: previewText,
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

  const populatedMessage = await Message.findById(message._id)
    .populate('sender', 'name role')
    .populate({
      path: 'replyTo',
      select: 'text attachments isDeleted sender',
      populate: { path: 'sender', select: 'name role' },
    });

  // Always create or update message notification for the recipient
  createOrGroupMessageNotification({
    recipient: receiverId,
    sender: senderId,
    senderName: populatedMessage.sender?.name || 'User',
    conversationId: conversation._id.toString(),
    messageId: message._id.toString(),
    previewText: previewText || 'Sent an attachment',
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

export const reactToMessage = async ({ messageId, userId, emoji }) => {
  const message = await Message.findById(messageId);
  if (!message) {
    const error = new Error('Message not found');
    error.statusCode = 404;
    throw error;
  }

  const conversation = await Conversation.findById(message.conversation);
  if (!conversation) {
    const error = new Error('Conversation not found');
    error.statusCode = 404;
    throw error;
  }

  const isTenant = (conversation.tenant._id || conversation.tenant).toString() === userId.toString();
  const isOwner = (conversation.owner._id || conversation.owner).toString() === userId.toString();
  if (!isTenant && !isOwner) {
    const error = new Error('Unauthorized to react to this message');
    error.statusCode = 403;
    throw error;
  }

  if (!Array.isArray(message.reactions)) {
    message.reactions = [];
  }

  const existingIndex = message.reactions.findIndex(
    (r) => r.user.toString() === userId.toString()
  );

  if (existingIndex !== -1) {
    if (message.reactions[existingIndex].emoji === emoji) {
      // Toggle off if clicking the same emoji
      message.reactions.splice(existingIndex, 1);
    } else {
      // Update reaction to new emoji
      message.reactions[existingIndex].emoji = emoji;
      message.reactions[existingIndex].createdAt = new Date();
    }
  } else {
    message.reactions.push({
      user: userId,
      emoji,
      createdAt: new Date(),
    });
  }

  await message.save();

  const populatedMessage = await Message.findById(message._id)
    .populate('sender', 'name role')
    .populate({
      path: 'replyTo',
      select: 'text attachments isDeleted sender',
      populate: { path: 'sender', select: 'name role' },
    });

  return {
    messageId: message._id.toString(),
    conversationId: message.conversation.toString(),
    reactions: message.reactions,
    message: populatedMessage,
  };
};

export const deleteChatMessage = async ({ messageId, userId, deleteFor = 'everyone' }) => {
  const message = await Message.findById(messageId);
  if (!message) {
    const error = new Error('Message not found');
    error.statusCode = 404;
    throw error;
  }

  const conversation = await Conversation.findById(message.conversation);
  if (!conversation) {
    const error = new Error('Conversation thread not found');
    error.statusCode = 404;
    throw error;
  }

  const isTenant = (conversation.tenant._id || conversation.tenant).toString() === userId.toString();
  const isOwner = (conversation.owner._id || conversation.owner).toString() === userId.toString();
  if (!isTenant && !isOwner) {
    const error = new Error('Unauthorized');
    error.statusCode = 403;
    throw error;
  }

  const isSender = message.sender.toString() === userId.toString();

  if (deleteFor === 'everyone') {
    if (!isSender) {
      const error = new Error('Only the sender can delete this message for everyone');
      error.statusCode = 403;
      throw error;
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    message.text = 'This message was deleted';
    message.attachments = [];
    message.reactions = [];
    await message.save();

    // If this was the last message on the conversation, update conversation lastMessage preview
    if (conversation && conversation.lastMessage) {
      const lastCreated = new Date(conversation.lastMessage.createdAt).getTime();
      const msgCreated = new Date(message.createdAt).getTime();
      if (Math.abs(lastCreated - msgCreated) < 1500) {
        conversation.lastMessage.text = 'This message was deleted';
        await conversation.save();
      }
    }

    const populatedMessage = await Message.findById(message._id)
    .populate('sender', 'name role')
    .populate({
      path: 'replyTo',
      select: 'text attachments isDeleted sender',
      populate: { path: 'sender', select: 'name role' },
    });

    return {
      type: 'everyone',
      messageId: message._id.toString(),
      conversationId: message.conversation.toString(),
      message: populatedMessage,
    };
  } else {
    // Delete for me
    if (!message.deletedFor) {
      message.deletedFor = [];
    }
    if (!message.deletedFor.some((id) => id.toString() === userId.toString())) {
      message.deletedFor.push(userId);
      await message.save();
    }

    return {
      type: 'me',
      messageId: message._id.toString(),
      conversationId: message.conversation.toString(),
      userId: userId.toString(),
    };
  }
};

export const deleteMessageForEveryone = async ({ messageId, userId }) => {
  return await deleteChatMessage({ messageId, userId, deleteFor: 'everyone' });
};

export const deleteMessagesBatch = async ({ messageIds = [], userId, deleteFor = 'me' }) => {
  const results = [];
  for (const mId of messageIds) {
    try {
      const res = await deleteChatMessage({ messageId: mId, userId, deleteFor });
      results.push(res);
    } catch (_) {}
  }
  return results;
};

export const forwardMessage = async ({ messageId, userId, targetConversationIds }) => {
  const sourceMessage = await Message.findById(messageId);
  if (!sourceMessage) {
    const error = new Error('Message to forward not found');
    error.statusCode = 404;
    throw error;
  }

  if (!targetConversationIds || !Array.isArray(targetConversationIds) || targetConversationIds.length === 0) {
    const error = new Error('Please select at least one conversation to forward to');
    error.statusCode = 400;
    throw error;
  }

  const forwardedMessages = [];

  for (const targetId of targetConversationIds) {
    try {
      const result = await saveChatMessage({
        conversationId: targetId,
        senderId: userId,
        text: sourceMessage.text || '',
        attachments: sourceMessage.attachments || [],
        isForwarded: true,
      });

      // Broadcast to target conversation room & user channels
      try {
        const io = getIO();
        if (io) {
          const payload = {
            conversationId: targetId.toString(),
            message: result.message,
            conversation: result.conversation,
          };
          io.to(`conversation_${targetId}`).emit('new_message', payload);
          io.to(`user_${result.receiverId.toString()}`).emit('new_message', payload);
          io.to(`user_${result.receiverId.toString()}`).emit('conversation_updated', payload);
          io.to(`user_${userId.toString()}`).emit('conversation_updated', payload);
        }
      } catch (_) {}

      forwardedMessages.push(result.message);
    } catch (err) {
      console.warn(`Forward to ${targetId} warning:`, err.message);
    }
  }

  return forwardedMessages;
};

export const getConversationMediaDocsLinks = async ({ conversationId, userId }) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    const error = new Error('Conversation not found');
    error.statusCode = 404;
    throw error;
  }

  const isTenant = (conversation.tenant._id || conversation.tenant).toString() === userId.toString();
  const isOwner = (conversation.owner._id || conversation.owner).toString() === userId.toString();
  if (!isTenant && !isOwner) {
    const error = new Error('Unauthorized');
    error.statusCode = 403;
    throw error;
  }

  const messages = await Message.find({
    conversation: conversationId,
    isDeleted: false,
  })
    .sort({ createdAt: -1 })
    .populate('sender', 'name role')
    .lean();

  const media = [];
  const docs = [];
  const links = [];

  const urlRegex = /(https?:\/\/[^\s]+)/gi;

  for (const msg of messages) {
    if (Array.isArray(msg.attachments)) {
      for (const att of msg.attachments) {
        if (att.fileType === 'image') {
          media.push({
            _id: msg._id,
            url: att.url,
            originalName: att.originalName,
            fileSize: att.fileSize,
            createdAt: msg.createdAt,
            sender: msg.sender,
          });
        } else {
          docs.push({
            _id: msg._id,
            url: att.url,
            originalName: att.originalName,
            fileSize: att.fileSize,
            mimeType: att.mimeType,
            createdAt: msg.createdAt,
            sender: msg.sender,
          });
        }
      }
    }

    if (msg.text) {
      const matches = msg.text.match(urlRegex);
      if (matches) {
        for (const url of matches) {
          links.push({
            _id: msg._id,
            url,
            text: msg.text,
            createdAt: msg.createdAt,
            sender: msg.sender,
          });
        }
      }
    }
  }

  return {
    media,
    docs,
    links,
    totalCount: media.length + docs.length + links.length,
  };
};

export const clearConversationChat = async ({ conversationId, userId }) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    const error = new Error('Conversation thread not found');
    error.statusCode = 404;
    throw error;
  }

  const isTenant = (conversation.tenant._id || conversation.tenant).toString() === userId.toString();
  const isOwner = (conversation.owner._id || conversation.owner).toString() === userId.toString();

  if (!isTenant && !isOwner) {
    const error = new Error('Unauthorized');
    error.statusCode = 403;
    throw error;
  }

  // Delete all messages in the conversation
  await Message.deleteMany({ conversation: conversationId });

  // Reset conversation last message and unread count
  conversation.lastMessage = {
    text: '',
    sender: null,
    createdAt: new Date(),
  };
  conversation.unreadCount = { tenant: 0, owner: 0 };
  conversation.markModified('unreadCount');
  await conversation.save();

  // Also remove notifications related to this conversation
  await Notification.deleteMany({
    'data.conversationId': conversationId.toString(),
  });

  try {
    const io = getIO();
    if (io) {
      io.to(`conversation_${conversationId}`).emit('chat_cleared', { conversationId });
      io.to(`user_${conversation.tenant.toString()}`).emit('conversation_updated', { conversationId, conversation });
      io.to(`user_${conversation.owner.toString()}`).emit('conversation_updated', { conversationId, conversation });
    }
  } catch (_) {}

  return { conversationId, success: true };
};

export const toggleBlockConversation = async ({ conversationId, userId }) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    const error = new Error('Conversation thread not found');
    error.statusCode = 404;
    throw error;
  }

  const isTenant = (conversation.tenant._id || conversation.tenant).toString() === userId.toString();
  const isOwner = (conversation.owner._id || conversation.owner).toString() === userId.toString();

  if (!isTenant && !isOwner) {
    const error = new Error('Unauthorized');
    error.statusCode = 403;
    throw error;
  }

  if (conversation.isBlocked) {
    // If currently blocked, verify that the current user was the one who blocked it
    if (conversation.blockedBy && conversation.blockedBy.toString() !== userId.toString()) {
      const error = new Error('Only the user who blocked this conversation can unblock it');
      error.statusCode = 403;
      throw error;
    }
    conversation.isBlocked = false;
    conversation.blockedBy = null;
  } else {
    // Block conversation
    conversation.isBlocked = true;
    conversation.blockedBy = userId;
  }

  await conversation.save();

  try {
    const io = getIO();
    if (io) {
      const payload = {
        conversationId: conversationId.toString(),
        isBlocked: conversation.isBlocked,
        blockedBy: conversation.blockedBy ? conversation.blockedBy.toString() : null,
      };
      io.to(`conversation_${conversationId}`).emit('conversation_blocked_status', payload);
      io.to(`user_${conversation.tenant.toString()}`).emit('conversation_blocked_status', payload);
      io.to(`user_${conversation.owner.toString()}`).emit('conversation_blocked_status', payload);
    }
  } catch (_) {}

  return {
    conversationId: conversationId.toString(),
    isBlocked: conversation.isBlocked,
    blockedBy: conversation.blockedBy ? conversation.blockedBy.toString() : null,
  };
};

export const getConversationStorageStats = async ({ conversationId, userId }) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    const error = new Error('Conversation thread not found');
    error.statusCode = 404;
    throw error;
  }

  const isTenant = (conversation.tenant._id || conversation.tenant).toString() === userId.toString();
  const isOwner = (conversation.owner._id || conversation.owner).toString() === userId.toString();

  if (!isTenant && !isOwner) {
    const error = new Error('Unauthorized');
    error.statusCode = 403;
    throw error;
  }

  const messages = await Message.find({
    conversation: conversationId,
    isDeleted: false,
    'attachments.0': { $exists: true },
  })
    .sort({ createdAt: -1 })
    .populate('sender', 'name role')
    .lean();

  let imageBytes = 0;
  let imageCount = 0;
  let docBytes = 0;
  let docCount = 0;
  const files = [];

  for (const msg of messages) {
    if (Array.isArray(msg.attachments)) {
      for (const att of msg.attachments) {
        const size = att.fileSize || 0;
        if (att.fileType === 'image') {
          imageBytes += size;
          imageCount += 1;
        } else {
          docBytes += size;
          docCount += 1;
        }
        files.push({
          _id: msg._id,
          url: att.url,
          originalName: att.originalName || 'Attachment',
          fileType: att.fileType,
          fileSize: size,
          createdAt: msg.createdAt,
          sender: msg.sender,
        });
      }
    }
  }

  // Sort files by size descending (largest first)
  files.sort((a, b) => b.fileSize - a.fileSize);

  return {
    conversationId,
    totalBytes: imageBytes + docBytes,
    imageBytes,
    imageCount,
    docBytes,
    docCount,
    totalFiles: imageCount + docCount,
    files,
  };
};
