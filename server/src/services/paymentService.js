import crypto from 'crypto';
import Payment from '../models/Payment.js';
import Booking from '../models/Booking.js';
import PG from '../models/PG.js';
import Room from '../models/Room.js';
import { getRazorpayInstance } from '../config/razorpay.js';
import { env } from '../config/env.js';
import { notificationHooks } from '../utils/notificationHooks.js';

/**
 * Creates or reuses a Razorpay Order for a tenant's approved booking token
 */
export const createOrder = async ({ bookingId, tenantId }) => {
  const booking = await Booking.findById(bookingId).populate('pg', 'title bookingTokenAmount owner');
  if (!booking) {
    const error = new Error('Booking request not found');
    error.statusCode = 404;
    throw error;
  }

  // Security check: tenant must own the booking
  if (booking.tenant.toString() !== tenantId.toString()) {
    const error = new Error('Unauthorized: You can only pay for your own booking requests');
    error.statusCode = 403;
    throw error;
  }

  // Must be in approved status to pay
  if (booking.status !== 'approved') {
    const error = new Error(
      `Cannot pay for this booking: Status is currently "${booking.status}". Only approved bookings accept payments.`
    );
    error.statusCode = 400;
    throw error;
  }

  // Cannot pay twice
  if (booking.paymentStatus === 'paid') {
    const error = new Error('This booking token has already been paid and confirmed');
    error.statusCode = 400;
    throw error;
  }

  // Check hold expiration
  if (booking.holdExpiresAt && new Date() > new Date(booking.holdExpiresAt)) {
    const error = new Error(
      'The payment hold window for this booking has expired. The bed has been released.'
    );
    error.statusCode = 400;
    throw error;
  }

  // Amount in INR calculated strictly on server from PG database record
  const tokenAmount = Math.max(0, Number(booking.pg?.bookingTokenAmount) || 1000);
  const amountInPaise = Math.round(tokenAmount * 100);

  // Idempotency: reuse existing unpaid order if one was already created
  const existingPayment = await Payment.findOne({
    booking: booking._id,
    status: 'created',
  });

  if (existingPayment) {
    return {
      orderId: existingPayment.razorpayOrderId,
      amount: existingPayment.amount,
      amountInPaise: Math.round(existingPayment.amount * 100),
      currency: existingPayment.currency || 'INR',
      keyId: env.razorpayKeyId,
      bookingId: booking._id,
      holdExpiresAt: booking.holdExpiresAt,
    };
  }

  // Call Razorpay API to generate order
  const razorpay = getRazorpayInstance();
  const receiptId = `bk_${booking._id.toString().slice(-8)}_${Date.now().toString().slice(-6)}`;

  let order;
  try {
    order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: receiptId,
      notes: {
        bookingId: booking._id.toString(),
        tenantId: tenantId.toString(),
        pgId: booking.pg?._id?.toString() || booking.pg.toString(),
        ownerId: booking.owner.toString(),
      },
    });
  } catch (err) {
    const error = new Error(`Failed to create Razorpay order: ${err.message}`);
    error.statusCode = 502;
    throw error;
  }

  // Record Payment in database
  const payment = await Payment.create({
    booking: booking._id,
    tenant: tenantId,
    owner: booking.owner,
    pg: booking.pg?._id || booking.pg,
    amount: tokenAmount,
    currency: 'INR',
    razorpayOrderId: order.id,
    status: 'created',
  });

  return {
    orderId: order.id,
    amount: tokenAmount,
    amountInPaise,
    currency: 'INR',
    keyId: env.razorpayKeyId,
    bookingId: booking._id,
    holdExpiresAt: booking.holdExpiresAt,
    paymentId: payment._id,
  };
};

/**
 * Verifies Razorpay payment signature and confirms booking atomically
 */
