import { Router } from 'express';
import {
  getNotificationsHandler,
  markNotificationReadHandler,
  markAllReadHandler,
  getUnreadCountHandler,
} from '../controllers/notificationController.js';
import { authenticateUser } from '../middleware/auth.js';

const router = Router();

// All notification routes require authentication
router.use(authenticateUser);

router.get('/', getNotificationsHandler);
router.get('/unread-count', getUnreadCountHandler);
router.patch('/read-all', markAllReadHandler);
router.patch('/:id/read', markNotificationReadHandler);

export default router;
