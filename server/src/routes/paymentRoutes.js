import express from 'express';
import { authenticateUser, authorizeRoles } from '../middleware/auth.js';
import { validateRequest, validateQuery } from '../middleware/validateRequest.js';
import { paymentRateLimiter } from '../middleware/paymentRateLimiter.js';
import {
  createOrderSchema,
  verifyPaymentSchema,
  refundPaymentSchema,
  paymentFilterSchema,
} from '../validations/paymentValidation.js';
import {
  createOrderHandler,
  verifyPaymentHandler,
  getTenantPaymentsHandler,
  getOwnerPaymentsHandler,
  getAdminPaymentsHandler,
  getAdminRevenueReportHandler,
  processRefundHandler,
} from '../controllers/paymentController.js';

const router = express.Router();

// Apply dedicated payment rate limiter
router.use(paymentRateLimiter);

// Tenant payment initiation and verification
router.post(
  '/create-order',
  authenticateUser,
  authorizeRoles('tenant'),
  validateRequest(createOrderSchema),
  createOrderHandler
);

router.post(
  '/verify',
  authenticateUser,
  authorizeRoles('tenant'),
  validateRequest(verifyPaymentSchema),
  verifyPaymentHandler
);

// Tenant payment history
router.get(
  '/my-payments',
  authenticateUser,
  authorizeRoles('tenant'),
  getTenantPaymentsHandler
);

// Owner received payments
router.get(
  '/received',
  authenticateUser,
  authorizeRoles('owner', 'admin'),
  getOwnerPaymentsHandler
);

// Owner / Admin initiated refund
router.post(
  '/refund',
  authenticateUser,
  authorizeRoles('owner', 'admin'),
  validateRequest(refundPaymentSchema),
  processRefundHandler
);

// Admin reporting and transactions
router.get(
  '/admin/all',
  authenticateUser,
  authorizeRoles('admin'),
  validateQuery(paymentFilterSchema),
  getAdminPaymentsHandler
);

router.get(
  '/admin/revenue',
  authenticateUser,
  authorizeRoles('admin'),
  getAdminRevenueReportHandler
);

export default router;
