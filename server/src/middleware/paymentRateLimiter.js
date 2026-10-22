import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

export const paymentRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.nodeEnv === 'production' ? 60 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.nodeEnv === 'test',
  message: {
    success: false,
    message: 'Too many payment requests from this IP address, please try again in a few minutes',
  },
});

export default paymentRateLimiter;
