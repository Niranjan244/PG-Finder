import { Router } from 'express';
import {
  toggleWishlistHandler,
  getMyWishlistHandler,
  getMyWishlistIdsHandler,
} from '../controllers/wishlistController.js';
import { authenticateUser } from '../middleware/auth.js';

const router = Router();

// All wishlist routes require authentication
router.use(authenticateUser);

router.get('/', getMyWishlistHandler);
router.get('/ids', getMyWishlistIdsHandler);
router.post('/:pgId/toggle', toggleWishlistHandler);

export default router;
