import { z } from 'zod';

export const createPGSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, { message: 'Title must be at least 5 characters long' })
    .max(100, { message: 'Title cannot exceed 100 characters' }),
  description: z
    .string()
    .trim()
    .min(20, { message: 'Description must be at least 20 characters long' })
    .max(2000, { message: 'Description cannot exceed 2000 characters' }),
  address: z
    .string()
    .trim()
    .min(5, { message: 'Full street address is required' }),
  city: z
    .string()
    .trim()
    .min(2, { message: 'City is required' }),
  area: z
    .string()
    .trim()
    .min(2, { message: 'Locality or area is required' }),
  longitude: z
    .coerce
    .number()
    .min(-180, { message: 'Longitude must be between -180 and 180' })
    .max(180, { message: 'Longitude must be between -180 and 180' }),
  latitude: z
    .coerce
    .number()
    .min(-90, { message: 'Latitude must be between -90 and 90' })
    .max(90, { message: 'Latitude must be between -90 and 90' }),
  genderPreference: z.enum(['boys', 'girls', 'coliving'], {
    errorMap: () => ({ message: 'Gender preference must be boys, girls, or coliving' }),
  }),
  deposit: z
    .coerce
    .number()
    .min(0, { message: 'Security deposit cannot be negative' }),
  foodDetails: z
    .object({
      available: z.boolean().default(false),
      mealTypes: z.array(z.string()).default([]),
      isPureVeg: z.boolean().default(false),
    })
    .default({ available: false, mealTypes: [], isPureVeg: false }),
  wifi: z.boolean().default(false),
  amenities: z.array(z.string()).default([]),
  rules: z.array(z.string()).default([]),
  images: z
    .array(
      z.object({
        url: z.string().url({ message: 'Valid image URL is required' }),
        publicId: z.string().optional().default(''),
      })
    )
    .default([]),
});

export const updatePGSchema = createPGSchema.partial();

export const roomSchema = z.object({
  roomNumber: z.string().trim().optional().default(''),
  roomType: z.enum(['single', 'double', 'triple', 'four_sharing'], {
    errorMap: () => ({ message: 'Room type must be single, double, triple, or four_sharing' }),
  }),
  rent: z
    .coerce
    .number()
    .min(0, { message: 'Rent cannot be negative' }),
  totalBeds: z
    .coerce
    .number()
    .int()
    .min(1, { message: 'Room must have at least 1 bed' }),
  occupiedBeds: z
    .coerce
    .number()
    .int()
    .min(0, { message: 'Occupied beds cannot be negative' })
    .default(0),
}).refine((data) => data.occupiedBeds <= data.totalBeds, {
  message: 'Occupied beds cannot exceed total beds',
  path: ['occupiedBeds'],
});

export const searchPGQuerySchema = z.object({
  q: z.string().optional(),
  keyword: z.string().optional(),
  city: z.string().optional(),
  area: z.string().optional(),
  genderPreference: z.enum(['boys', 'girls', 'coliving']).optional(),
  minRent: z.coerce.number().min(0, 'Minimum rent cannot be negative').optional(),
  maxRent: z.coerce.number().min(0, 'Maximum rent cannot be negative').optional(),
  roomType: z.string().optional(),
  amenities: z.union([z.string(), z.array(z.string())]).optional(),
  swLat: z.coerce.number().min(-90).max(90).optional(),
  swLng: z.coerce.number().min(-180).max(180).optional(),
  neLat: z.coerce.number().min(-90).max(90).optional(),
  neLng: z.coerce.number().min(-180).max(180).optional(),
  lat: z
    .coerce
    .number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90')
    .optional(),
  lng: z
    .coerce
    .number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180')
    .optional(),
  radius: z
    .coerce
    .number()
    .min(1, 'Radius must be at least 1 km')
    .max(100, 'Radius cannot exceed 100 km')
    .default(10)
    .optional(),
  sort: z.enum(['nearest', 'newest', 'rent_asc', 'rent_desc', 'rating_desc']).optional(),
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(12).optional(),
});

export const geocodeQuerySchema = z.object({
  q: z.string().trim().min(2, 'Query must be at least 2 characters long'),
});

