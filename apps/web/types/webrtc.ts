export type ConnectionState = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

export interface TextMessage {
  id: string;
  type: 'text';
  text: string;
  timestamp: Date;
  fromSelf: boolean;
}

export interface FileMessage {
  id: string;
  type: 'file';
  fileName: string;
  fileSize: number;
  fileMimeType: string;
  totalChunks: number;
  chunksReceived: number;
  fileUrl?: string;
  timestamp: Date;
  fromSelf: boolean;
}

export type ChatEntry = TextMessage | FileMessage;

/** @deprecated Use ChatEntry instead */
export type WebRTCMessage = ChatEntry;

export interface UseWebRTCOptions {
  role: 'creator' | 'joiner';
  roomCode: string;
  onMessageReceived?: (message: ChatEntry) => void;
  onConnectionStateChange?: (state: ConnectionState) => void;
}

export interface UseWebRTCReturn {
  connectionState: ConnectionState;
  sendMessage: (text: string) => void;
  sendFile: (file: File) => void;
  createOffer: () => Promise<RTCSessionDescription | null>;
  setOffer: (offer: RTCSessionDescription) => void;
  createAnswer: () => Promise<RTCSessionDescription | null>;
  setAnswer: (answer: RTCSessionDescription) => void;
  addIceCandidate: (candidate: RTCIceCandidateInit) => void;
  disconnect: () => void;
}

export interface SocketEvents {
  'create-room': Record<string, never>;
  'join-room': string;
  'offer': { offer: RTCSessionDescription };
  'answer': { answer: RTCSessionDescription };
  'ice-candidate': { candidate: RTCIceCandidate };
  'peer-connected': void;
}

export type SocketEventName = keyof SocketEvents;
