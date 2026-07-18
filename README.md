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

## Deploy (Vercel)

This repo deploys as **one Vercel project**: static Vite PWA + Express API serverless function.

### 1. Push to GitHub (recommended)

Connect the repo in [vercel.com/new](https://vercel.com/new), root directory = repo root (not `client/`).

Or from the project folder:

```bash
npx vercel
```

### 2. Environment variables (Vercel → Project → Settings → Environment Variables)

| Name | Value |
| --- | --- |
| `DATABASE_URL` | Supabase **Transaction** pooler URI |
| `DIRECT_URL` | Supabase **Session** / direct URI |
| `SUPABASE_URL` | `https://[ref].supabase.co` |
| `CLIENT_URL` | Your production URL, e.g. `https://tally-xxx.vercel.app` (update after first deploy) |
| `VITE_SUPABASE_URL` | Same as `SUPABASE_URL` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon / publishable key |
| `VITE_API_URL` | Leave **empty** (same-origin API on Vercel) |

`VITE_*` vars must be available at **build** time. After changing them, redeploy.

### 3. Supabase Auth URLs

Authentication → URL Configuration:

- **Site URL:** `https://your-app.vercel.app`
- **Redirect URLs:** include `https://your-app.vercel.app/**` and `http://localhost:5173/**`

### 4. Redeploy after setting `CLIENT_URL`

First deploy gives you the `.vercel.app` domain; set `CLIENT_URL` to that `https://…` URL and redeploy so CORS matches.

### Local vs production API

- Local: `npm run dev:server` + `npm run dev:client` (`VITE_API_URL=http://localhost:3001`)
- Vercel: API routes (`/health`, `/auth`, `/metrics`, `/habits`) rewrite to `api/index.ts`; the SPA is served from `client/dist`

## Security notes

- App data is accessed through Express + JWT verification, not the Supabase anon key.
- Tables have RLS enabled with no permissive policies (anon/authenticated cannot read/write via PostgREST).
- Prefer JWT Signing Keys over the legacy JWT secret.
