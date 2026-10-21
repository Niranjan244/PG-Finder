import mongoose from 'mongoose';
import { connectDatabase, closeDatabase } from './src/config/db.js';
import PG from './src/models/PG.js';
import Room from './src/models/Room.js';
import User from './src/models/User.js';
import Booking from './src/models/Booking.js';
import {
  createBookingRequest,
  getTenantBookings,
  getOwnerBookings,
  approveBookingRequest,
  rejectBookingRequest,
  cancelBookingRequest,
} from './src/services/bookingService.js';

const runPhase5Tests = async () => {
  console.log('Connecting to database...');
  await connectDatabase();

  console.log('Synchronizing indexes...');
  await Booking.syncIndexes();
  await PG.syncIndexes();
  await Room.syncIndexes();

  // Clean previous test data
  await Booking.deleteMany({ message: /^Phase5_Test_/ });
  await Room.deleteMany({ roomNumber: /^P5-/ });
  await PG.deleteMany({ title: /^Phase5_Test_/ });
  await User.deleteMany({ email: /^phase5_test_/ });
  console.log('Cleaned up previous test records.');

  let owner = null;
  let tenantA = null;
  let tenantB = null;
  let tenantC = null;
  let pg = null;
  let room = null;

  try {
    // 1. Seed Users
    owner = await User.create({
      name: 'Phase5 Test Owner',
      email: 'phase5_test_owner@example.com',
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
      phone: '9876543210',
      role: 'owner',
    });

    tenantA = await User.create({
      name: 'Phase5 Tenant Alpha',
      email: 'phase5_test_tenant_a@example.com',
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
      phone: '9123456780',
      role: 'tenant',
    });

    tenantB = await User.create({
      name: 'Phase5 Tenant Beta',
      email: 'phase5_test_tenant_b@example.com',
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
      phone: '9123456781',
      role: 'tenant',
    });

    tenantC = await User.create({
      name: 'Phase5 Tenant Gamma',
      email: 'phase5_test_tenant_c@example.com',
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
      phone: '9123456782',
      role: 'tenant',
    });

    // 2. Seed Approved PG & Room
    pg = await PG.create({
      owner: owner._id,
      title: 'Phase5_Test_GreenResidency',
      description: 'A verified accommodation designed for concurrency testing in Phase 5.',
      address: '42 Tech Park Road',
      city: 'Bangalore',
      area: 'Whitefield',
      location: {
        type: 'Point',
        coordinates: [77.7500, 12.9700],
      },
      genderPreference: 'coliving',
      deposit: 12000,
      wifi: true,
      amenities: ['High-Speed Wi-Fi', 'Air Conditioning'],
      status: 'approved',
      rentRange: { minRent: 9000, maxRent: 9000 },
    });

    // Room with capacity of 2 beds, currently 0 occupied
    room = await Room.create({
      pg: pg._id,
      roomNumber: 'P5-101',
      roomType: 'double',
      rent: 9000,
      deposit: 12000,
      totalBeds: 2,
      occupiedBeds: 0,
    });

    console.log('Seeded PG and double sharing room (totalBeds: 2, occupiedBeds: 0).');

    // --- TEST 1: Tenant creates booking request ---
    console.log('\n[Test 1] Tenant A creates booking request...');
    const moveInTomorrow = new Date();
    moveInTomorrow.setDate(moveInTomorrow.getDate() + 1);

    const bookingA = await createBookingRequest({
      tenantId: tenantA._id,
      pgId: pg._id,
      roomId: room._id,
      moveInDate: moveInTomorrow,
      message: 'Phase5_Test_Request_Alpha',
    });

    if (!bookingA || bookingA.status !== 'pending') {
      throw new Error(`FAIL: Booking status is ${bookingA?.status}, expected 'pending'`);
    }

    // Verify bed counts did NOT increment yet
    const roomCheck1 = await Room.findById(room._id);
    if (roomCheck1.occupiedBeds !== 0) {
      throw new Error(`FAIL: Pending booking should not consume bed. occupiedBeds is ${roomCheck1.occupiedBeds}`);
    }
    console.log('PASS: Booking request created with status "pending". Occupied beds remained 0.');

    // --- TEST 2: Duplicate pending request blocked ---
    console.log('\n[Test 2] Duplicate pending request from same tenant to same PG is blocked...');
    let duplicateBlocked = false;
    try {
      await createBookingRequest({
        tenantId: tenantA._id,
        pgId: pg._id,
        roomId: room._id,
        moveInDate: moveInTomorrow,
        message: 'Phase5_Test_Request_Alpha_Duplicate',
      });
    } catch (dupErr) {
      if (dupErr.statusCode === 400 || dupErr.code === 11000) {
        duplicateBlocked = true;
      } else {
        throw dupErr;
      }
    }

    if (!duplicateBlocked) {
      throw new Error('FAIL: Duplicate pending booking was not blocked!');
    }
    console.log('PASS: Duplicate pending request correctly rejected by system.');

    // --- TEST 3: Owner views booking requests ---
    console.log('\n[Test 3] Owner views booking requests...');
    const ownerRequests = await getOwnerBookings(owner._id);
    if (!ownerRequests.bookings.some((b) => b._id.toString() === bookingA._id.toString())) {
      throw new Error('FAIL: Tenant A booking request not found in owner booking list');
    }
    console.log(`PASS: Owner fetched requests successfully (Count: ${ownerRequests.bookings.length}).`);

    // --- TEST 4: Owner approves booking -> occupiedBeds + 1 ---
    console.log('\n[Test 4] Owner approves Tenant A booking...');
    const approvedA = await approveBookingRequest({
      bookingId: bookingA._id,
      ownerId: owner._id,
    });

    if (approvedA.status !== 'approved') {
      throw new Error(`FAIL: Status is ${approvedA.status}, expected 'approved'`);
    }

    const roomCheck2 = await Room.findById(room._id);
    if (roomCheck2.occupiedBeds !== 1) {
      throw new Error(`FAIL: occupiedBeds should be 1 after approval, but got ${roomCheck2.occupiedBeds}`);
    }
    console.log('PASS: Booking approved and occupiedBeds atomically increased from 0 to 1.');

    // --- TEST 5: Concurrency race condition on the last bed ---
    console.log('\n[Test 5] Concurrency race condition test on the last remaining bed...');
    // Room has totalBeds: 2, occupiedBeds: 1. Exactly 1 bed remains!
    // Tenant B and Tenant C both create pending booking requests
    const bookingB = await createBookingRequest({
      tenantId: tenantB._id,
      pgId: pg._id,
      roomId: room._id,
      moveInDate: moveInTomorrow,
      message: 'Phase5_Test_Request_Beta',
    });

    const bookingC = await createBookingRequest({
      tenantId: tenantC._id,
      pgId: pg._id,
      roomId: room._id,
      moveInDate: moveInTomorrow,
      message: 'Phase5_Test_Request_Gamma',
    });

    console.log('Created pending requests for Tenant B and Tenant C. Executing concurrent approvals...');

    // Attempt concurrent approval using Promise.allSettled
    const results = await Promise.allSettled([
      approveBookingRequest({ bookingId: bookingB._id, ownerId: owner._id }),
      approveBookingRequest({ bookingId: bookingC._id, ownerId: owner._id }),
    ]);

    const fulfilledCount = results.filter((r) => r.status === 'fulfilled').length;
    const rejectedCount = results.filter((r) => r.status === 'rejected').length;

    console.log(`Concurrent execution result: ${fulfilledCount} fulfilled, ${rejectedCount} rejected.`);

    if (fulfilledCount !== 1 || rejectedCount !== 1) {
      throw new Error(`FAIL: Concurrency race condition failed! Exactly 1 should succeed and 1 should fail. Fulfilled: ${fulfilledCount}, Rejected: ${rejectedCount}`);
    }

    const failedResult = results.find((r) => r.status === 'rejected');
    if (failedResult.reason.statusCode !== 409) {
      throw new Error(`FAIL: Expected 409 Conflict error for overbooking attempt, got: ${failedResult.reason.statusCode}`);
    }

    // Inspect room bed occupancy: MUST BE exactly 2, NEVER 3!
    const roomCheck3 = await Room.findById(room._id);
    if (roomCheck3.occupiedBeds !== 2) {
      throw new Error(`FAIL: Room capacity was breached! occupiedBeds is ${roomCheck3.occupiedBeds}, expected exactly 2.`);
    }
    console.log('PASS: Concurrency race condition prevented! Exactly 1 approval succeeded, 1 was rejected with 409 Conflict, and occupiedBeds is strictly capped at totalBeds (2).');

    // --- TEST 6: Cancellation of an approved booking frees the bed ---
    console.log('\n[Test 6] Tenant A cancels their approved booking...');
    const cancelledA = await cancelBookingRequest({
      bookingId: bookingA._id,
      userId: tenantA._id,
      userRole: 'tenant',
      reason: 'Change in internship location',
    });

    if (cancelledA.status !== 'cancelled') {
      throw new Error(`FAIL: Expected status 'cancelled', got ${cancelledA.status}`);
    }

    const roomCheck4 = await Room.findById(room._id);
    if (roomCheck4.occupiedBeds !== 1) {
      throw new Error(`FAIL: Cancelling approved booking should decrement occupiedBeds to 1. Got: ${roomCheck4.occupiedBeds}`);
    }
    console.log('PASS: Approved booking cancelled and bed was released atomically (occupiedBeds decremented back to 1).');

    // --- TEST 7: Rejection flow with reason ---
    console.log('\n[Test 7] Owner rejects a pending booking with reason...');
    // Find the one that was rejected in Test 5 or remains pending
    const remainingPending = await Booking.findOne({
      _id: { $in: [bookingB._id, bookingC._id] },
      status: 'pending',
    });

    if (remainingPending) {
      const rejectedResult = await rejectBookingRequest({
        bookingId: remainingPending._id,
        ownerId: owner._id,
        rejectionReason: 'Room already reserved offline by another student',
      });

      if (rejectedResult.status !== 'rejected') {
        throw new Error(`FAIL: Status is ${rejectedResult.status}, expected 'rejected'`);
      }
      if (rejectedResult.rejectionReason !== 'Room already reserved offline by another student') {
        throw new Error(`FAIL: Rejection reason not saved correctly: ${rejectedResult.rejectionReason}`);
      }
      console.log('PASS: Booking rejected successfully with documented reason.');
    }

    console.log('\nALL 7 PHASE 5 BOOKING & CONCURRENCY TESTS PASSED SUCCESSFULLY.');
  } finally {
    console.log('\nCleaning up Phase 5 test records...');
    if (pg) {
      await Booking.deleteMany({ pg: pg._id });
      await Room.deleteMany({ pg: pg._id });
      await PG.findByIdAndDelete(pg._id);
    }
    await User.deleteMany({ email: /^phase5_test_/ });
    await closeDatabase();
    console.log('Database disconnected.');
  }
};

runPhase5Tests().catch((err) => {
  console.error('\nPHASE 5 TEST FAILED WITH ERROR:', err);
  process.exit(1);
});
