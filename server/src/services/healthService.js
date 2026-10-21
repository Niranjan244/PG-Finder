import mongoose from 'mongoose';

export const getSystemHealth = () => {
  const dbStatusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const connectionState = mongoose.connection.readyState;
  const isHealthy = connectionState === 1;

  return {
    status: isHealthy ? 'healthy' : 'degraded',
    service: 'pg-finder-api',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatusMap[connectionState] || 'unknown',
      readyState: connectionState,
    },
  };
};
