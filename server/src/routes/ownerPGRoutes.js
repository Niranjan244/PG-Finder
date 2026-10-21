import { Router } from 'express';
import {
  createListing,
  listMyListings,
  getMyListingById,
  updateListing,
  deleteListing,
} from '../controllers/ownerPGController.js';
import {
  createRoom,
  updateRoomDetails,
  removeRoom,
} from '../controllers/ownerRoomController.js';
import { uploadImages } from '../controllers/uploadController.js';
import { authenticateUser, authorizeRoles } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { uploadListingImages } from '../middleware/uploadMiddleware.js';
import { createPGSchema, updatePGSchema, roomSchema } from '../validators/pgValidators.js';

const router = Router();

// Enforce authentication and owner/admin role for all routes in this subrouter
router.use(authenticateUser);
router.use(authorizeRoles('owner', 'admin'));

// Image uploads
router.post('/upload', uploadListingImages.array('images', 10), uploadImages);

// Accommodation listings CRUD
router.get('/', listMyListings);
router.post('/', validateRequest(createPGSchema), createListing);
router.get('/:id', getMyListingById);
router.put('/:id', validateRequest(updatePGSchema), updateListing);
router.delete('/:id', deleteListing);

// Room management
router.post('/:id/rooms', validateRequest(roomSchema), createRoom);
router.put('/:id/rooms/:roomId', validateRequest(roomSchema), updateRoomDetails);
router.delete('/:id/rooms/:roomId', removeRoom);

export default router;
