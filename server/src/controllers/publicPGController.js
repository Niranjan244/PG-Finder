import { getPublicPGDetails } from '../services/pgService.js';
import { sendSuccess } from '../utils/apiResponse.js';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const getPublicPG = async (req, res, next) => {
  try {
    let userId = null;
    let role = null;

    // Optional user resolution for previewing pending listings
    let token = req.cookies?.token;
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, env.jwtSecret);
        userId = decoded.sub;
        role = decoded.role;
      } catch {
        // Continue unauthenticated if token is invalid
      }
    }

    const data = await getPublicPGDetails(req.params.id, userId, role);
    return sendSuccess(res, 200, 'Accommodation details retrieved', data);
  } catch (error) {
    next(error);
  }
};
