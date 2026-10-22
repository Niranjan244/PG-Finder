import PG from '../models/PG.js';
import Room from '../models/Room.js';
import { getRoomsByPGIds, calculateRoomMetrics } from './roomService.js';

const getGeoSortStage = (effectiveSort) => {
  if (effectiveSort === 'rent_asc') return { $sort: { 'rentRange.minRent': 1 } };
  if (effectiveSort === 'rent_desc') return { $sort: { 'rentRange.maxRent': -1 } };
  if (effectiveSort === 'rating_desc') return { $sort: { averageRating: -1, createdAt: -1 } };
  if (effectiveSort === 'newest') return { $sort: { createdAt: -1 } };
  return null;
};

const buildPaginationFacetStage = (skipCount, limitCount) => ({
  $facet: {
    metadata: [{ $count: 'total' }],
    data: [
      { $skip: skipCount },
      { $limit: limitCount },
      {
        $lookup: {
          from: 'users',
          localField: 'owner',
          foreignField: '_id',
          as: 'owner',
        },
      },
      {
        $unwind: {
          path: '$owner',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          'owner.password': 0,
          'owner.__v': 0,
        },
      },
    ],
  },
});

export const searchApprovedPGs = async (queryParams) => {
  const {
    q,
    city,
    area,
    genderPreference,
    minRent,
    maxRent,
    roomType,
    amenities,
    swLat,
    swLng,
    neLat,
    neLng,
    lat,
    lng,
    radius = 10,
    sort,
    page = 1,
    limit = 12,
  } = queryParams;

  // Base query: strictly approved listings only
  const filter = {
    status: 'approved',
  };

  // Text search or keyword query across property fields
  const searchKeyword = (q || queryParams.keyword || '').trim();
  if (searchKeyword) {
    const sanitizedQ = searchKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { title: { $regex: sanitizedQ, $options: 'i' } },
      { area: { $regex: sanitizedQ, $options: 'i' } },
      { city: { $regex: sanitizedQ, $options: 'i' } },
      { address: { $regex: sanitizedQ, $options: 'i' } },
      { description: { $regex: sanitizedQ, $options: 'i' } },
    ];
  }

  // Location filters
  if (city && city.trim()) {
    filter.city = { $regex: `^${city.trim()}$`, $options: 'i' };
  }

  if (area && area.trim()) {
    filter.area = { $regex: area.trim(), $options: 'i' };
  }

  // Gender category filter
  if (genderPreference && ['boys', 'girls', 'coliving'].includes(genderPreference)) {
    filter.genderPreference = genderPreference;
  }

  // Budget range filter
  const parsedMinRent = minRent !== undefined && minRent !== '' ? parseFloat(minRent) : null;
  const parsedMaxRent = maxRent !== undefined && maxRent !== '' ? parseFloat(maxRent) : null;

  if (parsedMinRent !== null && parsedMaxRent !== null) {
    filter['rentRange.minRent'] = { $lte: parsedMaxRent };
    filter['rentRange.maxRent'] = { $gte: parsedMinRent };
  } else if (parsedMinRent !== null) {
    filter['rentRange.maxRent'] = { $gte: parsedMinRent };
  } else if (parsedMaxRent !== null) {
    filter['rentRange.minRent'] = { $lte: parsedMaxRent };
  }

  // Room type filter via Room collection lookup
  if (roomType) {
    const types = Array.isArray(roomType) ? roomType : roomType.split(',').map((t) => t.trim());
    const matchingPGIds = await Room.distinct('pg', { roomType: { $in: types } });
    filter._id = { $in: matchingPGIds };
  }

  // Amenities filter
  if (amenities) {
    const amenityList = Array.isArray(amenities)
      ? amenities
      : amenities.split(',').map((a) => a.trim()).filter(Boolean);

    if (amenityList.length > 0) {
      filter.amenities = { $all: amenityList };
    }
  }

  // Pagination parameters
  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
  const skip = (pageNumber - 1) * pageSize;

  // Check if Geospatial Proximity (Near Me) Search is requested
  const parsedLat = lat !== undefined && lat !== '' ? parseFloat(lat) : NaN;
  const parsedLng = lng !== undefined && lng !== '' ? parseFloat(lng) : NaN;
  const isGeoSearch = !isNaN(parsedLat) && !isNaN(parsedLng);

  let total = 0;
  let rawListings = [];

  let isFallbackToNearest = false;

  if (isGeoSearch) {
    const radiusKm = Math.min(100, Math.max(1, parseFloat(radius) || 10));
    const maxDistanceMeters = radiusKm * 1000;

    // Build $geoNear aggregation pipeline
    // NOTE: $geoNear MUST be the very first stage of the aggregation pipeline
    const pipeline = [
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [parsedLng, parsedLat], // GeoJSON [longitude, latitude]
          },
          distanceField: 'distanceMeters',
          maxDistance: maxDistanceMeters,
          spherical: true,
          query: filter,
        },
      },
    ];

    // Sorting overrides (default when lat/lng is provided is nearest first from $geoNear)
    const effectiveSort = sort || 'nearest';
    const sortStage = getGeoSortStage(effectiveSort);
    if (sortStage) {
      pipeline.push(sortStage);
    }
    // Note: if effectiveSort === 'nearest', $geoNear already orders by distance ascending!

    // Facet for pagination and population
    pipeline.push(buildPaginationFacetStage(skip, pageSize));

    const facetResults = await PG.aggregate(pipeline);
    const facetData = facetResults[0] || {};
    total = facetData.metadata?.[0]?.total || 0;
    rawListings = facetData.data || [];

    // Fallback: If 0 accommodations match within strict radius, query closest available PGs
    if (total === 0) {
      const fallbackPipeline = [
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [parsedLng, parsedLat],
            },
            distanceField: 'distanceMeters',
            spherical: true,
            query: filter,
          },
        },
      ];

      if (sortStage) {
        fallbackPipeline.push(sortStage);
      }

      fallbackPipeline.push(buildPaginationFacetStage(skip, pageSize));

      const fallbackResults = await PG.aggregate(fallbackPipeline);
      const fallbackData = fallbackResults[0] || {};
      const fallbackTotal = fallbackData.metadata?.[0]?.total || 0;
      if (fallbackTotal > 0) {
        total = fallbackTotal;
        rawListings = fallbackData.data || [];
        isFallbackToNearest = true;
      }
    }
  } else {
    // Non-geospatial Bounding box map search (Search in this area)
    if (
      swLat !== undefined &&
      swLng !== undefined &&
      neLat !== undefined &&
      neLng !== undefined
    ) {
      const parsedSwLat = parseFloat(swLat);
      const parsedSwLng = parseFloat(swLng);
      const parsedNeLat = parseFloat(neLat);
      const parsedNeLng = parseFloat(neLng);

      if (
        !isNaN(parsedSwLat) &&
        !isNaN(parsedSwLng) &&
        !isNaN(parsedNeLat) &&
        !isNaN(parsedNeLng)
      ) {
        filter.location = {
          $geoWithin: {
            $box: [
              [parsedSwLng, parsedSwLat], // Bottom-left coordinate [longitude, latitude]
              [parsedNeLng, parsedNeLat], // Top-right coordinate [longitude, latitude]
            ],
          },
        };
      }
    }

    // Standard sorting criteria
    let sortCriteria = { createdAt: -1 };
    if (sort === 'rent_asc') {
      sortCriteria = { 'rentRange.minRent': 1 };
    } else if (sort === 'rent_desc') {
      sortCriteria = { 'rentRange.maxRent': -1 };
    } else if (sort === 'rating_desc') {
      sortCriteria = { averageRating: -1, createdAt: -1 };
    }

    const [count, results] = await Promise.all([
      PG.countDocuments(filter),
      PG.find(filter)
        .sort(sortCriteria)
        .skip(skip)
        .limit(pageSize)
        .populate('owner', 'name phone'),
    ]);

    total = count;
    rawListings = results.map((listing) => listing.toObject());
  }

  // Attach live room and bed availability summaries, plus human-readable distanceKm
  const roomsByPG = await getRoomsByPGIds(rawListings.map((pg) => pg._id));

  const enrichedListings = rawListings.map((pg) => {
    const rooms = roomsByPG.get(pg._id.toString()) || [];
    const metrics = calculateRoomMetrics(rooms);

    const distanceKm =
      pg.distanceMeters !== undefined && pg.distanceMeters !== null
        ? Number((pg.distanceMeters / 1000).toFixed(1))
        : null;

    return {
      ...pg,
      distanceKm,
      distanceMeters: pg.distanceMeters ?? null,
      roomSummary: {
        totalRooms: metrics.totalRooms,
        totalBeds: metrics.totalBeds,
        occupiedBeds: metrics.occupiedBeds,
        availableBeds: metrics.availableBeds,
        isFull: metrics.isFull,
      },
    };
  });

  return {
    listings: enrichedListings,
    pagination: {
      total,
      page: pageNumber,
      limit: pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    },
    nearMe: isGeoSearch
      ? {
          userLat: parsedLat,
          userLng: parsedLng,
          radiusKm: Math.min(100, Math.max(1, parseFloat(radius) || 10)),
          isFallbackToNearest,
        }
      : null,
  };
};

export default searchApprovedPGs;
