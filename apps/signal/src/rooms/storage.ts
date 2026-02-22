import type { Room } from '../types/room.js';
import { generateRoomCode, isValidRoomCode } from '../utils/room-code.js';

export class RoomStorage {
  private rooms: Map<string, Room> = new Map();

  /**
   * Create a new room and return its code.
   * If specificCode is provided, use that code; otherwise generate one.
   */
  create(creatorId: string, specificCode?: string): string {
    let code: string;

    if (specificCode) {
      if (!isValidRoomCode(specificCode)) {
        throw new Error('Invalid room code');
      }
      if (this.rooms.has(specificCode)) {
        throw new Error('Room already exists');
      }
      code = specificCode;
    } else {
      let attempts = 0;
      const maxAttempts = 100;

      // Generate unique code (handle unlikely collisions)
      do {
        code = generateRoomCode();
        attempts++;
      } while (this.rooms.has(code) && attempts < maxAttempts);

      if (attempts >= maxAttempts) {
        throw new Error('Failed to generate unique room code');
      }
    }

    const room: Room = {
      code,
      creatorId,
      joinerId: null,
      createdAt: new Date(),
      lastActivity: new Date(),
      creatorOffer: null,
      joinerAnswer: null,
    };

    this.rooms.set(code, room);
    return code;
  }

  /**
   * Get a room by code
   */
  get(code: string): Room | undefined {
    if (!isValidRoomCode(code)) {
      return undefined;
    }
    return this.rooms.get(code);
  }

  /**
   * Check if a room exists
   */
  has(code: string): boolean {
    if (!isValidRoomCode(code)) {
      return false;
    }
    return this.rooms.has(code);
  }

  /**
   * Update a room's last activity timestamp
   */
  updateActivity(code: string): boolean {
    const room = this.get(code);
    if (!room) {
      return false;
    }
    room.lastActivity = new Date();
    return true;
  }

  /**
   * Set the joiner ID for a room
   */
  setJoinerId(code: string, joinerId: string): boolean {
    const room = this.get(code);
    if (!room) {
      return false;
    }
    if (room.joinerId !== null) {
      return false; // Room already has a joiner
    }
    room.joinerId = joinerId;
    room.lastActivity = new Date();
    return true;
  }

  /**
   * Store creator's WebRTC offer
   */
  setCreatorOffer(code: string, offer: RTCSessionDescription): boolean {
    const room = this.get(code);
    if (!room) {
      return false;
    }
    room.creatorOffer = offer;
    room.lastActivity = new Date();
    return true;
  }

  /**
   * Store joiner's WebRTC answer
   */
  setJoinerAnswer(code: string, answer: RTCSessionDescription): boolean {
    const room = this.get(code);
    if (!room) {
      return false;
    }
    room.joinerAnswer = answer;
    room.lastActivity = new Date();
    return true;
  }

  /**
   * Delete a room
   */
  delete(code: string): boolean {
    return this.rooms.delete(code);
  }

  /**
   * Get all rooms (for cleanup)
   */
  getAll(): Map<string, Room> {
    return this.rooms;
  }

  /**
   * Get room count
   */
  size(): number {
    return this.rooms.size;
  }
}
