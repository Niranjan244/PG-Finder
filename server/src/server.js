import http from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { connectDatabase } from './config/db.js';
import { initializeSocketIO } from './sockets/index.js';
import { initializeAdminAccount } from './services/adminSeedService.js';

const httpServer = http.createServer(app);

// Attach Socket.IO to HTTP server
initializeSocketIO(httpServer);

const startServer = async () => {
  await connectDatabase();
  await initializeAdminAccount();

  const server = httpServer.listen(env.port, () => {
    console.log(`PG Finder server running in ${env.nodeEnv} mode on port ${env.port}`);
  });

  const handleTermination = (signal) => {
    console.log(`Received ${signal}. Shutting down HTTP server gracefully.`);
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => handleTermination('SIGTERM'));
  process.on('SIGINT', () => handleTermination('SIGINT'));
};

startServer().catch((error) => {
  console.error(`Failed to start server: ${error.message}`);
  process.exit(1);
});
