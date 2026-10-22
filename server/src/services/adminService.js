import PG from '../models/PG.js';
import Room from '../models/Room.js';
import User from '../models/User.js';
import Booking from '../models/Booking.js';
import { createNotification } from './notificationService.js';
import { getRoomsByPGIds, calculateRoomMetrics } from './roomService.js';

export const getAllPGsForAdmin = async (filters = {}) => {
  const query = {};
  if (filters.status) {
    query.status = filters.status;
  }

  const pgs = await PG.find(query)
    .sort({ createdAt: -1 })
    .populate('owner', 'name email phone');

  const roomsByPG = await getRoomsByPGIds(pgs.map((pg) => pg._id));

  return pgs.map((pg) => {
    const rooms = roomsByPG.get(pg._id.toString()) || [];
    const metrics = calculateRoomMetrics(rooms);

    return {
      ...pg.toObject(),
      roomCount: metrics.roomCount,
      totalBeds: metrics.totalBeds,
      availableBeds: metrics.availableBeds,
    };
  });
};

export const updatePGStatusByAdmin = async (pgId, status, rejectionReason = '') => {
  if (!['approved', 'pending', 'rejected'].includes(status)) {
    const error = new Error("Invalid status. Allowed values: 'approved', 'pending', 'rejected'");
    error.statusCode = 400;
    throw error;
  }

  const pg = await PG.findById(pgId);
  if (!pg) {
    const error = new Error('Accommodation listing not found');
    error.statusCode = 404;
    throw error;
  }

  pg.status = status;
  if (status === 'rejected') {
    pg.rejectionReason = rejectionReason || 'Listing did not satisfy platform verification criteria.';
  } else if (status === 'approved') {
    pg.rejectionReason = '';
  }
  await pg.save();

  if (status === 'approved' || status === 'rejected') {
    createNotification({
      recipient: pg.owner,
      type: status === 'approved' ? 'listing_approved' : 'listing_rejected',
      title: status === 'approved' ? 'Listing Approved' : 'Listing Status Update',
      message:
        status === 'approved'
          ? `Your accommodation listing "${pg.title}" has been approved and is now live!`
          : `Your accommodation listing "${pg.title}" was not approved. Reason: ${pg.rejectionReason}`,
      data: { pgId: pg._id.toString(), status, rejectionReason: pg.rejectionReason },
    }).catch(() => {});
  }

  return pg;
};

export const deletePGByAdmin = async (pgId) => {
  const pg = await PG.findById(pgId);
  if (!pg) {
    const error = new Error('Accommodation listing not found');
    error.statusCode = 404;
    throw error;
  }

  // Remove associated rooms
  await Room.deleteMany({ pg: pgId });
  await PG.findByIdAndDelete(pgId);

  return { deletedId: pgId, title: pg.title };
};

export const getAllUsersForAdmin = async ({ search = '', role = '', page = 1, limit = 20 } = {}) => {
  const query = {};

  if (role && ['tenant', 'owner', 'admin'].includes(role)) {
    query.role = role;
  }

  if (search && search.trim()) {
    const sanitizedSearch = search.trim();
    query.$or = [
      { name: { $regex: sanitizedSearch, $options: 'i' } },
      { email: { $regex: sanitizedSearch, $options: 'i' } },
      { phone: { $regex: sanitizedSearch, $options: 'i' } },
    ];
  }

  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const skip = (parsedPage - 1) * parsedLimit;

  const [users, total] = await Promise.all([
    User.find(query)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit)
      .lean(),
    User.countDocuments(query),
  ]);

  return {
    users,
    pagination: {
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit) || 1,
    },
  };
};

export const toggleUserBlockByAdmin = async (userId, adminUserId) => {
  if (userId.toString() === adminUserId.toString()) {
    const error = new Error('Security violation: Administrators cannot block their own account');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  user.isBlocked = !user.isBlocked;
  await user.save();

  return {
    userId: user._id,
    name: user.name,
    email: user.email,
    isBlocked: user.isBlocked,
  };
};

export const getAdminPlatformStats = async () => {
  const [totalUsers, totalPGs, pendingPGs, approvedPGs, totalBookings] = await Promise.all([
    User.countDocuments(),
    PG.countDocuments(),
    PG.countDocuments({ status: 'pending' }),
    PG.countDocuments({ status: 'approved' }),
    Booking.countDocuments(),
  ]);

  return {
    totalUsers,
    totalPGs,
    pendingPGs,
    approvedPGs,
    totalBookings,
  };
};
