import Razorpay from 'razorpay';
import { env } from './env.js';

let razorpayInstance = null;

export const getRazorpayInstance = () => {
  if (!razorpayInstance) {
    if (!env.razorpayKeyId || !env.razorpayKeySecret) {
      console.warn(
        '[Razorpay] RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not configured in .env. Razorpay operations will fail until set.'
      );
    }
    razorpayInstance = new Razorpay({
      key_id: env.razorpayKeyId || 'dummy_key_id',
      key_secret: env.razorpayKeySecret || 'dummy_key_secret',
    });
  }
  return razorpayInstance;
};

export default getRazorpayInstance;
