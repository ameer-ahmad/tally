# Tally

Personal metrics and habits PWA — React + Vite + Express + Prisma + Supabase Auth.

Track quantitative metrics (weight, sleep, calories, …) and scheduled daily habits, with month averages, totals, and charts.

## Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project with:
  - **Email** auth enabled (Authentication → Providers → Email)
  - **JWT Signing Keys** preferred (Auth verifies via JWKS; no legacy JWT secret needed)
  - Site URL for local: `http://localhost:5173` (Authentication → URL Configuration)

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
| `CLIENT_URL` | Local client origin, e.g. `http://localhost:5173` |
| `VITE_API_URL` | Local API, e.g. `http://localhost:3001` |
| `PORT` | API port (default `3001`) |

Auth access tokens are verified on the server with **JWKS**:

`{SUPABASE_URL}/auth/v1/.well-known/jwks.json`

3. Generate Prisma client (schema already migrated on Supabase for this project):

```bash
npm run db:generate --workspace=@tally/server
```

If you need to apply migrations from another machine:

```bash
npm run db:migrate --workspace=@tally/server
```

4. Build shared types:

```bash
npm run build --workspace=@tally/shared
```

5. Run the API and client (two terminals):

```bash
npm run dev:server
npm run dev:client
```

- Client: http://localhost:5173  
- API health: http://localhost:3001/health  

6. Create an account in the app, then optionally seed demo data:

```bash
set SEED_USER_ID=<uuid-from-supabase-auth-users>
set SEED_EMAIL=you@example.com
npm run db:seed --workspace=@tally/server
```

## Workspace layout

| Path | Role |
| --- | --- |
| `client/` | React + Vite PWA |
| `server/` | Express API + Prisma |
| `shared/` | Shared TypeScript types |
| `design-system/tally/` | UI design system notes |

## PWA

- Manifest name / short name: **Tally**
- Icons: `client/public/pwa-192x192.png`, `pwa-512x512.png`, `apple-touch-icon.png`
- Service worker caches the app shell; API calls still need network
- Offline banner when the browser reports offline

**Install check (Chrome):**

```bash
npm run build --workspace=@tally/client
npm run preview --workspace=@tally/client
```

Open the preview URL → install icon in the address bar, or DevTools → Application → Manifest / Service Workers.

## Deploy

1. **Database** — Point `DATABASE_URL` / `DIRECT_URL` at Supabase; run Prisma migrate against production if needed.
2. **API** — Host the Express server (Railway, Render, Fly, etc.). Set:
   - `DATABASE_URL`, `DIRECT_URL`
   - `SUPABASE_URL`
   - `CLIENT_URL` = your production frontend origin
   - `PORT` as required by the host
3. **Client** — Build with production env:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_URL` = public API URL  
   Deploy `client/dist` to a static host (Netlify, Vercel, Cloudflare Pages, etc.).
4. **Supabase Auth** — Authentication → URL Configuration:
   - Site URL = production frontend origin
   - Redirect URLs include that origin (and `http://localhost:5173` for local)
5. Confirm RLS stays enabled on app tables (API uses the Postgres role; anon PostgREST stays locked down without policies).

## Security notes

- App data is accessed through Express + JWT verification, not the Supabase anon key.
- Tables have RLS enabled with no permissive policies (anon/authenticated cannot read/write via PostgREST).
- Prefer JWT Signing Keys over the legacy JWT secret.
