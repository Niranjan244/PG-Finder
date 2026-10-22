import * as paymentService from '../services/paymentService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const createOrderHandler = async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    const orderData = await paymentService.createOrder({
      bookingId,
      tenantId: req.user._id,
    });
    return sendSuccess(res, 201, 'Razorpay order created successfully', orderData);
  } catch (error) {
    next(error);
  }
};

export const verifyPaymentHandler = async (req, res, next) => {
  try {
    const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    const result = await paymentService.verifyPayment({
      bookingId,
      tenantId: req.user._id,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });
    return sendSuccess(res, 200, result.message, result);
  } catch (error) {
    next(error);
  }
};

export const webhookHandler = async (req, res, next) => {
  try {
    const signatureHeader = req.headers['x-razorpay-signature'];
    const rawBody = req.body; // Buffer from express.raw
    const result = await paymentService.handleWebhook({
      rawBody,
      signatureHeader,
    });
    return res.status(200).json({ status: 'ok', ...result });
  } catch (error) {
    next(error);
  }
};

export const getTenantPaymentsHandler = async (req, res, next) => {
  try {
    const payments = await paymentService.getTenantPayments(req.user._id);
    return sendSuccess(res, 200, 'Payment history retrieved successfully', payments);
  } catch (error) {
    next(error);
  }
};

export const getOwnerPaymentsHandler = async (req, res, next) => {
  try {
    const payments = await paymentService.getOwnerPayments(req.user._id);
    return sendSuccess(res, 200, 'Received payments retrieved successfully', payments);
  } catch (error) {
    next(error);
  }
};

export const getAdminPaymentsHandler = async (req, res, next) => {
  try {
    const data = await paymentService.getAdminPayments(req.query);
    return sendSuccess(res, 200, 'Payments list retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getAdminRevenueReportHandler = async (req, res, next) => {
  try {
    const report = await paymentService.getAdminRevenueReport(req.query);
    return sendSuccess(res, 200, 'Revenue analytics report retrieved successfully', report);
  } catch (error) {
    next(error);
  }
};

export const processRefundHandler = async (req, res, next) => {
  try {
    const { bookingId, reason } = req.body;
    const refund = await paymentService.processRefund({
      bookingId,
      userId: req.user._id,
      reason,
    });
    return sendSuccess(res, 200, 'Refund processed successfully', refund);
  } catch (error) {
    next(error);
  }
};
