import User from '../models/User.js';
import PG from '../models/PG.js';
import Room from '../models/Room.js';
import { createNotification } from '../services/notificationService.js';
import {
  sendBookingConfirmationEmail,
  sendBookingRejectionEmail,
} from '../services/emailService.js';

export const notificationHooks = {
  onBookingCreated: async ({ booking, tenant, owner, pg }) => {
    try {
      const [tenantUser, pgDoc] = await Promise.all([
        User.findById(tenant._id || tenant).select('name email phone'),
        pg?.title ? pg : PG.findById(pg._id || pg).select('title'),
      ]);

      const ownerId = owner._id || owner;
      const tenantName = tenantUser?.name || 'A prospective resident';
      const pgTitle = pgDoc?.title || 'Accommodation';

      await createNotification({
        recipient: ownerId,
        sender: tenant._id || tenant,
        type: 'booking_request',
        title: 'New Booking Request',
        message: `${tenantName} requested a room in "${pgTitle}".`,
        data: {
          bookingId: (booking._id || booking).toString(),
          pgId: (pgDoc?._id || pg).toString(),
        },
      });
    } catch (err) {
      console.warn('onBookingCreated notification error:', err.message);
    }
  },

  onBookingApproved: async ({ booking, tenant, owner, pg, room }) => {
    try {
      const [tenantUser, pgDoc, roomDoc] = await Promise.all([
        User.findById(tenant._id || tenant).select('name email'),
        pg?.title ? pg : PG.findById(pg._id || pg).select('title'),
        room?.roomType ? room : Room.findById(room._id || room).select('roomType rent'),
      ]);

      const tenantId = tenant._id || tenant;
      const pgTitle = pgDoc?.title || 'Accommodation';

      // 1. Send live in-app notification to tenant
      await createNotification({
        recipient: tenantId,
        sender: owner._id || owner,
        type: 'booking_approved',
        title: 'Booking Approved',
        message: `Your booking request for "${pgTitle}" has been approved!`,
        data: {
          bookingId: (booking._id || booking).toString(),
          pgId: (pgDoc?._id || pg).toString(),
        },
      });

      // 2. Dispatched non-blocking email via Nodemailer
      if (tenantUser?.email) {
        sendBookingConfirmationEmail({
          toEmail: tenantUser.email,
          tenantName: tenantUser.name,
          pgTitle,
          roomType: roomDoc?.roomType,
          rent: roomDoc?.rent,
          moveInDate: booking.moveInDate,
        }).catch((err) => console.warn('SMTP approval dispatch warning:', err.message));
      }
    } catch (err) {
      console.warn('onBookingApproved notification error:', err.message);
    }
  },

  onBookingRejected: async ({ booking, tenant, owner, reason }) => {
    try {
      const [tenantUser, pgDoc] = await Promise.all([
        User.findById(tenant._id || tenant).select('name email'),
        booking.pg?.title ? booking.pg : PG.findById(booking.pg).select('title'),
      ]);

      const tenantId = tenant._id || tenant;
      const pgTitle = pgDoc?.title || 'Accommodation';
      const reasonText = reason || 'Could not accommodate at this time';

      // 1. Send live in-app notification to tenant
      await createNotification({
        recipient: tenantId,
        sender: owner._id || owner,
        type: 'booking_rejected',
        title: 'Booking Request Declined',
        message: `Your request for "${pgTitle}" was declined. Reason: ${reasonText}`,
        data: {
          bookingId: (booking._id || booking).toString(),
          pgId: (pgDoc?._id || booking.pg).toString(),
          reason: reasonText,
        },
      });

      // 2. Dispatched non-blocking email via Nodemailer
      if (tenantUser?.email) {
        sendBookingRejectionEmail({
          toEmail: tenantUser.email,
          tenantName: tenantUser.name,
          pgTitle,
          reason: reasonText,
        }).catch((err) => console.warn('SMTP rejection dispatch warning:', err.message));
      }
    } catch (err) {
      console.warn('onBookingRejected notification error:', err.message);
    }
  },

  onBookingCancelled: async ({ booking, tenant, owner, cancelledBy }) => {
    try {
      const recipient = String(cancelledBy) === String(tenant._id || tenant)
        ? (owner._id || owner)
        : (tenant._id || tenant);

      const pgDoc = await PG.findById(booking.pg).select('title');

      await createNotification({
        recipient,
        sender: cancelledBy,
        type: 'system',
        title: 'Booking Request Cancelled',
        message: `The booking request for "${pgDoc?.title || 'Accommodation'}" was cancelled.`,
        data: {
          bookingId: (booking._id || booking).toString(),
          pgId: (pgDoc?._id || booking.pg).toString(),
        },
      });
    } catch (err) {
      console.warn('onBookingCancelled notification error:', err.message);
    }
  },
};

export default notificationHooks;
