import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Booking from '../models/Booking.js';
import PG from '../models/PG.js';
import { createNotification } from './notificationService.js';

export const createOrUpdateReview = async ({ tenantId, pgId, rating, comment }) => {
  const pg = await PG.findById(pgId);
  if (!pg) {
    const error = new Error('Accommodation listing not found');
    error.statusCode = 404;
    throw error;
  }

  // 1. Verify that tenant has at least ONE approved booking for this PG
  const approvedBooking = await Booking.findOne({
    tenant: tenantId,
    pg: pgId,
    status: 'approved',
  });

  if (!approvedBooking) {
    const error = new Error(
      'Review eligibility failed: Only tenants with an approved booking can review this accommodation.'
    );
    error.statusCode = 403;
    throw error;
  }

  // 2. Validate rating and comment
  const numericRating = Number(rating);
  if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
    const error = new Error('Rating must be a number between 1 and 5 stars');
    error.statusCode = 400;
    throw error;
  }

  if (!comment || comment.trim().length < 5) {
    const error = new Error('Review comment must be at least 5 characters long');
    error.statusCode = 400;
    throw error;
  }

  // 3. Upsert review (enforces single review per tenant per PG)
  const isExisting = await Review.findOne({ pg: pgId, tenant: tenantId });

  const review = await Review.findOneAndUpdate(
    { pg: pgId, tenant: tenantId },
    {
      $set: {
        rating: numericRating,
        comment: comment.trim(),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).populate('tenant', 'name');

  // 4. Recalculate average rating & review count using MongoDB aggregation pipeline
  const stats = await Review.aggregate([
    { $match: { pg: new mongoose.Types.ObjectId(pgId) } },
    {
      $group: {
        _id: '$pg',
        avgRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  const averageRating = stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0;
  const reviewCount = stats.length > 0 ? stats[0].totalReviews : 0;

  await PG.findByIdAndUpdate(pgId, {
    averageRating,
    reviewCount,
  });

  // 5. Notify PG owner about the feedback
  const ownerId = pg.owner?._id || pg.owner;
  if (ownerId && ownerId.toString() !== tenantId.toString()) {
    createNotification({
      recipient: ownerId,
      sender: tenantId,
      type: 'new_review',
      title: 'New Review Received',
      message: `${review.tenant?.name || 'A resident'} left a ${numericRating}-star review on "${pg.title}".`,
      data: {
        pgId: pg._id.toString(),
        reviewId: review._id.toString(),
        rating: numericRating,
      },
    }).catch(() => {});
  }

  return {
    review,
    averageRating,
    reviewCount,
    isUpdated: Boolean(isExisting),
  };
};

export const getPGReviews = async (pgId, { page = 1, limit = 20 } = {}) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.max(1, Math.min(50, parseInt(limit, 10) || 20));
  const skip = (parsedPage - 1) * parsedLimit;

  const [reviews, total] = await Promise.all([
    Review.find({ pg: pgId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit)
      .populate('tenant', 'name')
      .lean(),
    Review.countDocuments({ pg: pgId }),
  ]);

  return {
    reviews,
    pagination: {
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit) || 1,
    },
  };
};

export const checkTenantReviewEligibility = async (tenantId, pgId) => {
  const [approvedBooking, existingReview] = await Promise.all([
    Booking.findOne({
      tenant: tenantId,
      pg: pgId,
      status: 'approved',
    }).select('_id status moveInDate'),
    Review.findOne({
      tenant: tenantId,
      pg: pgId,
    }).populate('tenant', 'name'),
  ]);

  return {
    canReview: Boolean(approvedBooking),
    existingReview,
  };
};
