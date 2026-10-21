import {
  toggleWishlist,
  getUserWishlist,
  getUserWishlistIds,
} from '../services/wishlistService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const toggleWishlistHandler = async (req, res, next) => {
  try {
    const { pgId } = req.params;
    const result = await toggleWishlist(req.user._id, pgId);
    const message = result.isWishlisted
      ? 'Accommodation added to your wishlist'
      : 'Accommodation removed from your wishlist';
    return sendSuccess(res, 200, message, result);
  } catch (error) {
    next(error);
  }
};

export const getMyWishlistHandler = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const data = await getUserWishlist(req.user._id, { page, limit });
    return sendSuccess(res, 200, 'Saved accommodations retrieved', data);
  } catch (error) {
    next(error);
  }
};

export const getMyWishlistIdsHandler = async (req, res, next) => {
  try {
    const ids = await getUserWishlistIds(req.user._id);
    return sendSuccess(res, 200, 'Wishlist IDs retrieved', { wishlistIds: ids });
  } catch (error) {
    next(error);
  }
};
