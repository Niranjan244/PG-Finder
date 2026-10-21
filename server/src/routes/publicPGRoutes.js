import { Router } from 'express';
import { getPublicPG } from '../controllers/publicPGController.js';
import { searchListings, geocodeLocation, reverseGeocodeLocation } from '../controllers/pgSearchController.js';
import { validateQuery } from '../middleware/validateRequest.js';
import { searchPGQuerySchema, geocodeQuerySchema } from '../validators/pgValidators.js';

const router = Router();

// Geocoding proxy endpoint for area/landmark suggestions
router.get('/geocode', validateQuery(geocodeQuerySchema), geocodeLocation);

// Reverse geocoding endpoint to convert coordinates into human-readable area & city
router.get('/reverse-geocode', reverseGeocodeLocation);

// Full text search, filter, proximity (Near Me), and map bounds endpoint
router.get('/search', validateQuery(searchPGQuerySchema), searchListings);

// Individual property details
router.get('/:id', getPublicPG);

export default router;
