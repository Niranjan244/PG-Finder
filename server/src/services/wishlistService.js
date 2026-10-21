import User from '../models/User.js';
import PG from '../models/PG.js';

export const toggleWishlist = async (userId, pgId) => {
  const pg = await PG.findById(pgId);
  if (!pg) {
    const error = new Error('Accommodation listing not found');
    error.statusCode = 404;
    throw error;
  }

  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  if (!user.wishlist) {
    user.wishlist = [];
  }

  const pgIdStr = pgId.toString();
  const isAlreadySaved = user.wishlist.some(
    (id) => id.toString() === pgIdStr
  );

  if (isAlreadySaved) {
    await User.findByIdAndUpdate(userId, {
      $pull: { wishlist: pgId },
    });
    return { isWishlisted: false, pgId: pgIdStr };
  } else {
    await User.findByIdAndUpdate(userId, {
      $addToSet: { wishlist: pgId },
    });
    return { isWishlisted: true, pgId: pgIdStr };
  }
};

export const getUserWishlist = async (userId, { page = 1, limit = 20 } = {}) => {
  const user = await User.findById(userId).populate({
    path: 'wishlist',
    populate: {
      path: 'owner',
      select: 'name email phone',
    },
  });

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const savedListings = (user.wishlist || []).filter(Boolean);
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.max(1, parseInt(limit, 10) || 20);
  const skip = (parsedPage - 1) * parsedLimit;

  const paginatedListings = savedListings.slice(skip, skip + parsedLimit);

  return {
    listings: paginatedListings,
    pagination: {
      total: savedListings.length,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(savedListings.length / parsedLimit) || 1,
    },
  };
};

export const getUserWishlistIds = async (userId) => {
  const user = await User.findById(userId).select('wishlist').lean();
  if (!user || !user.wishlist) return [];
  return user.wishlist.map((id) => id.toString());
};
