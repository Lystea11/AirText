import type { Room } from '../types/room.js';
import { RoomStorage } from './storage.js';

const DEFAULT_ROOM_TTL_MS = 10 * 60 * 1000; // 10 minutes
const CLEANUP_INTERVAL_MS = 60 * 1000; // 1 minute

export class RoomManager {
  private storage: RoomStorage;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private roomTTL: number;

  constructor(roomTTL: number = DEFAULT_ROOM_TTL_MS) {
    this.storage = new RoomStorage();
    this.roomTTL = roomTTL;
  }

  /**
   * Start the cleanup interval
   */
  startCleanup(): void {
    if (this.cleanupInterval) {
      return;
    }

    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, CLEANUP_INTERVAL_MS);
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
   * Remove expired rooms
   */
  private cleanup(): void {
    const now = Date.now();
    const rooms = this.storage.getAll();
    const expiredCodes: string[] = [];

    rooms.forEach((room: Room, code: string) => {
      const age = now - room.lastActivity.getTime();
      if (age > this.roomTTL) {
        expiredCodes.push(code);
      }
    });

    expiredCodes.forEach((code) => {
      this.storage.delete(code);
      console.log(`[RoomManager] Cleaned up expired room: ${code}`);
    });
  }

  /**
   * Get the storage instance
   */
  getStorage(): RoomStorage {
    return this.storage;
  }

  /**
   * Get room TTL in milliseconds
   */
  getRoomTTL(): number {
    return this.roomTTL;
  }
}
