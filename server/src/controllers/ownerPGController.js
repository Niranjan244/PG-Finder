import {
  createOwnerPG,
  getOwnerPGs,
  getOwnerPGById,
  updateOwnerPG,
  deleteOwnerPG,
} from '../services/pgService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const createListing = async (req, res, next) => {
  try {
    const pg = await createOwnerPG(req.user._id, req.body);
    return sendSuccess(res, 201, 'Accommodation listing created and submitted for verification', { pg });
  } catch (error) {
    next(error);
  }
};

export const listMyListings = async (req, res, next) => {
  try {
    const listings = await getOwnerPGs(req.user._id);
    return sendSuccess(res, 200, 'Owner accommodation listings retrieved', { listings });
  } catch (error) {
    next(error);
  }
};

export const getMyListingById = async (req, res, next) => {
  try {
    const data = await getOwnerPGById(req.user._id, req.params.id, req.user.role);
    return sendSuccess(res, 200, 'Listing details retrieved', data);
  } catch (error) {
    next(error);
  }
};

export const updateListing = async (req, res, next) => {
  try {
    const pg = await updateOwnerPG(req.user._id, req.params.id, req.body, req.user.role);
    return sendSuccess(res, 200, 'Accommodation listing updated and set to pending for re-verification', { pg });
  } catch (error) {
    next(error);
  }
};

export const deleteListing = async (req, res, next) => {
  try {
    const result = await deleteOwnerPG(req.user._id, req.params.id, req.user.role);
    return sendSuccess(res, 200, 'Accommodation listing and associated rooms permanently deleted', result);
  } catch (error) {
    next(error);
  }
};
