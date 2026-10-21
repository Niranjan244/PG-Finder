import Booking from '../models/Booking.js';
import PG from '../models/PG.js';
import Room from '../models/Room.js';
import { notificationHooks } from '../utils/notificationHooks.js';

const populateBookingDetails = (bookingQuery) =>
  bookingQuery
    .populate('tenant', 'name email phone')
    .populate('pg', 'title address city area')
    .populate('room', 'roomNumber roomType rent totalBeds occupiedBeds');

export const createBookingRequest = async ({ tenantId, pgId, roomId, moveInDate, message }) => {
  // Validate target PG listing
  const pg = await PG.findById(pgId);
  if (!pg) {
    const error = new Error('PG accommodation not found');
    error.statusCode = 404;
    throw error;
  }

  if (pg.status !== 'approved') {
    const error = new Error('Cannot request booking: Listing is currently not approved for public bookings');
    error.statusCode = 400;
    throw error;
  }

  // Prevent property owner from booking their own listing
  if (pg.owner.toString() === tenantId.toString()) {
    const error = new Error('Property owners cannot submit booking requests for their own listings');
    error.statusCode = 403;
    throw error;
  }

  // Validate target room within the PG
  const room = await Room.findById(roomId);
  if (!room || room.pg.toString() !== pgId.toString()) {
    const error = new Error('Specified room not found in this accommodation');
    error.statusCode = 404;
    throw error;
  }

  // Pre-check room vacancy
  if (room.occupiedBeds >= room.totalBeds) {
    const error = new Error('Selected room has zero available beds');
    error.statusCode = 400;
    throw error;
  }

  // Block duplicate pending requests from same tenant to same PG
  const existingPending = await Booking.findOne({
    tenant: tenantId,
    pg: pgId,
    status: 'pending',
  });

  if (existingPending) {
    const error = new Error('You already have a pending booking request for this property');
    error.statusCode = 400;
    throw error;
  }

  // Create booking with audit status history
  const booking = await Booking.create({
    tenant: tenantId,
    pg: pgId,
    room: roomId,
    owner: pg.owner,
    moveInDate: new Date(moveInDate),
    message: message?.trim() || '',
    status: 'pending',
    statusHistory: [
      {
        status: 'pending',
        changedBy: tenantId,
        changedAt: new Date(),
        reason: 'Initial booking request submitted by tenant',
      },
    ],
  });

  // Trigger decoupled notification hook
  await notificationHooks.onBookingCreated({
    booking,
    tenant: tenantId,
    owner: pg.owner,
    pg,
  });

  return Booking.findById(booking._id)
    .populate('pg', 'title address city area images rentRange')
    .populate('room', 'roomNumber roomType rent deposit')
    .populate('owner', 'name phone email');
};

export const getTenantBookings = async (tenantId) => {
  return Booking.find({ tenant: tenantId })
    .populate('pg', 'title address city area images genderPreference rentRange deposit')
    .populate('room', 'roomNumber roomType rent deposit totalBeds occupiedBeds')
    .populate('owner', 'name phone email')
    .sort({ createdAt: -1 });
};

export const getOwnerBookings = async (ownerId, { status, pgId, page = 1, limit = 20 } = {}) => {
  const filter = { owner: ownerId };

  if (status && ['pending', 'approved', 'rejected', 'cancelled'].includes(status)) {
    filter.status = status;
  }

  if (pgId) {
    filter.pg = pgId;
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * pageSize;

  const [total, bookings] = await Promise.all([
    Booking.countDocuments(filter),
    Booking.find(filter)
      .populate('tenant', 'name email phone')
      .populate('pg', 'title address city area')
      .populate('room', 'roomNumber roomType rent totalBeds occupiedBeds')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize),
  ]);

  return {
    bookings,
    pagination: {
      total,
      page: pageNum,
      limit: pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    },
  };
};

