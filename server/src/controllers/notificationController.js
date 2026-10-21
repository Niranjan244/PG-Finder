import {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUserUnreadNotificationCount,
} from '../services/notificationService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const getNotificationsHandler = async (req, res, next) => {
  try {
    const { page, limit, unreadOnly } = req.query;
    const data = await getUserNotifications(req.user._id, {
      page,
      limit,
      unreadOnly,
    });
    return sendSuccess(res, 200, 'Notifications retrieved', data);
  } catch (error) {
    next(error);
  }
};

export const markNotificationReadHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await markNotificationRead(id, req.user._id);
    return sendSuccess(res, 200, 'Notification marked as read', result);
  } catch (error) {
    next(error);
  }
};

export const markAllReadHandler = async (req, res, next) => {
  try {
    const result = await markAllNotificationsRead(req.user._id);
    return sendSuccess(res, 200, 'All notifications marked as read', result);
  } catch (error) {
    next(error);
  }
};

export const getUnreadCountHandler = async (req, res, next) => {
  try {
    const unreadCount = await getUserUnreadNotificationCount(req.user._id);
    return sendSuccess(res, 200, 'Unread notification count retrieved', { unreadCount });
  } catch (error) {
    next(error);
  }
};
