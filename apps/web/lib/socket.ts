import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSignalServerUrl(): string {
  if (typeof window === 'undefined') {
    return 'http://localhost:3001';
  }
  return process.env.NEXT_PUBLIC_SIGNAL_SERVER_URL || 'http://localhost:3001';
}

export function createSocketConnection(): Socket {
  if (socket && socket.connected) {
    return socket;
  }

  socket = io(getSignalServerUrl(), {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected to signal server');
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected from signal server:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('[Socket] Connection error:', error);
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function emitSocketEvent(
  event: string,
  data: any,
  callback?: (response: any) => void
): void {
  if (!socket || !socket.connected) {
    console.error('[Socket] Cannot emit event: not connected');
    return;
  }

  if (callback) {
    socket.emit(event, data, callback);
  } else {
    socket.emit(event, data);
  }
}

export function onSocketEvent<T = any>(
  event: string,
  callback: (data: T) => void
): () => void {
  if (!socket) {
    console.error('[Socket] Cannot listen to event: socket not created');
    return () => {};
  }

  socket.on(event, callback);

  return () => {
    socket?.off(event, callback);
  };
}
