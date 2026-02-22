import type { Socket, SocketWithRoom } from '../types/room.js';
import type { RoomStorage } from '../rooms/storage.js';
import type { RateLimiter } from '../middleware/rate-limit.js';

/**
 * Set up room creation and join handlers
 */
export function setupRoomHandlers(
  socket: Socket,
  storage: RoomStorage,
  rateLimiter: RateLimiter
) {
  const socketWithRoom = socket as SocketWithRoom;

  /**
   * Handle entering an existing room (for creator who goes to /create/[code])
   */
  socket.on('enter-room', (code: string, callback: (data: { success: boolean; error?: string; role?: 'creator' | 'joiner'; code?: string }) => void) => {
    // Rate limit check
    if (rateLimiter.check(socket.id, 5)) {
      callback({ success: false, error: 'Rate limit exceeded' });
      return;
    }

    const room = storage.get(code);

    if (!room) {
      // Create the room with the requested code
      try {
        storage.create(socket.id, code);
      } catch (error) {
        callback({ success: false, error: 'Failed to create room' });
        return;
      }
      socketWithRoom.roomCode = code;
      socketWithRoom.role = 'creator';
      socket.join(code);

      console.log(`[Room] Created new room: ${code} by ${socket.id}`);
      callback({ success: true, role: 'creator', code });
      return;
    }

    // Room exists - check if we can join
    if (room.creatorId === socket.id) {
      socketWithRoom.roomCode = code;
      socketWithRoom.role = 'creator';
      socket.join(code);
      callback({ success: true, role: 'creator' });
      return;
    }

    if (room.joinerId !== null) {
      callback({ success: false, error: 'Room is full' });
      return;
    }

    const success = storage.setJoinerId(code, socket.id);

    if (!success) {
      callback({ success: false, error: 'Failed to join room' });
      return;
    }

    socketWithRoom.roomCode = code;
    socketWithRoom.role = 'joiner';
    socket.join(code);

    // Notify the creator that a joiner has arrived
    socket.to(room.creatorId).emit('peer-connected');

    console.log(`[Room] ${socket.id} joined room: ${code}`);
    callback({ success: true, role: 'joiner' });
  });

  /**
   * Handle room creation
   */
  socket.on('create-room', (callback: (data: { success: boolean; code?: string; error?: string }) => void) => {
    // Rate limit check
    if (rateLimiter.check(socket.id, 5)) {
      callback({ success: false, error: 'Rate limit exceeded' });
      return;
    }

    try {
      const code = storage.create(socket.id);
      socketWithRoom.roomCode = code;
      socketWithRoom.role = 'creator';
      socket.join(code);

      console.log(`[Room] Created room: ${code} by ${socket.id}`);
      callback({ success: true, code });
    } catch (error) {
      console.error(`[Room] Error creating room:`, error);
      callback({ success: false, error: 'Failed to create room' });
    }
  });

  /**
   * Handle room joining
   */
  socket.on('join-room', (code: string, callback: (data: { success: boolean; error?: string }) => void) => {
    // Rate limit check
    if (rateLimiter.check(socket.id, 5)) {
      callback({ success: false, error: 'Rate limit exceeded' });
      return;
    }

    const room = storage.get(code);

    if (!room) {
      callback({ success: false, error: 'Room not found' });
      return;
    }

    if (room.creatorId === socket.id) {
      callback({ success: false, error: 'Cannot join your own room' });
      return;
    }

    if (room.joinerId !== null) {
      callback({ success: false, error: 'Room is full' });
      return;
    }

    const success = storage.setJoinerId(code, socket.id);

    if (!success) {
      callback({ success: false, error: 'Failed to join room' });
      return;
    }

    socketWithRoom.roomCode = code;
    socketWithRoom.role = 'joiner';
    socket.join(code);

    // Notify the creator that a joiner has arrived
    socket.to(room.creatorId).emit('peer-connected');

    console.log(`[Room] ${socket.id} joined room: ${code}`);
    callback({ success: true });
  });
}
