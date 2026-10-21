import { Router } from 'express';
import {
  getChatToken,
  startConversation,
  getMyConversations,
  getMessagesForConversation,
  sendMessageViaRest,
  markAsRead,
  getUnreadCount,
} from '../controllers/chatController.js';
import { authenticateUser } from '../middleware/auth.js';

const router = Router();

// All chat routes require authentication
router.use(authenticateUser);

router.get('/token', getChatToken);
router.post('/start', startConversation);
router.get('/conversations', getMyConversations);
router.get('/conversations/:conversationId/messages', getMessagesForConversation);
router.post('/conversations/:conversationId/messages', sendMessageViaRest);
router.patch('/conversations/:conversationId/read', markAsRead);
router.get('/unread-count', getUnreadCount);

export default router;
