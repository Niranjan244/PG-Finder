import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createOrderSchema = z.object({
  bookingId: z
    .string({ required_error: 'Booking ID is required' })
    .regex(objectIdRegex, 'Invalid Booking ID format'),
});

export const verifyPaymentSchema = z.object({
  bookingId: z
    .string()
    .regex(objectIdRegex, 'Invalid Booking ID format')
    .optional(),
  razorpayOrderId: z
    .string({ required_error: 'razorpayOrderId is required' })
    .min(5, 'Invalid razorpayOrderId'),
  razorpayPaymentId: z
    .string({ required_error: 'razorpayPaymentId is required' })
    .min(5, 'Invalid razorpayPaymentId'),
  razorpaySignature: z
    .string({ required_error: 'razorpaySignature is required' })
    .min(10, 'Invalid razorpaySignature'),
});

export const refundPaymentSchema = z.object({
  bookingId: z
    .string({ required_error: 'Booking ID is required' })
    .regex(objectIdRegex, 'Invalid Booking ID format'),
  reason: z
    .string()
    .max(500, 'Refund reason cannot exceed 500 characters')
    .optional()
    .default(''),
});

export const paymentFilterSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['created', 'paid', 'failed', 'refunded']).optional(),
  startDate: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/).optional()),
  endDate: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/).optional()),
});
