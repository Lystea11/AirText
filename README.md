# AirText

Peer-to-peer text and file transfer using WebRTC. Send messages and files directly between devices — no accounts, no server storage, no setup.

## Features

- **True P2P** — Data goes directly between devices via WebRTC DataChannels after the initial handshake
- **File transfer** — Send any file with chunked binary transfer and live progress bar
- **No server storage** — The signal server only brokers the WebRTC handshake; it never sees your data
- **Room codes** — Create or join sessions with 6-character codes or QR codes
- **Zero setup** — No accounts, no installs

## Architecture

```
apps/
  web/      # Next.js frontend (Vercel)
  signal/   # Express + Socket.IO signaling server (Railway / Render / Fly.io)
```

The signal server is only used to exchange WebRTC offer/answer SDP and ICE candidates. Once the peer connection is established all traffic is direct P2P — the signal server is no longer involved.

## Local Development

```bash
# Install all workspace dependencies
npm install

# Start both the frontend and signal server with hot-reload
npm run dev
```

| Service       | URL                    |
|---------------|------------------------|
| Frontend      | http://localhost:3000  |
| Signal server | http://localhost:3001  |

Copy the environment template and adjust as needed:

```bash
cp .env.example .env
# or for the web app only:
cp apps/web/.env.local.example apps/web/.env.local
```

### Environment Variables

| Variable                        | Where        | Description                              |
|---------------------------------|--------------|------------------------------------------|
| `NEXT_PUBLIC_SIGNAL_SERVER_URL` | `apps/web`   | URL of the signal server                 |
| `NEXT_PUBLIC_APP_URL`           | `apps/web`   | Public URL of the frontend               |
| `PORT`                          | `apps/signal`| Port the signal server listens on        |
| `FRONTEND_ORIGIN`               | `apps/signal`| Frontend origin for CORS                 |
| `ROOM_TTL`                      | `apps/signal`| Room expiry in ms (default 600000 = 10m) |

---

## Deployment

AirText has two independently deployable services.

### Frontend → Vercel

1. Push this repo to GitHub.
2. Import it in [vercel.com/new](https://vercel.com/new).
3. Vercel will auto-detect the `vercel.json` at the repo root and set `apps/web` as the root directory.
4. Add the environment variable:
   - `NEXT_PUBLIC_SIGNAL_SERVER_URL` → URL of your deployed signal server (step below)
5. Deploy.

> **Note:** Deploy the signal server first so you have its URL ready for the Vercel environment variable.

### Signal Server → Railway (recommended)

1. In [railway.app](https://railway.app), create a new project from this GitHub repo.
2. Set the **Root Directory** to `apps/signal`.
3. Set the **Start Command** to `npm run build && npm start`.
4. Add environment variables:
   - `PORT` → Railway sets this automatically; you can leave it unset
   - `FRONTEND_ORIGIN` → your Vercel frontend URL (e.g. `https://airtext.vercel.app`)
5. Deploy and copy the generated URL.

#### Alternative: Render

1. New Web Service → connect this repo.
2. Root Directory: `apps/signal`
3. Build Command: `npm install && npm run build`
4. Start Command: `npm start`
5. Set `FRONTEND_ORIGIN` to your Vercel URL.

#### Alternative: Fly.io

```bash
cd apps/signal
fly launch
fly secrets set FRONTEND_ORIGIN=https://your-app.vercel.app
fly deploy
```

---

## Scripts

| Command           | Description                          |
|-------------------|--------------------------------------|
| `npm run dev`     | Start both apps in development mode  |
| `npm run build`   | Build both apps                      |
| `npm run start`   | Start both built apps                |
| `npm run lint`    | Lint both apps                       |
| `npm run clean`   | Remove all build artifacts           |

## Security

- WebRTC requires HTTPS in production (Vercel and Railway both provide this automatically)
- Room codes are generated from a base32 charset (~1 billion combinations)
- All peer data is end-to-end — the signal server only handles SDP/ICE messages
