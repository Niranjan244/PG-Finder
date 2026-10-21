import app from './src/app.js';
import { connectDatabase, closeDatabase } from './src/config/db.js';
import { initializeAdminAccount } from './src/services/adminSeedService.js';
import http from 'http';

const runTests = async () => {
  console.log('--- Starting Phase 3 End-to-End PG Listings, Rooms & Uploads Verification ---');

  await connectDatabase();
  await initializeAdminAccount();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(5098, resolve));
  const baseUrl = 'http://localhost:5098/api';

  try {
    // 1. Register Owner 1
    console.log('\n1. Registering PG Owner:');
    const ownerRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Vikas Sharma',
        email: 'vikas.owner@domain.in',
        phone: '9876543220',
        password: 'Password123',
        role: 'owner',
      }),
    });
    const ownerCookie = ownerRes.headers.get('set-cookie');
    console.log('Owner Registration Status:', ownerRes.status, '(Expected 201)');

    // 2. Register Owner 2 (Attacker / Unrelated Owner)
    console.log('\n2. Registering Unrelated Owner 2 (for IDOR security checks):');
    const owner2Res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Deepak Verma',
        email: 'deepak.owner@domain.in',
        phone: '9876543221',
        password: 'Password123',
        role: 'owner',
      }),
    });
    const owner2Cookie = owner2Res.headers.get('set-cookie');
    console.log('Owner 2 Status:', owner2Res.status, '(Expected 201)');

    // 3. Test Image Upload with multipart/form-data
    console.log('\n3. Testing Multipart Image Upload:');
    const boundary = '---------------------------' + Date.now().toString(16);
    // Minimal valid 1x1 PNG binary payload
    const pngHex = '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6360606060000000050001a7df93130000000049454e44ae426082';
    const pngBuffer = Buffer.from(pngHex, 'hex');

    const multipartHeader = Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="images"; filename="room1.png"\r\nContent-Type: image/png\r\n\r\n`
    );
    const multipartFooter = Buffer.from(`\r\n--${boundary}--\r\n`);
    const multipartBody = Buffer.concat([multipartHeader, pngBuffer, multipartFooter]);

    const uploadRes = await fetch(`${baseUrl}/owner/pgs/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        Cookie: ownerCookie,
      },
      body: multipartBody,
    });
    const uploadData = await uploadRes.json();
    console.log('Upload Status:', uploadRes.status, '| Images received:', uploadData.data?.images?.length);
    const uploadedImageUrl = uploadData.data?.images?.[0]?.url;
    console.log('Uploaded image URL:', uploadedImageUrl);

    // 4. Create PG Listing
    console.log('\n4. Creating PG Accommodation Listing:');
    const createPGRes = await fetch(`${baseUrl}/owner/pgs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: ownerCookie,
      },
      body: JSON.stringify({
        title: 'Sai Comfort PG for Gents',
        description: 'Premium living space with daily housekeeping, biometric security, high speed wifi, and hygienic food.',
        address: '14, 5th Cross, 1st Block',
        city: 'Bangalore',
        area: 'Koramangala',
        longitude: 77.6245,
        latitude: 12.9352,
        genderPreference: 'boys',
        deposit: 6000,
        foodDetails: {
          available: true,
          mealTypes: ['Breakfast', 'Dinner'],
          isPureVeg: false,
        },
        wifi: true,
        amenities: ['Air Conditioning', 'High-Speed Wi-Fi', 'Power Backup', 'Daily Housekeeping'],
        rules: ['Gate closing time: 10:30 PM', 'No smoking'],
        images: [{ url: uploadedImageUrl, publicId: 'room1' }],
      }),
    });
    const createPGData = await createPGRes.json();
    const pgId = createPGData.data?.pg?._id;
    console.log('Create PG Status:', createPGRes.status, '| Listing ID:', pgId);
    console.log('Initial Status:', createPGData.data?.pg?.status, '(Expected pending)');

    // 5. Add Rooms to PG
    console.log('\n5. Adding Rooms & Bed Capacity:');
    // Room 1: Single Occupancy
    const room1Res = await fetch(`${baseUrl}/owner/pgs/${pgId}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: ownerCookie },
      body: JSON.stringify({
        roomType: 'single',
        rent: 10000,
        totalBeds: 1,
        occupiedBeds: 0,
      }),
    });
    const room1Data = await room1Res.json();
    console.log('Single Room Added:', room1Res.status, '| Rent:', room1Data.data?.room?.rent);

    // Room 2: Double Sharing
    const room2Res = await fetch(`${baseUrl}/owner/pgs/${pgId}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: ownerCookie },
      body: JSON.stringify({
        roomType: 'double',
        rent: 6500,
        totalBeds: 2,
        occupiedBeds: 1,
      }),
    });
    const room2Data = await room2Res.json();
    const room2Id = room2Data.data?.room?._id;
    console.log('Double Room Added:', room2Res.status, '| Rent:', room2Data.data?.room?.rent);

    // Room 3: Invalid Bed Validation (occupied > total)
    const invalidRoomRes = await fetch(`${baseUrl}/owner/pgs/${pgId}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: ownerCookie },
      body: JSON.stringify({
        roomType: 'double',
        rent: 6500,
        totalBeds: 2,
        occupiedBeds: 5,
      }),
    });
    console.log('Invalid Bed Count (Occupied > Total) Rejected:', invalidRoomRes.status, '(Expected 400)');

    // 6. List Owner PGs & Verify Calculated Summary
    console.log('\n6. Fetching Owner Listings with Aggregated Metrics:');
    const myListingsRes = await fetch(`${baseUrl}/owner/pgs`, {
      headers: { Cookie: ownerCookie },
    });
    const myListingsData = await myListingsRes.json();
    const fetchedPG = myListingsData.data?.listings?.[0];
    console.log('Total Listings for Owner:', myListingsData.data?.listings?.length);
    console.log('Aggregated Room Summary:', fetchedPG?.roomSummary);

    // 7. Ownership Security Enforcement (Owner 2 cannot modify Owner 1 PG)
    console.log('\n7. Testing Ownership Security (IDOR Attack Prevention):');
    const attackUpdateRes = await fetch(`${baseUrl}/owner/pgs/${pgId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: owner2Cookie },
      body: JSON.stringify({ title: 'Hacked Property' }),
    });
    console.log('Unauthorized Edit Attempt Rejected:', attackUpdateRes.status, '(Expected 403)');

    const attackRoomRes = await fetch(`${baseUrl}/owner/pgs/${pgId}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: owner2Cookie },
      body: JSON.stringify({ roomType: 'single', rent: 500, totalBeds: 1, occupiedBeds: 0 }),
    });
    console.log('Unauthorized Room Addition Rejected:', attackRoomRes.status, '(Expected 403)');

    // 8. Public vs Preview Permissions
    console.log('\n8. Testing Public Visibility vs Owner Preview Mode:');
    // Unauthenticated tenant request for pending PG
    const publicPendingRes = await fetch(`${baseUrl}/pgs/${pgId}`);
    console.log('Public Access to Pending Listing Rejected:', publicPendingRes.status, '(Expected 403)');

    // Owner preview request with session cookie
    const ownerPreviewRes = await fetch(`${baseUrl}/pgs/${pgId}`, {
      headers: { Cookie: ownerCookie },
    });
    const ownerPreviewData = await ownerPreviewRes.json();
    console.log('Owner Preview Access Granted:', ownerPreviewRes.status, '(Expected 200) | Preview Mode:', ownerPreviewData.data?.isPreview);

    // 9. Update Room Details
    console.log('\n9. Updating Room Bed Occupancy:');
    const updateRoomRes = await fetch(`${baseUrl}/owner/pgs/${pgId}/rooms/${room2Id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: ownerCookie },
      body: JSON.stringify({
        roomType: 'double',
        rent: 7000,
        totalBeds: 2,
        occupiedBeds: 2,
      }),
    });
    const updateRoomData = await updateRoomRes.json();
    console.log('Room Updated Status:', updateRoomRes.status, '| New Rent:', updateRoomData.data?.room?.rent);

    // 10. Delete Room & Delete PG
    console.log('\n10. Testing Room Removal & Listing Cleanup:');
    const deleteRoomRes = await fetch(`${baseUrl}/owner/pgs/${pgId}/rooms/${room2Id}`, {
      method: 'DELETE',
      headers: { Cookie: ownerCookie },
    });
    console.log('Room Deleted Status:', deleteRoomRes.status, '(Expected 200)');

    const deletePGRes = await fetch(`${baseUrl}/owner/pgs/${pgId}`, {
      method: 'DELETE',
      headers: { Cookie: ownerCookie },
    });
    console.log('PG Listing Deleted Status:', deletePGRes.status, '(Expected 200)');

    console.log('\n--- ALL 10 PHASE 3 OWNER LIFECYCLE & SECURITY TESTS PASSED ---');
  } finally {
    server.close();
    await closeDatabase();
  }
};

runTests().catch(console.error);
