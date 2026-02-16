# Google OAuth `invalid_client` (401) — Fix Plan & Checklist

## 1) Top root causes for `invalid_client` in this setup

| Cause | What to check |
|-------|----------------|
| **Wrong Google project** | Client ID and Client secret must be from the **same** OAuth 2.0 Client ID in the same GCP project. |
| **Wrong OAuth client type** | Must be **"Web application"**. Not Desktop, Android, iOS, or Chrome. |
| **Wrong GCP Credentials** | In Credentials, use the **Web application** client. Not Firebase or other client types. |
| **Client deleted / rotated / disabled** | Env has an old value; create a new Web client and copy fresh ID + secret. |
| **Typo, whitespace, quotes in .env** | No quotes around values, no spaces around `=`, no trailing spaces. One value per line. |
| **Multiple .env files** | Next.js loads `.env` then `.env.local` (local wins). Ensure you edit the file the app actually loads. |
| **Firebase client ID** | Must be from **APIs & Services → Credentials → OAuth 2.0 Client ID**, not Firebase config. |
| **OAuth consent screen / Test users** | Less common for 401, but if app is in Testing, add your Google account as a test user. |

---

## 2) Exact Google Cloud Console steps

1. Open: **[Google Cloud Console](https://console.cloud.google.com/)**
2. Select (or create) the **correct project** (top bar).
3. **APIs & Services** → **Credentials**.
4. Under **OAuth 2.0 Client IDs**:
   - If you see only "Desktop app" or "Web client (auto created by Google Service)" or anything that is **not** "Web application", **create a new one**:
     - Click **+ CREATE CREDENTIALS** → **OAuth client ID**.
     - Application type: **Web application**.
     - Name: e.g. `NextAuth local` or `Space Missions Web`.
     - Under **Authorized redirect URIs** click **+ ADD URI** and add exactly:
       ```
       http://localhost:3000/api/auth/callback/google
       ```
     - Under **Authorized JavaScript origins** click **+ ADD URI** and add exactly:
       ```
       http://localhost:3000
       ```
     - No trailing slashes, no query strings.
     - Click **Create**.
   - Open that **Web application** client and copy **Client ID** and **Client secret** (click copy icons; do not retype).
5. **APIs & Services** → **OAuth consent screen**:
   - Ensure the consent screen is configured (User type: External is fine).
   - If **Publishing status** is **Testing**, go to **Test users** and **+ ADD USERS** and add the Gmail you use to sign in.
6. You do **not** need "Google People API" or extra scopes for basic sign-in; default OpenID scopes are fine.

---

## 3) Authorized redirect URIs (local)

In the **Web application** OAuth client:

- **Authorized redirect URIs:**  
  `http://localhost:3000/api/auth/callback/google`

- **Authorized JavaScript origins:**  
  `http://localhost:3000`

No trailing slashes, no query strings, exact spelling.

---

## 4) Local environment variables

Use **`.env.local`** for local secrets (it overrides `.env` and is usually gitignored).

**Exact format — no quotes, no spaces around `=`:**

```env
GOOGLE_CLIENT_ID=123456789-xxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=some-long-random-string
```

- Replace with the **exact** Client ID and Client secret from the Web application client (paste, don’t type).
- `NEXTAUTH_URL`: exactly `http://localhost:3000` (no trailing slash).
- `NEXTAUTH_SECRET`: e.g. output of `openssl rand -base64 32`.

**After changing env vars:** stop the Next.js dev server (Ctrl+C) and run `npm run dev` again so env is reloaded.

---

## 5) Code verification

Your NextAuth config is correct:

- **File:** `src/lib/auth.ts`
- **Env names:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (no mismatch like `GOOGLE_ID` / `GOOGLE_SECRET`).
- **Provider:** `GoogleProvider` with id `"google"` (default).
- **Usage:** `process.env.GOOGLE_CLIENT_ID` and `process.env.GOOGLE_CLIENT_SECRET`.

No code change required for env variable names.

---

## 6) Diagnostic endpoint

A temporary route is available in development:

- **URL:** `http://localhost:3000/api/debug/oauth`
- **Returns (no full secrets):**
  - Whether `GOOGLE_CLIENT_ID` is set and its **last 6 characters**
  - Whether `GOOGLE_CLIENT_SECRET` is set (boolean only)
  - `NEXTAUTH_URL` value
  - Whether Client ID ends with `.apps.googleusercontent.com` (sanity check for Web client)

Open that URL in the browser after starting the dev server. If the suffix check fails or values look wrong, fix `.env.local` and restart the server.

---

## 7) What to check in DevTools

1. Click **Continue with Google** and let the redirect happen.
2. In DevTools **Network** tab, find the request to `accounts.google.com` (or the redirect to it).
3. Inspect the **authorization URL** (e.g. from the Location header or the link that goes to Google):
   - **`client_id`** in the URL must match the Client ID in GCP (same project, Web application client).
   - **`redirect_uri`** must be exactly `http://localhost:3000/api/auth/callback/google`.

If either differs from what’s in the Google Console, fix env (and NEXTAUTH_URL) or the OAuth client settings.

---

## 8) Most likely fix given your logs

NextAuth is building the URL correctly; Google returns `invalid_client` as soon as it sees the request. So:

- The **client_id** is not a valid **Web application** OAuth client (wrong type or wrong project), or  
- The client was **deleted/rotated** and `.env.local` has an old ID/secret, or  
- **Client ID and secret are from two different OAuth clients.**

---

## Do this first (short action list)

1. **Create a new Web application OAuth client** in the correct GCP project:  
   **APIs & Services → Credentials → Create Credentials → OAuth client ID → Web application.**

2. Set **Authorized redirect URI:**  
   `http://localhost:3000/api/auth/callback/google`  
   and **Authorized JavaScript origin:**  
   `http://localhost:3000`.

3. Copy the new **Client ID** and **Client secret** and put them in **`.env.local`** as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (no quotes, no extra spaces). Set `NEXTAUTH_URL=http://localhost:3000` and a long random `NEXTAUTH_SECRET`.

4. **Restart the Next.js dev server** (Ctrl+C, then `npm run dev`).

5. **Verify:** open `http://localhost:3000/api/debug/oauth` and confirm the suffix check passes and values look correct.

6. **Retry** “Continue with Google” and, if it still fails, compare `client_id` and `redirect_uri` in DevTools with the Google Console and this checklist.
