import type { Socket, SocketWithRoom } from '../types/room.js';
import type { RoomStorage } from '../rooms/storage.js';
import type { RateLimiter } from '../middleware/rate-limit.js';

/**
 * Set up WebRTC signaling handlers
 */
export function setupSignalingHandlers(
  socket: Socket,
  storage: RoomStorage,
  rateLimiter: RateLimiter
) {
  const socketWithRoom = socket as SocketWithRoom;

  /**
   * Handle WebRTC offer (from creator)
   */
  socket.on('offer', (data: { code: string; offer: RTCSessionDescription }, callback?: (data: { success: boolean; error?: string }) => void) => {
    // Rate limit check (ICE candidates can be frequent)
    if (rateLimiter.check(socket.id, 1)) {
      callback?.({ success: false, error: 'Rate limit exceeded' });
      return;
    }

    const { code, offer } = data;
    const room = storage.get(code);

    if (!room) {
      callback?.({ success: false, error: 'Room not found' });
      return;
    }

    if (room.creatorId !== socket.id) {
      callback?.({ success: false, error: 'Only creator can send offer' });
      return;
    }

    if (!room.joinerId) {
      callback?.({ success: false, error: 'No joiner in room' });
      return;
    }

    // Store the offer
    storage.setCreatorOffer(code, offer);

    // Forward offer to joiner
    socket.to(room.joinerId).emit('offer', { offer });

    console.log(`[Signaling] Offer from ${socket.id} for room ${code}`);
    callback?.({ success: true });
  });

  /**
   * Handle WebRTC answer (from joiner)
   */
  socket.on('answer', (data: { code: string; answer: RTCSessionDescription }, callback?: (data: { success: boolean; error?: string }) => void) => {
    // Rate limit check
    if (rateLimiter.check(socket.id, 1)) {
      callback?.({ success: false, error: 'Rate limit exceeded' });
      return;
    }

    const { code, answer } = data;
    const room = storage.get(code);

    if (!room) {
      callback?.({ success: false, error: 'Room not found' });
      return;
    }

    if (room.joinerId !== socket.id) {
      callback?.({ success: false, error: 'Only joiner can send answer' });
      return;
    }

    // Store the answer
    storage.setJoinerAnswer(code, answer);

    // Forward answer to creator
    socket.to(room.creatorId).emit('answer', { answer });

    console.log(`[Signaling] Answer from ${socket.id} for room ${code}`);
    callback?.({ success: true });
  });

  /**
   * Handle ICE candidates
   */
  socket.on('ice-candidate', (data: { code: string; candidate: RTCIceCandidate }) => {
    // Rate limit check
    if (rateLimiter.check(socket.id, 1)) {
      return;
    }

    const { code, candidate } = data;
    const room = storage.get(code);

    if (!room) {
      return;
    }

    // Determine target socket
    let targetId: string;
    if (room.creatorId === socket.id) {
      if (!room.joinerId) return;
      targetId = room.joinerId;
    } else if (room.joinerId === socket.id) {
      targetId = room.creatorId;
    } else {
      return; // Socket not in this room
    }

    // Forward ICE candidate to peer
    socket.to(targetId).emit('ice-candidate', { candidate });
  });
}