export const approveBookingRequest = async ({ bookingId, ownerId }) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    const error = new Error('Booking request not found');
    error.statusCode = 404;
    throw error;
  }

  if (booking.owner.toString() !== ownerId.toString()) {
    const error = new Error('Unauthorized: You do not own the property for this booking request');
    error.statusCode = 403;
    throw error;
  }

  if (booking.status !== 'pending') {
    const error = new Error(`Cannot approve booking request: Current status is ${booking.status}`);
    error.statusCode = 400;
    throw error;
  }

  // Atomic conditional update to prevent overbooking race conditions on the last bed
  const updatedRoom = await Room.findOneAndUpdate(
    {
      _id: booking.room,
      $expr: { $lt: ['$occupiedBeds', '$totalBeds'] },
    },
    { $inc: { occupiedBeds: 1 } },
    { new: true }
  );

  if (!updatedRoom) {
    const error = new Error('Cannot approve booking: Room has reached maximum bed capacity');
    error.statusCode = 409; // 409 Conflict
    throw error;
  }

  // Update booking state
  booking.status = 'approved';
  booking.statusHistory.push({
    status: 'approved',
    changedBy: ownerId,
    changedAt: new Date(),
    reason: 'Approved by property owner',
  });

  await booking.save();

  // Trigger decoupled notification hook
  await notificationHooks.onBookingApproved({
    booking,
    tenant: booking.tenant,
    owner: ownerId,
    pg: booking.pg,
    room: updatedRoom,
  });

  return populateBookingDetails(Booking.findById(booking._id));
};

export const rejectBookingRequest = async ({ bookingId, ownerId, rejectionReason }) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    const error = new Error('Booking request not found');
    error.statusCode = 404;
    throw error;
  }

  if (booking.owner.toString() !== ownerId.toString()) {
    const error = new Error('Unauthorized: You do not own the property for this booking request');
    error.statusCode = 403;
    throw error;
  }

  if (booking.status !== 'pending') {
    const error = new Error(`Cannot reject booking request: Current status is ${booking.status}`);
    error.statusCode = 400;
    throw error;
  }

  const reasonText = rejectionReason?.trim() || 'Declined by property owner';

  booking.status = 'rejected';
  booking.rejectionReason = reasonText;
  booking.statusHistory.push({
    status: 'rejected',
    changedBy: ownerId,
    changedAt: new Date(),
    reason: reasonText,
  });

  await booking.save();

  await notificationHooks.onBookingRejected({
    booking,
    tenant: booking.tenant,
    owner: ownerId,
    reason: reasonText,
  });

  return populateBookingDetails(Booking.findById(booking._id));
};

export const cancelBookingRequest = async ({ bookingId, userId, userRole, reason }) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    const error = new Error('Booking request not found');
    error.statusCode = 404;
    throw error;
  }

  // Authorization: Tenant can cancel own booking, Owner can cancel booking on their property, Admin can cancel any
  const isTenantOwner = booking.tenant.toString() === userId.toString();
  const isPropertyOwner = booking.owner.toString() === userId.toString();
  const isAdmin = userRole === 'admin';

  if (!isTenantOwner && !isPropertyOwner && !isAdmin) {
    const error = new Error('Unauthorized: You cannot cancel this booking');
    error.statusCode = 403;
    throw error;
  }

  if (booking.status === 'cancelled') {
    const error = new Error('Booking request is already cancelled');
    error.statusCode = 400;
    throw error;
  }

  if (booking.status === 'rejected') {
    const error = new Error('Cannot cancel a booking that was already rejected');
    error.statusCode = 400;
    throw error;
  }

  // If cancelling an approved booking, free the reserved bed atomically
  if (booking.status === 'approved') {
    await Room.findOneAndUpdate(
      { _id: booking.room, occupiedBeds: { $gt: 0 } },
      { $inc: { occupiedBeds: -1 } }
    );
  }

  const cancelReason = reason?.trim() || `Booking cancelled by ${userRole || 'user'}`;

  booking.status = 'cancelled';
  booking.statusHistory.push({
    status: 'cancelled',
    changedBy: userId,
    changedAt: new Date(),
    reason: cancelReason,
  });

  await booking.save();

  await notificationHooks.onBookingCancelled({
    booking,
    tenant: booking.tenant,
    owner: booking.owner,
    cancelledBy: userId,
  });

  return populateBookingDetails(Booking.findById(booking._id));
};
