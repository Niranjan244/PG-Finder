import { Router } from 'express';
import {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  firebaseAuth,
  verifyTwoFactor,
  resendTwoFactor,
} from '../controllers/authController.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  firebaseAuthSchema,
} from '../validators/authValidators.js';
import { authRateLimiter } from '../middleware/rateLimiters.js';
import { authenticateUser } from '../middleware/auth.js';

const router = Router();

router.post('/register', authRateLimiter, validateRequest(registerSchema), register);
router.post('/login', authRateLimiter, validateRequest(loginSchema), login);
router.post('/firebase', authRateLimiter, validateRequest(firebaseAuthSchema), firebaseAuth);
router.post('/verify-2fa', authRateLimiter, verifyTwoFactor);
router.post('/resend-2fa', authRateLimiter, resendTwoFactor);
router.post('/logout', logout);
router.get('/me', authenticateUser, getMe);
router.post('/forgot-password', authRateLimiter, validateRequest(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', authRateLimiter, validateRequest(resetPasswordSchema), resetPassword);

export default router;
