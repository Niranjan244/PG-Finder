import cron from 'node-cron';
import { expireUnpaidBookingHolds } from './paymentService.js';

let cronJob = null;

export const initCronJobs = () => {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  // Run every 10 minutes to check and expire unpaid booking holds
  cronJob = cron.schedule('*/10 * * * *', async () => {
    try {
      await expireUnpaidBookingHolds();
    } catch (err) {
      console.error('[Cron Job Error] Failed to process booking hold expirations:', err.message);
    }
  });

  console.log('[Cron Service] Scheduled booking hold expiration worker (runs every 10 mins)');
};

export const stopCronJobs = () => {
  if (cronJob) {
    cronJob.stop();
  }
};

export default { initCronJobs, stopCronJobs };
