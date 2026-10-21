import {
  createBookingRequest,
  getTenantBookings,
  getOwnerBookings,
  approveBookingRequest,
  rejectBookingRequest,
  cancelBookingRequest,
} from '../services/bookingService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const createBooking = async (req, res, next) => {
  try {
    const booking = await createBookingRequest({
      tenantId: req.user._id,
      pgId: req.body.pgId,
      roomId: req.body.roomId,
      moveInDate: req.body.moveInDate,
      message: req.body.message,
    });
    return sendSuccess(res, 201, 'Booking request submitted successfully', booking);
  } catch (error) {
    next(error);
  }
};

export const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await getTenantBookings(req.user._id);
    return sendSuccess(res, 200, 'Tenant bookings retrieved', bookings);
  } catch (error) {
    next(error);
  }
};

export const getOwnerBookingsController = async (req, res, next) => {
  try {
    const result = await getOwnerBookings(req.user._id, req.query);
    return sendSuccess(res, 200, 'Owner booking requests retrieved', result);
  } catch (error) {
    next(error);
  }
};

export const approveBooking = async (req, res, next) => {
  try {
    const updated = await approveBookingRequest({
      bookingId: req.params.id,
      ownerId: req.user._id,
    });
    return sendSuccess(res, 200, 'Booking request approved', updated);
  } catch (error) {
    next(error);
  }
};

export const rejectBooking = async (req, res, next) => {
  try {
    const updated = await rejectBookingRequest({
      bookingId: req.params.id,
      ownerId: req.user._id,
      rejectionReason: req.body.reason,
    });
    return sendSuccess(res, 200, 'Booking request rejected', updated);
  } catch (error) {
    next(error);
  }
};

export const cancelBooking = async (req, res, next) => {
  try {
    const updated = await cancelBookingRequest({
      bookingId: req.params.id,
      userId: req.user._id,
      userRole: req.user.role,
      reason: req.body.reason,
    });
    return sendSuccess(res, 200, 'Booking request cancelled', updated);
  } catch (error) {
    next(error);
  }
};
