import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.nodeEnv === 'production' ? 300 : 5000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.nodeEnv === 'development' || env.nodeEnv === 'test',
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.nodeEnv === 'production' ? 20 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.nodeEnv === 'development' || env.nodeEnv === 'test',
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
});

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
