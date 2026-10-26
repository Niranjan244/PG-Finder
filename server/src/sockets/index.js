import { Server } from 'socket.io';
import { env } from '../config/env.js';
import { registerChatSocketHandlers } from './chatSocket.js';

let ioInstance = null;

export const initializeSocketIO = (httpServer) => {
  const allowedOrigins = [
    env.clientUrl,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ].filter(Boolean);

  ioInstance = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  registerChatSocketHandlers(ioInstance);

  return ioInstance;
};

export const getIO = () => {
  if (!ioInstance) {
    throw new Error('Socket.IO has not been initialized');
  }
  return ioInstance;
};
