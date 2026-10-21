import mongoose from 'mongoose';
import { connectDatabase, closeDatabase } from './src/config/db.js';
import PG from './src/models/PG.js';
import Room from './src/models/Room.js';
import User from './src/models/User.js';
import { searchApprovedPGs } from './src/services/pgSearchService.js';

const runPhase4Tests = async () => {
  console.log('Connecting to database...');
  await connectDatabase();

  console.log('Synchronizing indexes...');
  await PG.syncIndexes();
  await Room.syncIndexes();

  // Find or create a test owner user
  let owner = await User.findOne({ role: 'owner' });
  if (!owner) {
    owner = await User.create({
      name: 'Phase4 Test Owner',
      email: 'phase4_test_owner@example.com',
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
      phone: '9876543210',
      role: 'owner',
    });
  }

  // Cleanup any leftover test data from previous runs
  await PG.deleteMany({ title: /^Phase4_Test_/ });
  console.log('Cleaned up previous test records.');

  let approvedPG = null;
  let pendingPG = null;
  let singleRoom = null;
  let doubleRoom = null;

  try {
    // 1. Create Approved PG with Room
    approvedPG = await PG.create({
      owner: owner._id,
      title: 'Phase4_Test_GreenVilla',
      description: 'A spacious and peaceful luxury accommodation in Koramangala with all modern amenities.',
      address: '100 Feet Rd, 4th Block',
      city: 'Bangalore',
      area: 'Koramangala',
      location: {
        type: 'Point',
        coordinates: [77.6245, 12.9352],
      },
      genderPreference: 'girls',
      deposit: 15000,
      wifi: true,
      amenities: ['High-Speed Wi-Fi', 'Air Conditioning', 'CCTV Surveillance'],
      status: 'approved',
      rentRange: { minRent: 12000, maxRent: 14000 },
      averageRating: 4.5,
    });

    singleRoom = await Room.create({
      pg: approvedPG._id,
      roomNumber: 'G-101',
      roomType: 'single',
      rent: 12000,
      deposit: 15000,
      totalBeds: 1,
      occupiedBeds: 0,
    });

    // 2. Create Pending (Unapproved) PG with Room
    pendingPG = await PG.create({
      owner: owner._id,
      title: 'Phase4_Test_BlueHeights_Pending',
      description: 'Under verification PG accommodation located in Indiranagar.',
      address: '12th Main Rd',
      city: 'Bangalore',
      area: 'Indiranagar',
      location: {
        type: 'Point',
        coordinates: [77.6412, 12.9719],
      },
      genderPreference: 'boys',
      deposit: 10000,
      wifi: false,
      amenities: ['Power Backup'],
      status: 'pending',
      rentRange: { minRent: 8000, maxRent: 8000 },
    });

    doubleRoom = await Room.create({
      pg: pendingPG._id,
      roomNumber: 'B-201',
      roomType: 'double',
      rent: 8000,
      deposit: 10000,
      totalBeds: 2,
      occupiedBeds: 0,
    });

    console.log('Seeded test properties: 1 approved, 1 pending.');

    // --- TEST 1: Pending listing strictly hidden ---
    console.log('\n[Test 1] Verifying pending listings are hidden from public search...');
    const res1 = await searchApprovedPGs({});
    const hasPending = res1.listings.some((p) => p.title.includes('Pending'));
    const hasApproved = res1.listings.some((p) => p._id.toString() === approvedPG._id.toString());
    if (hasPending) throw new Error('FAIL: Pending unapproved listing leaked into search results!');
    if (!hasApproved) throw new Error('FAIL: Approved test listing was not found in base search!');
    console.log('PASS: Only approved listings are exposed; pending listing strictly hidden.');

    // --- TEST 2: Keyword / Text Search ---
    console.log('\n[Test 2] Keyword search for "GreenVilla"...');
    const res2 = await searchApprovedPGs({ q: 'GreenVilla' });
    const match2 = res2.listings.find((p) => p._id.toString() === approvedPG._id.toString());
    if (!match2) throw new Error('FAIL: Keyword search failed to match title');
    console.log(`PASS: Keyword search matched title (Found ${res2.listings.length} results).`);

    // --- TEST 3: Locality Search ---
    console.log('\n[Test 3] Locality filter for "Koramangala"...');
    const res3 = await searchApprovedPGs({ area: 'Koramangala' });
    const match3 = res3.listings.find((p) => p._id.toString() === approvedPG._id.toString());
    if (!match3) throw new Error('FAIL: Locality filter failed to match');
    console.log('PASS: Locality filter matched correctly.');

    // --- TEST 4: City Search (positive and negative) ---
    console.log('\n[Test 4] City matching and exclusion...');
    const res4Bangalore = await searchApprovedPGs({ city: 'Bangalore' });
    const match4 = res4Bangalore.listings.find((p) => p._id.toString() === approvedPG._id.toString());
    if (!match4) throw new Error('FAIL: City filter for Bangalore did not match');

    const res4Mumbai = await searchApprovedPGs({ city: 'Mumbai' });
    const match4M = res4Mumbai.listings.find((p) => p._id.toString() === approvedPG._id.toString());
    if (match4M) throw new Error('FAIL: City filter for Mumbai improperly matched Bangalore property');
    console.log('PASS: City matching and exclusion verified.');

    // --- TEST 5: Gender Preference Filter ---
    console.log('\n[Test 5] Gender filter ("girls" vs "boys")...');
    const res5Girls = await searchApprovedPGs({ genderPreference: 'girls' });
    const match5G = res5Girls.listings.find((p) => p._id.toString() === approvedPG._id.toString());
    if (!match5G) throw new Error('FAIL: Gender filter "girls" did not match');

    const res5Boys = await searchApprovedPGs({ genderPreference: 'boys' });
    const match5B = res5Boys.listings.find((p) => p._id.toString() === approvedPG._id.toString());
    if (match5B) throw new Error('FAIL: Gender filter "boys" incorrectly matched a girls PG');
    console.log('PASS: Gender filter verified.');

    // --- TEST 6: Budget Range Filter ---
    console.log('\n[Test 6] Budget range filtering...');
    const res6InRange = await searchApprovedPGs({ minRent: 10000, maxRent: 15000 });
    const match6In = res6InRange.listings.find((p) => p._id.toString() === approvedPG._id.toString());
    if (!match6In) throw new Error('FAIL: Budget range 10000-15000 did not match PG with rent 12000-14000');

    const res6OutOfRange = await searchApprovedPGs({ minRent: 15000, maxRent: 20000 });
    const match6Out = res6OutOfRange.listings.find((p) => p._id.toString() === approvedPG._id.toString());
    if (match6Out) throw new Error('FAIL: Budget range 15000-20000 incorrectly matched PG with maxRent 14000');
    console.log('PASS: Budget range filter verified.');

    // --- TEST 7: Room Type Filter (Single occupancy) ---
    console.log('\n[Test 7] Room type filter via Room collection...');
    const res7Single = await searchApprovedPGs({ roomType: 'single' });
    const match7S = res7Single.listings.find((p) => p._id.toString() === approvedPG._id.toString());
    if (!match7S) throw new Error('FAIL: Room type "single" did not match');

    const res7Triple = await searchApprovedPGs({ roomType: 'triple' });
    const match7T = res7Triple.listings.find((p) => p._id.toString() === approvedPG._id.toString());
    if (match7T) throw new Error('FAIL: Room type "triple" incorrectly matched');
    console.log('PASS: Room type filtering across Room schema verified.');

    // --- TEST 8: Amenities Filter ---
    console.log('\n[Test 8] Amenities filter ($all match)...');
    const res8Match = await searchApprovedPGs({ amenities: 'High-Speed Wi-Fi,Air Conditioning' });
    const match8 = res8Match.listings.find((p) => p._id.toString() === approvedPG._id.toString());
    if (!match8) throw new Error('FAIL: Amenities filter did not match');

    const res8Miss = await searchApprovedPGs({ amenities: 'Daily Housekeeping' });
    const match8Miss = res8Miss.listings.find((p) => p._id.toString() === approvedPG._id.toString());
    if (match8Miss) throw new Error('FAIL: Unmatched amenity returned listing');
    console.log('PASS: Amenities $all match verified.');

    // --- TEST 9: Geospatial Bounding Box ($geoWithin $box) ---
    console.log('\n[Test 9] Map bounding box search ($geoWithin: $box)...');
    // Koramangala coordinates: [77.6245, 12.9352]
    // Bounding box encompassing Koramangala: SW [77.60, 12.90], NE [77.65, 12.96]
    const res9InBox = await searchApprovedPGs({
      swLat: 12.90,
      swLng: 77.60,
      neLat: 12.96,
      neLng: 77.65,
    });
    const match9In = res9InBox.listings.find((p) => p._id.toString() === approvedPG._id.toString());
    if (!match9In) throw new Error('FAIL: Geospatial bounding box did not capture PG inside coordinates');

    // Bounding box outside Koramangala (e.g. Mumbai):
    const res9OutBox = await searchApprovedPGs({
      swLat: 18.90,
      swLng: 72.80,
      neLat: 19.10,
      neLng: 72.95,
    });
    const match9Out = res9OutBox.listings.find((p) => p._id.toString() === approvedPG._id.toString());
    if (match9Out) throw new Error('FAIL: PG returned inside out-of-bounds geographic box');
    console.log('PASS: Geospatial $geoWithin $box query verified.');

    // --- TEST 10: Bed vacancy aggregation ---
    console.log('\n[Test 10] Real-time bed vacancy aggregation...');
    const foundPG = res1.listings.find((p) => p._id.toString() === approvedPG._id.toString());
    if (!foundPG.roomSummary) throw new Error('FAIL: roomSummary was not attached');
    if (foundPG.roomSummary.totalBeds !== 1 || foundPG.roomSummary.availableBeds !== 1 || foundPG.roomSummary.isFull !== false) {
      throw new Error(`FAIL: Unexpected bed summary: ${JSON.stringify(foundPG.roomSummary)}`);
    }
    console.log('PASS: Bed occupancy summary calculation verified:', foundPG.roomSummary);

    console.log('\nALL 10 PHASE 4 INTEGRATION TESTS PASSED SUCCESSFULLY.');
  } finally {
    // Clean up test data
    console.log('\nCleaning up test properties and rooms...');
    if (approvedPG) {
      await Room.deleteMany({ pg: approvedPG._id });
      await PG.findByIdAndDelete(approvedPG._id);
    }
    if (pendingPG) {
      await Room.deleteMany({ pg: pendingPG._id });
      await PG.findByIdAndDelete(pendingPG._id);
    }
    await closeDatabase();
    console.log('Database disconnected.');
  }
};

runPhase4Tests().catch((err) => {
  console.error('\nTEST FAILED WITH ERROR:', err);
  process.exit(1);
});
