# Space Missions Dashboard

An interactive dashboard that works with user-uploaded CSV files. This repo includes:

- **Web app (Next.js)** — Production-ready app with Google login, per-user datasets, and deployment on Vercel (see below).
- **Streamlit app (Python)** — Classic dashboard; run with `streamlit run app.py`.

---

## Vercel Setup (production login + Postgres)

Follow these steps so Google login works on Vercel (avoids “DATABASE_URL missing” after the OAuth callback).

**Quick fix if you see “DATABASE_URL is not set” after Google login:** Create a free DB at [Neon](https://neon.tech), copy the connection string, then in Vercel go to Project → Settings → Environment Variables, add **DATABASE_URL** with that URL (Production), save, and Redeploy. Run `npx prisma migrate deploy` locally with that same URL once.

1. **Create a Postgres database**
   - **Vercel Postgres:** In the [Vercel Dashboard](https://vercel.com/dashboard), go to **Storage** → **Create Database** → **Postgres**. Create the DB; Vercel will add env vars such as `POSTGRES_URL` or `POSTGRES_PRISMA_URL`. The app also reads **DATABASE_URL**, so copy the connection string into an env var named **DATABASE_URL** (or rely on the app’s fallback: it uses `DATABASE_URL` → `POSTGRES_PRISMA_URL` → `POSTGRES_URL`).
   - **Neon:** At [neon.tech](https://neon.tech), create a project and copy the connection string.

2. **Copy the connection string**  
   Use the URL from Vercel Postgres or Neon (e.g. `postgresql://user:password@host/db?sslmode=require`).

3. **Set environment variables in Vercel**  
   In your project: **Settings** → **Environment Variables**. Add these for **Production** (and **Preview** if you use preview deployments):

   | Name | Value |
   |------|--------|
   | `DATABASE_URL` | Your Postgres connection string (from step 1–2). |
   | `NEXTAUTH_URL` | `https://<your-project>.vercel.app` (or your custom domain). |
   | `NEXTAUTH_SECRET` | A long random string (e.g. `openssl rand -base64 32`). |
   | `GOOGLE_CLIENT_ID` | From Google Cloud Console → OAuth 2.0 Web client. |
   | `GOOGLE_CLIENT_SECRET` | From the same OAuth client. |

   The app resolves the DB URL from **DATABASE_URL**, **POSTGRES_PRISMA_URL**, or **POSTGRES_URL**, so if Vercel Postgres only injects one of the latter, the app will use it; setting **DATABASE_URL** explicitly is still recommended.

4. **Redeploy**  
   Trigger a new deployment (e.g. **Deployments** → **Redeploy**) so the new env vars are applied.

5. **Run migrations**  
   Apply the schema to your production database. **Safe option (recommended):** from your machine, run:
   ```bash
   DATABASE_URL="your-production-connection-string" npx prisma migrate deploy
   ```
   Use the same URL you set in Vercel (or the direct/non-pooling URL for Vercel Postgres if recommended). Do **not** run `prisma migrate dev` in production or in the Vercel build.

**Check:** After redeploy, open `https://<your-project>.vercel.app/api/health/db`. It should return `{ "ok": true }` if the database is configured and reachable. Then try signing in with Google.

---

## Web App (Next.js) — Local Development

### Prerequisites

- Node.js 18+
- PostgreSQL (local via Docker, or a hosted DB such as [Neon](https://neon.tech) or [Vercel Postgres](https://vercel.com/storage/postgres))

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables (required for login)

Create **`.env`** at the project root (same folder as `package.json`). Use `.env` so both **Next.js** and the **Prisma CLI** see your vars (Prisma only loads `.env`, not `.env.local`):

```bash
cp .env.example .env
```

Edit **`.env`** (no quotes around values, no spaces around `=`):

| Variable | Example / how to get |
|----------|----------------------|
| **DATABASE_URL** | See step 3 (Docker) or use Neon/Vercel Postgres URL |
| **NEXTAUTH_URL** | `http://localhost:3000` |
| **NEXTAUTH_SECRET** | `openssl rand -base64 32` |
| **GOOGLE_CLIENT_ID** | From Google Cloud Console → Credentials → OAuth 2.0 Client (Web) |
| **GOOGLE_CLIENT_SECRET** | Same OAuth client |

All of these are required so NextAuth can persist sessions (without `DATABASE_URL` you get a redirect loop after Google login).

### 3. Database

You need a Postgres database and a `DATABASE_URL`. Two options:

**Option A — Free hosted Postgres (no Docker or local install)**

1. Go to [Neon](https://neon.tech) and sign up (free).
2. Create a new project and copy the **connection string** (looks like `postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`).
3. Put it in **`.env`** and **`.env.local`** as:
   ```env
   DATABASE_URL=postgresql://...your-neon-connection-string...
   ```
4. Then run step 4 (migrate) below.

**Option B — Local Postgres with Docker**

If you have Docker installed:

```bash
docker compose up -d
```

Check it’s running: `docker compose ps` (postgres should be “Up”). Then set in **`.env`** and **`.env.local`**:

```env
DATABASE_URL=postgresql://spacemission:spacemission@localhost:5432/spacemission?schema=public
```

**If you don’t have Docker:** use Option A (Neon) above. If you get “Authentication failed” (P1000), the Postgres at localhost isn’t using user `spacemission` — use Option A or start this project’s Postgres with `docker compose up -d`.

### 4. Generate Prisma client and run migrations (local only)

```bash
npx prisma generate
npm run prisma:migrate -- --name init
```

The script loads both `.env` and `.env.local`, so `DATABASE_URL` in `.env.local` is used. This creates the database schema (User, Account, Session, Dataset, etc.) locally.

**Production (Vercel):** Do **not** run `prisma migrate dev` on Vercel. The build only runs `prisma generate` (via `postinstall` and the `build` script). Run migrations against your production database from your machine or a CI step:

```bash
DATABASE_URL="your-production-database-url" npx prisma migrate deploy
```

For Vercel Postgres, use the **direct** (non-pooling) connection URL for `migrate deploy` if recommended by Vercel. No seed or migrate step is required for the Vercel build to succeed.

**If you get “Environment variable not found: DATABASE_URL”:** Use **`npm run prisma:migrate`** so the script can copy from `.env.local` into `.env`, or put `DATABASE_URL` in `.env`.

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in with Google, then upload a CSV from the dashboard.

**Important:** After changing any env vars, restart the dev server (Ctrl+C, then `npm run dev` again).

### 6. Verification (after login)

- **`.env`** exists and **DATABASE_URL** is set.
- Dev server was restarted after editing env.
- After signing in with Google, you are redirected to **/dashboard** (not back to /login).
- Visit [http://localhost:3000/api/auth/session](http://localhost:3000/api/auth/session): when logged in, the response includes your `user` object.
- In the database, tables **User**, **Account**, **Session** exist (e.g. `psql $DATABASE_URL -c "\dt"` or use a DB GUI).

---

## Web App — Deploy to Vercel (step-by-step)

### 1. Create a PostgreSQL database

- **Option A — Vercel Postgres:** In the [Vercel Dashboard](https://vercel.com/dashboard), go to **Storage** → **Create Database** → **Postgres**. Create the DB and note the **DATABASE_URL** (and optionally **POSTGRES_URL_NON_POOLING** for migrations).
- **Option B — Neon:** At [neon.tech](https://neon.tech), create a project and copy the connection string.

### 2. Create Google OAuth credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**.
2. **Create Credentials** → **OAuth client ID**.
3. Application type: **Web application**.
4. **Authorized JavaScript origins:**
   - Local: `http://localhost:3000`
   - Production: `https://YOUR_VERCEL_DOMAIN.vercel.app` (and your custom domain if you add one).
5. **Authorized redirect URIs:**
   - Local: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://YOUR_VERCEL_DOMAIN.vercel.app/api/auth/callback/google` (and custom domain callback if needed).
6. Create the client and copy **Client ID** and **Client secret**.

### 3. Push code and import project on Vercel

1. Push your repo to GitHub/GitLab/Bitbucket.
2. Go to [vercel.com](https://vercel.com) → **Add New** → **Project**.
3. Import the repository and confirm the framework is **Next.js** (auto-detected).
4. **Environment variables** — In the project, go to **Settings** → **Environment Variables** and add (for Production, Preview, Development as needed):

   | Name                  | Value |
   |-----------------------|--------|
   | `DATABASE_URL`        | Postgres connection string from Vercel Postgres or Neon (required for auth and data). |
   | `NEXTAUTH_URL`        | `https://<your-project>.vercel.app` or `https://${VERCEL_URL}` (must match the deployed URL). |
   | `NEXTAUTH_SECRET`     | `openssl rand -base64 32` (random string). |
   | `GOOGLE_CLIENT_ID`    | From Google OAuth Web client. |
   | `GOOGLE_CLIENT_SECRET`| From Google OAuth Web client. |

   The build does **not** use local-only env files; all of these must be set in Vercel. If **DATABASE_URL** is missing in production, auth routes return a friendly 503 (app does not crash).

5. **Build command:** leave default (`next build`) or use `prisma generate && next build`. `postinstall` already runs `prisma generate`.
6. Do **not** run `prisma migrate dev` in the build. Run migrations separately (see below).
7. Click **Deploy**.

### 4. Run production migrations

After the first deploy, apply the schema to your production database (from your machine or CI):

```bash
DATABASE_URL="your-production-database-url" npx prisma migrate deploy
```

If using **Vercel Postgres**, use the **direct** (non-pooling) URL for `migrate deploy` when recommended by Vercel.

### 5. Vercel verification checklist

- [ ] **Env vars in Vercel:** Settings → Environment Variables — `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` are set.
- [ ] **DATABASE_URL:** Points to your Vercel Postgres (or Neon) instance; run `npx prisma migrate deploy` with that URL so tables exist.
- [ ] **NEXTAUTH_URL:** Set to `https://<your-project>.vercel.app` (or your custom domain). You can use `https://${VERCEL_URL}` if you rely on Vercel’s automatic URL.
- [ ] **Google OAuth:** In Google Cloud Console, add the production redirect URI: `https://<your-project>.vercel.app/api/auth/callback/google` (and origin `https://<your-project>.vercel.app`).
- [ ] **Redeploy** after changing any env var so the new values are used.
- [ ] Visit `https://<your-project>.vercel.app`, sign in with Google, and confirm you reach the dashboard.

---

## Streamlit App — Setup and Run

```bash
pip install -r requirements.txt
streamlit run app.py
```

On first load, upload a CSV with the required columns. No sample data is loaded by default.

**Required CSV columns:** `Company`, `Location`, `Date`, `Time`, `Rocket`, `Mission`, `RocketStatus`, `Price`, `MissionStatus`  
**Date format:** `YYYY-MM-DD` (rows with invalid dates are dropped)

## Programmatically Graded Functions

All required functions live in **analytics.py** with exact signatures. Do not change names, casing, or signatures. They are:

- `getMissionCountByCompany(companyName: str) -> int`
- `getSuccessRate(companyName: str) -> float`
- `getMissionsByDateRange(startDate: str, endDate: str) -> list`
- `getTopCompaniesByMissionCount(n: int) -> list`
- `getMissionStatusCount() -> dict`
- `getMissionsByYear(year: int) -> int`
- `getMostUsedRocket() -> str`
- `getAverageMissionsPerYear(startYear: int, endYear: int) -> float`

## Running Tests

```bash
pytest tests/test_analytics.py -v
```

## Visualization Rationale

**A) Success rate over time by year (line chart)**  
Shows the trend and inflection points of mission success across decades. Helps identify periods of technological maturity vs. higher-risk exploration phases.

**B) Missions by company (bar chart)**  
Compares operator activity concentration. Highlights which agencies or companies have dominated launch cadence and where market share has shifted.

**C) Launches by location (bar chart)**  
Highlights geographic distribution of launch sites and major spaceports. Useful for understanding infrastructure concentration and regional space activity.

**D) Mission status distribution (pie chart)**  
Provides a quick overview of success vs. failure ratios and the proportion of partial or prelaunch failures in the dataset.

## Repository Structure

**Web app (Next.js)**  
- `src/app/` — App Router pages: `login`, `dashboard`, `api/auth`, `api/upload`, `api/datasets`, `api/rows`
- `src/components/` — LoginButton, DatasetList, UploadDialog, SummaryCards, Charts, DataTable, Providers
- `src/lib/` — `auth.ts` (NextAuth), `prisma.ts`, `csv.ts` (parse/validate)
- `prisma/schema.prisma` — User, Account, Session, Dataset, MissionRow, aggregates
- `package.json`, `next.config.js`, `tailwind.config.ts`

**Streamlit / Python**  
- `analytics.py` — Required functions (use `space_missions.csv` for tests), optional `set_active_df`/`get_active_df`
- `app.py` — Streamlit dashboard with CSV upload workflow
- `data_store.py` — Session state management for uploaded data
- `space_missions.csv` — Sample data (used by pytest for graded functions)
- `requirements.txt` — Dependencies
- `assets/logo.svg` — Dashboard logo
- `tests/test_analytics.py` — Pytest tests for analytics functions
