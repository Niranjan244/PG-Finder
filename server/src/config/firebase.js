import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { env } from './env.js';

let firebaseApp = null;

export const getFirebaseAdmin = () => {
  if (firebaseApp) {
    return {
      auth: () => getAuth(firebaseApp),
    };
  }

  if (!env.firebaseProjectId || !env.firebaseClientEmail || !env.firebasePrivateKey) {
    console.warn('[Firebase Admin] Warning: Firebase credentials are not fully configured in environment variables.');
    return null;
  }

  // Handle \n characters in the private key when loaded from environment strings
  const formattedPrivateKey = env.firebasePrivateKey.replace(/\\n/g, '\n');

  try {
    if (getApps().length === 0) {
      firebaseApp = initializeApp({
        credential: cert({
          projectId: env.firebaseProjectId,
          clientEmail: env.firebaseClientEmail,
          privateKey: formattedPrivateKey,
        }),
      });
    } else {
      firebaseApp = getApps()[0];
    }

    return {
      auth: () => getAuth(firebaseApp),
    };
  } catch (error) {
    console.error('[Firebase Admin] Initialization failed:', error.message);
    return null;
  }
};

export default getFirebaseAdmin;
