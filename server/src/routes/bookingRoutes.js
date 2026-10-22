import { Router } from 'express';
import {
  createBooking,
  getMyBookings,
  getOwnerBookingsController,
  approveBooking,
  rejectBooking,
  cancelBooking,
} from '../controllers/bookingController.js';
import { authenticateUser, authorizeRoles } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  createBookingSchema,
  rejectBookingSchema,
  cancelBookingSchema,
} from '../validators/bookingValidation.js';

const router = Router();

// All booking routes require an authenticated session
router.use(authenticateUser);

// Tenant routes
router.post('/', authorizeRoles('tenant'), validateRequest(createBookingSchema), createBooking);
router.get('/my', authorizeRoles('tenant'), getMyBookings);

// Owner routes
router.get('/owner', authorizeRoles('owner', 'admin'), getOwnerBookingsController);
router.patch('/:id/approve', authorizeRoles('owner', 'admin'), approveBooking);
router.patch('/:id/reject', authorizeRoles('owner', 'admin'), validateRequest(rejectBookingSchema), rejectBooking);

// Shared cancel route (tenant can cancel their booking, owner can cancel booking for their property)
router.patch('/:id/cancel', validateRequest(cancelBookingSchema), cancelBooking);

export default router;
