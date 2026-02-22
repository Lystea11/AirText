import { createServer } from 'http';
import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { RoomManager } from './rooms/manager.js';
import { RateLimiter, createRateLimitMiddleware } from './middleware/rate-limit.js';
import { setupRoomHandlers } from './handlers/room.js';
import { setupSignalingHandlers } from './handlers/signaling.js';
import { config } from './config.js';

export function createApp() {
  const app = express();

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  return app;
}

export function createSocketServer(httpServer: ReturnType<typeof createServer>) {
  const roomManager = new RoomManager(config.roomTTL);
  const rateLimiter = new RateLimiter(config.rateLimit);

  // Start cleanup intervals
  roomManager.startCleanup();
  rateLimiter.startCleanup();

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: config.frontendOrigin,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
    maxHttpBufferSize: 1e6, // 1MB
  });

  // Apply rate limit middleware
  io.use(createRateLimitMiddleware(rateLimiter));

  // Handle connections
  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    const storage = roomManager.getStorage();

    // Set up room handlers
    setupRoomHandlers(socket, storage, rateLimiter);

    // Set up signaling handlers
    setupSignalingHandlers(socket, storage, rateLimiter);

    // Update activity on any signaling event
    socket.on('offer', (data) => {
      if (socket.data.roomCode) {
        storage.updateActivity(socket.data.roomCode);
      }
    });

    socket.on('answer', (data) => {
      if (socket.data.roomCode) {
        storage.updateActivity(socket.data.roomCode);
      }
    });

    socket.on('ice-candidate', (data) => {
      if (socket.data.roomCode) {
        storage.updateActivity(socket.data.roomCode);
      }
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Disconnected: ${socket.id} (${reason})`);

      // Clean up room if creator or joiner leaves
      if (socket.data.roomCode) {
        const room = storage.get(socket.data.roomCode);
        if (room) {
          if (room.creatorId === socket.id || room.joinerId === socket.id) {
            storage.delete(socket.data.roomCode);
            console.log(`[Room] Deleted room: ${socket.data.roomCode}`);
          }
        }
      }

      // Clean up rate limiter bucket
      rateLimiter.remove(socket.id);
    });
  });

  return { io, roomManager, rateLimiter };
}
