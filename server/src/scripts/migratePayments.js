import { connectDatabase, closeDatabase } from '../config/db.js';
import PG from '../models/PG.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';

const runMigration = async () => {
  try {
    console.log('[Migration] Connecting to database...');
    await connectDatabase();

    // 1. Backfill PG.bookingTokenAmount where missing
    const pgResult = await PG.updateMany(
      { $or: [{ bookingTokenAmount: { $exists: false } }, { bookingTokenAmount: null }] },
      { $set: { bookingTokenAmount: 1000 } }
    );
    console.log(`[Migration] Updated ${pgResult.modifiedCount} PG listings with default bookingTokenAmount = 1000`);

    // 2. Backfill Booking.paymentStatus where missing
    const bookingResult = await Booking.updateMany(
      { $or: [{ paymentStatus: { $exists: false } }, { paymentStatus: null }] },
      { $set: { paymentStatus: 'unpaid' } }
    );
    console.log(`[Migration] Updated ${bookingResult.modifiedCount} existing bookings with default paymentStatus = 'unpaid'`);

    // 3. Ensure Payment indexes
    await Payment.syncIndexes();
    await Booking.syncIndexes();
    await PG.syncIndexes();
    console.log('[Migration] Indexes synchronized for Payment, Booking, and PG collections.');

    console.log('[Migration] Migration complete!');
    await closeDatabase();
    process.exit(0);
  } catch (err) {
    console.error('[Migration Error]', err);
    process.exit(1);
  }
};

runMigration();
