import { connectDatabase } from '../src/config/db.js';
import { searchApprovedPGs } from '../src/services/pgSearchService.js';
import { geocodeQuery } from '../src/services/geocodeService.js';
import PG from '../src/models/PG.js';
import User from '../src/models/User.js';

async function runTests() {
  console.log('--- STARTING PHASE 8 NEAR-ME AUTOMATED VERIFICATION ---\n');
  await connectDatabase();

  let passed = 0;
  let total = 0;

  const assert = (condition, description) => {
    total++;
    if (condition) {
      console.log(`[PASS] ${description}`);
      passed++;
    } else {
      console.error(`[FAIL] ${description}`);
    }
  };

  // Test 1: Near Me search at Koramangala (12.9352, 77.6245) with 5km radius
  console.log('\n[1] Testing Proximity Search (5 km radius around Koramangala)...');
  const res5km = await searchApprovedPGs({
    lat: 12.9352,
    lng: 77.6245,
    radius: 5,
  });

  assert(res5km.listings.length > 0, 'Returns listings within 5 km');
  assert(res5km.listings[0].distanceKm !== undefined, 'Listings have distanceKm calculated');
  assert(res5km.listings[0].distanceKm <= 1.0, 'First listing is closest (Sri Sai Balaji at ~0 km)');

  // Verify that Whitefield (~14.2 km) is NOT in the 5 km radius
  const whitefieldIn5km = res5km.listings.some((pg) => pg.area.toLowerCase() === 'whitefield');
  assert(!whitefieldIn5km, 'Whitefield PG (14.2 km away) is excluded from 5 km radius');

  console.log('5 km Listings Found:');
  res5km.listings.forEach((pg) => {
    console.log(`  * ${pg.title} (${pg.area}) - ${pg.distanceKm} km away`);
  });

  // Test 2: Expand radius to 20km
  console.log('\n[2] Testing Expanded Search (20 km radius around Koramangala)...');
  const res20km = await searchApprovedPGs({
    lat: 12.9352,
    lng: 77.6245,
    radius: 20,
  });

  assert(res20km.listings.length >= res5km.listings.length, '20 km radius returns equal or more listings than 5 km');
  const whitefieldIn20km = res20km.listings.some((pg) => pg.area.toLowerCase() === 'whitefield');
  assert(whitefieldIn20km, 'Whitefield PG (~14.2 km away) is now included in 20 km radius');

  // Test 3: Filters combined with Near-Me (genderPreference = 'boys')
  console.log('\n[3] Testing Combining Filters with Proximity Search...');
  const resBoysOnly = await searchApprovedPGs({
    lat: 12.9352,
    lng: 77.6245,
    radius: 20,
    genderPreference: 'boys',
  });

  const allBoys = resBoysOnly.listings.every((pg) => pg.genderPreference === 'boys');
  assert(allBoys, 'All results strictly match the genderPreference = boys filter');
  assert(resBoysOnly.listings.length > 0, 'Found boys PGs within proximity');

  // Test 4: Sorting by rent while maintaining distance calculations
  console.log('\n[4] Testing Custom Sorting with Near-Me...');
  const resSortedRent = await searchApprovedPGs({
    lat: 12.9352,
    lng: 77.6245,
    radius: 20,
    sort: 'rent_asc',
  });

  assert(resSortedRent.listings.length > 0, 'Returns listings for rent_asc sort');
  assert(resSortedRent.listings[0].distanceKm !== undefined, 'Listings still contain distanceKm even when sorted by rent');
  
  for (let i = 0; i < resSortedRent.listings.length - 1; i++) {
    const rentA = resSortedRent.listings[i].rentRange?.minRent || 0;
    const rentB = resSortedRent.listings[i + 1].rentRange?.minRent || 0;
    assert(rentA <= rentB, `Listing ${i} rent (₹${rentA}) <= Listing ${i + 1} rent (₹${rentB})`);
  }

  // Test 5: Geocoding Proxy Service
  console.log('\n[5] Testing Geocoding Service (OpenStreetMap Nominatim Proxy)...');
  const suggestions = await geocodeQuery('Koramangala Bangalore');
  assert(Array.isArray(suggestions), 'Geocode service returns an array of suggestions');
  assert(suggestions.length > 0, 'Found geocode suggestions for Koramangala');
  if (suggestions.length > 0) {
    const first = suggestions[0];
    assert(typeof first.lat === 'number' && typeof first.lng === 'number', 'Suggestions contain numeric lat and lng');
    assert(first.displayName.length > 0, 'Suggestions contain a readable displayName');
    console.log(`  * Sample Suggestion: ${first.displayName} (${first.lat}, ${first.lng})`);
  }

  // Test 6: Verify User Location is NEVER Stored in Database
  console.log('\n[6] Verifying Data Privacy (Zero User Location Persistence)...');
  const userSample = await User.findOne({}).lean();
  assert(userSample.userLocation === undefined, 'User document schema does not persist userLocation');
  assert(userSample.lastKnownLocation === undefined, 'User document schema does not track lastKnownLocation');

  // Test 7: Verify Near-Me search in Khammam (Rotary Nagar)
  console.log('\n[7] Testing Proximity Search in Khammam (Rotary Nagar: 17.2464, 80.1721)...');
  const khammamRes = await searchApprovedPGs({ lat: 17.2464, lng: 80.1721, radius: 5 });
  assert(khammamRes.listings.length >= 2, 'Khammam proximity returns Niranjan PG and Good PG');
  assert(khammamRes.nearMe?.isFallbackToNearest === false, 'Khammam PGs are within radius, not fallback');
  assert(khammamRes.listings[0].distanceKm < 1, 'Closest Khammam PG is less than 1 km away');

  // Test 8: Verify Automated Nearest Fallback from Remote Location (e.g. Hyderabad)
  console.log('\n[8] Testing Automated Nearest Fallback (Hyderabad: 17.3850, 78.4867)...');
  const hydRes = await searchApprovedPGs({ lat: 17.3850, lng: 78.4867, radius: 10 });
  assert(hydRes.listings.length > 0, 'Returns closest PGs rather than empty screen');
  assert(hydRes.nearMe?.isFallbackToNearest === true, 'Correctly flags isFallbackToNearest = true');
  assert(hydRes.listings[0].distanceKm < hydRes.listings[hydRes.listings.length - 1].distanceKm, 'Results are sorted nearest first');

  console.log(`\n--- ALL TESTS COMPLETED: ${passed}/${total} PASSED ---`);
  process.exit(passed === total ? 0 : 1);
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
