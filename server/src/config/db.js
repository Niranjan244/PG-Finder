import mongoose from 'mongoose';
import { env } from './env.js';

let memoryServer = null;

export const connectDatabase = async () => {
  try {
    const connection = await mongoose.connect(env.mongoUri, {
      family: 4,
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`MongoDB connected: ${connection.connection.host}`);
    return connection;
  } catch (initialError) {
    console.warn(`Primary MongoDB connection to ${env.mongoUri} failed: ${initialError.message}`);

    if (env.nodeEnv !== 'production') {
      try {
        console.log('Starting local development in-memory MongoDB engine...');
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        memoryServer = await MongoMemoryServer.create();
        const memoryUri = memoryServer.getUri();
        const connection = await mongoose.connect(memoryUri);
        console.log(`Development in-memory MongoDB connected: ${memoryUri}`);
        return connection;
      } catch (memoryError) {
        console.error(`Failed to start in-memory MongoDB: ${memoryError.message}`);
      }
    }

    if (env.nodeEnv === 'production') {
      process.exit(1);
    }
  }
};

export const closeDatabase = async () => {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
  }
};
