'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSignaling } from '@/hooks/useSignaling';
import { useWebRTC } from '@/hooks/useWebRTC';
import { emitSocketEvent } from '@/lib/socket';
import { StatusIndicator } from '@/components/StatusIndicator';
import { MessageComposer } from '@/components/MessageComposer';
import { MessageReceiver } from '@/components/MessageReceiver';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
import { RoomCodeDisplay } from '@/components/RoomCodeDisplay';
import { generateRoomUrl, formatRoomCode } from '@/lib/room-code';
import type { ChatEntry } from '@/types/webrtc';

export default function CreateRoomPage({ params }: { params: Promise<{ roomCode: string }> }) {
  const { roomCode } = use(params);
  const router = useRouter();

  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [roomUrl, setRoomUrl] = useState('');

  const signaling = useSignaling({
    onPeerConnected: async () => {
      const offer = await webrtc.createOffer();
      if (offer) {
        emitSocketEvent('offer', { code: roomCode, offer });
      }
    },
  });

  const webrtc = useWebRTC({
    role: 'creator',
    roomCode,
    onMessageReceived: (message) => {
      // Upsert: update existing entry (e.g. file progress) or append new one
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.id === message.id);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = message;
          return updated;
        }
        return [...prev, message];
      });
    },
    onConnectionStateChange: (state) => {
      console.log('[CreateRoom] Connection state changed:', state);
    },
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setRoomUrl(generateRoomUrl(window.location.origin, roomCode));
    }
  }, [roomCode]);

  useEffect(() => {
    if (signaling.isConnected && roomCode) {
      signaling.enterRoom(roomCode);
    }
  }, [signaling.isConnected, roomCode]);

  const handleSendMessage = (text: string) => {
    webrtc.sendMessage(text);
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), type: 'text', text, timestamp: new Date(), fromSelf: true },
    ]);
  };

  const handleSendFile = (file: File) => {
    webrtc.sendFile(file);
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-ink font-sans text-parchment">
      {/* Header */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-stroke bg-surface px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="border border-stroke bg-ink p-2 text-muted transition-colors hover:text-parchment"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </Link>
          <div className="border-l border-stroke pl-3">
            <p className="font-mono text-[9px] uppercase tracking-widest text-subtle">
              AirText
            </p>
            <p className="font-mono text-xs font-bold uppercase tracking-widest text-parchment">
              {formatRoomCode(roomCode)}
            </p>
          </div>
        </div>

        <StatusIndicator state={webrtc.connectionState} />
      </header>

      <main className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        {/* Sidebar */}
        <aside className="hidden w-72 flex-col border-r border-stroke bg-surface p-6 lg:flex">
          <p className="mb-5 font-mono text-[10px] uppercase tracking-widest text-subtle">
            Share Room
          </p>

          <div className="mb-6">
            <QRCodeDisplay value={roomUrl} size={176} />
          </div>

          <RoomCodeDisplay roomCode={roomCode} showUrl={true} />

          <div className="mt-auto border border-stroke/40 bg-surface-2 p-4">
            <p className="font-mono text-[11px] leading-relaxed text-subtle">
              Messages are encrypted peer-to-peer. Nothing passes through our servers.
            </p>
          </div>
        </aside>

        {/* Chat Area */}
        <section className="relative flex flex-1 flex-col bg-ink">
          {/* Waiting overlay */}
          {webrtc.connectionState !== 'connected' && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-ink/60 p-8 text-center backdrop-blur-sm">
              <div className="flex w-full max-w-sm flex-col items-center gap-6 border border-stroke bg-surface/90 p-8 backdrop-blur-md">
                <p className="animate-subtle-pulse font-mono text-[11px] uppercase tracking-[0.35em] text-muted">
                  ◆ &nbsp;Awaiting Peer
                </p>

                <p className="max-w-xs font-sans text-sm leading-relaxed text-subtle">
                  Share the room code with another device to begin a secure P2P session.
                </p>

                {/* Mobile: show QR + code (sidebar is hidden on mobile) */}
                <div className="flex w-full flex-col gap-5 lg:hidden">
                  <QRCodeDisplay value={roomUrl} size={160} />
                  <RoomCodeDisplay roomCode={roomCode} showUrl={false} />
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-hidden px-4 py-5 sm:px-6">
            <MessageReceiver messages={messages} />
          </div>

          <div className="border-t border-stroke bg-surface p-4 sm:p-5">
            <MessageComposer
              onSendMessage={handleSendMessage}
              onSendFile={handleSendFile}
              disabled={webrtc.connectionState !== 'connected'}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
