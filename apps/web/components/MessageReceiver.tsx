'use client';

import type { ChatEntry, FileMessage } from '../types/webrtc';
import { useEffect, useRef, useState } from 'react';

interface MessageReceiverProps {
  messages: ChatEntry[];
  className?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileRow({ message }: { message: FileMessage }) {
  const progress = message.totalChunks > 0
    ? message.chunksReceived / message.totalChunks
    : 0;
  const isComplete = !!message.fileUrl;
  const isFromSelf = message.fromSelf;

  return (
    <div className="flex flex-col gap-2">
      {/* File card */}
      <div
        className={`flex items-center gap-3 border p-3 ${
          isFromSelf ? 'border-lime/30 bg-lime/5' : 'border-stroke bg-surface-2'
        }`}
      >
        {/* File icon */}
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center border ${
            isFromSelf ? 'border-lime/40 text-lime' : 'border-stroke-2 text-muted'
          }`}
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.75}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>

        {/* File info */}
        <div className="min-w-0 flex-1">
          <p className="truncate font-mono text-xs font-medium text-parchment">
            {message.fileName}
          </p>
          <p className="font-mono text-[10px] text-muted">
            {formatFileSize(message.fileSize)}
          </p>
        </div>

        {/* Action: download or progress % */}
        {isComplete ? (
          <a
            href={message.fileUrl}
            download={message.fileName}
            className="shrink-0 border border-lime px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-lime transition-all hover:bg-lime hover:text-lime-dark"
            onClick={(e) => e.stopPropagation()}
          >
            Download
          </a>
        ) : (
          <span className="shrink-0 font-mono text-[10px] text-muted">
            {Math.round(progress * 100)}%
          </span>
        )}
      </div>

      {/* Progress bar for incoming transfers */}
      {!isComplete && !message.fromSelf && (
        <div className="h-px w-full bg-stroke">
          <div
            className="h-full bg-lime transition-all duration-300"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function MessageReceiver({ messages, className = '' }: MessageReceiverProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  return (
    <div className={`flex h-full flex-col overflow-hidden ${className}`}>
      <div
        ref={scrollRef}
        className="flex h-full flex-col overflow-y-auto scroll-smooth"
      >
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center opacity-40">
            <div className="border border-stroke px-8 py-6 text-center">
              <p className="font-mono text-xs uppercase tracking-widest text-muted">
                No messages yet
              </p>
              <p className="mt-1 font-mono text-[10px] text-subtle">
                Connection established — start typing
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-stroke border-b border-stroke">
            {messages.map((entry) => (
              <div
                key={entry.id}
                className={`group flex flex-col gap-2.5 px-4 py-4 sm:px-6 ${
                  entry.fromSelf
                    ? 'border-l-2 border-l-lime bg-lime/[0.03]'
                    : 'border-l-2 border-l-stroke-2'
                }`}
              >
                {/* Row header */}
                <div className="flex items-center justify-between gap-4">
                  <span
                    className={`font-mono text-[10px] uppercase tracking-widest ${
                      entry.fromSelf ? 'text-lime' : 'text-muted'
                    }`}
                  >
                    {entry.fromSelf ? 'You' : 'Peer'}
                  </span>

                  <div className="flex items-center gap-3">
                    {entry.type === 'text' && (
                      <button
                        onClick={() => copyToClipboard(entry.text, entry.id)}
                        className="font-mono text-[10px] uppercase tracking-wider text-subtle opacity-0 transition-all hover:text-parchment group-hover:opacity-100"
                      >
                        {copiedId === entry.id ? '✓ Copied' : 'Copy'}
                      </button>
                    )}
                    <span className="font-mono text-[10px] text-subtle">
                      {formatTime(entry.timestamp)}
                    </span>
                  </div>
                </div>

                {/* Body */}
                {entry.type === 'text' ? (
                  <p className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-parchment">
                    {entry.text}
                  </p>
                ) : (
                  <FileRow message={entry} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
