# Deployment

## 1. Overwrite files
Copy `backend/` and `frontend/` over your repo, commit, push. Vercel and Render redeploy automatically.
The backend runs `alembic upgrade head` on start (adds the new `kv_store` table).

## 2. Render backend env vars
DATABASE_URL, JWT_SECRET (long random), ADMIN_EMAIL, ADMIN_PASSWORD, FRONTEND_URL (exact Vercel URL, no trailing slash),
CLAUDE_API_KEY, CLAUDE_MODEL (optional, default claude-sonnet-5-5),
META_ACCESS_TOKEN + META_IG_USER_ID (Instagram Business/Creator account id; token needs instagram_basic, instagram_manage_insights, pages_show_list), META_APP_ID, META_APP_SECRET.

## 3. Vercel
NEXT_PUBLIC_API_URL = your Render URL (https, no trailing slash).

## Troubleshooting
- CORS error: FRONTEND_URL must exactly match the Vercel origin.
- 401: token expired (12h) or JWT_SECRET changed: sign in again.
- 503 "CLAUDE_API_KEY is not set": add the key on Render and redeploy.
- Meta errors: token expired/missing permissions; Instagram account must be Business/Creator linked to a Facebook Page.
- First request slow: Render free tier cold start (~30–60s).
- DB errors: use the Render *internal* connection string if the DB is in the same region.
