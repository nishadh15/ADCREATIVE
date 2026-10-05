import logging, time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .routes import auth, store, ai, instagram

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("blank-hanger")
app = FastAPI(title="Blank Hanger AI Marketing Manager")

origins = {settings.frontend_url.rstrip("/"), "http://localhost:3000"}
app.add_middleware(CORSMiddleware, allow_origins=[o for o in origins if o],
                   allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.middleware("http")
async def request_log(request: Request, call_next):
    t = time.time()
    resp = await call_next(request)
    log.info("%s %s %s %.0fms", request.method, request.url.path, resp.status_code, (time.time() - t) * 1000)
    return resp

for r in (auth.router, store.router, ai.router, instagram.router):
    app.include_router(r)

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.get("/api/integrations/status")
def integrations_status():
    return {
        "instagram": "connected" if settings.meta_configured else "not_configured",
        "claude": "configured" if settings.claude_configured else "not_configured",
        "data_mode": "real" if settings.meta_configured else "demo_or_upload",
    }
