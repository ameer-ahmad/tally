# Tally

Personal metrics and habits PWA — React + Vite + Express + Prisma + Supabase.

## Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project with **Email** auth enabled (Authentication → Providers)

## Setup

1. Install dependencies from the repo root:

```bash
npm install
```

2. Copy env files and fill in values from your Supabase project:

```bash
copy server\.env.example server\.env
copy client\.env.example client\.env
```

| Variable | Where to find it |
| --- | --- |
| `DATABASE_URL` | Supabase → Database → **Transaction** pooler (`…pooler.supabase.com:6543`). Prefer pooler on Windows — `db.*` hosts can be IPv6-only. |
| `DIRECT_URL` | Same page → **Session** pooler (`:5432`) or Direct connection (for Prisma migrations) |
| `SUPABASE_URL` / `VITE_SUPABASE_URL` | Project Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Project Settings → API → `anon` or publishable key |

Auth tokens are verified on the server with **JWKS** (`{SUPABASE_URL}/auth/v1/.well-known/jwks.json`). Prefer **JWT Signing Keys** in the dashboard; you do not need the legacy JWT secret.

3. Build shared types:

```bash
npm run build --workspace=@tally/shared
```

4. Run the API and client (two terminals):

```bash
npm run dev:server
npm run dev:client
```

- Client: http://localhost:5173
- API health: http://localhost:3001/health

## Workspace layout

| Path | Role |
| --- | --- |
| `client/` | React + Vite PWA |
| `server/` | Express API + Prisma |
| `shared/` | Shared TypeScript types |

Prisma schema lives in `server/prisma/schema.prisma`.

## PWA

The client is installable (`vite-plugin-pwa`):

- Manifest name / short name: **Tally**
- Icons: `public/pwa-192x192.png`, `public/pwa-512x512.png`, `apple-touch-icon.png`
- Service worker caches the app shell; API calls still need network
- Offline banner appears when the browser is offline

**Install check (Chrome):** run `npm run build --workspace=@tally/client` then `npm run preview --workspace=@tally/client`, open the preview URL over localhost, and look for the install icon in the address bar (Application → Manifest in DevTools).