export const verifyPayment = async ({
  bookingId,
  tenantId,
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}) => {
  if (!env.razorpayKeySecret) {
    const error = new Error('Razorpay key secret not configured on server');
    error.statusCode = 500;
    throw error;
  }

  // 1. Verify HMAC SHA256 Signature
  const expectedSignature = crypto
    .createHmac('sha256', env.razorpayKeySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  const isSignatureValid =
    typeof razorpaySignature === 'string' &&
    razorpaySignature.length === expectedSignature.length &&
    crypto.timingSafeEqual(
      Buffer.from(razorpaySignature, 'utf-8'),
      Buffer.from(expectedSignature, 'utf-8')
    );

  if (!isSignatureValid) {
    // Log failure without leaking secret
    console.warn(`[Payment] Tampered or invalid signature for order ${razorpayOrderId}`);
    const error = new Error('Invalid payment signature verification failed');
    error.statusCode = 400;
    throw error;
  }

  // 2. Lookup payment record by razorpayOrderId
  const payment = await Payment.findOne({ razorpayOrderId }).populate('booking');
  if (!payment) {
    const error = new Error('Payment record matching this Razorpay order was not found');
    error.statusCode = 404;
    throw error;
  }

  // Verify tenant authorization if tenantId provided
  if (tenantId && payment.tenant.toString() !== tenantId.toString()) {
    const error = new Error('Unauthorized: Payment belongs to another user');
    error.statusCode = 403;
    throw error;
  }

  // Idempotency: If already marked paid, return success without re-executing
  if (payment.status === 'paid') {
    const booking = await Booking.findById(payment.booking);
    return {
      success: true,
      message: 'Payment already verified and confirmed',
      payment,
      booking,
    };
  }

  // 3. Atomically update Payment record
  payment.status = 'paid';
  payment.razorpayPaymentId = razorpayPaymentId;
  payment.razorpaySignature = razorpaySignature;
  await payment.save();

  // 4. Atomically confirm Booking
  const booking = await Booking.findById(payment.booking);
  if (booking) {
    booking.status = 'confirmed';
    booking.paymentStatus = 'paid';
    booking.payment = payment._id;
    booking.statusHistory.push({
      status: 'confirmed',
      changedBy: tenantId || payment.tenant,
      changedAt: new Date(),
      reason: 'Booking token payment verified via Razorpay',
    });
    await booking.save();
  }

  // 5. Trigger decoupled notification & email hooks
  await notificationHooks.onPaymentSuccess({ payment, booking });

  return {
    success: true,
    message: 'Payment verified and booking confirmed successfully',
    payment,
    booking,
  };
};

/**
 * Handles incoming Razorpay Webhook events (raw body parsed)
 */
export const handleWebhook = async ({ rawBody, signatureHeader }) => {
  if (!env.razorpayWebhookSecret) {
    const error = new Error('Razorpay webhook secret not configured on server');
    error.statusCode = 500;
    throw error;
  }

  if (!signatureHeader) {
    const error = new Error('Missing X-Razorpay-Signature header');
    error.statusCode = 400;
    throw error;
  }

  // Verify Webhook Signature
  const expectedSignature = crypto
    .createHmac('sha256', env.razorpayWebhookSecret)
    .update(rawBody)
    .digest('hex');

  const isSignatureValid =
    signatureHeader.length === expectedSignature.length &&
    crypto.timingSafeEqual(
      Buffer.from(signatureHeader, 'utf-8'),
      Buffer.from(expectedSignature, 'utf-8')
    );

  if (!isSignatureValid) {
    console.warn('[Webhook] Invalid Razorpay webhook signature rejected');
    const error = new Error('Invalid webhook signature');
    error.statusCode = 400;
    throw error;
  }

  const payload = JSON.parse(rawBody.toString('utf-8'));
  const event = payload.event;
  console.log(`[Razorpay Webhook] Received event: ${event}`);

  if (event === 'payment.captured') {
    const paymentEntity = payload.payload?.payment?.entity;
    const orderId = paymentEntity?.order_id;
    const paymentId = paymentEntity?.id;
    const method = paymentEntity?.method;

    if (orderId) {
      const payment = await Payment.findOne({ razorpayOrderId: orderId });
      if (payment && payment.status !== 'paid') {
        payment.status = 'paid';
        payment.razorpayPaymentId = paymentId;
        payment.method = method;
        await payment.save();

        const booking = await Booking.findById(payment.booking);
        if (booking && booking.status !== 'confirmed') {
          booking.status = 'confirmed';
          booking.paymentStatus = 'paid';
          booking.payment = payment._id;
          booking.statusHistory.push({
            status: 'confirmed',
            changedBy: payment.tenant,
            changedAt: new Date(),
            reason: 'Confirmed via Razorpay Webhook (payment.captured)',
          });
          await booking.save();
        }

        await notificationHooks.onPaymentSuccess({ payment, booking });
      }
    }
  } else if (event === 'payment.failed') {
    const paymentEntity = payload.payload?.payment?.entity;
    const orderId = paymentEntity?.order_id;
    const errorDescription = paymentEntity?.error_description || 'Payment was declined';

    if (orderId) {
      const payment = await Payment.findOne({ razorpayOrderId: orderId });
      if (payment && payment.status === 'created') {
        payment.status = 'failed';
        payment.failureReason = errorDescription;
        await payment.save();

        await notificationHooks.onPaymentFailed({ payment, errorDescription });
      }
    }
  } else if (event === 'refund.processed') {
    const refundEntity = payload.payload?.refund?.entity;
    const paymentId = refundEntity?.payment_id;
    const refundId = refundEntity?.id;

    if (paymentId) {
      const payment = await Payment.findOne({ razorpayPaymentId: paymentId });
      if (payment && payment.status !== 'refunded') {
        payment.status = 'refunded';
        payment.refundId = refundId;
        payment.refundedAt = new Date();
        await payment.save();

        const booking = await Booking.findById(payment.booking);
        if (booking) {
          booking.paymentStatus = 'refunded';
          await booking.save();
        }

        await notificationHooks.onPaymentRefunded({
          payment,
          refundAmount: payment.amount,
        });
      }
    }
  }

  return { received: true, event };
};

/**
 * Initiates Razorpay refund when a paid booking is cancelled
 */
export const processRefund = async ({ bookingId, userId, reason }) => {
  const payment = await Payment.findOne({
    booking: bookingId,
    status: 'paid',
  });

  if (!payment || !payment.razorpayPaymentId) {
    // No paid token to refund
    return null;
  }

  // Already refunded check
  if (payment.status === 'refunded') {
    return payment;
  }

  const razorpay = getRazorpayInstance();
  const refundAmountInPaise = Math.round(payment.amount * 100);

  let refund;
  try {
    refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
      amount: refundAmountInPaise,
      notes: {
        bookingId: bookingId.toString(),
        reason: reason || 'Booking cancelled by user',
      },
    });
  } catch (err) {
    console.error(`[Razorpay Refund Error] Payment ${payment.razorpayPaymentId}:`, err.message);
    const error = new Error(`Refund processing failed with Razorpay: ${err.message}`);
    error.statusCode = 502;
    throw error;
  }

  // Update payment status
  payment.status = 'refunded';
  payment.refundId = refund.id;
  payment.refundAmount = payment.amount;
  payment.refundedAt = new Date();
  await payment.save();

  // Update booking payment status
  await Booking.findByIdAndUpdate(bookingId, { paymentStatus: 'refunded' });

  // Trigger decoupled notification & email hooks
  await notificationHooks.onPaymentRefunded({ payment, refundAmount: payment.amount });

  return payment;
};

