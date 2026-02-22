import Link from 'next/link';

const features = [
  {
    index: '01',
    title: 'Privacy First',
    desc: 'Messages never touch our servers. WebRTC ensures true device-to-device transfer.',
  },
  {
    index: '02',
    title: 'Zero Latency',
    desc: 'Direct connection, no round-trips through a data center. Near-instant delivery.',
  },
  {
    index: '03',
    title: 'Zero Setup',
    desc: 'No accounts, no installs. Create a room, share the code, start transferring.',
  },
];

export default function Home() {
  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-ink bg-dot-grid">
      {/* Radial vignette to fade dot grid edges */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 15%, #0C0B0A 75%)',
        }}
      />

      <nav className="relative z-10 flex items-center justify-between border-b border-stroke px-8 py-5">
        <span className="font-heading italic text-xl text-parchment tracking-wide">
          AirText
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-subtle">
          WebRTC &nbsp;·&nbsp; P2P &nbsp;·&nbsp; Secure
        </span>
      </nav>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-20 pt-16 text-center">
        <p
          className="animate-fade-in-up mb-4 font-mono text-[11px] uppercase tracking-[0.35em] text-subtle"
        >
          No accounts &nbsp;/&nbsp; No servers &nbsp;/&nbsp; No storage
        </p>

        <h1
          className="animate-fade-in-up font-heading italic text-parchment mb-8 select-none"
          style={{
            fontSize: 'clamp(76px, 15vw, 164px)',
            lineHeight: 0.88,
            animationDelay: '60ms',
          }}
        >
          AirText
        </h1>

        <p
          className="animate-fade-in-up mb-12 max-w-sm font-sans text-base leading-relaxed text-muted"
          style={{ animationDelay: '130ms' }}
        >
          The fastest way to move text between your devices.{' '}
          <span className="font-medium text-parchment">
            Direct. Private. Instant.
          </span>
        </p>

        <div
          className="animate-fade-in-up flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-4"
          style={{ animationDelay: '200ms' }}
        >
          <Link
            href="/create"
            className="group flex items-center justify-center gap-3 bg-lime px-10 py-4 font-sans text-sm font-bold uppercase tracking-wider text-lime-dark transition-all hover:brightness-105 active:scale-[0.98]"
          >
            Create Room
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>

          <Link
            href="/join"
            className="group flex items-center justify-center gap-3 border border-stroke-2 px-10 py-4 font-sans text-sm font-bold uppercase tracking-wider text-parchment transition-all hover:border-parchment/40 hover:bg-surface active:scale-[0.98]"
          >
            Join Room
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>

        <div
          className="animate-fade-in-up mt-24 w-full max-w-2xl border border-stroke"
          style={{ animationDelay: '300ms' }}
        >
          <div className="flex flex-col divide-y divide-stroke sm:flex-row sm:divide-x sm:divide-y-0">
            {features.map((f) => (
              <div key={f.index} className="flex flex-1 flex-col gap-3 p-6 text-left">
                <span className="font-mono text-[10px] text-subtle">{f.index}</span>
                <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-parchment">
                  {f.title}
                </h3>
                <p className="font-sans text-xs leading-relaxed text-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-stroke px-8 py-5 text-center">
        <span className="font-mono text-[11px] text-subtle">
          &copy; {new Date().getFullYear()} AirText &nbsp;—&nbsp; Built with WebRTC
        </span>
      </footer>
    </div>
  );
}
