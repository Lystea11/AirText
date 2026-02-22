import type { ConnectionState, ChatEntry, TextMessage, FileMessage } from '../types/webrtc';

export const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

// Chunk size: 16 KB of raw data per chunk
export const FILE_CHUNK_SIZE = 16 * 1024;

// Binary packet header layout:
//   bytes  0–35 : fileId (UUID as 36 ASCII bytes)
//   bytes 36–39 : chunkIndex (Uint32, little-endian)
//   bytes   40+ : chunk payload
const FILE_ID_BYTES = 36;
const CHUNK_HEADER_SIZE = 40;

// Throttle progress events: only emit every N chunks (not on every chunk)
const PROGRESS_EMIT_EVERY = 8;

// ─── Wire-protocol shapes (internal to this file) ─────────────────────────────

interface WireTextMessage {
  type: 'text';
  id: string;
  text: string;
  timestamp: string;
}

interface WireFileMeta {
  type: 'file-meta';
  fileId: string;
  name: string;
  size: number;
  mimeType: string;
  totalChunks: number;
}

interface IncomingFileBuffer {
  meta: WireFileMeta;
  messageId: string;
  chunks: Map<number, ArrayBuffer>;
}

// ─── RTCPeerConnection helpers ─────────────────────────────────────────────────

export function createRTCPeerConnection(config: RTCConfiguration): RTCPeerConnection {
  return new RTCPeerConnection(config);
}

export function createDataChannel(connection: RTCPeerConnection, label: string): RTCDataChannel {
  const channel = connection.createDataChannel(label, { ordered: true });
  channel.binaryType = 'arraybuffer';
  return channel;
}

// ─── DataChannel handler setup ────────────────────────────────────────────────

export function setupDataChannelHandlers(
  channel: RTCDataChannel,
  callbacks: {
    onOpen?: () => void;
    onMessage?: (entry: ChatEntry) => void;
    onClose?: () => void;
    onError?: (error: Event) => void;
  }
): void {
  channel.binaryType = 'arraybuffer';

  // Per-channel incoming file assembly state (closure-scoped)
  const incomingFiles = new Map<string, IncomingFileBuffer>();

  channel.addEventListener('open', () => {
    console.log('[WebRTC] DataChannel opened');
    callbacks.onOpen?.();
  });

  channel.addEventListener('message', (event) => {
    if (typeof event.data === 'string') {
      // ── JSON message ──────────────────────────────────────────────────────
      try {
        const parsed = JSON.parse(event.data) as WireTextMessage | WireFileMeta;

        if (parsed.type === 'text') {
          const entry: TextMessage = {
            id: parsed.id,
            type: 'text',
            text: parsed.text,
            timestamp: new Date(parsed.timestamp),
            fromSelf: false,
          };
          callbacks.onMessage?.(entry);

        } else if (parsed.type === 'file-meta') {
          const messageId = crypto.randomUUID();
          incomingFiles.set(parsed.fileId, { meta: parsed, messageId, chunks: new Map() });

          const entry: FileMessage = {
            id: messageId,
            type: 'file',
            fileName: parsed.name,
            fileSize: parsed.size,
            fileMimeType: parsed.mimeType,
            totalChunks: parsed.totalChunks,
            chunksReceived: 0,
            fileUrl: undefined,
            timestamp: new Date(),
            fromSelf: false,
          };
          callbacks.onMessage?.(entry);
        }
      } catch (err) {
        console.error('[WebRTC] Failed to parse JSON message:', err);
      }

    } else if (event.data instanceof ArrayBuffer) {
      // ── Binary file chunk ─────────────────────────────────────────────────
      const { fileId, chunkIndex, chunkData } = parseChunkHeader(event.data);
      const fileState = incomingFiles.get(fileId);

      if (!fileState) {
        console.error('[WebRTC] Received chunk for unknown file:', fileId);
        return;
      }

      fileState.chunks.set(chunkIndex, chunkData);
      const received = fileState.chunks.size;
      const total = fileState.meta.totalChunks;

      if (received === total) {
        // All chunks received — assemble the Blob
        const sortedChunks: ArrayBuffer[] = [];
        for (let i = 0; i < total; i++) {
          const c = fileState.chunks.get(i);
          if (c) sortedChunks.push(c);
        }
        const blob = new Blob(sortedChunks, { type: fileState.meta.mimeType });
        const fileUrl = URL.createObjectURL(blob);
        incomingFiles.delete(fileId);

        const entry: FileMessage = {
          id: fileState.messageId,
          type: 'file',
          fileName: fileState.meta.name,
          fileSize: fileState.meta.size,
          fileMimeType: fileState.meta.mimeType,
          totalChunks: total,
          chunksReceived: total,
          fileUrl,
          timestamp: new Date(),
          fromSelf: false,
        };
        callbacks.onMessage?.(entry);

      } else if (received % PROGRESS_EMIT_EVERY === 0) {
        // Throttled progress update
        const entry: FileMessage = {
          id: fileState.messageId,
          type: 'file',
          fileName: fileState.meta.name,
          fileSize: fileState.meta.size,
          fileMimeType: fileState.meta.mimeType,
          totalChunks: total,
          chunksReceived: received,
          fileUrl: undefined,
          timestamp: new Date(),
          fromSelf: false,
        };
        callbacks.onMessage?.(entry);
      }
    }
  });

  channel.addEventListener('close', () => {
    console.log('[WebRTC] DataChannel closed');
    callbacks.onClose?.();
  });

  channel.addEventListener('error', (error) => {
    console.error('[WebRTC] DataChannel error:', error);
    callbacks.onError?.(error);
  });
}

