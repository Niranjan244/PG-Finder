import User from '../models/User.js';
import PG from '../models/PG.js';
import Room from '../models/Room.js';
import { createNotification } from '../services/notificationService.js';
import {
  sendBookingConfirmationEmail,
  sendBookingRejectionEmail,
  sendPaymentSuccessEmail,
  sendPaymentRefundEmail,
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

  onPaymentSuccess: async ({ payment, booking }) => {
    try {
      const [tenantUser, ownerUser, pgDoc] = await Promise.all([
        User.findById(payment.tenant).select('name email'),
        User.findById(payment.owner).select('name email'),
        PG.findById(payment.pg).select('title'),
      ]);

      const pgTitle = pgDoc?.title || 'Accommodation';
      const amountStr = `₹${Number(payment.amount).toLocaleString('en-IN')}`;

      // Notify Tenant
      await createNotification({
        recipient: payment.tenant,
        sender: payment.owner,
        type: 'payment_success',
        title: 'Booking Token Paid',
        message: `Your payment of ${amountStr} for "${pgTitle}" was successful. Bed reserved!`,
        data: {
          bookingId: payment.booking.toString(),
          paymentId: payment._id.toString(),
          razorpayPaymentId: payment.razorpayPaymentId,
        },
      });

      // Notify Owner
      await createNotification({
        recipient: payment.owner,
        sender: payment.tenant,
        type: 'payment_success',
        title: 'Token Payment Received',
        message: `${tenantUser?.name || 'A tenant'} paid the booking token of ${amountStr} for "${pgTitle}".`,
        data: {
          bookingId: payment.booking.toString(),
          paymentId: payment._id.toString(),
        },
      });

      // Send confirmation email to Tenant
      if (tenantUser?.email) {
        sendPaymentSuccessEmail({
          toEmail: tenantUser.email,
          userName: tenantUser.name,
          pgTitle,
          amount: payment.amount,
          paymentId: payment.razorpayPaymentId,
          orderId: payment.razorpayOrderId,
        }).catch((err) => console.warn('Payment success email warning:', err.message));
      }
    } catch (err) {
      console.warn('onPaymentSuccess notification error:', err.message);
    }
  },

  onPaymentFailed: async ({ payment, errorDescription }) => {
    try {
      const pgDoc = await PG.findById(payment.pg).select('title');
      await createNotification({
        recipient: payment.tenant,
        sender: payment.owner,
        type: 'payment_failed',
        title: 'Payment Incomplete',
        message: `Your payment for "${pgDoc?.title || 'Accommodation'}" could not be completed.${errorDescription ? ` (${errorDescription})` : ''} You can retry.`,
        data: {
          bookingId: payment.booking.toString(),
          paymentId: payment._id.toString(),
        },
      });
    } catch (err) {
      console.warn('onPaymentFailed notification error:', err.message);
    }
  },

  onPaymentRefunded: async ({ payment, refundAmount }) => {
    try {
      const [tenantUser, pgDoc] = await Promise.all([
        User.findById(payment.tenant).select('name email'),
        PG.findById(payment.pg).select('title'),
      ]);

      const pgTitle = pgDoc?.title || 'Accommodation';
      const amountStr = `₹${Number(refundAmount || payment.amount).toLocaleString('en-IN')}`;

      await createNotification({
        recipient: payment.tenant,
        sender: payment.owner,
        type: 'payment_refunded',
        title: 'Booking Refund Processed',
        message: `A refund of ${amountStr} for "${pgTitle}" has been initiated to your original payment method.`,
        data: {
          bookingId: payment.booking.toString(),
          paymentId: payment._id.toString(),
          refundId: payment.refundId,
        },
      });

      if (tenantUser?.email) {
        sendPaymentRefundEmail({
          toEmail: tenantUser.email,
          userName: tenantUser.name,
          pgTitle,
          amount: refundAmount || payment.amount,
          refundId: payment.refundId,
        }).catch((err) => console.warn('Payment refund email warning:', err.message));
      }
    } catch (err) {
      console.warn('onPaymentRefunded notification error:', err.message);
    }
  },

  onHoldExpired: async ({ booking }) => {
    try {
      const [tenantUser, pgDoc] = await Promise.all([
        User.findById(booking.tenant).select('name email'),
        PG.findById(booking.pg).select('title'),
      ]);

      const pgTitle = pgDoc?.title || 'Accommodation';

      // Notify Tenant
      await createNotification({
        recipient: booking.tenant,
        sender: booking.owner,
        type: 'system',
        title: 'Booking Hold Expired',
        message: `Your booking hold for "${pgTitle}" expired due to unpaid booking token. The bed has been released.`,
        data: {
          bookingId: booking._id.toString(),
        },
      });

      // Notify Owner
      await createNotification({
        recipient: booking.owner,
        sender: booking.tenant,
        type: 'system',
        title: 'Booking Hold Expired',
        message: `Booking hold for ${tenantUser?.name || 'tenant'} on "${pgTitle}" expired and bed was returned to inventory.`,
        data: {
          bookingId: booking._id.toString(),
        },
      });
    } catch (err) {
      console.warn('onHoldExpired notification error:', err.message);
    }
  },
};

export default notificationHooks;
