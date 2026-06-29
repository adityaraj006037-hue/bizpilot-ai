# BizPilot AI

> Autonomous B2B outreach automation. Three AI agents — **Scout**, **Craft**, and **Pulse** — discover leads, personalize cold emails, and schedule follow-ups without you babysitting a CRM.

[![Stack](https://img.shields.io/badge/React-Vite-4F46E5)](#) [![Stack](https://img.shields.io/badge/Tailwind-v4-0F172A)](#) [![Stack](https://img.shields.io/badge/Supabase-Postgres-10B981)](#) [![Stack](https://img.shields.io/badge/FastAPI-Python-4F46E5)](#) [![Stack](https://img.shields.io/badge/CrewAI-Agents-0F172A)](#)

---

## Table of Contents

- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
  - [Frontend → Vercel](#frontend--vercel)
  - [Backend → Railway](#backend--railway)
- [Troubleshooting](#troubleshooting)

---

## Architecture

```
┌──────────────────────────┐         ┌──────────────────────────┐
│   React + Vite frontend  │  HTTPS  │   FastAPI backend        │
│   (deployed on Vercel)   │ ──────► │   (deployed on Railway)  │
│   Tailwind v4 / Framer   │         │   CrewAI + LangGraph     │
└──────────┬───────────────┘         │   Groq LLaMA 3.1 8B      │
           │                         │   Serper.dev search      │
           │ Realtime                └──────────┬───────────────┘
           ▼                                    │
   ┌────────────────────┐                       │ REST
   │   Supabase         │ ◄─────────────────────┘
   │   Postgres + Auth  │
   │   + Realtime       │
   └────────────────────┘
```

| Layer        | Tech                                            |
| ------------ | ----------------------------------------------- |
| Frontend     | React 18, Vite 5, Tailwind v4, Framer Motion    |
| Backend      | FastAPI, CrewAI, LangGraph, Groq, Serper        |
| Database     | Supabase (Postgres + RLS + Realtime)            |
| Auth         | Supabase Auth with Google OAuth                 |
| Email forms  | Formspree                                       |
| Frontend host| Vercel                                          |
| Backend host | Railway                                         |

---

## Prerequisites

Make sure you have the following before you start:

| Tool         | Version | Notes                                                   |
| ------------ | ------- | ------------------------------------------------------- |
| **Node.js**  | 18+     | 20 LTS recommended. Use `nvm` if you have multiple.     |
| **npm**      | 9+      | Ships with Node. Yarn/pnpm also fine.                  |
| **Python**   | 3.11+   | Use `pyenv` or system Python 3.11/3.12.                 |
| **Supabase** | —       | Free tier is enough. Create a project at supabase.com.  |
| **Vercel**   | —       | Sign in with GitHub. Hobby plan is fine.                |
| **Railway**  | —       | Sign in with GitHub. $5/mo hobby plan recommended.      |
| **Groq**     | —       | Free API key at console.groq.com.                       |
| **Serper**   | —       | Free API key at serper.dev.                             |

---

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-org/bizpilot-ai.git
cd bizpilot-ai
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Configure frontend env vars

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in the four `VITE_` variables (see the [Environment Variables](#environment-variables) table for what each one does):

```bash
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
VITE_FORMSPREE_CONTACT_ID=xyzabcd
VITE_API_BASE_URL=http://localhost:8000
```

> `VITE_API_BASE_URL` should point to your local backend during development (default `http://localhost:8000`). In production this is empty because Vercel proxies `/api/*` to Railway via `vercel.json`.

### 4. Run the SQL migrations in Supabase

Open **Supabase Dashboard → SQL Editor** and run the migrations **in order**:

1. `supabase/migrations/001_initial.sql` — creates `leads`, `emails`, `followups`, `agent_logs` with RLS.
2. `supabase/migrations/002_user_settings.sql` — creates `user_settings` with RLS + auto-create trigger on signup.

Each file is idempotent — re-running is safe.

### 5. Enable Google OAuth in Supabase Auth

**Supabase Dashboard → Authentication → Providers → Google:**

1. Toggle **Google** on.
2. Create OAuth credentials at [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials).
3. Authorized redirect URI: `https://YOUR-PROJECT.supabase.co/auth/v1/callback`
4. Paste the Client ID and Secret back into Supabase and save.

### 6. Install backend dependencies

```bash
cd backend
pip install -r requirements.txt
```

Recommended: use a virtual environment.

```bash
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 7. Configure backend env vars

```bash
cp .env.example .env
```

Open `backend/.env` and fill in:

```bash
GROQ_API_KEY=gsk_...
SERPER_API_KEY=...
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...   # NEVER expose this to the frontend
ALLOWED_ORIGINS=http://localhost:5173
```

### 8. Start the backend

From the `backend/` directory:

```bash
uvicorn main:app --reload
```

You should see:

```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Application startup complete.
```

Health-check it:

```bash
curl http://localhost:8000/health
# → {"status":"ok","groq_configured":true,"serper_configured":true,"supabase_configured":true}
```

### 9. Start the frontend

From the project root:

```bash
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173). Sign in with Google, then go to **Settings → API Keys** to add your Groq and Serper keys before running your first pipeline.

---

## Environment Variables

### Frontend — `.env.local`

| Variable                     | Required | Description                                                                 | Example                                     |
| ---------------------------- | :------: | --------------------------------------------------------------------------- | ------------------------------------------- |
| `VITE_SUPABASE_URL`          |    ✅    | Your Supabase project URL.                                                  | `https://abcxyz.supabase.co`                |
| `VITE_SUPABASE_ANON_KEY`     |    ✅    | The **anon** (public) JWT. Safe in client code.                             | `eyJhbGciOi...`                             |
| `VITE_FORMSPREE_CONTACT_ID`  |    ✅    | Formspree form ID used for the marketing waitlist.                          | `xyzabcd`                                   |
| `VITE_API_BASE_URL`          |    ⚪    | Backend base URL. Leave empty in production (Vercel proxies via rewrite).   | `http://localhost:8000` (dev only)          |

### Backend — `backend/.env`

| Variable                      | Required | Description                                                                                                  | Example                                            |
| ----------------------------- | :------: | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| `GROQ_API_KEY`                |    ✅    | Server-side default Groq key. Users can override from Settings UI.                                           | `gsk_...`                                          |
| `SERPER_API_KEY`              |    ✅    | Server-side default Serper key. Users can override from Settings UI.                                         | `...`                                              |
| `SUPABASE_URL`                |    ✅    | Supabase project URL (same as frontend).                                                                     | `https://abcxyz.supabase.co`                       |
| `SUPABASE_SERVICE_ROLE_KEY`   |    ✅    | **Service role** key — bypasses RLS. Keep this server-side only.                                             | `eyJhbGciOi...`                                    |
| `ALLOWED_ORIGINS`             |    ✅    | Comma-separated list of CORS origins. Must include your Vercel URL in production.                            | `http://localhost:5173,https://app.vercel.app`    |
| `PORT`                        |    ⚪    | Optional. Defaults to `8000`. Railway sets this automatically.                                               | `8000`                                             |

### Vercel — Project Settings

| Variable        | Required | Description                                                                |
| --------------- | :------: | -------------------------------------------------------------------------- |
| `BACKEND_URL`   |    ✅    | The public Railway URL of your backend (no trailing slash).               |
| `VITE_SUPABASE_URL`        |    ✅    | Mirrored from `.env.local`. |
| `VITE_SUPABASE_ANON_KEY`   |    ✅    | Mirrored from `.env.local`. |
| `VITE_FORMSPREE_CONTACT_ID`|    ✅    | Mirrored from `.env.local`. |
| `VITE_API_BASE_URL`        |    ⚪    | Leave **empty** in production.             |

### Railway — Service Variables

| Variable                    | Required | Description                                              |
| --------------------------- | :------: | -------------------------------------------------------- |
| `GROQ_API_KEY`              |    ✅    | Same value as backend `.env`.                            |
| `SERPER_API_KEY`            |    ✅    | Same value as backend `.env`.                            |
| `SUPABASE_URL`              |    ✅    | Same value as backend `.env`.                            |
| `SUPABASE_SERVICE_ROLE_KEY` |    ✅    | Same value as backend `.env`.                            |
| `ALLOWED_ORIGINS`           |    ✅    | Your Vercel URL, e.g. `https://bizpilot.vercel.app`.     |
| `PORT`                      |    ⚪    | Railway sets this automatically — no need to override.    |

---

## Deployment

### Frontend → Vercel

1. Push the repo to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and **Import** the repository.
3. Vercel auto-detects **Vite**. Confirm:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
4. Add the environment variables from the [Vercel table](#vercel--project-settings). Most importantly, set `BACKEND_URL` to your Railway URL (no trailing slash).
5. Click **Deploy**. The first build takes ~1 minute.
6. After the first deploy, copy your Vercel URL (e.g. `https://bizpilot.vercel.app`) — you'll need it for the backend CORS config.

> The repo's `vercel.json` rewrites every `/api/*` request to `${BACKEND_URL}/api/$1`, so the frontend always calls relative paths like `/api/run` and `/api/test-keys`.

### Backend → Railway

1. Go to [railway.app/new](https://railway.app/new) and **Deploy from GitHub**.
2. Select the same repository.
3. In **Settings**:
   - **Root Directory**: `backend`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. In **Variables**, add the values from the [Railway table](#railway--service-variables).
5. Hit **Deploy**. Once it's healthy, copy the public URL (e.g. `https://bizpilot-api.up.railway.app`).
6. Go back to Vercel → Project Settings → Environment Variables and set `BACKEND_URL` to that Railway URL, then **redeploy**.

### Final wiring

After both are deployed:

1. In your Supabase dashboard, add your Vercel URL to **Authentication → URL Configuration → Site URL** and **Redirect URLs**.
2. In Railway, set `ALLOWED_ORIGINS` to your Vercel URL.
3. Redeploy both. Visit the app, sign in, drop your keys in Settings, and run the pipeline.

---

## Troubleshooting

### 🛑 Supabase RLS blocking inserts (`new row violates row-level security policy`)

This is the most common production issue. The `leads`, `emails`, `followups`, `agent_logs`, and `user_settings` tables all have `workspace_id` (or `user_id`) scoping.

**Fix:**

1. Make sure the Supabase client is writing with the authenticated user's session — the JWT must be passed on every request. If you see this error from a server-side script, you're using the `anon` key; switch to the `service_role` key **only on the backend**.
2. Verify the `workspace_id` is being set on every insert. It must equal the user's `auth.uid()`-derived workspace. Add a temporary `console.log(payload)` before the insert to confirm.
3. If you're running the migrations for the first time, double-check that **migration 001 ran before 002**. Migration 002 references the `set_updated_at()` function created in 001.
4. As a last-resort debug step, run `select * from pg_policies where tablename = 'leads';` in the SQL editor and confirm the policies exist.

### 🛑 CORS errors (`No 'Access-Control-Allow-Origin' header is present`)

The frontend can reach the backend, but the browser blocks the response.

**Fix:**

1. Open `backend/.env` (or your Railway variables) and set `ALLOWED_ORIGINS` to your **exact** Vercel URL, including the protocol and **no trailing slash**:

   ```bash
   ALLOWED_ORIGINS=https://bizpilot.vercel.app
   ```

2. For multiple origins (staging + production), comma-separate them:

   ```bash
   ALLOWED_ORIGINS=https://bizpilot.vercel.app,https://staging.bizpilot.app
   ```

3. Restart the backend (`uvicorn main:app --reload`) or trigger a Railway redeploy.

4. Hard-reload the frontend (Cmd/Ctrl + Shift + R) to clear cached preflight responses.

### 🛑 Groq rate limits (`429 Too Many Requests`)

The free Groq tier has strict per-minute and per-day quotas. Once you exceed them the `/api/run` endpoint will return an error after the Scout agent's retries are exhausted.

**Fix:**

1. **Add a retry delay.** The default LangGraph config already retries Scout up to 3 times. Increase the backoff in `backend/graph.py` — e.g. wrap the Groq call with `tenacity` and `wait_random_exponential(multiplier=2, max=60)`.
2. **Throttle pipeline runs.** Don't kick off more than one `/api/run` per minute on the free tier.
3. **Upgrade to a paid Groq plan** at [console.groq.com/settings/billing](https://console.groq.com/settings/billing). The Developer tier raises rate limits significantly and unlocks larger-context models.
4. As a quick unblock, rotate to a different Groq account key in **Settings → API Keys**.

---

## Project Structure

```
.
├── backend/
│   ├── main.py                  # FastAPI app + /api/run + /api/test-keys
│   ├── agents.py                # CrewAI Scout, Craft, Pulse agents
│   ├── graph.py                 # LangGraph state graph + retries
│   ├── requirements.txt
│   └── .env.example
├── src/
│   ├── App.jsx
│   ├── index.css                # CSS variable token system
│   ├── components/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── leads/
│   │   ├── layout/
│   │   ├── marketing/
│   │   └── ui/
│   ├── contexts/
│   │   └── AuthContext.jsx
│   ├── hooks/
│   │   ├── useLeads.js
│   │   └── useRunPipeline.js
│   ├── lib/
│   │   └── supabase.js
│   └── pages/
│       ├── Dashboard.jsx
│       ├── Landing.jsx
│       ├── Login.jsx
│       ├── NotFound.jsx
│       ├── Pipeline.jsx
│       ├── Run.jsx
│       ├── Settings.jsx
│       ├── Signup.jsx
│       └── auth/
├── supabase/
│   └── migrations/
│       ├── 001_initial.sql
│       └── 002_user_settings.sql
├── vercel.json
├── package.json
└── README.md
```

---

## License

MIT © BizPilot AI
