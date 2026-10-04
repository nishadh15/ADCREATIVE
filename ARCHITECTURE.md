# Blank Hanger AI Marketing Manager — Architecture

Vercel (Next.js) -> HTTPS -> Render (FastAPI) -> PostgreSQL / Claude API / Meta Graph API

## Data provenance (every record carries `source`)
REAL (Meta API) | DEMO (seed, always badged) | USER (CSV/manual upload) | AI (Claude-generated, with model + inputs)

## Approval rule
All publish / ad-spend / campaign-change / delete actions are written to `pending_actions`
(action, what_will_happen, cost, content, target, schedule, requires_approval=true).
Nothing executes until the user approves via a confirmation modal.

## Phases
1 Architecture (this) | 2 Auth + dashboard | 3 DB schema + Alembic | 4 Analytics (demo + CSV)
5 AI agent | 6 Calendar | 7 Trend Radar | 8 Reels | 9 Hashtags | 10 Ad Studio
11 Meta integration | 12 Learning | 13 Approval automation | 14 Testing
