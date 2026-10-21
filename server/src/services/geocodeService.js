// Geocoding service proxying OpenStreetMap Nominatim with caching and rate limiting

const cache = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

let lastRequestTime = 0;
const MIN_INTERVAL_MS = 1000; // Respect Nominatim policy (max 1 req/sec)

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const pruneStaleCache = (maxSize = 200) => {
  if (cache.size > maxSize) {
    const currentTime = Date.now();
    for (const [key, value] of cache.entries()) {
      if (currentTime > value.expiresAt) {
        cache.delete(key);
      }
    }
  }
};

export const geocodeQuery = async (query) => {
  if (!query || typeof query !== 'string' || query.trim().length < 2) {
    return [];
  }

  const sanitized = query.trim().toLowerCase();

  // 1. Check in-memory cache
  const cached = cache.get(sanitized);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  // 2. Enforce minimum request interval (1 request/second rate-limit)
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_INTERVAL_MS) {
    await sleep(MIN_INTERVAL_MS - elapsed);
  }
  lastRequestTime = Date.now();

  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', query.trim());
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '5');
    url.searchParams.set('countrycodes', 'in'); // Focus on India for PG discovery
    url.searchParams.set('addressdetails', '1');

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'PGFinder-Platform/1.0.0 (contact: support@pgfinder.local)',
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`Nominatim geocoding responded with status ${response.status}`);
      return [];
    }

    const rawData = await response.json();
    if (!Array.isArray(rawData)) {
      return [];
    }

    const suggestions = rawData.map((item) => ({
      placeId: item.place_id,
      displayName: item.display_name,
      name: item.name || item.display_name.split(',')[0],
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      type: item.type,
    }));

    // Cache results
    cache.set(sanitized, {
      data: suggestions,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    pruneStaleCache();

    return suggestions;
  } catch (error) {
    console.error('Geocoding service error:', error.message);
    return [];
  }
};

export const reverseGeocodeCoords = async (lat, lng) => {
  const parsedLat = parseFloat(lat);
  const parsedLng = parseFloat(lng);
  if (isNaN(parsedLat) || isNaN(parsedLng)) {
    return null;
  }

  const cacheKey = `rev_${parsedLat.toFixed(4)}_${parsedLng.toFixed(4)}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_INTERVAL_MS) {
    await sleep(MIN_INTERVAL_MS - elapsed);
  }
  lastRequestTime = Date.now();

  try {
    const url = new URL('https://nominatim.openstreetmap.org/reverse');
    url.searchParams.set('lat', String(parsedLat));
    url.searchParams.set('lon', String(parsedLng));
    url.searchParams.set('format', 'json');
    url.searchParams.set('addressdetails', '1');

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'PGFinder-Platform/1.0.0 (contact: support@pgfinder.local)',
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`Nominatim reverse geocoding responded with status ${response.status}`);
      return null;
    }

    const data = await response.json();
    if (!data || !data.address) {
      return null;
    }

    const addr = data.address;
    const locality =
      addr.suburb ||
      addr.neighbourhood ||
      addr.residential ||
      addr.village ||
      addr.subdistrict ||
      addr.road ||
      '';
    const city =
      addr.city ||
      addr.town ||
      addr.municipality ||
      addr.state_district ||
      addr.county ||
      '';
    const state = addr.state || '';

    let placeName = '';
    if (locality && city && locality !== city) {
      placeName = `${locality}, ${city}`;
    } else if (locality) {
      placeName = locality;
    } else if (city) {
      placeName = city;
    } else if (state) {
      placeName = state;
    } else {
      placeName = data.name || data.display_name?.split(',')[0] || 'Current Location';
    }

    const result = {
      placeName,
      displayName: data.display_name,
      address: addr,
      lat: parsedLat,
      lng: parsedLng,
    };

    cache.set(cacheKey, {
      data: result,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    pruneStaleCache();

    return result;
  } catch (error) {
    console.error('Reverse geocoding error:', error.message);
    return null;
  }
};

