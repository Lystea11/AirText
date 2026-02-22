'use client';

import type { ConnectionState } from '../types/webrtc';

interface StatusIndicatorProps {
  state: ConnectionState;
  className?: string;
}

const stateConfig: Record<
  ConnectionState,
  { dot: string; text: string; textClass: string }
> = {
  idle: {
    dot: 'bg-muted',
    text: 'Ready',
    textClass: 'text-muted',
  },
  connecting: {
    dot: 'bg-amber-400 animate-subtle-pulse',
    text: 'Connecting',
    textClass: 'text-amber-400',
  },
  connected: {
    dot: 'bg-jade',
    text: 'Connected',
    textClass: 'text-jade',
  },
  disconnected: {
    dot: 'bg-crimson',
    text: 'Disconnected',
    textClass: 'text-crimson',
  },
  error: {
    dot: 'bg-crimson animate-subtle-pulse',
    text: 'Error',
    textClass: 'text-crimson',
  },
};

export function StatusIndicator({ state, className = '' }: StatusIndicatorProps) {
  const config = stateConfig[state];

  return (
    <div
      className={`flex items-center gap-2 border border-stroke bg-surface px-3 py-1.5 ${className}`}
    >
      <div className={`h-2 w-2 shrink-0 rounded-full ${config.dot}`} />
      <span
        className={`font-mono text-[10px] uppercase tracking-widest ${config.textClass}`}
      >
        {config.text}
      </span>
    </div>
  );
}
