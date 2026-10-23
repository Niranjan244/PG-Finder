import {
  registerUser,
  loginUser,
  getCurrentUser,
  requestPasswordReset,
  resetPasswordWithToken,
  verifyFirebaseToken,
  findOrLinkFirebaseUser,
  generateAndSendTwoFactorCode,
  verifyTwoFactorCode,
  resendTwoFactorCode,
} from '../services/authService.js';
import { generateAuthCookie, clearAuthCookie } from '../utils/token.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const register = async (req, res, next) => {
  try {
    const user = await registerUser(req.body);
    generateAuthCookie(res, user.id, user.role);
    return sendSuccess(res, 201, 'Account successfully registered', { user });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const user = await loginUser(req.body);
    generateAuthCookie(res, user.id, user.role);
    return sendSuccess(res, 200, 'Successfully authenticated', { user });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    clearAuthCookie(res);
    return sendSuccess(res, 200, 'Successfully logged out');
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await getCurrentUser(req.user._id);
    return sendSuccess(res, 200, 'Current session retrieved', { user });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    await requestPasswordReset(req.body.email);
    return res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    await resetPasswordWithToken({
      token: req.body.token,
      password: req.body.password,
    });
    return sendSuccess(res, 200, 'Password successfully reset. You can now log in with your new password.');
  } catch (error) {
    next(error);
  }
};

export const firebaseAuth = async (req, res, next) => {
  try {
    const { idToken, role } = req.body;
    const tokenPayload = await verifyFirebaseToken(idToken);
    const result = await findOrLinkFirebaseUser({
      firebaseUid: tokenPayload.firebaseUid,
      email: tokenPayload.email,
      name: tokenPayload.name,
      role,
    });

    if (result.requiresRole) {
      return sendSuccess(res, 200, result.message, {
        requiresRole: true,
        email: result.email,
        name: result.name,
      });
    }

    // Step 2: Trigger Two-Step Verification email to the user's logged-in Gmail
    const twoFactorResult = await generateAndSendTwoFactorCode({
      userId: result.user.id,
      email: result.user.email,
      name: result.user.name,
    });

    return sendSuccess(res, 200, 'Two-step verification code sent to your Google account email', {
      requires2FA: true,
      tempToken: twoFactorResult.tempToken,
      email: result.user.email,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyTwoFactor = async (req, res, next) => {
  try {
    const { tempToken, code } = req.body;
    const user = await verifyTwoFactorCode({ tempToken, code });
    generateAuthCookie(res, user.id, user.role);
    return sendSuccess(res, 200, 'Successfully verified and authenticated', {
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const resendTwoFactor = async (req, res, next) => {
  try {
    const { tempToken } = req.body;
    const result = await resendTwoFactorCode({ tempToken });
    return sendSuccess(res, 200, 'A new verification code has been sent to your email', result);
  } catch (error) {
    next(error);
  }
};
