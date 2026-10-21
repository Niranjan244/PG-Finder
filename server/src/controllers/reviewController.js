import {
  createOrUpdateReview,
  getPGReviews,
  checkTenantReviewEligibility,
} from '../services/reviewService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const submitReviewHandler = async (req, res, next) => {
  try {
    const { pgId } = req.params;
    const { rating, comment } = req.body;

    const result = await createOrUpdateReview({
      tenantId: req.user._id,
      pgId,
      rating,
      comment,
    });

    const message = result.isUpdated
      ? 'Your review has been updated'
      : 'Review submitted successfully';

    return sendSuccess(res, 201, message, result);
  } catch (error) {
    next(error);
  }
};

export const getPGReviewsHandler = async (req, res, next) => {
  try {
    const { pgId } = req.params;
    const { page, limit } = req.query;

    const data = await getPGReviews(pgId, { page, limit });
    return sendSuccess(res, 200, 'Reviews retrieved', data);
  } catch (error) {
    next(error);
  }
};

export const checkEligibilityHandler = async (req, res, next) => {
  try {
    const { pgId } = req.params;
    const data = await checkTenantReviewEligibility(req.user._id, pgId);
    return sendSuccess(res, 200, 'Review eligibility evaluated', data);
  } catch (error) {
    next(error);
  }
};
