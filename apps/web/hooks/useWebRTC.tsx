'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  ConnectionState,
  UseWebRTCOptions,
  UseWebRTCReturn,
  ChatEntry,
  FileMessage,
} from '../types/webrtc';
import {
  ICE_SERVERS,
  FILE_CHUNK_SIZE,
  createRTCPeerConnection,
  createDataChannel,
  setupDataChannelHandlers,
  setupConnectionHandlers,
  sendMessage as sendWebRTCMessage,
  sendFile as sendWebRTCFile,
  parseIceCandidate,
} from '../lib/webrtc';
import { emitSocketEvent, onSocketEvent } from '../lib/socket';

export function useWebRTC(options: UseWebRTCOptions): UseWebRTCReturn {
  const { role, roomCode, onMessageReceived, onConnectionStateChange } = options;

  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');

  const connectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const remoteDataChannelRef = useRef<RTCDataChannel | null>(null);

  // Keep callbacks in refs so channel handlers don't go stale
  const onMessageReceivedRef = useRef(onMessageReceived);
  useEffect(() => { onMessageReceivedRef.current = onMessageReceived; }, [onMessageReceived]);

  const onConnectionStateChangeRef = useRef(onConnectionStateChange);
  useEffect(() => { onConnectionStateChangeRef.current = onConnectionStateChange; }, [onConnectionStateChange]);

  // Stable callback passed into setupDataChannelHandlers
  const onMessageCallback = useCallback((entry: ChatEntry) => {
    onMessageReceivedRef.current?.(entry);
  }, []);

  const getChannel = useCallback((): RTCDataChannel | null => {
    return role === 'creator' ? dataChannelRef.current : remoteDataChannelRef.current;
  }, [role]);

  const cleanup = useCallback(() => {
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }
    if (remoteDataChannelRef.current) {
      remoteDataChannelRef.current.close();
      remoteDataChannelRef.current = null;
    }
    if (connectionRef.current) {
      connectionRef.current.close();
      connectionRef.current = null;
    }
    setConnectionState('idle');
  }, []);

  const makeChannelCallbacks = useCallback(() => ({
    onOpen: () => setConnectionState('connected'),
    onMessage: onMessageCallback,
    onClose: () => setConnectionState('disconnected'),
    onError: (error: Event) => {
      console.error('[useWebRTC] DataChannel error:', error);
      setConnectionState('error');
    },
  }), [onMessageCallback]);

  const createOffer = useCallback(async (): Promise<RTCSessionDescription | null> => {
    try {
      cleanup();

      const connection = createRTCPeerConnection(ICE_SERVERS);
      connectionRef.current = connection;

      const dataChannel = createDataChannel(connection, 'messages');
      dataChannelRef.current = dataChannel;
      setupDataChannelHandlers(dataChannel, makeChannelCallbacks());

      setupConnectionHandlers(connection, {
        onIceCandidate: (candidate) => {
          emitSocketEvent('ice-candidate', { code: roomCode, candidate });
        },
        onConnectionStateChange: (state) => {
          setConnectionState(state);
          onConnectionStateChangeRef.current?.(state);
        },
      });

      const offerInit = await connection.createOffer();
      await connection.setLocalDescription(offerInit);
      return new RTCSessionDescription(offerInit);
    } catch (error) {
      console.error('[useWebRTC] Error creating offer:', error);
      setConnectionState('error');
      cleanup();
      return null;
    }
  }, [roomCode, cleanup, makeChannelCallbacks]);

  const setOffer = useCallback(async (offer: RTCSessionDescription) => {
    if (!connectionRef.current) {
      const connection = createRTCPeerConnection(ICE_SERVERS);
      connectionRef.current = connection;

      setupConnectionHandlers(connection, {
        onIceCandidate: (candidate) => {
          emitSocketEvent('ice-candidate', { code: roomCode, candidate });
        },
        onConnectionStateChange: (state) => {
          setConnectionState(state);
          onConnectionStateChangeRef.current?.(state);
        },
        onDataChannel: (channel) => {
          remoteDataChannelRef.current = channel;
          setupDataChannelHandlers(channel, makeChannelCallbacks());
        },
      });
    }

    try {
      setConnectionState('connecting');
      await connectionRef.current.setRemoteDescription(offer);
    } catch (error) {
      console.error('[useWebRTC] Error setting remote description:', error);
      setConnectionState('error');
    }
  }, [roomCode, makeChannelCallbacks]);

  const createAnswer = useCallback(async (): Promise<RTCSessionDescription | null> => {
    if (!connectionRef.current) {
      console.error('[useWebRTC] Cannot create answer: no connection');
      return null;
    }
    try {
      const answerInit = await connectionRef.current.createAnswer();
      await connectionRef.current.setLocalDescription(answerInit);
      return new RTCSessionDescription(answerInit);
    } catch (error) {
      console.error('[useWebRTC] Error creating answer:', error);
      setConnectionState('error');
      return null;
    }
  }, []);

  const setAnswer = useCallback(async (answer: RTCSessionDescription) => {
    if (!connectionRef.current) {
      console.error('[useWebRTC] Cannot set answer: no connection');
      return;
    }
    try {
      await connectionRef.current.setRemoteDescription(answer);
    } catch (error) {
      console.error('[useWebRTC] Error setting remote description (answer):', error);
      setConnectionState('error');
    }
  }, []);

  const addIceCandidate = useCallback(async (candidate: RTCIceCandidate) => {
    if (!connectionRef.current) {
      console.error('[useWebRTC] Cannot add ICE candidate: no connection');
      return;
    }
    try {
      await connectionRef.current.addIceCandidate(candidate);
    } catch (error) {
      console.error('[useWebRTC] Error adding ICE candidate:', error);
    }
  }, []);

  const sendMessage = useCallback((text: string) => {
    const channel = getChannel();
    if (!channel) {
      console.error('[useWebRTC] Cannot send message: no data channel');
      return;
    }
    sendWebRTCMessage(channel, text);
  }, [getChannel]);

  const sendFile = useCallback(async (file: File) => {
    const channel = getChannel();
    if (!channel || channel.readyState !== 'open') {
      console.error('[useWebRTC] Cannot send file: channel not open');
      return;
    }

    // Optimistic entry for the sender — immediately visible with download link
    const fileUrl = URL.createObjectURL(file);
    const totalChunks = Math.max(1, Math.ceil(file.size / FILE_CHUNK_SIZE));
    const optimistic: FileMessage = {
      id: crypto.randomUUID(),
      type: 'file',
      fileName: file.name,
      fileSize: file.size,
      fileMimeType: file.type || 'application/octet-stream',
      totalChunks,
      chunksReceived: totalChunks,
      fileUrl,
      timestamp: new Date(),
      fromSelf: true,
    };
    onMessageReceivedRef.current?.(optimistic);

    try {
      await sendWebRTCFile(channel, file);
    } catch (error) {
      console.error('[useWebRTC] Error sending file:', error);
    }
  }, [getChannel]);

  const disconnect = useCallback(() => {
    cleanup();
  }, [cleanup]);

  // Signaling event listeners
  useEffect(() => {
    const unsubscribeOffer = onSocketEvent('offer', async ({ offer }) => {
      if (role === 'joiner') {
        await setOffer(offer);
        const answer = await createAnswer();
        if (answer) emitSocketEvent('answer', { code: roomCode, answer });
      }
    });

    const unsubscribeAnswer = onSocketEvent('answer', ({ answer }) => {
      if (role === 'creator') setAnswer(answer);
    });

    const unsubscribeIceCandidate = onSocketEvent('ice-candidate', ({ candidate }) => {
      addIceCandidate(candidate);
    });

    return () => {
      unsubscribeOffer();
      unsubscribeAnswer();
      unsubscribeIceCandidate();
    };
  }, [role, roomCode, setOffer, setAnswer, createAnswer, addIceCandidate]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    connectionState,
    sendMessage,
    sendFile,
    createOffer,
    setOffer,
    createAnswer,
    setAnswer,
    addIceCandidate,
    disconnect,
  };
}