// ─── Connection handler setup ─────────────────────────────────────────────────

export function setupConnectionHandlers(
  connection: RTCPeerConnection,
  callbacks: {
    onIceCandidate?: (candidate: RTCIceCandidate) => void;
    onConnectionStateChange?: (state: ConnectionState) => void;
    onDataChannel?: (channel: RTCDataChannel) => void;
  }
): void {
  connection.addEventListener('icecandidate', (event) => {
    if (event.candidate) {
      console.log('[WebRTC] ICE candidate generated');
      callbacks.onIceCandidate?.(event.candidate);
    }
  });

  connection.addEventListener('connectionstatechange', () => {
    console.log('[WebRTC] Connection state:', connection.connectionState);
    let state: ConnectionState;
    switch (connection.connectionState) {
      case 'connected':     state = 'connected';     break;
      case 'connecting':    state = 'connecting';    break;
      case 'disconnected':  state = 'disconnected';  break;
      case 'failed':        state = 'error';         break;
      case 'closed':        state = 'disconnected';  break;
      case 'new':
      default:              state = 'connecting';    break;
    }
    callbacks.onConnectionStateChange?.(state);
  });

  connection.addEventListener('datachannel', (event) => {
    console.log('[WebRTC] DataChannel received from peer');
    event.channel.binaryType = 'arraybuffer';
    callbacks.onDataChannel?.(event.channel);
  });
}

// ─── Sending ──────────────────────────────────────────────────────────────────

export function sendMessage(channel: RTCDataChannel, text: string): boolean {
  if (channel.readyState !== 'open') {
    console.error('[WebRTC] Cannot send message: DataChannel not open');
    return false;
  }
  const wire: WireTextMessage = {
    type: 'text',
    id: crypto.randomUUID(),
    text,
    timestamp: new Date().toISOString(),
  };
  try {
    channel.send(JSON.stringify(wire));
    return true;
  } catch (err) {
    console.error('[WebRTC] Failed to send message:', err);
    return false;
  }
}

export async function sendFile(channel: RTCDataChannel, file: File): Promise<void> {
  if (channel.readyState !== 'open') {
    console.error('[WebRTC] Cannot send file: DataChannel not open');
    return;
  }

  const fileId = crypto.randomUUID();
  const arrayBuffer = await file.arrayBuffer();
  const totalChunks = Math.max(1, Math.ceil(arrayBuffer.byteLength / FILE_CHUNK_SIZE));

  // 1. Send metadata
  const meta: WireFileMeta = {
    type: 'file-meta',
    fileId,
    name: file.name,
    size: file.size,
    mimeType: file.type || 'application/octet-stream',
    totalChunks,
  };
  channel.send(JSON.stringify(meta));

  // 2. Send chunks with buffered-amount flow control
  const HIGH_WATER = FILE_CHUNK_SIZE * 16;
  channel.bufferedAmountLowThreshold = FILE_CHUNK_SIZE * 8;

  for (let i = 0; i < totalChunks; i++) {
    // Pause when the send buffer is too full
    if (channel.bufferedAmount > HIGH_WATER) {
      await new Promise<void>((resolve) => {
        const onLow = () => {
          channel.removeEventListener('bufferedamountlow', onLow);
          resolve();
        };
        channel.addEventListener('bufferedamountlow', onLow);
      });
    }

    if (channel.readyState !== 'open') break;

    const start = i * FILE_CHUNK_SIZE;
    const end = Math.min(start + FILE_CHUNK_SIZE, arrayBuffer.byteLength);
    const chunkData = arrayBuffer.slice(start, end);

    // Build packet: [fileId (36 bytes)] [chunkIndex uint32 LE (4 bytes)] [data]
    const packet = new Uint8Array(CHUNK_HEADER_SIZE + chunkData.byteLength);
    packet.set(new TextEncoder().encode(fileId), 0);
    new DataView(packet.buffer).setUint32(FILE_ID_BYTES, i, true);
    packet.set(new Uint8Array(chunkData), CHUNK_HEADER_SIZE);

    channel.send(packet.buffer);
  }
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function parseChunkHeader(data: ArrayBuffer): {
  fileId: string;
  chunkIndex: number;
  chunkData: ArrayBuffer;
} {
  const fileId = new TextDecoder().decode(new Uint8Array(data, 0, FILE_ID_BYTES));
  const chunkIndex = new DataView(data).getUint32(FILE_ID_BYTES, true);
  const chunkData = data.slice(CHUNK_HEADER_SIZE);
  return { fileId, chunkIndex, chunkData };
}

export function parseIceCandidate(candidate: RTCIceCandidateInit): RTCIceCandidate {
  return new RTCIceCandidate(candidate);
}
