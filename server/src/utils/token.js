import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const COOKIE_NAME = 'token';
const TOKEN_EXPIRY_DAYS = 7;

export const generateAuthCookie = (res, userId, role) => {
  const token = jwt.sign(
    { sub: userId, role },
    env.jwtSecret,
    { expiresIn: `${TOKEN_EXPIRY_DAYS}d` }
  );

  const isProduction = env.nodeEnv === 'production';

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    path: '/',
  });

  return token;
};

export const clearAuthCookie = (res) => {
  const isProduction = env.nodeEnv === 'production';

  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  });
};