/**
 * Periodic cron task: Automatically cancels approved bookings that were never paid within hold window
 */
export const expireUnpaidBookingHolds = async () => {
  const now = new Date();
  const expiredBookings = await Booking.find({
    status: 'approved',
    paymentStatus: 'unpaid',
    holdExpiresAt: { $ne: null, $lte: now },
  });

  if (expiredBookings.length === 0) {
    return { expiredCount: 0 };
  }

  console.log(`[Hold Expiry] Found ${expiredBookings.length} unpaid booking holds to release`);

  for (const booking of expiredBookings) {
    try {
      // 1. Release reserved room bed occupancy atomically
      await Room.findOneAndUpdate(
        { _id: booking.room, occupiedBeds: { $gt: 0 } },
        { $inc: { occupiedBeds: -1 } }
      );

      // 2. Mark booking cancelled
      booking.status = 'cancelled';
      booking.statusHistory.push({
        status: 'cancelled',
        changedBy: booking.owner,
        changedAt: now,
        reason: 'Hold expired: Booking token was not paid within the allocated time window',
      });
      await booking.save();

      // 3. Mark any created Payment as failed due to hold expiry
      await Payment.updateMany(
        { booking: booking._id, status: 'created' },
        { status: 'failed', failureReason: 'Booking hold window expired' }
      );

      // 4. Notify tenant and owner
      await notificationHooks.onHoldExpired({ booking });
    } catch (err) {
      console.error(`[Hold Expiry Error] Booking ${booking._id}:`, err.message);
    }
  }

  return { expiredCount: expiredBookings.length };
};

