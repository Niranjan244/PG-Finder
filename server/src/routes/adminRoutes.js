import { Router } from 'express';
import {
  listAllPGs,
  updatePGStatus,
  deletePG,
  listAllUsers,
  toggleUserBlock,
  getPlatformStats,
} from '../controllers/adminController.js';
import { authenticateUser, authorizeRoles } from '../middleware/auth.js';

const router = Router();

// Strictly restrict to administrator role
router.use(authenticateUser);
router.use(authorizeRoles('admin'));

// Platform metrics & moderation
router.get('/stats', getPlatformStats);
router.get('/pgs', listAllPGs);
router.patch('/pgs/:id/status', updatePGStatus);
router.delete('/pgs/:id', deletePG);

// User governance
router.get('/users', listAllUsers);
router.patch('/users/:id/block', toggleUserBlock);

export default router;
