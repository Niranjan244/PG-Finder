import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { env } from '../config/env.js';
import { sendPasswordResetEmail } from './emailService.js';
import { getFirebaseAdmin } from '../config/firebase.js';

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  authProvider: user.authProvider || 'local',
  createdAt: user.createdAt,
});

export const registerUser = async ({ name, email, phone, password, role }) => {
  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    const error = new Error('An account with this email address already exists');
    error.statusCode = 409;
    throw error;
  }

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    phone: phone.trim(),
    passwordHash,
    role,
    isBlocked: false,
  });

  return sanitizeUser(user);
};

export const loginUser = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');

  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  if (user.isBlocked) {
    const error = new Error('Your account has been suspended. Please contact support.');
    error.statusCode = 403;
    throw error;
  }

  if (!user.passwordHash) {
    const error = new Error('This account was created with Google Sign-In. Please sign in with Google or reset your password.');
    error.statusCode = 400;
    throw error;
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  return sanitizeUser(user);
};

export const getCurrentUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  if (user.isBlocked) {
    const error = new Error('Your account has been suspended. Please contact support.');
    error.statusCode = 403;
    throw error;
  }

  return sanitizeUser(user);
};

export const requestPasswordReset = async (email) => {
  const normalizedEmail = email?.toLowerCase().trim();
  if (!normalizedEmail) {
    return { success: true };
  }

  const user = await User.findOne({ email: normalizedEmail });

  // Generic return whether or not the account exists (prevents account enumeration)
  if (!user || user.isBlocked) {
    return { success: true };
  }

  // Generate 32-byte cryptographically secure random token
  const rawToken = crypto.randomBytes(32).toString('hex');

  // Hash token before storing in database for security
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save();

  const resetUrl = `${env.clientUrl}/reset-password/${rawToken}`;

  // Dispatch email in the background without blocking the HTTP response
  sendPasswordResetEmail({
    toEmail: user.email,
    userName: user.name,
    resetUrl,
  }).catch((mailErr) => {
    console.warn(`[Background Email] Delivery note: ${mailErr.message}`);
  });

  return { success: true };
};

export const resetPasswordWithToken = async ({ token, password }) => {
  if (!token) {
    const error = new Error('Reset token is required.');
    error.statusCode = 400;
    throw error;
  }

  const hashedToken = crypto.createHash('sha256').update(token.trim()).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  }).select('+passwordHash +resetPasswordToken +resetPasswordExpires');

  if (!user) {
    const error = new Error('Password reset link is invalid or has expired. Please request a new one.');
    error.statusCode = 400;
    throw error;
  }

  const salt = await bcrypt.genSalt(12);
  user.passwordHash = await bcrypt.hash(password, salt);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  return { success: true };
};

export const verifyFirebaseToken = async (idToken) => {
  const firebaseAdmin = getFirebaseAdmin();
  if (!firebaseAdmin) {
    const error = new Error('Firebase authentication is not configured on the server.');
    error.statusCode = 503;
    throw error;
  }

  let decodedToken;
  try {
    decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
  } catch (err) {
    const error = new Error('Invalid or expired Google authentication token.');
    error.statusCode = 401;
    throw error;
  }

  if (!decodedToken.email_verified) {
    const error = new Error('Google email is not verified. Please verify your email with Google.');
    error.statusCode = 401;
    throw error;
  }

  return {
    firebaseUid: decodedToken.uid,
    email: decodedToken.email,
    name: decodedToken.name || decodedToken.displayName || 'Google User',
  };
};

export const findOrLinkFirebaseUser = async ({ firebaseUid, email, name, role }) => {
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Check if user already exists with this firebaseUid
  let user = await User.findOne({ firebaseUid });
  if (user) {
    if (user.isBlocked) {
      const error = new Error('Your account has been suspended. Please contact support.');
      error.statusCode = 403;
      throw error;
    }
    return { user: sanitizeUser(user), requiresRole: false };
  }

  // 2. Check if user exists with the same email (account linking)
  user = await User.findOne({ email: normalizedEmail });
  if (user) {
    if (user.isBlocked) {
      const error = new Error('Your account has been suspended. Please contact support.');
      error.statusCode = 403;
      throw error;
    }
    user.firebaseUid = firebaseUid;
    await user.save();
    return { user: sanitizeUser(user), requiresRole: false };
  }

  // 3. New user: role selection is required before account creation
  if (!role) {
    return {
      requiresRole: true,
      message: 'Please choose whether you are a Tenant or PG Owner',
      email: normalizedEmail,
      name,
    };
  }

  if (!['tenant', 'owner'].includes(role)) {
    const error = new Error('Role must be either tenant or owner');
    error.statusCode = 400;
    throw error;
  }

  const newUser = await User.create({
    name: name?.trim() || 'Google User',
    email: normalizedEmail,
    firebaseUid,
    authProvider: 'google',
    role,
    isBlocked: false,
  });

  return { user: sanitizeUser(newUser), requiresRole: false };
};
