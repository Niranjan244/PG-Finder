import {
  getAllPGsForAdmin,
  updatePGStatusByAdmin,
  deletePGByAdmin,
  getAllUsersForAdmin,
  toggleUserBlockByAdmin,
  getAdminPlatformStats,
} from '../services/adminService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const listAllPGs = async (req, res, next) => {
  try {
    const pgs = await getAllPGsForAdmin(req.query);
    return sendSuccess(res, 200, 'Admin PG listings retrieved', { listings: pgs });
  } catch (error) {
    next(error);
  }
};

export const updatePGStatus = async (req, res, next) => {
  try {
    const { status, reason } = req.body;
    const pg = await updatePGStatusByAdmin(req.params.id, status, reason);
    return sendSuccess(res, 200, `Accommodation listing status updated to ${status}`, { pg });
  } catch (error) {
    next(error);
  }
};

export const deletePG = async (req, res, next) => {
  try {
    const result = await deletePGByAdmin(req.params.id);
    return sendSuccess(res, 200, `Accommodation listing "${result.title}" permanently removed`, result);
  } catch (error) {
    next(error);
  }
};

export const listAllUsers = async (req, res, next) => {
  try {
    const { search, role, page, limit } = req.query;
    const data = await getAllUsersForAdmin({ search, role, page, limit });
    return sendSuccess(res, 200, 'Platform users retrieved', data);
  } catch (error) {
    next(error);
  }
};

export const toggleUserBlock = async (req, res, next) => {
  try {
    const result = await toggleUserBlockByAdmin(req.params.id, req.user._id);
    const action = result.isBlocked ? 'blocked' : 'unblocked';
    return sendSuccess(res, 200, `User ${result.name} (${result.email}) has been ${action}`, result);
  } catch (error) {
    next(error);
  }
};

export const getPlatformStats = async (req, res, next) => {
  try {
    const stats = await getAdminPlatformStats();
    return sendSuccess(res, 200, 'Platform analytics retrieved', { stats });
  } catch (error) {
    next(error);
  }
};
