import Notification from '../models/Notification.js';
import { getIO } from '../sockets/index.js';

const broadcastNotificationUpdate = async (recipientId, populatedNotification) => {
  try {
    const io = getIO();
    if (!io) return;

    const recipientRoom = `user_${recipientId.toString()}`;
    io.to(recipientRoom).emit('new_notification', populatedNotification);

    const unreadCount = await Notification.countDocuments({
      recipient: recipientId,
      isRead: false,
    });
    io.to(recipientRoom).emit('notification_unread_count', { unreadCount });
  } catch (socketError) {
    console.warn('Socket broadcast warning for notification:', socketError.message);
  }
};

export const createNotification = async ({
  recipient,
  sender = null,
  type,
  title,
  message,
  data = {},
}) => {
  if (!recipient || !type || !title || !message) {
    throw new Error('Recipient, type, title, and message are required for notification');
  }

  const notification = await Notification.create({
    recipient,
    sender,
    type,
    title,
    message,
    data,
    isRead: false,
  });

  const populated = await Notification.findById(notification._id)
    .populate('sender', 'name role')
    .lean();

  // Push live to recipient's private user channel via Socket.IO
  await broadcastNotificationUpdate(recipient, populated);

  return populated;
};

export const createOrGroupMessageNotification = async ({
  recipient,
  sender,
  senderName,
  conversationId,
  messageId,
  previewText,
  isRead = false,
}) => {
  if (!recipient || !conversationId) return null;

  const shortPreview = previewText.trim().slice(0, 80);

  // Group notifications: check if an unread notification already exists for this conversation
  let existingNotification = await Notification.findOne({
    recipient,
    type: 'new_message',
    'data.conversationId': conversationId.toString(),
    isRead: false,
  });

  if (!existingNotification) {
    existingNotification = await Notification.findOne({
      recipient,
      type: 'new_message',
      'data.conversationId': conversationId.toString(),
    }).sort({ updatedAt: -1 });
  }

  let populated;
  if (existingNotification) {
    const currentCount = isRead ? 1 : ((existingNotification.data?.messageCount || 1) + 1);
    existingNotification.title = isRead
      ? `New message from ${senderName}`
      : `${senderName} (${currentCount} messages)`;
    existingNotification.message = `${senderName}: ${shortPreview}`;
    existingNotification.isRead = isRead;
    existingNotification.data = {
      ...existingNotification.data,
      conversationId: conversationId.toString(),
      messageId: messageId.toString(),
      messageCount: currentCount,
    };
    existingNotification.updatedAt = new Date();
    await existingNotification.save();

    populated = await Notification.findById(existingNotification._id)
      .populate('sender', 'name role')
      .lean();
  } else {
    const notification = await Notification.create({
      recipient,
      sender,
      type: 'new_message',
      title: `New message from ${senderName}`,
      message: `${senderName}: ${shortPreview}`,
      data: {
        conversationId: conversationId.toString(),
        messageId: messageId.toString(),
        messageCount: 1,
      },
      isRead,
    });

    populated = await Notification.findById(notification._id)
      .populate('sender', 'name role')
      .lean();
  }

  // Push live to recipient's private user channel via Socket.IO
  await broadcastNotificationUpdate(recipient, populated);

  return populated;
};

export const getUserNotifications = async (
  userId,
  { page = 1, limit = 20, unreadOnly = false } = {}
) => {
  const query = { recipient: userId };
  if (unreadOnly === true || unreadOnly === 'true') {
    query.isRead = false;
  }

  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const skip = (parsedPage - 1) * parsedLimit;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit)
      .populate('sender', 'name role')
      .lean(),
    Notification.countDocuments(query),
    Notification.countDocuments({ recipient: userId, isRead: false }),
  ]);

  return {
    notifications,
    unreadCount,
    pagination: {
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit) || 1,
    },
  };
};

export const markNotificationRead = async (notificationId, userId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { $set: { isRead: true } },
    { new: true }
  );

  if (!notification) {
    const error = new Error('Notification not found or access denied');
    error.statusCode = 404;
    throw error;
  }

  const unreadCount = await Notification.countDocuments({
    recipient: userId,
    isRead: false,
  });

  try {
    const io = getIO();
    if (io) {
      io.to(`user_${userId.toString()}`).emit('notification_unread_count', { unreadCount });
    }
  } catch {
    // Ignore socket error on read receipt
  }

  return { notification, unreadCount };
};

export const markAllNotificationsRead = async (userId) => {
  await Notification.updateMany(
    { recipient: userId, isRead: false },
    { $set: { isRead: true } }
  );

  try {
    const io = getIO();
    if (io) {
      io.to(`user_${userId.toString()}`).emit('notification_unread_count', { unreadCount: 0 });
    }
  } catch {
    // Ignore socket error
  }

  return { unreadCount: 0 };
};

export const getUserUnreadNotificationCount = async (userId) => {
  return await Notification.countDocuments({
    recipient: userId,
    isRead: false,
  });
};
