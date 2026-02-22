'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function JoinPage() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');

  const handleJoin = () => {
    if (!roomCode || roomCode.length !== 6) {
      setError('Please enter a valid 6-character room code');
      return;
    }
    router.push(`/join/${roomCode}`);
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-ink">
      <nav className="border-b border-stroke px-8 py-5">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:text-parchment"
        >
          <span className="transition-transform group-hover:-translate-x-0.5">←</span>
          Back
        </Link>
      </nav>

      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="mb-8">
            <p className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.3em] text-subtle">
              Join Session
            </p>
            <h1 className="font-sans text-3xl font-bold text-parchment">
              Enter Room Code
            </h1>
          </div>

          <div className="border border-stroke bg-surface p-8">
            <div className="flex flex-col gap-6">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label
                    htmlFor="room-code"
                    className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted"
                  >
                    Room Code
                  </label>
                  <span className="font-mono text-[10px] text-subtle">6 characters</span>
                </div>
                <input
                  id="room-code"
                  type="text"
                  value={roomCode}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                    setRoomCode(value.slice(0, 6));
                    setError('');
                  }}
                  placeholder="_ _ _ _ _ _"
                  maxLength={6}
                  autoFocus
                  className="w-full border border-stroke-2 bg-surface-2 px-6 py-5 text-center font-mono text-4xl font-bold tracking-[0.4em] text-parchment placeholder-subtle outline-none transition-colors focus:border-lime"
                />
              </div>

              {error && (
                <div className="border border-crimson/30 bg-crimson/10 px-4 py-3">
                  <span className="font-mono text-xs text-crimson">{error}</span>
                </div>
              )}

              <button
                onClick={handleJoin}
                disabled={!roomCode || roomCode.length !== 6}
                className="w-full bg-lime px-6 py-4 font-sans text-sm font-bold uppercase tracking-wider text-lime-dark transition-all hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-30"
              >
                Join Room →
              </button>

              <p className="text-center font-mono text-xs text-subtle">
                No room yet?{' '}
                <Link
                  href="/create"
                  className="text-parchment underline underline-offset-4 transition-colors hover:text-lime"
                >
                  Create one
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
