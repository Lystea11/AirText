import type { Socket } from '../types/room.js';

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

interface RateLimitConfig {
  maxTokens: number;
  refillRate: number; // tokens per second
  cleanupInterval: number; // milliseconds
}

export class RateLimiter {
  private buckets: Map<string, TokenBucket> = new Map();
  private config: RateLimitConfig;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config?: Partial<RateLimitConfig>) {
    this.config = {
      maxTokens: config?.maxTokens ?? 100,
      refillRate: config?.refillRate ?? 10,
      cleanupInterval: config?.cleanupInterval ?? 60000,
    };
  }

  /**
   * Start the cleanup interval for inactive buckets
   */
  startCleanup(): void {
    if (this.cleanupInterval) {
      return;
    }

    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Stop the cleanup interval
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Remove inactive buckets
   */
  private cleanup(): void {
    const now = Date.now();
    const inactiveKeys: string[] = [];

    this.buckets.forEach((bucket, key) => {
      const inactiveTime = now - bucket.lastRefill;
      if (inactiveTime > this.config.cleanupInterval) {
        inactiveKeys.push(key);
      }
    });

    inactiveKeys.forEach((key) => {
      this.buckets.delete(key);
    });
  }

  /**
   * Get or create a token bucket for a socket
   */
  private getBucket(socketId: string): TokenBucket {
    let bucket = this.buckets.get(socketId);

    if (!bucket) {
      bucket = {
        tokens: this.config.maxTokens,
        lastRefill: Date.now(),
      };
      this.buckets.set(socketId, bucket);
    }

    return bucket;
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refill(bucket: TokenBucket): void {
    const now = Date.now();
    const elapsed = (now - bucket.lastRefill) / 1000; // seconds
    const tokensToAdd = Math.floor(elapsed * this.config.refillRate);

    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(bucket.tokens + tokensToAdd, this.config.maxTokens);
      bucket.lastRefill = now;
    }
  }

  /**
   * Check if a request should be rate limited
   * Returns true if rate limited, false if allowed
   */
  check(socketId: string, cost: number = 1): boolean {
    const bucket = this.getBucket(socketId);
    this.refill(bucket);

    if (bucket.tokens >= cost) {
      bucket.tokens -= cost;
      return false;
    }

    return true;
  }

  /**
   * Remove a socket's bucket (when socket disconnects)
   */
  remove(socketId: string): void {
    this.buckets.delete(socketId);
  }

  /**
   * Get current token count for a socket
   */
  getTokens(socketId: string): number {
    const bucket = this.getBucket(socketId);
    this.refill(bucket);
    return bucket.tokens;
  }
}

/**
 * Create a Socket.IO middleware for rate limiting
 */
export function createRateLimitMiddleware(rateLimiter: RateLimiter) {
  return (socket: Socket, next: (err?: Error) => void) => {
    // Add rate limit check to socket
    socket.on('disconnect', () => {
      rateLimiter.remove(socket.id);
    });

    next();
  };
}
