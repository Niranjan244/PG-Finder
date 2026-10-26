import { Router } from 'express';
import {
  getChatToken,
  startConversation,
  getMyConversations,
  getMessagesForConversation,
  sendMessageViaRest,
  markAsRead,
  getUnreadCount,
  uploadChatAttachments,
  reactToMessageController,
  deleteMessageController,
  batchDeleteMessagesController,
  forwardMessageController,
  getConversationMediaController,
  clearConversationController,
  toggleBlockController,
  getConversationStorageController,
} from '../controllers/chatController.js';
import { authenticateUser } from '../middleware/auth.js';
import { chatUpload } from '../middleware/chatUploadMiddleware.js';

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

// WhatsApp Features: File/Media/Doc Uploads, Reactions, Deletions, Forwarding, Media Explorer
router.post('/upload', chatUpload.array('attachments', 5), uploadChatAttachments);
router.post('/messages/:messageId/react', reactToMessageController);
router.delete('/messages/:messageId', deleteMessageController);
router.post('/messages/batch-delete', batchDeleteMessagesController);
router.post('/messages/:messageId/forward', forwardMessageController);
router.get('/conversations/:conversationId/media', getConversationMediaController);

// Three-Dots Actions: Clear Chat, Block/Unblock, Storage Usage
router.delete('/conversations/:conversationId/clear', clearConversationController);
router.post('/conversations/:conversationId/block', toggleBlockController);
router.get('/conversations/:conversationId/storage', getConversationStorageController);

export default router;
