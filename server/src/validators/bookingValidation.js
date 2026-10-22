import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createBookingSchema = z.object({
  pgId: z
    .string({ required_error: 'PG accommodation ID is required' })
    .regex(objectIdRegex, 'Invalid PG accommodation ID format'),
  roomId: z
    .string({ required_error: 'Room ID is required' })
    .regex(objectIdRegex, 'Invalid Room ID format'),
  moveInDate: z
    .string({ required_error: 'Target move-in date is required' })
    .refine((val) => !isNaN(Date.parse(val)), 'Invalid move-in date format')
    .refine((val) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(val) >= today;
    }, 'Move-in date cannot be in the past'),
  message: z
    .string()
    .max(500, 'Message cannot exceed 500 characters')
    .optional()
    .default(''),
});

export const rejectBookingSchema = z.object({
  reason: z
    .string()
    .max(500, 'Rejection reason cannot exceed 500 characters')
    .optional()
    .default(''),
});

export const cancelBookingSchema = z.object({
  reason: z
    .string()
    .max(500, 'Cancellation reason cannot exceed 500 characters')
    .optional()
    .default(''),
});
