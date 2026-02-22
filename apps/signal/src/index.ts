import { createServer } from 'http';
import { config } from './config.js';
import { createApp } from './server.js';
import { createSocketServer } from './server.js';

const app = createApp();
const httpServer = createServer(app);
const { io } = createSocketServer(httpServer);

const PORT = config.port;

httpServer.listen(PORT, () => {
  console.log(`[Server] AirText Signal Server listening on port ${PORT}`);
  console.log(`[Server] Frontend origin: ${config.frontendOrigin}`);
  console.log(`[Server] Room TTL: ${config.roomTTL}ms`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    console.log('[Server] HTTP server closed');
    io.close(() => {
      console.log('[Server] Socket.IO server closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('[Server] SIGINT received, shutting down gracefully');
  httpServer.close(() => {
    console.log('[Server] HTTP server closed');
    io.close(() => {
      console.log('[Server] Socket.IO server closed');
      process.exit(0);
    });
  });
});
