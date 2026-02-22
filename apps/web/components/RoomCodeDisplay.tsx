'use client';

import { useState } from 'react';
import { formatRoomCode, generateRoomUrl } from '../lib/room-code';

interface RoomCodeDisplayProps {
  roomCode: string;
  showUrl?: boolean;
  className?: string;
}

export function RoomCodeDisplay({
  roomCode,
  showUrl = true,
  className = '',
}: RoomCodeDisplayProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const formattedCode = formatRoomCode(roomCode);
  const appUrl =
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const roomUrl = generateRoomUrl(appUrl, roomCode);

  const copyToClipboard = async (text: string, type: 'code' | 'url') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'code') {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      } else {
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  return (
    <div className={`flex flex-col gap-5 ${className}`}>
      {/* Room code */}
      <div>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-subtle">
          Room Code
        </p>
        <div className="flex items-stretch gap-2">
          <code className="flex flex-1 items-center justify-center border border-stroke bg-surface-2 py-3 text-center font-mono text-xl font-bold tracking-[0.35em] text-lime">
            {formattedCode}
          </code>
          <button
            onClick={() => copyToClipboard(roomCode, 'code')}
            className={`shrink-0 border px-4 font-mono text-[10px] uppercase tracking-wider transition-all ${
              copiedCode
                ? 'border-jade/40 bg-jade/10 text-jade'
                : 'border-stroke bg-surface-2 text-muted hover:border-stroke-2 hover:text-parchment'
            }`}
            title={copiedCode ? 'Copied!' : 'Copy code'}
          >
            {copiedCode ? '✓' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Share URL */}
      {showUrl && (
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-subtle">
            Share Link
          </p>
          <button
            onClick={() => copyToClipboard(roomUrl, 'url')}
            className={`flex w-full items-center justify-between border px-3 py-2.5 transition-all ${
              copiedUrl
                ? 'border-jade/40 bg-jade/10 text-jade'
                : 'border-stroke bg-surface-2 text-muted hover:border-stroke-2 hover:text-parchment'
            }`}
            title={copiedUrl ? 'Copied!' : 'Copy URL'}
          >
            <span className="truncate pr-4 font-mono text-[11px]">{roomUrl}</span>
            <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider">
              {copiedUrl ? '✓ Copied' : 'Copy'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
