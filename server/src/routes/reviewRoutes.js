import { Router } from 'express';
import {
  submitReviewHandler,
  getPGReviewsHandler,
  checkEligibilityHandler,
} from '../controllers/reviewController.js';
import { authenticateUser, authorizeRoles } from '../middleware/auth.js';

const router = Router();

// Publicly readable reviews for a PG
router.get('/pg/:pgId', getPGReviewsHandler);

// Check if logged-in tenant is eligible to review
router.get('/pg/:pgId/eligibility', authenticateUser, checkEligibilityHandler);

// Submit review (Tenant only with verified stay)
router.post('/pg/:pgId', authenticateUser, authorizeRoles('tenant'), submitReviewHandler);

export default router;