/**
 * Tenant payment history
 */
export const getTenantPayments = async (tenantId) => {
  return Payment.find({ tenant: tenantId })
    .populate('pg', 'title address city area images')
    .populate('booking', 'moveInDate status paymentStatus')
    .sort({ createdAt: -1 });
};

/**
 * Owner received payments across their PG properties
 */
export const getOwnerPayments = async (ownerId) => {
  return Payment.find({ owner: ownerId })
    .populate('tenant', 'name email phone')
    .populate('pg', 'title city area address')
    .populate('booking', 'moveInDate status paymentStatus')
    .sort({ createdAt: -1 });
};

/**
 * Admin payments list with pagination and date filter
 */
export const getAdminPayments = async ({ page = 1, limit = 20, status, startDate, endDate } = {}) => {
  const filter = {};
  if (status && ['created', 'paid', 'failed', 'refunded'].includes(status)) {
    filter.status = status;
  }
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * pageSize;

  const [total, payments] = await Promise.all([
    Payment.countDocuments(filter),
    Payment.find(filter)
      .populate('tenant', 'name email phone')
      .populate('owner', 'name email phone')
      .populate('pg', 'title city area')
      .populate('booking', 'status paymentStatus moveInDate')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize),
  ]);

  return {
    payments,
    pagination: {
      total,
      page: pageNum,
      limit: pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    },
  };
};

/**
 * Admin revenue report using MongoDB aggregation pipeline
 */
export const getAdminRevenueReport = async ({ startDate, endDate } = {}) => {
  const matchStage = {};
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }

  const stats = await Payment.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalTransactions: { $sum: 1 },
        totalPaidTransactions: {
          $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] },
        },
        totalRefundedTransactions: {
          $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, 1, 0] },
        },
        totalFailedTransactions: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] },
        },
        grossRevenue: {
          $sum: {
            $cond: [
              { $in: ['$status', ['paid', 'refunded']] },
              '$amount',
              0,
            ],
          },
        },
        totalRefundedAmount: {
          $sum: {
            $cond: [{ $eq: ['$status', 'refunded'] }, '$refundAmount', 0],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        totalTransactions: 1,
        totalPaidTransactions: 1,
        totalRefundedTransactions: 1,
        totalFailedTransactions: 1,
        grossRevenue: 1,
        totalRefundedAmount: 1,
        netRevenue: { $subtract: ['$grossRevenue', '$totalRefundedAmount'] },
      },
    },
  ]);

  // Daily revenue breakdown over the last 30 days
  const dailyBreakdown = await Payment.aggregate([
    {
      $match: {
        ...matchStage,
        status: { $in: ['paid', 'refunded'] },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
        },
        collected: { $sum: '$amount' },
        refunded: { $sum: '$refundAmount' },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        date: '$_id',
        collected: 1,
        refunded: 1,
        net: { $subtract: ['$collected', '$refunded'] },
        count: 1,
        _id: 0,
      },
    },
    { $sort: { date: 1 } },
  ]);

  const defaultStats = {
    totalTransactions: 0,
    totalPaidTransactions: 0,
    totalRefundedTransactions: 0,
    totalFailedTransactions: 0,
    grossRevenue: 0,
    totalRefundedAmount: 0,
    netRevenue: 0,
  };

  return {
    summary: stats[0] || defaultStats,
    dailyBreakdown,
  };
};
