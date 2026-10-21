import { Router } from 'express';
import { authenticateUser, authorizeRoles } from '../middleware/auth.js';
import { sendSuccess } from '../utils/apiResponse.js';

const router = Router();

router.get('/tenant', authenticateUser, authorizeRoles('tenant'), (req, res) => {
  return sendSuccess(res, 200, 'Tenant dashboard access granted', {
    role: req.user.role,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
    },
    message: 'Welcome to your tenant portal. Active bookings and saved properties will be managed here.',
  });
});

router.get('/owner', authenticateUser, authorizeRoles('owner'), (req, res) => {
  return sendSuccess(res, 200, 'Owner dashboard access granted', {
    role: req.user.role,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
    },
    message: 'Welcome to your property management portal. PG listings and tenant requests will appear here.',
  });
});

router.get('/admin', authenticateUser, authorizeRoles('admin'), (req, res) => {
  return sendSuccess(res, 200, 'Administrator dashboard access granted', {
    role: req.user.role,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
    },
    message: 'Welcome to the platform admin control center.',
  });
});

export default router;
