export const config = {
  port: parseInt(process.env.PORT ?? '3001', 10),
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000',
  roomTTL: parseInt(process.env.ROOM_TTL ?? '600000', 10), // 10 minutes in ms
  rateLimit: {
    maxTokens: parseInt(process.env.RATE_LIMIT_MAX_TOKENS ?? '100', 10),
    refillRate: parseInt(process.env.RATE_LIMIT_REFILL_RATE ?? '10', 10), // per second
    cleanupInterval: parseInt(process.env.RATE_LIMIT_CLEANUP_INTERVAL ?? '60000', 10), // 1 minute
  },
};

export type Config = typeof config;
