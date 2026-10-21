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
