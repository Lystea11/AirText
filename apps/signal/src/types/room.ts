export interface Room {
  code: string;
  creatorId: string;
  joinerId: string | null;
  createdAt: Date;
  lastActivity: Date;
  creatorOffer: RTCSessionDescription | null;
  joinerAnswer: RTCSessionDescription | null;
}

export interface SocketWithRoom extends Socket {
  roomCode?: string;
  role?: 'creator' | 'joiner';
}

export type Socket = import('socket.io').Socket;
