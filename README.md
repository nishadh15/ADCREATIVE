# AdCreative: Blank Hanger AI Marketing Manager

One dashboard for organic Instagram growth, paid-ad performance and AI-generated marketing strategy, built for the Instagram brand **Blank Hanger**. It replaces the juggling of Meta Ads Manager, Instagram Insights, spreadsheets and separate AI tools.

> **Honest status:** the live Meta Graph integration and the AI tools work. Ad data is CSV-upload only, and the health score and AI brief currently read CSV/demo data rather than the live feed. See [Current limitations](#current-limitations).

## Features

| Area | What it does |
|---|---|
| **Live Instagram** | Followers, post count, daily reach, accounts engaged, profile views and recent posts, pulled from the Meta Graph API |
| **Marketing Health Score** | A rule-based score out of 100 across content, reach and ad performance, with `+` / `−` lines showing what is working |
| **AI Daily Brief** | Packages your metrics and asks the AI what is winning, where to move budget and what to do today |
| **Campaign Analytics** | Spend, CTR, CPC, CPM, CPA and ROAS per campaign, with rule-based Scale / Hold / Stop calls |
| **AI tools** | Trend Radar, Content Calendar, AI Content Studio, Reel Generator, Hashtag Lab, Ad Studio, Competitor Intelligence, Reports, and a chat-based Marketing Agent |
| **Safety** | Nothing publishes, spends money or changes a campaign without approval. Every number is badged `REAL`, `DEMO`, `USER DATA` or `AI INSIGHT`. |

## Architecture

```
┌────────────────────┐   HTTPS + JWT    ┌─────────────────────────┐
│ Next.js 14 (Vercel)│ ───────────────► │ FastAPI (Render)        │
│ Tailwind, TS       │                  │  /api/auth       login  │
│ token: bh_token    │ ◄─────────────── │  /api/instagram  Meta   │
└────────────────────┘                  │  /api/ai         Groq   │
                                        │  /api/store      state  │
                                        └──────┬──────────┬───────┘
                                               │          │
                                       MongoDB (pymongo)          Meta Graph API
                                                                  Groq API (key pool)
```

- **Backend** ([backend/](backend)): FastAPI, MongoDB (pymongo), JWT auth. It holds all secrets and makes the Meta and AI calls.
- **Frontend** ([frontend/](frontend)): Next.js 14 (App Router), React 18, Tailwind. The scoring and chart logic is in [frontend/lib/analytics.ts](frontend/lib/analytics.ts).
- **AI**: the Groq API (OpenAI-compatible) with up to **10 API keys**. Requests rotate across the keys. A key that hits a rate limit or errors is skipped for a while and the next key is used. See [claude_service.py](backend/app/services/claude_service.py). The prompts are in [backend/app/ai/modules.py](backend/app/ai/modules.py).

## Quick start (Docker)

Prerequisites: Docker and Docker Compose.

```bash
cp backend/.env.example backend/.env   # or create it from the table below
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8000 (health check at `/health`, docs at `/docs`)
- MongoDB runs in a container. Compose sets `MONGO_DB_URI` for you.

## Local development (without Docker)

**Backend** (Python 3.12):
```bash
cd backend
python -m venv .venv && source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                                   # fill in values
# needs a MongoDB: local (mongodb://localhost:27017 is the default) or Atlas via MONGO_DB_URI
uvicorn app.main:app --reload --port 8000
```

**Frontend** (Node 20):
```bash
cd frontend
npm install
echo NEXT_PUBLIC_API_URL=http://localhost:8000 > .env.local
npm run dev                                            # http://localhost:3000
```

## Environment variables

### Backend (Render, or `backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `MONGO_DB_URI` | Yes | MongoDB connection string (Atlas `mongodb+srv://...` or local). Defaults to `mongodb://localhost:27017`. |
| `MONGO_DB_NAME` | No | Database name, default `adcreative` |
| `JWT_SECRET` | Yes | Long random string used to sign login tokens |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Yes | The single admin login |
| `FRONTEND_URL` | Yes | Your frontend origin (for CORS), no trailing slash |
| `GROQ_API_KEYS` | Yes | Comma-separated Groq keys, up to 10. Alternatively `GROQ_API_KEY_1` … `GROQ_API_KEY_10`. |
| `GROQ_MODEL` | No | Default `llama-3.3-70b-versatile` |
| `GROQ_VISION_MODEL` | No | Default `meta-llama/llama-4-scout-17b-16e-instruct` |
| `META_ACCESS_TOKEN` | For Instagram | Long-lived Meta token with `instagram_basic`, `instagram_manage_insights`, `pages_show_list` |
| `META_IG_USER_ID` | For Instagram | Instagram Business/Creator account ID |
| `INSTAGRAM_ACCOUNT_ID` | For Instagram | Same ID again. The live routes read this name (see limitations). |

### Frontend (Vercel, or `frontend/.env.local`)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | Backend base URL, for example `https://your-api.onrender.com`. It is baked in at build time, so redeploy after changing it. |

Only `NEXT_PUBLIC_*` values reach the browser. Never put API keys, tokens or passwords in them.

## Deployment

| Part | Target | How |
|---|---|---|
| Backend | Render (Docker) | [render.yaml](render.yaml) defines the service. Set the variables above (the database is MongoDB, e.g. Atlas, hosted outside Render). |
| Frontend | Vercel | Import the repo, set the root directory to `frontend`, and add `NEXT_PUBLIC_API_URL`. |

More detail is in [DEPLOYMENT.md](DEPLOYMENT.md) and [ARCHITECTURE.md](ARCHITECTURE.md).

## CI/CD

GitHub Actions in [.github/workflows](.github/workflows):

- **CI** (`ci.yml`): on pull requests and pushes to `main`. Each side runs only when its folder changed. The backend job checks syntax, hits `/health` and builds the Docker image. The frontend job type-checks, runs `next build` and builds the Docker image.
- **CD** (`cd.yml`): after CI passes on `main`, it pushes the backend image to GitHub Container Registry. It deploys to Render and Vercel only if you add these repository secrets: `RENDER_DEPLOY_HOOK`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
- Dependabot opens weekly update pull requests.

## Project structure

```
.
├── backend/
│   ├── app/
│   │   ├── main.py            FastAPI app, CORS, /health
│   │   ├── config.py          Settings from environment
│   │   ├── routes/            auth, ai, instagram, store
│   │   ├── services/          Groq client (key rotation), Meta client
│   │   ├── ai/modules.py      Prompt for each AI tool
│   │   ├── database/mongo.py  MongoDB client
│   │   └── utils/ratelimit.py 20 AI requests/min per user
│   └── Dockerfile
├── frontend/
│   ├── app/                   Pages (login + 13 workspace pages)
│   ├── components/            Sidebar, Charts, Badge, InstagramDashboard…
│   ├── lib/                   api client, analytics and scoring, demo data
│   └── Dockerfile
├── docker-compose.yml
├── render.yaml
└── .github/                   CI/CD and Dependabot
```

## API overview

| Endpoint | Auth | Purpose |
|---|---|---|
| `POST /api/auth/login` | No | Returns a JWT |
| `GET /api/auth/me` | Yes | Current user |
| `POST /api/ai/run` | Yes | Run an AI module with your data context |
| `POST /api/ai/chat` | Yes | Marketing-agent chat |
| `GET/PUT /api/store/{key}` | Yes | Saved workspace data |
| `GET /api/instagram/overview`, `/insights`, `/posts` | **No** (see limitations) | Live Meta data |
| `GET /health` | No | Health check |

## Current limitations

These are known gaps, not planned behaviour:

1. **Live data is not in the score or brief.** The health score and AI brief use CSV/demo data. The live Instagram feed only drives the dashboard widget.
2. **No Meta Ads API.** Ad spend, revenue and ROAS come from an uploaded CSV with the columns `date,campaign,spend,impressions,clicks,conversions,revenue`.
3. **Variable name mismatch.** The live Instagram routes read `INSTAGRAM_ACCOUNT_ID`, while the rest of the app uses `META_IG_USER_ID`. Set both until this is unified.
4. **Instagram routes are unauthenticated.** Anyone with the backend URL can read your account data.
5. **No web search.** Groq has no web-search tool, so Trend Radar and Competitor Intelligence answer from the model's own knowledge and may be out of date.
6. **Approvals don't execute.** Approving an item records the decision but does not publish or spend.
7. **No automated tests yet.** CI only runs build and smoke checks.

## Security notes

- Keep every secret on the backend. Rotate anything that has ever been pasted into chat, email or a commit.
- `.env` files are git-ignored. On Atlas, restrict network access and use a least-privilege database user. Check `git status` before committing.
- AI output is advisory. Verify numbers and claims before acting on them.
