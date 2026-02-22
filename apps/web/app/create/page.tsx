'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreatePage() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');

  const handleCreate = () => {
    if (!roomCode || roomCode.length !== 6) {
      setError('Please enter a valid room code');
      return;
    }
    router.push(`/create/${roomCode}`);
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    setRoomCode(code);
    setError('');
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
              New Session
            </p>
            <h1 className="font-sans text-3xl font-bold text-parchment">
              Create a Room
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
                <div className="relative">
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
                    className="w-full border border-stroke-2 bg-surface-2 px-6 py-5 text-center font-mono text-4xl font-bold tracking-[0.4em] text-parchment placeholder-subtle outline-none transition-colors focus:border-lime"
                  />
                  {roomCode.length > 0 && (
                    <button
                      onClick={() => setRoomCode('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-subtle transition-colors hover:text-parchment"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {error && (
                <div className="border border-crimson/30 bg-crimson/10 px-4 py-3">
                  <span className="font-mono text-xs text-crimson">{error}</span>
                </div>
              )}

              <button
                onClick={generateCode}
                className="w-full border border-stroke-2 bg-surface-2 px-6 py-3 font-mono text-xs uppercase tracking-wider text-muted transition-all hover:bg-surface hover:text-parchment active:scale-[0.98]"
              >
                ↻ &nbsp;Generate Random Code
              </button>

              <button
                onClick={handleCreate}
                disabled={!roomCode || roomCode.length !== 6}
                className="w-full bg-lime px-6 py-4 font-sans text-sm font-bold uppercase tracking-wider text-lime-dark transition-all hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-30"
              >
                Create Room →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
