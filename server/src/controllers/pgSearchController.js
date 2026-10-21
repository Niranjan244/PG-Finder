import { searchApprovedPGs } from '../services/pgSearchService.js';
import { geocodeQuery, reverseGeocodeCoords } from '../services/geocodeService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const searchListings = async (req, res, next) => {
  try {
    const result = await searchApprovedPGs(req.query);
    return sendSuccess(res, 200, 'Search results retrieved', result);
  } catch (error) {
    next(error);
  }
};

export const geocodeLocation = async (req, res, next) => {
  try {
    const { q } = req.query;
    const suggestions = await geocodeQuery(q);
    return sendSuccess(res, 200, 'Geocoding suggestions retrieved', { suggestions });
  } catch (error) {
    next(error);
  }
};

export const reverseGeocodeLocation = async (req, res, next) => {
  try {
    const { lat, lng } = req.query;
    const result = await reverseGeocodeCoords(lat, lng);
    return sendSuccess(res, 200, 'Reverse geocoding retrieved', result || { placeName: 'Current Location' });
  } catch (error) {
    next(error);
  }
};
