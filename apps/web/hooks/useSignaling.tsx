'use client';

import { useState, useEffect, useCallback } from 'react';
import { createSocketConnection, disconnectSocket, emitSocketEvent, onSocketEvent } from '../lib/socket';

export interface UseSignalingOptions {
  onPeerConnected?: () => void;
}

export interface UseSignalingReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  createRoom: () => Promise<{ success: boolean; code?: string; error?: string }>;
  joinRoom: (code: string) => Promise<{ success: boolean; error?: string }>;
  enterRoom: (code: string) => Promise<{ success: boolean; error?: string; role?: 'creator' | 'joiner' }>;
  disconnect: () => void;
}

export function useSignaling(options?: UseSignalingOptions): UseSignalingReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { onPeerConnected } = options ?? {};

  const createRoom = useCallback(async (): Promise<{ success: boolean; code?: string; error?: string }> => {
    setError(null);

    return new Promise((resolve) => {
      emitSocketEvent('create-room', {}, (response: { success: boolean; code?: string; error?: string }) => {
        if (response.success) {
          console.log('[useSignaling] Room created:', response.code);
        } else {
          setError(response.error ?? 'Failed to create room');
        }
        resolve(response);
      });
    });
  }, []);

  const joinRoom = useCallback(async (code: string): Promise<{ success: boolean; error?: string }> => {
    setError(null);

    return new Promise((resolve) => {
      emitSocketEvent('join-room', code, (response: { success: boolean; error?: string }) => {
        if (response.success) {
          console.log('[useSignaling] Joined room:', code);
        } else {
          setError(response.error ?? 'Failed to join room');
        }
        resolve(response);
      });
    });
  }, []);

  const enterRoom = useCallback(async (code: string): Promise<{ success: boolean; error?: string; role?: 'creator' | 'joiner' }> => {
    setError(null);

    return new Promise((resolve) => {
      emitSocketEvent('enter-room', code, (response: { success: boolean; error?: string; role?: 'creator' | 'joiner' }) => {
        if (response.success) {
          console.log('[useSignaling] Entered room:', code, 'as', response.role);
        } else {
          setError(response.error ?? 'Failed to enter room');
        }
        resolve(response);
      });
    });
  }, []);

  const disconnect = useCallback(() => {
    disconnectSocket();
    setIsConnected(false);
    setError(null);
  }, []);

  // Initialize socket connection
  useEffect(() => {
    const socket = createSocketConnection();

    const handleConnect = () => {
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setIsConnecting(false);
    };

    const handleConnectError = () => {
      setIsConnecting(false);
      setError('Failed to connect to signal server');
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);

    // Set connecting state initially
    setIsConnecting(!socket.connected);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
    };
  }, []);

  // Listen for peer connected event
  useEffect(() => {
    const unsubscribe = onSocketEvent('peer-connected', () => {
      console.log('[useSignaling] Peer connected');
      onPeerConnected?.();
    });

    return unsubscribe;
  }, [onPeerConnected]);

  return {
    isConnected,
    isConnecting,
    error,
    createRoom,
    joinRoom,
    enterRoom,
    disconnect,
  };
}
